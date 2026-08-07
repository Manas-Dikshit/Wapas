import Link from 'next/link';
import { Package, Plus, Search, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart, UtilizationChart } from '@/components/dashboard/charts';
import { RecentBookings, AiRecommendations } from '@/components/dashboard/widgets';
import { currentProfile, dashboardStats } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function DashboardPage() {
  const stats = dashboardStats[currentProfile.role === 'admin' ? 'transporter' : currentProfile.role];
  const firstName = currentProfile.fullName.split(' ')[0];

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Good to see you, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-navy-400">Here&apos;s what&apos;s moving across your network today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketplace" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Search className="h-4 w-4" /> Find loads
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
              <h3 className="font-display text-base font-bold text-navy-600">Revenue overview</h3>
              <p className="text-xs text-navy-400">Last 6 months</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> +13.1%
            </span>
          </div>
          <div className="px-2 pb-4 sm:px-4">
            <RevenueChart />
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Fleet utilization</h3>
          <p className="mb-4 text-xs text-navy-400">This week</p>
          <UtilizationChart />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>
        <AiRecommendations />
      </div>

      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-wapas-gradient text-white">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-display text-base font-bold text-navy-600">Complete your KYC to unlock instant payouts</p>
          <p className="text-sm text-navy-400">GST and vehicle documents verified — 2 more documents pending.</p>
        </div>
        <Link href="/profile" className={cn(buttonVariants({ size: 'sm' }))}>
          Finish setup
        </Link>
      </div>
    </div>
  );
}
