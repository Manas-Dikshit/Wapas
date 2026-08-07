'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RevenueChart, UtilizationChart } from '@/components/dashboard/charts';
import { revenueSeries, routeStats } from '@/lib/mock-data';
import { StatCard } from '@/components/dashboard/stat-card';
import { formatCompactINR } from '@/lib/utils';

const kpis = [
  { label: 'Total trips (6mo)', value: '457', delta: '+18.4%', trend: 'up' as const },
  { label: 'Avg. revenue / trip', value: '₹2,780', delta: '+4.2%', trend: 'up' as const },
  { label: 'On-time rate', value: '96.2%', delta: '+1.1%', trend: 'up' as const },
  { label: 'Empty-leg rate', value: '11%', delta: '-23pp vs last year', trend: 'up' as const }
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-navy-400">Performance across revenue, trips and fleet utilization.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 sm:p-6 lg:col-span-2">
          <h3 className="font-display text-base font-bold text-navy-600">Revenue trend</h3>
          <p className="mb-2 text-xs text-navy-400">Monthly revenue, last 6 months</p>
          <RevenueChart />
        </div>
        <div className="card-surface p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Truck utilization</h3>
          <p className="mb-4 text-xs text-navy-400">Fleet-wide breakdown</p>
          <UtilizationChart />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Trips per month</h3>
          <p className="mb-2 text-xs text-navy-400">Completed trips</p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEFF6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#868CBD' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#868CBD' }} width={30} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #EEEFF6' }} />
                <Bar dataKey="trips" fill="#69C8D4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Top routes by savings</h3>
          <p className="mb-4 text-xs text-navy-400">Backhaul match performance</p>
          <div className="space-y-4">
            {routeStats.map((r) => (
              <div key={r.route}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy-600">{r.route}</span>
                  <span className="text-xs text-navy-400">{r.trips} trips</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-100">
                  <div className="h-full rounded-full bg-wapas-gradient" style={{ width: `${r.savingsPct * 2.5}%` }} />
                </div>
                <p className="mt-1 text-xs font-bold text-emerald-600">{r.savingsPct}% cost savings</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface p-5 sm:p-6">
        <h3 className="font-display text-base font-bold text-navy-600">Revenue summary</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {revenueSeries.slice(-3).map((r) => (
            <div key={r.month} className="rounded-2xl border border-navy-100 p-4">
              <p className="text-xs text-navy-400">{r.month} 2026</p>
              <p className="mt-1 font-display text-lg font-extrabold text-navy-600">{formatCompactINR(r.revenue)}</p>
              <p className="text-xs text-navy-400">{r.trips} trips</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
