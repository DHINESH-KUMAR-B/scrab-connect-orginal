import { buildAllIndiaHubs, type IndiaHub } from './indiaHubs.ts'

export interface ScrapRate {
  category: string
  group: 'Paper & Card' | 'Plastics' | 'Metals' | 'E-Waste & Appliances' | 'Other'
  pricePerKg: number
  prevPrice: number
  trend: 'up' | 'down' | 'steady'
  changePct: number
  demand: 'High' | 'Medium' | 'Normal'
  note: string
}

export interface PickupItem {
  category: string
  weight: number
  pricePerKg: number
}

export interface PickupRecord {
  id: string
  userId: string
  userName?: string
  collectorId: string | null
  scrapType: string
  items?: PickupItem[]
  weight: number
  actualWeight?: number
  status: 'scheduled' | 'completed' | 'cancelled'
  price: number
  voucherCode?: string
  discount?: number
  area: string
  address?: string
  date: string
  time?: string
  notes?: string
  lat: number
  lng: number
  collectorLat?: number
  collectorLng?: number
  trackingStage?: 'assigned' | 'en_route' | 'arrived' | 'weighing' | 'completed'
  lastPingAt?: string
  handoffPin?: string
  pinVerified?: boolean
  liveNote?: string
  payoutPreference?: 'cash' | 'cash_tree_split' | 'points_3x' | 'eco_credit'
  upiId?: string
  expressPaidOnline?: boolean
  prepOptions?: string[]
  rating?: number
  review?: string
  createdAt: string
  completedAt?: string
}

export interface RewardClaimRecord {
  id: string
  userId: string
  rewardId: string
  code: string
  title: string
  bonusPoints?: number
  claimedAt: string
}

export interface CollectorRecord {
  id: string
  name: string
  vehicle: string
  phone: string
  areas: string[]
  verified: boolean
  rating: number
  completedCount: number
  capacityKg?: number
  likesCount?: number
}

export type ReviewTargetType = 'pickup' | 'collector' | 'hub' | 'project' | 'platform'

export interface ReviewRecord {
  id: string
  targetType: ReviewTargetType
  targetId: string
  targetName: string
  pickupId?: string
  userId: string
  userName: string
  rating: number
  comment: string
  tags: string[]
  helpfulBy: string[]
  collectorThanked?: boolean
  createdAt: string
}

export interface LikeBucket {
  likedBy: string[]
  baseCount: number
}

export interface SupportMessage {
  id: string
  sender: 'user' | 'support'
  senderName: string
  text: string
  createdAt: string
}

export interface SupportTicketRecord {
  id: string
  userId: string
  userName: string
  email: string
  category: 'Pickup delay' | 'Weighbridge & rate check' | 'Online UPI / payout' | 'Collector safety' | 'Account & rewards' | 'Other'
  priority: 'normal' | 'high' | 'urgent'
  pickupId?: string
  subject: string
  status: 'open' | 'in_review' | 'resolved'
  messages: SupportMessage[]
  createdAt: string
  updatedAt: string
}

export interface PaymentTransactionRecord {
  id: string
  userId: string
  pickupId?: string
  type: 'payout_credit' | 'online_payment' | 'withdrawal' | 'carbon_offset'
  method: 'UPI' | 'Card' | 'NetBanking' | 'Eco-Wallet' | 'Bank Transfer'
  upiOrRef: string
  amount: number
  direction: 'credit' | 'debit'
  status: 'completed' | 'processing'
  description: string
  createdAt: string
}

export interface UserRecord {
  id: string
  name: string
  email: string
  phone: string
  altPhone?: string
  altContactName?: string
  photoUrl?: string
  accountType?: 'Household' | 'Apartment / HOA' | 'Business / Shop' | 'Office / Campus'
  greenPoints: number
  role: 'user' | 'collector' | 'admin'
  area?: string
  city?: string
  pinCode?: string
  landmark?: string
  address?: string
  bio?: string
  lat?: number
  lng?: number
  payoutMethod?: 'UPI' | 'Bank Transfer' | 'Cash'
  upiId?: string
  preferredSlot?: string
  notifySms?: boolean
  notifyRates?: boolean
  vehicle?: string
  licenseNo?: string
  areas?: string[]
  capacityKg?: number
  profileCompleted?: boolean
}

export interface RecyclingCenter {
  id: string
  name: string
  area: string
  address: string
  lat: number
  lng: number
  hours: string
  phone: string
  materials: string[]
  bonusPct: number
  verified: boolean
}

