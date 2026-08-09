'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      toast.error("Supabase isn't configured", { description: 'Add your Supabase project keys to enable real log in.' });
      return;
    }

    // Preserve where the user came from so the callback lands them back on it.
    // Middleware sets ?next= when it bounces an unauth'd protected route to
    // /login; fall back to the dashboard when there's no such param.
    const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`
      }
    });
    setLoading(false);

    if (error) {
      toast.error("Couldn't send sign-in link", { description: error.message });
      return;
    }

    setSent(true);
    toast.success('Sign-in link sent', { description: `Check ${email} to finish logging in.` });
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to log in.">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-navy-100 bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-navy-600">Link sent to {email}</p>
          <p className="text-xs text-navy-400">
            Open it on <span className="font-semibold">this same device/browser</span> to finish logging in.
          </p>
          <button className="text-xs font-semibold text-blue-500" onClick={() => setSent(false)}>
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Wapas account.">
      <form onSubmit={submit} className="space-y-3">
        <Input required type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send sign-in link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        New to Wapas?{' '}
        <Link href="/register" className="font-bold text-blue-500">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}