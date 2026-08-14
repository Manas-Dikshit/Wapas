import type { Booking, Load, NotificationItem, Profile, Route, RouteStat, Transaction, Truck } from './types';

export function routeBetween(origin: string, destination: string): Route | undefined {
  return routes[`${origin}→${destination}`];
}

export const currentProfile: Profile = {
  id: 'usr_001',
  fullName: 'Arjun Mehta',
  companyName: 'Mehta Logistics Pvt Ltd',
  role: 'transporter',
  city: 'Pune, Maharashtra',
  rating: 4.7,
  verified: true,
  gstNumber: '27ABCDE1234F1Z5',
  kycStatus: 'verified',
  memberSince: 'Mar 2023'
};

export const cities = [
  'Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Ahmedabad',
  'Kolkata', 'Surat', 'Jaipur', 'Indore', 'Nagpur', 'Coimbatore', 'Lucknow'
];

export const trucks: Truck[] = [
  { id: 'trk_101', regNumber: 'MH12 GT 4521', type: 'Container', capacityTons: 18, transporterId: 'usr_001', transporterName: 'Mehta Logistics', transporterRating: 4.7, currentCity: 'Pune', destinationCity: 'Mumbai', availableFrom: '2026-08-06', pricePerTon: 1450, emptyLeg: true, photoSeed: 'container-1', status: 'available', matchScore: 94 },
  { id: 'trk_102', regNumber: 'GJ01 AX 8890', type: 'Open Body', capacityTons: 12, transporterId: 'usr_004', transporterName: 'Patel Roadways', transporterRating: 4.4, currentCity: 'Ahmedabad', destinationCity: 'Surat', availableFrom: '2026-08-05', pricePerTon: 980, emptyLeg: true, photoSeed: 'open-1', status: 'available', matchScore: 88 },
  { id: 'trk_103', regNumber: 'KA05 MZ 2201', type: 'Refrigerated', capacityTons: 9, transporterId: 'usr_005', transporterName: 'ColdChain Movers', transporterRating: 4.9, currentCity: 'Bengaluru', destinationCity: 'Chennai', availableFrom: '2026-08-07', pricePerTon: 2100, emptyLeg: false, photoSeed: 'reefer-1', status: 'available', matchScore: 91 },
  { id: 'trk_104', regNumber: 'DL8C AY 5567', type: 'Trailer', capacityTons: 28, transporterId: 'usr_006', transporterName: 'North Star Carriers', transporterRating: 4.3, currentCity: 'Delhi', destinationCity: 'Jaipur', availableFrom: '2026-08-06', pricePerTon: 1120, emptyLeg: true, photoSeed: 'trailer-1', status: 'available', matchScore: 85 },
  { id: 'trk_105', regNumber: 'TN09 BQ 7734', type: 'Container', capacityTons: 16, transporterId: 'usr_007', transporterName: 'Coimbatore Freight Co', transporterRating: 4.6, currentCity: 'Coimbatore', destinationCity: 'Chennai', availableFrom: '2026-08-08', pricePerTon: 1340, emptyLeg: true, photoSeed: 'container-2', status: 'available', matchScore: 90 },
  { id: 'trk_106', regNumber: 'MP09 CX 1190', type: 'Tanker', capacityTons: 20, transporterId: 'usr_008', transporterName: 'Indore Tankers Ltd', transporterRating: 4.2, currentCity: 'Indore', destinationCity: 'Nagpur', availableFrom: '2026-08-09', pricePerTon: 1560, emptyLeg: false, photoSeed: 'tanker-1', status: 'available', matchScore: 82 },
  { id: 'trk_107', regNumber: 'MH14 FZ 3302', type: 'Mini Truck', capacityTons: 3, transporterId: 'usr_001', transporterName: 'Mehta Logistics', transporterRating: 4.7, currentCity: 'Pune', destinationCity: 'Nashik', availableFrom: '2026-08-05', pricePerTon: 1680, emptyLeg: true, photoSeed: 'mini-1', status: 'available', matchScore: 79 },
  { id: 'trk_108', regNumber: 'WB06 DL 9981', type: 'Container', capacityTons: 22, transporterId: 'usr_009', transporterName: 'Kolkata Cargo Hub', transporterRating: 4.5, currentCity: 'Kolkata', destinationCity: 'Lucknow', availableFrom: '2026-08-10', pricePerTon: 1290, emptyLeg: true, photoSeed: 'container-3', status: 'available', matchScore: 87 },
  { id: 'trk_109', regNumber: 'OD02 BBS 7710', type: 'Open Body', capacityTons: 20, transporterId: 'usr_020', transporterName: 'Odisha Cargo Lines', transporterRating: 4.6, currentCity: 'Bhubaneswar', destinationCity: 'Delhi', availableFrom: '2026-08-11', pricePerTon: 1320, emptyLeg: true, photoSeed: 'open-2', status: 'available', matchScore: 92 }
];

