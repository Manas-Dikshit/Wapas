import Link from 'next/link';
import { ArrowUpRight, Flame, MapPin, Sparkles, Truck as TruckIcon, Weight } from 'lucide-react';
import type { Load, Truck } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/utils';

export function LoadCard({ load }: { load: Load }) {
  return (
    <Link href={`/marketplace/${load.id}`} className="group card-surface block p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-floating">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy-600">{load.title}</p>
          <p className="text-xs text-navy-400">{load.shipperName}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {load.trending && <Badge variant="warning"><Flame className="h-3 w-3" /> Trending</Badge>}
          {load.aiRecommended && <Badge variant="blue"><Sparkles className="h-3 w-3" /> AI pick</Badge>}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy-500">
        <MapPin className="h-4 w-4 text-blue-400" />
        {load.originCity}
        <span className="text-navy-300">→</span>
        {load.destinationCity}
        <span className="ml-auto text-xs font-normal text-navy-300">{load.distanceKm} km</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-navy-400">
        <span className="flex items-center gap-1"><Weight className="h-3.5 w-3.5" /> {load.weightTons}T</span>
        <span className="flex items-center gap-1"><TruckIcon className="h-3.5 w-3.5" /> {load.truckTypeNeeded}</span>
        <span>Pickup {new Date(load.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-4">
        <p className="font-display text-lg font-extrabold text-navy-600">{formatINR(load.budget)}</p>
        <span className="flex items-center gap-1 text-xs font-bold text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
          View details <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function TruckCard({ truck }: { truck: Truck }) {
  return (
    <Link href={`/marketplace/${truck.id}`} className="group card-surface block p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-floating">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy-600">{truck.type} · {truck.capacityTons}T</p>
          <p className="text-xs text-navy-400">{truck.transporterName} · {truck.regNumber}</p>
        </div>
        {truck.matchScore && (
          <div className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-center">
            <p className="text-xs font-extrabold text-blue-600">{truck.matchScore}%</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy-500">
        <MapPin className="h-4 w-4 text-aqua-500" />
        {truck.currentCity}
        <span className="text-navy-300">→</span>
        {truck.destinationCity}
        {truck.emptyLeg && <Badge variant="aqua" className="ml-1">Empty leg</Badge>}
      </div>

      <div className="mt-4 text-xs text-navy-400">
        Available from {new Date(truck.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ★ {truck.transporterRating}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-4">
        <p className="font-display text-lg font-extrabold text-navy-600">{formatINR(truck.pricePerTon)}<span className="text-xs font-medium text-navy-400">/ton</span></p>
        <span className="flex items-center gap-1 text-xs font-bold text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
          Book now <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
