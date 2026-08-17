-- ============================================================================
-- Wapas — 0013_realtime_notifications_tracking.sql
-- Backs the Realtime Notifications & Live Tracking Sync stage.
--
-- Front-end work (this stage) subscribes to Supabase Realtime for:
--   * `notifications`  — `postgres_changes` INSERT filtered to the signed-in
--     user's `user_id`, so new notifications push live to the bell/page.
--   * `bookings`       — `postgres_changes` UPDATE on one booking row, so
--     `progress_pct` / `status` update the tracking page live.
--   * `tracking_events`— `postgres_changes` INSERT on one booking, so the
--     shipment timeline grows live.
--
-- No schema changes are needed: `notifications`, `bookings` and
-- `tracking_events` already exist (0001) and RLS covers reads/writes (0003).
-- The ONLY DB change required is that the existing `handle_booking_status_change`
-- trigger logs a `tracking_events` row for the `in-transit` transition too
-- (today only `delivered` logs one). It is extended via `create or replace`
-- — the established pattern from 0004/0012 — so the single AFTER-UPDATE
-- trigger keeps firing once. Nothing is duplicated or replaced.
-- ============================================================================

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

    elsif new.status = 'in-transit' then
      -- Live-tracking breadcrumb for the confirmed -> in-transit transition
      -- (previously only 'delivered' logged a tracking event). This row is
      -- what the tracking page's `tracking_events` realtime INSERT picks up.
      insert into public.tracking_events (booking_id, status_label, note)
      values (new.id, 'In transit', 'Driver picked up the load — trip started');
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

drop trigger if exists on_booking_status_change on public.bookings;
create trigger on_booking_status_change
  after update of status on public.bookings
  for each row execute function public.handle_booking_status_change();
