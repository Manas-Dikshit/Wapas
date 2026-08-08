'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Package, Truck, Check } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type Role = 'shipper' | 'transporter';

const roles: { key: Role; title: string; desc: string; icon: React.ElementType }[] = [
  { key: 'transporter', title: 'I own or manage trucks', desc: 'List your fleet and get matched loads for backhaul trips.', icon: Truck },
  { key: 'shipper', title: 'I need to ship goods', desc: 'Post loads and book verified trucks in minutes.', icon: Package }
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', city: '' });

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;

    if (!supabase) {
      toast.error("Supabase isn't configured", { description: 'Add your Supabase project keys to enable real sign-up.' });
      return;
    }

    setLoading(true);
    // signInWithOtp creates the auth.users row on first use (shouldCreateUser
    // defaults to true). The `data` here becomes raw_user_meta_data, which
    // handle_new_user() (0004_link_auth_users.sql) reads to populate profiles.
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        data: { full_name: form.name, company_name: form.company, role, city: form.city }
      }
    });
    setLoading(false);

    if (error) {
      toast.error('Couldn\'t send verification code', { description: error.message });
      return;
    }

    setStep('otp');
    toast.success('Verification code sent', { description: `Check ${form.email} for a 6-digit code.` });
  }

  async function verifyAndFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: form.email, token: otp, type: 'email' });
    setLoading(false);

    if (error) {
      toast.error('Invalid or expired code', { description: error.message });
      return;
    }

    toast.success('Account created', { description: `Welcome to Wapas, ${form.name.split(' ')[0] || 'there'}!` });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell title="Create your account" subtitle="Set up your Wapas profile in under two minutes.">
      {step === 'details' ? (
        <>
          <div className="mb-6 space-y-3">
            {roles.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                    active ? 'border-blue-400 bg-blue-50' : 'border-navy-100 bg-white hover:border-navy-200'
                  )}
                >
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-wapas-gradient text-white' : 'bg-navy-50 text-navy-400')}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy-600">{r.title}</p>
                    <p className="text-xs text-navy-400">{r.desc}</p>
                  </div>
                  <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-blue-500 bg-blue-500 text-white' : 'border-navy-200')}>
                    {active && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submitDetails} className="space-y-3">
            <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input required placeholder="Company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input required type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Button type="submit" className="w-full" disabled={!role || loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification code
            </Button>
          </form>
        </>
      ) : (
        <form onSubmit={verifyAndFinish} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy-500">Enter the 6-digit code</label>
            <Input required maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
            <p className="mt-2 text-xs text-navy-300">
              Sent to {form.email}. <button type="button" className="font-semibold text-blue-500" onClick={() => setStep('details')}>Change</button>
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & create account
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-navy-400">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-blue-500">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}