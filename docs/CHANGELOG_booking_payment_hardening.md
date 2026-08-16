# Booking & Payment Flow — Production Hardening

## Scope
Replaces the mocked booking/payment with a self-contained, DB-enforced wallet/escrow
ledger. No payment gateway and no new API key — escrow runs on the existing
`transactions` table so a real gateway can be dropped in later without changing the
booking/transactions schema.

**Files changed**
- `supabase/migrations/0012_booking_payment_hardening.sql` (new — highest existing was `0011`)
- `src/app/(app)/booking/[id]/page.tsx` (real-mode Pay)
- `src/app/(app)/wallet/page.tsx` (real balance + ledger)
- `docs/CHANGELOG_booking_payment_hardening.md` (this file)

Untouched: all prior migrations, RLS policies, `mock-data.ts`, middleware, other dashboards.

## Escrow model
| Event | Ledger effect |
|-------|---------------|
| **Book** | Debit the **shipper** full amount, `method='Escrow'`, `status='success'`, `booking_id` set |
| **Deliver** | Credit the **transporter** `amount − 2%` + a `Platform fee` credit (2%) to the admin profile, both `booking_id`-linked |
| **Cancel** | Credit the **shipper** back the full amount (refund), revert truck→`available`, load→`open` |

Balance is never stored. `wallet_balance(profile_id)` sums successful credits minus
debits, so there is no denormalized column to go stale.

## New function / trigger — extends, does not duplicate
The existing `handle_booking_status_change` AFTER-UPDATE trigger is extended via
`create or replace function` (the established pattern from `0004`), **not** re-created
as a second trigger. Same for `handle_new_booking`, which now also debits the shipper
into escrow on every booking insert — so the transporter-dashboard "accept a load"
path gets escrow debiting for free with zero client duplication.

## DB-level guards (both enforced server-side; client only pre-checks)
1. **Insufficient balance** — `enforce_sufficient_balance()` BEFORE INSERT on
   `transactions`: rejects any debit that would take the user's balance below zero,
   raising `insufficient_wallet_balance`. It serializes on the user's profile row
   (`select ... for update`) so two concurrent debits can't both pass.
2. **Double-booking** — partial unique index `bookings_one_active_per_load_idx`
   (one non-cancelled booking per `load_id`, race-proof) **plus** `enforce_booking_guards()`
   BEFORE INSERT on `bookings` that rejects non-`available` trucks (`truck_not_available`)
   and already-booked loads (`already_booked`) with friendly messages.

### Error surfacing in the UI (`booking/[id]/page.tsx`)
| Failure | UI toast |
|---------|----------|
| Balance pre-check fails (RPC) | `Insufficient wallet balance` — "Add funds to your wallet before booking." |
| `insufficient_wallet_balance` from DB | `Insufficient wallet balance` — same |
| `already_booked` / `truck_not_available` | `This load is already booked` — "It has been taken by another transporter." |
| Unique-violation on the index | `Already booked` — "This load can only be booked once." |
| `failed to fetch` / network | `Could not reach the server` — "Check your connection and try again." |
| Everything else | `Couldn't complete booking` with the raw message |

The Pay button is disabled while pending (`processing`) for double-click, and the
double-booking guards are the real backstop.

## Real booking creation (`/booking/[id]`)
In live mode (Supabase env + signed in), Pay resolves the missing side from the DB
instead of simulating success:
- **Booking a load** → signed-in transporter; truck = first `available` truck of the
  transporter matching the load's `truck_type_needed` (else any available); shipper =
  `load.shipper_id`; amount = `load.budget`.
- **Booking a truck** → signed-in shipper; load = their most recent `open` load;
  transporter = `truck.transporter_id`; amount = `price_per_ton × capacity_tons`.

Each throws a specific toast when unresolvable (no compatible truck / no open load).
The booking INSERT fires the escrow debit trigger; if the shipper's balance is short,
the whole insert aborts atomically.

## Wallet page
Replaces the hardcoded `84250` balance and mock ledger with `wallet_balance()` RPC +
a `transactions` select scoped to the signed-in user (existing RLS). Summary tiles
(Earned MTD / Spent MTD / In escrow) are now derived from the real ledger in live
mode. The mock escrow-payout panel shows only in demo (non-live) mode.

## Manual test steps
1. **Successful booking end-to-end**
   - Post an `open` load, add an `available` truck, top up the shipper's wallet above
     the load budget.
   - From the load detail → Pay. Booking is created; shipper wallet is debited the full
     amount (`Escrow hold for booking`, success); wallet page shows the debit.
   - Advance booking → `delivered`. Transporter wallet is credited `amount − 2%`
     (`Payout for booking`) and the admin profile receives the `Platform fee` (2%);
     truck back to `available`, load `delivered`.
2. **Insufficient-balance rejection** — with a wallet below the amount, Pay shows
   `Insufficient wallet balance`; no booking/transaction rows are written.
3. **Double-booking rejection** — after a booking exists on a load, booking it again
   (or clicking Pay twice) shows `This load is already booked`; the truck-availability
   guard also rejects booking a truck that's already `booked`.
4. **Cancellation refund** — set a booking → `cancelled`. Shipper is credited the full
   amount back (`Booking refund`), truck → `available`, load → `open`; the load can be
   re-booked.

## Notes / simplifications
- Platform fee is credited to the admin profile (no dedicated platform account exists);
  introduce a real platform account if revenue reporting needs it.
- Truck choice when booking a load is a simple "best type match, else first available"
  pick; a truck-selection UI would replace it, but the DB guards are unchanged.