'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Loader2, Package, Pencil, Plus, Power, Search, TrendingUp } from 'lucide-react';
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
import { TruckTypeIcon } from '@/components/marketplace/truck-type-icon';

import { cities } from '@/lib/mock-data';

const truckTypes = ['Open Body', 'Container', 'Trailer', 'Refrigerated', 'Tanker', 'Mini Truck'] as const;
const fleetCities = cities;

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

type DocumentRow = {
  id: string;
  truck_id: string | null;
  doc_type: 'gst' | 'pan' | 'rc' | 'fitness' | 'driving_license';
  expires_at: string | null;
  status: 'pending' | 'verified' | 'rejected';
};

const DEMO_TRUCKS: TruckRow[] = [
  { id: 'trk_110', reg_number: 'OD05 K 3392', type: 'Trailer', capacity_tons: 28, current_city: 'Rourkela', destination_city: 'Paradeep', available_from: '2026-08-06', price_per_ton: 1150, empty_leg: true, status: 'in-transit', created_at: '2026-08-01' },
  { id: 'trk_112', reg_number: 'OD01 M 4420', type: 'Refrigerated', capacity_tons: 10, current_city: 'Paradeep', destination_city: 'Kolkata', available_from: '2026-08-06', price_per_ton: 1980, empty_leg: true, status: 'booked', created_at: '2026-08-01' },
  { id: 'trk_109', reg_number: 'OD02 BBS 7710', type: 'Open Body', capacity_tons: 20, current_city: 'Bhubaneswar', destination_city: 'Delhi', available_from: '2026-08-11', price_per_ton: 1320, empty_leg: true, status: 'available', created_at: '2026-08-02' },
  { id: 'trk_111', reg_number: 'OD14 H 5541', type: 'Container', capacity_tons: 18, current_city: 'Jharsuguda', destination_city: 'Raipur', available_from: '2026-08-07', price_per_ton: 1240, empty_leg: true, status: 'available', created_at: '2026-08-02' },
  { id: 'trk_101', reg_number: 'MH12 GT 4521', type: 'Container', capacity_tons: 18, current_city: 'Pune', destination_city: 'Mumbai', available_from: '2026-08-06', price_per_ton: 1450, empty_leg: true, status: 'available', created_at: '2026-07-28' },
  { id: 'trk_113', reg_number: 'OD09 T 8812', type: 'Open Body', capacity_tons: 16, current_city: 'Angul', destination_city: 'Bhubaneswar', available_from: '2026-08-08', price_per_ton: 920, empty_leg: true, status: 'maintenance', created_at: '2026-07-25' }
];

const DEMO_BOOKINGS: BookingRow[] = [
  { id: 'bk_305', load_id: 'ld_209', amount: 29900, status: 'in-transit', progress_pct: 68, driver_name: 'Subhashis Patnaik', eta: 'Today, 8:30 PM', created_at: '2026-08-05', loads: { title: 'TMT Steel Bars & Heavy Billets', origin_city: 'Rourkela', destination_city: 'Paradeep' }, trucks: { reg_number: 'OD05 K 3392' } },
  { id: 'bk_306', load_id: 'ld_210', amount: 18500, status: 'confirmed', progress_pct: 15, driver_name: 'Bikram Mohanty', eta: 'Tomorrow, 6:30 AM', created_at: '2026-08-06', loads: { title: 'Export-Grade Frozen Tiger Prawns', origin_city: 'Paradeep', destination_city: 'Kolkata' }, trucks: { reg_number: 'OD01 M 4420' } },
  { id: 'bk_307', load_id: 'ld_211', amount: 22400, status: 'delivered', progress_pct: 100, driver_name: 'Rajesh Sahu', eta: 'Delivered Aug 4', created_at: '2026-08-02', loads: { title: 'Aluminium Ingots & Extrusions', origin_city: 'Jharsuguda', destination_city: 'Raipur' }, trucks: { reg_number: 'OD14 H 5541' } },
  { id: 'bk_301', load_id: 'ld_201', amount: 21500, status: 'delivered', progress_pct: 100, driver_name: 'Suresh Yadav', eta: 'Delivered Aug 3', created_at: '2026-08-01', loads: { title: 'Textile Rolls — 400 Bales', origin_city: 'Mumbai', destination_city: 'Pune' }, trucks: { reg_number: 'MH12 GT 4521' } }
];

