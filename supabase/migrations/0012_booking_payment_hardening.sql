-- ============================================================================
-- Wapas — 0012_booking_payment_hardening.sql
-- Production hardening of the booking & wallet/escrow flow.
--
-- No payment gateway is integrated and no API key is required. This stage
-- builds a self-contained, DB-enforced wallet/escrow ledger on top of the
-- existing `transactions` table so a real gateway can be dropped in later
-- without touching the booking/transactions schema.
--
-- Model:
--   * BOOK    -> debit the shipper's wallet the full amount (method=Escrow)
--   * DELIVER -> credit the transporter (amount - 2% platform fee) + a
--                platform-fee ledger entry to the admin profile
--   * CANCEL  -> credit the shipper back (refund), revert truck/load status
--
-- Guards added here (all DB-enforced, never client-trusted):
--   * insufficient balance: BEFORE INSERT on transactions rejects any debit
--     that would take the user's balance below zero
--   * double-booking: partial unique index (one non-cancelled booking per
--     load) + a BEFORE INSERT on bookings that rejects non-available trucks
--     and already-booked loads with friendly messages
--
-- Migrations 0001-0011 are untouched. `handle_new_booking` and
-- `handle_booking_status_change` are extended via `create or replace` — the
-- established pattern from 0004 — so the existing triggers keep firing once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. wallet_balance(profile_id) — computes a user's available balance by
--    summing successful credits minus debits on the ledger. There is NO
--    stored balance column, so there is no sync bug to maintain.
-- ----------------------------------------------------------------------------
create or replace function public.wallet_balance(p_profile_id uuid)
returns numeric
language sql
stable
security definer set search_path = public
as $$
  select coalesce(sum(case when t.type = 'credit' then t.amount else -t.amount end), 0)
  from public.transactions t
  where t.user_id = p_profile_id and t.status = 'success';
$$;

-- Callable from the client via RPC (`.rpc('wallet_balance', { p_profile_id })`).
grant execute on function public.wallet_balance(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Insufficient-balance guard on the ledger. Fires BEFORE any transaction
--    insert; rejects a debit that would drive the user's balance negative.
--    Serializes on the user's profile row so two concurrent debits cannot
--    both pass the check and overspend.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_sufficient_balance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.type = 'debit' then
    perform 1 from public.profiles where id = new.user_id for update;
    if public.wallet_balance(new.user_id) < new.amount then
      raise exception 'insufficient_wallet_balance'
        using hint = 'Top up the wallet before booking.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_transaction_balance on public.transactions;
create trigger on_transaction_balance
  before insert on public.transactions
  for each row execute function public.enforce_sufficient_balance();

-- ----------------------------------------------------------------------------
-- 3. Double-booking guard on `bookings`. Friendly BEFORE INSERT check for the
--    common path (friendly message to the UI) + a partial unique index as the
--    race-proof backstop (a load can only ever have one non-cancelled booking).
-- ----------------------------------------------------------------------------
create or replace function public.enforce_booking_guards()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.trucks where id = new.truck_id and status = 'available') then
    raise exception 'truck_not_available'
      using hint = 'This truck is already booked or unavailable.';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.load_id = new.load_id and b.status <> 'cancelled'
  ) then
    raise exception 'already_booked'
      using hint = 'This load has already been booked.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_guards on public.bookings;
create trigger on_booking_guards
  before insert on public.bookings
  for each row execute function public.enforce_booking_guards();

create unique index if not exists bookings_one_active_per_load_idx
  on public.bookings (load_id)
  where status <> 'cancelled';

-- ----------------------------------------------------------------------------
-- 4. Extend handle_new_booking (existing AFTER INSERT trigger) to debit the
--    shipper's wallet into escrow on booking creation. The insufficient-
--    balance guard above runs on this debit, so an underfunded booking aborts
--    atomically (no partial state) and the error reaches the client.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_booking()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.trucks set status = 'booked' where id = new.truck_id;
  update public.loads set status = 'booked' where id = new.load_id;

  insert into public.transactions (user_id, booking_id, type, label, amount, method, status)
  values (new.shipper_id, new.id, 'debit', 'Escrow hold for booking', new.amount, 'Escrow', 'success');

  insert into public.notifications (user_id, title, description, type)
  values (
    new.transporter_id,
    'New booking confirmed',
    'A shipper has booked your truck for booking #' || substr(new.id::text, 1, 8),
    'booking'
  );

  insert into public.notifications (user_id, title, description, type)
  values (
    new.shipper_id,
    'Booking confirmed',
    'Your load has been matched and booked. Track it from My Trips.',
    'booking'
  );

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Extend handle_booking_status_change (existing AFTER UPDATE trigger) to
--    settle escrow:
--      * delivered -> credit transporter (amount - 2% fee) + platform-fee
--                     ledger entry to the admin profile
--      * cancelled -> refund the shipper + revert truck to available / load
--                     to open
--    Existing delivered behavior (free truck, mark load delivered, log a
--    tracking event, notify) is preserved.
-- ----------------------------------------------------------------------------
create or replace function public.handle_booking_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_fee      numeric := 0.02;  -- platform fee constant (2%)
  v_fee_amt  numeric;
  v_admin_id uuid;
begin
  if new.status is distinct from old.status then
    if new.status = 'delivered' then
      update public.trucks set status = 'available' where id = new.truck_id;
      update public.loads set status = 'delivered' where id = new.load_id;

      insert into public.tracking_events (booking_id, status_label, note)
      values (new.id, 'Delivered', 'Shipment marked delivered');

      v_fee_amt := round(new.amount * v_fee, 2);

      insert into public.transactions (user_id, booking_id, type, label, amount, method, status)
      values (new.transporter_id, new.id, 'credit', 'Payout for booking', new.amount - v_fee_amt, 'Escrow', 'success');

      -- Platform fee revenue ledger entry. Credited to the admin profile as
      -- the platform's account (the schema has no dedicated platform user).
      -- ponytail: fee revenue goes to the admin profile; introduce a real
      -- platform account if revenue needs separate reporting.
      select id into v_admin_id from public.profiles where role = 'admin' limit 1;
      if v_admin_id is not null then
        insert into public.transactions (user_id, booking_id, type, label, amount, method, status)
        values (v_admin_id, new.id, 'credit', 'Platform fee', v_fee_amt, 'Escrow', 'success');
      end if;

    elsif new.status = 'cancelled' then
      update public.trucks set status = 'available' where id = new.truck_id;
      update public.loads set status = 'open' where id = new.load_id;

      insert into public.transactions (user_id, booking_id, type, label, amount, method, status)
      values (new.shipper_id, new.id, 'credit', 'Booking refund', new.amount, 'Escrow', 'success');
    end if;

    insert into public.notifications (user_id, title, description, type)
    values (
      new.shipper_id,
      'Booking status updated',
      'Booking #' || substr(new.id::text, 1, 8) || ' is now ' || new.status,
      'booking'
    );
  end if;

  return new;
end;
$$;