# Different Dashboard Integration Stage

Role-based dashboard routing for Wapas. After login, each role lands on its
own dashboard instead of the single shared `/dashboard` page.

## What was added / changed

| File | New / Redesigned | Description |
| --- | --- | --- |
| `src/app/(app)/dashboard/page.tsx` | **Redesigned** | Now a thin client redirector. Reads `useCurrentProfile()` and `router.replace()`s to the role dashboard. Was previously the shared (transporter-leaning) dashboard. |
| `src/app/(app)/dashboard/transporter/page.tsx` | **New** (moved content) | The previous `/dashboard` content, now role-scoped to transporters: revenue overview + fleet utilization charts, `RecentBookings`, `AiRecommendations`, KYC banner. |
| `src/app/(app)/dashboard/shipper/page.tsx` | **New** | Shipper view: spend stats (`StatCard`), spend overview chart, open loads, saved transporters, post-a-load CTAs, `RecentBookings`. |
| `src/app/(app)/dashboard/admin/page.tsx` | **New** (moved content) | The admin panel content moved verbatim from `/admin`. |
| `src/app/(app)/admin/page.tsx` | **Redesigned** | Backwards-compatible alias — server-side `redirect('/dashboard/admin')`. Any existing `/admin` links/bookmarks keep working. |
| `docs/CHANGELOG_role_dashboards.md` | **New** | This document. |

No existing components were rebuilt. The dashboards reuse `StatCard`,
`RevenueChart`, `UtilizationChart`, `RecentBookings` and `AiRecommendations`,
plus the `Badge` / `Avatar` / `buttonVariants` UI primitives and `mock-data`
sources already present. New sections (open loads, saved transporters,
post-load CTAs) are thin compositions over existing `mock-data` and UI
primitives, styled to match the existing dashboard surface.

## Redirect logic chosen — and why

**Client-side via `useCurrentProfile()`** (not middleware).

- It reuses the exact hook the rest of the app already uses, so there is **no
  duplicated profile-fetch/logic** (the middleware would have had to re-query
  `profiles` by `auth_user_id` a second time).
- Loading/non-profile semantics already handled by the hook are applied
  directly: while the profile resolves we render a neutral `Skeleton`;
  if the role is missing or unknown we fall back to `/dashboard/shipper`
  (never an error page). This matches how `useCurrentProfile()` returns
  `null`/`loading` elsewhere.
- It degrades cleanly in the repo's demo mode. When Supabase env vars are
  unset, `useCurrentProfile()` returns the mock transporter profile, so
  `/dashboard` → `/dashboard/transporter` still works without a backend.
  (A middleware-based redirect would no-op in demo mode because
  `updateSession` returns early when Supabase isn't configured, which would
  break the local demo flow.)
- Middleware's existing protected-route logic is **untouched** — `/dashboard`
  and its sub-paths stay behind auth as before. No middleware change was
  needed or made.

Mapping used by the redirector: `shipper → /dashboard/shipper`,
`transporter → /dashboard/transporter`, `admin → /dashboard/admin`.

## Migration

**None required.** `profiles.role` already exists with the exact
`('shipper', 'transporter', 'admin')` constraint from `0001_init_schema.sql`,
and `auth_user_id` has a unique index already, so the role lookup used by
`useCurrentProfile()` needs no new schema. Per constraints, no no-op migration
was added. `0001`–`0004` are untouched.

## How to test each role flow end to end

Setup: ensure `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
set, a user is linked to a row in `profiles`, and start the dev server
(`npm run dev`). In demo mode (env unset) the redirector falls back to the mock
transporter profile.

1. **Shipper**
   - Sign in as a user whose `profiles.role = 'shipper'` and visit `/login` →
     middleware sends signed-in users to `/dashboard`, which redirects to
     `/dashboard/shipper`.
   - Confirm the shipper surface shows: open loads, post-a-load CTA, saved
     transporters, and spend stats.
   - Visit `/dashboard` directly while signed in → confirms it bounces to
     `/dashboard/shipper`.

2. **Transporter**
   - Sign in as a user whose `profiles.role = 'transporter'` and visit
     `/dashboard` → redirects to `/dashboard/transporter`.
   - Confirm revenue overview, fleet utilization, recent bookings and AI
     recommended loads render.

3. **Admin**
   - Sign in as a user whose `profiles.role = 'admin'` and visit `/dashboard`
     → redirects to `/dashboard/admin`.
   - Confirm user management, fraud & disputes and system health render.
   - Visit `/admin` directly → confirms it still works (redirects to
     `/dashboard/admin`) for backwards compatibility.

Edge cases:
- While the profile is still loading you should see the neutral skeleton
  (no layout jump / error).
- A signed-in user with no linked `profiles` row (role missing/unknown) falls
  back to `/dashboard/shipper` rather than erroring.
- Unauthenticated access to any `/dashboard/*` is still blocked by the
  existing middleware protected-route logic.