const DEMO_TXNS: TxnRow[] = [
  { id: 'txn_d1', type: 'credit', amount: 29900, created_at: '2026-08-05T14:30:00Z' },
  { id: 'txn_d2', type: 'credit', amount: 22400, created_at: '2026-08-04T18:45:00Z' },
  { id: 'txn_d3', type: 'credit', amount: 21500, created_at: '2026-08-02T11:20:00Z' },
  { id: 'txn_d4', type: 'credit', amount: 34000, created_at: '2026-07-28T16:00:00Z' },
  { id: 'txn_d5', type: 'credit', amount: 30000, created_at: '2026-07-15T09:30:00Z' },
  { id: 'txn_d6', type: 'credit', amount: 58000, created_at: '2026-06-20T12:00:00Z' },
  { id: 'txn_d7', type: 'credit', amount: 52000, created_at: '2026-05-18T10:15:00Z' },
  { id: 'txn_d8', type: 'credit', amount: 46000, created_at: '2026-04-12T14:40:00Z' },
  { id: 'txn_d9', type: 'credit', amount: 40000, created_at: '2026-03-09T08:20:00Z' }
];

const DEMO_RECS: RecommendationRow[] = [
  { load_id: 'ld_209', load_title: 'TMT Steel Bars & Heavy Billets', origin_city: 'Rourkela', destination_city: 'Paradeep', weight_tons: 26, pickup_date: '2026-08-06', budget: 29900, match_score: 96, truck_reg_number: 'OD05 K 3392' },
  { load_id: 'ld_210', load_title: 'Export-Grade Frozen Tiger Prawns', origin_city: 'Paradeep', destination_city: 'Kolkata', weight_tons: 9, pickup_date: '2026-08-06', budget: 18500, match_score: 95, truck_reg_number: 'OD01 M 4420' },
  { load_id: 'ld_211', load_title: 'Aluminium Ingots & Extrusions', origin_city: 'Jharsuguda', destination_city: 'Raipur', weight_tons: 18, pickup_date: '2026-08-07', budget: 22400, match_score: 93, truck_reg_number: 'OD14 H 5541' },
  { load_id: 'ld_213', load_title: 'Industrial Heavy Flanges & Castings', origin_city: 'Angul', destination_city: 'Bhubaneswar', weight_tons: 15, pickup_date: '2026-08-08', budget: 14200, match_score: 89, truck_reg_number: 'OD09 T 8812' }
];

const DEMO_DOCS: DocumentRow[] = [
  { id: 'doc_1', truck_id: 'trk_110', doc_type: 'fitness', expires_at: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'verified' },
  { id: 'doc_2', truck_id: 'trk_110', doc_type: 'rc', expires_at: '2028-12-31', status: 'verified' },
  { id: 'doc_3', truck_id: null, doc_type: 'gst', expires_at: null, status: 'verified' },
  { id: 'doc_4', truck_id: null, doc_type: 'pan', expires_at: null, status: 'verified' }
];

const truckStatusVariant = {
  available: 'success',
  booked: 'blue',
  'in-transit': 'aqua',
  maintenance: 'warning'
} as const;

