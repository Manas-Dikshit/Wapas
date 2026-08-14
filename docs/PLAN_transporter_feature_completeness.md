# PLAN — Transporter Dashboard Feature Completeness & Edge Cases

This is the implementation plan for the stage. It documents every decision,
what is reused vs new, the single new migration, and the exact edge-case
guards. The final stage deliverable is
`docs/CHANGELOG_transporter_feature_completeness.md` (generated from this plan
once code is written and verified).

---

## 0. Analysis findings (read before writing anything)

### 0.1 There is NO migration `0010` in this repo
The stage brief assumes a `0010` migration from the shipper feature-completeness
stage. **That file does not exist.** The shipper feature-completeness commit
(`73724bc`) added *only* `docs/CHANGELOG_shipper_feature_completeness.md` — its
own changelog states **"No new migration was required"** because
`saved_transporters` was already created in `0007_shipper_dashboard_data.sql`.
Consequently:

- The **reusable shipper-stage output** is not a migration — it is the truck-type
  visual stack already in the tree:
  - `src/lib/truck-types.ts` (labels + `TRUCK_TYPES` + `isTruckType` guard)
  - `src/components/marketplace/truck-type-icon.tsx` (local SVG lookup)
  - The **extended** `src/components/marketplace/filter-bar.tsx` (already has the
    collapsible "More filters" panel with capacity/price/available-from/rating).
- These are **imported, never recreated** (per the hard constraint). No icon set
  is duplicated.
- Because a real schema gap now exists (document uploads + expiry tracking), this
  stage creates **exactly one** new migration: `0011_transporter_feature_completeness.sql`.
  Migrations `0001`–`0010` (i.e. all existing files) are untouched.

### 0.2 What the transporter dashboard already has (from the dynamic-data stage)
- Real Supabase reads of `trucks`, `bookings`, `transactions`,
  `load_recommendations` scoped to `profile.id` (`dashboard/transporter/page.tsx`).
- A **Register truck** inline form that INSERTs into `trucks` (`registerTruck`).
- **No** truck edit, **no** deactivate, **no** real document upload, **no**
  booking status-advance controls, **no** load-oriented search filters, and
  **none** of the 5 required edge-case guards.

### 0.3 RLS/constraint facts that shape the design
- `trucks_insert_own` / `trucks_update_own_or_admin` already exist → truck
  add/edit/deactivate are RLS-safe with no migration.
- `bookings_update_parties_or_admin` already allows **both** the transporter and
  the shipper to update a booking → transporter status-advance needs no new RLS.
- `bookings_insert_parties` allows either party to insert → transporter "accept a
  load" (create a booking) is RLS-safe.
- `trucks.status` enum: `available | booked | in-transit | maintenance`. The
  `handle_new_booking()` trigger in `0002` flips a truck to `booked` on booking
  insert; `handle_booking_status_change()` flips it back to `available` on
  `delivered`. **No overlap/double-book DB constraint exists** — so the
  double-book guard must be a client-side pre-insert check (task requirement:
  "prevent at the booking-action step, not just via a DB constraint failure").
- **No storage bucket or document table exists.** This is the one legitimate
  new-infra need → goes into `0011`.

---

## 1. New migration — `supabase/migrations/0011_transporter_feature_completeness.sql`

Single new file. Follows the existing style of `0007`/`0008` (headers, `create
table if not exists`, RLS, policy naming `_select_own`/`_insert_own`/...).
Does **not** touch `0001`–`0010`.

