import { createClient } from '@supabase/supabase-js';
import { Appointment, WalkInSession, StylistSchedule } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false },
    })
  : null;

/**
 * Fetch appointments from Supabase (or fallback)
 */
export async function getSupabaseAppointments(filter?: { date?: string; stylistName?: string }): Promise<Appointment[] | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from('appointments').select('*').order('created_at', { ascending: false });

    if (filter?.date) {
      query = query.eq('date', filter.date);
    }
    if (filter?.stylistName) {
      query = query.ilike('stylist_name', `%${filter.stylistName}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[SUPABASE] Failed to fetch appointments:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      bookingRef: row.booking_ref,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email || '',
      serviceId: row.service_id,
      serviceName: row.service_name,
      stylistName: row.stylist_name,
      date: row.date,
      timeSlot: row.time_slot,
      price: Number(row.price),
      status: row.status,
      paymentStatus: row.payment_status,
      whatsappSent: row.whatsapp_sent,
      isWalkIn: row.is_walk_in,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (e: any) {
    console.warn('[SUPABASE] Error in getSupabaseAppointments:', e?.message);
    return null;
  }
}

/**
 * Save appointment to Supabase with strict collision detection
 */
export async function createSupabaseAppointment(app: Appointment): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('appointments').insert({
      id: app.id,
      booking_ref: app.bookingRef,
      customer_name: app.customerName,
      customer_phone: app.customerPhone,
      customer_email: app.customerEmail,
      service_id: app.serviceId,
      service_name: app.serviceName,
      stylist_name: app.stylistName,
      date: app.date,
      time_slot: app.timeSlot,
      price: app.price,
      status: app.status,
      payment_status: app.paymentStatus,
      whatsapp_sent: app.whatsappSent,
      is_walk_in: Boolean(app.isWalkIn),
      notes: app.notes || '',
      created_at: app.createdAt || new Date().toISOString(),
    });

    if (error) {
      // 23505 is PostgreSQL unique constraint violation error code
      if (error.code === '23505') {
        return {
          success: false,
          error: `Slot Conflict: ${app.stylistName} is already booked on ${app.date} at ${app.timeSlot}.`,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * Fetch Walk-in sessions from Supabase
 */
export async function getSupabaseWalkIns(date?: string): Promise<WalkInSession[] | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from('walk_ins').select('*').order('created_at', { ascending: false });
    if (date) {
      query = query.eq('date', date);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[SUPABASE] Failed to fetch walk-ins:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      bookingRef: row.booking_ref,
      stylistId: row.stylist_id,
      stylistName: row.stylist_name,
      clientIdentifier: row.client_identifier,
      serviceName: row.service_name,
      date: row.date,
      startTime: row.start_time,
      durationMinutes: row.duration_minutes,
      endTime: row.end_time,
      blockedSlots: row.blocked_slots || [],
      amount: Number(row.amount),
      paymentStatus: row.payment_status,
      whatsappSent: row.whatsapp_sent,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (e: any) {
    console.warn('[SUPABASE] Error in getSupabaseWalkIns:', e?.message);
    return null;
  }
}

/**
 * Save Walk-in session to Supabase
 */
export async function createSupabaseWalkIn(walkIn: WalkInSession): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('walk_ins').insert({
      id: walkIn.id,
      booking_ref: walkIn.bookingRef,
      stylist_id: walkIn.stylistId,
      stylist_name: walkIn.stylistName,
      client_identifier: walkIn.clientIdentifier,
      service_name: walkIn.serviceName,
      date: walkIn.date,
      start_time: walkIn.startTime,
      duration_minutes: walkIn.durationMinutes,
      end_time: walkIn.endTime,
      blocked_slots: walkIn.blockedSlots,
      amount: walkIn.amount,
      payment_status: walkIn.paymentStatus,
      whatsapp_sent: walkIn.whatsappSent,
      notes: walkIn.notes || '',
      created_at: walkIn.createdAt || new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * Fetch Schedules from Supabase
 */
export async function getSupabaseSchedules(): Promise<Record<string, StylistSchedule> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('schedules').select('*');
    if (error) {
      console.warn('[SUPABASE] Failed to fetch schedules:', error.message);
      return null;
    }

    const result: Record<string, StylistSchedule> = {};
    for (const row of data || []) {
      result[row.stylist_id] = {
        stylistId: row.stylist_id,
        stylistName: row.stylist_name,
        weeklySchedule: row.weekly_schedule || {},
        dateOverrides: row.date_overrides || {},
      };
    }
    return result;
  } catch (e: any) {
    return null;
  }
}

/**
 * Update Stylist Schedule in Supabase
 */
export async function saveSupabaseSchedule(schedule: StylistSchedule): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('schedules').upsert({
      stylist_id: schedule.stylistId,
      stylist_name: schedule.stylistName,
      weekly_schedule: schedule.weeklySchedule,
      date_overrides: schedule.dateOverrides,
      updated_at: new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