export const loads: Load[] = [
  { id: 'ld_201', title: 'Textile Rolls — 400 Bales', category: 'Textiles', weightTons: 14, originCity: 'Mumbai', destinationCity: 'Pune', pickupDate: '2026-08-06', shipperId: 'usr_010', shipperName: 'Shreeji Textiles', budget: 21500, truckTypeNeeded: 'Container', status: 'open', distanceKm: 148, trending: true, aiRecommended: true },
  { id: 'ld_202', title: 'FMCG Cartons — Retail Distribution', category: 'FMCG', weightTons: 10, originCity: 'Surat', destinationCity: 'Ahmedabad', pickupDate: '2026-08-05', shipperId: 'usr_011', shipperName: 'DailyNeeds Distributors', budget: 9800, truckTypeNeeded: 'Open Body', status: 'open', distanceKm: 265, trending: false, aiRecommended: true },
  { id: 'ld_203', title: 'Frozen Seafood Consignment', category: 'Perishables', weightTons: 8, originCity: 'Chennai', destinationCity: 'Bengaluru', pickupDate: '2026-08-07', shipperId: 'usr_012', shipperName: 'BlueWave Exports', budget: 17200, truckTypeNeeded: 'Refrigerated', status: 'open', distanceKm: 346, trending: true },
  { id: 'ld_204', title: 'Auto Components — OEM Supply', category: 'Automotive', weightTons: 26, originCity: 'Jaipur', destinationCity: 'Delhi', pickupDate: '2026-08-06', shipperId: 'usr_013', shipperName: 'Rajputana Auto Parts', budget: 29400, truckTypeNeeded: 'Trailer', status: 'open', distanceKm: 281, aiRecommended: true },
  { id: 'ld_205', title: 'Packaged Cement — 500 Bags', category: 'Construction', weightTons: 15, originCity: 'Chennai', destinationCity: 'Coimbatore', pickupDate: '2026-08-08', shipperId: 'usr_014', shipperName: 'BuildRight Materials', budget: 19900, truckTypeNeeded: 'Container', status: 'open', distanceKm: 512, trending: true },
  { id: 'ld_206', title: 'Edible Oil Tanker Load', category: 'Agri-commodities', weightTons: 18, originCity: 'Nagpur', destinationCity: 'Indore', pickupDate: '2026-08-09', shipperId: 'usr_015', shipperName: 'Vidarbha Agro Traders', budget: 27600, truckTypeNeeded: 'Tanker', status: 'open', distanceKm: 494 },
  { id: 'ld_207', title: 'Pharma Cartons — Cold Storage', category: 'Pharma', weightTons: 6, originCity: 'Lucknow', destinationCity: 'Kolkata', pickupDate: '2026-08-10', shipperId: 'usr_016', shipperName: 'MedLine Pharma', budget: 22800, truckTypeNeeded: 'Refrigerated', status: 'open', distanceKm: 987, aiRecommended: true },
  { id: 'ld_208', title: 'Local Grocery Restock', category: 'FMCG', weightTons: 2.5, originCity: 'Pune', destinationCity: 'Nashik', pickupDate: '2026-08-05', shipperId: 'usr_017', shipperName: 'FreshMart Retail', budget: 6200, truckTypeNeeded: 'Mini Truck', status: 'open', distanceKm: 210 }
];

