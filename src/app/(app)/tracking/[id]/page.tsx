'use client';

import { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Phone, MessageCircle, Copy, PackageCheck, Truck as TruckIcon, MapPinned } from 'lucide-react';
import { toast } from 'sonner';
import { bookings, shipmentTrackers } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { Timeline, type TimelineStep } from '@/components/tracking/timeline';
import { Avatar, Progress, Skeleton } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import type { TrackingEvent } from '@/lib/types';

// Leaflet touches `window`/`document` as soon as it's imported, so the real
// map must never run on the server — load it client-only.
const LiveTrackingMap = dynamic(
  () => import('@/components/tracking/real-map').then((m) => m.LiveTrackingMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-xl3 sm:h-[300px]" />
  }
);

const baseSteps: Omit<TimelineStep, 'done' | 'active'>[] = [
  { label: 'Booking confirmed', time: 'Aug 3, 9:14 AM' },
  { label: 'Truck loaded', time: 'Aug 3, 11:40 AM' },
  { label: 'In transit', time: 'Aug 3, 12:05 PM' },
  { label: 'Out for delivery', time: 'Expected 5:30 PM' },
  { label: 'Delivered', time: 'Expected 6:40 PM' }
];

function locationForPct(pct: number, destinationCity: string) {
  if (pct >= 100) return destinationCity;
  if (pct >= 75) return 'Pune outskirts';
  if (pct >= 45) return 'Bhiwandi';
  if (pct >= 20) return 'Nashik';
  return 'Mumbai';
}

type LiveBooking = { id: string; status: string; progress_pct: number; eta: string | null };
type LiveEvent = { id: string; status_label: string; note: string | null; created_at: string };

