import Link from 'next/link';
import { ArrowRight, MapPin, Truck } from 'lucide-react';
import { routes } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { RouteHighway } from '@/components/marketplace/route-strip';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';

export default function RoutesPage() {
  const allRoutes = Object.values(routes);

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Route Explorer</h1>
          <p className="mt-1 text-sm text-navy-400">
            Browse active truck corridors and their intermediate stops. Request a pickup at any city along the route —
            even if it isn&apos;t the origin or destination.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {allRoutes.map((route) => {
          const midStops = route.stops.filter((s) => !s.isHighwayJunction);
          return (
            <div key={`${route.originCity}→${route.destinationCity}`} className="card-surface flex flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-navy-600">
                  <span>{route.originCity}</span>
                  <ArrowRight className="h-4 w-4 text-navy-300" />
                  <span>{route.destinationCity}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-navy-400">
                  <Truck className="h-3.5 w-3.5" /> {route.distanceKm} km
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <RouteHighway route={route} />
                <Badge variant="aqua">{midStops.length} mid-route stops</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {route.stops.map((stop) => (
                  <span
                    key={stop.city}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                      stop.isHighwayJunction
                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                        : 'border-navy-100 bg-white text-navy-500'
                    )}
                  >
                    <MapPin className="h-3 w-3" />
                    {stop.city}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-navy-100 pt-4">
                <Link href="/marketplace" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                  <Truck className="h-3.5 w-3.5" /> View trucks on route
                </Link>
                <Link
                  href={`/post-load?origin=${encodeURIComponent(route.originCity)}&destination=${encodeURIComponent(route.destinationCity)}`}
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'gap-1.5')}
                >
                  <MapPin className="h-3.5 w-3.5" /> Request pickup at a stop
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
