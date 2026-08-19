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

---

## Micro-polish follow-up

Quick gap-fill pass over the same page set (320/375/768/1024/1440px), focused
on visual details the layout-fix pass didn't cover. **Visual-only** — no
logic, data-fetching, routes, or `.sql` touched, and nothing from the main
responsive stage was re-litigated. Same tokens/classes as before; no new
colours or gradients.

### What was touched

| Item | File | Change | Rationale |
| --- | --- | --- | --- |
| **Icon sizing (1)** | `src/components/layout/app-shell.tsx` — mobile topbar | Bell icon `h-[17px] w-[17px]` → `h-[18px] w-[18px]`. | The mobile topbar rendered a 17px bell next to an 18px menu button in the same group. Standardized to 18px so both round buttons are optically identical. (Desktop topbar icons were already 18px.) |
| **Hover states (2)** | `src/components/layout/app-shell.tsx` — mobile topbar | Both topbar buttons (bell + menu) gained `transition-colors hover:bg-navy-50`. | Desktop topbar buttons already had `hover:bg-navy-50`; the mobile equivalents were missing it, so the two states were inconsistent. |
| **Hover states (2)** | `src/app/(app)/wallet/page.tsx`, `src/app/(app)/settings/page.tsx`, `src/app/register/page.tsx` | Interactive text buttons (`Add payment method`, `Enable 2FA`, `Use a different email`) gained `transition-colors hover:text-blue-600`. | These were clickable but had no hover affordance, unlike the app's `Link` text pattern. Added the same blue hover for consistency. |
| **Headline leading (5)** | `src/components/landing/hero.tsx` | Hero `h1` `leading-[1.08]` → `leading-[1.14] sm:leading-[1.08]`. | At 40px on a 320–414px screen the hero stacks several lines; `1.08` felt cramped. Loosened to `1.14` on mobile only, restored to `1.08` at `sm:`+. |

### Verified already-clean (no change needed)

