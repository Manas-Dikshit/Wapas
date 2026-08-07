# Supabase setup — migrations, seed data & RLS policies

This is the deployment guide for the `supabase/` folder in this repo. It
covers what each migration does, the exact order to run them in, and —
specifically — **which RLS policies to deploy and why**.

The Wapas frontend does **not** require any of this to demo — it runs fully
on mock data (`src/lib/mock-data.ts`). Everything below is for when you're
ready to back the product with a real database.

---

## 1. Files in this folder

```
supabase/
  migrations/
    0001_init_schema.sql          Tables, columns, constraints, indexes
    0002_functions_triggers.sql   Auto-provisioning + status-sync triggers
    0003_rls_policies.sql         RLS helper functions + every policy
  seed.sql                        Optional demo rows matching the mock data
```

Supabase migrations run in filename order, which is why they're numbered.
`supabase db push` (or pasting them into the SQL Editor in that order) is
the recommended way to apply them.

---

## 2. Option A — Supabase CLI (recommended)

```bash
npm install -g supabase           # or use npx supabase ... for one-offs
supabase login
cd wapas
supabase link --project-ref <your-project-ref>
supabase db push                  # applies 0001 → 0002 → 0003 in order
supabase db execute --file supabase/seed.sql   # optional demo data
```

## 2b. Option B — Supabase Dashboard SQL Editor

If you don't want to install the CLI: open **SQL Editor** in your Supabase
project and run the contents of each file in this exact order, pasting one
file per query and clicking "Run":

1. `supabase/migrations/0001_init_schema.sql`
2. `supabase/migrations/0002_functions_triggers.sql`
3. `supabase/migrations/0003_rls_policies.sql`
4. *(optional)* `supabase/seed.sql`

---

## 3. Schema overview (`0001_init_schema.sql`)

| Table | Purpose |
|---|---|
| `profiles` | One row per app user (shipper / transporter / admin). Decoupled from `auth.users` via a nullable `auth_user_id` column so the demo/seed data works without real signups — see the note at the top of the file for how to hard-link it once you enable real auth. |
| `trucks` | A transporter's fleet: type, capacity, current/destination city, price, empty-leg flag, status. |
| `loads` | A shipper's cargo posting: weight, route, pickup date, budget, required truck type, status. |
| `bookings` | Links one `load` to one `truck`; denormalizes `shipper_id`/`transporter_id` for simple, fast RLS checks. |
| `transactions` | Wallet ledger (credits/debits) per user, optionally linked to a booking. |
| `notifications` | Per-user notification inbox. |
| `tracking_events` | Timestamped shipment milestones per booking (the data behind the tracking timeline UI). |

---

## 4. Functions & triggers (`0002_functions_triggers.sql`)

- **`handle_new_user()`** — inserts a `profiles` row from
  `raw_user_meta_data` (`full_name`, `company_name`, `role`, `city`) whenever
  a new `auth.users` row is created. The trigger that wires this up
  (`on_auth_user_created`) is included **commented out** — uncomment it only
  after you've added the `auth_user_id` foreign key described in
  `0001_init_schema.sql`, so you don't get orphaned profile rows while
  testing.
- **`handle_new_booking()`** — trigger on `bookings` insert: flips the
  matched `truck` and `load` to `booked`, and drops a notification for both
  parties. This is what keeps marketplace listings accurate without extra
  application-side bookkeeping.
- **`handle_booking_status_change()`** — trigger on `bookings` status
  update: when a booking becomes `delivered`, frees the truck back to
  `available`, marks the load `delivered`, logs a final `tracking_events`
  row, and notifies the shipper.
- **`backhaul_match_score(...)`** — a plain SQL function scoring 0–100 based
  on same-city pickup, truck-type fit, and empty-leg status. This is the
  reference implementation for the "AI match %" shown throughout the UI —
  swap it for a real model later without changing the RLS or schema.

---

## 5. RLS policies — what to deploy (`0003_rls_policies.sql`)

**Deploy this whole file.** It's written to be applied as one unit: it first
creates two `SECURITY DEFINER` helper functions, then enables RLS on every
table, then adds the policies. Below is *why* each one exists, in case you
need to adapt it.

### Helper functions (deploy these first — the policies depend on them)

```sql
public.current_profile_id()  -- maps auth.uid() → the caller's profiles.id
public.is_admin()            -- true if the caller's profile role = 'admin'
```

Both are `SECURITY DEFINER` so they can read `profiles` regardless of the
caller's own row visibility, and `STABLE` so Postgres can cache the result
within a single query. Every policy below calls one or both of these instead
of repeating the same subquery everywhere.

### Policy summary by table

| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `profiles` | any authenticated user (needed to show names on listings/bookings) | only your own row | your own row, or admin | admin only |
| `trucks` | `status = 'available'` (public marketplace), or your own fleet, or admin | your own (`transporter_id = current_profile_id()`) | your own, or admin | your own, or admin |
| `loads` | `status = 'open'` (public marketplace), or your own postings, or admin | your own (`shipper_id = current_profile_id()`) | your own, or admin | your own, or admin |
| `bookings` | either party on the booking, or admin | either party (so both the shipper's "book now" and a transporter's "accept" flow can create it) | either party, or admin | admin only |
| `transactions` | your own wallet rows, or admin | your own, or admin | admin only | admin only |
| `notifications` | your own inbox, or admin | admin only from the client — regular notifications are inserted by the `SECURITY DEFINER` trigger functions in `0002`, which bypass RLS | your own (e.g. marking read) | your own |
| `tracking_events` | shipper or transporter on the parent booking, or admin | the transporter on the parent booking, or admin | admin only | admin only |

### Why marketplace tables (`trucks`, `loads`) partially expose data

`trucks` and `loads` intentionally allow **any signed-in user** to `select`
rows that are `available`/`open` — that's the entire point of a marketplace;
a shipper needs to browse trucks they don't own, and vice versa. Rows that
aren't in that public state (booked, in-transit, maintenance, delivered) are
only visible to their owner or an admin, so a transporter's historical fleet
data isn't broadcast to competitors.

### Testing the policies

After deploying, verify with the Supabase dashboard's **"Run as user"**
feature (or the CLI's local dev environment) that:

1. A logged-out (anon) request to any table returns zero rows — nothing has
   an anon policy, so everything requires `authenticated`.
2. A transporter can `select` their own trucks in any status, but only
   `available` trucks belonging to others.
3. A shipper cannot `update` another shipper's `loads` row.
4. Neither party can read the other side's `transactions`.

---

## 6. Regenerating TypeScript types

`src/lib/supabase/types.ts` is hand-written to mirror the schema above so
the project type-checks without the Supabase CLI installed. Once your
project is linked, regenerate the authoritative version with:

```bash
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

---

## 7. Connecting the frontend

1. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   **Project Settings → API** in the Supabase dashboard.
2. `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts`
   (server components / route handlers) both return `null` until those env
   vars are set — so the app keeps working on mock data until you're ready.
3. Migrate one page at a time: replace the relevant import from
   `src/lib/mock-data.ts` with a query through `createClient()` /
   `createServerSupabaseClient()`. Because RLS mirrors the mock data's shape
   (same fields, same ownership rules), the UI components don't need to
   change — only the data-fetching layer does.
