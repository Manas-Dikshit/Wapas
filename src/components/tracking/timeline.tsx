import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  label: string;
  time: string;
  done: boolean;
  active?: boolean;
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((s, i) => (
        <div key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span className={cn('absolute left-[11px] top-6 h-full w-0.5', s.done ? 'bg-blue-400' : 'bg-navy-100')} />
          )}
          <span
            className={cn(
              'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              s.done ? 'bg-blue-500 text-white' : s.active ? 'bg-aqua-400 text-white' : 'bg-navy-100 text-navy-300'
            )}
          >
            {s.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
          </span>
          <div>
            <p className={cn('text-sm font-bold', s.done || s.active ? 'text-navy-600' : 'text-navy-300')}>{s.label}</p>
            <p className="text-xs text-navy-400">{s.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
