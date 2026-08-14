# Plan — Add Route Detail (Waypoint / Intermediate-Stop) Feature

## Goal

When a truck travels a long route (e.g. **Bhubaneswar → Delhi**), the app must
show the **full intermediate path** (the highways and middle cities the truck
passes through). Any shipper with a load whose pickup or drop city lies **on
that path** can place a *mid-route pickup* or *return (backhaul) order* against
that truck — filling empty legs and idle capacity.

Currently trucks/loads only store `originCity` and `destinationCity` (see
`Truck`/`Load` in `src/lib/types.ts`). There is no notion of the cities the
truck passes through, so mid-route matching is impossible.

---

## 1. Data Model

### New type — `Route` (in `src/lib/types.ts`)

```ts
export interface RouteStop {
  city: string;
  state?: string;
  kmFromOrigin: number;      // cumulative distance along the route
  isHighwayJunction?: boolean;
}

export interface Route {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  highway: string;           // e.g. "NH-16 → NH-49 → NH-44"
  stops: RouteStop[];        // ordered list: origin → ... → destination
}
```

### Changes to `Truck` / `Load`

Add an optional `route?: Route` field to both `Truck` and `Load` so a listing
can carry its full path. Keep it optional so short-haul or un-mapped trips still
work.

### Supabase schema (new migration `0004_route_waypoints.sql`)

Add a `route_waypoints` table (origin/destination stays on `trucks`/`loads`):

```sql
create table if not exists public.route_waypoints (
  id            uuid primary key default gen_random_uuid(),
  truck_id      uuid references public.trucks(id) on delete cascade,   -- nullable
  load_id       uuid references public.loads(id) on delete cascade,    -- nullable
  seq           int  not null,               -- ordering (0 = origin)
  city          text not null,
  state         text,
  km_from_origin numeric(8,2),
  is_highway_junction boolean not null default false,
  created_at    timestamptz not null default now()
);

-- RLS: visible to all authenticated users (read), owner writes.
create index if not exists route_waypoints_truck_idx on public.route_waypoints(truck_id, seq);
create index if not exists route_waypoints_load_idx  on public.route_waypoints(load_id, seq);
```

Add RLS policies in `0003_rls_policies.sql` (or a new migration) mirroring the
existing owner/party-scoped pattern using `current_profile_id()`.

Update `src/lib/supabase/types.ts` to mirror the new table.

---

## 2. Mock Data (in `src/lib/mock-data.ts`)

Create a `routeRepository` (a lookup keyed by `"Origin→Dest"`) so both trucks
and loads can reuse the same path definitions. Add realistic Indian highway
routes, e.g.:

- `Bhubaneswar → Delhi`: NH-16 → NH-49 → NH-53 → NH-44, passing **Cuttack,
  Sambalpur, Bargarh, Raipur, Bilaspur, Katni, Jhansi, Agra**.
- `Mumbai → Delhi`: NH-48 via **Nashik, Dhule, Indore, Gwalior**.
- `Bengaluru → Delhi`: NH-44 via **Chitradurga, Hyderabad, Nagpur, Jhansi**.

Attach `route` to the existing mock trucks/loads that match these corridors, and
add a `Bhubaneswar → Delhi` truck + load so the demo has a clear showcase case.

---

## 3. UI / UX

### a) Marketplace detail page — `src/app/(app)/marketplace/[id]/page.tsx`

Replace the simple origin→destination pill with a **route strip / breadcrumb**:

- Render each `route.stop` as a chip on a horizontal scroll line (origin on the
  left, destination on the right, highway label above).
- Highlight the primary highway (e.g. "via NH-44").
- Add a **"Mid-route / return stops available"** badge listing the stop cities
  so shippers immediately see where they can drop/pick.

### b) Marketplace list card — `src/components/marketplace/cards.tsx`

Show a compact "via {highway} · N stops" hint on the card so the route detail is
discoverable before opening the detail page.

### c) Post a load — `src/app/(app)/post-load/page.tsx`

