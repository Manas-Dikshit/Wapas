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
  const last = route.stops.length - 1;
  const midStops = route.stops.filter((s, i) => i !== 0 && i !== last && !s.isHighwayJunction);

  return (
    <div className="card-surface flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-floating">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-navy-600">
          <span>{route.originCity}</span>
          <ArrowRight className="h-4 w-4 text-navy-300" />
          <span>{route.destinationCity}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-400">
          <Truck className="h-3.5 w-3.5" /> {route.distanceKm} km
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-navy-400">
        <RouteIcon className="h-3.5 w-3.5 text-aqua-500" />
        via {route.highway}
      </div>

      <ol className="mt-4 flex flex-1 flex-col">
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

      {midStops.length > 0 && (
        <div className="mt-3 border-t border-navy-100 pt-3">
          <p className="text-[11px] font-semibold text-navy-400">
            {midStops.length} mid-route pickup point{midStops.length > 1 ? 's' : ''} on this corridor
          </p>
        </div>
      )}
    </div>
  );
}
