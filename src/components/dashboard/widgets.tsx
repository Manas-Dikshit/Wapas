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

export function RecentBookings({ bookings: items = bookings }: { bookings?: RecentBookingItem[] }) {
  return (
    <div className="card-surface">
      <div className="flex items-center justify-between p-5 sm:p-6">
        <h3 className="font-display text-base font-bold text-navy-600">Recent bookings</h3>
        <Link href="/bookings" className="flex items-center gap-1 text-xs font-bold text-blue-500">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-navy-100">
        {items.slice(0, 4).map((b) => (
          <Link key={b.id} href={`/tracking/${b.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-navy-50/60 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy-600">{b.loadTitle}</p>
              <p className="text-xs text-navy-400">{b.route}{b.vehicleNumber ? ` · ${b.vehicleNumber}` : ''}</p>
              {b.status === 'in-transit' && <Progress value={b.progressPct} className="mt-2 max-w-[160px]" />}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-navy-600">{formatINR(b.amount)}</p>
              <Badge variant={statusVariant[b.status]} className="mt-1">
                {b.status.replace('-', ' ')}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
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

export function AiRecommendations({ loads: items = mockRecommendations }: { loads?: AiRecommendationItem[] }) {
  return (
    <div className="card-surface">
      <div className="flex items-center gap-2 p-5 sm:p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-wapas-gradient text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="font-display text-base font-bold text-navy-600">AI recommended loads</h3>
      </div>
      <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
        {items.slice(0, 3).map((l) => (
          <Link
            key={l.id}
            href={`/marketplace/${l.id}`}
            className="flex items-center justify-between rounded-2xl border border-navy-100 p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-600">{l.title}</p>
              <p className="text-xs text-navy-400">{l.originCity} → {l.destinationCity} · {l.weightTons}T</p>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-extrabold text-blue-500">{l.matchScore}%</p>
              <p className="text-[10px] text-navy-300">match</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
