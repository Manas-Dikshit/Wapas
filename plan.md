# Plan — MVP Feature Expansion: Escrow, Tracking, and Negotiation

## Goal

Turn the current route-aware marketplace from a polished demo into a realistic freight marketplace by adding the three highest-value MVP workflows:

1. Payment escrow + milestone payouts
2. Live tracking + ETA updates
3. Bid / counteroffer negotiation

This keeps the product focused on trust, operational visibility, and business realism without bloating scope beyond the current app architecture.

---

## 1. Phase 1 — Escrow + milestone payouts

### Why it matters

Freight transactions need trust. A shipper wants certainty that they pay only when milestones are met, and a transporter wants assurance that the agreed amount is reserved before dispatch.

### Scope

Add a lightweight money-holding and release flow for bookings that are accepted and in transit.

### Data model

Add new mock/Supabase-friendly structures:

```ts
interface EscrowMilestone {
  id: string;
  bookingId: string;
  label: string;
  amount: number;
  status: 'pending' | 'released' | 'disputed';
  dueAt?: string;
}

interface PaymentEscrow {
  id: string;
  bookingId: string;
  totalAmount: number;
  releasedAmount: number;
  status: 'held' | 'partially_released' | 'released';
  milestones: EscrowMilestone[];
}
```

### UI / UX

- Booking confirmation screen shows: "Funds held in escrow"
- Booking detail shows milestone status cards
- Shipper sees: "Release payment at pickup / delivery / milestone completion"
- Transporter sees: "Payout pending approval" or "Escrow released"

### User flow

- Shipper books a load or truck
- Amount is placed in escrow
- Milestone 1: pickup confirmation releases X%
- Milestone 2: delivery confirmation releases remaining amount
- Disputes can be marked and reviewed by admin

### Acceptance criteria

- A booking can be created with escrow status visible
- Milestone amounts are displayed clearly
- Releasing funds updates both the booking and wallet state
- Escrow state is visible on transporter and shipper dashboards

### Build order

1. Add escrow and milestone types to `src/lib/types.ts`
2. Extend mock bookings with escrow state in `src/lib/mock-data.ts`
3. Add booking detail/payment status components
4. Add dashboard widgets for escrow summary and payout status
5. Validate with lint/typecheck/build

---

## 2. Phase 2 — Live tracking + ETA updates

### Why it matters

The app already has the booking and route context. The next missing ingredient is operational visibility: where is the truck, and when will it arrive?

### Scope

Add tracking states and a lightweight ETA timeline for active shipments.

### Data model

```ts
interface TrackingEvent {
  id: string;
  bookingId: string;
  timestamp: string;
  status: 'picked_up' | 'in_transit' | 'checkpoint' | 'delivered';
  location: string;
  note?: string;
}

interface ShipmentTracker {
  bookingId: string;
  currentLocation: string;
  progressPct: number;
  eta: string;
  updatedAt: string;
  events: TrackingEvent[];
}
```

### UI / UX

- Booking detail page shows a route progress bar with live ETA
- Tracking page includes map placeholder + milestone timeline
- Transporter can update status from phone-friendly mobile layout
- Shipper gets push-style event feed notifications

### User flow

- Booking enters transit
- Driver updates checkpoint or route progress
- ETA recalculates based on current position and last event
- Status feed is visible to shipper and admin

### Acceptance criteria

- Active bookings show a live progress tracker
- ETA updates when shipment status changes
- Milestone timeline is visible and chronological
- Tracking data works in demo mode with mock events

### Build order

1. Extend booking/tracking types and mock fixtures
2. Add tracking timeline component and ETA badge
3. Tie booking detail and dashboard cards to tracking data
4. Add shipment status actions for transporter role
5. Validate with demo flows and build checks

---

## 3. Phase 3 — Bid / counteroffer flow

### Why it matters

A marketplace becomes more realistic when transporters can negotiate instead of instantly taking a job. This creates demand for quote management and improves conversion.

### Scope

Allow a transporter to bid on a specific load or respond with a counteroffer to a shipper request.

### Data model

```ts
interface FreightQuote {
  id: string;
  loadId?: string;
  truckId?: string;
  shipperId: string;
  transporterId: string;
  offeredAmount: number;
  proposedEta: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  note?: string;
}
```

### UI / UX

- Load detail page shows “Send a quote” CTA
- Transporter can quote price + ETA + notes
- Shipper can accept, reject, or counteroffer
- Dashboard shows quote pipeline summary

### User flow

- Shipper posts a load
- Transporter views the job and sends quote
- Shipper evaluates quote
- Shipper accepts, rejects, or counteroffers
- Accepted quote turns into booking/escrow flow

### Acceptance criteria

- A quote can be created from a load/truck card
- Quote status is stored and visible in dashboards
- Accepting a quote creates the booking flow
- Counteroffers can be created without leaving the app

### Build order

1. Add quote types and mock quote data
2. Add quote submission UI on load detail pages
3. Add quote list and status view in shipper/transporter dashboards
4. Connect accepted quotes into booking creation pipeline
5. Validate with flow-driven mock interactions

---

## 4. Recommended implementation order

1. Escrow + milestone payouts
2. Live tracking + ETA updates
3. Bid / counteroffer flow

Why this order:

- Escrow gives payment trust before shipping becomes operationally heavy.
- Tracking creates real-time confidence and makes status updates meaningful.
- Negotiation unlocks marketplace dynamics after the app already feels operational.

---

## 5. Shared technical notes

### Data patterns

Use the same mock-first approach as the existing app:

- keep data in `src/lib/mock-data.ts`
- add type interfaces in `src/lib/types.ts`
- create new UI cards and action components under `src/components/`
- keep Supabase-ready schema structures parallel to the mock objects

### Dashboard impact

Each phase should add visible UI in:

- shipper dashboard
- transporter dashboard
- admin analytics panel
- booking detail flow

### Avoid overbuilding

For MVP, do not implement:

- multi-asset fleet accounting
- full payment gateway integration
- live map SDK routing
- complex dispute arbitration

These can come after the three core workflows are proven.

---

## 6. Success metrics

By the end of Phase 3, the app should support:

- a booking that can be paid and tracked end to end
- real-time shipment status visibility
- negotiation between shipper and transporter
- enough workflow depth that the product feels like a serious freight marketplace, not a static listing demo

---

## 7. Checklist

### Phase 1: Escrow
- [ ] Add escrow + milestone types
- [ ] Add mock escrow data
- [ ] Add booking payout status UI
- [ ] Add shipper/transporter escrow views

### Phase 2: Tracking
- [ ] Add tracking event types and mock data
- [ ] Add ETA/progress UI
- [ ] Add status timeline in booking detail
- [ ] Add transporter status update actions

### Phase 3: Quotes
- [ ] Add quote types and mock quotes
- [ ] Add quote submission flow
- [ ] Add quote dashboard views
- [ ] Connect accepted quote to booking creation

### Validation
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
