'use client';

import { useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { Tabs } from '@/components/ui/primitives';
import { FilterBar } from '@/components/marketplace/filter-bar';
import { LoadCard, TruckCard } from '@/components/marketplace/cards';
import { loads, trucks, routeStats } from '@/lib/mock-data';

export default function MarketplacePage() {
  const [mode, setMode] = useState<'loads' | 'trucks'>('loads');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');

  const filteredLoads = useMemo(
    () =>
      loads.filter((l) => {
        const matchesQuery = query ? `${l.title} ${l.originCity} ${l.destinationCity}`.toLowerCase().includes(query.toLowerCase()) : true;
        const matchesCity = city ? l.originCity === city || l.destinationCity === city : true;
        const matchesType = type ? l.truckTypeNeeded === type : true;
        return matchesQuery && matchesCity && matchesType;
      }),
    [query, city, type]
  );

  const filteredTrucks = useMemo(
    () =>
      trucks.filter((t) => {
        const matchesQuery = query ? `${t.type} ${t.currentCity} ${t.destinationCity} ${t.transporterName}`.toLowerCase().includes(query.toLowerCase()) : true;
        const matchesCity = city ? t.currentCity === city || t.destinationCity === city : true;
        const matchesType = type ? t.type === type : true;
        return matchesQuery && matchesCity && matchesType;
      }),
    [query, city, type]
  );

  const results = mode === 'loads' ? filteredLoads : filteredTrucks;

  return (
    <div className="space-y-6 pb-6 animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Marketplace</h1>
          <p className="mt-1 text-sm text-navy-400">{mode === 'loads' ? `${filteredLoads.length} open loads` : `${filteredTrucks.length} available trucks`} matching your fleet</p>
        </div>
        <Tabs
          tabs={[
            { key: 'loads', label: 'Find loads' },
            { key: 'trucks', label: 'Find trucks' }
          ]}
          active={mode}
          onChange={(k) => setMode(k as 'loads' | 'trucks')}
        />
      </div>

      <FilterBar query={query} onQueryChange={setQuery} city={city} onCityChange={setCity} type={type} onTypeChange={setType} />

      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {routeStats.map((r) => (
          <div key={r.route} className="flex shrink-0 items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-2 text-xs font-semibold text-navy-500">
            {r.route}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">-{r.savingsPct}%</span>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-navy-300">
            <PackageSearch className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-bold text-navy-600">No matches found</p>
          <p className="max-w-xs text-sm text-navy-400">Try adjusting your filters or search a different city and truck type.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mode === 'loads'
            ? filteredLoads.map((l) => <LoadCard key={l.id} load={l} />)
            : filteredTrucks.map((t) => <TruckCard key={t.id} truck={t} />)}
        </div>
      )}
    </div>
  );
}
