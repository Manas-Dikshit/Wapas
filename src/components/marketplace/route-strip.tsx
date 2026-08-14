import { MapPin, Route as RouteIcon } from 'lucide-react';
import type { Route, RouteStop } from '@/lib/types';
import { cn } from '@/lib/utils';

export function RouteHighway({ route, className }: { route: Route; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold text-navy-400', className)}>
      <RouteIcon className="h-3.5 w-3.5 text-aqua-500" />
      via {route.highway}
    </span>
  );
}

export function RouteStrip({
  route,
  highlightCity,
  className
}: {
  route: Route;
  highlightCity?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {route.stops.map((stop, i) => {
          const isLast = i === route.stops.length - 1;
          return (
            <div key={`${stop.city}-${i}`} className="flex items-center gap-1.5">
              <StopChip stop={stop} highlighted={highlightCity ? stop.city === highlightCity : false} />
              {!isLast && <span className="h-px w-4 bg-navy-200" />}
            </div>
          );
        })}
      </div>
      <RouteHighway route={route} />
    </div>
  );
}

function StopChip({ stop, highlighted }: { stop: RouteStop; highlighted: boolean }) {
  const isTerminal = stop.isHighwayJunction && highlighted;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
        highlighted ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-navy-100 bg-white text-navy-500'
      )}
    >
      <MapPin className={cn('h-3 w-3', isTerminal ? 'text-blue-500' : 'text-navy-300')} />
      {stop.city}
    </span>
  );
}
