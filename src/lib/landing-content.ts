import type {
  CtaContent,
  FaqItem,
  FeatureCard,
  FooterColumn,
  LandingHero,
  NavLink,
  PricingPlan,
  ProblemCard,
  Testimonial
} from './types';

/**
 * Single source of truth for the marketing/landing page. Pure data — no React.
 * Edit copy here; the landing components render it.
 */

export const navLinks: NavLink[] = [
  { href: '#solution', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' }
];

export const hero: LandingHero = {
  badge: 'Started from my own freight, now in india',
  titleA: 'Every empty mile',
  titleHighlight: 'wasted trip.',
  titleB: 'Wapas fixes that.',
  description:
    "Wapas matches your truck's return leg with a ready-to-ship load in real time — so transporters earn on the way back, and shippers get capacity in minutes, not days.",
  primaryCta: { href: '/register', label: 'Sign up' },
  secondaryCta: { href: '/login', label: 'View live demo' },
  stats: [
    { value: 6900, suffix: '+', label: 'trucks on the network' },
    { value: 4.7, prefix: '₹', suffix: 'Cr', label: 'in monthly matched freight' },
    { value: 31, suffix: '%', label: 'avg. empty-leg reduction' }
  ]
};

export const problems: ProblemCard[] = [
  { stat: '38%', label: 'of return trips run empty', desc: 'Transporters absorb the full cost of the backhaul leg with zero revenue.' },
  { stat: '2–3 days', label: 'average wait for capacity', desc: 'Shippers call a dozen brokers before finding a truck that fits.' },
  { stat: '₹62,000Cr', label: 'lost to empty running yearly', desc: 'Industry-wide inefficiency across India\'s road freight network.' }
];

export const features: FeatureCard[] = [
  { icon: 'brain', title: 'AI backhaul matching', desc: 'Scores every open load against your route, capacity and timing — ranked by true fit, not just distance.' },
  { icon: 'map', title: 'Live shipment tracking', desc: 'Door-to-door visibility with driver, ETA and milestone updates on one timeline.' },
  { icon: 'coins', title: 'Escrow-backed payments', desc: 'Funds are held safely and released on delivery — no chasing invoices.' },
  { icon: 'gauge', title: 'Fleet utilization dashboard', desc: 'See idle time, empty-leg %, and revenue per truck at a glance.' },
  { icon: 'shield', title: 'Verified network', desc: 'GST, KYC and document checks on every transporter and shipper.' },
  { icon: 'timer', title: 'Instant booking', desc: 'Confirm a truck or a load in under two minutes, no back-and-forth calls.' }
];

export const testimonials: Testimonial[] = [
  { name: 'Arjun Mehta', role: 'Fleet Owner, Mehta Logistics', quote: 'Our empty-leg rate dropped from 34% to 11% in two months. Wapas pays for itself every single week.', rating: 5 },
  { name: 'Priya Raghavan', role: 'Supply Chain Lead, Shreeji Textiles', quote: 'I used to call five brokers for one truck. Now I post a load and get matched transporters in minutes.', rating: 5 },
  { name: 'Bharat Patel', role: 'Owner, Patel Roadways', quote: 'The escrow payments alone changed how we plan cash flow. No more chasing shippers for money.', rating: 4.8 }
];

export const plans: PricingPlan[] = [
  { name: 'Starter', price: 'Free', desc: 'For owner-operators getting started', features: ['Up to 2 trucks listed', 'Basic AI matching', 'Standard support', '2% platform fee'], highlighted: false, cta: 'Choose Starter' },
  { name: 'Growth', price: '₹2,499/mo', desc: 'For growing fleets & regular shippers', features: ['Up to 25 trucks or loads', 'Priority AI matching', 'Escrow payments', 'Analytics dashboard', '1.2% platform fee'], highlighted: true, cta: 'Choose Growth' },
  { name: 'Enterprise', price: 'Custom', desc: 'For large fleets & logistics networks', features: ['Unlimited trucks & loads', 'Dedicated account manager', 'API access', 'Custom reporting', 'Negotiated platform fee'], highlighted: false, cta: 'Choose Enterprise' }
];

export const faqs: FaqItem[] = [
  { q: 'How does backhaul matching actually work?', a: 'Wapas scores every open load against your truck\'s current location, route, capacity and available date, then ranks matches by fit — factoring in distance, price and reliability.' },
  { q: 'Is my payment protected?', a: 'Yes. Funds are held in escrow when a booking is confirmed and released to the transporter automatically once delivery is confirmed.' },
  { q: 'What documents do I need to join?', a: 'Transporters need a GST number, vehicle RC and driving licence. Shippers need a business GST number. Verification usually takes under 24 hours.' },
  { q: 'Can I use Wapas on mobile?', a: 'Wapas is built mobile-first — every feature works on your phone, and the experience feels like a native app.' }
];

export const cta: CtaContent = {
  heading: 'Ready to stop paying for empty miles?',
  description: 'Join thousands of transporters and shippers already moving freight smarter on Wapas.',
  primaryCta: { href: '/register', label: 'Sign up' },
  secondaryCta: { href: '/login', label: 'Explore the demo' }
};

/**
 * Order in which the marketing sections render on the landing page. Reorder,
 * add or remove keys here to change the page composition without editing JSX.
 * Each key maps to a section component in src/app/page.tsx.
 */
export const landingSectionIds = ['solution', 'features', 'testimonials', 'pricing', 'faq', 'cta'] as const;
export type LandingSectionId = (typeof landingSectionIds)[number];

export const footer: {
  tagline: string;
  columns: FooterColumn[];
  copyright: string;
  tag: string;
} = {
  tagline:
    "India's AI-matched truck backhaul marketplace — fewer empty miles, faster capacity, fairer freight.",
  columns: [
    { title: 'Product', links: [['Marketplace', '/marketplace'], ['Dashboard', '/dashboard'], ['Tracking', '/bookings'], ['Pricing', '#pricing']].map(([label, href]) => ({ label, href })) },
    { title: 'Company', links: [['About', '#'], ['Careers', '#'], ['Blog', '#'], ['Contact', '#']].map(([label, href]) => ({ label, href })) },
    { title: 'Support', links: [['Help Center', '/help'], ['Safety', '#'], ['Terms', '#'], ['Privacy', '#']].map(([label, href]) => ({ label, href })) }
  ],
  copyright: '© 2026 Wapas Technologies Pvt Ltd. All rights reserved.',
  tag: 'Made for the road, built in India 🇮🇳'
};