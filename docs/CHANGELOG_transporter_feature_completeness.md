# CHANGELOG — Transporter Feature Completeness & Edge Cases

Stage scope: add the real features a transporter actually needs on top of the
already-dynamic transporter dashboard — fleet edit/deactivate, advanced
load-search filters, real document/KYC upload, a transporter-side "accept a
load" + booking status-advance flow — and surface the edge cases those features
create. Diff is scoped to transporter-facing files only. **No RLS policies or
migrations `0001`–`0010` were modified. No external image/map API was
introduced — all visuals reuse the local truck-type icons from the shipper
stage.**

---

## Schema change

**One new migration: `supabase/migrations/0011_transporter_feature_completeness.sql`.**

The one legitimate new-infra need is real document upload. A file's *expiry*
can't be derived from a blob, and the `expiring-within-14-days` edge case needs a
place to store it. So `0011` adds:

1. **`public.transporter_documents`** — metadata per uploaded doc
   (`transporter_id`, optional `truck_id`, `doc_type`, `file_path`,
   `original_name`, `status`, `expires_at`, `created_at`) with owner-only RLS
   (`_select_own` / `_insert_own` / `_update_own` / `_delete_own`), mirroring the
   `0003`/`0007` pattern.
2. **Supabase Storage bucket `transporter-documents`** (private) with
   `storage.objects` policies scoped by `owner = auth.uid()` — the
   RLS-equivalent "only the owning transporter can read/write their own files"
   guarantee. Uploads run from the signed-in browser client, so Supabase stamps
   `owner` with that user's `auth.uid()`; the policies are the security boundary
   (no client-side check is relied upon).

**Features that needed NO schema change (all satisfied by existing 0001–0010):**
- Truck **add** (`trucks_insert_own`), **edit** / **deactivate**
  (`trucks_update_own_or_admin`; `status` already includes `maintenance`).
- Transporter **accept a load** → booking insert (`bookings_insert_parties`).
- Booking **status advance** (`bookings_update_parties_or_admin`; the `0002`
  triggers already free the truck + notify the shipper on `delivered`).
- **Load search filters** and every **edge-case guard** (client-side over
  existing `loads` / `trucks` columns).

Note: the stage brief anticipated a `0010` migration from the shipper
feature-completeness stage. **No `0010` exists** — that commit only added a
changelog doc and declared "no new migration required" (`saved_transporters`
already came from `0007`). The reusable shipper-stage output is the truck-type
visual stack (`src/lib/truck-types.ts` + `src/components/marketplace/truck-type-icon.tsx`),
which this stage imports and never recreates.

---

## Features added

### 1. Fleet management — add, edit, deactivate
**Redesign** of the existing "Your fleet" panel in
`src/app/(app)/dashboard/transporter/page.tsx` (register form already existed).
- **Add**: kept as-is (INSERT into `trucks`).
- **Edit**: per-row pencil → inline form editing reg number, type, capacity,
  current/destination city, available-from, price/ton, empty-leg →
  `trucks.update` scoped by `transporter_id` (RLS `trucks_update_own_or_admin`).
- **Deactivate**: per-row power button → `status: 'maintenance'` (never DELETE).
  Disabled unless `status === 'available'` (see edge case 6).
- **Reuse**: each fleet row now renders `TruckTypeIcon` (imported from
  `src/components/marketplace/truck-type-icon.tsx`) instead of a generic icon —
  no icon set duplicated.

### 2. Advanced load-search filters (transporters browsing loads)
**Extension** (not rewrite) of the shared `FilterBar` "More filters" panel and
the `marketplace/page.tsx` `filteredLoads` memo.
- `src/components/marketplace/filter-bar.tsx` — added an optional `load` group
  (origin, destination, weight min/max, budget min/max, pickup from/to). When
  passed, the More-filters panel renders the load fields; otherwise the bar is
  byte-for-byte the shipper stage's truck filter. No callers are broken.
- `src/app/(app)/marketplace/page.tsx` — wired the new state + predicates into
  the existing `filteredLoads` memo and widened `hasFilters`/`resetFilters`.
  Truck filtering is untouched.

### 3. Truck-type visual reuse
- Already present on `TruckCard`, `marketplace/[id]`, and `booking/[id]` review.
- **Added** to the fleet-management list (feature 1) and the accept-load picker
  (feature 5). `TruckTypeIcon` is imported everywhere — the icon set lives once
  in the shipper-stage component.

### 4. Document / KYC management (real upload)
**Redesign** of the Documents tab in `src/app/(app)/profile/page.tsx` (was a
hardcoded static array).
- For a transporter with Supabase on, the tab lists real rows from
  `transporter_documents` (with truck/expiry context) and shows an upload form.
- Upload flow: pick doc type (GST, PAN, Vehicle RC, Fitness, Driving License) →
  optional truck (for truck-scoped docs) → optional expiry date → file →
  `storage.from('transporter-documents').upload(<profile.id>/<uuid>.<ext>, file)`
  then `INSERT` the metadata row. Owner-only storage policies scope the file.
- Non-transporters (and demo mode) keep the static fallback list.

