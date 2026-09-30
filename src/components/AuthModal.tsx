'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, sendOtp, verifyOtp, saveProfileName, loginWithGoogle } = useAuth();

  const [authMethod, setAuthMethod] = useState<'otp' | 'google'>('otp');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile' | 'success'>('phone');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (targetPhone = phone) => {
    if (!targetPhone || targetPhone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await sendOtp(targetPhone);
      if (res.success) {
        setDispatchedOtp(res.testOtp || '123456');
        setStep('otp');
      } else {
        setErrorMessage(res.message || 'Failed to send OTP code');
      }
    } catch (e) {
      setErrorMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setErrorMessage('Enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await verifyOtp(phone, otp);
      if (res.success) {
        if (res.isNewUser) {
          setStep('profile');
        } else {
          setStep('success');
          setTimeout(() => {
            closeAuthModal();
            resetState();
          }, 1500);
        }
      } else {
        setErrorMessage(res.error || 'Invalid code');
      }
    } catch (e) {
      setErrorMessage('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide both first and last name');
      return;
    }
    saveProfileName(firstName.trim(), lastName.trim());
    setStep('success');
    setTimeout(() => {
      closeAuthModal();
      resetState();
    }, 1500);
  };

  const resetState = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setFirstName('');
    setLastName('');
    setErrorMessage('');
    setDispatchedOtp(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-surface border border-surface-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-neon-purple/20 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            closeAuthModal();
            resetState();
          }}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/40 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-[11px] text-zinc-300 font-mono uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3 text-neon-cyan" />
            PRIZM Member Access
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {step === 'phone' && 'Welcome to the Studio'}
            {step === 'otp' && 'Verify Your Mobile'}
            {step === 'profile' && 'Complete Your Profile'}
            {step === 'success' && 'Welcome Aboard!'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {step === 'phone' && 'Sign in to reserve bespoke slots and receive WhatsApp notifications.'}
            {step === 'otp' && `Enter the 6-digit code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
            {step === 'profile' && 'Tell us your name so your stylist can personalize your formula.'}
            {step === 'success' && 'Your account is verified and ready.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Input & Method Selection */}
        {step === 'phone' && (
          <div className="space-y-4">
            
            {/* Google One-Click Login */}
            <button
              onClick={loginWithGoogle}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-semibold text-xs flex items-center justify-center gap-3 transition-colors shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">or via mobile otp</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Quick Test Number Chip */}
            <div className="p-2.5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-between">
              <span className="text-[11px] text-zinc-300 font-medium">Test Mobile No:</span>
              <button
                type="button"
                onClick={() => {
                  setPhone('9908849156');
                  handleSendOtp('9908849156');
                }}
                className="text-[11px] font-semibold text-neon-cyan hover:underline flex items-center gap-1"
              >
                9908849156 (Click to Test)
              </button>
            </div>

            {/* Phone Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Mobile Number</label>
              <div className="flex rounded-xl bg-zinc-900 border border-surface-border focus-within:border-neon-cyan transition-colors overflow-hidden">
                <span className="px-3.5 py-3 text-xs font-semibold text-zinc-400 bg-zinc-800/60 border-r border-surface-border flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="99088 49156"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 bg-transparent px-3.5 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => handleSendOtp()}
              disabled={loading || phone.length < 10}
              className="w-full py-3 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 disabled:opacity-40 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            >
              {loading ? 'Sending code...' : 'Get Verification Code'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-4">
            
            {/* Active Test OTP helper banner */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Live Verification Code Dispatched:
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span>OTP for test: <strong className="text-white text-base tracking-widest">{dispatchedOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(dispatchedOtp || '123456')}
                  className="px-2 py-0.5 rounded bg-emerald-800/60 text-[10px] text-white hover:bg-emerald-700"
                >
                  Auto-fill
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-xl font-mono py-3 bg-zinc-900 border border-surface-border rounded-xl text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full py-3 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 disabled:opacity-40 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              <ShieldCheck className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="hover:text-zinc-300 underline"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-neon-cyan hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Profile (First & Last Name) */}
        {step === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saswat"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patro"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-surface-border rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-cyan"
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              Your name will be associated with booking notifications sent to your WhatsApp.
            </p>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              Complete Registration
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 4: Success animation */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-white">Verification Complete!</p>
            <p className="text-xs text-zinc-400">Loading your salon experience...</p>
          </div>
        )}

      </div>
    </div>
  );
}
