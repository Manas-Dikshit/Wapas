# Responsive & Premium UI Polish Stage

Pure UI/layout refinement for Wapas. **No feature, data-fetching, RLS
query, route, or component-prop contract was changed** — this stage only
touches styling/layout (Tailwind class strings and JSX structure). All
Supabase middleware and `.sql` files are untouched. Everything builds on the
existing system (the `card-surface` / `container-app` classes, the
`canvas/navy/blue/aqua` tokens, and the `sm:`/`lg:` breakpoint patterns
already in `app-shell.tsx`) rather than inventing a second design system.

## Scope of the audit

Every page under `src/app/(app)/`, plus `src/app/login`, `src/app/register`
and the landing page `src/app/page.tsx`, plus every shared component in
`src/components/layout`, `src/components/dashboard`, `src/components/
marketplace` and `src/components/tracking` was reviewed for:

1. Horizontal overflow / clipped content at 320 → 1440px and ultra-wide.
2. Table degradation on narrow screens (the `admin/page.tsx` table already
   uses `overflow-x-auto` + a `min-w-[560px]` table — this is the canonical
   pattern and required no change).
3. Form stacking below `sm:` (post-load, register, add-truck/edit-truck,
   profile documents all already collapse to a single column).
4. Chart resizing in narrow containers (Recharts `ResponsiveContainer`).
5. Map sizing on mobile (`real-map.tsx` / `map-placeholder.tsx` already use
   `h-[260px] sm:h-[340px]` — verified correct for small viewports).
6. Gradient usage and badge/color consistency.

---

## Breakpoint fixes (behavioural changes)

These are genuine responsive-bug fixes. Each is scoped to the minimum layout
change needed.

| File | What changed | Why |
| --- | --- | --- |
| `src/components/dashboard/charts.tsx` — `UtilizationChart` | Wrapper changed `flex items-center gap-6` → `flex flex-col items-center gap-6 sm:flex-row sm:items-center`; legend container `space-y-2.5` → `w-full space-y-2.5 sm:w-auto`. | The fixed 160px donut + legend side-by-side squeezed the legend into ~40px inside a 320px viewport (it was cramping / near-overflow). It now stacks: donut centered, full-width legend below, and returns to the side-by-side layout at `sm:`. |
| `src/app/(app)/booking/[id]/page.tsx` — checkout stepper | Outer `flex items-center justify-center gap-3` → `flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3`; step row `gap-3` → `gap-2 sm:gap-3`; connector `w-8` → `w-4 sm:w-8`; step circle got `shrink-0`. | Three labelled steps + connectors measured ~340px — wider than a 320px screen, so the stepper overflowed horizontally. It now wraps gracefully on the smallest screens while keeping the compact one-line layout at `sm:`+. |
| `src/app/(app)/bookings/page.tsx` — trip row | Title + status + escrow badge container `flex items-center gap-2` → `flex flex-wrap items-center gap-2`. | Two non-truncating `Badge`s (e.g. `Escrow ₹12,000`) could push past the right edge on narrow screens. Badges now wrap under the title instead of forcing horizontal overflow; the title still `truncate`s. |
| `src/app/(app)/dashboard/shipper/page.tsx` — page header actions | Button group `flex gap-2` → `flex flex-wrap gap-2`. | Two `sm` buttons ("Saved transporters", "Post a load") were crammed into 288px of content at 320px. They now wrap instead of clipping. |
| `src/app/(app)/dashboard/transporter/page.tsx` — page header actions | Button group `flex gap-2` → `flex flex-wrap gap-2`. | Same as shipper — "Find loads" + "Post a load" now wrap on the smallest screens. |
| `src/components/dashboard/stat-card.tsx` — value typography | Value `font-display text-2xl` → `font-display text-xl sm:text-2xl`. | Large INR values (e.g. `₹12,34,567`) could overflow a ~100px card at 320px on the `grid-cols-2` stat grids. It steps down to `text-xl` on mobile and restores `text-2xl` at `sm:`. |

### Verified already-correct (no change needed)

These were audited and confirmed to already satisfy the goals, so they were
left untouched:

- **Tables** — `admin/page.tsx` user table already degrades via an
  `overflow-x-auto` wrapper + `min-w-[560px]` table. The wallet "transactions"
  list is card/row-based (no table), so it already stacks fine.
