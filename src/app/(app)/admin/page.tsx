'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, Server, ShieldAlert, Users } from 'lucide-react';
import { adminStats } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/primitives';

const users = [
  { name: 'Mehta Logistics', role: 'Transporter', status: 'Active', trips: 214, joined: 'Mar 2023' },
  { name: 'Shreeji Textiles', role: 'Shipper', status: 'Active', trips: 98, joined: 'Jun 2023' },
  { name: 'Patel Roadways', role: 'Transporter', status: 'Active', trips: 156, joined: 'Jan 2024' },
  { name: 'ColdChain Movers', role: 'Transporter', status: 'Under review', trips: 42, joined: 'Nov 2024' },
  { name: 'BlueWave Exports', role: 'Shipper', status: 'Active', trips: 71, joined: 'Feb 2024' }
];

const systemChecks = [
  { label: 'Matching engine', status: 'operational' },
  { label: 'Payments gateway', status: 'operational' },
  { label: 'Notifications service', status: 'operational' },
  { label: 'Tracking pipeline', status: 'degraded' }
];

export default function AdminPage() {
  const [query, setQuery] = useState('');
  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Admin panel</h1>
        <p className="mt-1 text-sm text-navy-400">Platform-wide oversight for users, fleet and system health.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {adminStats.map((s) => (
          <div key={s.label} className="card-surface p-5">
            <p className="text-xs font-semibold text-navy-400">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-navy-600">{s.value}</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">{s.delta}</p>
          </div>
        ))}
      </div>

      <div className="card-surface">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-navy-400" />
            <h3 className="font-display text-base font-bold text-navy-600">User management</h3>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="h-10 w-full rounded-full border border-navy-100 bg-canvas pl-10 pr-4 text-sm focus:border-blue-400 sm:w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-navy-100 text-left text-xs font-bold uppercase tracking-wide text-navy-300">
                <th className="px-5 py-3 sm:px-6">Company</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Trips</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filtered.map((u) => (
                <tr key={u.name} className="hover:bg-navy-50/50">
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} className="h-8 w-8 text-[10px]" />
                      <span className="font-semibold text-navy-600">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-navy-500">{u.role}</td>
                  <td className="px-5 py-3.5 text-navy-500">{u.trips}</td>
                  <td className="px-5 py-3.5 text-navy-500">{u.joined}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.status === 'Active' ? 'success' : 'warning'}>{u.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-navy-400" />
            <h3 className="font-display text-base font-bold text-navy-600">Fraud & disputes</h3>
          </div>
          <div className="space-y-3">
            <DisputeRow title="Payment mismatch — Booking #bk_298" tag="High priority" />
            <DisputeRow title="Duplicate truck listing reported" tag="Medium" />
            <DisputeRow title="Late delivery claim — Booking #bk_276" tag="Low" />
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-navy-400" />
            <h3 className="font-display text-base font-bold text-navy-600">System health</h3>
          </div>
          <div className="space-y-3">
            {systemChecks.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-2xl border border-navy-100 p-3">
                <span className="text-sm font-semibold text-navy-600">{s.label}</span>
                {s.status === 'operational' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Operational</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Degraded</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputeRow({ title, tag }: { title: string; tag: string }) {
  const variant = tag === 'High priority' ? 'danger' : tag === 'Medium' ? 'warning' : 'navy';
  return (
    <div className="flex items-center justify-between rounded-2xl border border-navy-100 p-3.5">
      <p className="text-sm font-semibold text-navy-600">{title}</p>
      <Badge variant={variant}>{tag}</Badge>
    </div>
  );
}
