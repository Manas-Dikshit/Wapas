'use client';

import { useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { cities } from '@/lib/mock-data';
import type { TruckType } from '@/lib/types';
import { TRUCK_TYPES } from '@/lib/truck-types';

const ratings = ['3.0', '3.5', '4.0', '4.5'];

/**
 * Optional group of load-oriented advanced filters. Passed (as `load`) when the
 * filter bar is being used to browse loads (marketplace loads tab). When absent
 * the bar renders exactly as it did before — truck filters only — so the shipper
 * stage's truck search is unaffected. This extends the existing More-filters
 * pattern rather than rewriting it.
 */
export type LoadFilterGroup = {
  origin: string;
  onOriginChange: (v: string) => void;
  destination: string;
  onDestinationChange: (v: string) => void;
  weightMin: string;
  onWeightMinChange: (v: string) => void;
  weightMax: string;
  onWeightMaxChange: (v: string) => void;
  budgetMin: string;
  onBudgetMinChange: (v: string) => void;
  budgetMax: string;
  onBudgetMaxChange: (v: string) => void;
  pickupFrom: string;
  onPickupFromChange: (v: string) => void;
  pickupTo: string;
  onPickupToChange: (v: string) => void;
};

export function FilterBar({
  query,
  onQueryChange,
  city,
  onCityChange,
  type,
  onTypeChange,
  capacityMin,
  onCapacityMinChange,
  capacityMax,
  onCapacityMaxChange,
  priceMin,
  onPriceMinChange,
  priceMax,
  onPriceMaxChange,
  availableFrom,
  onAvailableFromChange,
  ratingMin,
  onRatingMinChange,
  onReset,
  load
}: {
  query: string;
  onQueryChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  capacityMin?: string;
  onCapacityMinChange?: (v: string) => void;
  capacityMax?: string;
  onCapacityMaxChange?: (v: string) => void;
  priceMin?: string;
  onPriceMinChange?: (v: string) => void;
  priceMax?: string;
  onPriceMaxChange?: (v: string) => void;
  availableFrom?: string;
  onAvailableFromChange?: (v: string) => void;
  ratingMin?: string;
  onRatingMinChange?: (v: string) => void;
  onReset?: () => void;
  load?: Partial<LoadFilterGroup>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAdvanced = Boolean(onCapacityMinChange && onPriceMinChange && onAvailableFromChange && onRatingMinChange);
  const hasLoadFilters = Boolean(load && load.onWeightMinChange && load.onBudgetMinChange && load.onPickupFromChange);
  const active =
    (hasAdvanced &&
      (Boolean(capacityMin) || Boolean(capacityMax) || Boolean(priceMin) || Boolean(priceMax) || Boolean(availableFrom) || Boolean(ratingMin))) ||
    (hasLoadFilters &&
      (Boolean(load?.origin) ||
        Boolean(load?.destination) ||
        Boolean(load?.weightMin) ||
        Boolean(load?.weightMax) ||
        Boolean(load?.budgetMin) ||
        Boolean(load?.budgetMax) ||
        Boolean(load?.pickupFrom) ||
        Boolean(load?.pickupTo)));

  return (
    <div className="card-surface flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search loads, trucks, cities..."
            className="h-11 w-full rounded-2xl border border-navy-100 bg-canvas pl-11 pr-4 text-sm text-navy-600 placeholder:text-navy-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:overflow-x-auto">
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="h-11 w-full rounded-2xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400 sm:w-auto sm:shrink-0"
          >
            <option value="">Any city</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="h-11 w-full rounded-2xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400 sm:w-auto sm:shrink-0"
          >
            <option value="">Any truck type</option>
            {TRUCK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => setExpanded((s) => !s)}
            className={`col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-2xl border px-4 text-sm font-semibold transition-colors sm:col-span-1 sm:shrink-0 ${
              expanded || active ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-navy-100 bg-canvas text-navy-500 hover:bg-navy-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> More filters{active ? ' · 1+' : ''}
          </button>
        </div>
      </div>

      {(expanded && (hasAdvanced || hasLoadFilters)) && (
        <div className="grid grid-cols-2 gap-3 border-t border-navy-100 pt-3 sm:grid-cols-3 lg:grid-cols-6">
          {hasLoadFilters && (
            <>
              <SelectField label="Origin" value={load!.origin} onChange={load!.onOriginChange} options={cities} placeholder="Any origin" />
              <SelectField label="Destination" value={load!.destination} onChange={load!.onDestinationChange} options={cities} placeholder="Any destination" />
              <RangeInput label="Weight min (T)" value={load!.weightMin} onChange={load!.onWeightMinChange} type="number" min="0" />
              <RangeInput label="Weight max (T)" value={load!.weightMax} onChange={load!.onWeightMaxChange} type="number" min="0" />
              <RangeInput label="Budget min (₹)" value={load!.budgetMin} onChange={load!.onBudgetMinChange} type="number" min="0" />
              <RangeInput label="Budget max (₹)" value={load!.budgetMax} onChange={load!.onBudgetMaxChange} type="number" min="0" />
              <DateField label="Pickup from" value={load!.pickupFrom} onChange={load!.onPickupFromChange} />
              <DateField label="Pickup to" value={load!.pickupTo} onChange={load!.onPickupToChange} />
            </>
          )}
          {hasAdvanced && (
            <>
              <RangeInput label="Capacity min (T)" value={capacityMin} onChange={onCapacityMinChange} type="number" min="0" />
              <RangeInput label="Capacity max (T)" value={capacityMax} onChange={onCapacityMaxChange} type="number" min="0" />
              <RangeInput label="Price min (₹/ton)" value={priceMin} onChange={onPriceMinChange} type="number" min="0" />
              <RangeInput label="Price max (₹/ton)" value={priceMax} onChange={onPriceMaxChange} type="number" min="0" />
              <div>
                <label className="mb-1 block text-[11px] font-bold text-navy-500">Available from</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => onAvailableFromChange?.(e.target.value)}
                  className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-navy-500">Min rating</label>
                <select
                  value={ratingMin}
                  onChange={(e) => onRatingMinChange?.(e.target.value)}
                  className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400"
                >
                  <option value="">Any</option>
                  {ratings.map((r) => (
                    <option key={r} value={r}>★ {r}+</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {onReset && (
            <div className="col-span-full flex justify-end">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-navy-500 hover:bg-navy-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  type,
  min
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  type: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold text-navy-500">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold text-navy-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500 focus:border-blue-400"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold text-navy-500">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400"
      />
    </div>
  );
}