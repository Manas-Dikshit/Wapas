'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { SectionEyebrow } from './sections';

const testimonials = [
  { name: 'Arjun Mehta', role: 'Fleet Owner, Mehta Logistics', quote: 'Our empty-leg rate dropped from 34% to 11% in two months. Wapas pays for itself every single week.', rating: 5 },
  { name: 'Priya Raghavan', role: 'Supply Chain Lead, Shreeji Textiles', quote: 'I used to call five brokers for one truck. Now I post a load and get matched transporters in minutes.', rating: 5 },
  { name: 'Bharat Patel', role: 'Owner, Patel Roadways', quote: 'The escrow payments alone changed how we plan cash flow. No more chasing shippers for money.', rating: 4.8 }
];

const plans = [
  { name: 'Starter', price: 'Free', desc: 'For owner-operators getting started', features: ['Up to 2 trucks listed', 'Basic AI matching', 'Standard support', '2% platform fee'], highlighted: false },
  { name: 'Growth', price: '₹2,499/mo', desc: 'For growing fleets & regular shippers', features: ['Up to 25 trucks or loads', 'Priority AI matching', 'Escrow payments', 'Analytics dashboard', '1.2% platform fee'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For large fleets & logistics networks', features: ['Unlimited trucks & loads', 'Dedicated account manager', 'API access', 'Custom reporting', 'Negotiated platform fee'], highlighted: false }
];

const faqs = [
  { q: 'How does backhaul matching actually work?', a: 'Wapas scores every open load against your truck\'s current location, route, capacity and available date, then ranks matches by fit — factoring in distance, price and reliability.' },
  { q: 'Is my payment protected?', a: 'Yes. Funds are held in escrow when a booking is confirmed and released to the transporter automatically once delivery is confirmed.' },
  { q: 'What documents do I need to join?', a: 'Transporters need a GST number, vehicle RC and driving licence. Shippers need a business GST number. Verification usually takes under 24 hours.' },
  { q: 'Can I use Wapas on mobile?', a: 'Wapas is built mobile-first — every feature works on your phone, and the experience feels like a native app.' }
];

export function Testimonials() {
  return (
    <section className="border-y border-navy-100/60 bg-white py-20">
      <div className="container-app">
        <SectionEyebrow label="Trusted on the road" />
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">What our network says</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name} className="rounded-xl3 border border-navy-100 p-6">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4" fill={idx < Math.round(t.rating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="mt-4 text-sm text-navy-500">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5">
                <p className="text-sm font-bold text-navy-600">{t.name}</p>
                <p className="text-xs text-navy-400">{t.role}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="container-app">
        <SectionEyebrow label="Pricing" />
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">Simple pricing that scales with your fleet</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <StaggerItem key={p.name} className={cn(
              'relative rounded-xl3 border p-7',
              p.highlighted ? 'border-transparent bg-navy-600 text-white shadow-floating' : 'border-navy-100 bg-white'
            )}>
              {p.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-aqua-400 px-3 py-1 text-[11px] font-bold text-navy-700">Most popular</span>
              )}
              <h3 className={cn('font-display text-lg font-bold', p.highlighted ? 'text-white' : 'text-navy-600')}>{p.name}</h3>
              <p className={cn('mt-1 text-sm', p.highlighted ? 'text-white/70' : 'text-navy-400')}>{p.desc}</p>
              <p className={cn('mt-5 font-display text-3xl font-extrabold', p.highlighted ? 'text-white' : 'text-navy-600')}>{p.price}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className={cn('flex items-center gap-2 text-sm', p.highlighted ? 'text-white/85' : 'text-navy-500')}>
                    <Check className={cn('h-4 w-4 shrink-0', p.highlighted ? 'text-aqua-300' : 'text-aqua-500')} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: p.highlighted ? 'secondary' : 'outline', size: 'md' }),
                  'mt-7 w-full',
                  p.highlighted && 'bg-white text-navy-600 hover:bg-white/90'
                )}
              >
                Choose {p.name}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="border-y border-navy-100/60 bg-white py-20">
      <div className="container-app max-w-3xl">
        <SectionEyebrow label="FAQ" />
        <h2 className="font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-10 divide-y divide-navy-100">
          {faqs.map((f, i) => (
            <div key={f.q} className="py-4">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={openIdx === i}
              >
                <span className="text-sm font-bold text-navy-600 sm:text-base">{f.q}</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-navy-400 transition-transform', openIdx === i && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden text-sm text-navy-400"
                  >
                    <span className="block pt-3">{f.a}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-20">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-xl4 bg-wapas-gradient-dark px-8 py-16 text-center sm:px-16">
          <div aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0%, transparent 40%)' }} />
          <h2 className="relative font-display text-3xl font-extrabold text-white sm:text-4xl">Ready to stop paying for empty miles?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/75">Join thousands of transporters and shippers already moving freight smarter on Wapas.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-navy-600 hover:bg-white/90 shadow-none')}>
              Sign up
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-white/30 bg-transparent text-white hover:bg-white/10')}>
              Explore the demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
