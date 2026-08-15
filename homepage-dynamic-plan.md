# Plan — Make the Home Page Dynamic (content-driven)

## Goal

Today every landing section hardcodes its content **inside the component**
(`hero.tsx`, `sections.tsx`, `more-sections.tsx`, `navbar.tsx`): the hero copy
and stats, the problems, features, testimonials, pricing plans, FAQs, nav links
and footer. Editing any of it means digging into JSX.

Make the page **content-driven**: move all landing content into a single
typed data module that components render from. This gives one obvious place to
edit copy, makes the page easy to reorder/reuse, and is a clean stepping stone
to later pulling from a CMS or Supabase without touching the UI.

## 1. Content types — `src/lib/types.ts` (add)

```ts
export interface LandingHero {
  badge: string;
  titleA: string;      // "Every empty mile"
  titleHighlight: string; // "wasted trip."
  titleB: string;      // "Wapas fixes that."
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: { value: number; prefix?: string; suffix?: string; label: string }[];
}

export interface LandingSection<T> {
  id: string;
  eyebrow: string;
  heading: string;
  items: T[];
}

export interface ProblemCard { stat: string; label: string; desc: string }
export interface FeatureCard { icon: string; title: string; desc: string } // icon key, resolved by component
export interface Testimonial { name: string; role: string; quote: string; rating: number }
export interface PricingPlan {
  name: string; price: string; desc: string;
  features: string[]; highlighted: boolean; cta: string;
}
export interface FaqItem { q: string; a: string }
```

## 2. Content module — `src/lib/landing-content.ts` (new)

Export the actual content as typed constants: `navLinks`, `hero`, `problems`,
`features`, `testimonials`, `plans`, `faqs`, `cta`, `footer`. This is the **only
file** you edit to change landing copy.

- `features` uses an **icon key** (e.g. `'brain'`, `'map'`, `'coins'`) rather
  than a React component, so the data file stays a pure data module (safe to
  serialize / serve from a CMS later). A small icon map lives in the component.
- Export a `landingSections` array `[problems, features, testimonials, plans,
  faqs, cta]` so `page.tsx` can render sections **in any order** configuratively.

## 3. Refactor components to consume content

- `navbar.tsx` → use `navLinks` from the module (no local `links` array).
- `hero.tsx` → render hero title/description/CTAs/stats from `hero`.
- `sections.tsx` → render `ProblemSolution` and `Features` from `problems` /
  `features`; resolve icons via a local `iconMap`.
- `more-sections.tsx` → render `Testimonials`, `Pricing`, `FAQ`, `CTA` from
  `testimonials` / `plans` / `faqs` / `cta`.
- `footer.tsx` → use `footer` content (links, tagline).

Each component becomes a pure **renderer**: `map` over `props`/imported data and
keep all the existing animation primitives (`Reveal`, `Stagger`, `StaggerItem`)
and styling exactly as-is.

## 4. Data-driven section composition — `src/app/page.tsx`

Turn `page.tsx` into a thin loop that reads `landingSections` and renders each
section via a lookup (id → component). Order, add or remove sections by editing
the array — no JSX changes.

## 5. Future (out of scope for this change)

- Swap `landing-content.ts` for a Supabase/headless-CMS fetch (e.g. a
  `getLandingContent()` server function). Because content is plain typed JSON
  with icon keys, the components don't change — only the data source.

## 6. Build order

1. Add landing types to `src/lib/types.ts`.
2. Create `src/lib/landing-content.ts` (migrate existing copy verbatim).
3. Refactor `navbar`, `hero`, `sections`, `more-sections`, `footer` to consume it.
4. Make `page.tsx` loop over `landingSections`.
5. Run `npm run typecheck`, `npm run lint`, `npm run build`; verify visually.

## Guardrails

- **No visual change** — this is a data/architecture refactor. Keep all copy,
  styling and animations identical; verify side-by-side.
- Keep the content module **pure data** (no React imports) so it stays
  serializable and CMS-ready.
- No new dependencies.