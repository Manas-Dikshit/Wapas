import type { TruckType } from './types';

/**
 * Bundled, local metadata for every truck/container type. Kept in one place so
 * the marketplace card, marketplace detail page, booking review and post-load
 * form all render the same label, icon key and benchmark price without
 * per-page duplication.
 *
 * `typicalPricePerTon` is a conservative IN-market benchmark (INR/ton) used
 * only for a soft budget sanity-check on post-load — it is NOT a per-truck
 * rate and is never shown as a binding quote.
 */
export const TRUCK_TYPES: TruckType[] = ['Open Body', 'Container', 'Trailer', 'Refrigerated', 'Tanker', 'Mini Truck'];

export const truckTypeMeta: Record<TruckType, { label: string; iconKey: TruckType; typicalPricePerTon: number }> = {
  'Open Body': { label: 'Open Body', iconKey: 'Open Body', typicalPricePerTon: 1050 },
  'Container': { label: 'Container', iconKey: 'Container', typicalPricePerTon: 1350 },
  'Trailer': { label: 'Trailer', iconKey: 'Trailer', typicalPricePerTon: 1150 },
  'Refrigerated': { label: 'Refrigerated', iconKey: 'Refrigerated', typicalPricePerTon: 2050 },
  'Tanker': { label: 'Tanker', iconKey: 'Tanker', typicalPricePerTon: 1500 },
  'Mini Truck': { label: 'Mini Truck', iconKey: 'Mini Truck', typicalPricePerTon: 1650 }
};

export function isTruckType(v: string): v is TruckType {
  return (TRUCK_TYPES as string[]).includes(v);
}