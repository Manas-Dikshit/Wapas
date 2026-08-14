'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, MapPin, Route as RouteIcon, Truck, Zap } from 'lucide-react';
import type { Route } from '@/lib/types';
import { routes, trucks } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function trucksThrough(city: string) {
  return trucks.filter((t) => t.route?.stops.some((s) => s.city === city)).length;
}

export function IntermediateStops() {
  const corridors = Object.values(routes);

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy-600">Book at intermediate stops</h2>
          <p className="mt-1 text-sm text-navy-400">
            Hitch onto an empty-leg truck at any mid-route city. Tap a pickup point along a corridor to place your load.
          </p>
        </div>
        <Badge variant="aqua" className="w-fit">
          <Zap className="h-3 w-3" /> Backhaul ready
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {corridors.map((route) => (
          <CorridorCard key={`${route.originCity}→${route.destinationCity}`} route={route} />
        ))}
      </div>
    </section>
  );
}

function CorridorCard({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const last = route.stops.length - 1;
  const midStops = route.stops.filter((s, i) => i !== 0 && i !== last && !s.isHighwayJunction);
  const livePickups = midStops.filter((s) => trucksThrough(s.city) > 0).length;

  return (
    <div
      className={cn(
        'card-surface flex flex-col overflow-hidden transition-all duration-300',
        open ? 'hover:shadow-floating' : 'hover:-translate-y-0.5 hover:shadow-floating'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-navy-600">
            <span>{route.originCity}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-navy-300" />
            <span>{route.destinationCity}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <RouteIcon className="h-3.5 w-3.5 text-aqua-500" /> via {route.highway}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Truck className="h-3.5 w-3.5" /> {route.distanceKm} km
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge variant="aqua">
              {midStops.length} pickup point{midStops.length > 1 ? 's' : ''}
            </Badge>
            {livePickups > 0 && (
              <Badge variant="success">
                {livePickups} with live trucks
              </Badge>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-navy-300 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="animate-fade-up border-t border-navy-100 px-5 py-4">
          <p className="mb-4 text-xs font-medium text-navy-400">
            Every dot below is a city on this corridor. Aqua pickup points let you hitch onto an empty-leg truck —
            even if it isn&apos;t the origin or destination.
          </p>

          <ol className="flex flex-col">
            {route.stops.map((stop, i) => {
              const isTerminal = i === 0 || i === last;
              const isJunction = !!stop.isHighwayJunction && !isTerminal;
              const isIntermediate = !isTerminal && !isJunction;
              const count = trucksThrough(stop.city);
              return (
                <li key={stop.city} className="relative flex gap-3 pb-4 last:pb-0">
                  {i !== last && <span className="absolute left-[10px] top-7 bottom-0 w-px bg-navy-100" />}

                  <span
                    className={cn(
                      'relative z-10 mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      isTerminal
                        ? 'border-white bg-blue-500'
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

                    {isIntermediate && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-navy-400">
                          <MapPin className="h-3.5 w-3.5 text-aqua-500" />
                          <span className={cn(count > 0 ? 'font-bold text-emerald-600' : 'text-navy-400')}>
                            {count > 0 ? `${count} truck${count > 1 ? 's' : ''} pass through` : 'No live trucks yet'}
                          </span>
                        </span>
                        <Link
                          href={`/post-load?origin=${encodeURIComponent(stop.city)}&destination=${encodeURIComponent(route.destinationCity)}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                        >
                          Pickup here <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
