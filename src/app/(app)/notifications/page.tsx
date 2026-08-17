'use client';

import { Bell, CreditCard, Sparkles, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { useLiveNotifications } from '@/lib/hooks/use-live-notifications';

const iconFor = { booking: Truck, payment: CreditCard, system: Bell, ai: Sparkles } as const;
const colorFor = {
  booking: 'bg-blue-50 text-blue-500',
  payment: 'bg-emerald-50 text-emerald-500',
  system: 'bg-navy-50 text-navy-500',
  ai: 'bg-aqua-100 text-aqua-600'
} as const;

export default function NotificationsPage() {
  const { items, unreadCount, markAllRead, markRead } = useLiveNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-navy-400">{unreadCount} unread</p>
        </div>
        <button
          className="text-xs font-bold text-blue-500"
          onClick={markAllRead}
        >
          Mark all read
        </button>
      </div>

      <Stagger className="card-surface divide-y divide-navy-100" stagger={0.04}>
        {items.map((n) => {
          const Icon = iconFor[n.type];
          return (
            <StaggerItem key={n.id}>
              <button
                onClick={() => markRead(n.id)}
                className={cn('flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-navy-50/50 sm:p-5', !n.read && 'bg-blue-50/30')}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colorFor[n.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-navy-600">{n.title}</p>
                  <p className="mt-0.5 text-xs text-navy-400">{n.description}</p>
                  <p className="mt-1.5 text-[11px] text-navy-300">{n.time}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
