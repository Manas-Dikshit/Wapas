'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mail, MailCheck, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
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
      toast.error("Supabase isn't configured", {
        description: 'Add your Supabase project keys to enable real log in.'
      });
      return;
    }

    // Preserve where the user came from so the callback lands them back on it.
    const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
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
    <div className="relative min-h-screen bg-slate-50/60 flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
      {/* Background subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10"
      >
        <div className="h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl opacity-70" />
      </div>

      {/* Top Bar Navigation */}
      <header className="mx-auto w-full max-w-md flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="mx-auto w-full max-w-md my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-9 shadow-sm">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 focus:outline-none">
              <Image
                src="/logo.png"
                alt="Wapas"
                width={40}
                height={40}
                className="rounded-xl shadow-xs"
              />
              <span className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                Wapas
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Log in to your Wapas account with your work email.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="text-center space-y-5"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                  <MailCheck className="h-7 w-7" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-slate-900">Check your inbox</h2>
                  <p className="text-sm text-slate-600">
                    We sent a temporary sign-in link to:
                  </p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-100 py-1.5 px-3 rounded-lg inline-block break-all">
                    {email}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 text-left">
                  <p>
                    👉 Click the link in your email to sign in instantly. Open it on <strong className="text-slate-800">this same browser</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="work-email"
                      className="block text-sm font-semibold text-slate-800 mb-1.5"
                    >
                      Work email address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="work-email"
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full h-12 rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-slate-900 placeholder:text-slate-400 text-sm font-medium transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending sign-in link…</span>
                      </>
                    ) : (
                      <>
                        <span>Send sign-in link</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Trust badge */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <span>Secure passwordless sign-in via magic link</span>
                </div>

                {/* Sign up prompt */}
                <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
                  New to Wapas?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Create an account
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-md text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Wapas Technologies Pvt Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}