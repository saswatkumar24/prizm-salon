import { Service, Appointment, StylistSchedule } from '@/types';

export const SALON_INFO = {
  name: "PRIZM Salon",
  tagline: "Hair that bends every colour of the light.",
  subtext: "Architectural cutting, multi-tonal colour and skin rituals under a ceiling of neon. Pick a slot, pay online, walk in glowing.",
  address: "88 Neon Plaza, Level 4, Bandra West, Mumbai 400050",
  phone: "+91 78943 76562",
  whatsappNumber: "917894376562", // Studio Manager WhatsApp (+91 78943 76562)
  email: "hello@prizm.salon",
  timings: "Mon–Sat 10:00–21:00 · Sun by appointment",
  established: "Mumbai · Est. 2019 · Colour studio"
};

export const SERVICES: Service[] = [
  {
    id: "architectural-cut",
    name: "Architectural Cut",
    description: "Precision mapping and structural sculpting built around your bone structure. Includes consultation, wash and finish.",
    duration: "45 mins",
    price: 1800,
    category: "Cut",
    tag: "Signature"
  },
  {
    id: "prism-colour",
    name: "Prism Colour",
    description: "Hand-painted multi-tonal colour with low-alkaline botanical pigment that shifts with ambient studio light.",
    duration: "120 mins",
    price: 4500,
    category: "Colour",
    tag: "Trending"
  },
  {
    id: "chrome-hydration",
    name: "Chrome Hydration",
    description: "Steam-activated deep repair mask that locks in mirror gloss and intense cuticle moisture.",
    duration: "60 mins",
    price: 2200,
    category: "Ritual"
  },
  {
    id: "beard-sculpture",
    name: "Beard Sculpture",
    description: "Hot towel ritual finished with artisanal straight-razor detailing and organic beard oils.",
    duration: "30 mins",
    price: 950,
    category: "Grooming"
  },
  {
    id: "glass-facial",
    name: "Glass Facial",
    description: "Cold-pressed enzyme resurfacing with quartz roller lymphatic work for an unmistakable radiant sheen.",
    duration: "60 mins",
    price: 3200,
    category: "Skin"
  },
  {
    id: "bridal-suite",
    name: "Bridal Suite",
    description: "Full-day private styling ritual for you and four guests on our exclusive studio floor.",
    duration: "240 mins",
    price: 18000,
    category: "Package",
    tag: "VIP"
  }
];

export interface Stylist {
  id: string;
  name: string;
  role: string;
  rating: string;
  phone: string;
  isFeatured?: boolean;
}

// 3 Premier Stylists for the Studio
export const STYLISTS: Stylist[] = [
  { id: "swagat", name: "Swagat", role: "Creative Director & Master Stylist", phone: "7981262237", rating: "5.0", isFeatured: true },
  { id: "dev-k", name: "Dev K.", role: "Senior Art Director", phone: "7894376562", rating: "4.9" },
  { id: "sofia-v", name: "Sofia V.", role: "Master Colourist", phone: "7894376562", rating: "5.0" }
];

export interface StaffAccount {
  userId: string;
  name: string;
  role: 'manager' | 'stylist';
  stylistId?: string;
  phone: string;
  password: string;
}

// 1 Manager + 3 Stylists Accounts with ID & Password
export const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    userId: "manager_prizm",
    name: "Studio Manager",
    role: "manager",
    phone: "7894376562",
    password: "admin@2026"
  },
  {
    userId: "swagat_prizm",
    name: "Swagat",
    role: "stylist",
    stylistId: "swagat",
    phone: "7981262237",
    password: "swagat@2026"
  },
  {
    userId: "dev_prizm",
    name: "Dev K.",
    role: "stylist",
    stylistId: "dev-k",
    phone: "7894376562",
    password: "dev@2026"
  },
  {
    userId: "sofia_prizm",
    name: "Sofia V.",
    role: "stylist",
    stylistId: "sofia-v",
    phone: "7894376562",
    password: "sofia@2026"
  }
];

