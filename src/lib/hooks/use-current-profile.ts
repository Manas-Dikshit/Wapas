'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { currentProfile as mockProfile } from '@/lib/mock-data';
import type { Profile } from '@/lib/types';

/**
 * Returns the real signed-in user's profile once Supabase is configured and
 * a session exists. Falls back to the demo mock profile when Supabase env
 * vars aren't set, so the UI keeps working in demo mode. Returns `null`
 * (not the mock) when Supabase IS configured but nobody is signed in.
 */
export function useCurrentProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(supabase ? null : mockProfile);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    async function load() {
      const {
        data: { user },
        error: sessionError
      } = await client.auth.getUser();

      if (sessionError || !user) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      // Auth session exists, but no linked profile row yet (0004 trigger
      // hasn't run, or the user predates it). Treat as "no profile" — never
      // throw and never fabricate data from an errored/unresolved query.
      if (!active) return;

      if (error || !data) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile({
        id: data.id,
        fullName: data.full_name,
        companyName: data.company_name ?? '',
        role: data.role,
        city: data.city ?? '',
        rating: Number(data.rating),
        verified: data.verified,
        gstNumber: data.gst_number ?? undefined,
        kycStatus: data.kyc_status,
        memberSince: new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      });
      setLoading(false);
    }

    load();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { profile, loading, isAuthEnabled: !!supabase };
}