'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';

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

export { Button };