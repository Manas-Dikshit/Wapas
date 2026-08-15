'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Tabs } from '@/components/ui/primitives';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { FilterBar } from '@/components/marketplace/filter-bar';
import { LoadCard, TruckCard } from '@/components/marketplace/cards';
import { IntermediateStops } from '@/components/marketplace/intermediate-stops';
import { Button } from '@/components/ui/button';
import { loads, trucks, routeStats } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function MarketplacePage() {
  const [mode, setMode] = useState<'loads' | 'trucks'>('loads');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [capacityMin, setCapacityMin] = useState('');
  const [capacityMax, setCapacityMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [ratingMin, setRatingMin] = useState('');

  const [loadOrigin, setLoadOrigin] = useState('');
  const [loadDestination, setLoadDestination] = useState('');
  const [weightMin, setWeightMin] = useState('');
  const [weightMax, setWeightMax] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [pickupFrom, setPickupFrom] = useState('');
  const [pickupTo, setPickupTo] = useState('');

  const filteredLoads = useMemo(
    () =>
      loads.filter((l) => {
        const matchesQuery = query ? `${l.title} ${l.originCity} ${l.destinationCity}`.toLowerCase().includes(query.toLowerCase()) : true;
        const matchesCity = city ? l.originCity === city || l.destinationCity === city : true;
        const matchesType = type ? l.truckTypeNeeded === type : true;
        const matchesOrigin = loadOrigin ? l.originCity === loadOrigin : true;
        const matchesDestination = loadDestination ? l.destinationCity === loadDestination : true;
        const matchesWeightMin = weightMin ? l.weightTons >= Number(weightMin) : true;
        const matchesWeightMax = weightMax ? l.weightTons <= Number(weightMax) : true;
        const matchesBudgetMin = budgetMin ? l.budget >= Number(budgetMin) : true;
        const matchesBudgetMax = budgetMax ? l.budget <= Number(budgetMax) : true;
        const matchesPickupFrom = pickupFrom ? new Date(l.pickupDate) >= new Date(pickupFrom) : true;
        const matchesPickupTo = pickupTo ? new Date(l.pickupDate) <= new Date(pickupTo) : true;
        return (
          matchesQuery &&
          matchesCity &&
          matchesType &&
          matchesOrigin &&
          matchesDestination &&
          matchesWeightMin &&
          matchesWeightMax &&
          matchesBudgetMin &&
          matchesBudgetMax &&
          matchesPickupFrom &&
          matchesPickupTo
        );
      }),
    [query, city, type, loadOrigin, loadDestination, weightMin, weightMax, budgetMin, budgetMax, pickupFrom, pickupTo]
  );

  const filteredTrucks = useMemo(
    () =>
      trucks.filter((t) => {
        const matchesQuery = query ? `${t.type} ${t.currentCity} ${t.destinationCity} ${t.transporterName}`.toLowerCase().includes(query.toLowerCase()) : true;
        const passesThrough = t.route?.stops.some((s) => s.city.toLowerCase() === city.toLowerCase()) ?? false;
        const matchesCity = city ? t.currentCity.toLowerCase() === city.toLowerCase() || t.destinationCity.toLowerCase() === city.toLowerCase() || passesThrough : true;
        const matchesType = type ? t.type === type : true;
        const matchesCapMin = capacityMin ? t.capacityTons >= Number(capacityMin) : true;
        const matchesCapMax = capacityMax ? t.capacityTons <= Number(capacityMax) : true;
        const matchesPriceMin = priceMin ? t.pricePerTon >= Number(priceMin) : true;
        const matchesPriceMax = priceMax ? t.pricePerTon <= Number(priceMax) : true;
        const matchesAvailable = availableFrom ? new Date(t.availableFrom) <= new Date(availableFrom) : true;
        const matchesRating = ratingMin ? t.transporterRating >= Number(ratingMin) : true;
        return matchesQuery && matchesCity && matchesType && matchesCapMin && matchesCapMax && matchesPriceMin && matchesPriceMax && matchesAvailable && matchesRating;
      }),
    [query, city, type, capacityMin, capacityMax, priceMin, priceMax, availableFrom, ratingMin]
  );

  const hasFilters = Boolean(
    query ||
      city ||
      type ||
      capacityMin ||
      capacityMax ||
      priceMin ||
      priceMax ||
      availableFrom ||
      ratingMin ||
      loadOrigin ||
      loadDestination ||
      weightMin ||
      weightMax ||
      budgetMin ||
      budgetMax ||
      pickupFrom ||
      pickupTo
  );
  const results = mode === 'loads' ? filteredLoads : filteredTrucks;

  function resetFilters() {
    setQuery('');
    setCity('');
    setType('');
    setCapacityMin('');
    setCapacityMax('');
    setPriceMin('');
    setPriceMax('');
    setAvailableFrom('');
    setRatingMin('');
    setLoadOrigin('');
    setLoadDestination('');
    setWeightMin('');
    setWeightMax('');
    setBudgetMin('');
    setBudgetMax('');
    setPickupFrom('');
    setPickupTo('');
  }

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

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        city={city}
        onCityChange={setCity}
        type={type}
        onTypeChange={setType}
        capacityMin={capacityMin}
        onCapacityMinChange={setCapacityMin}
        capacityMax={capacityMax}
        onCapacityMaxChange={setCapacityMax}
        priceMin={priceMin}
        onPriceMinChange={setPriceMin}
        priceMax={priceMax}
        onPriceMaxChange={setPriceMax}
        availableFrom={availableFrom}
        onAvailableFromChange={setAvailableFrom}
        ratingMin={ratingMin}
        onRatingMinChange={setRatingMin}
        onReset={resetFilters}
        load={{
          origin: loadOrigin,
          onOriginChange: setLoadOrigin,
          destination: loadDestination,
          onDestinationChange: setLoadDestination,
          weightMin,
          onWeightMinChange: setWeightMin,
          weightMax,
          onWeightMaxChange: setWeightMax,
          budgetMin,
          onBudgetMinChange: setBudgetMin,
          budgetMax,
          onBudgetMaxChange: setBudgetMax,
          pickupFrom,
          onPickupFromChange: setPickupFrom,
          pickupTo,
          onPickupToChange: setPickupTo
        }}
      />

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
          <p className="max-w-xs text-sm text-navy-400">
            {mode === 'loads'
              ? 'No loads match your filters or route. Widen your filters, or post your truck as available so shippers can find you.'
              : 'No trucks match your filters. Try widening your capacity, price or availability range.'}
          </p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
              Widen filters
            </Button>
          )}
          {mode === 'loads' && (
            <Link href="/dashboard/transporter#fleet" className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), 'gap-1.5')}>
              Post your truck as available
            </Link>
          )}
        </div>
      ) : (
        <Stagger key={`${mode}-${JSON.stringify({ city, type })}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mode === 'loads'
            ? filteredLoads.map((l) => (
                <StaggerItem key={l.id}>
                  <LoadCard load={l} />
                </StaggerItem>
              ))
            : filteredTrucks.map((t) => (
                <StaggerItem key={t.id}>
                  <TruckCard truck={t} />
                </StaggerItem>
              ))}
        </Stagger>
      )}

      <IntermediateStops />
    </div>
  );
}