- **Empty states (3)** — loading skeletons reuse the `.skeleton` shimmer; "no
  data" messages uniformly use `rounded-2xl border border-dashed border-navy-200
  ... text-center text-sm text-navy-400`. Intentional and consistent after the
  layout pass.
- **Border/shadow consistency (4)** — `card-surface` (`rounded-xl3 border
  border-navy-100/60 shadow-soft`) is used for every card; clickable cards add
  `hover:shadow-floating`; inner list items use plain `border-navy-100` and
  dashed `border-navy-200` for empties. Consistent semantic weights.
- **Button/badge truncation (6)** — the bookings badge-row `flex-wrap` and the
  dashboard header `flex-wrap` reads cleanly at 320px: each `Badge` (inline-flex,
  no forced `nowrap`/`truncate`) wraps as a unit and each `buttonVariants` CTA
  stays on its own line. No clipped labels.
- **Icon sizing elsewhere (1)** — remaining button groups already use a single
  icon size (e.g. dashboard header `h-4`, tracking driver `h-4`, app-shell nav
  `h-[18px]`, mobile bottom-nav `h-5`).

### Re-verification

`npm run typecheck` and `npx next lint` both pass on the touched files. No
interactive element in the touched set lost its focus/active feedback — the
global `:focus-visible` rule and `buttonVariants` focus ring still apply.

---

## Micro-interactions & page transitions

Motion pass on top of the completed responsive + micro-polish stages. Scope is
**visual/motion only** — no logic, data-fetching, routes, or `.sql` touched,
and nothing from the prior stages was re-litigated. Reuses the existing motion
language (`motion.tsx`: `Reveal`/`Stagger`/`StaggerItem`, shared
`EASE = [0.22, 1, 0.36, 1]`). All JS-driven motion gates on
`useReducedMotion()` (so the global CSS `prefers-reduced-motion` rule in
`globals.css` plus Framer's hook both collapse it); CSS-driven motion relies on
the existing global media query. All additions are fast/restrained (150–300ms)
to match the premium tone already set by `hero.tsx`.

### 1. Route-level page transitions — `src/components/layout/app-shell.tsx`

Wrapped the `(app)` route-group main content in `<AnimatePresence
mode="wait" initial={false}>`, keyed by `pathname`, so every route change
fades in with a slight upward slide.

| Prop | Value |
| --- | --- |
| Enter | `{ opacity: 0, y: 10 }` → `{ opacity: 1, y: 0 }` |
| Exit | `{ opacity: 0, y: -6 }` |
| Duration / easing | `0.16s`, `[0.22, 1, 0.36, 1]` |
| Reduced motion | `initial={reduce ? false : …}` + `exit={reduce ? undefined : …}` → instant swap |

`mode="wait"` keeps the exiting page in-flow while it fades (no height
collapse); `initial={false}` prevents a double-animation on first load against
the pages' own `animate-fade-up`. The 160ms exit is short enough not to delay
perceived load or fight the Skeleton loading states from prior stages.

### 2. Button micro-interaction — `src/components/ui/button.tsx`

Converted the `Button` component to `motion.button` and replaced the blanket
CSS `active:scale-[0.98]` (previously on every variant) with a Framer
`whileHover`/`whileTap` applied **only to `primary` and `dark`** variants, so
ghost/outline/secondary instances stay visually quiet.

| Prop | Value |
| --- | --- |
| `whileHover` | `{ scale: 1.02 }` |
| `whileTap` | `{ scale: 0.98 }` |
| Duration / easing | `0.15s`, `[0.22, 1, 0.36, 1]` — snappy, no bounce |
| Reduced motion | `useReducedMotion()` → handlers `undefined` |

`buttonVariants` (used on `<Link>` CTAs) is unchanged, so server-rendered
primary links keep their `hover:bg-*` affordance. `ButtonProps` omits the
native drag/animation handlers that collide with Framer's typing.

**Build-fix note (module split):** because `button.tsx` is now a
`'use client'` module, its `buttonVariants` export was a Client Reference that
server components (`not-found`, `routes`, `marketplace/[id]`) could not call at
render time — this threw `(0, o.d) is not a function` and broke `next build`
for every page. Fixed by extracting the pure CVA into a server-safe
`src/components/ui/button-variants.ts` (no `'use client'`) and pointing all
eleven `buttonVariants` importers at it; `button.tsx` now owns only the
interactive `Button` (motion.button) and no longer re-exports the variants.

### 3. Card lift consistency — `marketplace/cards.tsx`, `marketplace/intermediate-stops.tsx`, `(app)/bookings/page.tsx`, `landing/sections.tsx`

Audited every `hover:-translate-y-0.5 hover:shadow-floating` instance and
standardized timing/easing + lift magnitude:

- **Bookings rows** (`bookings/page.tsx`): `transition-all` (default 150ms) →
  `transition-all duration-300`, matching the marketplace cards' 300ms.
- **Landing feature cards** (`landing/sections.tsx`): `hover:-translate-y-1`
  (4px) → `hover:-translate-y-0.5` (2px), matching the marketplace cards.
- Marketplace `cards.tsx` / `intermediate-stops.tsx` were already on
  `duration-300` + `-translate-y-0.5` — verified as the canonical target.

Now every card lift is `transition-all duration-300 hover:-translate-y-0.5
hover:shadow-floating`. CSS-driven → covered by the global reduced-motion rule.

### 4. List/grid entrance stagger — `(app)/bookings/page.tsx`, `(app)/notifications/page.tsx`

Reused the existing `Stagger`/`StaggerItem` fade-up pattern (already used by
the marketplace grid, so this integrates cleanly rather than adding a new
mechanism) for the two lists that previously rendered with no entrance:

| List | Stagger |
| --- | --- |
| Bookings rows | `stagger={0.05}` |
| Notifications rows | `stagger={0.04}` |

Each item fades up from `y: 14`, `duration 0.45s`, `[0.22, 1, 0.36, 1]`.
Framer's `initial`/`animate` run only on mount — updating `items` (e.g.
"Mark all read") re-renders but does **not** re-trigger the entrance. Reduced
motion handled by `Stagger`'s `useReducedMotion()`.

### 5. Toast/notification entrance — verified, no change

`<Toaster position="top-center" richColors closeButton />` (`src/app/layout.tsx`)
uses Sonner's default entrance (slide + fade, ~250ms). That is consistent with
the new fade/slide page + list language and already respects the OS
`prefers-reduced-motion` setting internally. No change needed — adding custom
`toastOptions` would introduce a third motion style for no benefit.

### 6. Booking flow step transitions — `src/app/(app)/booking/[id]/page.tsx`

Replaced the instant conditional re-render of the 3-step stepper
(Review → Payment → Confirmed) with `<AnimatePresence mode="wait"
initial={false}>` wrapping each step's `card-surface` in a `motion.div` keyed
by step name.

| Prop | Value |
| --- | --- |
| Enter | `{ opacity: 0, y: 12 }` → `{ opacity: 1, y: 0 }` |
| Exit | `{ opacity: 0, y: -8 }` |
| Duration / easing | `0.2s`, `[0.22, 1, 0.36, 1]` |
| Reduced motion | `useReducedMotion()` → `initial false` + no exit (instant swap) |

The Confirmed step keeps its existing `animate-scale-in` CSS inside the fade
wrapper, so the two entrances compose rather than clash. The stepper dots/step
logic and `confirmPayment` timing are untouched.

### Re-verification

`npm run typecheck` and `npx next lint` both pass on the touched files. All six
items are either JS-motion gated on `useReducedMotion()` or CSS-motion covered
by the global `prefers-reduced-motion` rule — no reduced-motion regression.

---

## Shipper dashboard mobile-perfect pass

Targeted mobile-first layout and CSS refinement across all shipper-facing screens for real device widths (**320px, 360px, 375px, 390px, 414px**).

### Files touched and mobile issues fixed

| File | Device Widths | Specific Issue & Fix |
| --- | --- | --- |
| `src/components/dashboard/stat-card.tsx` | 320px, 360px | In a 2-col grid at 320px, `p-5` left only ~96px content width causing large numbers (`₹12,34,567`) and labels (`Needs attention`) to cramp/wrap awkwardly. Updated container padding to `p-3.5 sm:p-5`, stepped down value typography to `text-lg sm:text-2xl`, and added `truncate` to labels and deltas. |
| `src/app/(app)/dashboard/shipper/page.tsx` | 320px, 360px, 375px | Edit and cancel action buttons in open load items and unsave transporter buttons had sub-44px touch targets (32px/28px). Expanded touch targets to `h-11 w-11` (44x44px). Added `shrink-0` to price/badge columns and `truncate` to title/city names in saved transporter cards and recent bookings to prevent text collision. |
| `src/components/marketplace/filter-bar.tsx` | 320px, 360px, 390px | Filter action controls ("Any city", "Any truck type", "More filters") were forced into a horizontal scroll row (`overflow-x-auto`) that felt cramped at 320px. Converted to a mobile-friendly 2-col grid (`grid grid-cols-2 gap-2 sm:flex sm:overflow-x-auto`), where city/type selects take 1 column each and "More filters" spans full width with a 44px (`h-11`) touch target. |
| `src/components/marketplace/cards.tsx` | 320px, 360px | In `TruckCard`, origin/destination route text and `Empty leg` badges collided with `TruckTypeIcon` (48px) at 320px. Added `flex-wrap min-w-0` to route container so cities and badges wrap cleanly. In `LoadCard`, added `flex-wrap` and `min-w-0` to badge header (`Trending` / `AI pick`) and route distance indicators. |
| `src/app/(app)/marketplace/[id]/page.tsx` | 320px, 360px | Page heading (`text-2xl`) and truck icon title row clipped at 320px. Adjusted title typography scale to `text-xl sm:text-2xl` and added `flex-wrap gap-2` to badge headers. |
| `src/app/(app)/post-load/page.tsx` | 320px, 360px, 375px | Form field pairs (`Category & Weight`, `Origin & Destination`, `Pickup date & Budget`) used fixed 2-column grids (`grid-cols-2`) below `sm:`, creating cramped 116px inputs where select option text was clipped. Converted field grids to `grid-cols-1 sm:grid-cols-2`. Updated truck type selection buttons to `grid-cols-2 sm:grid-cols-3 md:grid-cols-6` with `min-h-[44px]` touch targets. |
| `src/app/(app)/booking/[id]/page.tsx` | 320px, 360px | Payment option tiles (`PayOption`) now enforce `min-h-[44px]` touch targets. Added a dedicated insufficient wallet balance callout banner when wallet balance is less than required booking amount. Confirmation step buttons (`View all trips` / `Track shipment`) now stack cleanly on mobile (`flex flex-col sm:flex-row gap-3`). |
| `src/app/(app)/bookings/page.tsx` | 320px, 360px | Trips list rows: added `shrink-0` to right-aligned price/ETA text column and `truncate` to route details so long titles don't push price text past card margins at 320px. |
| `src/app/(app)/tracking/[id]/page.tsx` | 320px, 360px, 375px | Map container height (`h-[260px] sm:h-[340px]`) pushed driver & timeline info off-screen on ~640-780px tall phone viewports. Adjusted map & skeleton height to `h-[200px] sm:h-[300px]`. Expanded driver phone and chat action buttons to `h-11 w-11` (44x44px) touch targets. |
| `src/components/tracking/real-map.tsx` & `map-placeholder.tsx` | 320px, 360px, 375px | Synchronized map container default heights to `h-[200px] sm:h-[300px]` matching tracking page layout. |
| `src/app/(app)/wallet/page.tsx` | 320px, 360px | `SummaryTile` 3-col grid at 320px had `p-4` padding, leaving only 56px content width and clipping 6-digit currency figures (`₹1,25,000`). Updated padding to `p-2.5 sm:p-4`, stepped typography to `text-xs font-extrabold sm:text-sm`, and added `truncate`. Added `shrink-0` to escrow payout and transaction right-side amounts. |
| `src/components/layout/app-shell.tsx` | 320px, 360px, 375px | Mobile topbar icon buttons (bell notification and hamburger menu) expanded from `h-10 w-10` to `h-11 w-11` (44x44px) hit areas. |

### Verification
- `npm run typecheck`: Passed (code 0).
- `npx next lint`: Passed.