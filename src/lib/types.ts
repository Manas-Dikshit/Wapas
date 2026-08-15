export type UserRole = 'shipper' | 'transporter' | 'admin';

export interface Profile {
  id: string;
  fullName: string;
  companyName: string;
  role: UserRole;
  avatarUrl?: string;
  city: string;
  rating: number;
  verified: boolean;
  gstNumber?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  memberSince: string;
}

export type TruckType = 'Open Body' | 'Container' | 'Trailer' | 'Refrigerated' | 'Tanker' | 'Mini Truck';

export interface RouteStop {
  city: string;
  state?: string;
  kmFromOrigin: number;
  isHighwayJunction?: boolean;
}

export interface Route {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  highway: string;
  stops: RouteStop[];
}

export interface EscrowMilestone {
  id: string;
  label: string;
  amount: number;
  status: 'pending' | 'released' | 'disputed';
  dueAt?: string;
}

export interface EscrowState {
  id: string;
  bookingId: string;
  totalAmount: number;
  releasedAmount: number;
  status: 'held' | 'partially_released' | 'released';
  milestones: EscrowMilestone[];
}

export interface Truck {
  id: string;
  regNumber: string;
  type: TruckType;
  capacityTons: number;
  transporterId: string;
  transporterName: string;
  transporterRating: number;
  currentCity: string;
  destinationCity: string;
  availableFrom: string;
  pricePerTon: number;
  emptyLeg: boolean;
  photoSeed: string;
  status: 'available' | 'booked' | 'in-transit' | 'maintenance';
  matchScore?: number;
  route?: Route;
}

export interface Load {
  id: string;
  title: string;
  category: string;
  weightTons: number;
  originCity: string;
  destinationCity: string;
  pickupDate: string;
  shipperId: string;
  shipperName: string;
  budget: number;
  truckTypeNeeded: TruckType;
  status: 'open' | 'matched' | 'booked' | 'delivered';
  distanceKm: number;
  trending?: boolean;
  aiRecommended?: boolean;
  route?: Route;
}

export interface Booking {
  id: string;
  loadId: string;
  truckId: string;
  loadTitle: string;
  route: string;
  shipperName: string;
  transporterName: string;
  amount: number;
  status: 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
  progressPct: number;
  eta: string;
  createdAt: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  escrow?: EscrowState;
  tracking?: ShipmentTracker;
}

export interface TrackingEvent {
  id: string;
  bookingId: string;
  timestamp: string;
  status: 'picked_up' | 'in_transit' | 'checkpoint' | 'out_for_delivery' | 'delivered';
  location: string;
  note?: string;
}

export interface ShipmentTracker {
  bookingId: string;
  currentLocation: string;
  progressPct: number;
  eta: string;
  updatedAt: string;
  events: TrackingEvent[];
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Card' | 'Wallet' | 'Escrow';
  status: 'success' | 'pending' | 'failed';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'booking' | 'payment' | 'system' | 'ai';
}

export interface RouteStat {
  route: string;
  trips: number;
  savingsPct: number;
}

// --- Landing / marketing content -----------------------------------------

export interface NavLink {
  href: string;
  label: string;
}

export interface HeroStat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface LandingHero {
  badge: string;
  titleA: string;
  titleHighlight: string;
  titleB: string;
  description: string;
  primaryCta: NavLink;
  secondaryCta: NavLink;
  stats: HeroStat[];
}

export interface ProblemCard {
  stat: string;
  label: string;
  desc: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

export interface PricingPlan {
  name: string;
  price: string;
  desc: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface CtaContent {
  heading: string;
  description: string;
  primaryCta: NavLink;
  secondaryCta: NavLink;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}
