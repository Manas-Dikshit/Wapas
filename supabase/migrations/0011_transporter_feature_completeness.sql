-- ============================================================================
-- Wapas — 0011_transporter_feature_completeness.sql
-- Transporter feature-completeness stage.
--
-- Genuine schema gaps found by the stage:
--   1. Real document / KYC uploads need somewhere to store the file metadata
--      (doc type, which truck it belongs to, and — critically — an expiry date
--      so a fitness certificate / driving licence expiring within 14 days can
--      be flagged in the UI).
--   2. No Supabase Storage bucket exists to hold the uploaded files. A bucket
--      is created and scoped to the owning transporter via the built-in
--      `storage.objects.owner` column (owner = auth.uid()).
--
-- Everything else the stage adds (truck edit/deactivate, load search filters,
-- transporter "accept a load", booking status advance, and the related edge-case
-- guards) is pure client-side over existing tables/columns and RLS from
-- 0001-0010 — no further schema change is needed. Migrations 0001-0010 are
-- untouched.
--
-- Run in order after 0001-0010:
--   supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- transporter_documents
-- One row per uploaded KYC/vehicle document. `truck_id` is nullable because
-- GST/PAN are transporter-wide, while RC/fitness/driving-licence belong to a
-- specific truck. `expires_at` drives the "expiring soon" flag; it is null for
-- documents that don't expire (gst, pan).
-- ----------------------------------------------------------------------------
create table if not exists public.transporter_documents (
  id              uuid primary key default gen_random_uuid(),
  transporter_id  uuid not null references public.profiles(id) on delete cascade,
  truck_id        uuid references public.trucks(id) on delete set null,
  doc_type        text not null check (doc_type in ('gst','pan','rc','fitness','driving_license')),
  file_path       text not null,          -- storage path, e.g. transporter-documents/<profile_id>/<file>
  original_name   text,
  status          text not null default 'pending' check (status in ('pending','verified','rejected')),
  expires_at      date,                   -- null for docs with no expiry (gst/pan)
  created_at      timestamptz not null default now()
);

create index if not exists transporter_documents_transporter_idx
  on public.transporter_documents(transporter_id);
create index if not exists transporter_documents_truck_idx
  on public.transporter_documents(truck_id);

alter table public.transporter_documents enable row level security;

-- A transporter only ever sees and manages their own documents (admin sees all).
drop policy if exists "transporter_documents_select_own" on public.transporter_documents;
create policy "transporter_documents_select_own"
  on public.transporter_documents for select
  to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transporter_documents_insert_own" on public.transporter_documents;
create policy "transporter_documents_insert_own"
  on public.transporter_documents for insert
  to authenticated
  with check (transporter_id = public.current_profile_id());

drop policy if exists "transporter_documents_update_own" on public.transporter_documents;
create policy "transporter_documents_update_own"
  on public.transporter_documents for update
  to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin())
  with check (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transporter_documents_delete_own" on public.transporter_documents;
create policy "transporter_documents_delete_own"
  on public.transporter_documents for delete
  to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());

-- ----------------------------------------------------------------------------
-- Supabase Storage: private bucket + owner-scoped policies.
--
-- The bucket is `private` (public = false), so no anonymous access. Files are
-- uploaded from the signed-in transporter's browser client, so Supabase stamps
-- `storage.objects.owner` with that user's `auth.uid()`. The policies below
-- restrict read/write/update/delete to `owner = auth.uid()`, which is the
-- RLS-equivalent "only the owning transporter can read/write their own files"
-- scoping required by this stage. No client-side check is relied upon.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('transporter-documents', 'transporter-documents', false)
on conflict (id) do nothing;

drop policy if exists "transporter_documents_read_own" on storage.objects;
create policy "transporter_documents_read_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());

drop policy if exists "transporter_documents_insert_own" on storage.objects;
create policy "transporter_documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'transporter-documents' and owner = auth.uid());

drop policy if exists "transporter_documents_update_own" on storage.objects;
create policy "transporter_documents_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());

drop policy if exists "transporter_documents_delete_own" on storage.objects;
create policy "transporter_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());
