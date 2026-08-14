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
