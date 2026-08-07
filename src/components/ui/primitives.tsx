'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/utils';

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-navy-100', className)}>
      <div
        className={cn('h-full rounded-full bg-wapas-gradient transition-all duration-700 ease-out', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn('h-10 w-10 rounded-full object-cover', className)} />;
  }
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-wapas-gradient text-xs font-bold text-white', className)}>
      {initials(name)}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function Switch({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-wapas-gradient' : 'bg-navy-100'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-full bg-navy-50 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
            active === tab.key ? 'bg-white text-navy-600 shadow-soft' : 'text-navy-400 hover:text-navy-500'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
