'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { notifications as mockNotifications } from '@/lib/mock-data';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import type { NotificationItem } from '@/lib/types';

type NotificationRow = {
  id: string;
  title: string;
  description: string | null;
  type: NotificationItem['type'];
  read: boolean;
  created_at: string;
};

function toItem(r: NotificationRow): NotificationItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    type: r.type,
    read: r.read,
    time: new Date(r.created_at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  };
}

/**
 * Live notification feed for the bell + notifications page.
 *
 * When Supabase is configured and a signed-in profile exists, the latest 50
 * rows are fetched once and a Realtime `postgres_changes` INSERT subscription
 * (filtered to this user via `user_id=eq.<profile.id>` — RLS-safe) pushes new
 * rows in live, toasting each unread one. In demo mode (no Supabase) it falls
 * back to the static mock list untouched.
 */
export function useLiveNotifications() {
  const supabase = createClient();
  const { profile } = useCurrentProfile();
  const [items, setItems] = useState<NotificationItem[]>(supabase && profile ? [] : mockNotifications);

  useEffect(() => {
    if (!supabase || !profile) return;
    const client = supabase;
    let active = true;

    const load = () =>
      client
        .from('notifications')
        .select('id, title, description, type, read, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (active && data) setItems((data as NotificationRow[]).map(toItem));
        });

    load();

    const channel = client
      .channel('realtime:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (!active) return;
          setItems((prev) => [toItem(row), ...prev]);
          if (!row.read) toast.success(row.title, { description: row.description ?? undefined });
        }
      )
      .subscribe();

    // Supabase auto-reconnects on network loss; this focus handler just
    // re-syncs rows that could have been dropped while the tab was
    // backgrounded. The channel itself is never re-created here.
    window.addEventListener('focus', load);

    return () => {
      active = false;
      window.removeEventListener('focus', load);
      client.removeChannel(channel);
    };
  }, [supabase, profile]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    if (supabase && profile) {
      supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false).then(() => {});
    }
  }, [supabase, profile]);

  const markRead = useCallback(
    (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (supabase) supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {});
    },
    [supabase]
  );

  return { items, unreadCount: items.filter((n) => !n.read).length, markAllRead, markRead };
}
