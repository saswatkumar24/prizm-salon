import { NextResponse } from 'next/server';
import { walkInsStore, appointmentsStore } from '@/lib/store';
import { STYLISTS } from '@/lib/data';
import { WalkInSession, Appointment } from '@/types';
import { calculateBlockedSlots } from '@/lib/time-utils';
import { dispatchWalkInWhatsAppNotification } from '@/lib/whatsapp';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const stylistId = searchParams.get('stylistId');

  let list = walkInsStore || [];

  if (date) {
    list = list.filter((w) => w.date === date);
  }
  if (stylistId) {
    list = list.filter((w) => w.stylistId.toLowerCase() === stylistId.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    walkIns: list,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      stylistId,
      clientIdentifier,
      serviceName,
      date,
      startTime,
      durationMinutes,
      amount,
      paymentStatus,
      notes,
    } = body;

    if (!stylistId || !date || !startTime || !durationMinutes) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required walk-in parameters (stylistId, date, startTime, durationMinutes).',
        },
        { status: 400 }
      );
    }

    // Restriction: Walk-in can only be added for Today or Yesterday
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (date !== todayStr && date !== yesterdayStr) {
      return NextResponse.json(
        {
          success: false,
          error: `Walk-in sessions can only be logged for today (${todayStr}) or yesterday (${yesterdayStr}). Future bookings must go through online appointments.`,
        },
        { status: 400 }
      );
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 30 || duration % 30 !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duration must be a multiple of 30 minutes (e.g. 30, 60, 90, 120, 150, 180 mins).',
        },
        { status: 400 }
      );
    }

    const stylist = STYLISTS.find((s) => s.id === stylistId) || STYLISTS[0];
    const stylistName = stylist.name;

    // Calculate end time and all overlapping standard salon slots
    const { endTimeStr, blockedSlots } = calculateBlockedSlots(startTime, duration);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `WLK-${randomSuffix}`;

    const newWalkIn: WalkInSession = {
      id: `walkin_${Date.now()}`,
      bookingRef,
      stylistId,
      stylistName,
      clientIdentifier: clientIdentifier || 'Walk-in Guest (In Chair)',
      serviceName: serviceName || 'Walk-in Hair Service',
      date,
      startTime,
      durationMinutes: duration,
      endTime: endTimeStr,
      blockedSlots,
      amount: Number(amount) || 0,
      paymentStatus: paymentStatus || 'paid',
      notes: notes || '',
      whatsappSent: true,
      createdAt: new Date().toISOString(),
    };

    // Save in walk-ins store
    walkInsStore.unshift(newWalkIn);

    // Synchronize with appointmentsStore so it immediately blocks online bookings
    // 1. Create main appointment record
    const primaryApp: Appointment = {
      id: `app_${newWalkIn.id}_main`,
      bookingRef,
      customerName: newWalkIn.clientIdentifier,
      customerPhone: 'Walk-in (Offline)',
      customerEmail: '',
      serviceId: 'walk-in',
      serviceName: newWalkIn.serviceName,
      stylistName,
      date,
      timeSlot: startTime,
      price: newWalkIn.amount,
      status: 'confirmed',
      paymentStatus: newWalkIn.paymentStatus,
      whatsappSent: true,
      isWalkIn: true,
      notes: `Walk-in: ${startTime} to ${endTimeStr} (${duration} mins). Blocked: ${blockedSlots.join(', ')}`,
      createdAt: new Date().toISOString(),
    };
    appointmentsStore.unshift(primaryApp);

    // 2. Also register placeholder blocks for any standard slot in blockedSlots that isn't startTime
    for (const slot of blockedSlots) {
      if (slot.trim().toUpperCase() !== startTime.trim().toUpperCase()) {
        const slotBlocker: Appointment = {
          id: `app_${newWalkIn.id}_slot_${slot.replace(/\s+/g, '')}`,
          bookingRef: `${bookingRef}-BLK`,
          customerName: `${newWalkIn.clientIdentifier} (In Chair)`,
          customerPhone: 'Walk-in (Offline)',
          customerEmail: '',
          serviceId: 'walk-in-blocked',
          serviceName: `${newWalkIn.serviceName} (Continuation)`,
          stylistName,
          date,
          timeSlot: slot,
          price: 0,
          status: 'confirmed',
          paymentStatus: newWalkIn.paymentStatus,
          whatsappSent: false,
          isWalkIn: true,
          notes: `Chair occupied by walk-in until ${endTimeStr}`,
          createdAt: new Date().toISOString(),
        };
        appointmentsStore.unshift(slotBlocker);
      }
    }

    // 3. Dispatch automated WhatsApp notification to Studio Manager
    await dispatchWalkInWhatsAppNotification(newWalkIn);

    return NextResponse.json({
      success: true,
      walkIn: newWalkIn,
      blockedSlots,
      endTime: endTimeStr,
      message: `Walk-in logged for ${stylistName} (${startTime} to ${endTimeStr}). Slots [${blockedSlots.join(', ')}] are now locked on the website!`,
    });
  } catch (error) {
    console.error('Failed to log walk-in session', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