When the shipper picks origin + destination, auto-suggest a route and let them
add/remove intermediate pickup/drop cities. These become `route` stops.

### d) New **Route Explorer** page (recommended, optional in v1)

A dedicated `src/app/(app)/routes/page.tsx` listing all known routes with their
highway + stop cities. From any route, shippers can "Request pickup at a stop"
or "Request return load" → pre-fills a load at that waypoint. Add a link in the
marketplace nav / dashboard.

### e) Matching logic

`filteredTrucks` in `marketplace/page.tsx` currently matches only
origin/destination cities. Extend so a load matches a truck if the load's
origin **or** destination lies within the truck's `route.stops` (mid-route
pickup/drop), not just the exact endpoints. Add a `RoutePoint`-style marker or a
"On-route" badge on matched cards.

---

## 4. Component Reuse

- Add `src/components/marketplace/route-strip.tsx` — the horizontal waypoint
  breadcrumb, reused in detail page, cards, and route explorer.
- Add `src/components/marketplace/route-highway.tsx` — highway label chip.
- Tracking map (`src/components/tracking/map-placeholder.tsx`) can later render
  the waypoints as a polyline instead of the stylized SVG, staying isolated for
  a drop-in real map SDK.

---

## 5. Out of Scope / Future (v2)

- Live polyline routing from a map API (OSRM / Google Directions) instead of the
  curated `routeRepository` — keep the `Route` shape so swapping is trivial.
- Automated empty-leg return matching using the stops (defer to
  `backhaul_match_score()` enhancement).
- Editing routes after posting (currently create-only).

---

## 6. Build Order

1. Add `Route`/`RouteStop` types to `src/lib/types.ts`. — **DONE**
2. Add `route` field to `Truck`/`Load` + `route_waypoints` table in
   `0004_route_waypoints.sql` and update `supabase/types.ts`. — **DONE**
3. Build `routeRepository` in `mock-data.ts`, add a Bhubaneswar→Delhi showcase
   route, wire to existing trucks/loads. — **DONE**
4. Build `route-strip.tsx` + `route-highway.tsx` components. — **DONE**
5. Update marketplace detail page, list cards, and post-load. — **DONE**
6. (Optional) Route Explorer page + match-by-waypoint filter. — **DONE**
7. Run `npm run lint` and `npm run typecheck`; verify with `npm run dev`. — **DONE**
   (lint ✔ clean, typecheck ✔ clean)

---

## Checklist

### Data model
- [x] `Route` / `RouteStop` types in `src/lib/types.ts`
- [x] `route?: Route` on `Truck` and `Load`
- [x] `0004_route_waypoints.sql` migration (table + RLS)
- [x] `route_waypoints` mirror in `src/lib/supabase/types.ts`

### Mock data
- [x] `routes` repository + `routeBetween()` helper in `mock-data.ts`
- [x] Bhubaneswar → Delhi showcase route (NH-16 → NH-49 → NH-53 → NH-44 via
      Cuttack, Sambalpur, Bargarh, Raipur, Bilaspur, Katni, Jhansi, Agra)
- [x] Routes for Mumbai→Delhi, Bengaluru→Delhi, Chennai→Bengaluru, Jaipur→Delhi,
      Kolkata→Lucknow, Nagpur→Indore
- [x] New `trk_109` Bhubaneswar→Delhi truck in the mock fleet
- [x] Routes auto-attached to matching existing trucks/loads

### UI
- [x] `route-strip.tsx` (waypoint breadcrumb) + `route-highway.tsx` (highway chip)
- [x] Marketplace detail page: full-route block + "Mid-route pickup available"
- [x] Marketplace list cards: `via {highway}` + "N mid stops" badge
- [x] Waypoint-aware truck matching (passing-through city)
- [x] `/routes` Route Explorer page (stops, highway, request pickup CTA)
- [x] "Routes" nav item in `app-shell.tsx`
- [x] Post-load: corridor suggestion card + query-param prefill

### Verification
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes (0 warnings/errors)
