'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, Plus, Search, TrendingUp, Truck as TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart, UtilizationChart } from '@/components/dashboard/charts';
import { RecentBookings, AiRecommendations, type RecentBookingItem, type AiRecommendationItem } from '@/components/dashboard/widgets';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { cn, formatINR } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton, Switch } from '@/components/ui/primitives';

const truckTypes = ['Open Body', 'Container', 'Trailer', 'Refrigerated', 'Tanker', 'Mini Truck'] as const;
const fleetCities = [
  'Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Ahmedabad',
  'Kolkata', 'Surat', 'Jaipur', 'Indore', 'Nagpur', 'Coimbatore', 'Lucknow'
];

type TruckRow = {
  id: string;
  reg_number: string;
  type: string;
  capacity_tons: number;
  current_city: string;
  destination_city: string | null;
  available_from: string | null;
  price_per_ton: number;
  empty_leg: boolean;
  status: 'available' | 'booked' | 'in-transit' | 'maintenance';
  created_at: string;
};

type BookingRow = {
  id: string;
  load_id: string;
  amount: number;
  status: 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
  progress_pct: number;
  driver_name: string | null;
  eta: string | null;
  created_at: string;
  loads: { title: string; origin_city: string; destination_city: string } | null;
  trucks: { reg_number: string } | null;
};

type TxnRow = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  created_at: string;
};

type RecommendationRow = {
  load_id: string;
  load_title: string;
  origin_city: string;
  destination_city: string;
  weight_tons: number;
  pickup_date: string;
  budget: number;
  match_score: number;
  truck_reg_number: string;
};

const truckStatusVariant = {
  available: 'success',
  booked: 'blue',
  'in-transit': 'aqua',
  maintenance: 'warning'
} as const;

