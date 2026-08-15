# Plan — Minimalistic UI + Animation Refresh

## Direction

Keep the Wapas identity (navy/blue/aqua, rounded, glass) but **reduce visual
noise** and lean into **motion as the design language**. The current UI already
has good pieces (framer-motion, keyframes, gradients, glass, skeletons) — this
plan makes it *calmer* and *more alive*:

- **More whitespace & air** — trim borders/shadows, let type breathe.
- **Fewer, more purposeful accents** — gradients/sparks only on the primary CTA
  and key highlights, not everywhere.
- **Motion that explains** — entrance reveals, layout transitions, list
  stagger, live-match pulses — never decoration-only.

Everything respects `prefers-reduced-motion` (already in `globals.css`).

---

## 1. Design Tokens — `tailwind.config.ts`

- Soften `shadow-soft` / `shadow-floating` (lower opacity, larger blur) and
  default `card-surface` in `globals.css` to a cleaner hairline border +
  minimal shadow → cards feel flat/minimal until hover.
- Add a restrained `ring` utility for focus/interactive states already used
  (`focus:ring-*`).
- Keep the 3-color brand; it's already minimal. Do **not** add new hues.

## 2. Shared Motion Primitives (new)

Add `src/components/ui/motion.tsx` with tiny, reusable Framer Motion wrappers:

- `Reveal` — fade + rise on scroll into view (`whileInView`, once).
- `Stagger` / `StaggerItem` — for staggered lists (cards, nav, stats).
- `AnimatePresence` helpers for modals / mobile menu / toasts.
- `Tappable` — subtle press scale on interactive cards/buttons.

These get used across every page so animation is consistent and cheap to tune
(one file, not per-page).

## 3. Landing (`components/landing/*`)

- `hero.tsx`: keep the route-draw SVG card (it's the star) but soften ambient
  blur blobs; stagger the headline lines (`Stagger`) and the `Stat` numbers
  (count-up reveal via `whileInView`).
- `sections.tsx` / `more-sections.tsx`: add `Reveal` on section headers and
  `Stagger` on feature grids; remove redundant internal shadows.
- `navbar.tsx`: add scrolled state (background blur + hairline border appear on
  scroll) using a tiny scroll listener.

## 4. App Shell (`components/layout/app-shell.tsx`)

- Animate the active sidebar nav item with a sliding `layoutId` pill
  (`framer-motion` shared layout) instead of a static bg color.
- Mobile drawer: replace `animate-fade-up` with an `AnimatePresence`
  slide+spring panel; animate the FAB.
- Notifications bell: `pulse-ring` on unread dot (already have keyframe).

## 5. Marketplace (`marketplace/*`)

- `cards.tsx`: `Stagger` load/truck cards; on hover lift is fine but reduce the
  base shadow; add micro `Tappable` press.
- `route-strip.tsx`: animate the waypoint line drawing on mount (reuse
  `route-draw`), stagger chips.
- `filter-bar.tsx`: animated filter chip selection (`layoutId` ring) and
  smooth results re-flow.
- `marketplace/page.tsx`: page-level `Reveal` + `AnimatePresence` layout
  transition when filters change (cards animate in/out).

## 6. Dashboard / Widgets (`dashboard/*`)

- `stat-card.tsx`: count-up animated numbers; stagger the stat grid.
- `charts.tsx` (recharts): keep native transitions; add `Reveal` on the chart
  container and an initial draw fade.
- `widgets.tsx`: stagger widget cards; add skeleton shimmer on load states.

## 7. Tracking (`tracking/*`)

- `map-placeholder.tsx` / `real-map.tsx`: already have route-draw + truck-drive;
  add a live "ETA countdown" tick and stagger `timeline.tsx` steps as they
  complete. These are the demo's most dynamic surface — polish here sells it.

## 8. Buttons / Inputs (`components/ui/*`)

- `button.tsx`: consistent scale/active feedback; spring on hover.
- `input.tsx`: animated focus ring (scale-in) instead of sudden border change.

---

## 9. Build Order

1. Tokens + `globals.css` card softening.
2. `components/ui/motion.tsx` primitives.
3. Landing pass.
4. App shell (nav pill + drawer).
5. Marketplace cards + strip + filter.
6. Dashboard widgets/stats.
7. Tracking polish.
8. `npm run lint` + `npm run typecheck` + `npm run dev` visual check.

## 10. Guardrails

- Every new animation must be disabled under `prefers-reduced-motion` (the
  global rule in `globals.css` already forces `0.001ms`, so keep motion in CSS
  transitions/keyframes or ensure Framer `useReducedMotion` for JS springs).
- No new dependencies — reuse framer-motion + existing keyframes.
- Keep it minimal: if a shadow/border/gradient isn't earning its place, remove
  it rather than adding another.
