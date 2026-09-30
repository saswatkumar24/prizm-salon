import { NextResponse } from 'next/server';
import { schedulesStore } from '@/lib/store';
import { AVAILABLE_SLOTS, STYLISTS } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stylistId = searchParams.get('stylistId');
  const dateStr = searchParams.get('date');

  if (!schedulesStore) {
    return NextResponse.json({ success: false, error: 'Schedule store not initialized' }, { status: 500 });
  }

  // If specific stylist and date are requested, calculate available slots
  if (stylistId && dateStr) {
    const schedule = schedulesStore[stylistId];
    if (!schedule) {
      return NextResponse.json({
        success: true,
        isWorking: true,
        availableSlots: AVAILABLE_SLOTS,
      });
    }

    // Check specific date override first
    if (schedule.dateOverrides && schedule.dateOverrides[dateStr]) {
      const override = schedule.dateOverrides[dateStr];
      return NextResponse.json({
        success: true,
        isWorking: override.isWorking,
        reason: override.reason || 'Schedule Override',
        availableSlots: override.isWorking ? (override.customSlots || AVAILABLE_SLOTS) : [],
      });
    }

    // Check day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();

    const dayRule = schedule.weeklySchedule[dayOfWeek];
    if (!dayRule || !dayRule.isWorking) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return NextResponse.json({
        success: true,
        isWorking: false,
        reason: dayRule?.notes || `Stylist does not work on ${dayNames[dayOfWeek]}s`,
        availableSlots: [],
      });
    }

    return NextResponse.json({
      success: true,
      isWorking: true,
      notes: dayRule.notes,
      availableSlots: dayRule.customSlots && dayRule.customSlots.length > 0 ? dayRule.customSlots : AVAILABLE_SLOTS,
    });
  }

  // Return full roster
  return NextResponse.json({
    success: true,
    schedules: schedulesStore,
    stylists: STYLISTS,
    allSlots: AVAILABLE_SLOTS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stylistId, dayOfWeek, isWorking, customSlots, notes, dateOverride, reason } = body;

    if (!stylistId || !schedulesStore) {
      return NextResponse.json({ success: false, error: 'stylistId is required' }, { status: 400 });
    }

    if (!schedulesStore[stylistId]) {
      schedulesStore[stylistId] = {
        stylistId,
        stylistName: STYLISTS.find((s) => s.id === stylistId)?.name || stylistId,
        weeklySchedule: {},
        dateOverrides: {},
      };
    }

    const schedule = schedulesStore[stylistId];

    // Case 1: Specific Date Override (e.g. Leave on 2026-10-05)
    if (dateOverride) {
      if (!schedule.dateOverrides) schedule.dateOverrides = {};
      schedule.dateOverrides[dateOverride] = {
        isWorking: Boolean(isWorking),
        customSlots: customSlots || undefined,
        reason: reason || (isWorking ? 'Custom Hours' : 'Leave / Studio Training'),
      };

      return NextResponse.json({
        success: true,
        message: `Date override updated for ${schedule.stylistName} on ${dateOverride}`,
        schedule,
      });
    }

    // Case 2: Weekly Shift Update (e.g. Day 4 Thursday Off)
    if (dayOfWeek !== undefined) {
      const dayNum = Number(dayOfWeek);
      schedule.weeklySchedule[dayNum] = {
        isWorking: Boolean(isWorking),
        customSlots: customSlots && customSlots.length > 0 ? customSlots : undefined,
        notes: notes || undefined,
      };

      return NextResponse.json({
        success: true,
        message: `Weekly schedule updated for ${schedule.stylistName}`,
        schedule,
      });
    }

    return NextResponse.json({ success: false, error: 'Provide dayOfWeek or dateOverride' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update schedule', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
