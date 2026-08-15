import { cva } from 'class-variance-authority';

/**
 * Pure, server-safe variant classes for buttons. Kept in its own module
 * (NOT a `'use client'` file) so server components can call `buttonVariants()`
 * directly at render time. The interactive `Button` (motion.button) lives in
 * `./button` and imports this.
 */
export const buttonVariants = cva(
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