// Offline Walk-in Duration options in multiples of 30 mins
export const WALK_IN_DURATIONS = [
  { label: "30 Mins (0.5 hr)", minutes: 30 },
  { label: "60 Mins (1.0 hr)", minutes: 60 },
  { label: "90 Mins (1.5 hrs)", minutes: 90 },
  { label: "120 Mins (2.0 hrs)", minutes: 120 },
  { label: "150 Mins (2.5 hrs)", minutes: 150 },
  { label: "180 Mins (3.0 hrs)", minutes: 180 },
  { label: "240 Mins (4.0 hrs)", minutes: 240 },
];

export const AVAILABLE_SLOTS = [
  "10:30 AM",
  "11:45 AM",
  "01:15 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
  "06:45 PM",
  "08:00 PM"
];

/**
 * Default Weekly Schedule per stylist:
 * - 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
 * - Swagat: Off on Thursdays (4); On Tuesdays (2): works 3 morning slots (10:30 AM, 11:45 AM, 01:15 PM); Other days: full shift.
 */
export const DEFAULT_SCHEDULES: Record<string, StylistSchedule> = {
  swagat: {
    stylistId: "swagat",
    stylistName: "Swagat",
    weeklySchedule: {
      0: { isWorking: false, notes: "Studio Closed (Sun by appt)" },
      1: { isWorking: true }, // Monday
      2: {
        isWorking: true,
        customSlots: ["10:30 AM", "11:45 AM", "01:15 PM"], // Tuesday: Morning Shift Only
        notes: "Morning Shift (10:30 AM – 2:00 PM)"
      },
      3: { isWorking: true }, // Wednesday
      4: { isWorking: false, notes: "Weekly Off / Colour Lab Day" }, // Thursday: OFF
      5: { isWorking: true }, // Friday
      6: { isWorking: true }, // Saturday
    },
    dateOverrides: {}
  },
  "dev-k": {
    stylistId: "dev-k",
    stylistName: "Dev K.",
    weeklySchedule: {
      0: { isWorking: false },
      1: { isWorking: false, notes: "Weekly Off" },
      2: { isWorking: true },
      3: { isWorking: true },
      4: { isWorking: true },
      5: { isWorking: true },
      6: { isWorking: true },
    },
    dateOverrides: {}
  },
  "sofia-v": {
    stylistId: "sofia-v",
    stylistName: "Sofia V.",
    weeklySchedule: {
      0: { isWorking: false },
      1: { isWorking: true },
      2: { isWorking: true },
      3: { isWorking: false, notes: "Weekly Off" },
      4: { isWorking: true },
      5: { isWorking: true },
      6: { isWorking: true },
    },
    dateOverrides: {}
  }
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "app-1",
    bookingRef: "PRZ-7401",
    customerName: "Elena Rostova",
    customerPhone: "+91 98112 34567",
    serviceId: "chrome-hydration",
    serviceName: "Chrome Hydration",
    stylistName: "Dev K.",
    date: "2026-09-29",
    timeSlot: "02:30 PM",
    price: 2200,
    status: "confirmed",
    paymentStatus: "paid",
    whatsappSent: true,
    createdAt: "2026-09-28T14:30:00Z"
  },
  {
    id: "app-2",
    bookingRef: "PRZ-7402",
    customerName: "Marcus Thorne",
    customerPhone: "+91 97223 45678",
    serviceId: "architectural-cut",
    serviceName: "Architectural Cut",
    stylistName: "Swagat",
    date: "2026-09-29",
    timeSlot: "04:00 PM",
    price: 1800,
    status: "confirmed",
    paymentStatus: "paid",
    whatsappSent: true,
    createdAt: "2026-09-28T16:00:00Z"
  },
  {
    id: "app-3",
    bookingRef: "PRZ-7403",
    customerName: "Sofia Vance",
    customerPhone: "+91 99334 56789",
    serviceId: "prism-colour",
    serviceName: "Prism Colour",
    stylistName: "Sofia V.",
    date: "2026-09-29",
    timeSlot: "06:15 PM",
    price: 4500,
    status: "confirmed",
    paymentStatus: "pay_at_studio",
    whatsappSent: true,
    createdAt: "2026-09-28T18:15:00Z"
  }
];
