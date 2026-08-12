# Transporter Dashboard — Dynamic Data Stage

Replaces the transporter dashboard's mock-data reads with real Supabase
queries, scoped to the signed-in transporter. The dashboard page no longer
imports from `src/lib/mock-data.ts` for its data, and the shared chart/widget
components it uses now accept the fetched data as props instead of hardcoding
mock series internally. `src/lib/mock-data.ts` itself is untouched — the admin
dashboard, analytics page, marketplace, wallet and other pages still read from
it.

## What was changed

| File | Change | Description |
| --- | --- | --- |
| `src/app/(app)/dashboard/transporter/page.tsx` | **Redesigned** | Now a `'use client'` page that fetches `trucks`, `bookings`, `transactions` and `load_recommendations` for the signed-in transporter and computes every displayed stat from those results. Added a "Your fleet" panel with real truck registration (INSERT into `trucks`). Skeleton loading states and empty states for every section. |
| `src/components/dashboard/charts.tsx` | **Prop-wired** | `RevenueChart` and `UtilizationChart` now accept a `data` prop (backwards-compatible — default to the existing mock series, so the analytics page is unaffected). |
| `src/components/dashboard/widgets.tsx` | **Prop-wired** | `RecentBookings` and `AiRecommendations` now accept `bookings` / `loads` props (backwards-compatible — default to mock data) and render an empty state when handed an empty array. |
| `supabase/migrations/0008_transporter_dashboard_data.sql` | **New** | Adds the `public.load_recommendations` view that applies the existing `backhaul_match_score()` function across open loads × available trucks. |
| `docs/CHANGELOG_transporter_dashboard_dynamic.md` | **New** | This document. |

Untouched (per constraints): migrations `0001`–`0007`, middleware, the
role-redirect logic, `src/lib/mock-data.ts`, and the shipper/admin dashboards.

## Mock-data usages replaced

| Previous mock source | Now backed by |
| --- | --- |
| `currentProfile` (header greeting) | `useCurrentProfile()` — the real signed-in profile. |
| `dashboardStats.transporter[0]` Active trips (mock `6`) | Count of the transporter's own `bookings` with `status` in (`confirmed`, `in-transit`). |
| `dashboardStats.transporter[1]` Fleet utilization (mock `82%`) | Percentage of own `trucks` that are `booked`/`in-transit` out of the total fleet; `—` when there are no trucks. |
| `dashboardStats.transporter[2]` Revenue (MTD) (mock `₹3.02L`) | Sum of the transporter's `credit` `transactions` in the current calendar month. |
| `dashboardStats.transporter[3]` Fuel savings (mock `₹41,200`) | No underlying "fuel savings via backhaul match" source exists in the schema, so this is an honest empty state: `—` / "No backhaul savings yet" — no invented number. |
| Revenue overview chart (`RevenueChart` → `revenueSeries`) | Real monthly `credit` totals from `transactions`, bucketed over the last 6 months, passed to `RevenueChart` as `data`. |
| Fleet utilization pie (`UtilizationChart` → `utilizationSeries`) | Real distribution of the transporter's own trucks by `status` (In transit / Booked / Available / Maintenance), passed to `UtilizationChart` as `data`. |
| `bookings` (recent bookings) | Real `bookings` rows joined to their `loads` (title + route) and `trucks` (reg number), mapped to the widget prop shape. |
| `loads` flagged `aiRecommended` (AI recommended loads) | Real `load_recommendations` view rows — open loads scored with `backhaul_match_score()` (see below), mapped to the widget prop shape. |

The page queries `trucks`, `bookings`, `transactions` and
`load_recommendations` scoped to the signed-in transporter and does **not**
re-apply manual `transporter_id = current_profile_id()` checks client-side as a
substitute for RLS.

One note on the `.eq(...)` filters, which mirror the shipper stage exactly: the
policies are intentionally *broader* than "only my rows" — `trucks_select_available_or_own`
exposes other transporters' `available` trucks to the marketplace, so the
fleet query's `.eq('transporter_id', profile.id)` is the application-level
"my fleet" scoping (the same role the shipper page's `.eq('shipper_id', ...)`
plays). RLS remains the security backstop: a transporter can never read
another transporter's non-available trucks, bookings, or transactions, and the
dashboard never receives them.

## Stats computed from real query results

- **Active trips** = own bookings with `status` in (`confirmed`, `in-transit`); delta shows how many are in transit.
- **Fleet utilization %** = `(booked + in-transit) / total own trucks × 100`; `—` with "No trucks yet" when the fleet is empty.
- **Revenue MTD** = sum of `credit` transactions this month; delta compares against last month's credits (or "This month" / "No revenue yet").
- **Fuel savings** = `—` / "No backhaul savings yet" — no real data source exists, so the value is never fabricated.
- **Revenue overview** = 6-month buckets of `credit` totals.
- **Fleet utilization pie** = status breakdown of own trucks.

## Shared-component prop changes (why they stay backwards-compatible)

- `RevenueChart({ data })` / `UtilizationChart({ data })` in `charts.tsx`: when
  `data` is omitted they fall back to the imported `revenueSeries` /
  `utilizationSeries` mock series, so the analytics page (which calls them with
  no props) renders exactly as before.
- `RecentBookings({ bookings })` / `AiRecommendations({ loads })` in
  `widgets.tsx`: when the prop is omitted they fall back to the existing mock
  `bookings` / a mapped slice of mock `loads` (preserving the previous fake
  `92 − i·3` match percentages). `RecentBookingItem.vehicleNumber` is optional
  because the real `bookings → trucks` join can be null. Both widgets now also
  render a dashed empty-state message when handed an empty array; these two
  widgets are only consumed by the transporter dashboard, so no other page is
  affected.

