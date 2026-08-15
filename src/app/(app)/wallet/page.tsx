'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Plus, Smartphone, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { bookings, transactions } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';

const statusVariant = { success: 'success', pending: 'warning', failed: 'danger' } as const;

export default function WalletPage() {
  const [balance] = useState(84250);
  const escrowTotal = bookings.reduce(
    (sum, booking) => sum + Math.max((booking.escrow?.totalAmount ?? 0) - (booking.escrow?.releasedAmount ?? 0), 0),
    0
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Wallet</h1>
        <p className="mt-1 text-sm text-navy-400">Manage payouts, escrow and transaction history.</p>
      </div>

      <div className="relative overflow-hidden rounded-xl4 bg-navy-600 p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs font-semibold text-white/60">Available balance</p>
        <p className="mt-2 font-display text-4xl font-extrabold">{formatINR(balance)}</p>
        <div className="mt-6 flex gap-3">
          <Button
            size="sm"
            className="bg-white text-navy-600 hover:bg-white/90 shadow-none"
            onClick={() => toast.success('Withdrawal initiated', { description: 'Funds will reach your bank in 1-2 business days.' })}
          >
            <ArrowDownLeft className="h-4 w-4" /> Withdraw
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => toast.success('Wallet top-up successful')}
          >
            <Plus className="h-4 w-4" /> Add funds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile icon={<ArrowUpRight className="h-4 w-4" />} label="Earned (MTD)" value={formatINR(29006)} tone="up" />
        <SummaryTile icon={<ArrowDownLeft className="h-4 w-4" />} label="Spent (MTD)" value={formatINR(3845)} tone="down" />
        <SummaryTile icon={<WalletIcon className="h-4 w-4" />} label="In escrow" value={formatINR(escrowTotal)} tone="neutral" />
      </div>

      <div className="card-surface p-5 sm:p-6">
        <h3 className="mb-4 font-display text-base font-bold text-navy-600">Escrow payout status</h3>
        <div className="space-y-3">
          {bookings.filter((booking) => booking.escrow).map((booking) => (
            <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-navy-100 p-3.5">
              <div>
                <p className="text-sm font-bold text-navy-600">{booking.loadTitle}</p>
                <p className="text-xs text-navy-400">{booking.route}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-navy-600">{formatINR((booking.escrow?.totalAmount ?? 0) - (booking.escrow?.releasedAmount ?? 0))}</p>
                <p className="text-[11px] font-semibold text-blue-500">{booking.escrow?.status === 'released' ? 'Released' : 'Held in escrow'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-5 sm:p-6">
        <h3 className="mb-4 font-display text-base font-bold text-navy-600">Payment methods</h3>
        <div className="space-y-3">
          <PaymentMethodRow icon={<Smartphone className="h-4 w-4" />} label="UPI — arjun@okhdfc" isDefault />
          <PaymentMethodRow icon={<CreditCard className="h-4 w-4" />} label="HDFC Bank •••• 4821" />
        </div>
        <button className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-500">
          <Plus className="h-4 w-4" /> Add payment method
        </button>
      </div>

      <div className="card-surface">
        <div className="p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-navy-600">Recent transactions</h3>
        </div>
        <div className="divide-y divide-navy-100">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {t.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy-600">{t.label}</p>
                <p className="text-xs text-navy-400">{t.date} · {t.method}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-navy-600'}`}>
                  {t.type === 'credit' ? '+' : '-'}{formatINR(t.amount)}
                </p>
                <Badge variant={statusVariant[t.status]} className="mt-1">{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'up' | 'down' | 'neutral' }) {
  const color = tone === 'up' ? 'text-emerald-600 bg-emerald-50' : tone === 'down' ? 'text-red-500 bg-red-50' : 'text-blue-600 bg-blue-50';
  return (
    <div className="card-surface p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>{icon}</div>
      <p className="mt-3 text-xs text-navy-400">{label}</p>
      <p className="text-sm font-bold text-navy-600">{value}</p>
    </div>
  );
}

function PaymentMethodRow({ icon, label, isDefault }: { icon: React.ReactNode; label: string; isDefault?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-500">{icon}</div>
      <p className="flex-1 text-sm font-semibold text-navy-600">{label}</p>
      {isDefault && <Badge variant="navy">Default</Badge>}
    </div>
  );
}
