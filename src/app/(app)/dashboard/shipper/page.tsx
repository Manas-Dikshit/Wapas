import Link from 'next/link';
import { ArrowRight, Package, Plus, Star, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/dashboard/charts';
import { RecentBookings } from '@/components/dashboard/widgets';
import { currentProfile, dashboardStats, loads, trucks } from '@/lib/mock-data';
import { formatINR } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/primitives';

const openLoads = loads.filter((l) => l.status === 'open').slice(0, 4);
const savedTransporters = trucks.filter((t) => t.matchScore && t.matchScore >= 88).slice(0, 3);

export default function ShipperDashboardPage() {
  const stats = dashboardStats.shipper;
  const firstName = currentProfile.fullName.split(' ')[0];

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Good to see you, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-navy-400">Track your open loads and keep your network moving.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketplace" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Star className="h-4 w-4" /> Saved transporters
          </Link>
          <Link href="/post-load" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
            <Plus className="h-4 w-4" /> Post a load
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2">
          <div className="flex items-center justify-between p-5 sm:p-6">
            <div>
              <h3 className="font-display text-base font-bold text-navy-600">Spend overview</h3>
              <p className="text-xs text-navy-400">Last 6 months</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> -8.4% vs budget
            </span>
          </div>
          <div className="px-2 pb-4 sm:px-4">
            <RevenueChart />
          </div>
        </div>

        <div className="card-surface">
          <div className="flex items-center justify-between p-5 sm:p-6">
            <h3 className="font-display text-base font-bold text-navy-600">Open loads</h3>
            <Link href="/marketplace" className="flex items-center gap-1 text-xs font-bold text-blue-500">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {openLoads.map((l) => (
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
                  <p className="font-display text-sm font-extrabold text-blue-500">{formatINR(l.budget)}</p>
                  <Badge variant="aqua" className="mt-1">open</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Saved transporters</h3>
          <Link href="/marketplace" className="flex items-center gap-1 text-xs font-bold text-blue-500">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6 sm:pb-6">
          {savedTransporters.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
              <Avatar name={t.transporterName} className="h-10 w-10 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy-600">{t.transporterName}</p>
                <p className="text-xs text-navy-400">{t.type} · {t.currentCity}</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-navy-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {t.matchScore}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-wapas-gradient text-white">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-display text-base font-bold text-navy-600">Need capacity fast?</p>
          <p className="text-sm text-navy-400">Post a load and get AI-matched transporters within minutes.</p>
        </div>
        <Link href="/post-load" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <Plus className="h-4 w-4" /> Post a load
        </Link>
      </div>

      <RecentBookings />
    </div>
  );
}
