'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  delta,
  trend
}: {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
}) {
  const numeric = /^\d+(\.\d+)?$/.test(value.replace(/[,₹%L]+/g, ''));
  return (
    <div className="card-surface p-5 transition-shadow duration-300 hover:shadow-floating">
      <p className="text-xs font-semibold text-navy-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-navy-600">
        {numeric ? <CountUp value={parseFloat(value.replace(/[,₹%L]+/g, ''))} prefix={value.includes('₹') ? '₹' : ''} suffix={value.endsWith('%') ? '%' : ''} /> : value}
      </p>
      <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-bold', trend === 'up' ? 'text-emerald-600' : 'text-red-500')}>
        {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {delta}
      </div>
    </div>
  );
}

function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const start = performance.now();
    const duration = 800;
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
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}