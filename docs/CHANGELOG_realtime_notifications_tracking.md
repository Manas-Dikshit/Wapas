# CHANGELOG — Real-Time Notifications & Live Tracking Sync

**Migration added:** `supabase/migrations/0013_realtime_notifications_tracking.sql`
(previous highest was `0012`). No existing migration was edited.

Real-time push is provided by Supabase Realtime (available out of the box — no
polling, no `setInterval` anywhere). In demo mode (no `NEXT_PUBLIC_SUPABASE_*`
env vars) every new hook no-ops and the existing mock-data behaviour is
unchanged, matching the app-wide `if (!supabase) return` pattern.

---

## 1. Live notifications

Files: `src/lib/hooks/use-live-notifications.ts` (new),
`src/app/(app)/notifications/page.tsx`, `src/components/layout/app-shell.tsx`.

- Shared `useLiveNotifications()` hook used by the bell (`app-shell.tsx`) for the
  unread badge and by the notifications page for the list + mark-read actions.
- **Subscription (filter scoping):** `postgres_changes` on `notifications`
  with `event: INSERT`, scoped via `filter: 'user_id=eq.<profile.id>'` — RLS-safe,
  only this signed-in user's rows. Profile id comes from the existing
  `useCurrentProfile()` hook.
- On insert: the row is mapped to the `NotificationItem` shape and prepended to
  the list; if unread, a `toast.success(title, description)` fires and the badge
  increments.
- Initial state: latest 50 rows are fetched once (`user_id=eq.<profile.id>`,
  ordered `created_at` desc), then the channel keeps it live.
- Mark-all-read / mark-read optimistically update state and also write
  `read: true` back to the DB (mark-all scoped by `user_id`).
- **Connection resilience:** the channel is created once in a `useEffect` and
  `client.removeChannel(channel)` runs on unmount — no duplicate subscriptions.
  Supabase auto-reconnects on network loss; a `window 'focus'` listener
  re-syncs the list (rows that could have been dropped while the tab was
  backgrounded) without ever re-creating the channel. Listeners/channels are
  cleaned up on unmount, so no memory leak.

## 2. Live tracking

File: `src/app/(app)/tracking/[id]/page.tsx`.

- When Supabase is configured, the page drives the tracker off Realtime instead
  of the local mock `advanceStatus` button. Demo mode returns early and keeps
  the existing mock behaviour unchanged.
- **Subscription (filter scoping)** — one channel per booking:
  - `bookings` `UPDATE`, `filter: 'id=eq.<booking_id>'` → updates `status`,
    `progress_pct`, `eta`, and derives `currentLocation` from the new pct.
  - `tracking_events` `INSERT`, `filter: 'booking_id=eq.<booking_id>'` → appends
    the new breadcrumb to the timeline.
- Initial state: the `bookings` row (`id=eq.<booking_id>`) and its
  `tracking_events` rows (`booking_id=eq.<booking_id>`, `created_at` asc) are
  fetched once, then the channel keeps them live.
- **Map re-animation:** `real-map.tsx` is untouched. The truck marker animates
  because `progressPct` is fed as a live prop — the component's existing
  `useEffect([progressPct])` rAF animation already re-drives the marker toward
  the new position, so no animation rewrite was needed.
- **Connection resilience:** channel torn down via `client.removeChannel` on
  unmount; a `window 'focus'` listener re-syncs the booking row after the tab is
  backgrounded. Supabase handles reconnect; the channel is never re-created.

## 3. Trigger extension (write side)

File: `supabase/migrations/0013_realtime_notifications_tracking.sql`.

The transporter changes a booking's status via `updateBookingStatus` in
`src/app/(app)/dashboard/transporter/page.tsx`, which does
`bookings.update({ status })` → fires the existing `on_booking_status_change`
AFTER-UPDATE trigger.

`handle_booking_status_change` is extended with `create or replace function`
(the established pattern from 0004/0012) — **not** duplicated as a second
trigger. Additive change: the `confirmed → in-transit` transition now also
inserts a `tracking_events` row (`In transit — Driver picked up the load`),
which the tracking page's `tracking_events` INSERT subscription picks up. The
existing `delivered` tracking event, wallet/escrow settlement, truck/load
status sync and shipper notification are all preserved unchanged.

## 4. Manual test steps

1. **Live notification (two browser tabs).** Configure Supabase, sign in as the
   same user in two tabs, and open the bell/notifications page in both. In one
   tab (or the SQL editor) insert a row into `public.notifications` for that
   user. Within ~1s the other tab shows a toast and the unread badge/list
   increments — no reload.
2. **Live tracking update (two sessions).** Open a booking's tracking page
   (`/tracking/<id>`) as the shipper. In a second session sign in as the
   transporter of that booking and, on the transporter dashboard, move the
   booking from `confirmed → in-transit`. The tracking page's progress bar,
   current-location label and delivery timeline update live (and the map truck
   re-animates) without a page reload. Advancing to `delivered` adds the
   delivered breadcrumb live too.
3. **Demo mode unchanged.** Unset `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, run `npm run dev`. Notifications show the
   static mock list, the bell shows the mock unread count, and the tracking
   page's local "Advance status" button still works exactly as before — no
   errors, no subscriptions.