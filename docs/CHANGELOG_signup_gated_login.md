# Signup-Gated Login Stage

Blocks login for unregistered users. Previously `login`'s `signInWithOtp()`
implicitly created an account for any submitted email (`shouldCreateUser`
defaults to `true`), so there was no real signup requirement. Now login is
strictly for existing users and directs unknown emails to `/register`, while
`register` explicitly (and only) creates accounts.

## Files changed (before → after)

| File | Change | Before | After |
| --- | --- | --- | --- |
| `src/app/login/page.tsx` | Gate login to existing users | `signInWithOtp` options had no `shouldCreateUser`, so any email got auto-registered. All errors surfaced as the generic `"Couldn't send sign-in link"` toast. | Adds `shouldCreateUser: false` in the OTP options. A new `isSignupRequired()` helper detects the "user not found"/signup-disallowed error and shows a clear `"Account not found"` toast directing the visitor to sign up (instead of the generic message). Other errors keep the original generic toast. |
| `src/app/register/page.tsx` | Make signup creation explicit | `signInWithOtp` implicitly created the user (`shouldCreateUser` defaulted to `true`) with the role/metadata payload. | Adds `shouldCreateUser: true` so account creation on register is explicit and intentional. **No other logic change** — field collection, role selection, and the `data` metadata payload are untouched. |
| `src/components/landing/hero.tsx` | CTA label | `Get started free` | `Sign up` (same button/variant, still links to `/register`) |
| `src/components/landing/navbar.tsx` | CTA labels | Desktop `Get started free`; mobile menu `Get started` | Both → `Sign up` (same variants, still link to `/register`) |
| `src/components/landing/more-sections.tsx` | Bottom CTA label | `Create free account` | `Sign up` (same variant, still links to `/register`) |
| `docs/CHANGELOG_signup_gated_login.md` | New | — | This document |

No surrounding copy elsewhere assumed the old "free"/"Get started" wording, so
only the button labels changed; no other landing text was modified.

## The `shouldCreateUser` change, in detail

- **Login** now passes `shouldCreateUser: false`. This is what actually gates
  signup: when the email has no existing `auth.users` row, Supabase refuses to
  send the OTP and returns an error rather than silently creating a user.
  Login then detects that signup-required error and shows:

  - Title: `Account not found`
  - Description: `No Wapas account uses <email>. Please sign up to create one.`

  This replaces the previous generic failure toast for that case. All other
  (genuine) errors still show `"Couldn't send sign-in link"` with the original
  `error.message`.

- **Register** now passes `shouldCreateUser: true`, making the previously
  implicit auto-signup explicit and intentional. The `data` metadata payload
  (`full_name`, `company_name`, `role`, `city`) is unchanged, so
  `handle_new_user()` (0004) still populates the `profiles` row exactly as
  before.

## Migration

**None required.** This is a client-side auth option change
(`shouldCreateUser`), not a schema change. The `profiles` / `auth.users`
schema and the `handle_new_user()` trigger (0001–0004) are already correct and
are untouched. RLS, middleware, the dashboard-redirect logic, and the
mock-data fallback path are all unchanged. Per constraints, no no-op migration
was added.

## Manual test cases

Setup: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured,
Supabase email OTP enabled, and the migrations applied. Start with `npm run dev`.

### (a) Existing user logs in successfully

1. Have a registered user (email already present in `auth.users`, linked to a
   `profiles` row).
2. Go to `/login`, enter that email, click **Send sign-in link**.
3. Expect: a success toast `Sign-in link sent`, then the "Check your email"
   state. Opening the link completes login and routes to the role dashboard.

### (b) Non-existent email is blocked with a clear redirect-to-signup message

1. Go to `/login`.
2. Enter an email that has **no** existing account (never registered).
3. Click **Send sign-in link**.
4. Expect: **no** OTP is sent and **no** account is created; instead an
   `Account not found` toast appears — `No Wapas account uses <email>. Please
   sign up to create one.` — pointing the user to `/register` (also reachable
   via the existing "New to Wapas? Create an account" link).
5. Confirm no `auth.users` row was created for that email.

### (c) New user signs up successfully via register

1. Go to `/register` (via the hero/navbar/bottom **Sign up** buttons, all of
   which now link to `/register`).
2. Pick a role, fill the fields, and submit.
3. Expect: a success toast `Verification link sent`, then the "Check your
   email" state. Opening the link creates the `auth.users` row and the linked
   `profiles` row (via `handle_new_user()`), and signs the user in to their
   role dashboard.
4. Confirm the same email can now log in through `/login` (case a), i.e.
   signup-gating doesn't block legitimately registered users.

### Regression: demo mode (no Supabase)

With Supabase env vars unset, both login and register keep their existing
graceful `"Supabase isn't configured"` toasts — unchanged.
