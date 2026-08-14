'use client';

import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import type { Route } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RouteStrip } from '@/components/marketplace/route-strip';

export function RoutePreview({ route, className }: { route: Route; className?: string }) {
  const [open, setOpen] = useState(false);
  const stops = route.stops;
  const midCount = stops.length - 2;

  if (stops.length === 0) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        open ? 'border-aqua-300 bg-aqua-50/60' : 'border-navy-100 bg-navy-50/60 hover:border-aqua-200',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="relative flex flex-1 items-center">
          <span className="z-10 shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-navy-700 shadow-sm">
            {stops[0].city}
          </span>
          <div className="flex flex-1 items-center px-1">
            {stops.slice(1, -1).map((s) => (
              <span key={s.city} className="flex-1">
                <span className="block h-0.5 rounded-full bg-gradient-to-r from-aqua-200 to-blue-200" />
              </span>
            ))}
          </div>
          <span className="z-10 shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-navy-700 shadow-sm">
            {stops[stops.length - 1].city}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-navy-400">
          <MapPin className="h-3.5 w-3.5 text-aqua-500" />
          {midCount || 'Direct'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="animate-fade-up border-t border-aqua-100 px-4 py-3">
          <RouteStrip route={route} />
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-medium text-navy-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            You can schedule pickup or drop-off at any intermediate stop on this route.
          </p>
        </div>
      )}
    </div>
  );
}