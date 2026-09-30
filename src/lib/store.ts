import { Appointment, UserProfile, StylistSchedule, WalkInSession } from '@/types';
import { INITIAL_APPOINTMENTS, DEFAULT_SCHEDULES } from './data';

// Global stores in memory (persists during server runtime)
declare global {
  var __PRIZM_APPOINTMENTS: Appointment[] | undefined;
  var __PRIZM_OTPS: Map<string, { code: string; expiresAt: number; firstName?: string; lastName?: string }> | undefined;
  var __PRIZM_USERS: Map<string, UserProfile> | undefined;
  var __PRIZM_SCHEDULES: Record<string, StylistSchedule> | undefined;
  var __PRIZM_WALKINS: WalkInSession[] | undefined;
}

if (!global.__PRIZM_APPOINTMENTS) {
  global.__PRIZM_APPOINTMENTS = [...INITIAL_APPOINTMENTS];
}

if (!global.__PRIZM_OTPS) {
  global.__PRIZM_OTPS = new Map();
}

if (!global.__PRIZM_USERS) {
  global.__PRIZM_USERS = new Map();
}

if (!global.__PRIZM_SCHEDULES) {
  global.__PRIZM_SCHEDULES = JSON.parse(JSON.stringify(DEFAULT_SCHEDULES));
}

if (!global.__PRIZM_WALKINS) {
  global.__PRIZM_WALKINS = [];
}

export const appointmentsStore = global.__PRIZM_APPOINTMENTS;
export const otpsStore = global.__PRIZM_OTPS;
export const usersStore = global.__PRIZM_USERS;
export const schedulesStore = global.__PRIZM_SCHEDULES;
export const walkInsStore = global.__PRIZM_WALKINS;
