'use client';

import React, { useState, useEffect } from 'react';
import { Appointment, StylistSchedule, WalkInSession } from '@/types';
import {
  INITIAL_APPOINTMENTS,
  SALON_INFO,
  STYLISTS,
  AVAILABLE_SLOTS,
  STAFF_ACCOUNTS,
  WALK_IN_DURATIONS,
} from '@/lib/data';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { calculateBlockedSlots } from '@/lib/time-utils';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  CheckCircle,
  MessageCircle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertCircle,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Ban,
  Scissors,
  Send,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loginWithStaffCredentials, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'calendar' | 'walkin' | 'shifts' | 'bookings' | 'whatsapp'>('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [schedules, setSchedules] = useState<Record<string, StylistSchedule>>({});
  const [walkIns, setWalkIns] = useState<WalkInSession[]>([]);

  // WhatsApp Gateway State (Option 2 - Baileys)
  const [waGatewayStatus, setWaGatewayStatus] = useState<{
    isGatewayRunning: boolean;
    isConnected: boolean;
    phone: string | null;
    qrCode: string | null;
  }>({
    isGatewayRunning: false,
    isConnected: false,
    phone: null,
    qrCode: null,
  });
  const [testWaPhone, setTestWaPhone] = useState('9908849156');
  const [testWaMessage, setTestWaMessage] = useState('✨ Test confirmation from PRIZM Salon business WhatsApp gateway! Automation active.');
  const [testWaStatus, setTestWaStatus] = useState<string | null>(null);
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);

  // Matrix date filter
  const [selectedDate, setSelectedDate] = useState('2026-09-29');

  // Staff Credentials Login Form state
  const [inputUserId, setInputUserId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Shift editor state
  const [selectedStylistId, setSelectedStylistId] = useState('swagat');
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState('');
  const [savingShift, setSavingShift] = useState(false);

  // Walk-in Session Logger state
  const [walkInStylistId, setWalkInStylistId] = useState('swagat');
  const [walkInClientName, setWalkInClientName] = useState('Walk-in Client (In Chair)');
  const [walkInService, setWalkInService] = useState('Architectural Cut & Finish');
  const [walkInDate, setWalkInDate] = useState('2026-09-29');
  const [walkInStartTime, setWalkInStartTime] = useState(AVAILABLE_SLOTS[1]); // 11:45 AM
  const [walkInDuration, setWalkInDuration] = useState(90); // 90 mins (1.5 hrs)
  const [walkInAmount, setWalkInAmount] = useState('1800');
  const [walkInPayment, setWalkInPayment] = useState<'paid' | 'pay_at_studio'>('paid');
  const [walkInNotes, setWalkInNotes] = useState('In-chair walk-in service');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInFeedback, setWalkInFeedback] = useState<{
    success: boolean;
    message: string;
    blockedSlots?: string[];
  } | null>(null);

  // Bookings table filters
  const [filter, setFilter] = useState<'all' | 'paid' | 'pay_at_studio' | 'walkins'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isAuthorized = user && (user.role === 'manager' || user.role === 'stylist');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appRes, schRes, wlkRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/stylists/schedule'),
        fetch('/api/walkins'),
      ]);

      const appData = await appRes.json();
      if (appData.success && appData.appointments) {
        setAppointments(appData.appointments);
      }

      const schData = await schRes.json();
      if (schData.success && schData.schedules) {
        setSchedules(schData.schedules);
      }

      const wlkData = await wlkRes.json();
      if (wlkData.success && wlkData.walkIns) {
        setWalkIns(wlkData.walkIns);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const checkWaGateway = async () => {
    try {
      const res = await fetch('/api/whatsapp/gateway');
      const data = await res.json();
      setWaGatewayStatus({
        isGatewayRunning: Boolean(data.isGatewayRunning),
        isConnected: Boolean(data.isConnected),
        phone: data.phone || null,
        qrCode: data.qrCode || null,
      });
    } catch (e) {
      setWaGatewayStatus((prev) => ({ ...prev, isGatewayRunning: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    checkWaGateway();
    const interval = setInterval(checkWaGateway, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestWa = async () => {
    if (!testWaPhone.trim()) return;
    setIsSendingTestWa(true);
    setTestWaStatus(null);
    try {
      const res = await fetch('/api/whatsapp/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_send',
          phone: testWaPhone,
          message: testWaMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestWaStatus('✓ Test WhatsApp message delivered directly in background!');
      } else {
        setTestWaStatus(`✕ Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      setTestWaStatus(`✕ Connection error: ${err.message}`);
    } finally {
      setIsSendingTestWa(false);
    }
  };

  const handleResetWaGateway = async () => {
    try {
      await fetch('/api/whatsapp/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      checkWaGateway();
    } catch (e) {}
  };

  // Sync stylist when staff logs in
  useEffect(() => {
    if (user && user.role === 'stylist' && user.stylistId) {
      setSelectedStylistId(user.stylistId);
      setWalkInStylistId(user.stylistId);
    }
  }, [user]);

  // Handle staff login submission
  const handleStaffFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUserId.trim() || !inputPassword.trim()) {
      setAuthError('Please enter both User ID and Password.');
      return;
    }
    setAuthError('');
    setIsLoggingIn(true);
    const res = await loginWithStaffCredentials(inputUserId.trim(), inputPassword.trim());
    setIsLoggingIn(false);
    if (!res.success) {
      setAuthError(res.error || 'Invalid credentials. Please verify your User ID and Password.');
    }
  };

  // 1-Click quick login handler for demo testing
  const handleQuickDemoLogin = async (acc: (typeof STAFF_ACCOUNTS)[0]) => {
    setInputUserId(acc.userId);
    setInputPassword(acc.password);
    setAuthError('');
    setIsLoggingIn(true);
    const res = await loginWithStaffCredentials(acc.userId, acc.password);
    setIsLoggingIn(false);
    if (!res.success) {
      setAuthError(res.error || 'Login failed.');
    }
  };

  // Log walk-in offline hours
  const handleLogWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWalkIn(true);
    setWalkInFeedback(null);

    const nowDate = new Date();
    const curTodayStr = nowDate.toISOString().split('T')[0];
    const prevDate = new Date(nowDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const curYesterdayStr = prevDate.toISOString().split('T')[0];

    if (walkInDate !== curTodayStr && walkInDate !== curYesterdayStr) {
      setWalkInFeedback({
        success: false,
        message: `Walk-ins can only be logged for today (${curTodayStr}) or yesterday (${curYesterdayStr}). Future sessions must be booked through online appointments.`,
      });
      setIsSubmittingWalkIn(false);
      return;
    }

    try {
      const res = await fetch('/api/walkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylistId: walkInStylistId,
          clientIdentifier: walkInClientName.trim() || 'Walk-in Guest',
          serviceName: walkInService.trim() || 'Custom Styling',
          date: walkInDate,
          startTime: walkInStartTime,
          durationMinutes: Number(walkInDuration),
          amount: Number(walkInAmount) || 0,
          paymentStatus: walkInPayment,
          notes: walkInNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWalkInFeedback({
          success: true,
          message: data.message,
          blockedSlots: data.blockedSlots,
        });
        // Refresh appointment store and walk-ins so matrix is instantly updated
        await fetchDashboardData();
      } else {
        setWalkInFeedback({
          success: false,
          message: data.error || 'Failed to log walk-in session',
        });
      }
    } catch (err) {
      setWalkInFeedback({
        success: false,
        message: 'Network error submitting walk-in session',
      });
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Shift editor toggles
  const handleToggleWorkingDay = (dayNum: number) => {
    const current = schedules[selectedStylistId];
    if (!current) return;

    const currentDay = current.weeklySchedule[dayNum] || { isWorking: true };
    const updated = {
      ...schedules,
      [selectedStylistId]: {
        ...current,
        weeklySchedule: {
          ...current.weeklySchedule,
          [dayNum]: {
            ...currentDay,
            isWorking: !currentDay.isWorking,
          },
        },
      },
    };
    setSchedules(updated);
  };

  const handleToggleSlotForDay = (dayNum: number, slot: string) => {
    const current = schedules[selectedStylistId];
    if (!current) return;

    const dayRule = current.weeklySchedule[dayNum] || { isWorking: true };
    let currentSlots = dayRule.customSlots ? [...dayRule.customSlots] : [...AVAILABLE_SLOTS];

    if (currentSlots.includes(slot)) {
      currentSlots = currentSlots.filter((s) => s !== slot);
    } else {
      currentSlots.push(slot);
    }

    const updated = {
      ...schedules,
      [selectedStylistId]: {
        ...current,
        weeklySchedule: {
          ...current.weeklySchedule,
          [dayNum]: {
            ...dayRule,
            isWorking: true,
            customSlots: currentSlots,
          },
        },
      },
    };
    setSchedules(updated);
  };

  const handleSaveSchedule = async (dayNum: number) => {
    const current = schedules[selectedStylistId];
    if (!current) return;
    const rule = current.weeklySchedule[dayNum];

    setSavingShift(true);
    setShiftSuccessMsg('');

    try {
      const res = await fetch('/api/stylists/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylistId: selectedStylistId,
          dayOfWeek: dayNum,
          isWorking: rule.isWorking,
          customSlots: rule.customSlots || [],
          notes: rule.notes || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShiftSuccessMsg(`Shift schedule updated for ${current.stylistName}! This now reflects on the customer booking calendar.`);
        setTimeout(() => setShiftSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingShift(false);
    }
  };

  // Preview computation for the walk-in logger
  const previewCalculation = calculateBlockedSlots(walkInStartTime, walkInDuration);

  // ACCESS GATE FOR NON-STAFF
  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-surface border border-surface-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-neon-purple/20 blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-neon-cyan">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              PRIZM Staff & Studio Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Restricted to authorized stylists and studio managers to log in-chair walk-ins, view the real-time schedule matrix, and manage rosters.
            </p>
          </div>

          {user && user.role === 'customer' && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Customer Account Detected
              </p>
              <p className="mt-1 text-[11px] text-zinc-300">
                You are logged in as a client (<strong>{user.firstName} {user.lastName}</strong>). Customers can only browse services and book slots.
              </p>
              <Link
                href="/booking"
                className="mt-3 inline-block py-1.5 px-3 rounded-lg bg-white text-black font-bold text-xs"
              >
                Go to Book a Slot →
              </Link>
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-200">
              {authError}
            </div>
          )}

          {/* User ID & Password Form */}
          <form onSubmit={handleStaffFormSubmit} className="space-y-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs text-zinc-300 font-medium">Staff User ID</label>
              <input
                type="text"
                placeholder="e.g. swagat_prizm or manager_prizm"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-300 font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neon-cyan transition-colors"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Studio Portal'}
            </button>
          </form>

          {/* Quick Staff Sign-In Shortcuts (Configured Accounts) */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block text-center">
              Quick 1-Click Demo Accounts (3 Stylists + 1 Manager)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAFF_ACCOUNTS.map((acc) => (
                <button
                  key={acc.userId}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-neon-cyan/40 text-left text-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{acc.name}</span>
                    <span className="text-[9px] uppercase font-mono px-1 rounded bg-zinc-800 text-neon-cyan">
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{acc.userId}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  const totalRevenue = appointments.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalWalkIns = appointments.filter((a) => a.isWalkIn && a.price > 0).length;
  const totalOnline = appointments.filter((a) => !a.isWalkIn).length;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner with Staff Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs text-zinc-400 mb-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated as: <strong className="text-white capitalize">{user.role}</strong> ({user.firstName} {user.lastName})
            {user.userId && <span className="text-zinc-500 font-mono">[{user.userId}]</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Studio Intelligence & Scheduling.
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Real-time appointment calendar, in-chair walk-in logger, and stylist shift allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/booking"
            className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-zinc-300 hover:text-white transition-colors"
          >
            Customer Booking View
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-400 hover:bg-red-950/60 transition-colors"
          >
            Exit Staff Portal
          </button>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.25)]'
              : 'bg-surface text-zinc-400 hover:text-white border border-surface-border'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Stylist Schedule Matrix (Calendar)</span>
        </button>

        <button
          onClick={() => setActiveTab('walkin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'walkin'
              ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
              : 'bg-surface text-zinc-400 hover:text-white border border-surface-border'
          }`}
        >
          <Zap className="w-4 h-4 text-purple-300" />
          <span>Log Offline Walk-in (Live Slot Blocker)</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 text-[10px] font-mono">
            + Quick Log
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shifts'
              ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,0,122,0.25)]'
              : 'bg-surface text-zinc-400 hover:text-white border border-surface-border'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Stylist Shift & Roster Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-white text-black'
              : 'bg-surface text-zinc-400 hover:text-white border border-surface-border'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>All Bookings & Real-time Feed ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
              : 'bg-surface text-zinc-400 hover:text-white border border-surface-border'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp QR Gateway</span>
          {waGatewayStatus.isConnected ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
              Scan QR
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: VISUAL STYLIST CALENDAR MATRIX */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Calendar Controls */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
              <span className="text-xs font-mono text-zinc-500">
                {daysOfWeek[new Date(selectedDate).getDay()]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Available Slot
              </span>
              <span className="flex items-center gap-1.5 text-neon-pink">
                <span className="w-2.5 h-2.5 rounded-full bg-neon-pink" />
                Online Client Booking
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                In Chair / Offline Walk-in
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                Off Duty / Shift Closed
              </span>
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="py-3 px-3 text-zinc-500 uppercase font-mono text-[10px] w-24">
                    Time Window
                  </th>
                  {STYLISTS.map((st) => (
                    <th key={st.id} className="py-3 px-3 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{st.name}</span>
                        {st.id === 'swagat' && (
                          <span className="px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink text-[9px] font-mono">Lead</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-light truncate">{st.role}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {AVAILABLE_SLOTS.map((slot) => {
                  return (
                    <tr key={slot} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-zinc-400 text-[11px] whitespace-nowrap">
                        {slot}
                      </td>

                      {STYLISTS.map((st) => {
                        // Check if stylist is scheduled to work today
                        const sch = schedules[st.id];
                        const dayNum = new Date(selectedDate).getDay();
                        const dayRule = sch?.weeklySchedule[dayNum] ?? { isWorking: true };

                        let isWorkingSlot = dayRule.isWorking;
                        if (isWorkingSlot && dayRule.customSlots && dayRule.customSlots.length > 0) {
                          isWorkingSlot = dayRule.customSlots.includes(slot);
                        }

                        // Check if there is an appointment
                        const booking = appointments.find(
                          (a) =>
                            a.status === 'confirmed' &&
                            a.date === selectedDate &&
                            a.timeSlot.trim().toUpperCase() === slot.trim().toUpperCase() &&
                            a.stylistName.toLowerCase().includes(st.name.toLowerCase())
                        );

                        if (booking) {
                          const isWalkIn = Boolean(booking.isWalkIn);

                          return (
                            <td key={st.id} className="py-3 px-3">
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  isWalkIn
                                    ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
                                    : 'bg-neon-pink/15 border-neon-pink/40 text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                                  <span className={isWalkIn ? 'text-purple-300 font-bold' : 'text-neon-pink'}>
                                    #{booking.bookingRef}
                                  </span>
                                  {booking.price > 0 && <span>₹{booking.price}</span>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs truncate text-white">{booking.customerName}</p>
                                  {isWalkIn && (
                                    <span className="px-1 py-0.2 rounded bg-purple-900/80 text-purple-300 text-[8px] font-mono uppercase">
                                      Walk-in
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-300 truncate">{booking.serviceName}</p>
                              </div>
                            </td>
                          );
                        }

                        if (!isWorkingSlot) {
                          return (
                            <td key={st.id} className="py-3 px-3">
                              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 text-zinc-600 text-[11px] font-mono flex items-center justify-between">
                                <span>Off Shift</span>
                                <Ban className="w-3 h-3 text-zinc-700" />
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={st.id} className="py-3 px-3">
                            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-400 text-[11px] font-mono flex items-center justify-between">
                              <span>Open</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setWalkInStylistId(st.id);
                                  setWalkInDate(selectedDate);
                                  setWalkInStartTime(slot);
                                  setActiveTab('walkin');
                                }}
                                className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-white hover:bg-emerald-800 transition-colors"
                              >
                                + Walk-in
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: LOG OFFLINE WALK-IN CLIENT (LIVE SLOT BLOCKER) */}
      {activeTab === 'walkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
          
          {/* LEFT 2 COLUMNS: WALK-IN FORM */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800/60 text-xs text-purple-300 mb-2 font-mono">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Live Slot Collision & Sync Engine
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Log In-Chair Offline Walk-in
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                When an offline client sits in chair, log their duration in multiples of 30 minutes. This instantly disables overlapping slots on the customer website and notifies the Studio Manager on WhatsApp.
              </p>
            </div>

            {walkInFeedback && (
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  walkInFeedback.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-red-950/40 border-red-800 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {walkInFeedback.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{walkInFeedback.message}</span>
                </div>
                {walkInFeedback.blockedSlots && walkInFeedback.blockedSlots.length > 0 && (
                  <p className="mt-2 text-[11px] font-mono text-zinc-300">
                    🔒 Blocked Slots for Customers: <strong>{walkInFeedback.blockedSlots.join(', ')}</strong>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleLogWalkIn} className="space-y-5">
              
              {/* Stylist Selector */}
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-2">
                  Select Stylist:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {STYLISTS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setWalkInStylistId(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        walkInStylistId === st.id
                          ? 'bg-purple-900/30 border-purple-500 text-white shadow-md'
                          : 'bg-zinc-900/60 border-surface-border text-zinc-400 hover:text-white'
                      }`}
                    >
                      <p className="font-bold text-xs text-white">{st.name}</p>
                      <p className="text-[10px] text-zinc-500">{st.role}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Name & Service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Client Reference / Name</label>
                  <input
                    type="text"
                    value={walkInClientName}
                    onChange={(e) => setWalkInClientName(e.target.value)}
                    placeholder="e.g. Rahul S. (In Chair)"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Service Provided</label>
                  <input
                    type="text"
                    value={walkInService}
                    onChange={(e) => setWalkInService(e.target.value)}
                    placeholder="e.g. Architectural Cut & Finish"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Date & Start Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300 font-medium">Session Date</label>
                    <span className="text-[10px] text-purple-300 font-mono">Today & Yesterday Only</span>
                  </div>
                  <input
                    type="date"
                    value={walkInDate}
                    min={yesterdayStr}
                    max={todayStr}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setWalkInDate(todayStr)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                        walkInDate === todayStr
                          ? 'bg-purple-600 text-white font-bold shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Today ({todayStr})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalkInDate(yesterdayStr)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                        walkInDate === yesterdayStr
                          ? 'bg-purple-600 text-white font-bold shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Yesterday ({yesterdayStr})
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Service Start Time Slot</label>
                  <select
                    value={walkInStartTime}
                    onChange={(e) => setWalkInStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {AVAILABLE_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DURATION SELECTOR (MULTIPLES OF 30 MINS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-300 font-medium">
                    Duration (Multiples of 30 Minutes):
                  </label>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    {walkInDuration} Minutes ({(walkInDuration / 60).toFixed(1)} hrs)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WALK_IN_DURATIONS.map((dur) => {
                    const isSelected = walkInDuration === dur.minutes;
                    return (
                      <button
                        key={dur.minutes}
                        type="button"
                        onClick={() => setWalkInDuration(dur.minutes)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-md'
                            : 'bg-zinc-900/80 border-surface-border text-zinc-400 hover:text-white'
                        }`}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    value={walkInAmount}
                    onChange={(e) => setWalkInAmount(e.target.value)}
                    placeholder="1800"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Payment Status</label>
                  <select
                    value={walkInPayment}
                    onChange={(e) => setWalkInPayment(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="paid">Paid (Collected in Studio)</option>
                    <option value="pay_at_studio">Pending / Pay Later</option>
                  </select>
                </div>
              </div>

              {/* LIVE SYNC PREVIEW CALLOUT */}
              <div className="p-4 rounded-2xl bg-zinc-950/90 border border-purple-900/50 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-mono text-purple-400 tracking-wider block font-bold">
                  ⚡ Live System Impact Preview
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-300">
                  <span>
                    Service Window: <strong className="text-white">{walkInStartTime}</strong> to{' '}
                    <strong className="text-white">{previewCalculation.endTimeStr}</strong>
                  </span>
                  <span>
                    Duration: <strong className="text-white">{walkInDuration} mins</strong>
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Online Booking Slots to be Locked for{' '}
                  <span className="text-white font-bold">{STYLISTS.find((s) => s.id === walkInStylistId)?.name}</span>:
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {previewCalculation.blockedSlots.map((slot) => (
                      <span
                        key={slot}
                        className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800"
                      >
                        🔒 {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingWalkIn}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {isSubmittingWalkIn ? 'Synchronizing & Notifying Manager...' : 'Log Walk-in & Lock Slots Online'}
              </button>

            </form>
          </div>

          {/* RIGHT COLUMN: ACTIVE WALK-IN SESSIONS & NOTIFICATIONS */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Active Walk-in Sessions Today</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Logged sessions currently occupying chairs:
              </p>

              <div className="space-y-2.5">
                {walkIns.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-surface-border text-center text-xs text-zinc-500">
                    No offline walk-ins recorded today.
                  </div>
                ) : (
                  walkIns.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-purple-900/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-400 font-bold">#{w.bookingRef}</span>
                        <span className="text-emerald-400 font-mono text-[10px]">₹{w.amount}</span>
                      </div>
                      <p className="font-bold text-white truncate">{w.clientIdentifier}</p>
                      <p className="text-[11px] text-zinc-400">
                        {w.stylistName} • {w.startTime} to {w.endTime} ({w.durationMinutes}m)
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-900">
                        <span>Slots: {w.blockedSlots.join(', ')}</span>
                        <span className="text-emerald-400">✓ Manager Notified</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manager WhatsApp Dispatch Info */}
            <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Automated WhatsApp Route</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When a walk-in is logged, an automated WhatsApp dispatch is routed to Studio Manager at <strong className="text-white font-mono">+91 78943 76562</strong> containing the stylist name, in-chair duration, and locked slots.
              </p>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span className="text-emerald-400">Status:</span> Automated Dispatch Active
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: STYLIST SHIFT & WORKING WINDOWS MANAGER */}
      {activeTab === 'shifts' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-6 animate-in fade-in duration-200">
          
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-neon-pink">Roster Allocation</span>
            <h2 className="text-2xl font-bold text-white mt-1">Stylist Shift & Booking Window Manager</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure working days and active time windows. When Swagat sets Thursdays as Off or Tuesdays as Morning-only, it directly updates what customers see on the booking site.
            </p>
          </div>

          {shiftSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{shiftSuccessMsg}</span>
            </div>
          )}

          {/* Stylist Selector */}
          <div>
            <label className="text-xs text-zinc-300 font-medium block mb-2">Select Stylist to Configure:</label>
            <div className="flex flex-wrap gap-2">
              {STYLISTS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStylistId(st.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedStylistId === st.id
                      ? 'bg-neon-pink text-white shadow-md'
                      : 'bg-zinc-900 border border-surface-border text-zinc-400 hover:text-white'
                  }`}
                >
                  {st.name} ({st.role})
                </button>
              ))}
            </div>
          </div>

          {/* 7 Days of Week Roster Grid */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-white">
              Weekly Shift Schedule for {STYLISTS.find((s) => s.id === selectedStylistId)?.name}:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {daysOfWeek.map((dayName, dayIndex) => {
                const currentSchedule = schedules[selectedStylistId];
                const dayRule = currentSchedule?.weeklySchedule[dayIndex] ?? { isWorking: true };
                const isWorking = dayRule.isWorking;
                const customSlots = dayRule.customSlots || AVAILABLE_SLOTS;

                return (
                  <div
                    key={dayName}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWorking
                        ? 'bg-zinc-950/80 border-surface-border'
                        : 'bg-zinc-950/40 border-red-950/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-white text-sm">{dayName}</span>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {isWorking ? `${customSlots.length} slot(s) enabled` : 'Day Off / Rest'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleWorkingDay(dayIndex)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isWorking
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {isWorking ? 'Working' : 'Day Off'}
                        </button>
                        <button
                          type="button"
                          disabled={savingShift}
                          onClick={() => handleSaveSchedule(dayIndex)}
                          className="px-3 py-1 rounded-lg bg-white text-black font-bold text-xs hover:bg-neon-cyan transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {isWorking && (
                      <div className="space-y-2 pt-2 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          Toggle Working Time Slots:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {AVAILABLE_SLOTS.map((slot) => {
                            const isSlotActive = customSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => handleToggleSlotForDay(dayIndex, slot)}
                                className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                                  isSlotActive
                                    ? 'bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan font-bold'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 line-through'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: ALL BOOKINGS & REVENUE FEED */}
      {activeTab === 'bookings' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-6 animate-in fade-in duration-200">
          
          {/* Revenue & Volume Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-surface-border">
              <span className="text-[10px] uppercase font-mono text-zinc-500">Gross Studio Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-surface-border">
              <span className="text-[10px] uppercase font-mono text-zinc-500">Online Confirmed Bookings</span>
              <p className="text-xl sm:text-2xl font-black text-neon-cyan mt-1">{totalOnline} Sessions</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-surface-border">
              <span className="text-[10px] uppercase font-mono text-zinc-500">In-Chair Walk-in Clients</span>
              <p className="text-xl sm:text-2xl font-black text-purple-400 mt-1">{totalWalkIns} Sessions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client, phone, or ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === 'paid' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilter('pay_at_studio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === 'pay_at_studio' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Pay at Studio
              </button>
              <button
                onClick={() => setFilter('walkins')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === 'walkins' ? 'bg-purple-900/60 text-purple-200 border border-purple-700' : 'text-zinc-400'
                }`}
              >
                Walk-ins Only
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-zinc-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref & Client</th>
                  <th className="py-3 px-4">Service & Stylist</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Type & Status</th>
                  <th className="py-3 px-4 text-right">Direct WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {appointments
                  .filter((app) => {
                    if (filter === 'paid' && app.paymentStatus !== 'paid') return false;
                    if (filter === 'pay_at_studio' && app.paymentStatus !== 'pay_at_studio') return false;
                    if (filter === 'walkins' && !app.isWalkIn) return false;
                    const matchesSearch =
                      app.customerName.toLowerCase().includes(search.toLowerCase()) ||
                      app.customerPhone.includes(search) ||
                      app.bookingRef.toLowerCase().includes(search.toLowerCase());
                    return matchesSearch;
                  })
                  .map((app) => {
                    const clientWaLink = generateWhatsAppLink(app.customerPhone, app, 'customer');
                    const isWalkIn = Boolean(app.isWalkIn);

                    return (
                      <tr key={app.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-4 px-4">
                          <span
                            className={`font-mono text-[10px] font-bold block ${
                              isWalkIn ? 'text-purple-400' : 'text-neon-cyan'
                            }`}
                          >
                            #{app.bookingRef}
                          </span>
                          <span className="font-bold text-white text-sm block">{app.customerName}</span>
                          <span className="text-zinc-400 font-mono text-[11px]">{app.customerPhone}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-zinc-200 block">{app.serviceName}</span>
                          <span className="text-zinc-500 text-[11px]">Stylist: {app.stylistName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-zinc-300 font-medium block">{app.date}</span>
                          <span className="font-mono text-neon-cyan text-[11px]">{app.timeSlot}</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-white">
                          ₹{app.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {isWalkIn ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                                Walk-in
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                                Online
                              </span>
                            )}
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                app.paymentStatus === 'paid'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {app.paymentStatus === 'paid' ? 'Paid' : 'Pay at Studio'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <a
                            href={clientWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 5: WHATSAPP QR GATEWAY (OPTION 2 - BAILEYS) */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
          
          {/* LEFT 2 COLUMNS: QR CODE / CONNECTION STATUS */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border space-y-6">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 mb-2 font-mono">
                <span className={`w-2 h-2 rounded-full ${waGatewayStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {waGatewayStatus.isConnected ? 'Gateway Online & Linked' : 'Awaiting Device Link'}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Salon Business WhatsApp Gateway
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Link your official salon phone once via QR code. Once connected, 100% of appointment confirmations and walk-in alerts dispatch silently in the background from this number. Zero popups, zero manual clicking.
              </p>
            </div>

            {/* STATUS: CONNECTED */}
            {waGatewayStatus.isConnected ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Device Successfully Linked!</h3>
                      <p className="text-xs text-emerald-300 font-mono">
                        Connected as: +{waGatewayStatus.phone || '7894376562'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                    🟢 Active
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Every booking confirmed on the website will now send real WhatsApp messages directly to the <strong>Customer (+91 9908849156)</strong>, <strong>Stylist Swagat (+91 7981262237)</strong>, and <strong>Studio Manager (+91 7894376562)</strong> in the background. If a customer replies, it shows up directly on this phone!
                </p>

                <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Session stored securely in <code className="text-zinc-300">.wpp_auth</code>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetWaGateway}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-xs text-red-300 font-medium transition-colors"
                  >
                    Disconnect & Reset Session
                  </button>
                </div>
              </div>
            ) : waGatewayStatus.qrCode ? (
              /* STATUS: WAITING FOR QR SCAN */
              <div className="p-6 rounded-2xl bg-zinc-950/90 border border-surface-border text-center space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Scan with Salon WhatsApp to Link</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Open WhatsApp on the salon handset $\rightarrow$ <strong>Settings / 3 Dots</strong> $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong> $\rightarrow$ scan below:
                  </p>
                </div>

                <div className="inline-block p-4 rounded-3xl bg-white shadow-2xl border-4 border-emerald-500/40 animate-in zoom-in-95 duration-200">
                  <img
                    src={waGatewayStatus.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 object-contain rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Waiting for scan... Page will update automatically upon connection</span>
                </div>
              </div>
            ) : (
              /* STATUS: GATEWAY PROCESS PAUSED / STARTING */
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center border border-zinc-700">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Gateway Microservice Initializing</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  The background Baileys gateway service is starting on port 3001. Once started, the pairing QR code will appear here automatically.
                </p>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 inline-block">
                  npm run gateway
                </div>
              </div>
            )}

            {/* Architectural Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-surface-border">
                <span className="font-bold text-white block mb-0.5">100% Free & Unlimited</span>
                <span className="text-[11px] text-zinc-400">Uses WhatsApp companion device protocol without Meta fees.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-surface-border">
                <span className="font-bold text-white block mb-0.5">Full Background Flow</span>
                <span className="text-[11px] text-zinc-400">No browser popups or manual send clicks required.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-surface-border">
                <span className="font-bold text-white block mb-0.5">Two-Way Live Replies</span>
                <span className="text-[11px] text-zinc-400">Customer replies land directly in the salon phone's WhatsApp chat.</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: TEST MESSAGE DISPATCHER */}
          <div className="space-y-6">
            
            <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Send Direct Test Ping</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Verify background delivery from the linked phone:
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-mono">Recipient Phone Number</label>
                  <input
                    type="tel"
                    value={testWaPhone}
                    onChange={(e) => setTestWaPhone(e.target.value)}
                    placeholder="9908849156"
                    className="w-full px-3 py-2 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-mono">Message Text</label>
                  <textarea
                    rows={3}
                    value={testWaMessage}
                    onChange={(e) => setTestWaMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {testWaStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-mono ${
                      testWaStatus.startsWith('✓')
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-red-950/60 border border-red-800 text-red-300'
                    }`}
                  >
                    {testWaStatus}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSendingTestWa || !waGatewayStatus.isConnected}
                  onClick={handleSendTestWa}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    waGatewayStatus.isConnected
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTestWa ? 'Transmitting...' : 'Dispatch Test WhatsApp'}</span>
                </button>
                {!waGatewayStatus.isConnected && (
                  <p className="text-[10px] text-zinc-500 text-center font-mono">
                    ⚠️ Link phone with QR code first to enable sending
                  </p>
                )}
              </div>
            </div>

            {/* Automated Routing Rules */}
            <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-3 text-xs">
              <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">
                Automated Dispatch Targets
              </span>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>1. Customer</span>
                  <span className="text-white">+91 99088 49156</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>2. Master Stylist</span>
                  <span className="text-white">Swagat (+91 79812 62237)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>3. Studio Desk</span>
                  <span className="text-white">Manager (+91 78943 76562)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