const initialRates: ScrapRate[] = [
  { category: 'Newspaper', group: 'Paper & Card', pricePerKg: 14, prevPrice: 13.5, trend: 'up', changePct: 3.7, demand: 'High', note: 'Clean, dry bundles without plastic sleeves' },
  { category: 'Books', group: 'Paper & Card', pricePerKg: 12, prevPrice: 12, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Notebooks, textbooks, paperbacks' },
  { category: 'Paper', group: 'Paper & Card', pricePerKg: 10, prevPrice: 10.5, trend: 'down', changePct: -4.8, demand: 'Normal', note: 'Mixed office & printing paper' },
  { category: 'Cardboard', group: 'Paper & Card', pricePerKg: 9, prevPrice: 8.5, trend: 'up', changePct: 5.9, demand: 'High', note: 'Flattened corrugated shipping boxes' },
  { category: 'Tetra packs', group: 'Paper & Card', pricePerKg: 4, prevPrice: 4, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Rinsed beverage & milk cartons' },
  { category: 'Plastic bottles', group: 'Plastics', pricePerKg: 18, prevPrice: 17, trend: 'up', changePct: 5.9, demand: 'High', note: 'Sorted clean household bottles' },
  { category: 'PET bottles', group: 'Plastics', pricePerKg: 22, prevPrice: 21, trend: 'up', changePct: 4.8, demand: 'High', note: 'Clear mineral water & beverage bottles' },
  { category: 'HDPE containers', group: 'Plastics', pricePerKg: 16, prevPrice: 16, trend: 'steady', changePct: 0, demand: 'Medium', note: 'Detergent, shampoo & milk jugs' },
  { category: 'Plastic film', group: 'Plastics', pricePerKg: 6, prevPrice: 6.5, trend: 'down', changePct: -7.7, demand: 'Normal', note: 'Clean shrink wrap & carrier bags' },
  { category: 'Mixed plastic', group: 'Plastics', pricePerKg: 8, prevPrice: 8, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Rigid household plastic items' },
  { category: 'Aluminum cans', group: 'Metals', pricePerKg: 110, prevPrice: 105, trend: 'up', changePct: 4.8, demand: 'High', note: 'Crushed beverage cans & foil trays' },
  { category: 'Iron and steel', group: 'Metals', pricePerKg: 32, prevPrice: 31, trend: 'up', changePct: 3.2, demand: 'High', note: 'Gates, rods, utensils & scrap iron' },
  { category: 'Copper', group: 'Metals', pricePerKg: 620, prevPrice: 605, trend: 'up', changePct: 2.5, demand: 'High', note: 'Stripped copper coils, pipes & busbars' },
  { category: 'Brass', group: 'Metals', pricePerKg: 410, prevPrice: 415, trend: 'down', changePct: -1.2, demand: 'Medium', note: 'Taps, valves, fittings & hardware' },
  { category: 'Cables & wires', group: 'Metals', pricePerKg: 95, prevPrice: 90, trend: 'up', changePct: 5.6, demand: 'High', note: 'Insulated copper power & network cables' },
  { category: 'E-Waste', group: 'E-Waste & Appliances', pricePerKg: 60, prevPrice: 58, trend: 'up', changePct: 3.4, demand: 'High', note: 'Laptops, monitors, PCBs & peripherals' },
  { category: 'Mobile phones', group: 'E-Waste & Appliances', pricePerKg: 120, prevPrice: 115, trend: 'up', changePct: 4.3, demand: 'High', note: 'Smartphones & feature phones (data wiped)' },
  { category: 'Small electronics', group: 'E-Waste & Appliances', pricePerKg: 45, prevPrice: 45, trend: 'steady', changePct: 0, demand: 'Medium', note: 'Routers, headphones, remotes & chargers' },
  { category: 'Batteries', group: 'E-Waste & Appliances', pricePerKg: 25, prevPrice: 24, trend: 'up', changePct: 4.2, demand: 'Medium', note: 'UPS, inverter & laptop battery packs' },
  { category: 'Appliances', group: 'E-Waste & Appliances', pricePerKg: 25, prevPrice: 25, trend: 'steady', changePct: 0, demand: 'Medium', note: 'Microwaves, fans, mixers & small appliances' },
  { category: 'Glass bottles', group: 'Other', pricePerKg: 3, prevPrice: 3, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Intact jars & beverage glass bottles' },
  { category: 'Textiles', group: 'Other', pricePerKg: 15, prevPrice: 14, trend: 'up', changePct: 7.1, demand: 'Medium', note: 'Clean cotton garments, denim & linens' },
  { category: 'Used cooking oil', group: 'Other', pricePerKg: 25, prevPrice: 24, trend: 'up', changePct: 4.2, demand: 'Medium', note: 'Filtered oil in sealed containers for biodiesel' },
  { category: 'Wood', group: 'Other', pricePerKg: 4, prevPrice: 4, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Dry pallets, crates & untreated timber' },
  { category: 'Other', group: 'Other', pricePerKg: 5, prevPrice: 5, trend: 'steady', changePct: 0, demand: 'Normal', note: 'Assorted dry household recyclables' },
]

const initialPickups: PickupRecord[] = [
  { id: 'P101', userId: 'u1', userName: 'Priya S', collectorId: 'c1', scrapType: 'Iron and steel', weight: 14, actualWeight: 14, status: 'completed', price: 490, area: 'Adyar', address: '14 Gandhi Nagar, Adyar', date: '2026-11-10', time: '10:30', lat: 13.0, lng: 80.25, trackingStage: 'completed', rating: 5, review: 'On-time pickup and instant UPI payout.', createdAt: '2026-11-08T09:00:00.000Z', completedAt: '2026-11-10T10:45:00.000Z' },
  { id: 'P102', userId: 'u1', userName: 'Priya S', collectorId: 'c1', scrapType: 'Paper', weight: 8, status: 'scheduled', price: 96, area: 'Adyar', address: '14 Gandhi Nagar, Adyar', date: '2026-11-18', time: '11:00', notes: 'Call on arrival at main gate', lat: 13.01, lng: 80.26, collectorLat: 13.0285, collectorLng: 80.2412, trackingStage: 'en_route', handoffPin: '4829', pinVerified: false, liveNote: 'Bundles tied and ready near security desk', lastPingAt: new Date().toISOString(), createdAt: '2026-11-15T11:20:00.000Z' },
  { id: 'P103', userId: 'u2', userName: 'Karthik R', collectorId: 'c2', scrapType: 'E-Waste', weight: 5, status: 'scheduled', price: 300, area: 'T Nagar', address: '28 North Usman Rd, T Nagar', date: '2026-11-18', time: '14:00', lat: 13.04, lng: 80.23, collectorLat: 13.052, collectorLng: 80.219, trackingStage: 'assigned', handoffPin: '6194', pinVerified: false, lastPingAt: new Date().toISOString(), createdAt: '2026-11-15T13:10:00.000Z' },
  { id: 'P104', userId: 'u3', userName: 'Meena L', collectorId: 'c1', scrapType: 'Plastic bottles', weight: 6, status: 'scheduled', price: 108, area: 'Adyar', address: '9 Besant Ave, Adyar', date: '2026-11-18', time: '16:00', lat: 13.0, lng: 80.24, collectorLat: 13.016, collectorLng: 80.249, trackingStage: 'assigned', handoffPin: '3075', pinVerified: false, lastPingAt: new Date().toISOString(), createdAt: '2026-11-16T08:40:00.000Z' },
  { id: 'P105', userId: 'u4', userName: 'GreenCafe', collectorId: 'c2', scrapType: 'Cardboard', weight: 11, actualWeight: 11, status: 'completed', price: 99, area: 'Velachery', address: '100 Feet Bypass Rd, Velachery', date: '2026-11-09', time: '09:00', lat: 12.98, lng: 80.22, trackingStage: 'completed', rating: 5, createdAt: '2026-11-07T15:00:00.000Z', completedAt: '2026-11-09T09:30:00.000Z' },
  { id: 'P106', userId: 'u2', userName: 'Karthik R', collectorId: null, scrapType: 'Copper', weight: 3, status: 'scheduled', price: 1860, area: 'Mylapore', address: '42 Luz Church Rd, Mylapore', date: '2026-11-19', time: '10:00', notes: 'Old AC copper piping bundled in garage', lat: 13.0339, lng: 80.2619, trackingStage: 'assigned', handoffPin: '7512', pinVerified: false, createdAt: '2026-11-16T16:15:00.000Z' },
]

const initialCollectors: CollectorRecord[] = [
  { id: 'c1', name: 'Ravi Kumar', vehicle: 'Mini truck TN-09-4521', phone: '98401 55201', areas: ['Adyar', 'Mylapore', 'Besant Nagar'], verified: true, rating: 4.8, completedCount: 142, likesCount: 84 },
  { id: 'c2', name: 'Selvi M', vehicle: 'E-rickshaw TN-22-1180', phone: '98401 66302', areas: ['T Nagar', 'Velachery', 'Guindy'], verified: true, rating: 4.7, completedCount: 118, likesCount: 69 },
  { id: 'c3', name: 'Arun P', vehicle: 'Van TN-07-7733', phone: '98401 77403', areas: ['Anna Nagar', 'Kilpauk'], verified: false, rating: 0, completedCount: 0, likesCount: 4 },
  { id: 'c4', name: 'Deepa V', vehicle: 'EV Cargo TN-01-9044', phone: '98401 88504', areas: ['OMR', 'Thiruvanmiyur', 'Adyar'], verified: true, rating: 4.9, completedCount: 89, likesCount: 72 },
]

const initialUsers: UserRecord[] = [
  { id: 'u1', name: 'Priya S', email: 'priya@mail.com', phone: '98400 11111', greenPoints: 1240, role: 'user' },
  { id: 'u2', name: 'Karthik R', email: 'karthik@mail.com', phone: '98400 22222', greenPoints: 980, role: 'user' },
  { id: 'u3', name: 'Meena L', email: 'meena@mail.com', phone: '98400 33333', greenPoints: 760, role: 'user' },
  { id: 'u4', name: 'GreenCafe', email: 'cafe@mail.com', phone: '98400 44444', greenPoints: 2100, role: 'user' },
]

const initialCenters: IndiaHub[] = [
  {
    id: 'hub-1',
    hubCode: 'SC-CHN-001',
    name: 'Adyar Circular Material Hub',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'Adyar',
    pinCode: '600020',
    address: '21 Sardar Patel Rd, Adyar, Chennai, Tamil Nadu 600020',
    lat: 13.0067,
    lng: 80.2565,
    hours: '08:00 – 19:00 daily',
    phone: '044-2441-8820',
    materials: ['Newspaper', 'Cardboard', 'PET bottles', 'Aluminum cans', 'Glass bottles'],
    bonusPct: 5,
    rating: 4.9,
    photoType: 'urban',
    verified: true,
  },
  {
    id: 'hub-2',
    hubCode: 'SC-CHN-002',
    name: 'Guindy GreenTech E-Waste Yard',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'Guindy',
    pinCode: '600032',
    address: 'Plot 14 SIDCO Industrial Estate, Guindy, Chennai, Tamil Nadu 600032',
    lat: 13.0102,
    lng: 80.2124,
    hours: '09:00 – 18:30 (Mon–Sat)',
    phone: '044-2250-4410',
    materials: ['E-Waste', 'Mobile phones', 'Small electronics', 'Batteries', 'Cables & wires'],
    bonusPct: 10,
    rating: 4.8,
    photoType: 'ewaste',
    verified: true,
  },
  {
    id: 'hub-3',
    hubCode: 'SC-CHN-003',
    name: 'T Nagar Metal & Paper Exchange',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'T Nagar',
    pinCode: '600017',
    address: '88 South Boag Rd, T Nagar, Chennai, Tamil Nadu 600017',
    lat: 13.0381,
    lng: 80.2367,
    hours: '08:30 – 20:00 daily',
    phone: '044-2434-1900',
    materials: ['Copper', 'Brass', 'Iron and steel', 'Books', 'Paper', 'Newspaper'],
    bonusPct: 8,
    rating: 4.9,
    photoType: 'metal',
    verified: true,
  },
  {
    id: 'hub-4',
    hubCode: 'SC-CHN-004',
    name: 'Velachery Community Recovery Point',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'Velachery',
    pinCode: '600042',
    address: '15 Vijayanagar Main Rd, Velachery, Chennai, Tamil Nadu 600042',
    lat: 12.9784,
    lng: 80.2209,
    hours: '07:30 – 18:00 daily',
    phone: '044-2243-7712',
    materials: ['Plastic bottles', 'HDPE containers', 'Plastic film', 'Textiles', 'Cardboard'],
    bonusPct: 5,
    rating: 4.7,
    photoType: 'ecopoint',
    verified: true,
  },
  {
    id: 'hub-5',
    hubCode: 'SC-CHN-005',
    name: 'Anna Nagar Eco Drop-Off Center',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'Anna Nagar',
    pinCode: '600040',
    address: '3rd Avenue, AB Block, Anna Nagar, Chennai, Tamil Nadu 600040',
    lat: 13.085,
    lng: 80.2101,
    hours: '08:00 – 19:30 daily',
    phone: '044-2621-5530',
    materials: ['Used cooking oil', 'Tetra packs', 'Appliances', 'E-Waste', 'PET bottles'],
    bonusPct: 7,
    rating: 4.8,
    photoType: 'plastics',
    verified: true,
  },
  {
    id: 'hub-6',
    hubCode: 'SC-CHN-006',
    name: 'Mylapore Heritage Paper & Craft Bank',
    state: 'Tamil Nadu',
    city: 'Chennai',
    area: 'Mylapore',
    pinCode: '600004',
    address: '7 Kutchery Rd, Mylapore, Chennai, Tamil Nadu 600004',
    lat: 13.0332,
    lng: 80.2682,
    hours: '09:00 – 18:00 (Tue–Sun)',
    phone: '044-2464-3309',
    materials: ['Books', 'Paper', 'Newspaper', 'Textiles', 'Wood'],
    bonusPct: 5,
    rating: 4.9,
    photoType: 'paper',
    verified: true,
  },
]

const monthlyBase = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, i) => ({
  month,
  kg: 20 + i * 9 + (i % 2) * 6,
  revenue: 4000 + i * 1800,
}))

const initialReviews: ReviewRecord[] = [
  {
    id: 'REV-101',
    targetType: 'collector',
    targetId: 'c1',
    targetName: 'Ravi Kumar (TN-09-4521)',
    pickupId: 'P101',
    userId: 'u1',
    userName: 'Priya S',
    rating: 5,
    comment: 'On-time pickup with a digital floor scale at the gate and instant UPI payout.',
    tags: ['On-time arrival', 'Verified scale', 'Instant UPI'],
    helpfulBy: ['u2', 'u3', 'u4'],
    collectorThanked: true,
    createdAt: '2026-11-10T11:05:00.000Z',
  },
  {
    id: 'REV-102',
    targetType: 'collector',
    targetId: 'c2',
    targetName: 'Selvi M (TN-22-1180)',
    pickupId: 'P105',
    userId: 'u4',
    userName: 'GreenCafe',
    rating: 5,
    comment: 'Cleared 11 kg of commercial cardboard crates cleanly and handed over digital weight slip.',
    tags: ['On-time arrival', 'Polite service', 'No haggling'],
    helpfulBy: ['u1', 'u3'],
    collectorThanked: false,
    createdAt: '2026-11-09T09:50:00.000Z',
  },
  {
    id: 'REV-103',
    targetType: 'hub',
    targetId: 'hub-1',
    targetName: 'Adyar Circular Material Hub',
    userId: 'u2',
    userName: 'Karthik R',
    rating: 5,
    comment: 'Walked in with sorted PET bottles and aluminum cans—got +5% walk-in bonus credited to UPI in 2 minutes.',
    tags: ['Fast weighbridge', 'Walk-in bonus', 'Clean yard'],
    helpfulBy: ['u1', 'u4'],
    createdAt: '2026-11-12T15:20:00.000Z',
  },
  {
    id: 'REV-104',
    targetType: 'hub',
    targetId: 'hub-2',
    targetName: 'Guindy GreenTech E-Waste Yard',
    userId: 'u3',
    userName: 'Meena L',
    rating: 5,
    comment: 'Certified data-safe intake for two old laptops and router gear. Earned the full +10% e-waste hub bonus.',
    tags: ['Data-safe e-waste', 'Transparent pricing', 'Walk-in bonus'],
    helpfulBy: ['u1', 'u2'],
    createdAt: '2026-11-13T12:15:00.000Z',
  },
  {
    id: 'REV-105',
    targetType: 'hub',
    targetId: 'hub-3',
    targetName: 'T Nagar Metal & Paper Exchange',
    userId: 'u1',
    userName: 'Priya S',
    rating: 5,
    comment: 'Matched ₹620/kg live copper rate without deducting hidden charges. Digital scale was clearly visible.',
    tags: ['Verified scale', 'Fast weighbridge'],
    helpfulBy: ['u2'],
    createdAt: '2026-11-14T16:40:00.000Z',
  },
  {
    id: 'REV-106',
    targetType: 'project',
    targetId: 'up-jars',
    targetName: 'Self-watering glass jar herb planters',
    userId: 'u3',
    userName: 'Meena L',
    rating: 5,
    comment: 'Took 12 minutes with three pickle jars and cotton twine—fresh mint is already thriving on our kitchen sill!',
    tags: ['Beginner friendly', 'Zero waste'],
    helpfulBy: ['u1', 'u4'],
    createdAt: '2026-11-14T10:10:00.000Z',
  },
  {
    id: 'REV-107',
    targetType: 'platform',
    targetId: 'scrap-connect',
    targetName: 'Scrap Connect Platform',
    userId: 'u4',
    userName: 'Arjun Mehta · GreenBean Cafe',
    rating: 5,
    comment: 'Live GPS collector tracking plus 4-digit PIN handoff solved every pickup delay we used to have with local vendors.',
    tags: ['Live GPS tracking', '4-digit PIN safety', 'Instant UPI'],
    helpfulBy: ['u1', 'u2', 'u3'],
    createdAt: '2026-11-15T18:00:00.000Z',
  },
]

const initialLikes: Record<string, LikeBucket> = {
  'hub:hub-1': { likedBy: ['u1', 'u2'], baseCount: 146 },
  'hub:hub-2': { likedBy: ['u3'], baseCount: 184 },
  'hub:hub-3': { likedBy: ['u1'], baseCount: 129 },
  'hub:hub-4': { likedBy: [], baseCount: 92 },
  'hub:hub-5': { likedBy: ['u2'], baseCount: 108 },
  'hub:hub-6': { likedBy: [], baseCount: 81 },
  'collector:c1': { likedBy: ['u1'], baseCount: 83 },
  'collector:c2': { likedBy: ['u4'], baseCount: 68 },
  'collector:c4': { likedBy: [], baseCount: 72 },
  'project:up-jars': { likedBy: ['u3'], baseCount: 64 },
  'project:up-cardboard': { likedBy: [], baseCount: 51 },
  'project:up-copper': { likedBy: [], baseCount: 39 },
  'project:up-ewaste': { likedBy: ['u2'], baseCount: 77 },
  'project:up-crates': { likedBy: [], baseCount: 44 },
  'project:up-denim': { likedBy: [], baseCount: 58 },
  'showcase:metals': { likedBy: ['u1'], baseCount: 214 },
  'showcase:ewaste': { likedBy: ['u2'], baseCount: 193 },
  'showcase:india-hubs': { likedBy: ['u1', 'u3'], baseCount: 286 },
  'showcase:paper': { likedBy: [], baseCount: 142 },
  'showcase:plastics': { likedBy: [], baseCount: 168 },
  'showcase:metal-yard': { likedBy: [], baseCount: 119 },
  'showcase:ecopoint': { likedBy: [], baseCount: 155 },
  'showcase:impact': { likedBy: ['u4'], baseCount: 241 },
}

const initialTickets: SupportTicketRecord[] = [
  {
    id: 'SUP-8410',
    userId: 'u1',
    userName: 'Priya S',
    email: 'priya@mail.com',
    category: 'Online UPI / payout',
    priority: 'normal',
    pickupId: 'P101',
    subject: 'Digital GST / Weighbridge receipt copy for November iron pickup',
    status: 'resolved',
    messages: [
      {
        id: 'MSG-1',
        sender: 'user',
        senderName: 'Priya S',
        text: 'Hi team, ₹490 arrived on UPI within 30 seconds! Could you confirm where I can download my weighbridge receipt?',
        createdAt: '2026-11-10T11:10:00.000Z',
      },
      {
        id: 'MSG-2',
        sender: 'support',
        senderName: 'Ananya · Scrap Connect Care',
        text: 'Glad your instant UPI transfer arrived smoothly! Open the Online Wallet & Receipts page anytime to view or download any completed pickup invoice.',
        createdAt: '2026-11-10T11:18:00.000Z',
      },
    ],
    createdAt: '2026-11-10T11:10:00.000Z',
    updatedAt: '2026-11-10T11:18:00.000Z',
  },
  {
    id: 'SUP-8429',
    userId: 'u1',
    userName: 'Priya S',
    email: 'priya@mail.com',
    category: 'Pickup delay',
    priority: 'high',
    pickupId: 'P102',
    subject: 'Gate pass note update for morning paper collection',
    status: 'in_review',
    messages: [
      {
        id: 'MSG-3',
        sender: 'user',
        senderName: 'Priya S',
        text: 'Security desk will ask for the 4-digit handoff PIN 4829 at the north gate before letting the EV van inside.',
        createdAt: '2026-11-16T09:15:00.000Z',
      },
      {
        id: 'MSG-4',
        sender: 'support',
        senderName: 'Dispatch Care',
        text: 'Updated Ravi Kumar (TN-09-4521) with your north-gate instructions. Live GPS tracking is active on your dashboard.',
        createdAt: '2026-11-16T09:22:00.000Z',
      },
    ],
    createdAt: '2026-11-16T09:15:00.000Z',
    updatedAt: '2026-11-16T09:22:00.000Z',
  },
]

const initialTransactions: PaymentTransactionRecord[] = [
  {
    id: 'TXN-90412',
    userId: 'u1',
    pickupId: 'P101',
    type: 'payout_credit',
    method: 'UPI',
    upiOrRef: 'priya@okicici',
    amount: 490,
    direction: 'credit',
    status: 'completed',
    description: 'Iron and steel (14 kg) settlement · Pickup P101',
    createdAt: '2026-11-10T10:46:00.000Z',
  },
  {
    id: 'TXN-90448',
    userId: 'u1',
    type: 'online_payment',
    method: 'UPI',
    upiOrRef: 'UPI-EXPRESS-01',
    amount: 149,
    direction: 'debit',
    status: 'completed',
    description: 'Zero-Waste 3-Bin Color Sorting Kit',
    createdAt: '2026-11-12T14:20:00.000Z',
  },
  {
    id: 'TXN-90477',
    userId: 'u1',
    type: 'payout_credit',
    method: 'Eco-Wallet',
    upiOrRef: 'BONUS-REWARD',
    amount: 150,
    direction: 'credit',
    status: 'completed',
    description: 'Goal Reward Bonus Voucher Cashback',
    createdAt: '2026-11-14T18:05:00.000Z',
  },
  {
    id: 'TXN-90490',
    userId: 'u4',
    pickupId: 'P105',
    type: 'payout_credit',
    method: 'Bank Transfer',
    upiOrRef: 'IMPS-441098',
    amount: 99,
    direction: 'credit',
    status: 'completed',
    description: 'Commercial Cardboard (11 kg) · Pickup P105',
    createdAt: '2026-11-09T09:35:00.000Z',
  },
]

export const store = {
  rates: initialRates.map(r => ({ ...r })),
  pickups: initialPickups.map(p => ({ ...p })),
  collectors: initialCollectors.map(c => ({ ...c, areas: [...c.areas] })),
  users: initialUsers.map(u => ({ ...u })),
  centers: buildAllIndiaHubs(initialCenters),
  monthly: monthlyBase.map(m => ({ ...m })),
  rewardClaims: [] as RewardClaimRecord[],
  reviews: initialReviews.map(r => ({ ...r, tags: [...r.tags], helpfulBy: [...r.helpfulBy] })),
  likes: Object.fromEntries(
    Object.entries(initialLikes).map(([k, v]) => [k, { baseCount: v.baseCount, likedBy: [...v.likedBy] }])
  ) as Record<string, LikeBucket>,
  supportTickets: initialTickets.map(t => ({ ...t, messages: t.messages.map(m => ({ ...m })) })),
  transactions: initialTransactions.map(tx => ({ ...tx })),
}

export function getRateForCategory(category: string): number {
  const found = store.rates.find(r => r.category.toLowerCase() === category.toLowerCase())
  return found ? found.pricePerKg : 5
}

export function updateRate(category: string, nextPrice: number): ScrapRate | null {
  const found = store.rates.find(r => r.category.toLowerCase() === category.toLowerCase())
  if (!found || !Number.isFinite(nextPrice) || nextPrice <= 0) return null
  const prev = found.pricePerKg
  found.prevPrice = prev
  found.pricePerKg = Math.round(nextPrice * 100) / 100
  const delta = prev > 0 ? ((found.pricePerKg - prev) / prev) * 100 : 0
  found.changePct = Math.round(delta * 10) / 10
  found.trend = delta > 0.1 ? 'up' : delta < -0.1 ? 'down' : 'steady'
  return found
}

export function ensureUser(userId: string, name?: string, email?: string): UserRecord {
  let existing = store.users.find(u => u.id === userId)
  if (!existing) {
    existing = {
      id: userId,
      name: name || 'Member',
      email: email || `${userId}@scrapconnect.local`,
      phone: '',
      greenPoints: userId.startsWith('demo-') ? 1240 : 0,
      role: 'user',
    }
    store.users.push(existing)
  }
  return existing
}

export function upsertUserProfile(
  userId: string,
  patch: Partial<UserRecord>
): UserRecord {
  const mappedId = userId === 'demo-user' ? 'u1' : userId
  let existing = store.users.find(u => u.id === mappedId || u.id === userId)
  if (!existing) {
    existing = {
      id: userId,
      name: patch.name || 'Member',
      email: patch.email || `${userId}@scrapconnect.local`,
      phone: patch.phone || '',
      greenPoints: userId.startsWith('demo-') ? 1240 : 0,
      role: patch.role || 'user',
    }
    store.users.push(existing)
  }
  if (typeof patch.name === 'string' && patch.name.trim()) existing.name = patch.name.trim()
  if (typeof patch.email === 'string' && patch.email.trim()) existing.email = patch.email.trim()
  if (typeof patch.phone === 'string') existing.phone = patch.phone.trim()
  if (typeof patch.altPhone === 'string') existing.altPhone = patch.altPhone.trim()
  if (typeof patch.altContactName === 'string') existing.altContactName = patch.altContactName.trim()
  if (typeof patch.photoUrl === 'string') existing.photoUrl = patch.photoUrl
  if (patch.accountType) existing.accountType = patch.accountType
  if (patch.role) existing.role = patch.role
  if (typeof patch.area === 'string') existing.area = patch.area.trim()
  if (typeof patch.city === 'string') existing.city = patch.city.trim()
  if (typeof patch.pinCode === 'string') existing.pinCode = patch.pinCode.trim()
  if (typeof patch.landmark === 'string') existing.landmark = patch.landmark.trim()
  if (typeof patch.address === 'string') existing.address = patch.address.trim()
  if (typeof patch.bio === 'string') existing.bio = patch.bio.trim()
  if (typeof patch.lat === 'number' && Number.isFinite(patch.lat)) existing.lat = patch.lat
  if (typeof patch.lng === 'number' && Number.isFinite(patch.lng)) existing.lng = patch.lng
  if (patch.payoutMethod) existing.payoutMethod = patch.payoutMethod
  if (typeof patch.upiId === 'string') existing.upiId = patch.upiId.trim()
  if (typeof patch.preferredSlot === 'string') existing.preferredSlot = patch.preferredSlot
  if (typeof patch.notifySms === 'boolean') existing.notifySms = patch.notifySms
  if (typeof patch.notifyRates === 'boolean') existing.notifyRates = patch.notifyRates
  if (typeof patch.vehicle === 'string') existing.vehicle = patch.vehicle.trim()
  if (typeof patch.licenseNo === 'string') existing.licenseNo = patch.licenseNo.trim()
  if (Array.isArray(patch.areas)) existing.areas = patch.areas.map(a => String(a).trim()).filter(Boolean)
  if (typeof patch.capacityKg === 'number' && Number.isFinite(patch.capacityKg)) existing.capacityKg = patch.capacityKg
  if (typeof patch.profileCompleted === 'boolean') {
    existing.profileCompleted = patch.profileCompleted
  } else if (existing.name && existing.phone) {
    existing.profileCompleted = true
  }

  if (existing.role === 'collector') {
    const colId = userId === 'demo-collector' ? 'c1' : userId
    let col = store.collectors.find(c => c.id === colId)
    if (!col) {
      col = {
        id: colId,
        name: existing.name,
        vehicle: existing.vehicle || 'Pending vehicle details',
        phone: existing.phone,
        areas: existing.areas || [],
        verified: false,
        rating: 0,
        completedCount: 0,
        capacityKg: existing.capacityKg,
      }
      store.collectors.push(col)
    } else {
      if (existing.name) col.name = existing.name
      if (existing.vehicle) col.vehicle = existing.vehicle
      if (existing.phone) col.phone = existing.phone
      if (existing.areas?.length) col.areas = existing.areas
      if (existing.capacityKg) col.capacityKg = existing.capacityKg
    }
  }
  return existing
}

export function createPickup(payload: {
  userId: string
  userName?: string
  scrapType: string
  items?: PickupItem[]
  weight: number
  address: string
  area?: string
  date: string
  time?: string
  notes?: string
  lat: number
  lng: number
  voucherCode?: string
  payoutPreference?: 'cash' | 'cash_tree_split' | 'points_3x' | 'eco_credit'
  upiId?: string
  expressPaidOnline?: boolean
  prepOptions?: string[]
}): PickupRecord {
  const items = Array.isArray(payload.items) && payload.items.length > 0 ? payload.items : undefined
  const totalWeight = items
    ? Math.max(1, items.reduce((sum, item) => sum + Number(item.weight || 0), 0))
    : Math.max(1, Number(payload.weight || 1))
  const rawPrice = items
    ? Math.round(items.reduce((sum, item) => sum + Number(item.weight || 0) * getRateForCategory(item.category), 0))
    : Math.round(totalWeight * getRateForCategory(payload.scrapType))
  let discount = 0
  if (payload.voucherCode === 'SOLAR500') discount = 500
  else if (payload.voucherCode === 'GOALCRUSHER') discount = 300
  else if (payload.voucherCode === 'ECOSTORE250') discount = 250
  else if (payload.voucherCode === 'CIRCLE150') discount = 150
  else if (payload.voucherCode === 'WHEEL75') discount = 75
  else if (payload.voucherCode === 'GREEN50') discount = 50
  else if (payload.voucherCode === 'WHEEL40') discount = 40
  else if (payload.voucherCode === 'SPINBOOST10') discount = Math.max(25, Math.round(rawPrice * 0.1))
  else if (payload.voucherCode === 'METAL15') {
    const metalRe = /metal|copper|brass|aluminum|iron|steel|cable|e-waste|mobile|electronic|batter|appliance/i
    const qualifies = items ? items.some(i => metalRe.test(i.category)) : metalRe.test(payload.scrapType)
    discount = qualifies ? Math.round(rawPrice * 0.15) : 50
  }

  const prepOptions = Array.isArray(payload.prepOptions) ? payload.prepOptions : []
  const sortedBonus = prepOptions.includes('sorted') ? Math.round(rawPrice * 0.05) : 0
  const creditBonus = payload.payoutPreference === 'eco_credit' ? Math.round(rawPrice * 0.12) : 0

  const pickup: PickupRecord = {
    id: `P${Math.floor(200 + Math.random() * 799)}-${Date.now().toString().slice(-3)}`,
    userId: payload.userId,
    userName: payload.userName,
    collectorId: null,
    scrapType: items && items.length > 1 ? `${items[0].category} +${items.length - 1} more` : payload.scrapType,
    items,
    weight: totalWeight,
    status: 'scheduled',
    price: rawPrice + discount + sortedBonus + creditBonus,
    voucherCode: payload.voucherCode || undefined,
    discount: discount || undefined,
    payoutPreference: payload.payoutPreference || 'cash',
    upiId: payload.upiId?.trim() || undefined,
    expressPaidOnline: Boolean(payload.expressPaidOnline),
    prepOptions: prepOptions.length ? prepOptions : undefined,
    handoffPin: String(Math.floor(1000 + Math.random() * 9000)),
    pinVerified: false,
    address: payload.address.trim(),
    area: (payload.area || payload.address).trim(),
    date: payload.date,
    time: payload.time || '10:00',
    notes: payload.notes?.trim() || undefined,
    lat: Number(payload.lat),
    lng: Number(payload.lng),
    createdAt: new Date().toISOString(),
  }
  store.pickups.unshift(pickup)
  return pickup
}

export function updatePickup(
  id: string,
  patch: {
    status?: 'scheduled' | 'completed' | 'cancelled'
    collectorId?: string | null
    date?: string
    time?: string
    actualWeight?: number
    rating?: number
    review?: string
    tags?: string[]
  }
): PickupRecord | null {
  const pickup = store.pickups.find(p => p.id === id)
  if (!pickup) return null

  if (patch.collectorId !== undefined) {
    pickup.collectorId = patch.collectorId
  }
  if (patch.date) pickup.date = patch.date
  if (patch.time) pickup.time = patch.time

  if (patch.status === 'cancelled' && pickup.status === 'scheduled') {
    pickup.status = 'cancelled'
  }

  if (patch.status === 'completed' && pickup.status !== 'completed') {
    const weighed = Number(patch.actualWeight)
    if (Number.isFinite(weighed) && weighed > 0) {
      const ratio = weighed / Math.max(1, pickup.weight)
      pickup.actualWeight = Math.round(weighed * 10) / 10
      pickup.weight = pickup.actualWeight
      pickup.price = Math.round(pickup.price * ratio)
    } else {
      pickup.actualWeight = pickup.weight
    }
    pickup.status = 'completed'
    pickup.completedAt = new Date().toISOString()

    const user = ensureUser(pickup.userId, pickup.userName)
    const multiplier = pickup.payoutPreference === 'points_3x' ? 3 : pickup.payoutPreference === 'cash_tree_split' ? 2 : 1
    user.greenPoints += Math.round(pickup.weight * 12) * multiplier

    store.transactions.unshift({
      id: `TXN-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
      userId: user.id,
      pickupId: pickup.id,
      type: 'payout_credit',
      method: pickup.payoutPreference === 'eco_credit' ? 'Eco-Wallet' : 'UPI',
      upiOrRef: pickup.upiId || user.upiId || `${user.id}@okicici`,
      amount: pickup.price,
      direction: 'credit',
      status: 'completed',
      description: `${pickup.scrapType} (${pickup.weight} kg) settlement · Pickup ${pickup.id}`,
      createdAt: new Date().toISOString(),
    })

    if (pickup.collectorId) {
      const collector = store.collectors.find(c => c.id === pickup.collectorId)
      if (collector) collector.completedCount += 1
    }
  }

  if (typeof patch.rating === 'number' && patch.rating >= 1 && patch.rating <= 5) {
    const clamped = Math.round(patch.rating)
    pickup.rating = clamped
    if (typeof patch.review === 'string') pickup.review = patch.review.trim()
    const col = pickup.collectorId ? store.collectors.find(c => c.id === pickup.collectorId) : undefined
    submitCommunityReview({
      targetType: col ? 'collector' : 'pickup',
      targetId: col ? col.id : pickup.id,
      targetName: col ? `${col.name} (${col.vehicle})` : `${pickup.scrapType} Pickup`,
      pickupId: pickup.id,
      userId: pickup.userId,
      userName: pickup.userName,
      rating: clamped,
      comment: pickup.review || '',
      tags: Array.isArray(patch.tags) ? patch.tags : ['On-time arrival'],
    })
  }

  return pickup
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const a = s1 * s1 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * s2 * s2
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100
}

export function getPickupTracking(id: string) {
  const pickup = store.pickups.find(p => p.id === id)
  if (!pickup) return null

  const collector = pickup.collectorId
    ? store.collectors.find(c => c.id === pickup.collectorId) || null
    : null
  const customer = store.users.find(u => u.id === pickup.userId || (pickup.userId === 'demo-user' && u.id === 'u1')) || null

  const collectorLat = typeof pickup.collectorLat === 'number' ? pickup.collectorLat : pickup.lat + 0.018
  const collectorLng = typeof pickup.collectorLng === 'number' ? pickup.collectorLng : pickup.lng - 0.016
  const distanceKm = haversineKm(collectorLat, collectorLng, pickup.lat, pickup.lng)
  const etaMinutes = pickup.trackingStage === 'arrived' || pickup.trackingStage === 'weighing' || pickup.trackingStage === 'completed'
    ? 0
    : Math.max(1, Math.round(distanceKm * 3.5))

  return {
    pickupId: pickup.id,
    status: pickup.status,
    trackingStage: pickup.trackingStage || (pickup.collectorId ? 'assigned' : 'assigned'),
    scrapType: pickup.scrapType,
    weight: pickup.weight,
    price: pickup.price,
    date: pickup.date,
    time: pickup.time,
    address: pickup.address || pickup.area,
    userLocation: { lat: pickup.lat, lng: pickup.lng },
    collectorLocation: pickup.collectorId ? { lat: collectorLat, lng: collectorLng } : null,
    distanceKm,
    etaMinutes,
    lastPingAt: pickup.lastPingAt || pickup.createdAt,
    handoffPin: pickup.handoffPin || '4829',
    pinVerified: Boolean(pickup.pinVerified),
    liveNote: pickup.liveNote || '',
    user: {
      name: customer?.name || pickup.userName || 'Customer',
      phone: customer?.phone || '',
      altPhone: customer?.altPhone || '',
    },
    collector: collector
      ? {
          id: collector.id,
          name: collector.name,
          vehicle: collector.vehicle,
          phone: collector.phone,
          rating: collector.rating,
        }
      : null,
  }
}

export function updatePickupTracking(
  id: string,
  payload: {
    collectorLat?: number
    collectorLng?: number
    userLat?: number
    userLng?: number
    trackingStage?: 'assigned' | 'en_route' | 'arrived' | 'weighing' | 'completed'
    liveNote?: string
    verifyPin?: string
    advanceStep?: boolean
    resetDemo?: boolean
  }
) {
  const pickup = store.pickups.find(p => p.id === id)
  if (!pickup) return null

  if (!pickup.collectorId) {
    pickup.collectorId = 'c1'
  }
  if (!pickup.handoffPin) {
    pickup.handoffPin = '4829'
  }

  if (typeof payload.liveNote === 'string') {
    pickup.liveNote = payload.liveNote.trim().slice(0, 140)
  }
  if (typeof payload.verifyPin === 'string' && payload.verifyPin.trim()) {
    if (payload.verifyPin.trim() === pickup.handoffPin) {
      pickup.pinVerified = true
    }
  }

  if (typeof payload.userLat === 'number' && Number.isFinite(payload.userLat)) pickup.lat = payload.userLat
  if (typeof payload.userLng === 'number' && Number.isFinite(payload.userLng)) pickup.lng = payload.userLng
  if (typeof payload.collectorLat === 'number' && Number.isFinite(payload.collectorLat)) pickup.collectorLat = payload.collectorLat
  if (typeof payload.collectorLng === 'number' && Number.isFinite(payload.collectorLng)) pickup.collectorLng = payload.collectorLng

  if (payload.resetDemo) {
    pickup.collectorLat = pickup.lat + 0.018
    pickup.collectorLng = pickup.lng - 0.016
    pickup.trackingStage = 'en_route'
    pickup.pinVerified = false
  } else if (payload.advanceStep) {
    const curLat = typeof pickup.collectorLat === 'number' ? pickup.collectorLat : pickup.lat + 0.018
    const curLng = typeof pickup.collectorLng === 'number' ? pickup.collectorLng : pickup.lng - 0.016
    const nextLat = curLat + (pickup.lat - curLat) * 0.35
    const nextLng = curLng + (pickup.lng - curLng) * 0.35
    pickup.collectorLat = Number(nextLat.toFixed(6))
    pickup.collectorLng = Number(nextLng.toFixed(6))
    const dist = haversineKm(pickup.collectorLat, pickup.collectorLng, pickup.lat, pickup.lng)
    if (dist < 0.08) {
      pickup.collectorLat = pickup.lat
      pickup.collectorLng = pickup.lng
      pickup.trackingStage = 'arrived'
    } else {
      pickup.trackingStage = 'en_route'
    }
  }

  if (payload.trackingStage) {
    pickup.trackingStage = payload.trackingStage
    if (payload.trackingStage === 'arrived') {
      pickup.collectorLat = pickup.lat
      pickup.collectorLng = pickup.lng
    }
  }

  pickup.lastPingAt = new Date().toISOString()
  return getPickupTracking(id)
}

export function getUserRewards(userId: string) {
  const mappedId = userId === 'demo-user' ? 'u1' : userId
  return store.rewardClaims.filter(r => r.userId === mappedId || r.userId === userId)
}

export function claimReward(payload: {
  userId: string
  rewardId: string
  code: string
  title: string
  bonusPoints?: number
}): { claim: RewardClaimRecord; greenPoints: number } {
  const mappedId = payload.userId === 'demo-user' ? 'u1' : payload.userId
  const user = ensureUser(mappedId)
  const existing = store.rewardClaims.find(
    r => (r.userId === mappedId || r.userId === payload.userId) && r.rewardId === payload.rewardId
  )
  if (existing) {
    return { claim: existing, greenPoints: user.greenPoints }
  }
  const claim: RewardClaimRecord = {
    id: `RWD-${Date.now().toString().slice(-5)}`,
    userId: mappedId,
    rewardId: payload.rewardId,
    code: payload.code,
    title: payload.title,
    bonusPoints: payload.bonusPoints || 0,
    claimedAt: new Date().toISOString(),
  }
  store.rewardClaims.unshift(claim)
  if (payload.bonusPoints && payload.bonusPoints > 0) {
    user.greenPoints += payload.bonusPoints
  }
  return { claim, greenPoints: user.greenPoints }
}

function normalizeActorId(userId?: string): string {
  const raw = String(userId || 'guest').trim() || 'guest'
  return raw === 'demo-user' ? 'u1' : raw === 'demo-collector' ? 'c1' : raw
}

function makeLikeKey(targetType: string, targetId: string): string {
  return `${targetType}:${targetId}`
}

function deterministicBaseLikes(targetType: string, targetId: string): number {
  let hash = 0
  const seed = `${targetType}:${targetId}`
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 97
  }
  return targetType === 'hub' ? 38 + hash : 18 + (hash % 45)
}

export function getCommunityEngagement(options: {
  targetType?: string
  targetId?: string
  userId?: string
} = {}) {
  const actorId = normalizeActorId(options.userId)
  const targetType = options.targetType ? String(options.targetType) : ''
  const targetId = options.targetId ? String(options.targetId) : ''

  const reviews = store.reviews
    .filter(r => {
      if (targetType && r.targetType !== targetType) return false
      if (targetId && r.targetId !== targetId) return false
      return true
    })
    .map(r => ({
      ...r,
      helpfulCount: r.helpfulBy.length,
      helpfulByMe: r.helpfulBy.includes(actorId),
    }))

  const likesSummary: Record<string, { count: number; liked: boolean }> = {}
  for (const [key, bucket] of Object.entries(store.likes)) {
    if (targetType && !key.startsWith(`${targetType}:`)) continue
    if (targetId && key !== makeLikeKey(targetType, targetId)) continue
    likesSummary[key] = {
      count: bucket.baseCount + bucket.likedBy.length,
      liked: bucket.likedBy.includes(actorId),
    }
  }

  if (targetType && targetId && !likesSummary[makeLikeKey(targetType, targetId)]) {
    const key = makeLikeKey(targetType, targetId)
    likesSummary[key] = {
      count: deterministicBaseLikes(targetType, targetId),
      liked: false,
    }
  }

  const ratingCount = reviews.length
  const avgRating = ratingCount
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
    : 0

  return {
    reviews,
    likes: likesSummary,
    stats: {
      totalReviews: ratingCount,
      avgRating,
    },
  }
}

export function toggleEntityLike(payload: {
  targetType: ReviewTargetType | 'showcase'
  targetId: string
  userId?: string
}) {
  const actorId = normalizeActorId(payload.userId)
  const key = makeLikeKey(payload.targetType, payload.targetId)
  let bucket = store.likes[key]
  if (!bucket) {
    bucket = {
      baseCount: deterministicBaseLikes(payload.targetType, payload.targetId),
      likedBy: [],
    }
    store.likes[key] = bucket
  }
  const idx = bucket.likedBy.indexOf(actorId)
  let liked = false
  if (idx >= 0) {
    bucket.likedBy.splice(idx, 1)
    liked = false
  } else {
    bucket.likedBy.push(actorId)
    liked = true
  }

  if (payload.targetType === 'collector') {
    const collector = store.collectors.find(c => c.id === payload.targetId)
    if (collector) collector.likesCount = bucket.baseCount + bucket.likedBy.length
  }

  return {
    key,
    targetType: payload.targetType,
    targetId: payload.targetId,
    liked,
    count: bucket.baseCount + bucket.likedBy.length,
  }
}

export function submitCommunityReview(payload: {
  targetType: ReviewTargetType
  targetId: string
  targetName: string
  pickupId?: string
  userId?: string
  userName?: string
  rating: number
  comment?: string
  tags?: string[]
}) {
  const actorId = normalizeActorId(payload.userId)
  const clampedRating = Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 5)))
  const cleanTags = Array.isArray(payload.tags)
    ? payload.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 6)
    : []
  const cleanComment = String(payload.comment || '').trim()

  const existing = store.reviews.find(
    r =>
      r.userId === actorId &&
      r.targetType === payload.targetType &&
      r.targetId === payload.targetId &&
      (payload.pickupId ? r.pickupId === payload.pickupId : true)
  )

  let record: ReviewRecord
  if (existing && (payload.pickupId || payload.targetType !== 'platform')) {
    existing.rating = clampedRating
    if (cleanComment) existing.comment = cleanComment
    if (cleanTags.length) existing.tags = cleanTags
    existing.createdAt = new Date().toISOString()
    record = existing
  } else {
    record = {
      id: `REV-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
      targetType: payload.targetType,
      targetId: payload.targetId,
      targetName: payload.targetName || payload.targetId,
      pickupId: payload.pickupId,
      userId: actorId,
      userName: payload.userName?.trim() || 'Community Member',
      rating: clampedRating,
      comment: cleanComment || `Rated ${clampedRating}/5 stars.`,
      tags: cleanTags,
      helpfulBy: [],
      createdAt: new Date().toISOString(),
    }
    store.reviews.unshift(record)
  }

  // Sync pickup & collector aggregate rating if applicable
  if (payload.pickupId) {
    const pickup = store.pickups.find(p => p.id === payload.pickupId)
    if (pickup) {
      pickup.rating = clampedRating
      if (cleanComment) pickup.review = cleanComment
    }
  }
  if (payload.targetType === 'collector' || payload.pickupId) {
    const colId = payload.targetType === 'collector'
      ? payload.targetId
      : store.pickups.find(p => p.id === payload.pickupId)?.collectorId
    if (colId) {
      const col = store.collectors.find(c => c.id === colId)
      if (col) {
        const colReviews = store.reviews.filter(r => r.targetType === 'collector' && r.targetId === colId)
        if (colReviews.length) {
          col.rating = Math.round((colReviews.reduce((s, r) => s + r.rating, 0) / colReviews.length) * 10) / 10
        }
      }
    }
  }
  if (payload.targetType === 'hub') {
    const hub = store.centers.find(c => c.id === payload.targetId)
    if (hub) {
      const hubReviews = store.reviews.filter(r => r.targetType === 'hub' && r.targetId === payload.targetId)
      if (hubReviews.length) {
        const weighted = (hub.rating * 8 + hubReviews.reduce((s, r) => s + r.rating, 0)) / (8 + hubReviews.length)
        hub.rating = Math.round(weighted * 10) / 10
      }
    }
  }

  return {
    review: {
      ...record,
      helpfulCount: record.helpfulBy.length,
      helpfulByMe: record.helpfulBy.includes(actorId),
    },
  }
}

export function toggleReviewHelpful(reviewId: string, userId?: string) {
  const actorId = normalizeActorId(userId)
  const review = store.reviews.find(r => r.id === reviewId)
  if (!review) return null
  const idx = review.helpfulBy.indexOf(actorId)
  let helpfulByMe = false
  if (idx >= 0) {
    review.helpfulBy.splice(idx, 1)
  } else {
    review.helpfulBy.push(actorId)
    helpfulByMe = true
  }
  return {
    reviewId: review.id,
    helpfulCount: review.helpfulBy.length,
    helpfulByMe,
  }
}

export function toggleReviewThank(reviewId: string) {
  const review = store.reviews.find(r => r.id === reviewId)
  if (!review) return null
  review.collectorThanked = !review.collectorThanked
  return {
    reviewId: review.id,
    collectorThanked: Boolean(review.collectorThanked),
  }
}

export function getSupportTickets(userId?: string) {
  if (!userId) return store.supportTickets
  const mappedId = normalizeActorId(userId)
  return store.supportTickets.filter(t => t.userId === mappedId || t.userId === userId)
}

export function createSupportTicket(payload: {
  userId: string
  userName?: string
  email?: string
  category?: SupportTicketRecord['category']
  priority?: SupportTicketRecord['priority']
  pickupId?: string
  subject: string
  message: string
}): SupportTicketRecord {
  const mappedId = normalizeActorId(payload.userId)
  const now = new Date().toISOString()
  const ticketId = `SUP-${Math.floor(8500 + Math.random() * 1400)}`
  const category = payload.category || 'Other'
  const senderName = payload.userName?.trim() || 'Member'

  let autoReply = 'Ticket received by Scrap Connect Care. A specialist is reviewing your request and will follow up within 15 minutes.'
  if (category === 'Pickup delay') {
    autoReply = 'We checked your route dispatch queue and alerted the area coordinator for live ETA confirmation.'
  } else if (category === 'Online UPI / payout') {
    autoReply = 'Online UPI & bank settlement team notified. We will verify your TXN reference and release any pending payout immediately.'
  } else if (category === 'Weighbridge & rate check') {
    autoReply = 'Digital weighbridge audit logged. Any difference against published live ₹/kg rates will be credited to your wallet.'
  }

  const ticket: SupportTicketRecord = {
    id: ticketId,
    userId: mappedId,
    userName: senderName,
    email: payload.email?.trim() || `${mappedId}@scrapconnect.local`,
    category,
    priority: payload.priority || 'normal',
    pickupId: payload.pickupId?.trim() || undefined,
    subject: payload.subject.trim(),
    status: 'open',
    messages: [
      {
        id: `MSG-${Date.now()}-1`,
        sender: 'user',
        senderName,
        text: payload.message.trim(),
        createdAt: now,
      },
      {
        id: `MSG-${Date.now()}-2`,
        sender: 'support',
        senderName: 'Scrap Connect Care Desk',
        text: autoReply,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
  store.supportTickets.unshift(ticket)
  return ticket
}

export function replySupportTicket(ticketId: string, payload: {
  sender: 'user' | 'support'
  senderName: string
  text: string
}) {
  const ticket = store.supportTickets.find(t => t.id === ticketId)
  if (!ticket) return null
  const now = new Date().toISOString()
  ticket.messages.push({
    id: `MSG-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
    sender: payload.sender,
    senderName: payload.senderName.trim() || (payload.sender === 'support' ? 'Scrap Connect Care' : ticket.userName),
    text: payload.text.trim(),
    createdAt: now,
  })
  if (payload.sender === 'support' && ticket.status === 'open') {
    ticket.status = 'in_review'
  }
  ticket.updatedAt = now
  return ticket
}

export function updateSupportTicketStatus(ticketId: string, status: SupportTicketRecord['status']) {
  const ticket = store.supportTickets.find(t => t.id === ticketId)
  if (!ticket) return null
  ticket.status = status
  ticket.updatedAt = new Date().toISOString()
  return ticket
}

export function getWalletOverview(userId: string) {
  const mappedId = normalizeActorId(userId)
  const user = store.users.find(u => u.id === mappedId || u.id === userId)
  const txList = store.transactions.filter(tx => tx.userId === mappedId || tx.userId === userId)

  const totalCredits = txList.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalOnlinePayments = txList
    .filter(t => t.type === 'online_payment' || t.type === 'carbon_offset')
    .reduce((s, t) => s + t.amount, 0)
  const totalWithdrawn = txList.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)
  const walletBalance = Math.max(0, totalCredits - totalOnlinePayments - totalWithdrawn)

  return {
    walletBalance,
    totalCredits,
    totalOnlinePayments,
    totalWithdrawn,
    savedUpiId: user?.upiId || (mappedId === 'u1' ? 'priya@okicici' : ''),
    preferredPayoutMethod: user?.payoutMethod || 'UPI',
    transactions: txList,
  }
}

export function processOnlineCheckout(payload: {
  userId: string
  amount: number
  method: PaymentTransactionRecord['method']
  upiOrRef?: string
  description: string
  type?: PaymentTransactionRecord['type']
  pickupId?: string
}) {
  const mappedId = normalizeActorId(payload.userId)
  ensureUser(mappedId)
  const cleanAmount = Math.max(1, Math.round(Number(payload.amount) || 0))
  const tx: PaymentTransactionRecord = {
    id: `TXN-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
    userId: mappedId,
    pickupId: payload.pickupId,
    type: payload.type || 'online_payment',
    method: payload.method || 'UPI',
    upiOrRef: payload.upiOrRef?.trim() || `PAY-${Math.floor(100000 + Math.random() * 899999)}`,
    amount: cleanAmount,
    direction: 'debit',
    status: 'completed',
    description: payload.description.trim(),
    createdAt: new Date().toISOString(),
  }
  store.transactions.unshift(tx)
  return {
    transaction: tx,
    overview: getWalletOverview(mappedId),
  }
}

export function withdrawWalletToOnline(payload: {
  userId: string
  amount: number
  method: 'UPI' | 'Bank Transfer'
  upiOrRef: string
}) {
  const mappedId = normalizeActorId(payload.userId)
  const overview = getWalletOverview(mappedId)
  const cleanAmount = Math.round(Number(payload.amount) || 0)
  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
    return { error: 'Enter a valid withdrawal amount greater than ₹0.' }
  }
  if (cleanAmount > overview.walletBalance) {
    return { error: `Requested ₹${cleanAmount} exceeds available balance (₹${overview.walletBalance}).` }
  }
  const tx: PaymentTransactionRecord = {
    id: `TXN-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
    userId: mappedId,
    type: 'withdrawal',
    method: payload.method || 'UPI',
    upiOrRef: payload.upiOrRef.trim(),
    amount: cleanAmount,
    direction: 'debit',
    status: 'completed',
    description: `Instant online withdrawal to ${payload.upiOrRef.trim()}`,
    createdAt: new Date().toISOString(),
  }
  store.transactions.unshift(tx)
  const user = store.users.find(u => u.id === mappedId)
  if (user && payload.method === 'UPI' && payload.upiOrRef.includes('@')) {
    user.upiId = payload.upiOrRef.trim()
  }
  return {
    transaction: tx,
    overview: getWalletOverview(mappedId),
  }
}

export function buildPickupsCsv(rows: PickupRecord[]): string {
  const escape = (val: unknown) => {
    const str = String(val ?? '')
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const header = ['ID', 'Date', 'Time', 'Category', 'Weight (kg)', 'Payout (INR)', 'Status', 'Area', 'Address', 'Collector ID', 'Rating']
  const lines = rows.map(r => [
    r.id,
    r.date,
    r.time || '',
    r.scrapType,
    r.weight,
    r.price,
    r.status,
    r.area,
    r.address || r.area,
    r.collectorId || 'Unassigned',
    r.rating ?? '',
  ].map(escape).join(','))
  return [header.join(','), ...lines].join('\n')
}
