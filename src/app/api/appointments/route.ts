import { NextResponse } from 'next/server';
import { appointmentsStore } from '@/lib/store';
import { Appointment } from '@/types';
import { dispatchWhatsAppNotification } from '@/lib/whatsapp';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const stylist = searchParams.get('stylist');

  let list = appointmentsStore || [];

  if (date) {
    list = list.filter((a) => a.date === date);
  }
  if (stylist) {
    list = list.filter((a) => a.stylistName.toLowerCase() === stylist.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    appointments: list,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      serviceName,
      stylistName,
      date,
      timeSlot,
      price,
      paymentStatus,
      notes,
    } = body;

    if (!customerName || !customerPhone || !serviceName || !date || !timeSlot || !stylistName) {
      return NextResponse.json(
        { success: false, error: 'Missing required appointment fields (stylist, date, time slot, client name, and phone).' },
        { status: 400 }
      );
    }

    // 1. COLLISION DETECTION: Check if the exact stylist is already booked at the exact time slot and date!
    const isConflict = appointmentsStore.some(
      (app) =>
        app.status === 'confirmed' &&
        app.date === date &&
        app.timeSlot.trim().toLowerCase() === timeSlot.trim().toLowerCase() &&
        app.stylistName.trim().toLowerCase() === stylistName.trim().toLowerCase()
    );

    if (isConflict) {
      return NextResponse.json(
        {
          success: false,
          error: `Slot Conflict: ${stylistName} is already booked on ${date} at ${timeSlot}. Please select a different time window or another stylist.`,
          conflict: { stylistName, date, timeSlot },
        },
        { status: 409 }
      );
    }

    // Generate unique PRIZM booking reference
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `PRZ-${randomSuffix}`;

    const newAppointment: Appointment = {
      id: `app_${Date.now()}`,
      bookingRef,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail || '',
      serviceId: serviceId || 'custom',
      serviceName,
      stylistName,
      date,
      timeSlot,
      price: Number(price) || 1800,
      status: 'confirmed',
      paymentStatus: paymentStatus || 'pay_at_studio',
      whatsappSent: true,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    // Prepend to salon in-memory records
    appointmentsStore.unshift(newAppointment);

    // 2. DISPATCH AUTOMATIC WHATSAPP PAYLOAD TO ALL 3 PARTIES (Manager, Stylist, Customer)
    const waResult = await dispatchWhatsAppNotification(newAppointment);

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      whatsapp: waResult,
      message: `Appointment confirmed! Automated WhatsApp dispatched to Customer, Stylist (${stylistName}), and Studio Manager.`,
    });
  } catch (error) {
    console.error('Failed to create appointment', error);
    return NextResponse.json({ success: false, error: 'Failed to process booking' }, { status: 500 });
  }
}
