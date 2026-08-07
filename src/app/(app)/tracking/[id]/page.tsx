'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Copy, PackageCheck, Truck as TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { bookings } from '@/lib/mock-data';
import { TrackingMap } from '@/components/tracking/map-placeholder';
import { Timeline, type TimelineStep } from '@/components/tracking/timeline';
import { Avatar, Progress } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';

const baseSteps: Omit<TimelineStep, 'done' | 'active'>[] = [
  { label: 'Booking confirmed', time: 'Aug 3, 9:14 AM' },
  { label: 'Truck loaded', time: 'Aug 3, 11:40 AM' },
  { label: 'In transit', time: 'Aug 3, 12:05 PM' },
  { label: 'Out for delivery', time: 'Expected 5:30 PM' },
  { label: 'Delivered', time: 'Expected 6:40 PM' }
];

export default function TrackingPage({ params }: { params: { id: string } }) {
  const booking = bookings.find((b) => b.id === params.id) ?? bookings[0];
  const [copied, setCopied] = useState(false);

  const doneCount = booking.status === 'delivered' ? 5 : booking.status === 'in-transit' ? Math.ceil((booking.progressPct / 100) * 4) : 1;
  const steps: TimelineStep[] = baseSteps.map((s, i) => ({ ...s, done: i < doneCount, active: i === doneCount }));

  function copyId() {
    setCopied(true);
    toast.success('Booking ID copied');
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-extrabold text-navy-600 sm:text-2xl">{booking.loadTitle}</h1>
            <Badge variant={booking.status === 'delivered' ? 'success' : 'aqua'}>{booking.status.replace('-', ' ')}</Badge>
          </div>
          <button onClick={copyId} className="mt-1 flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600">
            #{booking.id.toUpperCase()} <Copy className="h-3 w-3" /> {copied && <span className="text-emerald-500">Copied</span>}
          </button>
        </div>
        <p className="font-display text-xl font-extrabold text-navy-600">{formatINR(booking.amount)}</p>
      </div>

      <TrackingMap progressPct={booking.progressPct} />

      <div className="card-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy-600">{booking.route}</p>
          <p className="text-xs font-semibold text-blue-500">ETA {booking.eta}</p>
        </div>
        <Progress value={booking.progressPct} className="mt-3" />
        <div className="mt-2 flex justify-between text-[11px] text-navy-300">
          <span>Picked up</span>
          <span>{booking.progressPct}% complete</span>
          <span>Delivered</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 font-display text-base font-bold text-navy-600">Driver & vehicle</h3>
          <div className="flex items-center gap-3">
            <Avatar name={booking.driverName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy-600">{booking.driverName}</p>
              <p className="text-xs text-navy-400">{booking.vehicleNumber}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                <Phone className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-navy-50 p-3">
            <TruckIcon className="h-4 w-4 text-navy-400" />
            <p className="text-xs text-navy-500">{booking.transporterName}</p>
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 font-display text-base font-bold text-navy-600">Delivery timeline</h3>
          <Timeline steps={steps} />
        </div>
      </div>

      {booking.status === 'delivered' && (
        <div className="card-surface flex items-center gap-4 p-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy-600">Delivered successfully</p>
            <p className="text-xs text-navy-400">Proof of delivery and invoice are ready to download.</p>
          </div>
          <Button variant="outline" size="sm">Download invoice</Button>
        </div>
      )}
    </div>
  );
}
