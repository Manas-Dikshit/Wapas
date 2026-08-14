import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-12 w-full rounded-2xl border border-navy-100 bg-white px-4 text-sm text-navy-700 placeholder:text-navy-300 shadow-sm transition-all duration-200 focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(74,127,206,0.12)] disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };