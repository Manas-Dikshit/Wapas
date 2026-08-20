import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { bookings, loads } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/primitives';
import { formatINR } from '@/lib/utils';

const statusVariant = {
  confirmed: 'blue',
  'in-transit': 'aqua',
  delivered: 'success',
  cancelled: 'danger'
} as const;

export type RecentBookingItem = {
  id: string;
  loadTitle: string;
  route: string;
  vehicleNumber?: string;
  status: keyof typeof statusVariant;
  progressPct: number;
  amount: number;
};

export type BookingStatusAction = (id: string, next: 'in-transit' | 'delivered') => void;

export function RecentBookings({
  bookings: items = bookings,
  onUpdateStatus
}: {
  bookings?: RecentBookingItem[];
  onUpdateStatus?: BookingStatusAction;
}) {
  return (
    <div className="card-surface">
      <div className="flex items-center justify-between p-5 sm:p-6">
        <h3 className="font-display text-base font-bold text-navy-600">Recent bookings</h3>
        <Link href="/bookings" className="flex items-center gap-1 text-xs font-bold text-blue-500">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mx-5 mb-5 rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400 sm:mx-6 sm:mb-6">
          No bookings yet. Once a shipper books your truck, it will appear here.
        </p>
      ) : (
        <div className="divide-y divide-navy-100">
          {items.slice(0, 4).map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
              <Link href={`/tracking/${b.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy-600">{b.loadTitle}</p>
                <p className="truncate text-xs text-navy-400">{b.route}{b.vehicleNumber ? ` · ${b.vehicleNumber}` : ''}</p>
                {b.status === 'in-transit' && <Progress value={b.progressPct} className="mt-2 max-w-[160px]" />}
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant={statusVariant[b.status]}>
                  {b.status.replace('-', ' ')}
                </Badge>
                {onUpdateStatus && b.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(b.id, 'in-transit')}
                    className="flex min-h-[44px] items-center rounded-full bg-aqua-50 px-3 py-2 text-[11px] font-bold text-aqua-600 transition-colors hover:bg-aqua-100"
                  >
                    Start trip
                  </button>
                )}
                {onUpdateStatus && b.status === 'in-transit' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(b.id, 'delivered')}
                    className="flex min-h-[44px] items-center rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                  >
                    Mark delivered
                  </button>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-navy-600">{formatINR(b.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type AiRecommendationItem = {
  id: string;
  title: string;
  originCity: string;
  destinationCity: string;
  weightTons: number;
  matchScore: number;
};

const mockRecommendations: AiRecommendationItem[] = loads
  .filter((l) => l.aiRecommended)
  .map((l, i) => ({
    id: l.id,
    title: l.title,
    originCity: l.originCity,
    destinationCity: l.destinationCity,
    weightTons: l.weightTons,
    matchScore: 92 - i * 3
  }));

export function AiRecommendations({
  loads: items = mockRecommendations,
  onAccept
}: {
  loads?: AiRecommendationItem[];
  onAccept?: (id: string) => void;
}) {
  return (
    <div className="card-surface">
      <div className="flex items-center gap-2 p-5 sm:p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="font-display text-base font-bold text-navy-600">AI recommended loads</h3>
      </div>
      {items.length === 0 ? (
        <p className="mx-5 mb-5 rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400 sm:mx-6 sm:mb-6">
          No matching loads right now. Backhaul loads that fit your fleet will show up here as they&apos;re posted.
        </p>
      ) : (
        <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
          {items.slice(0, 3).map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-navy-100 p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <Link href={`/marketplace/${l.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy-600">{l.title}</p>
                <p className="truncate text-xs text-navy-400">{l.originCity} → {l.destinationCity} · {l.weightTons}T</p>
              </Link>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <div>
                  <p className="font-display text-sm font-extrabold text-blue-500">{l.matchScore}%</p>
                  <p className="text-[10px] text-navy-300">match</p>
                </div>
                {onAccept && (
                  <button
                    type="button"
                    onClick={() => onAccept(l.id)}
                    className="flex min-h-[44px] items-center rounded-full bg-blue-600 px-3.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
