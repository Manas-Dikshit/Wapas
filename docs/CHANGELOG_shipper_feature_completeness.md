# CHANGELOG — Shipper Feature Completeness & Edge Cases

Stage scope: add the missing real shipper features (marketplace truck search,
truck-type visuals, saved transporters, load management, invoice access) and
surface the edge cases those features create. Diff is scoped to
shipper-facing files only. **No RLS policies or migrations 0001–0009 were
modified. No external image/map API was introduced — all visuals are local.**

---

## Schema change

**No new migration was required.**

The one schema gap the brief anticipated (a real backing for "Saved
transporters") **already exists**: `public.saved_transporters` was added in
`0007_shipper_dashboard_data.sql`, complete with its own RLS policies
(`saved_transporters_select_own`, `_insert_own`, `_delete_own`, `_update_own`)
and a `unique (shipper_id, transporter_id)` constraint. This stage only wired
real save/unsave *actions* against that existing table.

Therefore **no `0010` migration file was created** and nothing in 0001–0009 was
edited. Every other feature needed no schema change either (loads/bookings
tables, columns and RLS already support edit, cancel and stale-flagging).

---

## Features added

### 1. Advanced marketplace truck filters
**New — extends the existing filter-bar pattern; marketplace search logic not
rewritten.**
- `src/components/marketplace/filter-bar.tsx` — extended the existing
  `FilterBar` with a collapsible "More filters" panel (the previously-dead
  button now toggles it) adding: capacity min/max (T), price min/max (₹/ton),
  "available from" date, and a minimum transporter rating. A "Reset filters"
  control clears everything.
- `src/app/(app)/marketplace/page.tsx` — added the matching filter state and
  applied all new predicates inside the existing `filteredTrucks` memo
  (truck search was already implemented; this only widens it).
- Note: the marketplace still reads `src/lib/mock-data.ts` (unchanged) — no
  Supabase query rewrite was requested here.

### 2. Truck / container type visuals
**New — one small bundled component, reused everywhere (no duplication).**
- `src/lib/truck-types.ts` — single source of truth: the 6 type labels
  (Open Body, Container, Trailer, Refrigerated, Tanker, Mini Truck), a local
  benchmark `typicalPricePerTon` (used only for the budget soft-warning), and
  an `isTruckType` guard.
- `src/components/marketplace/truck-type-icon.tsx` — a tiny bundled SVG lookup
  (hand-drawn, no external image/API) that renders the right silhouette per
  type via `currentColor`.
- Wired into `TruckCard`, `marketplace/[id]` detail header, and the
  `booking/[id]` review step.

### 3. Saved transporters (real save/unsave)
**New action on an existing table; dashboard list was already real.**
- `src/components/marketplace/save-transporter-button.tsx` — heart/bookmark
  toggle. Reads the current saved state from `saved_transporters` and
  INSERTs/DELETEs on click, scoped by the signed-in shipper's `profile.id`
  (RLS `_insert_own` / `_delete_own` enforce it server-side). Falls back to a
  local toggle in demo mode (no Supabase configured).
- Wired onto `TruckCard` and the `marketplace/[id]` transporter view.
- `src/app/(app)/dashboard/shipper/page.tsx` — the dashboard's "Saved
  transporters" list (already querying `saved_transporters`) now also has an
  unsave (×) button per row.

### 4. Load management (edit / cancel OPEN loads)
**New — real CRUD against the shipper's own `loads`.**
- `src/app/(app)/dashboard/shipper/page.tsx` — each open load now shows
  inline **Edit** (pickup date + budget, saved via `loads.update`) and
  **Cancel** (confirmation dialog, then `loads.delete`). Both target rows via
  `shipper_id` so RLS (`loads_update_own_or_admin` /
  `loads_delete_own_or_admin`) is respected and a shipper can never touch
  another shipper's load.

### 5. Invoice / receipt access for delivered bookings
**New link, reusing the existing stub — not duplicated.**
- `src/app/(app)/dashboard/shipper/page.tsx` — delivered bookings now show an
  **Invoice** link that navigates to the existing
  `tracking/[id]` page, which already carries the "Download invoice" button.
  No second invoice generator was added (per the "don't duplicate it"
  constraint).

---

## Edge cases handled as features

| Edge case | How it's surfaced |
|---|---|
| **Zero trucks match the shipper's filters** | `marketplace/page.tsx` — when `hasFilters` and results are empty, the empty state becomes actionable: "No trucks match your filters…" plus a **"Clear all filters"** CTA button (was a blank-looking generic state). |
| **Pickup date passed while a load is still `open`** | `dashboard/shipper/page.tsx` — stale loads (computed from `pickup_date < today`) get an amber **"Pickup passed"** badge on each open load, an amber banner at the top of the dashboard ("Needs attention" count), and the stat card flips to "Needs attention". Edit date / cancel are one tap away. |
| **Near-duplicate load (same origin/destination/date/weight)** | `post-load/page.tsx` — on submit (real Supabase path) it queries the shipper's existing open/matched loads on the same route+date within ±0.5T; if found it shows an inline **"near-duplicate"** notice and a `window.confirm` **before** inserting. User may proceed. |
| **Budget well below typical price_per_ton × weight** | `post-load/page.tsx` — live inline amber warning when `budget < 0.7 × typicalPricePerTon × weight` for the chosen truck type. Soft, non-blocking; posting still allowed. |
| **Cancelling a load/booking that already has a transporter attached** | `dashboard/shipper/page.tsx` — bookings (which imply a transporter) expose **Cancel** only for non-delivered/non-cancelled rows; it goes through a confirmation step and then **updates `bookings.status = 'cancelled'`** (via `bookings_update_parties_or_admin`) — it never hard-deletes. Standalone `open` loads without a transporter are cancelled by delete (the only RLS-permitted path). |

---

## Files touched

**New**
- `src/lib/truck-types.ts`
- `src/components/marketplace/truck-type-icon.tsx`
- `src/components/marketplace/save-transporter-button.tsx`

**Modified**
- `src/components/marketplace/filter-bar.tsx` (redesigned: advanced filters)
- `src/components/marketplace/cards.tsx` (TruckCard: type icon + save button)
- `src/app/(app)/marketplace/page.tsx` (truck filter logic + empty-state CTA)
- `src/app/(app)/marketplace/[id]/page.tsx` (icon + save on detail)
- `src/app/(app)/booking/[id]/page.tsx` (type icon in review)
- `src/app/(app)/dashboard/shipper/page.tsx` (load mgmt, stale flag, invoice access, unsave, needs-attention stat)
- `src/app/(app)/post-load/page.tsx` (near-duplicate + budget warnings)

---

## Manual test steps

### Marketplace truck filters
1. Go to `/marketplace` → "Find trucks".
2. Open **More filters**, set Capacity min/max, Price min/max, Available from,
   Min rating, then verify the count in the header narrows and the grid only
   shows matching trucks.
3. Press **Reset filters** → all trucks return.
4. Apply filters with no possible match (e.g. capacity min 999) → empty state
   shows **Clear all filters**; clicking it restores results.

### Truck type visuals
5. On the truck grid, each card shows a silhouette matching its type.
6. Open a truck's detail (`/marketplace/<id>`) — the header shows the type
   icon next to the title.
7. Start a booking for that truck (`/booking/<id>`) — the review step shows the
   type icon.

### Saved transporters (real)
8. On any `TruckCard`, click the heart → it fills (toast "Saved to your
   network"). On the dashboard, the **Saved transporters** panel now lists that
   transporter and the stat count increments.
9. Click the heart again (or the × on the dashboard row) → unsaves; the
   dashboard list/count updates.

### Load management (real, RLS-scoped)
10. Post a load (`/post-load`), then on `/dashboard/shipper` open loads, click
    the pencil → change pickup date/budget → **Save** → the row refreshes.
11. Click the trash → confirm → the load disappears (marketplace no longer
    shows it). Try the same buttons on another shipper's load → it can't be
    touched (RLS).

### Invoice access
12. Have a delivered booking; on `/dashboard/shipper` it shows an **Invoice**
    button → navigates to `/tracking/<id>`, where the existing **Download
    invoice** button lives.

### Edge cases
13. **Stale load:** set an open load's `pickup_date` in the past → dashboard
    shows the amber banner + "Pickup passed" badge + "Needs attention" stat;
    edit the date or cancel from there.
14. **Near-duplicate:** post a load identical to an existing open one
    (same route/date/weight) → inline notice + confirm dialog appear; you may
    cancel or proceed.
15. **Low budget:** on post-load, set budget well below typical
    (e.g. ₹2,000 for a 15T Container) → amber soft-warning shows; posting is
    still allowed.
16. **Cancel with transporter:** for a `confirmed`/`in-transit` booking, click
    Cancel → confirmation → booking status becomes **cancelled** (not deleted);
    the truck/load are not hard-deleted.

---

## Verification

- `npm run typecheck` — pass
- `npm run lint` — no warnings/errors
- `npm run build` — clean production build