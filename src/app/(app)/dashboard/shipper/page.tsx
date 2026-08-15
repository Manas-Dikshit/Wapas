'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, FileText, Package, Pencil, Plus, Star, Trash2, TrendingUp, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, Progress, Skeleton } from '@/components/ui/primitives';
import { Button, buttonVariants } from '@/components/ui/button';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCompactINR, formatINR } from '@/lib/utils';

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

type LoadRow = {
  id: string;
  title: string;
  category: string | null;
  weight_tons: number;
  origin_city: string;
  destination_city: string;
  pickup_date: string;
  budget: number;
  truck_type_needed: string | null;
  status: 'open' | 'matched' | 'booked' | 'delivered';
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
};

type TxnRow = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  created_at: string;
};

type SavedTransporter = {
  id: string;
  full_name: string;
  company_name: string | null;
  city: string | null;
  rating: number;
};

const statusVariant = {
  confirmed: 'blue',
  'in-transit': 'aqua',
  delivered: 'success',
  cancelled: 'danger'
} as const;

export default function ShipperDashboardPage() {
  const { profile, loading: profileLoading, isAuthEnabled } = useCurrentProfile();
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [savedTransporters, setSavedTransporters] = useState<SavedTransporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ pickup_date: '', budget: '' });
  const [mutationLoading, setMutationLoading] = useState(false);

  const isShipper = profile?.role === 'shipper';

  const runRefresh = useCallback(
    async (sb: SupabaseClient, shipperId: string) => {
      const [loadsRes, bookingsRes, txnRes, savedRes] = await Promise.all([
        sb
          .from('loads')
          .select('id, title, category, weight_tons, origin_city, destination_city, pickup_date, budget, truck_type_needed, status, created_at')
          .eq('shipper_id', shipperId)
          .order('created_at', { ascending: false })
          .then((res) => res as unknown as { data: LoadRow[] | null; error: unknown }),
        sb
          .from('bookings')
          .select('id, load_id, amount, status, progress_pct, driver_name, eta, created_at, loads(title, origin_city, destination_city)')
          .eq('shipper_id', shipperId)
          .order('created_at', { ascending: false })
          .then((res) => res as unknown as { data: BookingRow[] | null; error: unknown }),
        sb
          .from('transactions')
          .select('id, type, amount, created_at')
          .eq('user_id', shipperId)
          .then((res) => res as unknown as { data: TxnRow[] | null; error: unknown }),
        sb
          .from('saved_transporters')
          .select('transporter_id')
          .eq('shipper_id', shipperId)
          .then((res) => res as unknown as { data: { transporter_id: string }[] | null; error: unknown })
      ]);

      const savedIds = savedRes.data?.map((r) => r.transporter_id) ?? [];
      let savedTransportersData: SavedTransporter[] = [];
      if (savedIds.length > 0) {
        const profRes = await sb
          .from('profiles')
          .select('id, full_name, company_name, city, rating')
          .in('id', savedIds)
          .then((res) => res as unknown as { data: SavedTransporter[] | null; error: unknown });
        savedTransportersData = profRes.data ?? [];
      }

      setLoads(loadsRes.data ?? []);
      setBookings(bookingsRes.data ?? []);
      setTxns(txnRes.data ?? []);
      setSavedTransporters(savedTransportersData);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!isAuthEnabled) {
      setLoading(false);
      return;
    }
    if (profileLoading || !profile) return;
    if (profile.role !== 'shipper') {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const sb = supabase;

    let active = true;
    const shipperId = profile.id;

    async function load() {
      await runRefresh(sb, shipperId);
      if (!active) return;
    }

    load();
    return () => {
      active = false;
    };
  }, [profile, profileLoading, isAuthEnabled, runRefresh]);

  const openLoads = useMemo(() => loads.filter((l) => l.status === 'open'), [loads]);

  const staleLoads = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return openLoads.filter((l) => l.pickup_date < today);
  }, [openLoads]);

  const spendByMonth = useMemo(() => {
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
      if (t.type !== 'debit') continue;
      const b = buckets.find((x) => x.key === keyOf(t.created_at));
      if (b) b.revenue += Number(t.amount);
    }
    return buckets;
  }, [txns]);

  const spendMtd = useMemo(() => {
    const now = new Date();
    return txns
      .filter((t) => t.type === 'debit')
      .filter((t) => {
        const d = new Date(t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [txns]);

  const spendLastMonth = spendByMonth[spendByMonth.length - 2]?.revenue ?? 0;
  const spendDelta =
    spendLastMonth > 0
      ? `${(((spendMtd - spendLastMonth) / spendLastMonth) * 100).toFixed(1)}% vs last month`
      : spendMtd > 0
        ? 'This month'
        : 'No spend yet';

  const firstName = profile ? profile.fullName.split(' ')[0] : 'there';
  const fetching = isAuthEnabled && loading;

  function supabaseGuard() {
    const supabase = createClient();
    if (!supabase || !isShipper || !profile) return null;
    return supabase;
  }

  async function saveLoadEdit(load: LoadRow) {
    const sb = supabaseGuard();
    if (!sb) return;
    if (!editForm.pickup_date || !editForm.budget) {
      toast.error('Pickup date and budget are required');
      return;
    }
    setMutationLoading(true);
    const { error } = await sb
      .from('loads')
      .update({ pickup_date: editForm.pickup_date, budget: Number(editForm.budget) })
      .eq('id', load.id)
      .eq('shipper_id', profile!.id);
    setMutationLoading(false);
    if (error) {
      toast.error('Could not update load', { description: error.message });
      return;
    }
    setEditingId(null);
    toast.success('Load updated');
    const sbc = createClient();
    if (sbc && profile) await runRefresh(sbc, profile.id);
  }

  function startEdit(load: LoadRow) {
    setEditingId(load.id);
    setEditForm({ pickup_date: load.pickup_date, budget: String(load.budget) });
  }

  async function cancelLoad(load: LoadRow) {
    const confirmed = window.confirm(
      `Cancel the load "${load.title}" (${load.origin_city} → ${load.destination_city})? This removes it from the marketplace.`
    );
    if (!confirmed) return;
    const sb = supabaseGuard();
    if (!sb) return;
    setMutationLoading(true);
    const { error } = await sb.from('loads').delete().eq('id', load.id).eq('shipper_id', profile!.id);
    setMutationLoading(false);
    if (error) {
      toast.error('Could not cancel load', { description: error.message });
      return;
    }
    toast.success('Load cancelled');
    const sbc = createClient();
    if (sbc && profile) await runRefresh(sbc, profile.id);
  }

  async function cancelBooking(booking: BookingRow) {
    const confirmed = window.confirm(
      `Cancel this booking (${booking.loads?.title ?? 'shipment'})? The transporter will be notified and the booking status will be set to cancelled.`
    );
    if (!confirmed) return;
    const sb = supabaseGuard();
    if (!sb) return;
    setMutationLoading(true);
    const { error } = await sb
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)
      .eq('shipper_id', profile!.id);
    setMutationLoading(false);
    if (error) {
      toast.error('Could not cancel booking', { description: error.message });
      return;
    }
    toast.success('Booking cancelled');
    const sbc = createClient();
    if (sbc && profile) await runRefresh(sbc, profile.id);
  }

  async function unsaveTransporter(transporterId: string) {
    const sb = supabaseGuard();
    if (!sb) return;
    const { error } = await sb
      .from('saved_transporters')
      .delete()
      .eq('shipper_id', profile!.id)
      .eq('transporter_id', transporterId);
    if (error) {
      toast.error('Could not remove transporter', { description: error.message });
      return;
    }
    toast.success('Removed from saved transporters');
    const sbc = createClient();
    if (sbc && profile) await runRefresh(sbc, profile.id);
  }

  const stats = [
    { label: 'Open loads', value: String(openLoads.length), delta: `${loads.length} total loads`, trend: 'up' as const },
    { label: 'Needs attention', value: staleLoads.length > 0 ? String(staleLoads.length) : '—', delta: staleLoads.length > 0 ? 'Pickup date passed' : 'All loads on schedule', trend: staleLoads.length > 0 ? ('down' as const) : ('up' as const) },
    { label: 'Spend (MTD)', value: spendMtd > 0 ? formatINR(spendMtd) : '—', delta: spendDelta, trend: spendMtd >= spendLastMonth ? 'down' as const : 'up' as const },
    { label: 'Saved transporters', value: String(savedTransporters.length), delta: 'In your network', trend: 'up' as const }
  ];

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Good to see you, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-navy-400">Track your open loads and keep your network moving.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/marketplace" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Star className="h-4 w-4" /> Saved transporters
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

      {staleLoads.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-700">
            <p className="font-bold">Pickup date passed on {staleLoads.length} open load{staleLoads.length > 1 ? 's' : ''}.</p>
            <p className="text-xs">Update the pickup date or cancel below so these don&apos;t sit stale on the marketplace.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2">
          <div className="flex items-center justify-between p-5 sm:p-6">
            <div>
              <h3 className="font-display text-base font-bold text-navy-600">Spend overview</h3>
              <p className="text-xs text-navy-400">Last 6 months</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> {spendMtd > 0 ? spendDelta : 'No spend yet'}
            </span>
          </div>
          {fetching ? (
            <div className="px-4 pb-6">
              <Skeleton className="h-[260px] w-full rounded-2xl" />
            </div>
          ) : spendMtd > 0 ? (
            <div className="px-2 pb-4 sm:px-4">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendByMonth} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
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
                      formatter={(value: number) => [formatCompactINR(value), 'Spend']}
                      contentStyle={{ borderRadius: 14, border: '1px solid #EEEFF6', boxShadow: '0 8px 24px -8px rgba(38,45,83,0.18)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4A7FCE" strokeWidth={3} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-6 sm:px-6">
              <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
                No spend yet. Post a load and match with a transporter to see your spending here.
              </p>
            </div>
          )}
        </div>

        <div className="card-surface">
          <div className="flex items-center justify-between p-5 sm:p-6">
            <h3 className="font-display text-base font-bold text-navy-600">Open loads</h3>
            <Link href="/marketplace" className="flex items-center gap-1 text-xs font-bold text-blue-500">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {fetching ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[64px] rounded-2xl" />)
            ) : openLoads.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400">
                No open loads yet. Post your first load to get started.
              </p>
            ) : (
              openLoads.slice(0, 4).map((l) => {
                const isStale = l.pickup_date < new Date().toISOString().slice(0, 10);
                const isEditing = editingId === l.id;
                return (
                  <div key={l.id} className="rounded-2xl border border-navy-100 p-3.5">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-navy-600">{l.title}</p>
                          <button onClick={() => setEditingId(null)} className="text-navy-300 hover:text-navy-500" aria-label="Cancel edit">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-navy-500">Pickup date</label>
                            <input
                              type="date"
                              value={editForm.pickup_date}
                              onChange={(e) => setEditForm({ ...editForm, pickup_date: e.target.value })}
                              className="h-9 w-full rounded-lg border border-navy-100 px-2 text-sm focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-navy-500">Budget (₹)</label>
                            <input
                              type="number"
                              min={500}
                              value={editForm.budget}
                              onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                              className="h-9 w-full rounded-lg border border-navy-100 px-2 text-sm focus:border-blue-400"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => saveLoadEdit(l)} disabled={mutationLoading}>
                            {mutationLoading ? 'Saving…' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/marketplace/${l.id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-600">{l.title}</p>
                          <p className="text-xs text-navy-400">{l.origin_city} → {l.destination_city} · {l.weight_tons}T · pickup {new Date(l.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </Link>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {isStale && <Badge variant="warning">Pickup passed</Badge>}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(l)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-500 hover:bg-navy-100"
                              title="Edit load"
                              aria-label="Edit load"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => cancelLoad(l)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                              title="Cancel load"
                              aria-label="Cancel load"
                              disabled={mutationLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
          {fetching ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-2xl" />)
          ) : savedTransporters.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400">
              No saved transporters yet. Browse the marketplace to save a transporter to your network.
            </p>
          ) : (
            savedTransporters.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
                <Avatar name={t.full_name} className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-600">{t.company_name || t.full_name}</p>
                  <p className="text-xs text-navy-400">{t.city || 'Transporter'}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-navy-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(t.rating).toFixed(1)}
                </span>
                <button
                  onClick={() => unsaveTransporter(t.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-navy-300 hover:bg-navy-50 hover:text-rose-400"
                  title="Remove from saved"
                  aria-label="Remove from saved"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white">
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

      <div className="card-surface">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Recent bookings</h3>
          <Link href="/bookings" className="flex items-center gap-1 text-xs font-bold text-blue-500">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {fetching ? (
          <div className="space-y-1 pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <Skeleton className="h-4 flex-1 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <p className="mx-5 mb-5 rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400 sm:mx-6 sm:mb-6">
            No bookings yet. Once a transporter accepts your load, it will appear here.
          </p>
        ) : (
          <div className="divide-y divide-navy-100">
            {bookings.slice(0, 4).map((b) => {
              const route = b.loads ? `${b.loads.origin_city} → ${b.loads.destination_city}` : 'Route details pending';
              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <Link href={`/tracking/${b.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy-600">{b.loads?.title ?? 'Booking'}</p>
                    <p className="text-xs text-navy-400">{route}{b.driver_name ? ` · ${b.driver_name}` : ''}</p>
                    {b.status === 'in-transit' && <Progress value={b.progress_pct} className="mt-2 max-w-[160px]" />}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    {b.status === 'delivered' && (
                      <Link
                        href={`/tracking/${b.id}`}
                        className="flex h-8 items-center gap-1 rounded-full bg-navy-50 px-3 text-xs font-bold text-navy-600 hover:bg-navy-100"
                      >
                        <FileText className="h-3.5 w-3.5" /> Invoice
                      </Link>
                    )}
                    {b.status !== 'delivered' && b.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelBooking(b)}
                        disabled={mutationLoading}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Cancel
                      </Button>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy-600">{formatINR(b.amount)}</p>
                      <Badge variant={statusVariant[b.status]} className="mt-1">
                        {b.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}