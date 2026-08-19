import type { Booking, EscrowState, Load, NotificationItem, Profile, Route, RouteStat, ShipmentTracker, TrackingEvent, Transaction, Truck } from './types';

function normalizeCityName(city: string): string {
  return city.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function routeContainsCity(route: Route | undefined, city: string): boolean {
  if (!route) return false;
  return route.stops.some((stop) => normalizeCityName(stop.city) === normalizeCityName(city));
}

export function routeBetween(origin: string, destination: string): Route | undefined {
  const directKey = `${origin.trim()}→${destination.trim()}`;
  const reverseKey = `${destination.trim()}→${origin.trim()}`;

  const directRoute = routes[directKey];
  if (directRoute) return directRoute;

  const reverseRoute = routes[reverseKey];
  if (!reverseRoute) return undefined;

  return {
    ...reverseRoute,
    originCity: reverseRoute.destinationCity,
    destinationCity: reverseRoute.originCity,
    stops: [...reverseRoute.stops].reverse().map((stop) => ({ ...stop }))
  };
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
  'Bhubaneswar', 'Cuttack', 'Rourkela', 'Paradeep', 'Sambalpur', 'Jharsuguda', 'Angul', 'Balasore', 'Berhampur', 'Jajpur',
  'Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Ahmedabad',
  'Kolkata', 'Surat', 'Jaipur', 'Indore', 'Nagpur', 'Coimbatore', 'Lucknow', 'Raipur', 'Visakhapatnam'
];

export const trucks: Truck[] = [
  { id: 'trk_110', regNumber: 'OD05 K 3392', type: 'Trailer', capacityTons: 28, transporterId: 'usr_021', transporterName: 'Kalinga Heavy Haulage', transporterRating: 4.8, currentCity: 'Rourkela', destinationCity: 'Paradeep', availableFrom: '2026-08-06', pricePerTon: 1150, emptyLeg: true, photoSeed: 'trailer-2', status: 'available', matchScore: 96 },
  { id: 'trk_112', regNumber: 'OD01 M 4420', type: 'Refrigerated', capacityTons: 10, transporterId: 'usr_023', transporterName: 'Chilika ColdChain Logistics', transporterRating: 4.9, currentCity: 'Paradeep', destinationCity: 'Kolkata', availableFrom: '2026-08-06', pricePerTon: 1980, emptyLeg: true, photoSeed: 'reefer-2', status: 'available', matchScore: 95 },
  { id: 'trk_109', regNumber: 'OD02 BBS 7710', type: 'Open Body', capacityTons: 20, transporterId: 'usr_020', transporterName: 'Odisha Cargo Lines', transporterRating: 4.6, currentCity: 'Bhubaneswar', destinationCity: 'Delhi', availableFrom: '2026-08-11', pricePerTon: 1320, emptyLeg: true, photoSeed: 'open-2', status: 'available', matchScore: 92 },
  { id: 'trk_111', regNumber: 'OD14 H 5541', type: 'Container', capacityTons: 18, transporterId: 'usr_022', transporterName: 'Mahanadi Roadways', transporterRating: 4.7, currentCity: 'Jharsuguda', destinationCity: 'Raipur', availableFrom: '2026-08-07', pricePerTon: 1240, emptyLeg: true, photoSeed: 'container-4', status: 'available', matchScore: 93 },
  { id: 'trk_113', regNumber: 'OD09 T 8812', type: 'Open Body', capacityTons: 16, transporterId: 'usr_024', transporterName: 'Utkal Express Carriers', transporterRating: 4.5, currentCity: 'Angul', destinationCity: 'Bhubaneswar', availableFrom: '2026-08-08', pricePerTon: 920, emptyLeg: true, photoSeed: 'open-3', status: 'available', matchScore: 89 },
  { id: 'trk_114', regNumber: 'OD04 F 6199', type: 'Container', capacityTons: 14, transporterId: 'usr_025', transporterName: 'Konark Freight Lines', transporterRating: 4.6, currentCity: 'Bhubaneswar', destinationCity: 'Visakhapatnam', availableFrom: '2026-08-07', pricePerTon: 1280, emptyLeg: true, photoSeed: 'container-5', status: 'available', matchScore: 91 },
  { id: 'trk_101', regNumber: 'MH12 GT 4521', type: 'Container', capacityTons: 18, transporterId: 'usr_001', transporterName: 'Mehta Logistics', transporterRating: 4.7, currentCity: 'Pune', destinationCity: 'Mumbai', availableFrom: '2026-08-06', pricePerTon: 1450, emptyLeg: true, photoSeed: 'container-1', status: 'available', matchScore: 94 },
  { id: 'trk_102', regNumber: 'GJ01 AX 8890', type: 'Open Body', capacityTons: 12, transporterId: 'usr_004', transporterName: 'Patel Roadways', transporterRating: 4.4, currentCity: 'Ahmedabad', destinationCity: 'Surat', availableFrom: '2026-08-05', pricePerTon: 980, emptyLeg: true, photoSeed: 'open-1', status: 'available', matchScore: 88 },
  { id: 'trk_103', regNumber: 'KA05 MZ 2201', type: 'Refrigerated', capacityTons: 9, transporterId: 'usr_005', transporterName: 'ColdChain Movers', transporterRating: 4.9, currentCity: 'Bengaluru', destinationCity: 'Chennai', availableFrom: '2026-08-07', pricePerTon: 2100, emptyLeg: false, photoSeed: 'reefer-1', status: 'available', matchScore: 91 },
  { id: 'trk_104', regNumber: 'DL8C AY 5567', type: 'Trailer', capacityTons: 28, transporterId: 'usr_006', transporterName: 'North Star Carriers', transporterRating: 4.3, currentCity: 'Delhi', destinationCity: 'Jaipur', availableFrom: '2026-08-06', pricePerTon: 1120, emptyLeg: true, photoSeed: 'trailer-1', status: 'available', matchScore: 85 },
  { id: 'trk_105', regNumber: 'TN09 BQ 7734', type: 'Container', capacityTons: 16, transporterId: 'usr_007', transporterName: 'Coimbatore Freight Co', transporterRating: 4.6, currentCity: 'Coimbatore', destinationCity: 'Chennai', availableFrom: '2026-08-08', pricePerTon: 1340, emptyLeg: true, photoSeed: 'container-2', status: 'available', matchScore: 90 },
  { id: 'trk_106', regNumber: 'MP09 CX 1190', type: 'Tanker', capacityTons: 20, transporterId: 'usr_008', transporterName: 'Indore Tankers Ltd', transporterRating: 4.2, currentCity: 'Indore', destinationCity: 'Nagpur', availableFrom: '2026-08-09', pricePerTon: 1560, emptyLeg: false, photoSeed: 'tanker-1', status: 'available', matchScore: 82 },
  { id: 'trk_107', regNumber: 'MH14 FZ 3302', type: 'Mini Truck', capacityTons: 3, transporterId: 'usr_001', transporterName: 'Mehta Logistics', transporterRating: 4.7, currentCity: 'Pune', destinationCity: 'Nashik', availableFrom: '2026-08-05', pricePerTon: 1680, emptyLeg: true, photoSeed: 'mini-1', status: 'available', matchScore: 79 },
  { id: 'trk_108', regNumber: 'WB06 DL 9981', type: 'Container', capacityTons: 22, transporterId: 'usr_009', transporterName: 'Kolkata Cargo Hub', transporterRating: 4.5, currentCity: 'Kolkata', destinationCity: 'Lucknow', availableFrom: '2026-08-10', pricePerTon: 1290, emptyLeg: true, photoSeed: 'container-3', status: 'available', matchScore: 87 }
];

export const loads: Load[] = [
  { id: 'ld_209', title: 'TMT Steel Bars & Heavy Billets', category: 'Construction', weightTons: 26, originCity: 'Rourkela', destinationCity: 'Paradeep', pickupDate: '2026-08-06', shipperId: 'usr_026', shipperName: 'Kalinga Steel & Alloys Ltd', budget: 29900, truckTypeNeeded: 'Trailer', status: 'open', distanceKm: 415, trending: true, aiRecommended: true },
  { id: 'ld_210', title: 'Export-Grade Frozen Tiger Prawns', category: 'Perishables', weightTons: 9, originCity: 'Paradeep', destinationCity: 'Kolkata', pickupDate: '2026-08-06', shipperId: 'usr_027', shipperName: 'Utkal Marine & Seafoods Ltd', budget: 18500, truckTypeNeeded: 'Refrigerated', status: 'open', distanceKm: 440, trending: true, aiRecommended: true },
  { id: 'ld_211', title: 'Aluminium Ingots & Extrusions', category: 'Automotive', weightTons: 18, originCity: 'Jharsuguda', destinationCity: 'Raipur', pickupDate: '2026-08-07', shipperId: 'usr_028', shipperName: 'Mahanadi Metals & Power', budget: 22400, truckTypeNeeded: 'Container', status: 'open', distanceKm: 310, aiRecommended: true },
  { id: 'ld_212', title: 'Sambalpuri Handlooms & Cotton Bales', category: 'Textiles', weightTons: 6, originCity: 'Sambalpur', destinationCity: 'Bhubaneswar', pickupDate: '2026-08-08', shipperId: 'usr_029', shipperName: 'Odisha Handloom Guild', budget: 9200, truckTypeNeeded: 'Open Body', status: 'open', distanceKm: 310, trending: false },
  { id: 'ld_213', title: 'Industrial Heavy Flanges & Castings', category: 'Automotive', weightTons: 15, originCity: 'Angul', destinationCity: 'Bhubaneswar', pickupDate: '2026-08-08', shipperId: 'usr_030', shipperName: 'Angul Industrial Fabricators', budget: 14200, truckTypeNeeded: 'Open Body', status: 'open', distanceKm: 130, aiRecommended: true },
  { id: 'ld_214', title: 'Packaged Spices & FMCG Cartons', category: 'FMCG', weightTons: 12, originCity: 'Cuttack', destinationCity: 'Balasore', pickupDate: '2026-08-09', shipperId: 'usr_031', shipperName: 'Eastern Spices & Foods', budget: 13600, truckTypeNeeded: 'Container', status: 'open', distanceKm: 180 },
  { id: 'ld_201', title: 'Textile Rolls — 400 Bales', category: 'Textiles', weightTons: 14, originCity: 'Mumbai', destinationCity: 'Pune', pickupDate: '2026-08-06', shipperId: 'usr_010', shipperName: 'Shreeji Textiles', budget: 21500, truckTypeNeeded: 'Container', status: 'open', distanceKm: 148, trending: true, aiRecommended: true },
  { id: 'ld_202', title: 'FMCG Cartons — Retail Distribution', category: 'FMCG', weightTons: 10, originCity: 'Surat', destinationCity: 'Ahmedabad', pickupDate: '2026-08-05', shipperId: 'usr_011', shipperName: 'DailyNeeds Distributors', budget: 9800, truckTypeNeeded: 'Open Body', status: 'open', distanceKm: 265, trending: false, aiRecommended: true },
  { id: 'ld_203', title: 'Frozen Seafood Consignment', category: 'Perishables', weightTons: 8, originCity: 'Chennai', destinationCity: 'Bengaluru', pickupDate: '2026-08-07', shipperId: 'usr_012', shipperName: 'BlueWave Exports', budget: 17200, truckTypeNeeded: 'Refrigerated', status: 'open', distanceKm: 346, trending: true },
  { id: 'ld_204', title: 'Auto Components — OEM Supply', category: 'Automotive', weightTons: 26, originCity: 'Jaipur', destinationCity: 'Delhi', pickupDate: '2026-08-06', shipperId: 'usr_013', shipperName: 'Rajputana Auto Parts', budget: 29400, truckTypeNeeded: 'Trailer', status: 'open', distanceKm: 281, aiRecommended: true },
  { id: 'ld_205', title: 'Packaged Cement — 500 Bags', category: 'Construction', weightTons: 15, originCity: 'Chennai', destinationCity: 'Coimbatore', pickupDate: '2026-08-08', shipperId: 'usr_014', shipperName: 'BuildRight Materials', budget: 19900, truckTypeNeeded: 'Container', status: 'open', distanceKm: 512, trending: true },
  { id: 'ld_206', title: 'Edible Oil Tanker Load', category: 'Agri-commodities', weightTons: 18, originCity: 'Nagpur', destinationCity: 'Indore', pickupDate: '2026-08-09', shipperId: 'usr_015', shipperName: 'Vidarbha Agro Traders', budget: 27600, truckTypeNeeded: 'Tanker', status: 'open', distanceKm: 494 },
  { id: 'ld_207', title: 'Pharma Cartons — Cold Storage', category: 'Pharma', weightTons: 6, originCity: 'Lucknow', destinationCity: 'Kolkata', pickupDate: '2026-08-10', shipperId: 'usr_016', shipperName: 'MedLine Pharma', budget: 22800, truckTypeNeeded: 'Refrigerated', status: 'open', distanceKm: 987, aiRecommended: true },
  { id: 'ld_208', title: 'Local Grocery Restock', category: 'FMCG', weightTons: 2.5, originCity: 'Pune', destinationCity: 'Nashik', pickupDate: '2026-08-05', shipperId: 'usr_017', shipperName: 'FreshMart Retail', budget: 6200, truckTypeNeeded: 'Mini Truck', status: 'open', distanceKm: 210 }
];

export const escrowState: Record<string, EscrowState> = {
  bk_305: {
    id: 'esc_305',
    bookingId: 'bk_305',
    totalAmount: 29900,
    releasedAmount: 14950,
    status: 'partially_released',
    milestones: [
      { id: 'm_305_1', label: 'Pickup & weighbridge confirmed', amount: 14950, status: 'released', dueAt: 'Today, 2:15 PM' },
      { id: 'm_305_2', label: 'Paradeep Port delivery payout', amount: 14950, status: 'pending', dueAt: 'Today, 8:30 PM' }
    ]
  },
  bk_306: {
    id: 'esc_306',
    bookingId: 'bk_306',
    totalAmount: 18500,
    releasedAmount: 0,
    status: 'held',
    milestones: [
      { id: 'm_306_1', label: 'Temperature log & reefer dispatched', amount: 7400, status: 'pending', dueAt: 'Tomorrow, 6:00 AM' },
      { id: 'm_306_2', label: 'Cold-storage delivery payout', amount: 11100, status: 'pending', dueAt: 'Tomorrow, 5:00 PM' }
    ]
  },
  bk_307: {
    id: 'esc_307',
    bookingId: 'bk_307',
    totalAmount: 22400,
    releasedAmount: 22400,
    status: 'released',
    milestones: [
      { id: 'm_307_1', label: 'Smelter dispatch verified', amount: 8960, status: 'released', dueAt: 'Aug 4, 2026' },
      { id: 'm_307_2', label: 'Raipur warehouse delivery payout', amount: 13440, status: 'released', dueAt: 'Aug 4, 2026' }
    ]
  },
  bk_301: {
    id: 'esc_301',
    bookingId: 'bk_301',
    totalAmount: 21500,
    releasedAmount: 10750,
    status: 'partially_released',
    milestones: [
      { id: 'm_301_1', label: 'Pickup confirmed', amount: 10750, status: 'released', dueAt: 'Today, 6:40 PM' },
      { id: 'm_301_2', label: 'Delivery payout', amount: 10750, status: 'pending', dueAt: 'Tomorrow, 9:00 AM' }
    ]
  },
  bk_302: {
    id: 'esc_302',
    bookingId: 'bk_302',
    totalAmount: 29400,
    releasedAmount: 0,
    status: 'held',
    milestones: [
      { id: 'm_302_1', label: 'Vehicle dispatched', amount: 11760, status: 'pending', dueAt: 'Tomorrow, 2:00 PM' },
      { id: 'm_302_2', label: 'Delivery payout', amount: 17640, status: 'pending', dueAt: 'Aug 8, 2026' }
    ]
  },
  bk_303: {
    id: 'esc_303',
    bookingId: 'bk_303',
    totalAmount: 19900,
    releasedAmount: 19900,
    status: 'released',
    milestones: [
      { id: 'm_303_1', label: 'Pickup confirmed', amount: 7450, status: 'released', dueAt: 'Aug 2, 2026' },
      { id: 'm_303_2', label: 'Delivery payout', amount: 12450, status: 'released', dueAt: 'Aug 2, 2026' }
    ]
  },
  bk_304: {
    id: 'esc_304',
    bookingId: 'bk_304',
    totalAmount: 9800,
    releasedAmount: 9800,
    status: 'released',
    milestones: [
      { id: 'm_304_1', label: 'Pickup confirmed', amount: 4900, status: 'released', dueAt: 'Jul 29, 2026' },
      { id: 'm_304_2', label: 'Delivery payout', amount: 4900, status: 'released', dueAt: 'Jul 29, 2026' }
    ]
  }
};

export const trackingEvents: Record<string, TrackingEvent[]> = {
  bk_305: [
    { id: 'evt_305_1', bookingId: 'bk_305', timestamp: 'Today, 8:30 AM', status: 'picked_up', location: 'Rourkela', note: 'Loaded at Kalinga Steel Plant & weighbridge validated' },
    { id: 'evt_305_2', bookingId: 'bk_305', timestamp: 'Today, 12:15 PM', status: 'checkpoint', location: 'Angul', note: 'Industrial corridor toll plaza cleared' },
    { id: 'evt_305_3', bookingId: 'bk_305', timestamp: 'Today, 3:45 PM', status: 'in_transit', location: 'Dhenkanal bypass', note: 'Moving along NH-55 towards Cuttack/Paradeep corridor' },
    { id: 'evt_305_4', bookingId: 'bk_305', timestamp: 'Today, 5:40 PM', status: 'out_for_delivery', location: 'Cuttack outskirts', note: 'Final leg to Paradeep Port Logistics Park' }
  ],
  bk_306: [
    { id: 'evt_306_1', bookingId: 'bk_306', timestamp: 'Today, 10:00 AM', status: 'picked_up', location: 'Paradeep', note: 'Reefer container loaded at Paradeep Harbor (-18°C log verified)' },
    { id: 'evt_306_2', bookingId: 'bk_306', timestamp: 'Today, 2:30 PM', status: 'in_transit', location: 'Balasore', note: 'Cruising north on NH-16 towards Kharagpur/Kolkata' }
  ],
  bk_307: [
    { id: 'evt_307_1', bookingId: 'bk_307', timestamp: 'Aug 4, 7:00 AM', status: 'picked_up', location: 'Jharsuguda', note: 'Consignment loaded at Aluminium Smelter hub' },
    { id: 'evt_307_2', bookingId: 'bk_307', timestamp: 'Aug 4, 6:30 PM', status: 'delivered', location: 'Raipur', note: 'Delivered to Central Distribution Depot, proof signed' }
  ],
  bk_301: [
    { id: 'evt_301_1', bookingId: 'bk_301', timestamp: 'Aug 3, 9:14 AM', status: 'picked_up', location: 'Mumbai', note: 'Load secured at origin warehouse' },
    { id: 'evt_301_2', bookingId: 'bk_301', timestamp: 'Aug 3, 11:40 AM', status: 'in_transit', location: 'Nashik', note: 'Truck departed for Pune corridor' },
    { id: 'evt_301_3', bookingId: 'bk_301', timestamp: 'Aug 3, 12:05 PM', status: 'checkpoint', location: 'Bhiwandi', note: 'Checkpoint passed, traffic normal' },
    { id: 'evt_301_4', bookingId: 'bk_301', timestamp: 'Today, 5:30 PM', status: 'out_for_delivery', location: 'Pune outskirts', note: 'Final-mile delivery in progress' }
  ],
  bk_302: [
    { id: 'evt_302_1', bookingId: 'bk_302', timestamp: 'Aug 4, 2:30 PM', status: 'picked_up', location: 'Jaipur', note: 'Cargo accepted and sealed' },
    { id: 'evt_302_2', bookingId: 'bk_302', timestamp: 'Tomorrow, 7:00 AM', status: 'in_transit', location: 'Manesar', note: 'Route is on schedule' }
  ],
  bk_303: [
    { id: 'evt_303_1', bookingId: 'bk_303', timestamp: 'Aug 2, 8:00 AM', status: 'picked_up', location: 'Chennai', note: 'Consignment loaded' },
    { id: 'evt_303_2', bookingId: 'bk_303', timestamp: 'Aug 2, 2:15 PM', status: 'delivered', location: 'Coimbatore', note: 'Delivery completed and proof signed' }
  ],
  bk_304: [
    { id: 'evt_304_1', bookingId: 'bk_304', timestamp: 'Jul 29, 10:00 AM', status: 'picked_up', location: 'Surat', note: 'Picked up from warehouse' },
    { id: 'evt_304_2', bookingId: 'bk_304', timestamp: 'Jul 29, 2:30 PM', status: 'delivered', location: 'Ahmedabad', note: 'Delivered to final stop' }
  ]
};

export const shipmentTrackers: Record<string, ShipmentTracker> = {
  bk_305: {
    bookingId: 'bk_305',
    currentLocation: 'Cuttack outskirts',
    progressPct: 68,
    eta: 'Today, 8:30 PM',
    updatedAt: 'Today, 5:40 PM',
    events: trackingEvents.bk_305
  },
  bk_306: {
    bookingId: 'bk_306',
    currentLocation: 'Balasore',
    progressPct: 45,
    eta: 'Tomorrow, 6:30 AM',
    updatedAt: 'Today, 2:30 PM',
    events: trackingEvents.bk_306
  },
  bk_307: {
    bookingId: 'bk_307',
    currentLocation: 'Raipur',
    progressPct: 100,
    eta: 'Delivered Aug 4',
    updatedAt: 'Aug 4, 6:45 PM',
    events: trackingEvents.bk_307
  },
  bk_301: {
    bookingId: 'bk_301',
    currentLocation: 'Pune outskirts',
    progressPct: 62,
    eta: 'Today, 6:40 PM',
    updatedAt: 'Today, 4:15 PM',
    events: trackingEvents.bk_301
  },
  bk_302: {
    bookingId: 'bk_302',
    currentLocation: 'Jaipur warehouse',
    progressPct: 8,
    eta: 'Tomorrow, 2:00 PM',
    updatedAt: 'Today, 8:10 AM',
    events: trackingEvents.bk_302
  },
  bk_303: {
    bookingId: 'bk_303',
    currentLocation: 'Coimbatore',
    progressPct: 100,
    eta: 'Delivered Aug 2',
    updatedAt: 'Aug 2, 5:20 PM',
    events: trackingEvents.bk_303
  },
  bk_304: {
    bookingId: 'bk_304',
    currentLocation: 'Ahmedabad',
    progressPct: 100,
    eta: 'Delivered Jul 29',
    updatedAt: 'Jul 29, 6:00 PM',
    events: trackingEvents.bk_304
  }
};

export const bookings: Booking[] = [
  { id: 'bk_305', loadId: 'ld_209', truckId: 'trk_110', loadTitle: 'TMT Steel Bars & Heavy Billets', route: 'Rourkela → Paradeep', shipperName: 'Kalinga Steel & Alloys Ltd', transporterName: 'Kalinga Heavy Haulage', amount: 29900, status: 'in-transit', progressPct: 68, eta: 'Today, 8:30 PM', createdAt: '2026-08-05', driverName: 'Subhashis Patnaik', driverPhone: '+91 94370 12345', vehicleNumber: 'OD05 K 3392', escrow: escrowState.bk_305, tracking: shipmentTrackers.bk_305 },
  { id: 'bk_306', loadId: 'ld_210', truckId: 'trk_112', loadTitle: 'Export-Grade Frozen Tiger Prawns', route: 'Paradeep → Kolkata', shipperName: 'Utkal Marine & Seafoods Ltd', transporterName: 'Chilika ColdChain Logistics', amount: 18500, status: 'confirmed', progressPct: 45, eta: 'Tomorrow, 6:30 AM', createdAt: '2026-08-06', driverName: 'Bikram Mohanty', driverPhone: '+91 98610 88765', vehicleNumber: 'OD01 M 4420', escrow: escrowState.bk_306, tracking: shipmentTrackers.bk_306 },
  { id: 'bk_307', loadId: 'ld_211', truckId: 'trk_111', loadTitle: 'Aluminium Ingots & Extrusions', route: 'Jharsuguda → Raipur', shipperName: 'Mahanadi Metals & Power', transporterName: 'Mahanadi Roadways', amount: 22400, status: 'delivered', progressPct: 100, eta: 'Delivered Aug 4', createdAt: '2026-08-02', driverName: 'Rajesh Sahu', driverPhone: '+91 94382 77610', vehicleNumber: 'OD14 H 5541', escrow: escrowState.bk_307, tracking: shipmentTrackers.bk_307 },
  { id: 'bk_301', loadId: 'ld_201', truckId: 'trk_101', loadTitle: 'Textile Rolls — 400 Bales', route: 'Mumbai → Pune', shipperName: 'Shreeji Textiles', transporterName: 'Mehta Logistics', amount: 21500, status: 'in-transit', progressPct: 62, eta: 'Today, 6:40 PM', createdAt: '2026-08-03', driverName: 'Suresh Yadav', driverPhone: '+91 98200 11234', vehicleNumber: 'MH12 GT 4521', escrow: escrowState.bk_301, tracking: shipmentTrackers.bk_301 },
  { id: 'bk_302', loadId: 'ld_204', truckId: 'trk_104', loadTitle: 'Auto Components — OEM Supply', route: 'Jaipur → Delhi', shipperName: 'Rajputana Auto Parts', transporterName: 'North Star Carriers', amount: 29400, status: 'confirmed', progressPct: 8, eta: 'Tomorrow, 2:00 PM', createdAt: '2026-08-04', driverName: 'Vikram Singh', driverPhone: '+91 99110 22456', vehicleNumber: 'DL8C AY 5567', escrow: escrowState.bk_302, tracking: shipmentTrackers.bk_302 },
  { id: 'bk_303', loadId: 'ld_205', truckId: 'trk_105', loadTitle: 'Packaged Cement — 500 Bags', route: 'Chennai → Coimbatore', shipperName: 'BuildRight Materials', transporterName: 'Coimbatore Freight Co', amount: 19900, status: 'delivered', progressPct: 100, eta: 'Delivered Aug 2', createdAt: '2026-07-31', driverName: 'Ramesh Kumar', driverPhone: '+91 90031 55678', vehicleNumber: 'TN09 BQ 7734', escrow: escrowState.bk_303, tracking: shipmentTrackers.bk_303 },
  { id: 'bk_304', loadId: 'ld_202', truckId: 'trk_102', loadTitle: 'FMCG Cartons — Retail Distribution', route: 'Surat → Ahmedabad', shipperName: 'DailyNeeds Distributors', transporterName: 'Patel Roadways', amount: 9800, status: 'delivered', progressPct: 100, eta: 'Delivered Jul 29', createdAt: '2026-07-27', driverName: 'Bharat Patel', driverPhone: '+91 97250 88123', vehicleNumber: 'GJ01 AX 8890', escrow: escrowState.bk_304, tracking: shipmentTrackers.bk_304 }
];

export const transactions: Transaction[] = [
  { id: 'txn_406', type: 'credit', label: 'Payout — Booking #bk_307 (Jharsuguda → Raipur)', amount: 21950, date: 'Aug 4, 2026', method: 'Escrow', status: 'success' },
  { id: 'txn_407', type: 'debit', label: 'Fuel advance — Trip #bk_305 (Rourkela → Paradeep)', amount: 4500, date: 'Today', method: 'Card', status: 'success' },
  { id: 'txn_401', type: 'credit', label: 'Payout — Booking #bk_303', amount: 19402, date: 'Aug 2, 2026', method: 'Escrow', status: 'success' },
  { id: 'txn_402', type: 'debit', label: 'Platform fee — Booking #bk_301', amount: 645, date: 'Aug 3, 2026', method: 'Wallet', status: 'success' },
  { id: 'txn_403', type: 'credit', label: 'Payout — Booking #bk_304', amount: 9604, date: 'Jul 29, 2026', method: 'UPI', status: 'success' },
  { id: 'txn_404', type: 'debit', label: 'Fuel advance — Trip #bk_301', amount: 3200, date: 'Aug 3, 2026', method: 'Card', status: 'success' },
  { id: 'txn_405', type: 'credit', label: 'Referral bonus', amount: 500, date: 'Jul 26, 2026', method: 'Wallet', status: 'pending' }
];

export const notifications: NotificationItem[] = [
  { id: 'ntf_505', title: 'Odisha Backhaul Match (96%)', description: 'Rourkela → Paradeep: 26T Steel Billets matched with returning trailer OD05 K 3392.', time: '10 min ago', read: false, type: 'ai' },
  { id: 'ntf_501', title: 'Booking confirmed', description: 'Kalinga Steel & Alloys confirmed your bid for Rourkela → Paradeep.', time: '25 min ago', read: false, type: 'booking' },
  { id: 'ntf_502', title: 'AI found a high-match backhaul', description: '95% match: Paradeep → Kolkata, Frozen Tiger Prawns, ₹18,500.', time: '1 hr ago', read: false, type: 'ai' },
  { id: 'ntf_503', title: 'Payment received', description: '₹21,950 credited to your wallet for Booking #bk_307 (Jharsuguda → Raipur).', time: '2 days ago', read: true, type: 'payment' },
  { id: 'ntf_504', title: 'Document expiring soon', description: 'Fitness certificate for OD05 K 3392 valid for 6 months.', time: '3 days ago', read: true, type: 'system' }
];

export const routeStats: RouteStat[] = [
  { route: 'Rourkela → Paradeep', trips: 184, savingsPct: 34 },
  { route: 'Bhubaneswar → Kolkata', trips: 126, savingsPct: 29 },
  { route: 'Bhubaneswar → Delhi', trips: 92, savingsPct: 36 },
  { route: 'Jharsuguda → Raipur', trips: 78, savingsPct: 26 },
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
  'Rourkela→Paradeep': {
    originCity: 'Rourkela',
    destinationCity: 'Paradeep',
    distanceKm: 415,
    highway: 'Biju Expressway → NH-55 → NH-53',
    stops: [
      { city: 'Rourkela', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Sundargarh', state: 'Odisha', kmFromOrigin: 80 },
      { city: 'Sambalpur', state: 'Odisha', kmFromOrigin: 165, isHighwayJunction: true },
      { city: 'Angul', state: 'Odisha', kmFromOrigin: 270, isHighwayJunction: true },
      { city: 'Dhenkanal', state: 'Odisha', kmFromOrigin: 325 },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 365, isHighwayJunction: true },
      { city: 'Paradeep', state: 'Odisha', kmFromOrigin: 415, isHighwayJunction: true }
    ]
  },
  'Bhubaneswar→Kolkata': {
    originCity: 'Bhubaneswar',
    destinationCity: 'Kolkata',
    distanceKm: 440,
    highway: 'NH-16',
    stops: [
      { city: 'Bhubaneswar', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 28, isHighwayJunction: true },
      { city: 'Jajpur', state: 'Odisha', kmFromOrigin: 95 },
      { city: 'Balasore', state: 'Odisha', kmFromOrigin: 205, isHighwayJunction: true },
      { city: 'Kharagpur', state: 'West Bengal', kmFromOrigin: 315, isHighwayJunction: true },
      { city: 'Kolkata', state: 'West Bengal', kmFromOrigin: 440, isHighwayJunction: true }
    ]
  },
  'Paradeep→Kolkata': {
    originCity: 'Paradeep',
    destinationCity: 'Kolkata',
    distanceKm: 440,
    highway: 'NH-53 → NH-16',
    stops: [
      { city: 'Paradeep', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 85, isHighwayJunction: true },
      { city: 'Jajpur', state: 'Odisha', kmFromOrigin: 155 },
      { city: 'Balasore', state: 'Odisha', kmFromOrigin: 265, isHighwayJunction: true },
      { city: 'Kharagpur', state: 'West Bengal', kmFromOrigin: 365, isHighwayJunction: true },
      { city: 'Kolkata', state: 'West Bengal', kmFromOrigin: 440, isHighwayJunction: true }
    ]
  },
  'Jharsuguda→Raipur': {
    originCity: 'Jharsuguda',
    destinationCity: 'Raipur',
    distanceKm: 310,
    highway: 'NH-49',
    stops: [
      { city: 'Jharsuguda', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Bargarh', state: 'Odisha', kmFromOrigin: 65 },
      { city: 'Raipur', state: 'Chhattisgarh', kmFromOrigin: 310, isHighwayJunction: true }
    ]
  },
  'Angul→Bhubaneswar': {
    originCity: 'Angul',
    destinationCity: 'Bhubaneswar',
    distanceKm: 130,
    highway: 'NH-55',
    stops: [
      { city: 'Angul', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Dhenkanal', state: 'Odisha', kmFromOrigin: 55 },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 102, isHighwayJunction: true },
      { city: 'Bhubaneswar', state: 'Odisha', kmFromOrigin: 130, isHighwayJunction: true }
    ]
  },
  'Cuttack→Balasore': {
    originCity: 'Cuttack',
    destinationCity: 'Balasore',
    distanceKm: 180,
    highway: 'NH-16',
    stops: [
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Jajpur', state: 'Odisha', kmFromOrigin: 68 },
      { city: 'Balasore', state: 'Odisha', kmFromOrigin: 180, isHighwayJunction: true }
    ]
  },
  'Sambalpur→Bhubaneswar': {
    originCity: 'Sambalpur',
    destinationCity: 'Bhubaneswar',
    distanceKm: 310,
    highway: 'NH-55',
    stops: [
      { city: 'Sambalpur', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Angul', state: 'Odisha', kmFromOrigin: 175, isHighwayJunction: true },
      { city: 'Dhenkanal', state: 'Odisha', kmFromOrigin: 235 },
      { city: 'Cuttack', state: 'Odisha', kmFromOrigin: 282, isHighwayJunction: true },
      { city: 'Bhubaneswar', state: 'Odisha', kmFromOrigin: 310, isHighwayJunction: true }
    ]
  },
  'Bhubaneswar→Visakhapatnam': {
    originCity: 'Bhubaneswar',
    destinationCity: 'Visakhapatnam',
    distanceKm: 445,
    highway: 'NH-16',
    stops: [
      { city: 'Bhubaneswar', state: 'Odisha', kmFromOrigin: 0, isHighwayJunction: true },
      { city: 'Berhampur', state: 'Odisha', kmFromOrigin: 170, isHighwayJunction: true },
      { city: 'Visakhapatnam', state: 'Andhra Pradesh', kmFromOrigin: 445, isHighwayJunction: true }
    ]
  },
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
