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

type Role = 'shipper' | 'transporter';

const roles: { key: Role; title: string; desc: string; icon: React.ElementType }[] = [
  { key: 'transporter', title: 'I own or manage trucks', desc: 'List your fleet and get matched loads for backhaul trips.', icon: Truck },
  { key: 'shipper', title: 'I need to ship goods', desc: 'Post loads and book verified trucks in minutes.', icon: Package }
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Account created', { description: `Welcome to Wapas, ${form.name.split(' ')[0] || 'there'}!` });
      router.push('/dashboard');
    }, 1000);
  }

  return (
    <AuthShell title="Create your account" subtitle="Set up your Wapas profile in under two minutes.">
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

      <form onSubmit={submit} className="space-y-3">
        <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required placeholder="Company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Input required type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" className="w-full" disabled={!role || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-blue-500">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
