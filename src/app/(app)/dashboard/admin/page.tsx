'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Server, ShieldAlert, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, Skeleton } from '@/components/ui/primitives';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { LOCKED_ADMIN_EMAIL } from '@/lib/admin';
import { formatCompactINR } from '@/lib/utils';

type ProfileRow = {
  id: string;
  full_name: string;
  company_name: string | null;
  role: string;
  kyc_status: string;
  verified: boolean;
  created_at: string;
  bookings: { count: number }[] | [];
};

const statusVariant = {
  Active: 'success',
  Pending: 'warning',
  'Under review': 'warning'
} as const;

function formatNumber(n: number) {
  return n.toLocaleString('en-IN');
}

function formatMonthYear(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function statusOf(u: Pick<ProfileRow, 'verified' | 'kyc_status'>) {
  if (u.verified && u.kyc_status === 'verified') return 'Active';
  if (u.kyc_status === 'pending') return 'Pending';
  return 'Under review';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: profileLoading, isAuthEnabled } = useCurrentProfile();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeFleet, setActiveFleet] = useState(0);
  const [gmvMtd, setGmvMtd] = useState(0);

  useEffect(() => {
    if (unauthorized) router.replace('/dashboard/shipper');
  }, [unauthorized, router]);

  useEffect(() => {
    if (unauthorized) return;
    if (!isAuthEnabled) {
      setLoading(false);
      return;
    }
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin') {
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    const sb = supabase;

    let active = true;

    async function load() {
      // Defense in depth only: the handle_new_user() trigger in 0009 is the
      // real enforcement and can only ever make the locked email an admin. Here
      // we sanity-check that the signed-in account's email is actually the
      // locked address before rendering any admin data; if it somehow isn't,
      // bounce to the shipper dashboard.
      const {
        data: { user }
      } = await sb.auth.getUser();
      if (active && user?.email && user.email.toLowerCase() !== LOCKED_ADMIN_EMAIL.toLowerCase()) {
        setUnauthorized(true);
        return;
      }

      const now = new Date();
      const [profilesRes, fleetRes, bookingsRes, usersRes] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb
          .from('trucks')
          .select('id', { count: 'exact', head: true })
          .in('status', ['available', 'booked', 'in-transit']),
        sb
          .from('bookings')
          .select('amount, created_at')
          .then((res) => res as unknown as { data: { amount: number; created_at: string }[] | null; error: unknown }),
        sb
          .from('profiles')
          .select('id, full_name, company_name, role, kyc_status, verified, created_at, bookings!bookings_transporter_id_fkey(count)')
          .order('created_at', { ascending: false })
          .limit(100)
          .then((res) => res as unknown as { data: ProfileRow[] | null; error: unknown })
      ]);

      if (!active) return;

      const mtd = (bookingsRes.data ?? []).reduce((sum, b) => {
        const d = new Date(b.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return sum + Number(b.amount);
        return sum;
      }, 0);

      setTotalUsers(profilesRes.count ?? 0);
      setActiveFleet(fleetRes.count ?? 0);
      setGmvMtd(mtd);
      setUsers(usersRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [profile, profileLoading, isAuthEnabled, supabase, unauthorized]);

  const filtered = users.filter((u) =>
    (u.company_name || u.full_name).toLowerCase().includes(query.toLowerCase())
  );

  const fetching = isAuthEnabled && loading;

  const stats = [
    { label: 'Total users', value: formatNumber(totalUsers), delta: 'All signed-up profiles', trend: 'up' as const },
    { label: 'Active fleet', value: formatNumber(activeFleet), delta: 'Available · booked · in-transit', trend: 'up' as const },
    { label: 'GMV (MTD)', value: gmvMtd > 0 ? formatCompactINR(gmvMtd) : '₹0', delta: gmvMtd > 0 ? 'This month' : 'No bookings yet', trend: 'up' as const },
    { label: 'Disputes open', value: '—', delta: 'Not yet tracked', trend: 'up' as const }
  ];

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Admin panel</h1>
        <p className="mt-1 text-sm text-navy-400">Platform-wide oversight for users, fleet and system health.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fetching
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-3xl" />)
          : stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} trend={s.trend} />)}
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
              {fetching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5 sm:px-6"><Skeleton className="h-4 w-40 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-8 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-16 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-sm text-navy-400">
                      No users yet — shippers and transporters will appear here as they sign up.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const trips = u.bookings?.[0]?.count ?? 0;
                  return (
                    <tr key={u.id} className="hover:bg-navy-50/50">
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.company_name || u.full_name} className="h-8 w-8 text-[10px]" />
                          <span className="font-semibold text-navy-600">{u.company_name || u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-navy-500">{u.role}</td>
                      <td className="px-5 py-3.5 text-navy-500">{trips}</td>
                      <td className="px-5 py-3.5 text-navy-500">{formatMonthYear(u.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariant[statusOf(u)]}>{statusOf(u)}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
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
          <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
            Fraud &amp; disputes aren&apos;t tracked yet — there&apos;s no disputes table in the schema, so we don&apos;t invent numbers here.
          </p>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-navy-400" />
            <h3 className="font-display text-base font-bold text-navy-600">System health</h3>
          </div>
          <p className="rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-400">
            System health checks aren&apos;t tracked yet — there&apos;s no monitoring schema backing this panel, so we don&apos;t fabricate statuses.
          </p>
        </div>
      </div>
    </div>
  );
}