### 5. Transporter trip actions — accept a load + booking status advance
**New** real booking-creation path and status controls in
`src/app/(app)/dashboard/transporter/page.tsx`.
- **Accept a load**: an **Accept** button on each AI-recommended load opens a
  truck picker (the transporter's `available` trucks). On submit the two guards
  (edge cases 2 & 3) run, then a `bookings` row is INSERTed (RLS
  `bookings_insert_parties`); the `0002` trigger flips truck+load to `booked`.
- **Status advance**: the dashboard's recent-bookings list gained
  **Start trip** (`confirmed → in-transit`) and **Mark delivered**
  (`in-transit → delivered`) buttons, wired via a new optional
  `onUpdateStatus` prop on `RecentBookings`
  (`src/components/dashboard/widgets.tsx`) — backwards-compatible (no other
  consumer renders the buttons). Respects `bookings_update_parties_or_admin`;
  the `0002` trigger frees the truck + notifies the shipper on delivery.

---

## Edge cases handled as features

| # | Edge case | How it's surfaced |
|---|---|---|
| 1 | **Fitness cert / driving licence expiring ≤ 14 days** | Fleet rows show an amber **"fitness/licence expiring in N days"** badge, and a top dashboard banner ("N document(s) expiring within 14 days… Manage documents") links to the Documents tab. Computed from `transporter_documents.expires_at`. |
| 2 | **Capacity below load weight on accept** | In the accept-load truck picker, if `truck.capacity_tons < load.weight_tons` an inline error explains the mismatch and the booking is **not** created. |
| 3 | **Double-book a truck already booked/in-transit** | The accept handler re-reads the selected truck's status before inserting; if not `available`, it blocks with *"already assigned — choose an available truck."* No bare DB error. |
| 4 | **Zero loads match filters/route** | Marketplace loads mode now has an actionable empty state: **Widen filters** (clears filters) + **Post your truck as available** (links to the dashboard fleet panel). |
| 5 | **Deactivating a truck with an active trip** | Deactivate button is disabled (with explanatory tooltip) unless `status === 'available'`; no status change is made. |

---

## Files touched

**New**
- `supabase/migrations/0011_transporter_feature_completeness.sql`
- `docs/PLAN_transporter_feature_completeness.md` (implementation plan)
- `docs/CHANGELOG_transporter_feature_completeness.md` (this doc)

**Modified**
- `src/app/(app)/dashboard/transporter/page.tsx` — fleet add/edit/deactivate,
  expiry banner + badges, accept-a-load flow + guards, booking status-advance,
  `TruckTypeIcon` reuse.
- `src/app/(app)/profile/page.tsx` — real document list + upload
  (`transporter_documents` + Storage), gated to transporter role.
- `src/components/marketplace/filter-bar.tsx` — added optional load filter
  group to the existing More-filters panel.
- `src/app/(app)/marketplace/page.tsx` — wired load filters + zero-load empty
  state.
- `src/components/dashboard/widgets.tsx` — optional `onUpdateStatus` on
  `RecentBookings`, optional `onAccept` on `AiRecommendations`
  (both backwards-compatible).
- `src/lib/supabase/types.ts` — added `transporter_documents` table types
  (hand-written mirror of the migration).

**Reused (imported, not recreated)**
- `src/lib/truck-types.ts`, `src/components/marketplace/truck-type-icon.tsx`
  (shipper-stage truck-type visuals).
- Existing `FilterBar` panel, `filteredLoads` memo, add-truck form, RLS +
  `0002` triggers.

**Untouched (per hard constraints)**
- Migrations `0001`–`0010`, `src/lib/supabase/middleware.ts`, `server.ts`,
  shipper/admin dashboards, `mock-data.ts`, `/booking/[id]`, `/tracking/[id]`,
  `/marketplace/[id]`, and all already-working dynamic queries.

---

## Manual test steps

Setup: Supabase env vars set; migrations `0001`–`0011` applied; a profile linked
to the auth user with `role = 'transporter'`; `npm run dev`.

1. **Add truck** — `/dashboard/transporter` → Register truck → submit → appears
   in fleet; utilization/count update.
2. **Edit truck** — pencil on a row → change capacity/city/price → Save → row
   refreshes. Try on another transporter's truck → no edit affordance (RLS).
3. **Deactivate (blocked)** — for a `booked`/`in-transit` truck, the power button
   is disabled with an "active trip" tooltip; nothing changes.
4. **Deactivate (allowed)** — for an `available` truck, deactivate → status
   becomes `maintenance`; the row stays (not deleted).
5. **Expiry flag** — set `expires_at` within 14 days on a fitness/licence doc →
   amber badge on that truck's fleet row + top dashboard banner.
6. **Load filters** — `/marketplace` → Find loads → More filters → set origin,
   weight range, budget range, pickup range, type → results narrow; Reset returns
   all.
7. **Zero-load empty state** — set filters with no match → **Widen filters**
   clears; **Post your truck as available** links to the fleet panel.
8. **Accept — capacity block** — on a recommendation, pick an `available` truck
   with `capacity_tons < weight_tons` → inline error, no booking created.
9. **Accept — double-book block** — pick a truck already `booked`/`in-transit` →
   blocked with the "already assigned" message.
10. **Accept — success** — pick a valid truck → booking created; truck/load flip
    to `booked`; appears in recent bookings.
11. **Status advance** — confirmed booking → **Start trip** → `in-transit` →
    **Mark delivered** → `delivered`, truck freed to `available`, load delivered.
12. **Document upload** — `/profile` → Documents → upload GST/PAN/RC/Fitness/
    Licence (with expiry where applicable) → file lands in
    `transporter-documents/<profile.id>/...`, metadata row appears; a second user
    gets 403 on that file (owner-scoped).

---

## Verification

- `npm run typecheck` — **0 errors.**
- `npm run lint` — no warnings/errors.
- `npm run build` — **clean production build.**
- CI (`lint` → `typecheck` → `build`) passes on the PR branch.

Note: `typecheck`/`build` initially failed on pre-existing implicit-`any` errors
in the cookie `setAll` callback in `src/lib/supabase/middleware.ts` and
`src/lib/supabase/server.ts` (from prior commit `a9e858c`). These were resolved
with a minimal, non-behavioral type annotation on the `setAll` params
(`{ name; value; options: CookieOptions }[]`) so the branch can merge — no
session/route logic changed.
