'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, Navigation } from 'lucide-react';
import type { Route } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function RoutePreview({ route, className }: { route: Route; className?: string }) {
  const [open, setOpen] = useState(false);
  const stops = route.stops;
  const last = stops.length - 1;
  const midStops = stops.filter((s, i) => i !== 0 && i !== last && !s.isHighwayJunction);

  if (stops.length === 0) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        open ? 'border-aqua-300 bg-white shadow-soft' : 'border-navy-100 bg-navy-50/60 hover:border-aqua-200',
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
          <span className="z-10 shrink-0 rounded-full bg-wapas-gradient px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {stops[0].city}
          </span>
          <div className="relative mx-1 flex flex-1 items-center">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-route-line" />
            {midStops.length > 0 && (
              <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-around">
                {midStops.slice(0, 3).map((s) => (
                  <span key={s.city} className="h-2 w-2 rounded-full border-2 border-white bg-aqua-500 shadow-sm" />
                ))}
              </span>
            )}
          </div>
          <span className="z-10 shrink-0 rounded-full bg-navy-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {stops[last].city}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-navy-400">
          <MapPin className="h-3.5 w-3.5 text-aqua-500" />
          {midStops.length > 0 ? `${midStops.length} stops` : 'Direct'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="animate-fade-up border-t border-aqua-100 bg-canvas/60 px-4 py-4">
          <ol className="flex flex-col">
            {stops.map((stop, i) => {
              const isTerminal = i === 0 || i === last;
              const isJunction = !!stop.isHighwayJunction && !isTerminal;
              const isIntermediate = !isTerminal && !isJunction;
              return (
                <li key={stop.city} className="relative flex gap-3 pb-3.5 last:pb-0">
                  {i !== last && <span className="absolute left-[10px] top-7 bottom-0 w-px bg-navy-100" />}
                  <span
                    className={cn(
                      'relative z-10 mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      isTerminal
                        ? 'border-white bg-wapas-gradient shadow-glow'
                        : isJunction
                          ? 'border-blue-400 bg-white'
                          : 'border-aqua-400 bg-aqua-50'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isTerminal ? 'bg-white' : isJunction ? 'bg-blue-500' : 'bg-aqua-500'
                      )}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className={cn('truncate text-sm', isIntermediate ? 'font-bold text-navy-600' : 'font-semibold text-navy-500')}>
                          {stop.city}
                        </p>
                        {isJunction && <Badge variant="blue">Junction</Badge>}
                        {isIntermediate && <Badge variant="aqua">Pickup point</Badge>}
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-navy-400">{stop.kmFromOrigin} km</span>
                    </div>
                    {stop.state && <p className="truncate text-[11px] text-navy-400">{stop.state}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2.5 text-[11px] font-medium text-blue-600">
            <Navigation className="h-3.5 w-3.5 shrink-0" />
            You can schedule pickup or drop-off at any intermediate stop along this route.
          </p>
        </div>
      )}
    </div>
  );
}