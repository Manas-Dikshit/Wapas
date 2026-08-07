'use client';

import { motion } from 'framer-motion';
import { MapPin, Truck } from 'lucide-react';

export function TrackingMap({ progressPct }: { progressPct: number }) {
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-xl3 bg-navy-600 sm:h-[340px]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-10%] h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #69C8D4 0%, transparent 70%)' }}
      />

      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path
          id="routePath"
          d="M40 160 C 100 40, 160 180, 220 90 S 320 20, 370 60"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M40 160 C 100 40, 160 180, 220 90 S 320 20, 370 60"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="600"
          strokeDashoffset={600 - (600 * progressPct) / 100}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <defs>
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#69C8D4" />
            <stop offset="100%" stopColor="#4A7FCE" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="160" r="6" fill="#69C8D4" />
        <circle cx="370" cy="60" r="6" fill="#4A7FCE" />
      </svg>

      <motion.div
        className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-floating"
        style={{ offsetPath: "path('M40 160 C 100 40, 160 180, 220 90 S 320 20, 370 60')" } as React.CSSProperties}
        animate={{ offsetDistance: `${progressPct}%` } as any}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <span className="relative flex h-full w-full items-center justify-center rounded-full">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-aqua-400/60" />
          <Truck className="relative h-5 w-5 text-blue-600" />
        </span>
      </motion.div>

      <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
        <MapPin className="h-3.5 w-3.5 text-aqua-300" /> Live location
      </div>
    </div>
  );
}
