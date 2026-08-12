-- ============================================================================
-- Wapas — 0007_shipper_dashboard_data.sql
-- Adds the `saved_transporters` relation required by the shipper dashboard's
-- "Saved transporters" panel and the "Saved transporters" stat.
--
-- The shipper dashboard previously read saved transporter listings from
-- src/lib/mock-data.ts (a hardcoded slice of `trucks`). There is no column
-- or table for "a shipper has saved this transporter", so this migration
-- introduces the real relation. No edits are made to 0001-0006.
--
-- Run in order after 0001-0004:
--   supabase db push
-- ============================================================================

-- A shipper can save transporters (profiles with role = 'transporter') to
-- keep a shortlist. One shipper cannot save the same transporter twice.
create table if not exists public.saved_transporters (
  id              uuid primary key default gen_random_uuid(),
  shipper_id      uuid not null references public.profiles(id) on delete cascade,
  transporter_id  uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (shipper_id, transporter_id)
);

create index if not exists saved_transporters_shipper_idx
  on public.saved_transporters(shipper_id);
create index if not exists saved_transporters_transporter_idx
  on public.saved_transporters(transporter_id);

alter table public.saved_transporters enable row level security;

-- A shipper only ever sees and manages their own saved list.
drop policy if exists "saved_transporters_select_own" on public.saved_transporters;
create policy "saved_transporters_select_own"
  on public.saved_transporters for select
  to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "saved_transporters_insert_own" on public.saved_transporters;
create policy "saved_transporters_insert_own"
  on public.saved_transporters for insert
  to authenticated
  with check (shipper_id = public.current_profile_id());

drop policy if exists "saved_transporters_delete_own" on public.saved_transporters;
create policy "saved_transporters_delete_own"
  on public.saved_transporters for delete
  to authenticated
  using (shipper_id = public.current_profile_id() or public.is_admin());

drop policy if exists "saved_transporters_update_own" on public.saved_transporters;
create policy "saved_transporters_update_own"
  on public.saved_transporters for update
  to authenticated
  using (shipper_id = public.current_profile_id())
  with check (shipper_id = public.current_profile_id());