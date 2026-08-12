# Shipper Dashboard — Dynamic Data Stage

Replaces the shipper dashboard's mock-data reads with real Supabase queries,
scoped to the signed-in shipper via the existing RLS policies. The shipper
dashboard no longer imports from `src/lib/mock-data.ts` (that file is left
intact for the transporter/admin dashboards and other pages).

## What was changed

| File | Change | Description |
| --- | --- | --- |
| `src/app/(app)/dashboard/shipper/page.tsx` | **Redesigned** | Now a `'use client'` page that fetches `loads`, `bookings`, `transactions` and `saved_transporters` for the signed-in shipper and computes every displayed stat from those results. Added skeleton loading states and empty states. |
| `src/app/(app)/post-load/page.tsx` | **Redesigned** | The submit handler now performs a real `INSERT` into `public.loads` for the signed-in shipper (RLS `loads_insert_own` enforces the owner). Demo/no-backend fallback retained. |
| `supabase/migrations/0007_shipper_dashboard_data.sql` | **New** | Adds the missing `saved_transporters` relation + RLS. |
| `docs/CHANGELOG_shipper_dashboard_dynamic.md` | **New** | This document. |

Untouched (per constraints): migrations `0001`–`0004`, middleware, the
role-redirect logic, `src/lib/mock-data.ts`, and the transporter/admin
dashboards.

## Mock-data usages replaced

| Previous mock source | Now backed by |
| --- | --- |
| `loads` (open-loads list + "Open loads" count) | `SELECT ... FROM loads WHERE shipper_id = current shipper` — RLS `loads_select_open_or_own` already guarantees the row belongs to this shipper. Open count = rows with `status = 'open'`. |
| `dashboardStats.shipper[2]` Spend (MTD) | Sum of `debit` transactions for the shipper within the current month (`transactions_select_own_or_admin`). |
| `dashboardStats.shipper[1]` On-time delivery | No underlying tracking/delivery-time calculation exists yet, so it is shown as an honest empty state `—` / "No tracked deliveries yet" rather than a fabricated percentage. |
| `dashboardStats.shipper[0]` / `dashboardStats.shipper[3]` | "Open loads" and "Saved transporters" now computed from real query results (`loads` and `saved_transporters` counts). |
| Spend overview chart (`revenueSeries`) | Real monthly `debit` totals from `transactions`, bucketed over the last 6 months. |
| `trucks` (saved-transporters list) | Real `saved_transporters` rows joined to `profiles` for name/city/rating. |
| `bookings` (recent bookings) | Real `bookings` rows joined to their `loads` for the route/title. |

The page trusts RLS — it queries `loads`/`bookings`/`transactions`/
`saved_transporters` scoped to the shipper and does **not** re-apply manual
`shipper_id = current_profile_id()` filters "just in case" on top of the
policies, nor does it bypass them.

## Post-load insert wiring

Previously `post-load/page.tsx` was a mock no-op (`setTimeout` → toast →
redirect) that never touched the database, so the dashboard could never show a
real load end to end.

Now, when Supabase is configured and the signed-in user is a shipper, the
submit handler `INSERT`s a row into `public.loads` (`shipper_id`, `title`,
`category`, `weight_tons`, `origin_city`, `destination_city`, `pickup_date`,
`budget`, `truck_type_needed`, `status = 'open'`) using the browser client.
The `loads_insert_own` policy (`with check (shipper_id = current_profile_id())`)
accepts the insert, so the new load lands under the current shipper. On
success the user is sent to `/dashboard/shipper` where the freshly posted load
appears. The demo fallback (no backend / non-shipper) keeps the previous
simulated success toast.

## New migration: `0007_shipper_dashboard_data.sql`

Genuine schema gap found: the dashboard needs "a shipper has saved a
transporter", but no column or table existed for it (the old UI faked it from
`trucks`). So this migration adds:

- `public.saved_transporters` — `shipper_id` + `transporter_id` (both FK to
  `profiles`, `ON DELETE CASCADE`), a `unique (shipper_id, transporter_id)`
  guard, and indexes on both columns.
- RLS enabled, with `select`/`insert`/`delete`/`update` policies scoped to
  `shipper_id = current_profile_id()` (mirroring the existing table policies),
  plus an admin override via `is_admin()`.

Migrations `0001`–`0004` are untouched. No other schema change was needed.

## Loading and empty states

- **Loading:** while `useCurrentProfile()` resolves and the first query
  batch runs, the stat grid, chart, open-loads list, saved-transporters list
  and recent-bookings list all render `Skeleton` placeholders — no blank
  sections.
- **Empty states** (a new shipper with zero data):
  - Open loads → "No open loads yet. Post your first load to get started."
  - Saved transporters → "No saved transporters yet. Browse the marketplace…"
  - Recent bookings → "No bookings yet. Once a transporter accepts your load…"
  - Spend overview → "No spend yet. Post a load and match with a transporter…"
  - On-time delivery stat → `—` / "No tracked deliveries yet".
- In demo mode (Supabase env vars unset) the page settles into these empty
  states rather than a spinner, since there is no backend to query.

## Manual test steps

Setup: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` set, a
`profiles` row linked to the auth user with `role = 'shipper'`, migrations
`0001`–`0004` + `0007` applied, `npm run dev`.

1. **New shipper sees empty states.** Sign in as a shipper with no `loads`,
   `bookings`, `transactions` or `saved_transporters`. On `/dashboard/shipper`
   confirm: stats show `0` open loads, `—` on-time, `—` spend, `0` saved; the
   open-loads, saved-transporters, spend-overview and recent-bookings panels
   all show their empty messages (no blank sections). Skeleton placeholders
   appear briefly before settling.
2. **Shipper posts a load and sees it reflected.** From `/dashboard/shipper`
   click **Post a load**, fill the form, submit. Confirm the success toast and
   redirect to `/dashboard/shipper`. On reload the new load appears in the
   **Open loads** list, the **Open loads** stat becomes `1`, and its `debit`
   spend starts appearing in **Spend (MTD)** once a corresponding transaction
   exists.
3. **Another shipper's data never leaks in.** Sign in as shipper A, post a
   load. Sign out, sign in as shipper B (no data). Confirm B's dashboard shows
   empty states and never A's load/spend/bookings — the `loads_select_open_or_own`,
   `transactions_select_own_or_admin`, `bookings_select_parties_or_admin` and
   `saved_transporters_select_own` policies keep each shipper to their own rows.

## Notes

- `src/lib/mock-data.ts` is untouched; transporter/admin dashboards and other
  pages still read from it.
- Transporter/admin dashboards, middleware and the `/dashboard` role redirect
  were not modified.
- If `saved_transporters` has no rows for a shipper, the dashboard shows the
  saved-transporters empty state (there is currently no UI that writes to
  `saved_transporters`; that is out of scope for this stage).
