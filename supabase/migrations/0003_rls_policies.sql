-- ============================================================================
-- Wapas — 0003_rls_policies.sql
-- Row Level Security for every table. This is the file to deploy/review when
-- someone asks "which RLS should I turn on in Supabase" — it enables RLS and
-- defines every policy referenced in docs/SUPABASE.md.
--
-- Assumes profiles.auth_user_id is populated for signed-in users (see the
-- note in 0001_init_schema.sql and the commented trigger in
-- 0002_functions_triggers.sql). Until you wire up real Supabase Auth, the
-- Wapas frontend runs entirely on mock data and never calls these tables, so
-- it's safe to deploy this file at any time.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read `profiles` regardless
-- of the caller's own row-level access, then RLS below decides what the
-- caller may do with that identity).
-- ----------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere. From this point on, every table denies all access
-- by default until a policy explicitly allows it.
-- ----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.trucks           enable row level security;
alter table public.loads            enable row level security;
alter table public.bookings         enable row level security;
alter table public.transactions     enable row level security;
alter table public.notifications    enable row level security;
alter table public.tracking_events  enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- Basic profile info (name, company, rating) is visible to any signed-in
-- user so marketplace listings can show "who posted this". Only the owner
-- (or an admin) can write to it.
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- trucks
-- Available trucks are public to the marketplace; a transporter always sees
-- (and manages) their own fleet regardless of status.
-- ----------------------------------------------------------------------------
drop policy if exists "trucks_select_available_or_own" on public.trucks;
create policy "trucks_select_available_or_own"
  on public.trucks for select
  to authenticated
  using (status = 'available' or transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "trucks_insert_own" on public.trucks;
create policy "trucks_insert_own"
  on public.trucks for insert
  to authenticated
  with check (transporter_id = public.current_profile_id());

drop policy if exists "trucks_update_own_or_admin" on public.trucks;
create policy "trucks_update_own_or_admin"
  on public.trucks for update
  to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin())
  with check (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "trucks_delete_own_or_admin" on public.trucks;
create policy "trucks_delete_own_or_admin"
  on public.trucks for delete
  to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());

-- ----------------------------------------------------------------------------
-- loads
-- Open loads are public to the marketplace; a shipper always sees (and
-- manages) their own loads regardless of status.
-- ----------------------------------------------------------------------------
drop policy if exists "loads_select_open_or_own" on public.loads;
create policy "loads_select_open_or_own"
  on public.loads for select
  to authenticated
  using (status = 'open' or shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "loads_insert_own" on public.loads;
create policy "loads_insert_own"
  on public.loads for insert
  to authenticated
  with check (shipper_id = public.current_profile_id());

drop policy if exists "loads_update_own_or_admin" on public.loads;
create policy "loads_update_own_or_admin"
  on public.loads for update
  to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin())
  with check (shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "loads_delete_own_or_admin" on public.loads;
create policy "loads_delete_own_or_admin"
  on public.loads for delete
  to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin());

-- ----------------------------------------------------------------------------
-- bookings
-- Only the two parties on the booking (or an admin) can see or touch it.
-- ----------------------------------------------------------------------------
drop policy if exists "bookings_select_parties_or_admin" on public.bookings;
create policy "bookings_select_parties_or_admin"
  on public.bookings for select
  to authenticated
  using (
    shipper_id = public.current_profile_id()
    or transporter_id = public.current_profile_id()
    or public.is_admin()
  );

drop policy if exists "bookings_insert_parties" on public.bookings;
create policy "bookings_insert_parties"
  on public.bookings for insert
  to authenticated
  with check (
    shipper_id = public.current_profile_id()
    or transporter_id = public.current_profile_id()
  );

drop policy if exists "bookings_update_parties_or_admin" on public.bookings;
create policy "bookings_update_parties_or_admin"
  on public.bookings for update
  to authenticated
  using (
    shipper_id = public.current_profile_id()
    or transporter_id = public.current_profile_id()
    or public.is_admin()
  )
  with check (
    shipper_id = public.current_profile_id()
    or transporter_id = public.current_profile_id()
    or public.is_admin()
  );

drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- transactions
-- A user only ever sees their own wallet ledger.
-- ----------------------------------------------------------------------------
drop policy if exists "transactions_select_own_or_admin" on public.transactions;
create policy "transactions_select_own_or_admin"
  on public.transactions for select
  to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transactions_insert_own_or_admin" on public.transactions;
create policy "transactions_insert_own_or_admin"
  on public.transactions for insert
  to authenticated
  with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transactions_update_admin" on public.transactions;
create policy "transactions_update_admin"
  on public.transactions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "transactions_delete_admin" on public.transactions;
create policy "transactions_delete_admin"
  on public.transactions for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- notifications
-- A user only ever sees and manages their own notifications.
-- ----------------------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notifications_insert_admin_or_system" on public.notifications;
create policy "notifications_insert_admin_or_system"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin());
  -- Note: rows inserted by the trigger functions in 0002 run as
  -- SECURITY DEFINER and bypass RLS entirely, which is how normal
  -- booking/payment notifications get created for regular users.

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = public.current_profile_id());

-- ----------------------------------------------------------------------------
-- tracking_events
-- Visible to the shipper/transporter on the parent booking; only the
-- transporter side (or admin) logs new events.
-- ----------------------------------------------------------------------------
drop policy if exists "tracking_select_booking_parties" on public.tracking_events;
create policy "tracking_select_booking_parties"
  on public.tracking_events for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = tracking_events.booking_id
        and (b.shipper_id = public.current_profile_id() or b.transporter_id = public.current_profile_id())
    )
  );

drop policy if exists "tracking_insert_transporter_or_admin" on public.tracking_events;
create policy "tracking_insert_transporter_or_admin"
  on public.tracking_events for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = tracking_events.booking_id
        and b.transporter_id = public.current_profile_id()
    )
  );

drop policy if exists "tracking_update_admin" on public.tracking_events;
create policy "tracking_update_admin"
  on public.tracking_events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tracking_delete_admin" on public.tracking_events;
create policy "tracking_delete_admin"
  on public.tracking_events for delete
  to authenticated
  using (public.is_admin());
