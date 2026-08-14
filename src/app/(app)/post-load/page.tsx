'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, MapPin, Sparkles } from 'lucide-react';
import { cities, routeBetween } from '@/lib/mock-data';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isTruckType, truckTypeMeta } from '@/lib/truck-types';
import { formatINR } from '@/lib/utils';
import { RouteStrip } from '@/components/marketplace/route-strip';

const truckTypes = ['Open Body', 'Container', 'Trailer', 'Refrigerated', 'Tanker', 'Mini Truck'];
const categories = ['Textiles', 'FMCG', 'Perishables', 'Automotive', 'Construction', 'Agri-commodities', 'Pharma', 'Electronics'];

export default function PostLoadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useCurrentProfile();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: categories[0],
    weight: '',
    origin: searchParams.get('origin') && cities.includes(searchParams.get('origin')!) ? searchParams.get('origin')! : cities[0],
    destination: searchParams.get('destination') && cities.includes(searchParams.get('destination')!) ? searchParams.get('destination')! : cities[1],
    pickupDate: '',
    budget: '',
    truckType: truckTypes[0]
  });

  const suggestedRoute = useMemo(() => routeBetween(form.origin, form.destination), [form.origin, form.destination]);

  const typicalPerTon = isTruckType(form.truckType) ? truckTypeMeta[form.truckType].typicalPricePerTon : 0;
  const typicalCost = typicalPerTon * Number(form.weight || 0);
  const budgetLow = form.budget !== '' && typicalCost > 0 && Number(form.budget) < typicalCost * 0.7;

  async function checkForDuplicate() {
    const supabase = createClient();
    const shipperId = profile?.role === 'shipper' ? profile.id : undefined;
    if (!supabase || !shipperId) return;

    setChecking(true);
    const { data } = await supabase
      .from('loads')
      .select('id, title, origin_city, destination_city, pickup_date, weight_tons, status')
      .eq('shipper_id', shipperId)
      .eq('origin_city', form.origin)
      .eq('destination_city', form.destination)
      .eq('pickup_date', form.pickupDate)
      .in('status', ['open', 'matched']);
    setChecking(false);

    const near = (data ?? []).find((r) => Math.abs(Number(r.weight_tons) - Number(form.weight)) < 0.5);
    setDuplicate(near ? (near as unknown as { id: string; title: string }).title : null);
    return near ? (near as unknown as { id: string; title: string }).id : null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const shipperId = profile?.role === 'shipper' ? profile.id : undefined;

    // Real Supabase path: INSERT into `loads` for this shipper. RLS
    // (loads_insert_own) enforces shipper_id = current_profile_id(), so the
    // row lands under the signed-in shipper with no client-side override.
    if (supabase && shipperId) {
      const dupId = await checkForDuplicate();
      if (dupId) {
        const proceed = window.confirm(
          `You already have a very similar open load on the same route and date. Posting another one may split demand and delay matching. Post anyway?`
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('loads').insert({
        shipper_id: shipperId,
        title: form.title,
        category: form.category,
        weight_tons: Number(form.weight),
        origin_city: form.origin,
        destination_city: form.destination,
        pickup_date: form.pickupDate,
        budget: Number(form.budget),
        truck_type_needed: form.truckType,
        status: 'open'
      });

      setLoading(false);

      if (error) {
        toast.error('Could not post load', { description: error.message });
        return;
      }

      toast.success('Load posted', { description: 'We\'re matching it with nearby transporters now.' });
      router.push('/dashboard/shipper');
      return;
    }

    // Demo fallback (no Supabase configured, or no signed-in shipper).
    setTimeout(() => {
      setLoading(false);
      toast.success('Load posted', { description: 'We\'re matching it with nearby transporters now.' });
      router.push('/marketplace');
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Post a load</h1>
        <p className="mt-1 text-sm text-navy-400">Fill in the details and get matched with verified transporters in minutes.</p>
      </div>

      <form onSubmit={submit} className="card-surface space-y-5 p-5 sm:p-6">
        <Field label="Load title">
          <Input required placeholder="e.g. Textile Rolls — 400 Bales" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Weight (tons)">
            <Input required type="number" min={0.5} step={0.5} placeholder="10" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin city">
            <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Destination city">
            <select className="h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 focus:border-blue-400" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {suggestedRoute && (
          <div className="rounded-2xl border border-aqua-200 bg-aqua-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-aqua-600" />
              <p className="text-xs font-bold text-navy-600">Known corridor detected</p>
              <span className="ml-auto text-[11px] font-semibold text-navy-400">{suggestedRoute.distanceKm} km</span>
            </div>
            <RouteStrip route={suggestedRoute} />
            <p className="mt-3 text-[11px] text-navy-400">
              Shippers can also request pickup at any intermediate stop along this route — not just the origin.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Pickup date">
            <Input required type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} />
          </Field>
          <Field label="Budget (₹)">
            <Input required type="number" min={500} placeholder="21500" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </Field>
        </div>

        <Field label="Truck type needed">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {truckTypes.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm({ ...form, truckType: t })}
                className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold transition-colors ${
                  form.truckType === t ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy-100 text-navy-400 hover:border-navy-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {budgetLow && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              Your budget of <strong>{formatINR(Number(form.budget))}</strong> is well below the typical{' '}
              <strong>{formatINR(typicalCost)}</strong> for a {form.truckType} moving {form.weight}T
              ({formatINR(typicalPerTon)}/ton on average). You can still post, but fewer transporters may respond.
            </p>
          </div>
        )}

        {duplicate && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700">
              Looks like a near-duplicate of &quot;<strong>{duplicate}</strong>&quot; on the same route, date and weight. Posting a
              duplicate is allowed, but it may split demand. <strong>Check the form above</strong> before submitting.
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700">Our AI will automatically match this load with the best-fit backhaul trucks and notify you as matches come in.</p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading || checking}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Posting load…' : 'Post load'}
        </Button>
      </form>
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
