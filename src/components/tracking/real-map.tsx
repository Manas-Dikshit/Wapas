'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildCurvedRoute, getCityCoords, type LatLng } from '@/lib/geo';

/**
 * Real, interactive OpenStreetMap-based tracking map — no API key required.
 *
 * Tiles come from CARTO's free "Positron" basemap (OSM data, no auth/key
 * needed for normal usage), which gives a clean, premium light map that
 * matches the Wapas palette much better than the default OSM colors while
 * still being a genuine, pannable/zoomable OSM-based map — not an SVG mockup.
 *
 * This must only ever render on the client (Leaflet touches `window`/
 * `document` on import), so it's loaded via `next/dynamic(..., { ssr: false })`
 * from src/app/(app)/tracking/[id]/page.tsx — never import this file directly
 * in a server component.
 */

function createDotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(38,45,83,0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function createTruckIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(105,200,212,0.35);animation:wapasPulseRing 1.8s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
        <div style="position:relative;width:30px;height:30px;border-radius:9999px;background:#ffffff;box-shadow:0 6px 16px rgba(38,45,83,0.35);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7FCE" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
            <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
          </svg>
        </div>
      </div>
      <style>
        @keyframes wapasPulseRing { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.1); opacity: 0; } }
      </style>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

/** Fits the map viewport to the full route whenever the route changes. */
function FitRouteBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [46, 46] });
  }, [map, points]);
  return null;
}

export function LiveTrackingMap({
  originCity,
  destinationCity,
  progressPct
}: {
  originCity: string;
  destinationCity: string;
  progressPct: number;
}) {
  const origin = useMemo(() => getCityCoords(originCity), [originCity]);
  const destination = useMemo(() => getCityCoords(destinationCity), [destinationCity]);
  const route = useMemo(() => buildCurvedRoute(origin, destination), [origin, destination]);

  // Animate the truck marker from 0 -> progressPct on mount/update, so the
  // trip visibly "drives" onto the map instead of popping in.
  const [animatedPct, setAnimatedPct] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1500;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedPct(progressPct * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [progressPct]);

  const travelledCount = Math.max(1, Math.round((animatedPct / 100) * (route.length - 1)) + 1);
  const travelledRoute = route.slice(0, travelledCount);
  const truckPosition = route[travelledCount - 1] ?? route[0];

  const truckIcon = useMemo(() => createTruckIcon(), []);
  const originIcon = useMemo(() => createDotIcon('#69C8D4'), []);
  const destinationIcon = useMemo(() => createDotIcon('#4A7FCE'), []);

  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-xl3 shadow-soft sm:h-[300px]">
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={7}
        scrollWheelZoom
        zoomControl
        style={{ height: '100%', width: '100%', background: '#EEEFF6' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <FitRouteBounds points={route} />

        {/* Full planned route (faint, dashed) */}
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: '#AEB2D3', weight: 3, opacity: 0.65, dashArray: '1 8', lineCap: 'round' }}
        />

        {/* Distance already covered (solid brand blue) */}
        <Polyline
          positions={travelledRoute.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: '#4A7FCE', weight: 4, opacity: 0.95, lineCap: 'round' }}
        />

        <Marker position={[origin.lat, origin.lng]} icon={originIcon} />
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
        <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon} />
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-1.5 rounded-full bg-navy-600/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua-300" />
        Live location
      </div>
    </div>
  );
}