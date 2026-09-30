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
 * 2-HOUR ADVANCE NOTICE RULE:
 * For today's date, slots starting less than 2 hours from current local time are blocked/hidden.
 * For future dates, returns false (not restricted by 2-hour window).
 */
export function isSlotRestrictedBy2HourNotice(slotTimeStr: string, dateStr: string): boolean {
  if (!dateStr || !slotTimeStr) return false;

  const now = new Date();
  
  // Format today's date YYYY-MM-DD in local time
  const todayStr = now.toISOString().split('T')[0];

  // If booking is for tomorrow or future dates, 2-hour rule doesn't block it
  if (dateStr > todayStr) {
    return false;
  }

  // If booking is for past dates
  if (dateStr < todayStr) {
    return true;
  }

  // For today: Calculate current time in minutes + 120 minutes buffer (2 hours)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = currentMinutes + 120; // 2 hours advance notice

  const slotMinutes = timeStringToMinutes(slotTimeStr);

  return slotMinutes < cutoffMinutes;
}