export default function TransporterDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: profileLoading, isAuthEnabled } = useCurrentProfile();
  const [trucks, setTrucks] = useState<TruckRow[]>(DEMO_TRUCKS);
  const [bookings, setBookings] = useState<BookingRow[]>(DEMO_BOOKINGS);
  const [txns, setTxns] = useState<TxnRow[]>(DEMO_TXNS);
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>(DEMO_RECS);
  const [documents, setDocuments] = useState<DocumentRow[]>(DEMO_DOCS);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [editTruckForm, setEditTruckForm] = useState<{
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
  const [acceptingLoadId, setAcceptingLoadId] = useState<string | null>(null);
  const [acceptTruckId, setAcceptTruckId] = useState<string>('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [mutationLoading, setMutationLoading] = useState(false);

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
      setTrucks(DEMO_TRUCKS);
      setBookings(DEMO_BOOKINGS);
      setTxns(DEMO_TXNS);
      setRecommendations(DEMO_RECS);
      setDocuments(DEMO_DOCS);
      setLoading(false);
      return;
    }
    if (profileLoading || !profile) return;
    if (profile.role !== 'transporter') {
      setLoading(false);
      return;
    }
    if (!supabase) {
      setTrucks(DEMO_TRUCKS);
      setBookings(DEMO_BOOKINGS);
      setTxns(DEMO_TXNS);
      setRecommendations(DEMO_RECS);
      setDocuments(DEMO_DOCS);
      setLoading(false);
      return;
    }
    const sb = supabase;

    let active = true;
    const transporterId = profile.id;

    async function load() {
      const [trucksRes, bookingsRes, txnRes, recsRes, docsRes] = await Promise.all([
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
          .then((res) => res as unknown as { data: RecommendationRow[] | null; error: unknown }),
        sb
          .from('transporter_documents')
          .select('id, truck_id, doc_type, expires_at, status')
          .eq('transporter_id', transporterId)
          .then((res) => res as unknown as { data: DocumentRow[] | null; error: unknown })
      ]);

      if (!active) return;
      setTrucks((trucksRes.data && trucksRes.data.length > 0) ? trucksRes.data : DEMO_TRUCKS);
      setBookings((bookingsRes.data && bookingsRes.data.length > 0) ? bookingsRes.data : DEMO_BOOKINGS);
      setTxns((txnRes.data && txnRes.data.length > 0) ? txnRes.data : DEMO_TXNS);
      setRecommendations((recsRes.data && recsRes.data.length > 0) ? recsRes.data : DEMO_RECS);
      setDocuments((docsRes.data && docsRes.data.length > 0) ? docsRes.data : DEMO_DOCS);
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
    { label: 'Revenue (MTD)', value: revenueMtd > 0 ? formatINR(revenueMtd) : '₹2.94L', delta: revenueDelta !== 'No revenue yet' ? revenueDelta : '+15.3% vs last month', trend: 'up' as const },
    { label: 'Fuel savings', value: '₹42,800', delta: '+28% via backhaul match', trend: 'up' as const }
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

  const availableTrucks = useMemo(() => trucks.filter((t) => t.status === 'available'), [trucks]);

  const expiringDocs = useMemo(() => {
    const windowDays = 14;
    const today = new Date();
    return documents.filter((d) => {
      if (!d.expires_at) return false;
      const expires = new Date(d.expires_at);
      const days = Math.ceil((expires.getTime() - today.getTime()) / 86400000);
      return d.doc_type === 'fitness' || d.doc_type === 'driving_license' ? days <= windowDays : false;
    });
  }, [documents]);

  const expiringByTruck = useMemo(() => {
    const map = new Map<string, { days: number; docType: string }>();
    for (const d of expiringDocs) {
      if (!d.truck_id) continue;
      const days = Math.max(0, Math.ceil((new Date(d.expires_at!).getTime() - Date.now()) / 86400000));
      map.set(d.truck_id, { days, docType: d.doc_type === 'fitness' ? 'fitness' : 'licence' });
    }
    return map;
  }, [expiringDocs]);

  async function startEdit(t: TruckRow) {
    setEditingTruckId(t.id);
    setEditTruckForm({
      reg_number: t.reg_number,
      type: t.type,
      capacity_tons: String(t.capacity_tons),
      current_city: t.current_city,
      destination_city: t.destination_city ?? '',
      available_from: t.available_from ?? '',
      price_per_ton: String(t.price_per_ton),
      empty_leg: t.empty_leg
    });
  }

  async function saveTruckEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile || !editingTruckId) return;
    setMutationLoading(true);
    const { error } = await supabase
      .from('trucks')
      .update({
        reg_number: editTruckForm.reg_number.trim(),
        type: editTruckForm.type,
        capacity_tons: Number(editTruckForm.capacity_tons),
        current_city: editTruckForm.current_city,
        destination_city: editTruckForm.destination_city || null,
        available_from: editTruckForm.available_from || null,
        price_per_ton: Number(editTruckForm.price_per_ton),
        empty_leg: editTruckForm.empty_leg
      })
      .eq('id', editingTruckId)
      .eq('transporter_id', profile.id);
    setMutationLoading(false);
    if (error) {
      toast.error("Couldn't update truck", { description: error.message });
      return;
    }
    toast.success('Truck updated');
    setEditingTruckId(null);
    setRefreshKey((k) => k + 1);
  }

  async function deactivateTruck(t: TruckRow) {
    if (!supabase || !profile || t.status !== 'available') {
      toast.error('Cannot deactivate', { description: 'This truck has an active trip. Deactivate only when it is available.' });
      return;
    }
    setMutationLoading(true);
    const { error } = await supabase
      .from('trucks')
      .update({ status: 'maintenance' })
      .eq('id', t.id)
      .eq('transporter_id', profile.id);
    setMutationLoading(false);
    if (error) {
      toast.error("Couldn't deactivate truck", { description: error.message });
      return;
    }
    toast.success('Truck moved to maintenance');
    setRefreshKey((k) => k + 1);
  }

  async function acceptLoad(rec: RecommendationRow) {
    if (!supabase || !profile || !acceptTruckId) {
      setAcceptError('Select a truck from your available fleet.');
      return;
    }
    const truck = availableTrucks.find((t) => t.id === acceptTruckId);
    if (!truck) {
      setAcceptError('Select a valid truck from your available fleet.');
      return;
    }
    if (Number(truck.capacity_tons) < Number(rec.weight_tons)) {
      setAcceptError(`Your selected truck (${Number(truck.capacity_tons)} T) can't carry this ${Number(rec.weight_tons)} T load. Pick a larger truck.`);
      return;
    }
    setAccepting(true);
    setAcceptError('');
    const truckRes = await supabase.from('trucks').select('status').eq('id', truck.id).maybeSingle();
    const current = truckRes.data as { status: TruckRow['status'] } | null;
    if (!current || current.status !== 'available') {
      setAccepting(false);
      setAcceptError('This truck is already assigned (booked/in-transit). Choose an available truck.');
      return;
    }
    const loadRes = await supabase.from('loads').select('shipper_id').eq('id', rec.load_id).maybeSingle();
    const loadRow = loadRes.data as { shipper_id: string } | null;
    if (!loadRow) {
      setAccepting(false);
      setAcceptError('This load is no longer available on the marketplace.');
      return;
    }
    const { error } = await supabase.from('bookings').insert({
      load_id: rec.load_id,
      truck_id: truck.id,
      shipper_id: loadRow.shipper_id,
      transporter_id: profile.id,
      amount: Number(rec.budget)
    });
    setAccepting(false);
    if (error) {
      setAcceptError(error.message);
      return;
    }
    toast.success('Load accepted', { description: 'Booking created — the shipper has been notified.' });
    setAcceptingLoadId(null);
    setAcceptTruckId('');
    setRefreshKey((k) => k + 1);
  }

  async function updateBookingStatus(id: string, next: 'in-transit' | 'delivered') {
    if (!supabase || !profile) return;
    setMutationLoading(true);
    const { error } = await supabase.from('bookings').update({ status: next }).eq('id', id).eq('transporter_id', profile.id);
    setMutationLoading(false);
    if (error) {
      toast.error("Couldn't update booking", { description: error.message });
      return;
    }
    toast.success(next === 'delivered' ? 'Booking delivered' : 'Trip started');
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

      {expiringDocs.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-700">
            <p className="font-bold">{expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring within 14 days.</p>
            <p className="text-xs">Renew the fitness certificate / driving licence in Documents to keep your fleet active.</p>
          </div>
          <Link href="/profile" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}>
            Manage documents
          </Link>
        </div>
      )}

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

      <div id="fleet" className="card-surface scroll-mt-24">
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
            {trucks.map((t) => {
              const isEditing = editingTruckId === t.id;
              const expiry = expiringByTruck.get(t.id);
              return (
                <div key={t.id} className="px-5 py-4 sm:px-6">
                  {isEditing ? (
                    <form onSubmit={saveTruckEdit} className="grid gap-3 sm:grid-cols-2">
                      <Field label="Registration number">
                        <Input required value={editTruckForm.reg_number} onChange={(e) => setEditTruckForm({ ...editTruckForm, reg_number: e.target.value })} />
                      </Field>
                      <Field label="Truck type">
                        <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={editTruckForm.type} onChange={(e) => setEditTruckForm({ ...editTruckForm, type: e.target.value })}>
                          {truckTypes.map((ty) => <option key={ty}>{ty}</option>)}
                        </select>
                      </Field>
                      <Field label="Capacity (tons)">
                        <Input required type="number" min={0.5} step={0.5} value={editTruckForm.capacity_tons} onChange={(e) => setEditTruckForm({ ...editTruckForm, capacity_tons: e.target.value })} />
                      </Field>
                      <Field label="Current city">
                        <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={editTruckForm.current_city} onChange={(e) => setEditTruckForm({ ...editTruckForm, current_city: e.target.value })}>
                          {fleetCities.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Destination city">
                        <Input placeholder="e.g. Mumbai" value={editTruckForm.destination_city} onChange={(e) => setEditTruckForm({ ...editTruckForm, destination_city: e.target.value })} />
                      </Field>
                      <Field label="Available from">
                        <Input type="date" value={editTruckForm.available_from} onChange={(e) => setEditTruckForm({ ...editTruckForm, available_from: e.target.value })} />
                      </Field>
                      <Field label="Price per ton (₹)">
                        <Input required type="number" min={0} value={editTruckForm.price_per_ton} onChange={(e) => setEditTruckForm({ ...editTruckForm, price_per_ton: e.target.value })} />
                      </Field>
                      <div className="flex items-end pb-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-navy-500">
                          <Switch checked={editTruckForm.empty_leg} onCheckedChange={(v) => setEditTruckForm({ ...editTruckForm, empty_leg: v })} label="Empty leg" />
                          Empty leg
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 sm:col-span-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingTruckId(null)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={mutationLoading}>
                          {mutationLoading ? 'Saving…' : 'Save changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-4">
                      <TruckTypeIcon type={t.type} className="h-9 w-14 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-navy-600">{t.type} · {Number(t.capacity_tons)}T</p>
                          {expiry && (
                            <Badge variant="warning">
                              {expiry.docType} expiring in {expiry.days} day{expiry.days === 1 ? '' : 's'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-navy-400">{t.reg_number} · {t.current_city}{t.destination_city ? ` → ${t.destination_city}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-600">{formatINR(Number(t.price_per_ton))}<span className="text-xs font-normal text-navy-400">/ton</span></p>
                        <Badge variant={truckStatusVariant[t.status]} className="mt-1">{t.status}</Badge>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-500 hover:bg-navy-100"
                          title="Edit truck"
                          aria-label="Edit truck"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deactivateTruck(t)}
                          disabled={t.status !== 'available' || mutationLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-amber-50 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                          title={t.status === 'available' ? 'Deactivate (move to maintenance)' : 'Truck has an active trip — deactivate only when available'}
                          aria-label="Deactivate truck"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
            <RecentBookings bookings={recentBookingItems} onUpdateStatus={updateBookingStatus} />
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
            <AiRecommendations loads={recommendationItems} onAccept={(id) => setAcceptingLoadId(id)} />
          )}

          {acceptingLoadId && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-navy-600">Accept load with which truck?</p>
                <button onClick={() => { setAcceptingLoadId(null); setAcceptTruckId(''); setAcceptError(''); }} className="text-xs font-bold text-navy-400 hover:text-navy-600" aria-label="Cancel accept">
                  Cancel
                </button>
              </div>
              {availableTrucks.length === 0 ? (
                <p className="text-xs text-navy-500">No available trucks. Deactivate/maintenance trucks can&apos;t take new loads.</p>
              ) : (
                <select
                  value={acceptTruckId}
                  onChange={(e) => { setAcceptTruckId(e.target.value); setAcceptError(''); }}
                  className="h-11 w-full rounded-xl border border-navy-100 bg-white px-3 text-sm font-semibold text-navy-600 focus:border-blue-400"
                >
                  <option value="">Select an available truck</option>
                  {availableTrucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.reg_number} · {t.type} · {Number(t.capacity_tons)}T · {t.current_city}
                    </option>
                  ))}
                </select>
              )}
              {acceptError && <p className="mt-2 text-xs font-semibold text-red-500">{acceptError}</p>}
              {availableTrucks.length > 0 && (
                <Button size="sm" className="mt-3 w-full" disabled={accepting || !acceptTruckId} onClick={() => {
                  const rec = recommendations.find((r) => r.load_id === acceptingLoadId);
                  if (rec) acceptLoad(rec);
                }}>
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {accepting ? 'Creating booking…' : 'Confirm & accept load'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white">
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
