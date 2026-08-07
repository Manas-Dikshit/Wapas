# Wapas — Truck Backhaul Marketplace

Wapas matches empty return-leg trucks with ready-to-ship loads in real time.
This repo is a **demo-ready, production-styled** frontend built for investor
and stakeholder demos: every screen is populated with realistic mock data,
every button navigates somewhere real, and every flow (auth, posting a load,
booking, payment, tracking) works end to end without any backend running.

It is genuinely a Next.js application (not a static prototype) and is wired
to optionally connect to a real Supabase backend — see
[`docs/SUPABASE.md`](./docs/SUPABASE.md) for the migrations and RLS policies
to deploy when you're ready to go from demo to real data.

---

## 1. Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required — the app
runs entirely on the mock data in `src/lib/mock-data.ts`.

On the login page, use the **Quick demo access** buttons (Transporter /
Shipper / Admin) to jump straight into the dashboard, or use the OTP flow
with any email and the code `123456`.

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint     # eslint
npm run typecheck # tsc --noEmit
```

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS + hand-written shadcn-style primitives (`src/components/ui`) |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | lucide-react |
| Forms | native controlled inputs (React Hook Form + Zod are installed and ready for stricter validation) |
| Toasts | Sonner |
| Backend (optional) | Supabase (Postgres + Auth + RLS) — see `supabase/` |

---

## 3. Project structure

```
src/
  app/
    page.tsx                 Landing page (marketing site)
    login/, register/        Auth flows (mocked OTP + role selection)
    (app)/                   Route group for the authenticated product —
                              shares the sidebar/bottom-nav shell
      dashboard/              Role-aware home dashboard
      marketplace/            Load & truck search, filters, detail page
      booking/[id]/           3-step booking → payment → confirmation flow
      bookings/                "My trips" list
      tracking/[id]/          Live tracking screen (animated route, timeline)
      wallet/                 Wallet balance, payment methods, transactions
      analytics/              Revenue, utilization, route performance charts
      admin/                  User management, disputes, system health
      profile/                Profile, documents/KYC, preferences
      settings/               Notifications, privacy, appearance, security
      notifications/          Notification inbox
      post-load/              Shipper "post a load" form
      help/                   Help Center / FAQ
  components/
    ui/                       Button, Card, Badge, Input, Progress, Avatar, Tabs, Switch...
    layout/                   AppShell (sidebar + bottom nav), AuthShell
    landing/, dashboard/, marketplace/, tracking/   Feature-specific components
  lib/
    types.ts                  Domain types (Profile, Truck, Load, Booking, ...)
    mock-data.ts               All demo data lives here — single source of truth
    utils.ts                   cn(), currency formatters, initials()
    supabase/                  Browser + server Supabase clients (safe no-ops until configured)
supabase/
  migrations/                 Numbered SQL migrations — see docs/SUPABASE.md
  seed.sql                    Optional demo data matching mock-data.ts
docs/
  SUPABASE.md                 Full migration + RLS deployment guide
```

### Why a route group?

`src/app/(app)/` is a Next.js route group — it doesn't affect the URL, it
just lets every page under it (`/dashboard`, `/marketplace`, `/wallet`, ...)
share the same `layout.tsx`, which renders `<AppShell>` (desktop sidebar +
topbar, mobile bottom nav + drawer menu). `/`, `/login` and `/register` sit
outside the group because they use their own layouts (marketing navbar /
`AuthShell` split screen).

---

## 4. Design system

All brand tokens live in `tailwind.config.ts` and `src/app/globals.css`:

- **Colors** — `canvas` (#FEFCFA background), `navy` (#262D53, the brand's
  dark navy, with a full 50–900 scale), `blue` (#4A7FCE primary), `aqua`
  (#69C8D4 accent). Gradients: `bg-wapas-gradient` (blue → aqua) and
  `bg-wapas-gradient-dark` (navy → blue).
- **Typography** — Plus Jakarta Sans for headings/display (`font-display`),
  Inter for body copy (`font-body`), loaded via `next/font/google` in
  `src/app/layout.tsx`.
- **Surfaces** — `.card-surface` (white, rounded-xl3, soft shadow) is the
  base for every card in the product. `.glass` gives a frosted glassmorphism
  panel where needed.
- **Motion** — custom Tailwind keyframes for `fade-up`, `scale-in`,
  `shimmer` (skeleton loading), `route-draw` (SVG route line animating in),
  `truck-drive`, and `pulse-ring` (live-location pulse on the tracking map).
  Framer Motion handles viewport-triggered reveals and page-level transitions.
- **Signature motif** — the logo's road-and-pin swoosh is echoed throughout
  the product as an animated route line connecting two points (hero section,
  marketplace detail page, live tracking map) rather than reused as a literal
  icon, so it reads as a design system rather than a copy-paste of the logo.

---

## 5. Mock data & "everything works" demo mode

`src/lib/mock-data.ts` is the single source of truth for demo content:
profiles, trucks, loads, bookings, transactions, notifications, route stats
and chart series. Every page imports from here — there is no hidden
placeholder or "TODO: fetch real data" left anywhere in the UI.

Forms (login OTP, register, post a load, booking payment) simulate a network
request with a short `setTimeout`, show a loading state, then a `sonner`
toast confirmation and navigate on — this is what makes the demo feel like a
real, live product without needing a backend running during a pitch.

**To connect real data:** replace the imports from `mock-data.ts` in a page
with a Supabase query using `createClient()` (browser) or
`createServerSupabaseClient()` (server components), both in `src/lib/supabase/`.
They return `null` when Supabase env vars aren't set, so you can migrate one
page at a time without breaking the rest of the demo.

---

## 6. Supabase backend (optional)

Full instructions, the migration files, and — importantly — **which RLS
policies to deploy** live in [`docs/SUPABASE.md`](./docs/SUPABASE.md).
Short version:

```bash
# 1. Create a project at supabase.com, then link it locally:
npx supabase login
npx supabase link --project-ref <your-project-ref>

# 2. Push the schema + RLS policies:
npx supabase db push

# 3. (Optional) load demo data:
npx supabase db execute --file supabase/seed.sql

# 4. Copy .env.example to .env.local and fill in your project URL + anon key
```

---

## 7. Responsive & accessibility notes

- Mobile-first at 320–414px, verified breakpoints at 768 / 1024 / 1440 and
  ultra-wide via `max-w-[1400px]` containers.
- Bottom navigation + floating "Post" action button on mobile; collapses into
  a left sidebar + topbar on `lg:` (1024px+).
- All interactive elements use visible focus rings (`:focus-visible` in
  `globals.css`), semantic buttons/links, and `aria-label`/`aria-expanded`
  where appropriate (menus, accordions, switches).
- `prefers-reduced-motion` is respected globally — animations collapse to
  near-instant for users who request it.

---

## 8. Known simplifications (by design, per the brief)

- **Auth is mocked.** OTP always accepts any 6 digits after the demo hint;
  "Continue with Google" and the three demo-role buttons sign you in
  instantly. Wire up real Supabase Auth (or another provider) before
  shipping to real users.
- **Payments are mocked.** The booking flow simulates a payment and always
  succeeds. Swap in a real gateway (Razorpay/Stripe) behind the same UI.
- **Maps are stylized SVG**, not a live Mapbox/Google Maps embed — this keeps
  the demo working with zero API keys. The `TrackingMap` component
  (`src/components/tracking/map-placeholder.tsx`) is isolated so it's a
  drop-in swap for a real map SDK later.
- **AI match scores are illustrative** (`backhaul_match_score()` in
  `0002_functions_triggers.sql` shows the intended real formula), not backed
  by a trained model.
