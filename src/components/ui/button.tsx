'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 shadow-floating',
        secondary: 'bg-navy-50 text-navy-600 hover:bg-navy-100',
        outline: 'border border-navy-200 text-navy-600 bg-white hover:bg-navy-50 hover:border-navy-300',
        ghost: 'text-navy-600 hover:bg-navy-50',
        dark: 'bg-navy-600 text-white hover:bg-navy-700 shadow-floating',
        destructive: 'bg-red-50 text-red-600 hover:bg-red-100'
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6',
        lg: 'h-[3.25rem] px-8 text-base',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
);

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onAnimationStart'
    >,
    VariantProps<typeof buttonVariants> {}

const PRESSABLE_VARIANTS: readonly string[] = ['primary', 'dark'];

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const reduce = useReducedMotion();
    const pressable = variant === undefined || PRESSABLE_VARIANTS.includes(variant as string);
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={!reduce && pressable ? { scale: 1.02 } : undefined}
        whileTap={!reduce && pressable ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };