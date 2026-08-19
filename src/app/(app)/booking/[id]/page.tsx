'use client';

import { useEffect, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, CreditCard, Loader2, Shield, Smartphone, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { bookings, loads, trucks } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { cn, formatINR } from '@/lib/utils';
import { TruckTypeIcon } from '@/components/marketplace/truck-type-icon';
import { createClient } from '@/lib/supabase/client';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';

const steps = ['Review', 'Payment', 'Confirmed'];

export default function BookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const load = loads.find((l) => l.id === params.id);
  const truck = trucks.find((t) => t.id === params.id);
  const item = load ?? truck;
  if (!item) notFound();

  const supabase = createClient();
  const { profile } = useCurrentProfile();
  const live = !!(supabase && profile);

  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const [method, setMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(84250);

  useEffect(() => {
    if (!live || !supabase || !profile) return;
    let active = true;
    (async () => {
      const bal = await supabase.rpc('wallet_balance', { p_profile_id: profile.id });
      if (active && bal.data != null) setWalletBalance(Number(bal.data));
    })();
    return () => {
      active = false;
    };
  }, [live, supabase, profile]);

  const title = load ? load.title : `${truck!.type} · ${truck!.capacityTons}T`;
  const route = load ? `${load.originCity} → ${load.destinationCity}` : `${truck!.currentCity} → ${truck!.destinationCity}`;
  const amount = load ? load.budget : truck!.pricePerTon * truck!.capacityTons;
  const counterparty = load ? load.shipperName : truck!.transporterName;
  const escrow = bookings.find((booking) => booking.loadId === item.id || booking.truckId === item.id)?.escrow ?? {
    id: `esc_${item.id}`,
    bookingId: `bk_${item.id}`,
    totalAmount: amount,
    releasedAmount: Math.round(amount * 0.4),
    status: 'partially_released',
    milestones: [
      { id: `milestone-${item.id}-pickup`, label: 'Pickup confirmed', amount: Math.round(amount * 0.4), status: 'released', dueAt: 'Today' },
      { id: `milestone-${item.id}-delivery`, label: 'Delivery payout', amount: amount - Math.round(amount * 0.4), status: 'pending', dueAt: 'Delivery' }
    ]
  };

  async function confirmPayment() {
    if (!live || !supabase || !profile) {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setStep(2);
      }, 1400);
      return;
    }

    setProcessing(true);
    try {
      const { data: loadRow } = await supabase.from('loads').select('*').eq('id', params.id).maybeSingle();
      const { data: truckRow } = loadRow
        ? { data: null }
        : await supabase.from('trucks').select('*').eq('id', params.id).maybeSingle();

      let insert: { load_id: string; truck_id: string; shipper_id: string; transporter_id: string; amount: number };

      if (loadRow) {
        // Booking a load — the signed-in user is the transporter.
        if (profile.role !== 'transporter' && profile.role !== 'admin') {
          toast.error('Only transporters can book a load.');
          return;
        }
        const { data: fleet } = await supabase
          .from('trucks')
          .select('*')
          .eq('transporter_id', profile.id)
          .eq('status', 'available');
        const truck = (fleet ?? []).find((t) => t.type === loadRow.truck_type_needed) ?? (fleet ?? [])[0];
        if (!truck) {
          toast.error('No available truck in your fleet', { description: 'Add an available truck that can carry this load before booking.' });
          return;
        }
        insert = {
          load_id: loadRow.id,
          truck_id: truck.id,
          shipper_id: loadRow.shipper_id,
          transporter_id: profile.id,
          amount: Number(loadRow.budget)
        };
      } else if (truckRow) {
        // Booking a truck — the signed-in user is the shipper.
        if (profile.role !== 'shipper' && profile.role !== 'admin') {
          toast.error('Only shippers can book a truck.');
          return;
        }
        const { data: openLoad } = await supabase
          .from('loads')
          .select('*')
          .eq('shipper_id', profile.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!openLoad) {
          toast.error('No open load to attach', { description: 'Post a load first, then book a truck against it.' });
          return;
        }
        insert = {
          load_id: openLoad.id,
          truck_id: truckRow.id,
          shipper_id: profile.id,
          transporter_id: truckRow.transporter_id,
          amount: Number(truckRow.price_per_ton) * Number(truckRow.capacity_tons)
        };
      } else {
        toast.error('Item not found', { description: 'This load or truck no longer exists on the marketplace.' });
        return;
      }

      const bal = await supabase.rpc('wallet_balance', { p_profile_id: insert.shipper_id });
      if (Number(bal.data ?? 0) < insert.amount) {
        toast.error('Insufficient wallet balance', { description: 'Add funds to your wallet before booking.' });
        return;
      }

      const { error } = await supabase.from('bookings').insert(insert);
      if (error) throw error;
      setStep(2);
    } catch (err) {
      const msg = ((err as { message?: string })?.message ?? '').toLowerCase();
      if (msg.includes('insufficient_wallet_balance')) {
        toast.error('Insufficient wallet balance', { description: 'Add funds to your wallet before booking.' });
      } else if (msg.includes('already_booked') || msg.includes('truck_not_available')) {
        toast.error('This load is already booked', { description: 'It has been taken by another transporter.' });
      } else if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('Already booked', { description: 'This load can only be booked once.' });
      } else if (msg.includes('failed to fetch') || msg.includes('network')) {
        toast.error('Could not reach the server', { description: 'Check your connection and try again.' });
      } else {
        toast.error("Couldn't complete booking", { description: (err as { message?: string })?.message ?? 'Please try again.' });
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-500 text-white' : 'bg-navy-100 text-navy-400'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('text-xs font-semibold', i === step ? 'text-navy-600' : 'text-navy-300')}>{s}</span>
            {i < steps.length - 1 && <div className="h-px w-4 bg-navy-100 sm:w-8" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div
            key="review"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card-surface p-6">
          <h2 className="font-display text-lg font-bold text-navy-600">Review booking</h2>
          {!load && truck && (
            <div className="mt-3 flex items-center gap-2">
              <TruckTypeIcon type={truck.type} className="h-8 w-12" />
              <span className="text-xs font-semibold text-navy-400">{truck.type} truck</span>
            </div>
          )}
          <div className="mt-5 space-y-3 rounded-2xl bg-navy-50 p-4">
            <Row label="Shipment" value={title} />
            <Row label="Route" value={route} />
            <Row label="Counterparty" value={counterparty} />
            <Row label="Pickup" value={load ? new Date(load.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : 'Within 24 hours'} />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-navy-100 pt-5">
            <span className="text-sm font-semibold text-navy-500">Total amount</span>
            <span className="font-display text-2xl font-extrabold text-navy-600">{formatINR(amount)}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">Escrow status</p>
                <p className="mt-1 text-sm font-bold text-navy-600">{formatINR(escrow.totalAmount - escrow.releasedAmount)} held securely</p>
              </div>
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 space-y-2">
              {escrow.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between rounded-xl bg-white/60 px-2.5 py-2 text-[11px]">
                  <span className="text-navy-500">{milestone.label}</span>
                  <span className={cn('font-bold', milestone.status === 'released' ? 'text-emerald-600' : 'text-navy-500')}>
                    {milestone.status === 'released' ? 'Released' : 'Pending'} · {formatINR(milestone.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-navy-400">
            <Shield className="h-3.5 w-3.5 text-emerald-500" /> Held securely in escrow until delivery is confirmed.
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={() => setStep(1)}>
            Continue to payment
          </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="payment"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card-surface p-6">
          <h2 className="font-display text-lg font-bold text-navy-600">Choose payment method</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <PayOption icon={<Smartphone className="h-5 w-5" />} label="UPI" active={method === 'upi'} onClick={() => setMethod('upi')} />
            <PayOption icon={<CreditCard className="h-5 w-5" />} label="Card" active={method === 'card'} onClick={() => setMethod('card')} />
            <PayOption icon={<WalletIcon className="h-5 w-5" />} label="Wallet" active={method === 'wallet'} onClick={() => setMethod('wallet')} />
          </div>

          <div className="mt-5 rounded-2xl border border-navy-100 p-4">
            {method === 'upi' && <input placeholder="yourname@upi" className="h-11 w-full rounded-xl border border-navy-100 px-4 text-sm focus:border-blue-400" />}
            {method === 'card' && (
              <div className="space-y-3">
                <input placeholder="Card number" className="h-11 w-full rounded-xl border border-navy-100 px-4 text-sm focus:border-blue-400" />
                <div className="flex gap-3">
                  <input placeholder="MM/YY" className="h-11 w-full rounded-xl border border-navy-100 px-4 text-sm focus:border-blue-400" />
                  <input placeholder="CVV" className="h-11 w-full rounded-xl border border-navy-100 px-4 text-sm focus:border-blue-400" />
                </div>
              </div>
            )}
            {method === 'wallet' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-500">Wapas Wallet balance</span>
                  <span className="font-display text-lg font-extrabold text-navy-600">{formatINR(walletBalance)}</span>
                </div>
                {walletBalance < amount && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                    Insufficient wallet balance for this booking ({formatINR(amount)} required). Please top up your wallet before proceeding.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-navy-100 pt-5">
            <span className="text-sm font-semibold text-navy-500">Total payable</span>
            <span className="font-display text-2xl font-extrabold text-navy-600">{formatINR(amount)}</span>
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={confirmPayment} disabled={processing || (method === 'wallet' && walletBalance < amount)}>
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            {processing ? 'Processing payment…' : `Pay ${formatINR(amount)}`}
          </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="confirmed"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card-surface flex flex-col items-center p-10 text-center animate-scale-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-navy-600">Booking confirmed!</h2>
          <p className="mt-2 max-w-sm text-sm text-navy-400">
            {counterparty} has been notified. Your driver details will appear on the tracking page shortly.
          </p>
          <div className="mt-6 w-full space-y-2 rounded-2xl bg-navy-50 p-4 text-left">
            <Row label="Booking ID" value={`#BK${item.id.slice(-4).toUpperCase()}`} />
            <Row label="Amount paid" value={formatINR(amount)} />
            <Row label="Escrow held" value={formatINR(escrow.totalAmount - escrow.releasedAmount)} />
            <Row label="Route" value={route} />
          </div>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/bookings')}>
              View all trips
            </Button>
            <Button className="flex-1" onClick={() => router.push('/tracking/bk_301')}>
              Track shipment
            </Button>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-navy-400">{label}</span>
      <span className="font-semibold text-navy-600">{value}</span>
    </div>
  );
}

function PayOption({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-colors',
        active ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy-100 text-navy-400 hover:border-navy-200'
      )}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