export const bookings: Booking[] = [
  { id: 'bk_301', loadId: 'ld_201', truckId: 'trk_101', loadTitle: 'Textile Rolls — 400 Bales', route: 'Mumbai → Pune', shipperName: 'Shreeji Textiles', transporterName: 'Mehta Logistics', amount: 21500, status: 'in-transit', progressPct: 62, eta: 'Today, 6:40 PM', createdAt: '2026-08-03', driverName: 'Suresh Yadav', driverPhone: '+91 98200 11234', vehicleNumber: 'MH12 GT 4521' },
  { id: 'bk_302', loadId: 'ld_204', truckId: 'trk_104', loadTitle: 'Auto Components — OEM Supply', route: 'Jaipur → Delhi', shipperName: 'Rajputana Auto Parts', transporterName: 'North Star Carriers', amount: 29400, status: 'confirmed', progressPct: 8, eta: 'Tomorrow, 2:00 PM', createdAt: '2026-08-04', driverName: 'Vikram Singh', driverPhone: '+91 99110 22456', vehicleNumber: 'DL8C AY 5567' },
  { id: 'bk_303', loadId: 'ld_205', truckId: 'trk_105', loadTitle: 'Packaged Cement — 500 Bags', route: 'Chennai → Coimbatore', shipperName: 'BuildRight Materials', transporterName: 'Coimbatore Freight Co', amount: 19900, status: 'delivered', progressPct: 100, eta: 'Delivered Aug 2', createdAt: '2026-07-31', driverName: 'Ramesh Kumar', driverPhone: '+91 90031 55678', vehicleNumber: 'TN09 BQ 7734' },
  { id: 'bk_304', loadId: 'ld_202', truckId: 'trk_102', loadTitle: 'FMCG Cartons — Retail Distribution', route: 'Surat → Ahmedabad', shipperName: 'DailyNeeds Distributors', transporterName: 'Patel Roadways', amount: 9800, status: 'delivered', progressPct: 100, eta: 'Delivered Jul 29', createdAt: '2026-07-27', driverName: 'Bharat Patel', driverPhone: '+91 97250 88123', vehicleNumber: 'GJ01 AX 8890' }
];

export const transactions: Transaction[] = [
  { id: 'txn_401', type: 'credit', label: 'Payout — Booking #bk_303', amount: 19402, date: 'Aug 2, 2026', method: 'Escrow', status: 'success' },
  { id: 'txn_402', type: 'debit', label: 'Platform fee — Booking #bk_301', amount: 645, date: 'Aug 3, 2026', method: 'Wallet', status: 'success' },
  { id: 'txn_403', type: 'credit', label: 'Payout — Booking #bk_304', amount: 9604, date: 'Jul 29, 2026', method: 'UPI', status: 'success' },
  { id: 'txn_404', type: 'debit', label: 'Fuel advance — Trip #bk_301', amount: 3200, date: 'Aug 3, 2026', method: 'Card', status: 'success' },
  { id: 'txn_405', type: 'credit', label: 'Referral bonus', amount: 500, date: 'Jul 26, 2026', method: 'Wallet', status: 'pending' }
];

export const notifications: NotificationItem[] = [
  { id: 'ntf_501', title: 'Booking confirmed', description: 'Rajputana Auto Parts confirmed your bid for Jaipur → Delhi.', time: '12 min ago', read: false, type: 'booking' },
  { id: 'ntf_502', title: 'AI found a high-match backhaul', description: '94% match: Mumbai → Pune, Textile Rolls, ₹21,500.', time: '1 hr ago', read: false, type: 'ai' },
  { id: 'ntf_503', title: 'Payment received', description: '₹19,402 credited to your wallet for Booking #bk_303.', time: '2 days ago', read: true, type: 'payment' },
  { id: 'ntf_504', title: 'Document expiring soon', description: 'Your fitness certificate for MH12 GT 4521 expires in 14 days.', time: '3 days ago', read: true, type: 'system' }
];

export const routeStats: RouteStat[] = [
  { route: 'Mumbai → Pune', trips: 142, savingsPct: 28 },
  { route: 'Delhi → Jaipur', trips: 98, savingsPct: 22 },
  { route: 'Chennai → Bengaluru', trips: 76, savingsPct: 31 },
  { route: 'Surat → Ahmedabad', trips: 64, savingsPct: 19 }
];

export const revenueSeries = [
  { month: 'Feb', revenue: 182000, trips: 61 },
  { month: 'Mar', revenue: 214000, trips: 68 },
  { month: 'Apr', revenue: 198000, trips: 64 },
  { month: 'May', revenue: 241000, trips: 79 },
  { month: 'Jun', revenue: 267000, trips: 88 },
  { month: 'Jul', revenue: 302000, trips: 97 }
];

