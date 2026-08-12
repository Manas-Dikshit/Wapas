# Admin Dashboard — Dynamic Data & Single-Admin Lock

This stage does two things: (1) **fixes a privilege-escalation security hole** at
the database-trigger level so only one specified email can ever be an admin, and
(2) replaces the admin dashboard's mock reads (`src/lib/mock-data.ts`) with real
Supabase queries, with loading/empty states matching the earlier shipper and
transporter dynamic-data stages.

## Files changed

| File | Change |
| --- | --- |
| `supabase/migrations/0009_single_admin_lock.sql` | **New.** Rewrites `handle_new_user()` (server-side role), plus a one-time explicit promote/demote data-fix. No edits to `0001`–`0008`. |
| `src/lib/admin.ts` | **New.** The single shared constant for the locked admin email, referenced by the client-side guard. |
| `src/app/(app)/dashboard/admin/page.tsx` | **Rewritten.** Real queries, a defense-in-depth guard, loading + empty states. No longer imports `adminStats`/mock users. |
| `docs/CHANGELOG_admin_dashboard_lock.md` | **New.** This document. |

Untouched (per constraints): migrations `0001`–`0008`, all RLS policies,
middleware, the `/dashboard` role redirect, the shipper/transporter dashboards,
and `src/lib/mock-data.ts`.

## The security issue found

`handle_new_user()`'s trigger writes the new profile's role straight from the
caller-supplied metadata:

```sql
coalesce(new.raw_user_meta_data ->> 'role', 'shipper')
```

`raw_user_meta_data` is whatever a caller passes as `options.data` to
`supabase.auth.signInWithOtp()` / `signUp()`. Anyone could ignore the register
UI and call `signInWithOtp` directly with `data: { role: 'admin' }`; the trigger
would create a `role = 'admin'` profile row, and `is_admin()` (0003) — which
just checks `role = 'admin'` on the caller's row — would then grant full
platform-admin powers (delete any profile, view every booking/transaction, etc.).

Frontend checks would be bypassable, so the fix lives in the DB trigger.

## The exact trigger fix

`0009` replaces `handle_new_user()` so the role is **decided server-side**:

1. `lower(new.email) = 'manasdikshit48@gmail.com'` → role `'admin'` (the *only*
   admin).
2. Otherwise, the metadata role is used **only if** it is `'shipper'` or
   `'transporter'`.
3. Anything else — no role, `'admin'`, or an unknown value — falls back to
   `'shipper'`.

So `'admin'` from metadata is impossible for every other email, and the trigger
no longer trusts any client-supplied role for security decisions. `is_admin()`
(0003) is intentionally unchanged: with these rules in force, `role = 'admin'`
can only ever be true on the locked email, so the existing check already means
"the locked admin".

## One-time data-fix (promote / demote)

The migration also runs two explicit, auditable `UPDATE`s sealed into the
migration history:

- **Promote:** any existing `profiles` row with `email = 'manasdikshit48@gmail.com'`
  that isn't already admin is raised to `role = 'admin'`.
