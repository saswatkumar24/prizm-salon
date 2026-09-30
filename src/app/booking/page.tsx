'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SERVICES, STYLISTS, AVAILABLE_SLOTS, SALON_INFO } from '@/lib/data';
import { isSlotRestrictedBy2HourNotice } from '@/lib/time-utils';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Ban,
  Check,
  Send,
  Info
} from 'lucide-react';
import Link from 'next/link';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const serviceParam = searchParams.get('service');

  const [selectedService, setSelectedService] = useState(
    SERVICES.find((s) => s.id === serviceParam) || SERVICES[0]
  );
  // Default to Swagat as requested
  const [selectedStylist, setSelectedStylist] = useState(
    STYLISTS.find((s) => s.id === 'swagat') || STYLISTS[0]
  );
  const [selectedDate, setSelectedDate] = useState('2026-09-29'); // Tuesday
  const [selectedSlot, setSelectedSlot] = useState(AVAILABLE_SLOTS[2]); // 01:15 PM
  
  // Client details - defaulted to requested test info
  const [customerName, setCustomerName] = useState('Saswat Patro');
  const [customerPhone, setCustomerPhone] = useState('9908849156');
  const [paymentChoice, setPaymentChoice] = useState<'pay_at_studio' | 'paid'>('pay_at_studio');
  const [notes, setNotes] = useState('');

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotDetails, setSlotDetails] = useState<Record<string, { isWalkIn?: boolean; customerName?: string }>>({});
  const [stylistShiftInfo, setStylistShiftInfo] = useState<{
    isWorking: boolean;
    reason?: string;
    notes?: string;
    availableSlots: string[];
  }>({
    isWorking: true,
    availableSlots: AVAILABLE_SLOTS,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Fetch booked slots AND stylist schedule for the selected stylist and date
  const refreshSlotAvailability = async () => {
    try {
      const [appRes, schRes] = await Promise.all([
        fetch(`/api/appointments?date=${selectedDate}&stylist=${encodeURIComponent(selectedStylist.name)}`),
        fetch(`/api/stylists/schedule?stylistId=${selectedStylist.id}&date=${selectedDate}`),
      ]);

      const appData = await appRes.json();
      const schData = await schRes.json();

      let taken: string[] = [];
      if (appData.success && appData.appointments) {
        const details: Record<string, { isWalkIn?: boolean; customerName?: string }> = {};
        taken = appData.appointments
          .filter((a: any) => a.status === 'confirmed')
          .map((a: any) => {
            const key = a.timeSlot.trim().toUpperCase();
            details[key] = { isWalkIn: Boolean(a.isWalkIn), customerName: a.customerName };
            return key;
          });
        setBookedSlots(taken);
        setSlotDetails(details);
      }

      if (schData.success) {
        setStylistShiftInfo({
          isWorking: schData.isWorking,
          reason: schData.reason,
          notes: schData.notes,
          availableSlots: schData.availableSlots || [],
        });

        // Valid slots must be: shift active, not taken, and not restricted by 2-hour rule
        const validSlots = (schData.availableSlots || []).filter(
          (s: string) =>
            !taken.includes(s.trim().toUpperCase()) &&
            !isSlotRestrictedBy2HourNotice(s, selectedDate)
        );

        if (validSlots.length > 0 && (!validSlots.includes(selectedSlot) || !schData.isWorking)) {
          setSelectedSlot(validSlots[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch slot availability', e);
    }
  };

  useEffect(() => {
    refreshSlotAvailability();
  }, [selectedDate, selectedStylist]);

  // Auto-populate when user is logged in
  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) setCustomerName(fullName);
      if (user.phone) setCustomerPhone(user.phone.replace(/\D/g, '').slice(-10));
    }
  }, [user]);

  // Handle preselection if query param changes
  useEffect(() => {
    if (serviceParam) {
      const match = SERVICES.find((s) => s.id === serviceParam);
      if (match) setSelectedService(match);
    }
  }, [serviceParam]);

  const handleTestAutofill = () => {
    setCustomerName('Saswat Patro');
    setCustomerPhone('9908849156');
    const swagat = STYLISTS.find((s) => s.id === 'swagat');
    if (swagat) setSelectedStylist(swagat);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please enter your name and 10-digit mobile number.');
      return;
    }

    if (!stylistShiftInfo.isWorking) {
      setErrorMsg(`${selectedStylist.name} is off-duty on this date. Please pick another date or stylist.`);
      return;
    }

    // Check 2-hour advance notice rule
    if (isSlotRestrictedBy2HourNotice(selectedSlot, selectedDate)) {
      setErrorMsg('2-Hour Advance Notice Required: Slots starting within 2 hours cannot be reserved online. Please pick a later slot or walk in directly.');
      return;
    }

    // Check if slot is taken before submitting
    if (bookedSlots.includes(selectedSlot.trim().toUpperCase())) {
      setErrorMsg(`Slot Conflict: ${selectedSlot} is already booked with ${selectedStylist.name}. Please select a different time.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: '+91 ' + customerPhone.replace(/\D/g, '').slice(-10),
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          stylistName: selectedStylist.name,
          date: selectedDate,
          timeSlot: selectedSlot,
          price: selectedService.price,
          paymentStatus: paymentChoice,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.appointment) {
        setConfirmedBooking({
          ...data.appointment,
          whatsapp: data.whatsapp,
        });

        // Store confirmed booking state (Server backend handles background dispatch)

        // Refresh slot calendar
        refreshSlotAvailability();
      } else {
        setErrorMsg(data.error || 'Failed to complete booking');
      }
    } catch (err) {
      setErrorMsg('Network error while saving appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[new Date(selectedDate).getDay()];

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs text-zinc-400 mb-3 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
          Live Stylist Shift & Collision Synchronizer
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Reserve your window.
        </h1>
        <p className="mt-2 text-zinc-400 text-sm sm:text-base font-light">
          Stylist shift windows and booked slots are synchronized in real-time. Automated WhatsApp confirmations dispatched upon confirmation.
        </p>
      </div>

      {/* CONFIRMATION SCREEN */}
      {confirmedBooking ? (
        <div className="rounded-3xl bg-surface border border-emerald-500/40 p-6 sm:p-12 shadow-2xl animate-in fade-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                ✓ Booking Confirmed & Slot Locked
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
                You're all set, {confirmedBooking.customerName}!
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Booking Reference: <strong className="text-white font-mono text-base">{confirmedBooking.bookingRef}</strong>
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-surface-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-left">
              <div>
                <span className="text-zinc-500 block">Service</span>
                <span className="font-semibold text-white">{confirmedBooking.serviceName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Master Stylist</span>
                <span className="font-semibold text-neon-pink">{confirmedBooking.stylistName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Date & Slot</span>
                <span className="font-semibold text-white">{confirmedBooking.date} at {confirmedBooking.timeSlot}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Investment</span>
                <span className="font-semibold text-neon-cyan">₹{confirmedBooking.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* AUTOMATED WHATSAPP CONFIRMATION FEED */}
            <div className="p-6 rounded-2xl bg-emerald-950/25 border border-emerald-800/70 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Automated WhatsApp Messages Sent Directly</h4>
                  <p className="text-xs text-emerald-300">
                    Notifications have been dispatched automatically to all 3 parties:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-zinc-400">Customer: </span>
                      <strong className="text-white">{confirmedBooking.customerName}</strong>
                      <span className="text-zinc-500 ml-1 font-mono">({confirmedBooking.customerPhone})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">✓ Sent Directly</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-zinc-400">Master Stylist: </span>
                      <strong className="text-white">{confirmedBooking.stylistName}</strong>
                      <span className="text-zinc-500 ml-1 font-mono">(+91 79812 62237)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">✓ Sent Directly</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-zinc-400">Studio Manager: </span>
                      <strong className="text-white">PRIZM Central Desk</strong>
                      <span className="text-zinc-500 ml-1 font-mono">(+91 78943 76562)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">✓ Sent Directly</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  refreshSlotAvailability();
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neon-cyan transition-colors"
              >
                Book Another Slot
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* BOOKING WIZARD FORM */
        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: SELECTIONS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. SELECT SERVICE */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-neon-cyan" />
                  1. Choose Service
                </h2>
                <span className="text-xs text-zinc-500 font-mono">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map((s) => {
                  const isSelected = selectedService.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'bg-zinc-950/60 border-surface-border hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-zinc-500">{s.category}</span>
                        <span className="text-xs font-bold text-neon-cyan">₹{s.price.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="font-bold text-white text-sm mt-1">{s.name}</p>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2 font-light">{s.description}</p>
                      <span className="inline-block mt-3 text-[11px] text-zinc-500 font-mono">⏱ {s.duration}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SELECT STYLIST & DATE & TIME (WITH SHIFT ROSTER & COLLISION SYNC) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neon-pink" />
                  2. Stylist, Date & Time Slot
                </h2>
                <span className="text-xs text-zinc-500 font-mono">Shift & Collision Guard</span>
              </div>

              {/* Stylist Selector */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-2">
                  Select Master Stylist
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STYLISTS.map((st) => {
                    const isSelected = selectedStylist.id === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStylist(st)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-neon-pink/15 border-neon-pink text-white shadow-[0_0_15px_rgba(255,0,122,0.15)]'
                            : 'bg-zinc-950/60 border-surface-border text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">{st.name}</p>
                          {st.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink text-[9px] font-mono uppercase font-bold">
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{st.role}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">+91 {st.phone.slice(-10)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min="2026-09-28"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                  />
                </div>
                <div className="flex flex-col justify-end text-xs text-zinc-400 pb-1">
                  <span>Day: <strong className="text-white">{dayName}</strong></span>
                  <span className="text-[11px] text-zinc-500">Stylist: {selectedStylist.name}</span>
                </div>
              </div>

              {/* Stylist Roster & Working Window Notice */}
              {!stylistShiftInfo.isWorking ? (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-200">
                    <Ban className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{selectedStylist.name} is Off-Duty on {dayName}s</span>
                  </div>
                  <p className="text-zinc-300 text-xs">
                    {stylistShiftInfo.reason || `${selectedStylist.name} does not take bookings on ${dayName}s.`}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono pt-1">
                    💡 Please pick another date or select another stylist above.
                  </p>
                </div>
              ) : stylistShiftInfo.notes ? (
                <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-xs text-zinc-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-neon-cyan shrink-0" />
                  <span>
                    <strong>{selectedStylist.name}'s Shift on {dayName}:</strong> {stylistShiftInfo.notes}
                  </span>
                </div>
              ) : null}

              {/* Time Slots with LIVE COLLISION & SHIFT LOCK */}
              {stylistShiftInfo.isWorking && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-300">
                      Available Windows for {selectedStylist.name} on {dayName}
                    </label>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Open
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> &lt;2h Notice
                      </span>
                      <span className="flex items-center gap-1 text-purple-400">
                        <span className="w-2 h-2 rounded-full bg-purple-400" /> In Chair
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400" /> Booked
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-zinc-600" /> Shift Closed
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {AVAILABLE_SLOTS.map((slot) => {
                      const isShiftActive = stylistShiftInfo.availableSlots.includes(slot);
                      const isUnder2HourNotice = isSlotRestrictedBy2HourNotice(slot, selectedDate);
                      const isTaken = bookedSlots.includes(slot.trim().toUpperCase());
                      const slotInfo = slotDetails[slot.trim().toUpperCase()];
                      const isWalkInOccupied = isTaken && slotInfo?.isWalkIn;
                      const isSelected = selectedSlot === slot && isShiftActive && !isTaken && !isUnder2HourNotice;

                      if (!isShiftActive) {
                        return (
                          <div
                            key={slot}
                            title={`${selectedStylist.name} is off-shift at ${slot}`}
                            className="py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-600 text-xs font-mono flex items-center justify-between cursor-not-allowed opacity-50"
                          >
                            <span className="line-through">{slot}</span>
                            <span className="text-[9px] text-zinc-600">Off Shift</span>
                          </div>
                        );
                      }

                      if (isUnder2HourNotice) {
                        return (
                          <div
                            key={slot}
                            title="Slots within 2 hours require direct call or studio walk-in"
                            className="py-2.5 px-3 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-500/70 text-xs font-mono flex items-center justify-between cursor-not-allowed"
                          >
                            <span className="line-through">{slot}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 font-bold">
                              &lt;2h Notice
                            </span>
                          </div>
                        );
                      }

                      if (isWalkInOccupied) {
                        return (
                          <div
                            key={slot}
                            title={`${selectedStylist.name} is with a walk-in client in chair`}
                            className="py-2.5 px-3 rounded-xl border border-purple-900/60 bg-purple-950/25 text-purple-300/80 text-xs font-mono flex items-center justify-between cursor-not-allowed"
                          >
                            <span className="line-through">{slot}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 font-bold">
                              In Chair
                            </span>
                          </div>
                        );
                      }

                      if (isTaken) {
                        return (
                          <div
                            key={slot}
                            title={`${selectedStylist.name} is already booked at ${slot}`}
                            className="py-2.5 px-3 rounded-xl border border-red-950/70 bg-red-950/20 text-zinc-500 text-xs font-mono flex items-center justify-between cursor-not-allowed opacity-60"
                          >
                            <span className="line-through">{slot}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 font-bold">
                              Booked
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-neon-cyan text-black border-neon-cyan font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                              : 'bg-zinc-950/60 border-surface-border text-zinc-300 hover:border-zinc-700 hover:text-white'
                          }`}
                        >
                          <span>{slot}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. CLIENT DETAILS & TEST HELPER */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-neon-purple" />
                  3. Client Identification & Phone
                </h2>
                
                {/* One-click test helper */}
                <button
                  type="button"
                  onClick={handleTestAutofill}
                  className="px-3 py-1 rounded-full bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Autofill: 9908849156 (Test)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saswat Patro"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-neon-cyan"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Customer Mobile (WhatsApp Alert Recipient)</label>
                  <div className="flex rounded-xl bg-zinc-900 border border-surface-border focus-within:border-neon-cyan overflow-hidden">
                    <span className="px-3 py-2 text-xs font-semibold text-zinc-400 bg-zinc-800/60 border-r border-surface-border flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9908849156"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Option */}
              <div className="pt-2">
                <label className="text-xs font-medium text-zinc-300 block mb-2">Payment Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('pay_at_studio')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentChoice === 'pay_at_studio'
                        ? 'bg-zinc-800 border-neon-cyan text-white'
                        : 'bg-zinc-950 border-surface-border text-zinc-400'
                    }`}
                  >
                    Pay at Studio (Cash / Card / UPI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('paid')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentChoice === 'paid'
                        ? 'bg-zinc-800 border-neon-cyan text-white'
                        : 'bg-zinc-950 border-surface-border text-zinc-400'
                    }`}
                  >
                    Prepay Online (Instant Confirmation)
                  </button>
                </div>
              </div>

              {/* Special notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Special Notes / Hair Consultation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Multi-tonal blonde, sensitive scalp, beard shape preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-neon-cyan"
                />
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border sticky top-28 space-y-6">
              
              <h3 className="text-base font-bold text-white pb-3 border-b border-surface-border">
                Reservation Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Service:</span>
                  <span className="font-semibold text-white">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration:</span>
                  <span className="font-mono text-zinc-300">{selectedService.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Stylist:</span>
                  <span className="text-neon-pink font-semibold">{selectedStylist.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date:</span>
                  <span className="text-white">{selectedDate} ({dayName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time Window:</span>
                  <span className="text-neon-cyan font-mono font-bold">
                    {stylistShiftInfo.isWorking ? selectedSlot : 'Off-Duty'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Customer Mobile:</span>
                  <span className="font-mono text-white">{customerPhone ? `+91 ${customerPhone}` : '—'}</span>
                </div>
              </div>

              {/* Direct WhatsApp Notice */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <span className="font-bold text-zinc-200 block text-xs">Direct WhatsApp Dispatches:</span>
                <p>• Customer: <strong>+91 {customerPhone || '9908849156'}</strong></p>
                <p>• Stylist ({selectedStylist.name}): <strong>+91 {selectedStylist.phone}</strong></p>
                <p>• Studio Manager: <strong>+91 78943 76562</strong></p>
              </div>

              <div className="pt-2 border-t border-surface-border flex justify-between items-baseline">
                <span className="text-sm font-semibold text-zinc-300">Total Investment</span>
                <span className="text-2xl font-black text-white">₹{selectedService.price.toLocaleString('en-IN')}</span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Exact Button "Book Slot" */}
              <button
                type="submit"
                disabled={isSubmitting || !stylistShiftInfo.isWorking || bookedSlots.includes(selectedSlot.trim().toUpperCase())}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-cyan to-white hover:opacity-90 disabled:opacity-40 text-black font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(0,240,255,0.3)] tracking-wide"
              >
                {isSubmitting ? 'Booking Slot...' : 'Book Slot'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 text-[11px] text-zinc-500 pt-2 border-t border-surface-border/50">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Free cancellations up to 12h prior.
                </p>
                <p className="flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-neon-pink" />
                  Double bookings automatically prevented.
                </p>
              </div>

            </div>
          </div>

        </form>
      )}

    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 text-center text-zinc-400 text-sm">
          <div className="w-8 h-8 mx-auto border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4" />
          Loading studio booking calendar...
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
