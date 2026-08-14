'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MapPin, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-14 sm:pb-28 sm:pt-20">

      <div className="container-app relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-1.5 text-xs font-bold text-navy-500 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-aqua-400" />
            Started from my own freight, now in india
          </div>
          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.08] text-navy-600 sm:text-6xl">
            Every empty mile
            <br />
            is a <span className="text-blue-500">wasted trip.</span>
            <br />
            Wapas fixes that.
          </h1>
          <p className="mt-6 max-w-lg text-base text-navy-400 sm:text-lg">
            Wapas matches your truck&apos;s return leg with a ready-to-ship load in real time —
            so transporters earn on the way back, and shippers get capacity in minutes, not days.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'group')}>
              Sign up
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              View live demo
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-navy-400">
            <Stagger delay={0.4} className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <StaggerItem><Stat value={6900} suffix="+" label="trucks on the network" /></StaggerItem>
              <StaggerItem><Stat value={4.7} prefix="₹" suffix="Cr" label="in monthly matched freight" /></StaggerItem>
              <StaggerItem><Stat value={31} suffix="%" label="avg. empty-leg reduction" /></StaggerItem>
            </Stagger>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <RouteMatchCard />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  return (
    <div>
      <p className="font-display text-xl font-extrabold text-navy-600">
        {prefix}
        <CountUp value={value} />
        {suffix}
      </p>
      <p className="text-xs text-navy-400">{label}</p>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (reduce || !ref.current) {
      setDisplay(value.toLocaleString('en-IN'));
      return;
    }
    const el = ref.current;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value).toLocaleString('en-IN'));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [value, reduce]);

  return <span ref={ref}>{display}</span>;
}

function RouteMatchCard() {
  return (
    <div className="relative rounded-xl4 border border-navy-100 bg-white p-6 shadow-floating">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">AI backhaul match</span>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          Live
        </span>
      </div>

      <div className="relative flex items-center justify-between px-1">
        <RoutePoint label="Mumbai" icon={<MapPin className="h-4 w-4" />} />
        <svg viewBox="0 0 200 40" className="h-8 w-full max-w-[140px]" preserveAspectRatio="none">
          <path
            d="M0 30 C 50 5, 80 5, 100 20 S 150 35, 200 10"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="400"
            className="animate-route-draw"
          />
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4A7FCE" />
              <stop offset="100%" stopColor="#69C8D4" />
            </linearGradient>
          </defs>
        </svg>
        <RoutePoint label="Pune" icon={<MapPin className="h-4 w-4" />} />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-navy-50 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
          <Truck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy-600">Textile Rolls · 14T Container</p>
          <p className="text-xs text-navy-400">148 km · Pickup in 4 hrs</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-blue-500">94%</p>
          <p className="text-[10px] font-semibold text-navy-300">match</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Fuel saved', value: '₹4,200' },
          { label: 'ETA', value: '3h 40m' },
          { label: 'Payout', value: '₹21,500' }
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-2.5 shadow-soft">
            <p className="text-[13px] font-bold text-navy-600">{s.value}</p>
            <p className="text-[10px] text-navy-300">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutePoint({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">{icon}</div>
      <span className="text-[11px] font-bold text-navy-500">{label}</span>
    </div>
  );
}
