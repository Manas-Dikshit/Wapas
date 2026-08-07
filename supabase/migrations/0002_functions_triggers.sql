-- ============================================================================
-- Wapas — 0002_functions_triggers.sql
-- Helper functions and triggers: auto-provision a profile on signup, keep
-- truck/load status in sync with bookings, and auto-notify on status changes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Auto-create a profile row when a new Supabase Auth user signs up.
--    Reads role/full_name/company_name out of raw_user_meta_data, e.g. what
--    you'd pass as `options.data` to supabase.auth.signUp().
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, full_name, company_name, role, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'),
    new.raw_user_meta_data ->> 'company_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'shipper'),
    new.raw_user_meta_data ->> 'city'
  );
  return new;
end;
$$;

-- Uncomment once profiles.auth_user_id is linked to auth.users (see the note
-- at the top of 0001_init_schema.sql):
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Keep truck & load status in sync whenever a booking is created.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_booking()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.trucks set status = 'booked' where id = new.truck_id;
  update public.loads set status = 'booked' where id = new.load_id;

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

drop trigger if exists on_booking_created on public.bookings;
create trigger on_booking_created
  after insert on public.bookings
  for each row execute function public.handle_new_booking();

-- ----------------------------------------------------------------------------
-- 3. When a booking is marked delivered, free up the truck and notify both
--    parties + log a final tracking event.
-- ----------------------------------------------------------------------------
create or replace function public.handle_booking_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'delivered' then
      update public.trucks set status = 'available' where id = new.truck_id;
      update public.loads set status = 'delivered' where id = new.load_id;

      insert into public.tracking_events (booking_id, status_label, note)
      values (new.id, 'Delivered', 'Shipment marked delivered');
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

-- ----------------------------------------------------------------------------
-- 4. Simple backhaul match score: 0-100, higher is better. Rewards same-city
--    pickup, empty-leg trucks, and truck-type fit. Callable from the client
--    or from a view (see match score usage in 0004_views.sql).
-- ----------------------------------------------------------------------------
create or replace function public.backhaul_match_score(
  p_truck_current_city text,
  p_truck_type text,
  p_truck_empty_leg boolean,
  p_load_origin_city text,
  p_load_truck_type text
) returns integer
language sql
immutable
as $$
  select least(100, greatest(0,
    (case when p_truck_current_city = p_load_origin_city then 55 else 20 end) +
    (case when p_truck_type = p_load_truck_type then 30 else 5 end) +
    (case when p_truck_empty_leg then 15 else 0 end)
  ));
$$;
