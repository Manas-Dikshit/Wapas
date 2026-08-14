'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Package, Truck, Check, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type Role = 'shipper' | 'transporter';

const roles: { key: Role; title: string; desc: string; icon: React.ElementType }[] = [
  { key: 'transporter', title: 'I own or manage trucks', desc: 'List your fleet and get matched loads for backhaul trips.', icon: Truck },
  { key: 'shipper', title: 'I need to ship goods', desc: 'Post loads and book verified trucks in minutes.', icon: Package }
];

export default function RegisterPage() {
  const supabase = createClient();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', city: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;

    if (!supabase) {
      toast.error("Supabase isn't configured", { description: 'Add your Supabase project keys to enable real sign-up.' });
      return;
    }

    // Preserve where the user came from so the callback lands them back on it.
    // Middleware sets ?next= when it bounces an unauth'd protected route to
    // /login; fall back to the dashboard when there's no such param.
    const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';

    setLoading(true);
    // signInWithOtp creates the auth.users row on first use. `shouldCreateUser`
    // is set explicitly (true) so account creation here is intentional and
    // unambiguous — unlike login, which is gated to existing users only.
    // `data` becomes raw_user_meta_data, which handle_new_user()
    // (0004_link_auth_users.sql) reads to populate the profiles row once the
    // link is confirmed.
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        data: { full_name: form.name, company_name: form.company, role, city: form.city },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`
      }
    });
    setLoading(false);

    if (error) {
      toast.error("Couldn't send verification link", { description: error.message });
      return;
    }

    setSent(true);
    toast.success('Verification link sent', { description: `Check ${form.email} to finish creating your account.` });
  }

  return (
    <AuthShell title="Create your account" subtitle="Set up your Wapas profile in under two minutes.">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-navy-100 bg-white p-6 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500"
              >
                <MailCheck className="h-6 w-6" />
              </motion.div>
              <p className="text-sm font-bold text-navy-600">Link sent to {form.email}</p>
              <p className="text-xs text-navy-400">
                Open it on <span className="font-semibold">this same device/browser</span> — your account and profile will be created automatically.
              </p>
              <button className="text-xs font-semibold text-blue-500" onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Stagger className="mb-6 space-y-3">
              {roles.map((r) => {
                const active = role === r.key;
                return (
                  <StaggerItem key={r.key}>
                    <button
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={cn(
                        'relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                        active ? 'border-blue-400 bg-blue-50' : 'border-navy-100 bg-white hover:border-navy-200'
                      )}
                    >
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200', active ? 'bg-blue-500 text-white' : 'bg-navy-50 text-navy-400')}>
                        <r.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy-600">{r.title}</p>
                        <p className="text-xs text-navy-400">{r.desc}</p>
                      </div>
                      <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200', active ? 'border-blue-500 bg-blue-500 text-white' : 'border-navy-200')}>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            >
                              <Check className="h-3 w-3" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  </StaggerItem>
                );
              })}
            </Stagger>

            <form onSubmit={submit} className="space-y-3">
              <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input required placeholder="Company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input required type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Button type="submit" className="w-full" disabled={!role || loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Sending verification…' : 'Send verification link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-400">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-blue-500">
                Log in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}