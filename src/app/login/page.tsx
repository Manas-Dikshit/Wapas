'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, Truck, Package, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast.success('OTP sent to ' + email, { description: 'Use 123456 for this demo.' });
    }, 900);
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Welcome back to Wapas');
      router.push('/dashboard');
    }, 900);
  }

  function demoLogin(role: string) {
    toast.success(`Signed in as demo ${role}`);
    router.push('/dashboard');
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
          <div className="relative py-2 text-center text-xs text-navy-300">
            <span className="relative z-10 bg-canvas px-3">or continue with</span>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-navy-100" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => demoLogin('user')}>
            Continue with Google
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

      <div className="mt-8 rounded-2xl border border-navy-100 bg-white p-4">
        <p className="mb-3 text-xs font-bold text-navy-400">Quick demo access</p>
        <div className="grid grid-cols-3 gap-2">
          <DemoButton icon={<Truck className="h-4 w-4" />} label="Transporter" onClick={() => demoLogin('transporter')} />
          <DemoButton icon={<Package className="h-4 w-4" />} label="Shipper" onClick={() => demoLogin('shipper')} />
          <DemoButton icon={<ShieldCheck className="h-4 w-4" />} label="Admin" onClick={() => demoLogin('admin')} />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-navy-400">
        New to Wapas?{' '}
        <Link href="/register" className="font-bold text-blue-500">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

function DemoButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-navy-100 py-3 text-navy-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