function toTrackingEvent(e: LiveEvent, bookingId: string) {
  const label = e.status_label.toLowerCase();
  const status: TrackingEvent['status'] =
    label === 'delivered' ? 'delivered' : label.includes('transit') ? 'in_transit' : 'checkpoint';
  return {
    id: e.id,
    bookingId,
    timestamp: new Date(e.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    status,
    location: e.note ?? e.status_label,
    note: e.note ?? undefined
  };
}

export default function TrackingPage({ params }: { params: { id: string } }) {
  const booking = bookings.find((b) => b.id === params.id) ?? bookings[0];
  const initialTracker = useMemo(
    () =>
      shipmentTrackers[booking.id] ?? {
        bookingId: booking.id,
        currentLocation: booking.route.split(' → ')[0],
        progressPct: booking.progressPct,
        eta: booking.eta,
        updatedAt: 'Just now',
        events: []
      },
    [booking]
  );

  const [copied, setCopied] = useState(false);
  const [tracker, setTracker] = useState(initialTracker);

  const [originCity, destinationCity] = booking.route.split(' → ');

  // Live sync: when Supabase is configured, drive the tracker off Realtime
  // instead of the local mock `advanceStatus` button. Demo mode (no Supabase)
  // returns early and keeps the existing mock behaviour unchanged.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const client = supabase;
    let active = true;

    const applyBooking = (row: LiveBooking) =>
      setTracker((prev) => ({
        ...prev,
        status: row.status,
        progressPct: row.progress_pct,
        eta: row.eta ?? prev.eta,
        currentLocation: locationForPct(row.progress_pct, destinationCity),
        updatedAt: 'Just now'
      }));

    client
      .from('bookings')
      .select('id, status, progress_pct, eta')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active && !error && data) applyBooking(data as LiveBooking);
      });

    client
      .from('tracking_events')
      .select('id, status_label, note, created_at')
      .eq('booking_id', params.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (active && !error && data) {
          setTracker((prev) => ({ ...prev, events: (data as LiveEvent[]).map((e) => toTrackingEvent(e, params.id)) }));
        }
      });

    const channel = client
      .channel(`realtime:booking:${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${params.id}` },
        (payload) => applyBooking(payload.new as LiveBooking)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracking_events', filter: `booking_id=eq.${params.id}` },
        (payload) =>
          setTracker((prev) => ({
            ...prev,
            events: [...prev.events, toTrackingEvent(payload.new as LiveEvent, params.id)],
            updatedAt: 'Just now'
          }))
      )
      .subscribe();

    const onFocus = () =>
      client.from('bookings').select('id, status, progress_pct, eta').eq('id', params.id).maybeSingle().then(({ data }) => {
        if (active && data) applyBooking(data as LiveBooking);
      });

    // Supabase auto-reconnects; this focus handler just re-syncs the booking
    // after the tab was backgrounded. The channel is never re-created here.
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      client.removeChannel(channel);
    };
  }, [params.id, destinationCity]);

  const doneCount =
    tracker.events.length > 0 ? Math.min(5, tracker.events.length) : booking.status === 'delivered' ? 5 : booking.status === 'in-transit' ? Math.ceil((tracker.progressPct / 100) * 4) : 1;
  const steps: TimelineStep[] = baseSteps.map((s, i) => ({ ...s, done: i < doneCount, active: i === doneCount }));

  function advanceStatus() {
    if (tracker.progressPct >= 100) {
      toast.info('Shipment already delivered');
      return;
    }

    const nextPct = Math.min(100, tracker.progressPct + 18);
    const nextLocation =
      nextPct >= 100 ? destinationCity : nextPct >= 75 ? 'Pune outskirts' : nextPct >= 45 ? 'Bhiwandi' : nextPct >= 20 ? 'Nashik' : 'Mumbai';
    const nextEta = nextPct >= 100 ? 'Delivered' : nextPct >= 75 ? 'Today, 6:40 PM' : nextPct >= 45 ? 'Today, 6:10 PM' : nextPct >= 20 ? 'Today, 5:35 PM' : 'Today, 5:00 PM';

    setTracker({
      ...tracker,
      currentLocation: nextLocation,
      progressPct: nextPct,
      eta: nextEta,
      updatedAt: 'Just now',
      events: [
        ...tracker.events,
        {
          id: `evt_${booking.id}_${tracker.events.length + 1}`,
          bookingId: booking.id,
          timestamp: 'Just now',
          status: nextPct >= 100 ? 'delivered' : nextPct >= 75 ? 'out_for_delivery' : nextPct >= 20 ? 'checkpoint' : 'in_transit',
          location: nextLocation,
          note: nextPct >= 100 ? 'Proof of delivery recorded' : 'Driver update received via live tracking'
        }
      ]
    });
    toast.success('Live ETA refreshed', { description: `Current location: ${nextLocation}` });
  }

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
            <Badge variant={tracker.progressPct >= 100 ? 'success' : 'aqua'}>{tracker.progressPct >= 100 ? 'delivered' : 'in transit'}</Badge>
          </div>
          <button onClick={copyId} className="mt-1 flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600">
            #{booking.id.toUpperCase()} <Copy className="h-3 w-3" /> {copied && <span className="text-emerald-500">Copied</span>}
          </button>
        </div>
        <p className="font-display text-xl font-extrabold text-navy-600">{formatINR(booking.amount)}</p>
      </div>

      <LiveTrackingMap originCity={originCity} destinationCity={destinationCity} progressPct={tracker.progressPct} />

      <div className="card-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-navy-600">{booking.route}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-navy-400">
              <MapPinned className="h-3.5 w-3.5 text-aqua-500" /> Current stop: {tracker.currentLocation}
            </p>
          </div>
          <p className="text-xs font-semibold text-blue-500">ETA {tracker.eta}</p>
        </div>
        <Progress value={tracker.progressPct} className="mt-3" />
        <div className="mt-2 flex justify-between text-[11px] text-navy-300">
          <span>Picked up</span>
          <span>{tracker.progressPct}% complete</span>
          <span>Delivered</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-navy-100 bg-navy-50 px-3 py-2.5 text-[11px] text-navy-400">
          <span className="truncate">Last update: {tracker.updatedAt}</span>
          <Button size="sm" variant="outline" onClick={advanceStatus} className="h-9 shrink-0">Advance status</Button>
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
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Call driver" aria-label="Call driver">
                <Phone className="h-4 w-4" />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100" title="Message driver" aria-label="Message driver">
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

      {tracker.progressPct >= 100 && (
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