-- ============================================================================
-- Wapas — full schema (0001–0004), run once in Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP...CREATE throughout.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 0001: TABLES
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique,
  full_name       text not null,
  company_name    text,
  role            text not null check (role in ('shipper', 'transporter', 'admin')),
  city            text,
  avatar_url      text,
  rating          numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  verified        boolean not null default false,
  gst_number      text,
  kyc_status      text not null default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  created_at      timestamptz not null default now()
);

create table if not exists public.trucks (
  id                uuid primary key default gen_random_uuid(),
  transporter_id    uuid not null references public.profiles(id) on delete cascade,
  reg_number        text not null unique,
  type              text not null check (type in ('Open Body','Container','Trailer','Refrigerated','Tanker','Mini Truck')),
  capacity_tons     numeric(6,2) not null check (capacity_tons > 0),
  current_city      text not null,
  destination_city  text,
  available_from    date,
  price_per_ton     numeric(10,2) not null check (price_per_ton >= 0),
  empty_leg         boolean not null default false,
  status            text not null default 'available' check (status in ('available','booked','in-transit','maintenance')),
  created_at        timestamptz not null default now()
);
create index if not exists trucks_transporter_idx on public.trucks(transporter_id);
create index if not exists trucks_status_idx on public.trucks(status);
create index if not exists trucks_city_idx on public.trucks(current_city, destination_city);

create table if not exists public.loads (
  id                  uuid primary key default gen_random_uuid(),
  shipper_id          uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  category            text,
  weight_tons         numeric(6,2) not null check (weight_tons > 0),
  origin_city         text not null,
  destination_city    text not null,
  pickup_date         date not null,
  budget              numeric(10,2) not null check (budget >= 0),
  truck_type_needed   text check (truck_type_needed in ('Open Body','Container','Trailer','Refrigerated','Tanker','Mini Truck')),
  status              text not null default 'open' check (status in ('open','matched','booked','delivered')),
  distance_km         numeric(8,2),
  created_at          timestamptz not null default now()
);
create index if not exists loads_shipper_idx on public.loads(shipper_id);
create index if not exists loads_status_idx on public.loads(status);
create index if not exists loads_city_idx on public.loads(origin_city, destination_city);

create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  load_id           uuid not null references public.loads(id) on delete restrict,
  truck_id          uuid not null references public.trucks(id) on delete restrict,
  shipper_id        uuid not null references public.profiles(id) on delete cascade,
  transporter_id    uuid not null references public.profiles(id) on delete cascade,
  amount            numeric(10,2) not null check (amount >= 0),
  status            text not null default 'confirmed' check (status in ('confirmed','in-transit','delivered','cancelled')),
  progress_pct      smallint not null default 0 check (progress_pct between 0 and 100),
  driver_name       text,
  driver_phone      text,
  eta               text,
  created_at        timestamptz not null default now()
);
create index if not exists bookings_shipper_idx on public.bookings(shipper_id);
create index if not exists bookings_transporter_idx on public.bookings(transporter_id);
create index if not exists bookings_status_idx on public.bookings(status);

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  booking_id    uuid references public.bookings(id) on delete set null,
  type          text not null check (type in ('credit','debit')),
  label         text not null,
  amount        numeric(10,2) not null check (amount >= 0),
  method        text not null default 'Wallet' check (method in ('UPI','Card','Wallet','Escrow')),
  status        text not null default 'success' check (status in ('success','pending','failed')),
  created_at    timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  type          text not null default 'system' check (type in ('booking','payment','system','ai')),
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read);

create table if not exists public.tracking_events (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  status_label  text not null,
  lat           numeric(9,6),
  lng           numeric(9,6),
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists tracking_events_booking_idx on public.tracking_events(booking_id, created_at);

-- ---------------------------------------------------------------------------
-- 0002: FUNCTIONS & TRIGGERS (booking side-effects, match score)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_booking()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.trucks set status = 'booked' where id = new.truck_id;
  update public.loads set status = 'booked' where id = new.load_id;

  insert into public.notifications (user_id, title, description, type)
  values (new.transporter_id, 'New booking confirmed', 'A shipper has booked your truck for booking #' || substr(new.id::text, 1, 8), 'booking');

  insert into public.notifications (user_id, title, description, type)
  values (new.shipper_id, 'Booking confirmed', 'Your load has been matched and booked. Track it from My Trips.', 'booking');

  return new;
end;
$$;

drop trigger if exists on_booking_created on public.bookings;
create trigger on_booking_created
  after insert on public.bookings
  for each row execute function public.handle_new_booking();

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
    values (new.shipper_id, 'Booking status updated', 'Booking #' || substr(new.id::text, 1, 8) || ' is now ' || new.status, 'booking');
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_status_change on public.bookings;
create trigger on_booking_status_change
  after update of status on public.bookings
  for each row execute function public.handle_booking_status_change();

create or replace function public.backhaul_match_score(
  p_truck_current_city text, p_truck_type text, p_truck_empty_leg boolean,
  p_load_origin_city text, p_load_truck_type text
) returns integer
language sql immutable
as $$
  select least(100, greatest(0,
    (case when p_truck_current_city = p_load_origin_city then 55 else 20 end) +
    (case when p_truck_type = p_load_truck_type then 30 else 5 end) +
    (case when p_truck_empty_leg then 15 else 0 end)
  ));
$$;

-- ---------------------------------------------------------------------------
-- 0003: RLS — this is what protects the profile-save feature
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.profiles where auth_user_id = auth.uid(); $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role = 'admin'); $$;

