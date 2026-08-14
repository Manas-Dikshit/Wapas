'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ShieldCheck, Zap } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-wapas-gradient-dark p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] h-[440px] w-[440px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #69C8D4 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-30%] left-[-15%] h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4A7FCE 0%, transparent 70%)' }}
        />
        <Link href="/" className="relative flex items-center gap-2">
          <Image src="/logo.png" alt="Wapas" width={40} height={40} className="rounded-lg" />
          <span className="font-display text-2xl font-extrabold">Wapas</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight">Freight that finds its way back.</h2>
          <p className="mt-4 max-w-md text-white/70">
            Join <CountUp value={18000} />+ transporters and shippers already saving on every backhaul leg.
          </p>
          <Stagger className="mt-10 space-y-4">
            <StaggerItem><Feature icon={<Truck className="h-4 w-4" />} text="6,900+ verified trucks live on the network" /></StaggerItem>
            <StaggerItem><Feature icon={<Zap className="h-4 w-4" />} text="AI matches loads to routes in under 2 minutes" /></StaggerItem>
            <StaggerItem><Feature icon={<ShieldCheck className="h-4 w-4" />} text="Escrow-backed payments on every booking" /></StaggerItem>
          </Stagger>
        </div>

        <p className="relative text-xs text-white/40">© 2026 Wapas Technologies Pvt Ltd.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Reveal className="mx-auto w-full max-w-sm" y={20}>
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="Wapas" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-xl font-extrabold text-navy-600">Wapas</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-navy-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </Reveal>
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

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * value).toLocaleString('en-IN'));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [value]);
  return <span ref={ref}>{display}</span>;
}