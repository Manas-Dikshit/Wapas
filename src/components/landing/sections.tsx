'use client';

import type { LucideIcon } from 'lucide-react';
import { Brain, Coins, Gauge, MapPinned, ShieldCheck, Timer } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { features as featuresContent, problems } from '@/lib/landing-content';

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  map: MapPinned,
  coins: Coins,
  gauge: Gauge,
  shield: ShieldCheck,
  timer: Timer
};

export function ProblemSolution() {
  return (
    <section id="solution" className="border-y border-navy-100/60 bg-white py-20">
      <div className="container-app">
        <SectionEyebrow label="The problem" />
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">
            Trucks run empty. Shippers wait. Everyone loses margin.
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-3">
          {problems.map((p) => (
            <StaggerItem key={p.label} className="rounded-xl3 border border-navy-100 p-6">
              <p className="font-display text-4xl font-extrabold text-blue-500">{p.stat}</p>
              <p className="mt-2 text-sm font-bold text-navy-600">{p.label}</p>
              <p className="mt-2 text-sm text-navy-400">{p.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container-app">
        <SectionEyebrow label="Why Wapas" />
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-600 sm:text-4xl">
            One marketplace. Every tool a fleet or shipper needs.
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuresContent.map((f) => {
            const Icon = iconMap[f.icon] ?? Brain;
            return (
              <StaggerItem key={f.title} className="group rounded-xl3 border border-navy-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-floating">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-white transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-navy-600">{f.title}</h3>
                <p className="mt-2 text-sm text-navy-400">{f.desc}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
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