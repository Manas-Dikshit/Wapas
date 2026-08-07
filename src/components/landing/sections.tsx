'use client';

import { motion } from 'framer-motion';
import { Brain, Coins, Gauge, MapPinned, ShieldCheck, Timer } from 'lucide-react';

const problems = [
  { stat: '38%', label: 'of return trips run empty', desc: 'Transporters absorb the full cost of the backhaul leg with zero revenue.' },
  { stat: '2–3 days', label: 'average wait for capacity', desc: 'Shippers call a dozen brokers before finding a truck that fits.' },
  { stat: '₹62,000Cr', label: 'lost to empty running yearly', desc: 'Industry-wide inefficiency across India\'s road freight network.' }
];

const features = [
  { icon: Brain, title: 'AI backhaul matching', desc: 'Scores every open load against your route, capacity and timing — ranked by true fit, not just distance.' },
  { icon: MapPinned, title: 'Live shipment tracking', desc: 'Door-to-door visibility with driver, ETA and milestone updates on one timeline.' },
  { icon: Coins, title: 'Escrow-backed payments', desc: 'Funds are held safely and released on delivery — no chasing invoices.' },
  { icon: Gauge, title: 'Fleet utilization dashboard', desc: 'See idle time, empty-leg %, and revenue per truck at a glance.' },
  { icon: ShieldCheck, title: 'Verified network', desc: 'GST, KYC and document checks on every transporter and shipper.' },
  { icon: Timer, title: 'Instant booking', desc: 'Confirm a truck or a load in under two minutes, no back-and-forth calls.' }
];

export function ProblemSolution() {
  return (
    <section id="solution" className="border-y border-navy-100/60 bg-white py-20">
      <div className="container-app">
        <SectionEyebrow label="The problem" />
        <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">
          Trucks run empty. Shippers wait. Everyone loses margin.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {problems.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-xl3 border border-navy-100 p-6"
            >
              <p className="font-display text-4xl font-extrabold text-blue-500">{p.stat}</p>
              <p className="mt-2 text-sm font-bold text-navy-600">{p.label}</p>
              <p className="mt-2 text-sm text-navy-400">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container-app">
        <SectionEyebrow label="Why Wapas" />
        <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">
          One marketplace. Every tool a fleet or shipper needs.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group rounded-xl3 border border-navy-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-floating"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wapas-gradient text-white transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-navy-600">{f.title}</h3>
              <p className="mt-2 text-sm text-navy-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-aqua-600">
      <span className="h-px w-6 bg-aqua-400" />
      {label}
    </div>
  );
}
