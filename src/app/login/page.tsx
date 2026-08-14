'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// When Supabase can't find a user for the submitted email, it returns an
// error phrased around signup/OTP being disallowed. Match those markers so we
// can steer the visitor to /register instead of a generic failure toast.
function isSignupRequired(message: string) {
  return /signup|not found|no user|not allowed|no account|don'?t have an account/i.test(message);
}

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
        // Signup is gated behind /register: never silently auto-register an
        // unknown email that shows up here. Non-registered addresses should
        // get a clear "sign up instead" message (handled below).
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`
      }
    });
    setLoading(false);

    if (error) {
      if (isSignupRequired(error.message)) {
        toast.error('Account not found', {
          description: `No Wapas account uses ${email}. Please sign up to create one.`
        });
      } else {
        toast.error("Couldn't send sign-in link", { description: error.message });
      }
      return;
    }

    setSent(true);
    toast.success('Sign-in link sent', { description: `Check ${email} to finish logging in.` });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Wapas account.">
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
              <p className="text-sm font-bold text-navy-600">Link sent to {email}</p>
              <p className="text-xs text-navy-400">
                Open it on <span className="font-semibold">this same device/browser</span> to finish logging in.
              </p>
              <button className="text-xs font-semibold text-blue-500" onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <form onSubmit={submit} className="space-y-3">
              <Input
                required
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Sending link…' : 'Send sign-in link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-400">
              New to Wapas?{' '}
              <Link href="/register" className="font-bold text-blue-500">
                Create an account
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}