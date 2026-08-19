import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Shield, Sparkles, Star, Truck as TruckIcon, Weight } from 'lucide-react';
import { loads, trucks } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/primitives';
import { cn, formatINR } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';
import { TruckTypeIcon } from '@/components/marketplace/truck-type-icon';
import { SaveTransporterButton } from '@/components/marketplace/save-transporter-button';
import { RouteStrip } from '@/components/marketplace/route-strip';

export default function MarketplaceDetailPage({ params }: { params: { id: string } }) {
  const load = loads.find((l) => l.id === params.id);
  const truck = trucks.find((t) => t.id === params.id);

  if (!load && !truck) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 animate-fade-up">
      {load && (
        <>
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {load.trending && <Badge variant="warning">Trending</Badge>}
                  {load.aiRecommended && <Badge variant="blue"><Sparkles className="h-3 w-3" /> AI recommended</Badge>}
                </div>
                <h1 className="font-display text-xl font-extrabold text-navy-600 sm:text-2xl">{load.title}</h1>
                <p className="mt-1 text-sm text-navy-400">Posted by {load.shipperName}</p>
              </div>
              <p className="font-display text-2xl font-extrabold text-blue-500 sm:text-3xl">{formatINR(load.budget)}</p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-navy-50 p-5">
              <RoutePoint label={load.originCity} />
              <div className="h-px flex-1 bg-aqua-400/60 mx-4" />
              <RoutePoint label={load.destinationCity} />
            </div>

            {load.route && (
              <div className="mt-4 rounded-2xl border border-navy-100 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-navy-600">Full route &amp; intermediate stops</p>
                  <Badge variant="aqua">Mid-route pickup available</Badge>
                </div>
                <RouteStrip route={load.route} />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Detail icon={<Weight className="h-4 w-4" />} label="Weight" value={`${load.weightTons}T`} />
              <Detail icon={<TruckIcon className="h-4 w-4" />} label="Truck type" value={load.truckTypeNeeded} />
              <Detail icon={<Calendar className="h-4 w-4" />} label="Pickup" value={new Date(load.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Distance" value={`${load.distanceKm} km`} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-display text-base font-bold text-navy-600">About the shipper</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={load.shipperName} />
              <div>
                <p className="text-sm font-bold text-navy-600">{load.shipperName}</p>
                <p className="flex items-center gap-1 text-xs text-navy-400"><Shield className="h-3.5 w-3.5 text-emerald-500" /> GST verified · Member since 2023</p>
              </div>
            </div>
          </div>

          <Link href={`/booking/${load.id}`} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            Book this load
          </Link>
        </>
      )}

      {truck && (
        <>
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {truck.matchScore && <Badge variant="blue"><Sparkles className="h-3 w-3" /> {truck.matchScore}% match</Badge>}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <TruckTypeIcon type={truck.type} className="h-10 w-16 shrink-0" />
                  <h1 className="font-display text-xl font-extrabold text-navy-600 sm:text-2xl">{truck.type} · {truck.capacityTons}T capacity</h1>
                </div>
                <p className="mt-1 text-sm text-navy-400">{truck.regNumber} · Operated by {truck.transporterName}</p>
              </div>
              <p className="font-display text-2xl font-extrabold text-blue-500 sm:text-3xl">{formatINR(truck.pricePerTon)}<span className="text-sm font-medium text-navy-400">/ton</span></p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-navy-50 p-5">
              <RoutePoint label={truck.currentCity} />
              <div className="h-px flex-1 bg-aqua-400/60 mx-4" />
              <RoutePoint label={truck.destinationCity} />
            </div>

            {truck.route && (
              <div className="mt-4 rounded-2xl border border-navy-100 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-navy-600">Full route &amp; intermediate stops</p>
                  <Badge variant="aqua">Mid-route pickup available</Badge>
                </div>
                <RouteStrip route={truck.route} />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Detail icon={<Weight className="h-4 w-4" />} label="Capacity" value={`${truck.capacityTons}T`} />
              <Detail icon={<TruckIcon className="h-4 w-4" />} label="Type" value={truck.type} />
              <Detail icon={<Calendar className="h-4 w-4" />} label="Available" value={new Date(truck.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <Detail icon={<Star className="h-4 w-4" />} label="Rating" value={truck.transporterRating.toString()} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-display text-base font-bold text-navy-600">About the transporter</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={truck.transporterName} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-600">{truck.transporterName}</p>
                <p className="flex items-center gap-1 text-xs text-navy-400"><Shield className="h-3.5 w-3.5 text-emerald-500" /> Verified fleet · {truck.transporterRating} rating</p>
              </div>
              <SaveTransporterButton transporterId={truck.transporterId} />
            </div>
          </div>

          <Link href={`/booking/${truck.id}`} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            Book this truck
          </Link>
        </>
      )}
    </div>
  );
}

function RoutePoint({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-500 shadow-soft">
        <MapPin className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold text-navy-600">{label}</span>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-navy-100 p-3">
      <div className="flex items-center gap-1.5 text-navy-300">
        {icon}
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-navy-600">{value}</p>
    </div>
  );
}
