'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Heart/bookmark toggle that saves/unsaves a transporter for the signed-in
 * shipper, backed by the real `saved_transporters` table (migration 0007).
 * RLS (`saved_transporters_insert_own` / `saved_transporters_delete_own`)
 * scopes writes to the caller's own shipper row, so no client-side guard is
 * needed beyond picking the shipper's id. Falls back to a local toggle when
 * Supabase isn't configured (demo mode) so the UI keeps working.
 */
export function SaveTransporterButton({
  transporterId,
  size = 'md',
  className
}: {
  transporterId: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { profile, loading: profileLoading, isAuthEnabled } = useCurrentProfile();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const shipperId = profile?.role === 'shipper' ? profile.id : undefined;

  useEffect(() => {
    if (!isAuthEnabled || !shipperId) return;
    if (profileLoading) return;

    const supabase = createClient();
    if (!supabase) return;

    let active = true;
    supabase
      .from('saved_transporters')
      .select('id')
      .eq('shipper_id', shipperId)
      .eq('transporter_id', transporterId)
      .maybeSingle()
      .then((res) => {
        if (active) setSaved(Boolean(res.data));
      });
    return () => {
      active = false;
    };
  }, [isAuthEnabled, profileLoading, shipperId, transporterId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    const supabase = createClient();
    if (supabase && shipperId) {
      if (saved) {
        const { error } = await supabase
          .from('saved_transporters')
          .delete()
          .eq('shipper_id', shipperId)
          .eq('transporter_id', transporterId);
        if (!error) {
          setSaved(false);
          toast.success('Removed from saved transporters');
        } else {
          toast.error('Could not unsave transporter', { description: error.message });
        }
      } else {
        const { error } = await supabase
          .from('saved_transporters')
          .insert({ shipper_id: shipperId, transporter_id: transporterId });
        if (!error) {
          setSaved(true);
          toast.success('Saved to your network');
        } else {
          toast.error('Could not save transporter', { description: error.message });
        }
      }
    } else {
      // Demo fallback: flip locally only, nothing persisted.
      setSaved((s) => !s);
      toast.success(saved ? 'Removed from saved transporters' : 'Saved to your network');
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave transporter' : 'Save transporter'}
      title={saved ? 'Unsave' : 'Save'}
      className={cn(
        'shrink-0 rounded-full border transition-colors',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        saved
          ? 'border-rose-200 bg-rose-50 text-rose-500'
          : 'border-navy-100 bg-white text-navy-300 hover:border-rose-200 hover:text-rose-400',
        busy && 'opacity-50',
        className
      )}
    >
      <Heart className={cn('mx-auto h-4 w-4', saved && 'fill-current')} />
    </button>
  );
}