import Image from 'next/image';
import Link from 'next/link';
import { Truck, ShieldCheck, Zap } from 'lucide-react';

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-wapas-gradient-dark p-12 text-white lg:flex">
        <div aria-hidden className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 80% 10%, white 0%, transparent 45%)' }} />
        <Link href="/" className="relative flex items-center gap-2">
          <Image src="/logo.png" alt="Wapas" width={40} height={40} className="rounded-lg" />
          <span className="font-display text-2xl font-extrabold">Wapas</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight">Freight that finds its way back.</h2>
          <p className="mt-4 max-w-md text-white/70">Join 18,000+ transporters and shippers already saving on every backhaul leg.</p>
          <div className="mt-10 space-y-4">
            <Feature icon={<Truck className="h-4 w-4" />} text="6,900+ verified trucks live on the network" />
            <Feature icon={<Zap className="h-4 w-4" />} text="AI matches loads to routes in under 2 minutes" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Escrow-backed payments on every booking" />
          </div>
        </div>

        <p className="relative text-xs text-white/40">© 2026 Wapas Technologies Pvt Ltd.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="Wapas" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-xl font-extrabold text-navy-600">Wapas</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-navy-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">{icon}</div>
      <p className="text-sm text-white/80">{text}</p>
    </div>
  );
}
