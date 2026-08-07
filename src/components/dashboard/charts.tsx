'use client';

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { revenueSeries, utilizationSeries } from '@/lib/mock-data';
import { formatCompactINR } from '@/lib/utils';

const PIE_COLORS = ['#4A7FCE', '#69C8D4', '#8DA9E0', '#262D53'];

export function RevenueChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueSeries} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A7FCE" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4A7FCE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEFF6" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#868CBD' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#868CBD' }} tickFormatter={(v) => formatCompactINR(v)} width={54} />
          <Tooltip
            formatter={(value: number) => [formatCompactINR(value), 'Revenue']}
            contentStyle={{ borderRadius: 14, border: '1px solid #EEEFF6', boxShadow: '0 8px 24px -8px rgba(38,45,83,0.18)' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#4A7FCE" strokeWidth={3} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UtilizationChart() {
  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={utilizationSeries} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
              {utilizationSeries.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [`${v}%`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5">
        {utilizationSeries.map((s, i) => (
          <div key={s.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-navy-500">{s.name}</span>
            <span className="ml-auto font-bold text-navy-600">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
