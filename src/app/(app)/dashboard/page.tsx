'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { Skeleton } from '@/components/ui/primitives';

const ROLE_PATH: Record<string, string> = {
  shipper: '/dashboard/shipper',
  transporter: '/dashboard/transporter',
  admin: '/dashboard/admin'
};

/**
 * /dashboard is a thin redirector: after login each role lands on its own
 * dashboard. Reuses useCurrentProfile() (the same hook already used across
 * the app) so loading/profile semantics match everywhere else — a neutral
 * loading state while the profile resolves, and a sensible shipper default
 * when the role is missing/unknown instead of erroring.
 */
export default function DashboardRedirector() {
  const router = useRouter();
  const { profile, loading } = useCurrentProfile();

  useEffect(() => {
    if (loading) return;
    const target = profile ? ROLE_PATH[profile.role] : undefined;
    router.replace(target ?? '/dashboard/shipper');
  }, [loading, profile, router]);

  return (
    <div className="flex flex-col items-center gap-3 pb-6 pt-16">
      <Skeleton className="h-8 w-64 rounded-full" />
      <Skeleton className="h-4 w-40 rounded-full" />
      <Skeleton className="mt-6 h-32 w-full max-w-3xl rounded-3xl" />
    </div>
  );
}