## `backhaul_match_score()` usage for AI recommendations

The "AI recommended loads" panel no longer uses the mock `aiRecommended` flag.
Instead it queries the new `public.load_recommendations` view, which is built
in SQL around the existing `backhaul_match_score()` function from
`0002_functions_triggers.sql` — the matching logic is **not** reimplemented in
the frontend.

```
match_score = backhaul_match_score(
  truck.current_city, truck.type, truck.empty_leg,
  load.origin_city, coalesce(load.truck_type_needed, truck.type)
)
```

- The view cross-joins open `loads` × available `trucks`, keeps the
  best-scoring truck per load (`distinct on (l.id)`), and exposes
  `transporter_id` + `match_score` as columns.
- The dashboard queries it with `.eq('transporter_id', profile.id)` and orders
  by `match_score desc`, taking the top 3 loads.
- `security_invoker = true` (Postgres 15+) means the base tables' RLS still
  applies as the calling user: `loads` restricts to `status = 'open'` and
  `trucks` to "available or own", so a transporter only ever receives scores
  against their **own** fleet (see `grant select` in the migration so
  PostgREST exposes the view).

## Truck-write wiring

Finding: there was **no** truck registration/edit UI anywhere — the profile
page only edits `profiles`, and no trucks-management page exists — so the
dashboard could never show a real truck end to end.

To close that gap the transporter dashboard now has a "Your fleet" panel with a
**Register truck** button and an inline form. On submit it `INSERT`s into
`public.trucks` (`transporter_id = profile.id`, `reg_number`, `type`,
`capacity_tons`, `current_city`, `destination_city`, `available_from`,
`price_per_ton`, `empty_leg`, `status = 'available'`) using the browser
client. The `trucks_insert_own` policy (`with check (transporter_id =
current_profile_id())`) accepts the insert, so the row lands under the current
transporter. On success the panel refetches and the new truck appears in the
fleet list, the utilization pie and the fleet stats. The demo fallback (no
Supabase configured) keeps a simulated-success toast.

## New migration: `0008_transporter_dashboard_data.sql`

Genuine schema gap found: `backhaul_match_score()` exists, but there is no
relation the client can query that applies it across a transporter's trucks ×
open loads with an ordering — a plain PostgREST table query cannot express the
correlated cross-product. The migration adds `public.load_recommendations`, a
`security_invoker` view (so RLS is not bypassed), plus a `grant select` so the
authenticated role can query it. Migrations `0001`–`0007` are untouched.

## Loading and empty states

- **Loading:** while `useCurrentProfile()` resolves and the first query batch
  runs, the stat grid, revenue chart, utilization panel, fleet list, recent
  bookings and AI recommendations all render `Skeleton` placeholders — no
  blank sections.
- **Empty states** (a new transporter with zero data):
  - Fleet / stats → "No trucks yet. Register your first truck to start
    receiving load matches." and stat values `—` where there's nothing to
    compute.
  - Fleet utilization → "Register a truck to see your fleet utilization here."
  - Revenue overview → "No revenue yet. Payouts for delivered bookings will
    appear here."
  - Recent bookings → "No bookings yet. Once a shipper books your truck, it
    will appear here."
  - AI recommended loads → "No matching loads right now. Backhaul loads that
    fit your fleet will show up here as they're posted."
  - Fuel savings → `—` / "No backhaul savings yet".
- In demo mode (Supabase env vars unset) the page settles into these empty
  states rather than a spinner, since there is no backend to query.

## Manual test steps

Setup: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` set, a
`profiles` row linked to the auth user with `role = 'transporter'`, migrations
`0001`–`0004` + `0007` + `0008` applied, `npm run dev`.

1. **New transporter sees empty states.** Sign in as a transporter with no
   `trucks`, `bookings` or `transactions`. On `/dashboard/transporter` confirm:
   stats show `0` active trips, `—` utilization, `—` revenue, `—` fuel savings;
   the fleet, fleet-utilization, revenue-overview, recent-bookings and
   AI-recommendations panels all show their empty messages (no blank
   sections). Skeleton placeholders appear briefly before settling.
2. **Transporter adds a truck and sees it reflected.** On
   `/dashboard/transporter` click **Register truck**, fill the form, submit.
   Confirm the success toast. The new truck appears in **Your fleet**, the
   fleet count stat updates to `1`, and the fleet-utilization pie renders
   (100% Available).
3. **Another transporter's fleet/revenue never leaks in.** Sign in as
   transporter A, register a truck and (if bookings/transactions exist for A)
   note A's trips and revenue. Sign out, sign in as transporter B (no data).
   Confirm B's dashboard shows only B's fleet/revenue (empty states if B has
   none) and never A's trucks, bookings or payouts — `trucks_select_available_or_own`
   (own rows regardless of status) combined with the dashboard's own-fleet
   scoping, plus `bookings_select_parties_or_admin`,
   `transactions_select_own_or_admin` and the RLS-enforced
   `load_recommendations` view, keep each transporter to their own rows.

## Notes

- `src/lib/mock-data.ts` is untouched; the admin dashboard, analytics page,
  marketplace, wallet, bookings and other pages still read from it.
- The shipper/admin dashboards, middleware and the `/dashboard` role redirect
  were not modified.
- Truck **editing** (updating an existing truck's fields) is not wired up — no
  such UI existed before and adding it is out of scope for this stage. The
  dashboard is a read consumer of `trucks` plus the new register-write path.
