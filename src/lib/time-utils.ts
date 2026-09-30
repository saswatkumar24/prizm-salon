import { AVAILABLE_SLOTS } from './data';

/**
 * Parses time strings like "10:30 AM", "01:15 PM", "14:30" to total minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();

  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const parts = clean.replace(/(AM|PM)/g, '').trim().split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight back to 12-hour formatted time (e.g. 795 -> "01:15 PM").
 */
export function minutesToTimeString(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const mins = norm % 60;

  const isPM = hours24 >= 12;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  const hh = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  const mm = mins < 10 ? `0${mins}` : `${mins}`;
  const period = isPM ? 'PM' : 'AM';

  return `${hh}:${mm} ${period}`;
}

/**
 * Given a start time and duration (multiples of 30 mins), calculates the end time
 * and finds all matching standard salon slots that fall within or overlap that window.
 */
export function calculateBlockedSlots(startTimeStr: string, durationMinutes: number): {
  endTimeStr: string;
  blockedSlots: string[];
} {
  const startMins = timeStringToMinutes(startTimeStr);
  const endMins = startMins + durationMinutes;
  const endTimeStr = minutesToTimeString(endMins);

  // Standard slot duration in PRIZM is ~45 to 60 mins.
  // A slot is blocked if:
  // 1. The slot start time is within the walk-in window [startMins, endMins)
  // 2. Or the slot starts slightly before but extends into the walk-in window
  const blockedSlots = AVAILABLE_SLOTS.filter((slot) => {
    const slotMins = timeStringToMinutes(slot);
    const slotEstimatedEnd = slotMins + 45;
    return (
      (slotMins >= startMins && slotMins < endMins) ||
      (slotMins < startMins && slotEstimatedEnd > startMins + 10)
    );
  });

  return { endTimeStr, blockedSlots };
}

/**
 * Formats a Date object to YYYY-MM-DD in LOCAL timezone (preventing UTC date shift issues).
 */
export function getLocalTodayString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a slot has already passed in time.
 */
export function isSlotInPast(slotTimeStr: string, dateStr: string): boolean {
  if (!dateStr || !slotTimeStr) return false;
  const todayStr = getLocalTodayString();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeStringToMinutes(slotTimeStr);
  return slotMinutes <= currentMinutes;
}

/**
 * 2-HOUR ADVANCE NOTICE RULE:
 * For today's date, slots starting less than 2 hours from current local time are blocked for online booking.
 * For future dates, returns false.
 */
export function isSlotRestrictedBy2HourNotice(slotTimeStr: string, dateStr: string): boolean {
  if (!dateStr || !slotTimeStr) return false;

  const todayStr = getLocalTodayString();

  // 2-hour advance notice ONLY applies to today's date
  if (dateStr !== todayStr) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = currentMinutes + 120; // 2 hours from now
  const slotMinutes = timeStringToMinutes(slotTimeStr);

  return slotMinutes < cutoffMinutes;
}