- **Forms** — register (`AuthShell`), post-load, add-truck / edit-truck
  (transporter), profile documents upload all use `grid ... sm:grid-cols-2`
  (or single-column) and collapse cleanly below `sm:`. No cramped multi-col
  grids under `sm:`.
- **Charts** — `RevenueChart`, the shipper spend `AreaChart`, and the
  analytics `BarChart` all live in `h-[NNN]px w-full` wrappers around
  `ResponsiveContainer width="100%" height="100%"`, inside `grid gap-6
  lg:grid-cols-N` parents that collapse to a single full-width column on
  mobile. `ResponsiveContainer` resizes correctly; no fixed-width flex
  constraint broke it.
- **Maps** — `real-map.tsx` and `map-placeholder.tsx` both use
  `h-[260px] w-full ... sm:h-[340px]` and `MapContainer` at `100%` height.
  Verified a sane mobile height and no overflow.
- **Horizontal-scroll areas that are intentional** — the marketplace
  `routeStats` pill strip and the `FilterBar` mobile select row both use
  `overflow-x-auto` inside their own scroll container, so they never push the
  page wider than the viewport.

---

## Visual refinement

### Gradient audit — before / after

| Gradient | Before | After |
| --- | --- | --- |
| `bg-wapas-gradient` (`blue → aqua`) | Defined in `tailwind.config.ts`; **not used anywhere** in the app. | No change — already absent. |
| `bg-wapas-gradient-dark` (`navy → blue`) | Defined in `tailwind.config.ts`; **not used anywhere** in the app. | No change — already absent. |
| `.btn-gradient` | Defined in `globals.css`; **not referenced** by any component. | No change — dead utility, left for future use. |
| Inline radial glows (decorative) | `auth-shell.tsx` (2 soft radial glows on the auth panel) and `map-placeholder.tsx` (1). | No change — these are subtle, low-opacity background glows behind content, not competing gradient fills. |
| Inline SVG route gradients | `hero.tsx` `routeGrad`, `map-placeholder.tsx` `trackGrad`, `real-map.tsx` polyline tints. | No change — the hero route-draw line is the single signature gradient accent and the map route uses gradients meaningfully. |

**Conclusion:** the design was already disciplined — primary CTAs use solid
`bg-blue-500` (`buttonVariants.primary`), there is **no gradient text**
anywhere, and the `wapas-gradient` tokens are unused. Nothing needed to be
flattened, and none was added. This stage therefore made **zero gradient
changes**, which satisfies the "reduce to highest-impact spots only"
constraint (there was nothing to reduce).

### Badge / status colour consistency

Cross-checked every `Badge variant={...}` mapping across pages for drift. The
booking-status mapping is identical everywhere it appears:
`confirmed → blue`, `in-transit → aqua`, `delivered → success`,
`cancelled → danger` (`shipper`, `transporter` via `widgets.tsx`, `bookings`).
Truck-status (`available → success`, `booked → blue`, `in-transit → aqua`,
`maintenance → warning`) and KYC/doc statuses are likewise consistent within
their domains. **No drift found** — same status renders the same colour
across pages. No changes required.

### Touch targets

Primary mobile controls already meet ≥44px: the FAB is `h-14`, the mobile
top-bar buttons and form inputs are `h-10`–`h-12`, CTAs are `h-11`/`h-[3.25rem]`,
and the `Switch` is 48px wide. Small inline icon buttons (`h-8 w-8`, 32px)
for edit / delete / deactivate / remove are **intentionally** compact —
they are secondary affordances inside cards and match the existing density.
They were deliberately left unchanged to keep the polish restrained; if a
stricter ≥44px hit-area is wanted for them later, that is a follow-up, not
part of this stage.

### Spacing, alignment, typography

Audited for consistency. Page headings uniformly use
`text-2xl sm:text-3xl`, section titles `text-base`, body `text-sm`; card
padding uniformly `p-5 sm:p-6`; all reuse `card-surface` / `container-app` and
the existing spacing scale. **No new arbitrary spacing values were
introduced**, and no typography felt oversized/undersized at any breakpoint
(other than the `StatCard` value stepped down in the breakpoint fixes above).

---

## Manual test checklist

Run `npm run dev` and verify each row at each breakpoint. Open the browser
DevTools responsive mode and set the width; check for: **no horizontal
scrollbar, no clipped text/buttons, no overlapping elements, and touch
targets ≥44px for primary controls** on mobile widths.

Widths: **320 · 360 · 375 · 390 · 414 · 768 · 1024 · 1440 · ultra-wide (e.g.
1920)**.

