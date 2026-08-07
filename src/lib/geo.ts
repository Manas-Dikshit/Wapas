export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Real-world coordinates for every city used in the Wapas mock data.
 * Used to plot an actual OpenStreetMap-based map instead of an SVG mockup.
 */
export const cityCoordinates: Record<string, LatLng> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Nashik: { lat: 19.9975, lng: 73.7898 }
};

/** Looks up a city by (case-insensitive, partial) name, e.g. "Mumbai" or "Mumbai, Maharashtra". */
export function getCityCoords(cityName: string): LatLng {
  const clean = cityName.trim().toLowerCase();
  const match = Object.keys(cityCoordinates).find(
    (c) => clean.includes(c.toLowerCase()) || c.toLowerCase().includes(clean)
  );
  return match ? cityCoordinates[match] : cityCoordinates.Mumbai;
}

/**
 * Builds a gently curved path between two points using a quadratic Bézier
 * curve, so the route reads as a road/flight path rather than a perfectly
 * straight ruler line. No routing API is used — this is a geometric curve
 * between two real coordinates, which is enough for a live "en route"
 * visualization. (Swap in a free routing engine like OSRM later if you want
 * the line to snap to actual roads.)
 */
export function buildCurvedRoute(from: LatLng, to: LatLng, segments = 72): LatLng[] {
  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;

  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const offset = dist * 0.14;

  // Perpendicular unit vector, used to bow the curve outward.
  const nx = -dy / dist;
  const ny = dx / dist;

  const controlLat = midLat + ny * offset;
  const controlLng = midLng + nx * offset;

  const points: LatLng[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = (1 - t) ** 2 * from.lat + 2 * (1 - t) * t * controlLat + t ** 2 * to.lat;
    const lng = (1 - t) ** 2 * from.lng + 2 * (1 - t) * t * controlLng + t ** 2 * to.lng;
    points.push({ lat, lng });
  }
  return points;
}