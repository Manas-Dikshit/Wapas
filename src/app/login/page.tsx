'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    if (!supabase) {
      toast.error("Supabase isn't configured", { description: 'Add NEXT_PUBLIC_SUPABASE_URL / ANON_KEY to .env.local to enable real login.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      toast.error("Couldn't send code", { description: error.message });
      return;
    }

    setStep('otp');
    toast.success('Check your inbox', { description: `We sent a 6-digit code to ${email}.` });
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);

    if (error) {
      toast.error('Invalid or expired code', { description: error.message });
      return;
    }

    toast.success('Welcome back to Wapas');
    router.push('/dashboard');
    router.refresh();
  }

  async function loginWithGoogle() {
    if (!supabase) {
      toast.error("Supabase isn't configured", { description: 'Add your Supabase project keys to enable Google login.' });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
    });

    if (error) toast.error('Google sign-in failed', { description: error.message });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your trucks, loads and bookings.">
      {step === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy-500">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <Input type="email" required placeholder="you@company.com" className="pl-11" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue with email
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy-500">Enter the 6-digit code</label>
            <Input required maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
            <p className="mt-2 text-xs text-navy-300">Sent to {email}. <button type="button" className="font-semibold text-blue-500" onClick={() => setStep('email')}>Change</button></p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & continue
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-navy-400">
        New to Wapas?{' '}
        <Link href="/register" className="font-bold text-blue-500">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}