- **Demote:** every *other* row still at `role = 'admin'` is dropped to
  `role = 'shipper'`. This intentionally also catches rows with a `NULL` email
  (e.g. the seed's `'Admin User'`, which has no auth link) — such rows cannot be
  verified as the locked account, so they are conservatively demoted.

**Why it's safe/reversible:** both statements are idempotent and only touch
`role`; no rows are deleted and no other columns change. Their exact reverse is
a trivial `UPDATE profiles SET role = ...` (restore the demoted row(s) to
`admin` and, if ever needed, drop the locked email back to `shipper`). Because
they live as explicit statements in the migration file rather than in app code,
they are reviewable in git history and run exactly once at migration time.

## Dynamic data — `adminStats` and mock usages replaced

| Previous mock source | Now backed by |
| --- | --- |
| `adminStats[0]` Total users (`+412` fake delta) | `COUNT(*)` over `public.profiles` (`select(..., { count: 'exact', head: true })`). Delta now a neutral label. |
| `adminStats[1]` Active fleet (`6,904` fake) | `COUNT(*)` over `public.trucks` where `status IN ('available','booked','in-transit')`. |
| `adminStats[2]` GMV (MTD) (`₹4.7Cr` fake) | Sum of `bookings.amount` whose `created_at` falls in the current month. Shown as `— | No bookings yet` when none. |
| `adminStats[3]` / panel "Fraud & disputes" | **Left as "not yet tracked"** (see below). |
| Panel "System health" `systemChecks` | **Left as "not yet tracked"** (see below). |
| Inline `users` mock table (name/role/trips/joined/status) | Real `profiles` rows: name/company, `role`, transporter-side `bookings` count join, `created_at` → formatted join month/year, and status derived from `verified` + `kyc_status` (Active / Pending / Under review). |

The page queries through the normal browser client and trusts RLS — it does not
add manual `WHERE` filters "just in case", nor does it bypass the policies. An
admin's `is_admin()` already grants read access to `profiles`, `trucks`,
`bookings`, `transactions` etc. via the existing policies, so the aggregate
counts and the user list are naturally platform-wide.

## Stats intentionally left as "not yet tracked"

- **Fraud & disputes** — there is no `disputes` table (or equivalent) anywhere
  in the schema (`0001`–`0008`), and the task scope forbids inventing fake
  numbers or adding speculative new tables. Shown as an honest empty-state note
  rather than fabricated counts.
- **System health** — there is no monitoring/heartbeat schema backing service
  health checks. Shown as an empty-state note; a real implementation would need
  a new tracked table, which is out of scope for this stage.

Both panels keep their existing headers/icons but render a clear "not yet
tracked" message instead of the hardcoded list.

## Defense-in-depth guard (#4)

`useCurrentProfile()` already gates the page to admins, and the DB trigger in
`0009` is the real enforcement. As an extra, unbypassable-by-UI layer, the admin
page additionally resolves the signed-in account's email (`supabase.auth.getUser()`)
and, if the role is `admin` **but** the email isn't the locked address
(referenced via the single shared constant `LOCKED_ADMIN_EMAIL` in
`src/lib/admin.ts`), it redirects to `/dashboard/shipper` before rendering any
admin data. If Supabase isn't configured (demo mode) the page simply settles into
the empty/undefined states like the other dashboards.

Per the constraint, `src/lib/admin.ts` is the **only** frontend file naming the
locked email — nothing about the address is scattered elsewhere.

## Loading and empty states

- **Loading:** while the profile resolves and the query batch runs, the stat
  grid and the user table render `Skeleton` placeholders — no blank sections.
- **Empty states:**
  - User table with zero profiles → "No users yet — shippers and transporters
    will appear here as they sign up."
  - GMV (MTD) with no current-month bookings → `₹0` / "No bookings yet".
  - Fraud & disputes → "not yet tracked" empty note.
  - System health → "not yet tracked" empty note.
- In demo mode (Supabase env vars unset) the page settles into these empty
  states rather than a spinner.

## Manual test steps

Setup: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` set,
migrations `0001`–`0009` applied, `npm run dev`.

1. **Locked email signs up / logs in and lands on a real admin dashboard.** Sign
   up or log in as `manasdikshit48@gmail.com` (any role chosen at signup is
   ignored). Confirm it lands on `/dashboard/admin`, the stat cards show real
   counts/`₹` GMV from the tables, the user table lists real `profiles`, and the
   disputes/system-health panels show the "not yet tracked" empty notes.
2. **Any other email that attempts `role: 'admin'` via metadata is silently
   forced to shipper.** Using the Supabase client directly,
   `auth.signInWithOtp({ email: 'someone@else.com', options: { data: { role: 'admin' } } })`
   and completing the link. Confirm the created `profiles.role` is `shipper`
   (NOT `admin`), the user cannot reach `/dashboard/admin`, and is_admin()/
   RLS never grants admin powers.
3. **An existing non-locked admin row gets demoted correctly.** Before applying
   `0009`, create a profile (e.g. via the seed's `'Admin User'` or any row with
   `role = 'admin'` and a different/`NULL` email). Apply `0009` and confirm that
   row is now `shipper`, while the row for `manasdikshit48@gmail.com` (if it
   pre-existed) is `admin`.
4. **A normal shipper/transporter still works.** Sign up as a fresh shipper and
   transporter; both land on their own dashboards as before and cannot view
   admin data.

## Notes

- `src/lib/mock-data.ts` is untouched; `adminStats` and the admin mock users are
  simply no longer imported by the admin dashboard.
- `is_admin()` and every RLS policy are unchanged; no bypass/duplicate filters
  were added.
- Only the admin dashboard and the one new migration were modified for this
  feature.