-- ============================================================================
-- Wapas — 0004_route_waypoints.sql
-- Route detail / intermediate-stop support.
--
-- A truck (or load) travelling a long corridor, e.g. Bhubaneswar → Delhi,
-- passes through several intermediate cities along a known highway. This table
-- stores the ordered waypoints (the "middle path") so shippers can place
-- mid-route pickup or return (backhaul) orders at any stop.
--
-- origin/destination stay on trucks/loads; waypoints are a child table so the
-- corridor can be rendered as a breadcrumb and matched "by waypoint".
--
-- RLS is enabled and enforced in 0003_rls_policies.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- route_waypoints
-- One row per ordered stop on a truck or load corridor. `truck_id` and
-- `load_id` are mutually exclusive per row but either may be null so the same
-- table serves both listing types. `seq` 0 = origin, increasing toward the
-- destination.
-- ----------------------------------------------------------------------------
create table if not exists public.route_waypoints (
  id                  uuid primary key default gen_random_uuid(),
  truck_id            uuid references public.trucks(id) on delete cascade,
  load_id             uuid references public.loads(id) on delete cascade,
  seq                 int  not null check (seq >= 0),
  city                text not null,
  state               text,
  km_from_origin      numeric(8,2),
  is_highway_junction boolean not null default false,
  created_at          timestamptz not null default now(),
  constraint route_waypoints_owner check ( (truck_id is not null) <> (load_id is not null) )
);

create unique index if not exists route_waypoints_truck_seq_idx on public.route_waypoints(truck_id, seq);
create unique index if not exists route_waypoints_load_seq_idx  on public.route_waypoints(load_id, seq);
create index if not exists route_waypoints_city_idx on public.route_waypoints(city);

-- ----------------------------------------------------------------------------
-- RLS
-- Waypoints are visible to the whole marketplace (so any shipper can see the
-- stops and request a mid-route pickup). Only the owner of the parent truck /
-- load (or an admin) can write them.
-- ----------------------------------------------------------------------------
alter table public.route_waypoints enable row level security;

drop policy if exists "route_waypoints_select_all" on public.route_waypoints;
create policy "route_waypoints_select_all"
  on public.route_waypoints for select
  to authenticated
  using (true);

drop policy if exists "route_waypoints_insert_owner_or_admin" on public.route_waypoints;
create policy "route_waypoints_insert_owner_or_admin"
  on public.route_waypoints for insert
  to authenticated
  with check (
    public.is_admin()
    or (truck_id is not null and exists (
      select 1 from public.trucks t where t.id = route_waypoints.truck_id and t.transporter_id = public.current_profile_id()
    ))
    or (load_id is not null and exists (
      select 1 from public.loads l where l.id = route_waypoints.load_id and l.shipper_id = public.current_profile_id()
    ))
  );

drop policy if exists "route_waypoints_update_owner_or_admin" on public.route_waypoints;
create policy "route_waypoints_update_owner_or_admin"
  on public.route_waypoints for update
  to authenticated
  using (
    public.is_admin()
    or (truck_id is not null and exists (
      select 1 from public.trucks t where t.id = route_waypoints.truck_id and t.transporter_id = public.current_profile_id()
    ))
    or (load_id is not null and exists (
      select 1 from public.loads l where l.id = route_waypoints.load_id and l.shipper_id = public.current_profile_id()
    ))
  )
  with check (
    public.is_admin()
    or (truck_id is not null and exists (
      select 1 from public.trucks t where t.id = route_waypoints.truck_id and t.transporter_id = public.current_profile_id()
    ))
    or (load_id is not null and exists (
      select 1 from public.loads l where l.id = route_waypoints.load_id and l.shipper_id = public.current_profile_id()
    ))
  );

drop policy if exists "route_waypoints_delete_owner_or_admin" on public.route_waypoints;
create policy "route_waypoints_delete_owner_or_admin"
  on public.route_waypoints for delete
  to authenticated
  using (
    public.is_admin()
    or (truck_id is not null and exists (
      select 1 from public.trucks t where t.id = route_waypoints.truck_id and t.transporter_id = public.current_profile_id()
    ))
    or (load_id is not null and exists (
      select 1 from public.loads l where l.id = route_waypoints.load_id and l.shipper_id = public.current_profile_id()
    ))
  );
