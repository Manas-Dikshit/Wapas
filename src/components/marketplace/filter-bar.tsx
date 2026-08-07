'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { cities } from '@/lib/mock-data';
import type { TruckType } from '@/lib/types';

const truckTypes: TruckType[] = ['Open Body', 'Container', 'Trailer', 'Refrigerated', 'Tanker', 'Mini Truck'];

export function FilterBar({
  query,
  onQueryChange,
  city,
  onCityChange,
  type,
  onTypeChange
}: {
  query: string;
  onQueryChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
}) {
  return (
    <div className="card-surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search loads, trucks, cities..."
          className="h-11 w-full rounded-2xl border border-navy-100 bg-canvas pl-11 pr-4 text-sm text-navy-600 placeholder:text-navy-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="h-11 shrink-0 rounded-2xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400"
        >
          <option value="">Any city</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-11 shrink-0 rounded-2xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400"
        >
          <option value="">Any truck type</option>
          {truckTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-navy-100 bg-canvas px-4 text-sm font-semibold text-navy-500 hover:bg-navy-50">
          <SlidersHorizontal className="h-4 w-4" /> More filters
        </button>
      </div>
    </div>
  );
}