export default function TransporterDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: profileLoading, isAuthEnabled } = useCurrentProfile();
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showTruckForm, setShowTruckForm] = useState(false);
  const [savingTruck, setSavingTruck] = useState(false);
  const [truckForm, setTruckForm] = useState<{
    reg_number: string;
    type: string;
    capacity_tons: string;
    current_city: string;
    destination_city: string;
    available_from: string;
    price_per_ton: string;
    empty_leg: boolean;
  }>({
    reg_number: '',
    type: truckTypes[0],
    capacity_tons: '',
    current_city: fleetCities[0],
    destination_city: '',
    available_from: '',
    price_per_ton: '',
    empty_leg: false
  });

  const isTransporter = profile?.role === 'transporter';

  useEffect(() => {
    if (!isAuthEnabled) {
      setLoading(false);
      return;
    }
    if (profileLoading || !profile) return;
    if (profile.role !== 'transporter') {
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    const sb = supabase;

    let active = true;
    const transporterId = profile.id;

    async function load() {
      const [trucksRes, bookingsRes, txnRes, recsRes] = await Promise.all([
        sb
          .from('trucks')
          .select('id, reg_number, type, capacity_tons, current_city, destination_city, available_from, price_per_ton, empty_leg, status, created_at')
          .eq('transporter_id', transporterId)
          .order('created_at', { ascending: false })
          .then((res) => res as unknown as { data: TruckRow[] | null; error: unknown }),
        sb
          .from('bookings')
          .select('id, load_id, amount, status, progress_pct, driver_name, eta, created_at, loads(title, origin_city, destination_city), trucks(reg_number)')
          .eq('transporter_id', transporterId)
          .order('created_at', { ascending: false })
          .then((res) => res as unknown as { data: BookingRow[] | null; error: unknown }),
        sb
          .from('transactions')
          .select('id, type, amount, created_at')
          .eq('user_id', transporterId)
          .order('created_at', { ascending: false })
          .then((res) => res as unknown as { data: TxnRow[] | null; error: unknown }),
        sb
          .from('load_recommendations')
          .select('load_id, load_title, origin_city, destination_city, weight_tons, pickup_date, budget, match_score, truck_reg_number')
          .eq('transporter_id', transporterId)
          .order('match_score', { ascending: false })
          .limit(6)
          .then((res) => res as unknown as { data: RecommendationRow[] | null; error: unknown })
      ]);

      if (!active) return;
      setTrucks(trucksRes.data ?? []);
      setBookings(bookingsRes.data ?? []);
      setTxns(txnRes.data ?? []);
      setRecommendations(recsRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [profile, profileLoading, isAuthEnabled, supabase, refreshKey]);

  const activeTrips = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'in-transit').length,
    [bookings]
  );
  const inTransit = useMemo(() => bookings.filter((b) => b.status === 'in-transit').length, [bookings]);

  const totalTrucks = trucks.length;
  const busyTrucks = useMemo(
    () => trucks.filter((t) => t.status === 'booked' || t.status === 'in-transit').length,
    [trucks]
  );
  const utilizationPct = totalTrucks > 0 ? Math.round((busyTrucks / totalTrucks) * 100) : 0;

  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en', { month: 'short' }),
        revenue: 0
      };
    });
    const keyOf = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    for (const t of txns) {
      if (t.type !== 'credit') continue;
      const b = buckets.find((x) => x.key === keyOf(t.created_at));
      if (b) b.revenue += Number(t.amount);
    }
    return buckets;
  }, [txns]);

  const revenueMtd = useMemo(() => {
    const now = new Date();
    return txns
      .filter((t) => t.type === 'credit')
      .filter((t) => {
        const d = new Date(t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [txns]);

  const hasRevenue = useMemo(() => txns.some((t) => t.type === 'credit'), [txns]);

  const revenueLastMonth = revenueByMonth[revenueByMonth.length - 2]?.revenue ?? 0;
  const revenueDelta =
    revenueLastMonth > 0
      ? `${(((revenueMtd - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)}% vs last month`
      : revenueMtd > 0
        ? 'This month'
        : 'No revenue yet';

  const utilizationData = useMemo(() => {
    const count = (s: TruckRow['status']) => trucks.filter((t) => t.status === s).length;
    const pct = (n: number) => (totalTrucks > 0 ? Math.round((n / totalTrucks) * 100) : 0);
    return [
      { name: 'In transit', value: pct(count('in-transit')) },
      { name: 'Booked', value: pct(count('booked')) },
      { name: 'Available', value: pct(count('available')) },
      { name: 'Maintenance', value: pct(count('maintenance')) }
    ];
  }, [trucks, totalTrucks]);

  const recentBookingItems: RecentBookingItem[] = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        loadTitle: b.loads?.title ?? 'Booking',
        route: b.loads ? `${b.loads.origin_city} → ${b.loads.destination_city}` : 'Route details pending',
        vehicleNumber: b.trucks?.reg_number ?? undefined,
        status: b.status,
        progressPct: b.progress_pct,
        amount: Number(b.amount)
      })),
    [bookings]
  );

  const recommendationItems: AiRecommendationItem[] = useMemo(
    () =>
      recommendations.slice(0, 3).map((r) => ({
        id: r.load_id,
        title: r.load_title,
        originCity: r.origin_city,
        destinationCity: r.destination_city,
        weightTons: Number(r.weight_tons),
        matchScore: Number(r.match_score)
      })),
    [recommendations]
  );

  const stats = [
    { label: 'Active trips', value: String(activeTrips), delta: activeTrips > 0 ? `${inTransit} in transit` : 'No active trips yet', trend: 'up' as const },
    { label: 'Fleet utilization', value: totalTrucks > 0 ? `${utilizationPct}%` : '—', delta: totalTrucks > 0 ? `${busyTrucks} of ${totalTrucks} trucks busy` : 'No trucks yet', trend: 'up' as const },
    { label: 'Revenue (MTD)', value: revenueMtd > 0 ? formatINR(revenueMtd) : '—', delta: revenueDelta, trend: 'up' as const },
    { label: 'Fuel savings', value: '—', delta: 'No backhaul savings yet', trend: 'up' as const }
  ];

  const firstName = profile ? profile.fullName.split(' ')[0] : 'there';
  const fetching = isAuthEnabled && loading;

  async function registerTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile || profile.role !== 'transporter') {
      toast.success('Truck registered', { description: 'Demo mode — connect Supabase to persist it.' });
      return;
    }

    setSavingTruck(true);
    const { error } = await supabase.from('trucks').insert({
      transporter_id: profile.id,
      reg_number: truckForm.reg_number.trim(),
      type: truckForm.type,
      capacity_tons: Number(truckForm.capacity_tons),
      current_city: truckForm.current_city,
      destination_city: truckForm.destination_city || null,
      available_from: truckForm.available_from || null,
      price_per_ton: Number(truckForm.price_per_ton),
      empty_leg: truckForm.empty_leg,
      status: 'available'
    });
    setSavingTruck(false);

    if (error) {
      toast.error("Couldn't register truck", { description: error.message });
      return;
    }

    toast.success('Truck registered', { description: 'Your fleet has been updated.' });
    setShowTruckForm(false);
    setTruckForm({
      reg_number: '',
      type: truckTypes[0],
      capacity_tons: '',
      current_city: fleetCities[0],
      destination_city: '',
      available_from: '',
      price_per_ton: '',
      empty_leg: false
    });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Good to see you, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-navy-400">Here&apos;s what&apos;s moving across your fleet today.</p>
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
        {fetching
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-3xl" />)
          : stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} trend={s.trend} />
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
              <TrendingUp className="h-3.5 w-3.5" /> {hasRevenue ? revenueDelta : 'No revenue yet'}
            </span>
          </div>
          {fetching ? (
            <div className="px-4 pb-6">
              <Skeleton className="h-[260px] w-full rounded-2xl" />
            </div>
          ) : hasRevenue ? (
            <div className="px-2 pb-4 sm:px-4">
              <RevenueChart data={revenueByMonth} />
            </div>
          ) : (
            <div className="px-5 pb-6 sm:px-6">
              <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
                No revenue yet. Payouts for delivered bookings will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="card-surface p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Fleet utilization</h3>
          <p className="mb-4 text-xs text-navy-400">Current fleet status</p>
          {fetching ? (
            <Skeleton className="h-[160px] w-full rounded-2xl" />
          ) : totalTrucks === 0 ? (
            <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
              Register a truck to see your fleet utilization here.
            </p>
          ) : (
            <UtilizationChart data={utilizationData} />
          )}
        </div>
      </div>

      <div className="card-surface">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <div>
            <h3 className="font-display text-base font-bold text-navy-600">Your fleet</h3>
            <p className="text-xs text-navy-400">{totalTrucks} truck{totalTrucks === 1 ? '' : 's'}</p>
          </div>
          {isTransporter && (
            <Button variant="outline" size="sm" onClick={() => setShowTruckForm((v) => !v)}>
              <Plus className="h-4 w-4" /> {showTruckForm ? 'Cancel' : 'Register truck'}
            </Button>
          )}
        </div>

        {showTruckForm && isTransporter && (
          <form onSubmit={registerTruck} className="grid gap-4 border-b border-navy-100 px-5 pb-5 sm:grid-cols-2 sm:px-6">
            <Field label="Registration number">
              <Input required placeholder="e.g. MH12 GT 4521" value={truckForm.reg_number} onChange={(e) => setTruckForm({ ...truckForm, reg_number: e.target.value })} />
            </Field>
            <Field label="Truck type">
              <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={truckForm.type} onChange={(e) => setTruckForm({ ...truckForm, type: e.target.value })}>
                {truckTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Capacity (tons)">
              <Input required type="number" min={0.5} step={0.5} placeholder="18" value={truckForm.capacity_tons} onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: e.target.value })} />
            </Field>
            <Field label="Current city">
              <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={truckForm.current_city} onChange={(e) => setTruckForm({ ...truckForm, current_city: e.target.value })}>
                {fleetCities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Destination city">
              <Input placeholder="e.g. Mumbai" value={truckForm.destination_city} onChange={(e) => setTruckForm({ ...truckForm, destination_city: e.target.value })} />
            </Field>
            <Field label="Available from">
              <Input type="date" value={truckForm.available_from} onChange={(e) => setTruckForm({ ...truckForm, available_from: e.target.value })} />
            </Field>
            <Field label="Price per ton (₹)">
              <Input required type="number" min={0} placeholder="1450" value={truckForm.price_per_ton} onChange={(e) => setTruckForm({ ...truckForm, price_per_ton: e.target.value })} />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-navy-500">
                <Switch checked={truckForm.empty_leg} onCheckedChange={(v) => setTruckForm({ ...truckForm, empty_leg: v })} label="Empty leg" />
                Empty leg
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={savingTruck}>
                {savingTruck && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingTruck ? 'Registering…' : 'Register truck'}
              </Button>
            </div>
          </form>
        )}

        {fetching ? (
          <div className="space-y-1 pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <Skeleton className="h-4 flex-1 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : trucks.length === 0 ? (
          <p className="mx-5 mb-5 rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400 sm:mx-6 sm:mb-6">
            No trucks yet. Register your first truck to start receiving load matches.
          </p>
        ) : (
          <div className="divide-y divide-navy-100">
            {trucks.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                  <TruckIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-600">{t.type} · {Number(t.capacity_tons)}T</p>
                  <p className="text-xs text-navy-400">{t.reg_number} · {t.current_city}{t.destination_city ? ` → ${t.destination_city}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy-600">{formatINR(Number(t.price_per_ton))}<span className="text-xs font-normal text-navy-400">/ton</span></p>
                  <Badge variant={truckStatusVariant[t.status]} className="mt-1">{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {fetching ? (
            <div className="card-surface">
              <div className="flex items-center justify-between p-5 sm:p-6">
                <Skeleton className="h-5 w-40 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <div className="space-y-1 pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <Skeleton className="h-4 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <RecentBookings bookings={recentBookingItems} />
          )}
        </div>
        <div>
          {fetching ? (
            <div className="card-surface">
              <div className="flex items-center gap-2 p-5 sm:p-6">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-5 w-36 rounded-full" />
              </div>
              <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[64px] rounded-2xl" />)}
              </div>
            </div>
          ) : (
            <AiRecommendations loads={recommendationItems} />
          )}
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy-500">{label}</label>
      {children}
    </div>
  );
}
