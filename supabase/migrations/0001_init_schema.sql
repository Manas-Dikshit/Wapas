-- ============================================================================
-- Wapas — 0001_init_schema.sql
-- Core schema: profiles, trucks, loads, bookings, transactions, notifications,
-- tracking_events.
--
-- Run in the Supabase SQL Editor, or via the CLI:
--   supabase db push
-- (migrations run in filename order, so keep the numeric prefixes intact)
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- profiles
-- One row per app user. `id` is DECOUPLED from auth.users on purpose so this
-- schema (and the seed data in seed.sql) works standalone for the demo.
-- To wire up real Supabase Auth, add:
--   alter table public.profiles
--     add constraint profiles_auth_user_fk
--     foreign key (auth_user_id) references auth.users(id) on delete cascade;
-- and populate auth_user_id from the handle_new_user() trigger in
-- 0003_functions_triggers.sql.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique, -- nullable link to auth.users(id), see note above
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

comment on table public.profiles is 'App users: shippers, transporters and admins.';

-- ----------------------------------------------------------------------------
-- trucks
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- loads
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- bookings
-- Links one load to one truck. Both the shipper and transporter are
-- denormalized onto the row for simpler RLS checks and dashboard queries.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- transactions (wallet ledger)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- tracking_events (shipment timeline / breadcrumb trail)
-- ----------------------------------------------------------------------------
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
