'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Truck,
  Wallet,
  BarChart3,
  Bell,
  UserCircle,
  Settings,
  ShieldCheck,
  Menu,
  Search,
  Plus,
  Map
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/primitives';
import { notifications } from '@/lib/mock-data';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/routes', label: 'Routes', icon: Map },
  { href: '/bookings', label: 'Bookings', icon: Truck },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck }
];

const mobileNavItems: { href: string; label: string; icon: typeof LayoutDashboard; isFab?: boolean }[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Market', icon: Store },
  { href: '/post-load', label: 'Post', icon: Plus, isFab: true },
  { href: '/bookings', label: 'Trips', icon: Truck },
  { href: '/profile', label: 'Profile', icon: UserCircle }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { profile } = useCurrentProfile();
  const displayName = profile?.fullName ?? 'Guest';
  const displayCompany = profile?.companyName ?? 'Not signed in';

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-navy-100/70 bg-white lg:flex">
        <Link href="/" className="flex items-center gap-2 px-6 py-6">
          <Image src="/logo.png" alt="Wapas" width={36} height={36} className="rounded-lg" />
          <span className="font-display text-xl font-extrabold text-navy-600">Wapas</span>
        </Link>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  active ? 'text-blue-600' : 'text-navy-400 hover:bg-navy-50 hover:text-navy-600'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-blue-50"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon className="relative h-[18px] w-[18px]" strokeWidth={2.3} />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-100/70 p-4">
          <Link href="/profile" className="flex items-center gap-3 rounded-2xl p-2 hover:bg-navy-50">
            <Avatar name={displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-600">{displayName}</p>
              <p className="truncate text-xs text-navy-400">{displayCompany}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Desktop topbar */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-navy-100/70 bg-canvas/80 px-8 py-4 backdrop-blur-xl lg:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input
              placeholder="Search loads, trucks, routes..."
              className="h-11 w-full rounded-full border border-navy-100 bg-white pl-11 pr-4 text-sm text-navy-600 placeholder:text-navy-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-navy-100 hover:bg-navy-50">
              <Bell className="h-[18px] w-[18px] text-navy-500" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-aqua-400 ring-2 ring-white" />
              )}
            </Link>
            <Link href="/settings" className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-navy-100 hover:bg-navy-50">
              <Settings className="h-[18px] w-[18px] text-navy-500" />
            </Link>
            <Link href="/post-load" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              <Plus className="h-4 w-4" /> Post a load
            </Link>
          </div>
        </header>

        {/* Mobile topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-navy-100/70 bg-canvas/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Wapas" width={30} height={30} className="rounded-lg" />
            <span className="font-display text-lg font-extrabold text-navy-600">Wapas</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-navy-100">
              <Bell className="h-[17px] w-[17px] text-navy-500" />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-aqua-400 ring-2 ring-white" />}
            </Link>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-navy-100"
              aria-label="Open menu"
            >
              <Menu className="h-[18px] w-[18px] text-navy-500" />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-navy-700/40 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                  className="absolute right-0 top-0 h-full w-72 bg-white p-5 shadow-floating"
                  onClick={(e) => e.stopPropagation()}
                >
              <div className="mb-6 flex items-center gap-3">
                <Avatar name={displayName} />
                <div>
                  <p className="text-sm font-bold text-navy-600">{displayName}</p>
                  <p className="text-xs text-navy-400">{displayCompany}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {[...navItems, { href: '/profile', label: 'Profile', icon: UserCircle }, { href: '/settings', label: 'Settings', icon: Settings }, { href: '/help', label: 'Help Center', icon: ShieldCheck }].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-navy-500 hover:bg-navy-50"
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-navy-100/70 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        {mobileNavItems.map((item) => {
          const active = pathname.startsWith(item.href);
          if (item.isFab) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-floating">
                <item.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5">
              <item.icon className={cn('h-5 w-5', active ? 'text-blue-500' : 'text-navy-300')} strokeWidth={2.3} />
              <span className={cn('text-[10px] font-semibold', active ? 'text-blue-500' : 'text-navy-300')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}