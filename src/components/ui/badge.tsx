import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', {
  variants: {
    variant: {
      blue: 'bg-blue-100 text-blue-700',
      aqua: 'bg-aqua-100 text-aqua-700',
      navy: 'bg-navy-100 text-navy-600',
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-red-100 text-red-600',
      outline: 'border border-navy-200 text-navy-500 bg-white'
    }
  },
  defaultVariants: { variant: 'navy' }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
