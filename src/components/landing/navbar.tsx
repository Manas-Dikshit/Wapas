'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';
import { navLinks } from '@/lib/landing-content';

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'border-b border-navy-100/60 bg-canvas/85 shadow-soft' : 'border-b border-transparent bg-canvas/60'
      )}
    >
      <div className="container-app flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Wapas logo" width={38} height={38} className="rounded-lg" priority />
          <span className="font-display text-xl font-extrabold text-navy-600">Wapas</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-navy-500 transition-colors hover:text-blue-500">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Log in
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: 'sm' }))}>
            Sign up
          </Link>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100/60 bg-white px-5 py-4 md:hidden animate-fade-up">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-navy-500 hover:bg-navy-50">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
              Log in
            </Link>
            <Link href="/register" className={cn(buttonVariants(), 'flex-1')}>
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
