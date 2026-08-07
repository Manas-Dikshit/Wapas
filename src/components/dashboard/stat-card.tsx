import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  delta,
  trend
}: {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
}) {
  return (
    <div className="card-surface p-5 transition-shadow duration-300 hover:shadow-floating">
      <p className="text-xs font-semibold text-navy-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-navy-600">{value}</p>
      <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-bold', trend === 'up' ? 'text-emerald-600' : 'text-red-500')}>
        {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {delta}
      </div>
    </div>
  );
}
