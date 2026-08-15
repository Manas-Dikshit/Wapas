'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Tabs } from '@/components/ui/primitives';
import { Progress } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { bookings } from '@/lib/mock-data';
import { formatINR } from '@/lib/utils';

const statusVariant = {
  confirmed: 'blue',
  'in-transit': 'aqua',
  delivered: 'success',
  cancelled: 'danger'
} as const;

export default function BookingsPage() {
  const [tab, setTab] = useState('all');
  const filtered = bookings.filter((b) => (tab === 'all' ? true : tab === 'active' ? b.status !== 'delivered' && b.status !== 'cancelled' : b.status === 'delivered'));

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">My trips</h1>
          <p className="mt-1 text-sm text-navy-400">{filtered.length} bookings</p>
        </div>
        <Tabs
          tabs={[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'delivered', label: 'Delivered' }
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((b) => (
          <Link key={b.id} href={`/tracking/${b.id}`} className="card-surface flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-floating sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-navy-600">{b.loadTitle}</p>
                <Badge variant={statusVariant[b.status]}>{b.status.replace('-', ' ')}</Badge>
                {b.escrow && (
                  <Badge variant="aqua">Escrow {formatINR((b.escrow.totalAmount - b.escrow.releasedAmount))}</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-navy-400">{b.route} · {b.vehicleNumber} · {b.driverName}</p>
              {b.status === 'in-transit' && (
                <div className="mt-2.5 flex items-center gap-3">
                  <Progress value={b.progressPct} className="max-w-[220px]" />
                  <span className="text-[11px] font-bold text-navy-400">{b.progressPct}%</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-navy-600">{formatINR(b.amount)}</p>
              <p className="text-xs text-navy-400">{b.eta}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-navy-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