Legend: ✅ pass · ⚠️ verify closely (tight but acceptable / intentional scroll).

| Page | 320 | 360 | 375 | 390 | 414 | 768 | 1024 | 1440 | Ultra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Landing** (`/`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Login** (`/login`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register** (`/register`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard · Shipper** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard · Transporter** | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard · Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Marketplace** (`/marketplace`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Booking** (`/booking/[id]`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tracking** (`/tracking/[id]`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Wallet** (`/wallet`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** (`/admin`, alias) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile** (`/profile`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Settings** (`/settings`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Per-page spot checks

**Landing (`/`)**
- Hero heading wraps cleanly; the route-match card stays centered within the
  viewport; the CTA column stacks (`flex-col sm:flex-row`).
- Mobile nav: hamburger opens the dropdown; both auth buttons are full-width
  and ≥44px tall.
- Pricing / FAQ / CTA sections: the highlighted plan and FAQ accordion must
  not exceed viewport width.

**Login / Register**
- Card is `max-w-md mx-auto`, so it centers at every width.
- Magic-link input + button are `h-12` (48px) — good touch targets.
- Register role cards and all form fields stack in a single column below
  `sm:` (no cramped 2-col grids).

**Dashboards ×3 roles**
- Stat grids are `grid-cols-2 lg:grid-cols-4`; at 320 the value is now
  `text-xl` (see fix) so `₹` values don't clip.
- Header action buttons wrap (`flex-wrap`) instead of overlapping at 320.
- Transporter **fleet rows**: `flex items-center gap-4` with icon + text +
  price/badge + stacked edit/deactivate buttons — confirm text truncates
  gracefully and nothing overlaps (**the ⚠️ row**; tightest layout in the
  app, verified fine but check at 320 first).
- Shipper **open-loads** edit rows and **recent bookings** rows: confirm the
  truncated titles and right-side actions don't overlap.
- Admin user table scrolls horizontally within its card (`overflow-x-auto`)
  and does not widen the page.

**Marketplace**
- Cards: `grid sm:grid-cols-2 lg:grid-cols-3` → single column on mobile; card
  header badges + truncated title fit.
- FilterBar: search is full-width; the city/type/More-filters row scrolls
  horizontally in its own container (intentional); expanded filters are
  `grid-cols-2` on mobile.
- Detail pages: route chip row and the `grid-cols-2 sm:grid-cols-4` details
  collapse to 2 cols on mobile.

**Booking (`/booking/[id]`)**
- Stepper wraps on the smallest widths (fix) — no horizontal overflow.
- Payment methods: `grid-cols-3` at 320 fits (short labels UPI / Card /
  Wallet); card expiry + CVV fields stay side-by-side and fit.

**Tracking (`/tracking/[id]`)**
- Map renders at `h-[260px]` on mobile (no excessive height) and fills width.
- Header (title + price) wraps; progress row and driver/vehicle grid
  (`sm:grid-cols-2`) stack on mobile.

**Wallet**
- Balance card fills width; Withdraw / Add funds buttons fit and remain
  tappable.
- `grid-cols-3` summary tiles fit at 320 (values are `text-sm`); escrow and
  transaction rows truncate gracefully.

**Admin / Profile / Settings**
- Admin stats + user management as above; profile header card stacks
  (`flex-col sm:flex-row`), KYC badge and documents upload form collapse to a
  single column; settings rows keep the switch right-aligned with the label
  truncating.

### Ultra-wide check
All pages cap content width (`max-w-[1400px]` in `app-shell` `main` /
`container-app` / `max-w-3xl`/`max-w-2xl` cards), so at 1440px+ content stays
centered and does not stretch. Verify no element is pinned to a viewport edge
unintentionally.

---

## Constraints honoured

- **No feature / data-fetching / RLS query / route / prop-contract changes.**
  Every diff is a Tailwind class string or JSX structural tweak.
- **No new design system, colour tokens, or CSS-framework change.** Only the
  existing `sm:` breakpoint and spacing tokens are used; `tailwind.config.ts`
  is unchanged.
- **No `.sql`, middleware, or Supabase logic touched.**
- **All existing animations/motion preserved** — only wrappers / flex
  direction changed; no `motion`/`animate-*` was removed. The added
  `flex-wrap`/`flex-col sm:flex-row` changes do not introduce layout shift or
  overflow.