export const utilizationSeries = [
  { name: 'In transit', value: 42 },
  { name: 'Loaded idle', value: 18 },
  { name: 'Empty leg', value: 24 },
  { name: 'Maintenance', value: 16 }
];

export const dashboardStats = {
  transporter: [
    { label: 'Active trips', value: '6', delta: '+2 this week', trend: 'up' as const },
    { label: 'Fleet utilization', value: '82%', delta: '+5.4%', trend: 'up' as const },
    { label: 'Revenue (MTD)', value: '₹3.02L', delta: '+13.1%', trend: 'up' as const },
    { label: 'Fuel savings', value: '₹41,200', delta: 'via backhaul match', trend: 'up' as const }
  ],
  shipper: [
    { label: 'Open loads', value: '4', delta: '2 matched today', trend: 'up' as const },
    { label: 'On-time delivery', value: '96%', delta: '+1.2%', trend: 'up' as const },
    { label: 'Spend (MTD)', value: '₹1.86L', delta: '-8.4% vs budget', trend: 'down' as const },
    { label: 'Saved transporters', value: '12', delta: '+3 this month', trend: 'up' as const }
  ]
};

export const adminStats = [
  { label: 'Total users', value: '18,420', delta: '+412 this week' },
  { label: 'Active fleet', value: '6,904', delta: '+128 this week' },
  { label: 'GMV (MTD)', value: '₹4.7Cr', delta: '+16.2%' },
  { label: 'Disputes open', value: '7', delta: '-3 vs last week' }
];