alter table public.profiles         enable row level security;
alter table public.trucks           enable row level security;
alter table public.loads            enable row level security;
alter table public.bookings         enable row level security;
alter table public.transactions     enable row level security;
alter table public.notifications    enable row level security;
alter table public.tracking_events  enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete to authenticated using (public.is_admin());

drop policy if exists "trucks_select_available_or_own" on public.trucks;
create policy "trucks_select_available_or_own" on public.trucks for select to authenticated
  using (status = 'available' or transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "trucks_insert_own" on public.trucks;
create policy "trucks_insert_own" on public.trucks for insert to authenticated
  with check (transporter_id = public.current_profile_id());

drop policy if exists "trucks_update_own_or_admin" on public.trucks;
create policy "trucks_update_own_or_admin" on public.trucks for update to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin())
  with check (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "trucks_delete_own_or_admin" on public.trucks;
create policy "trucks_delete_own_or_admin" on public.trucks for delete to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "loads_select_open_or_own" on public.loads;
create policy "loads_select_open_or_own" on public.loads for select to authenticated
  using (status = 'open' or shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "loads_insert_own" on public.loads;
create policy "loads_insert_own" on public.loads for insert to authenticated
  with check (shipper_id = public.current_profile_id());

drop policy if exists "loads_update_own_or_admin" on public.loads;
create policy "loads_update_own_or_admin" on public.loads for update to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin())
  with check (shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "loads_delete_own_or_admin" on public.loads;
create policy "loads_delete_own_or_admin" on public.loads for delete to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "bookings_select_parties_or_admin" on public.bookings;
create policy "bookings_select_parties_or_admin" on public.bookings for select to authenticated
  using (shipper_id = public.current_profile_id() or transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "bookings_insert_parties" on public.bookings;
create policy "bookings_insert_parties" on public.bookings for insert to authenticated
  with check (shipper_id = public.current_profile_id() or transporter_id = public.current_profile_id());

drop policy if exists "bookings_update_parties_or_admin" on public.bookings;
create policy "bookings_update_parties_or_admin" on public.bookings for update to authenticated
  using (shipper_id = public.current_profile_id() or transporter_id = public.current_profile_id() or public.is_admin())
  with check (shipper_id = public.current_profile_id() or transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin" on public.bookings for delete to authenticated using (public.is_admin());

drop policy if exists "transactions_select_own_or_admin" on public.transactions;
create policy "transactions_select_own_or_admin" on public.transactions for select to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transactions_insert_own_or_admin" on public.transactions;
create policy "transactions_insert_own_or_admin" on public.transactions for insert to authenticated
  with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transactions_update_admin" on public.transactions;
create policy "transactions_update_admin" on public.transactions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "transactions_delete_admin" on public.transactions;
create policy "transactions_delete_admin" on public.transactions for delete to authenticated using (public.is_admin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notifications_insert_admin_or_system" on public.notifications;
create policy "notifications_insert_admin_or_system" on public.notifications for insert to authenticated
  with check (public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete to authenticated
  using (user_id = public.current_profile_id());

drop policy if exists "tracking_select_booking_parties" on public.tracking_events;
create policy "tracking_select_booking_parties" on public.tracking_events for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = tracking_events.booking_id
      and (b.shipper_id = public.current_profile_id() or b.transporter_id = public.current_profile_id())
  ));

drop policy if exists "tracking_insert_transporter_or_admin" on public.tracking_events;
create policy "tracking_insert_transporter_or_admin" on public.tracking_events for insert to authenticated
  with check (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = tracking_events.booking_id and b.transporter_id = public.current_profile_id()
  ));

drop policy if exists "tracking_update_admin" on public.tracking_events;
create policy "tracking_update_admin" on public.tracking_events for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tracking_delete_admin" on public.tracking_events;
create policy "tracking_delete_admin" on public.tracking_events for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 0004: LINK REAL AUTH — this is what makes signup/login/profile-save work
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_auth_user_fk'
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_fk
      foreign key (auth_user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, full_name, company_name, role, city)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'New user'), '@', 1)),
    new.raw_user_meta_data ->> 'company_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'shipper'),
    new.raw_user_meta_data ->> 'city'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();