import type { TruckType } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Small bundled SVG representation for each truck/container type. Purely local
 * (no external image/API calls), consistent with the no-API-key approach used
 * for maps. Single lookup component reused across the marketplace card, the
 * marketplace detail page and the booking review.
 */
export function TruckTypeIcon({
  type,
  className,
  title
}: {
  type: TruckType | string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 32"
      aria-hidden="true"
      role="img"
      className={cn('h-8 w-12 text-blue-500', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title ?? type}</title>
      <TruckShape type={type} />
    </svg>
  );
}

function TruckShape({ type }: { type: TruckType | string }) {
  switch (type) {
    case 'Container':
      return (
        <g>
          <rect x="2" y="8" width="22" height="14" rx="1.5" fill="currentColor" opacity="0.15" />
          <rect x="2" y="8" width="22" height="14" rx="1.5" />
          <line x1="7" y1="8" x2="7" y2="22" />
          <line x1="13" y1="8" x2="13" y2="22" />
          <line x1="19" y1="8" x2="19" y2="22" />
          <path d="M24 14h14v8h-14z" />
          <circle cx="29" cy="26" r="3" />
          <circle cx="39" cy="26" r="3" />
          <path d="M38 14v6h2" />
        </g>
      );
    case 'Trailer':
      return (
        <g>
          <rect x="2" y="10" width="26" height="12" rx="1.5" fill="currentColor" opacity="0.15" />
          <rect x="2" y="10" width="26" height="12" rx="1.5" />
          <path d="M28 16h6v6h-6z" />
          <path d="M6 22v2M20 22v2" />
          <circle cx="13" cy="26" r="2.6" />
          <circle cx="22" cy="26" r="2.6" />
          <circle cx="40" cy="26" r="2.6" />
        </g>
      );
    case 'Refrigerated':
      return (
        <g>
          <rect x="2" y="8" width="20" height="15" rx="1.5" fill="currentColor" opacity="0.15" />
          <rect x="2" y="8" width="20" height="15" rx="1.5" />
          <path d="M9 11v9M14 11v9" />
          <rect x="10.5" y="11.5" width="2" height="9" opacity="0.9" />
          <rect x="22" y="10" width="12" height="11" rx="1.5" />
          <path d="M34 15l-4 4M38 11l-2 2" strokeWidth="1.4" />
          <circle cx="28" cy="26" r="2.6" />
          <circle cx="38" cy="26" r="2.6" />
        </g>
      );
    case 'Tanker':
      return (
        <g>
          <ellipse cx="20" cy="17" rx="18" ry="10" fill="currentColor" opacity="0.15" />
          <ellipse cx="20" cy="17" rx="18" ry="10" />
          <line x1="2" y1="17" x2="38" y2="17" />
          <path d="M20 5l2 4h-4z" />
          <circle cx="11" cy="26" r="2.6" />
          <circle cx="29" cy="26" r="2.6" />
        </g>
      );
    case 'Mini Truck':
      return (
        <g>
          <path d="M3 21V11h22v10" />
          <path d="M25 16h7l6 5v0h-13z" />
          <path d="M13 11V7h-4" />
          <circle cx="11" cy="24" r="2.6" />
          <circle cx="32" cy="24" r="2.6" />
        </g>
      );
    case 'Open Body':
    default:
      return (
        <g>
          <path d="M3 20V9h26v11" />
          <line x1="3" y1="12" x2="29" y2="12" />
          <line x1="7" y1="9" x2="7" y2="12" />
          <path d="M29 15h6l6 5h-12z" />
          <circle cx="11" cy="24" r="2.6" />
          <circle cx="33" cy="24" r="2.6" />
        </g>
      );
  }
}