// ---------------------------------------------------------------------------
// routes — curated highway corridors with ordered intermediate stops.
// Keyed by "Origin→Destination" and consumed via routeBetween(). The stops
// are the "middle path" a truck travels, enabling mid-route pickup / return
// (backhaul) orders at any city along the way.
// ---------------------------------------------------------------------------
export const routes: Record<string, Route> = {
  'Bhubaneswar→Delhi': {
    originCity: 'Bhubaneswar',
    destinationCity: 'Delhi',
    distanceKm: 1730,
    highway: 'NH-16 → NH-49 → NH-53 → NH-44',
    stops: [
      { city: 'Bhubaneswar', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 27, isHighwayJunction: true },
      { city: 'Sambalpur', state: 'Odisha', kmFromOrigin: 310 },
      { city: 'Bargarh', state: 'Odisha', kmFromOrigin: 375 },
      { city: 'Raipur', state: 'Chhattisgarh', kmFromOrigin: 500, isHighwayJunction: true },
      { city: 'Bilaspur', state: 'Chhattisgarh', kmFromOrigin: 660 },
      { city: 'Katni', state: 'Madhya Pradesh', kmFromOrigin: 1020 },
      { city: 'Jhansi', state: 'Uttar Pradesh', kmFromOrigin: 1380, isHighwayJunction: true },
      { city: 'Agra', state: 'Uttar Pradesh', kmFromOrigin: 1560, isHighwayJunction: true },
      { city: 'Delhi', state: 'Delhi', kmFromOrigin: 1730, isHighwayJunction: true }
    ]
  },
  'Mumbai→Delhi': {
    originCity: 'Mumbai',
    destinationCity: 'Delhi',
    distanceKm: 1430,
    highway: 'NH-48',
    stops: [
      { city: 'Mumbai', state: 'Maharashtra', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Nashik', state: 'Maharashtra', kmFromOrigin: 170, isHighwayJunction: true },
      { city: 'Dhule', state: 'Maharashtra', kmFromOrigin: 320 },
      { city: 'Indore', state: 'Madhya Pradesh', kmFromOrigin: 590, isHighwayJunction: true },
      { city: 'Gwalior', state: 'Madhya Pradesh', kmFromOrigin: 980 },
      { city: 'Agra', state: 'Uttar Pradesh', kmFromOrigin: 1190, isHighwayJunction: true },
      { city: 'Delhi', state: 'Delhi', kmFromOrigin: 1430, isHighwayJunction: true }
    ]
  },
  'Bengaluru→Delhi': {
    originCity: 'Bengaluru',
    destinationCity: 'Delhi',
    distanceKm: 2120,
    highway: 'NH-44',
    stops: [
      { city: 'Bengaluru', state: 'Karnataka', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Chitradurga', state: 'Karnataka', kmFromOrigin: 200 },
      { city: 'Hyderabad', state: 'Telangana', kmFromOrigin: 570, isHighwayJunction: true },
      { city: 'Nagpur', state: 'Maharashtra', kmFromOrigin: 1080, isHighwayJunction: true },
      { city: 'Jhansi', state: 'Uttar Pradesh', kmFromOrigin: 1700, isHighwayJunction: true },
      { city: 'Delhi', state: 'Delhi', kmFromOrigin: 2120, isHighwayJunction: true }
    ]
  },
  'Chennai→Bengaluru': {
    originCity: 'Chennai',
    destinationCity: 'Bengaluru',
    distanceKm: 346,
    highway: 'NH-48',
    stops: [
      { city: 'Chennai', state: 'Tamil Nadu', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Kanchipuram', state: 'Tamil Nadu', kmFromOrigin: 70 },
      { city: 'Vellore', state: 'Tamil Nadu', kmFromOrigin: 130, isHighwayJunction: true },
      { city: 'Krishnagiri', state: 'Tamil Nadu', kmFromOrigin: 250 },
      { city: 'Hosur', state: 'Tamil Nadu', kmFromOrigin: 290 },
      { city: 'Bengaluru', state: 'Karnataka', kmFromOrigin: 346, isHighwayJunction: true }
    ]
  },
  'Jaipur→Delhi': {
    originCity: 'Jaipur',
    destinationCity: 'Delhi',
    distanceKm: 281,
    highway: 'NH-48',
    stops: [
      { city: 'Jaipur', state: 'Rajasthan', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Shahpura', state: 'Rajasthan', kmFromOrigin: 60 },
      { city: 'Kotputli', state: 'Rajasthan', kmFromOrigin: 120 },
      { city: 'Manesar', state: 'Haryana', kmFromOrigin: 230 },
      { city: 'Delhi', state: 'Delhi', kmFromOrigin: 281, isHighwayJunction: true }
    ]
  },
  'Kolkata→Lucknow': {
    originCity: 'Kolkata',
    destinationCity: 'Lucknow',
    distanceKm: 985,
    highway: 'NH-19 → NH-27',
    stops: [
      { city: 'Kolkata', state: 'West Bengal', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Bardhaman', state: 'West Bengal', kmFromOrigin: 100 },
      { city: 'Durgapur', state: 'West Bengal', kmFromOrigin: 170 },
      { city: 'Asansol', state: 'West Bengal', kmFromOrigin: 220 },
      { city: 'Dhanbad', state: 'Jharkhand', kmFromOrigin: 290 },
      { city: 'Varanasi', state: 'Uttar Pradesh', kmFromOrigin: 680, isHighwayJunction: true },
      { city: 'Prayagraj', state: 'Uttar Pradesh', kmFromOrigin: 820, isHighwayJunction: true },
      { city: 'Lucknow', state: 'Uttar Pradesh', kmFromOrigin: 985, isHighwayJunction: true }
    ]
  },
  'Nagpur→Indore': {
    originCity: 'Nagpur',
    destinationCity: 'Indore',
    distanceKm: 494,
    highway: 'NH-47',
    stops: [
      { city: 'Nagpur', state: 'Maharashtra', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Hinganghat', state: 'Maharashtra', kmFromOrigin: 55 },
      { city: 'Wardha', state: 'Maharashtra', kmFromOrigin: 75 },
      { city: 'Betul', state: 'Madhya Pradesh', kmFromOrigin: 260 },
      { city: 'Harda', state: 'Madhya Pradesh', kmFromOrigin: 330 },
      { city: 'Khandwa', state: 'Madhya Pradesh', kmFromOrigin: 405, isHighwayJunction: true },
      { city: 'Indore', state: 'Madhya Pradesh', kmFromOrigin: 494, isHighwayJunction: true }
    ]
  }
};

// Attach routes to existing listings so the detail page and cards can render
// the corridor. Falls back gracefully (route stays undefined) if unmapped.
trucks.forEach((t) => (t.route = routeBetween(t.currentCity, t.destinationCity ?? '') ?? t.route));
loads.forEach((l) => (l.route = routeBetween(l.originCity, l.destinationCity) ?? l.route));