### 1.1 Table `public.transporter_documents`
Backs the real document uploads and the expiry edge case (expiry needs a date
column that storage object metadata can't reliably provide).

```sql
create table if not exists public.transporter_documents (
  id              uuid primary key default gen_random_uuid(),
  transporter_id  uuid not null references public.profiles(id) on delete cascade,
  truck_id        uuid references public.trucks(id) on delete set null,
  doc_type        text not null check (doc_type in
                    ('gst','pan','rc','fitness','driving_license')),
  file_path       text not null,        -- storage path, e.g. transporter-documents/<id>/<file>
  original_name   text,
  status          text not null default 'pending' check (status in
                    ('pending','verified','rejected')),
  expires_at      date,                 -- null for docs without an expiry (gst/pan)
  created_at      timestamptz not null default now()
);
create index if not exists transporter_documents_transporter_idx
  on public.transporter_documents(transporter_id);
create index if not exists transporter_documents_truck_idx
  on public.transporter_documents(truck_id);
alter table public.transporter_documents enable row level security;
```

Policies — owner (or admin) only, mirroring `0003`/`0007`:
```sql
drop policy if exists "transporter_documents_select_own" on public.transporter_documents;
create policy "transporter_documents_select_own"
  on public.transporter_documents for select to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transporter_documents_insert_own" on public.transporter_documents;
create policy "transporter_documents_insert_own"
  on public.transporter_documents for insert to authenticated
  with check (transporter_id = public.current_profile_id());

drop policy if exists "transporter_documents_update_own" on public.transporter_documents;
create policy "transporter_documents_update_own"
  on public.transporter_documents for update to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin())
  with check (transporter_id = public.current_profile_id() or public.is_admin());

drop policy if exists "transporter_documents_delete_own" on public.transporter_documents;
create policy "transporter_documents_delete_own"
  on public.transporter_documents for delete to authenticated
  using (transporter_id = public.current_profile_id() or public.is_admin());
```

### 1.2 Storage bucket + policies
Create a private bucket and let Supabase Storage's built-in `owner` column do the
"only owner can read/write their own files" scoping (owner = `auth.uid()` of the
uploading transporter's client). This is the RLS-equivalent storage policy.

```sql
insert into storage.buckets (id, name, public)
values ('transporter-documents', 'transporter-documents', false)
on conflict (id) do nothing;

create policy "transporter_documents_read_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());

create policy "transporter_documents_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'transporter-documents' and owner = auth.uid());

create policy "transporter_documents_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());

create policy "transporter_documents_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'transporter-documents' and owner = auth.uid());
```

**Why `owner = auth.uid()` is correct:** files are uploaded from the signed-in
transporter's browser client, so Supabase stamps `storage.objects.owner` with
that user's `auth.uid()`. Only that user (or an admin with a DB grant) can then
read/write/delete them — exactly the required "bucket scoped to the transporter"
behaviour, with no client-side security relied upon.

### 1.3 Features needing NO schema change (must be stated in the changelog)
- Truck **add** (already supported by `trucks_insert_own`).
- Truck **edit** / **deactivate** (`trucks_update_own_or_admin`; `status` enum
  already includes `maintenance`).
- Transporter **accept a load** → booking insert (`bookings_insert_parties`).
- Booking **status advance** confirmed → in-transit → delivered
  (`bookings_update_parties_or_admin`; triggers in `0002` already handle truck/load
  state + notifications).
- **Load search filters** (pure client-side over existing `loads` columns).
- **Capacity / double-book / deactivate-block / empty-state** guards (client-side).

---

## 2. Features (only the genuinely-missing ones are added)

### 2.1 Fleet management — add, edit, deactivate
**Redesign** of the existing "Your fleet" panel in
`src/app/(app)/dashboard/transporter/page.tsx` (register form already exists).

- **Add**: keep the existing `registerTruck` INSERT (already RLS-safe).
- **Edit**: per-row pencil → inline edit of `reg_number`, `type`, `capacity_tons`,
  `current_city`, `destination_city`, `available_from`, `price_per_ton`,
  `empty_leg` → `supabase.from('trucks').update({...}).eq('id', t.id)` scoped by
  `transporter_id` (RLS `trucks_update_own_or_admin`).
- **Deactivate**: per-row button that sets `status: 'maintenance'` (never DELETE).
  **Guard:** only when `truck.status === 'available'`. If `booked`/`in-transit`,
  block with an explanation toast and a disabled button + inline reason.
- **Reuse:** import `TruckTypeIcon` and render it on every fleet row (currently a
  generic `TruckIcon`) — the icon set is imported, not recreated.

### 2.2 Advanced load-search filters (transporters browsing loads)
**Extension** (not rewrite) of the shared `filter-bar.tsx` "More filters" panel
and the `marketplace/page.tsx` `filteredLoads` memo. The filter-bar is already
mode-agnostic (it conditionally renders the advanced group when the handler props
are present); we add load-oriented optional props.

- New optional props on `FilterBar`: `origin`, `destination`, `weightMin`,
  `weightMax`, `budgetMin`, `budgetMax`, `pickupFrom`, `pickupTo`
  (each with its `onChange`). When the load-handlers are passed, the More-filters
  panel shows the load fields; otherwise it stays exactly as today (backwards
  compatible for the trucks mode).
- `marketplace/page.tsx`: add the matching state and predicates inside the
  existing `filteredLoads` memo:
  - origin / destination city (exact match)
  - weight min/max
  - budget min/max
  - pickup date min/max
  - truck type needed (already supported via `type`)
- Wire the new props into `<FilterBar .../>`. `hasFilters` is widened to include
  the new fields. Existing truck filtering is untouched.

### 2.3 Truck-type visual reuse
- Already wired into `TruckCard`, `marketplace/[id]`, `booking/[id]` review.
- **Add** the import to the transporter dashboard fleet list (2.1) and to the
  booking **review step** used by the transporter accept flow (2.5). Import
  `TruckTypeIcon` from `@/components/marketplace/truck-type-icon` only — no icon
  SVG is duplicated.

### 2.4 Document / KYC upload (real, Supabase Storage)
**Redesign** of the `documents` tab in `src/app/(app)/profile/page.tsx` (currently
a hardcoded static array).

- Replace the static list with rows fetched from `transporter_documents` for the
  signed-in transporter, grouped by `truck_id` where applicable.
- **Upload** for each doc type: GST, PAN, Vehicle RC, Fitness Certificate,
  Driving License. On submit:
  1. `supabase.storage.from('transporter-documents').upload(path, file)`
     where `path = \`<profile.id>/<uuid>.<ext>\`` (owner scoping via bucket policy).
  2. `INSERT` the metadata row into `transporter_documents`
     (`transporter_id`, optional `truck_id`, `doc_type`, `file_path`,
     `original_name`, `expires_at` if the doc type carries one).
- If no Supabase is configured (demo), keep the static fallback list.
- Note: this profile page is shared across roles, but the document tab is the
  transporter's KYC surface; gating uploads to `role === 'transporter'` keeps the
  diff transporter-facing (shipper/admin documents tab stays static).

### 2.5 Transporter "accept a load" + booking status advance
This is the transporter-side trip action (task feature 5).

**Accept a load** (new, in the transporter dashboard's AI-recommendations panel):
- Add an **Accept** button on each recommended load. On click, open a truck
  picker listing the transporter's `available` trucks.
- On submit, run the two guards (3.2 capacity, 3.3 double-book) then
  `supabase.from('bookings').insert({ load_id, truck_id, shipper_id,
  transporter_id: profile.id, amount })` — amount = load budget. RLS
  `bookings_insert_parties` accepts it; the `0002` trigger sets truck→booked and
  load→booked. This is the **only** real booking-creation path a transporter has
  (the existing `/booking/[id]` page is mock-only and untouched).

**Status advance** on the dashboard's recent-bookings list:
- Extend `src/components/dashboard/widgets.tsx` `RecentBookings` with an optional
  `onUpdateStatus?: (id, next: 'in-transit' | 'delivered') => void` prop
  (backwards-compatible — when absent, no action buttons render, so no other
  consumer changes).
- In the transporter dashboard, pass `onUpdateStatus` that:
  - `confirmed → in-transit`: `supabase.from('bookings').update({ status:
    'in-transit' }).eq('id', id).eq('transporter_id', profile.id)`.
  - `in-transit → delivered`: same, `status: 'delivered'`.
  - Respects `bookings_update_parties_or_admin`; the `0002`
    `handle_booking_status_change` trigger frees the truck + notifies the shipper
    on `delivered`.

---

## 3. Edge cases — each surfaced in the UI (feature-level)

| # | Edge case | Guard location | How surfaced |
|---|---|---|---|
| 3.1 | Fitness cert / driving licence expiring ≤ 14 days | `dashboard/transporter/page.tsx` reads `transporter_documents` and computes `daysUntil = expires_at - today` | Amber **"Expiring in N days"** badge on the fleet row (per truck) **and** a top dashboard banner ("N document(s) expiring soon — renew to keep your fleet active"). Uses `expires_at` from `0011`. |
| 3.2 | Capacity < load weight on accept | `dashboard/transporter/page.tsx` accept handler, before booking insert | Inline error in the truck picker: *"Your selected truck (X T) can't carry this Y T load. Pick a larger truck."* Submit is blocked. |
| 3.3 | Double-book a truck already `booked`/`in-transit` (overlapping) | Same accept handler, before insert — query `trucks` for the selected id | If `truck.status !== 'available'`, block: *"This truck is already assigned (booked/in-transit). Choose an available truck."* Prevents at the action step, with explanation (no bare DB error). |
| 3.4 | Zero loads match route/filters | `marketplace/page.tsx` (loads mode) | Actionable empty state instead of a blank grid: message + **"Widen filters"** (clears filters) and **"Post your truck as available"** (link to the dashboard fleet panel / marketplace). Mirrors the shipper stage's empty-state pattern. |
| 3.5 | Deactivate a truck with an active in-transit booking | Fleet deactivate button | If `truck.status !== 'available'` (i.e. `booked`/`in-transit`), the deactivate button is disabled with a tooltip/inline note: *"Truck has an active trip — deactivate only when available."* No status change is made. |

---

## 4. Files touched (diff is scoped to transporter-facing files)

**New**
- `supabase/migrations/0011_transporter_feature_completeness.sql`
- (final stage) `docs/CHANGELOG_transporter_feature_completeness.md`
- (this planning doc) `docs/PLAN_transporter_feature_completeness.md`

**Modified**
- `src/app/(app)/dashboard/transporter/page.tsx` — fleet add/edit/deactivate,
  document-expiry banner + badges, accept-a-load flow (with 3.2/3.3 guards),
  booking status-advance wiring, `TruckTypeIcon` reuse in fleet rows.
- `src/app/(app)/profile/page.tsx` — real document upload/list from
  `transporter_documents` + Storage (gated to transporter role).
- `src/components/marketplace/filter-bar.tsx` — added load filter fields
  (origin/destination/weight/budget/pickup) to the existing More-filters panel.
- `src/app/(app)/marketplace/page.tsx` — wired load filters into `filteredLoads`;
  actionable zero-loads empty state.
- `src/components/dashboard/widgets.tsx` — optional `onUpdateStatus` prop on
  `RecentBookings` (backwards-compatible).

**Reused (imported, not recreated)**
- `src/lib/truck-types.ts`, `src/components/marketplace/truck-type-icon.tsx`
  (shipper-stage truck-type visuals).
- Existing `FilterBar` panel structure, existing `filteredLoads` memo, existing
  add-truck form, existing RLS + `0002` triggers.

**Untouched (per hard constraints)**
- Migrations `0001`–`0010`, middleware, shipper/admin dashboards, `mock-data.ts`,
  `/booking/[id]`, `/tracking/[id]`, `/marketplace/[id]`, other dashboards, and
  all already-working dynamic queries.

---

## 5. Implementation order (dependency-safe)

1. Write `0011_transporter_feature_completeness.sql` (schema + bucket + policies).
2. `filter-bar.tsx` → add load props (no callers break; props optional).
3. `marketplace/page.tsx` → load filters + empty state.
4. `widgets.tsx` → `RecentBookings.onUpdateStatus` (optional).
5. `dashboard/transporter/page.tsx` → fleet edit/deactivate, expiry banner/badges,
   accept-a-load + guards, status-advance wiring, `TruckTypeIcon` reuse.
6. `profile/page.tsx` → real document upload/list.
7. `npm run typecheck`, `npm run lint`, `npm run build`.
8. Write `docs/CHANGELOG_transporter_feature_completeness.md` from this plan +
   the manual test steps in §6, with verification results.

---

## 6. Manual test steps (for the final changelog)

Setup: Supabase env vars set; migrations `0001`–`0011` applied; a profile linked
to the auth user with `role = 'transporter'`; `npm run dev`.

1. **Add truck** — `/dashboard/transporter` → Register truck → submit → appears in
   fleet, count utilizations update.
2. **Edit truck** — pencil on a row → change capacity/city/price → Save → row
   refreshes; another transporter's truck shows no edit affordance (RLS).
3. **Deactivate (blocked)** — for a truck with `status = 'booked'`/`in-transit`,
   deactivate is disabled with the "active trip" note; nothing changes.
4. **Deactivate (allowed)** — for an `available` truck, deactivate → status becomes
   `maintenance` (row stays; not deleted).
5. **Expiry banner** — set `expires_at` on a fitness/licence row to within 14 days
   → amber badge on the fleet row + top dashboard banner.
6. **Load filters** — `/marketplace` → Find loads → More filters → set origin,
   weight range, budget range, pickup range, type → results narrow; Reset returns
   all.
7. **Zero-load empty state** — set filters with no match → "Widen filters" clears;
   "Post your truck as available" links to the fleet panel.
8. **Accept a load (capacity block)** — on a recommendation, pick an `available`
   truck whose `capacity_tons < weight_tons` → inline error, no booking created.
9. **Accept a load (double-book block)** — pick a truck already `booked`/`in-transit`
   → blocked with the "already assigned" message.
10. **Accept a load (success)** — pick a valid truck → booking created; truck/load
    flip to `booked`; appears in recent bookings.
11. **Status advance** — confirmed booking → "Start trip" → becomes `in-transit`;
    → "Mark delivered" → `delivered`, truck freed to `available`, load delivered.
12. **Document upload** — `/profile` → Documents → upload GST/PAN/RC/Fitness/Licence
    (with an `expires_at` where applicable) → file lands in
    `transporter-documents/<profile.id>/...`, metadata row appears, and only that
    user can read/write it (try a second user → 403).

---

## 7. Verification
- `npm run typecheck` — must pass.
- `npm run lint` — no new warnings/errors.
- `npm run build` — clean production build.
- Post-verification: reflect results in the final changelog's Verification section.