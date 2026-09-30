export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  category: 'Cut' | 'Colour' | 'Ritual' | 'Grooming' | 'Skin' | 'Package';
  tag?: string;
}

export interface Appointment {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  stylistName: string;
  date: string;
  timeSlot: string;
  price: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pay_at_studio';
  whatsappSent: boolean;
  notes?: string;
  isWalkIn?: boolean;
  createdAt: string;
}

export interface WalkInSession {
  id: string;
  bookingRef: string;
  stylistId: string;
  stylistName: string;
  clientIdentifier: string; // e.g. "Walk-in Guest" or client name
  serviceName: string;
  date: string;
  startTime: string; // e.g. "11:30 AM"
  durationMinutes: number; // Multiples of 30 mins: 30, 60, 90, 120...
  endTime: string; // e.g. "01:00 PM"
  blockedSlots: string[]; // Standard slots disabled on website
  amount: number;
  paymentStatus: 'paid' | 'pay_at_studio';
  notes?: string;
  whatsappSent: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: 'customer' | 'stylist' | 'manager';
  stylistId?: string;
  loginMethod: 'phone_otp' | 'google' | 'staff_pin' | 'staff_password';
}

export interface StylistSchedule {
  stylistId: string;
  stylistName: string;
  weeklySchedule: {
    [dayOfWeek: number]: {
      isWorking: boolean;
      customSlots?: string[];
      notes?: string;
    };
  };
  dateOverrides: {
    [dateStr: string]: {
      isWorking: boolean;
      customSlots?: string[];
      reason?: string;
    };
  };
}

export interface StaffCredential {
  userId: string;
  name: string;
  role: 'manager' | 'stylist';
  stylistId?: string;
  phone: string;
  passwordHash: string; // For security
}
