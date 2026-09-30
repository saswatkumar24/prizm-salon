'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; testOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; isNewUser: boolean; error?: string }>;
  saveProfileName: (firstName: string, lastName: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginAsStaff: (role: 'manager' | 'stylist') => void;
  loginWithStaffCredentials: (userId: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('prizm_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const sendOtp = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error sending OTP' };
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('prizm_user', JSON.stringify(data.user));
        return { success: true, isNewUser: data.isNewUser };
      }
      return { success: false, isNewUser: false, error: data.error || 'Invalid OTP code' };
    } catch (error) {
      return { success: false, isNewUser: false, error: 'Verification failed' };
    }
  };

  const saveProfileName = (firstName: string, lastName: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      firstName,
      lastName,
    };
    setUser(updated);
    localStorage.setItem('prizm_user', JSON.stringify(updated));
  };

  const loginWithGoogle = async () => {
    const googleUser: UserProfile = {
      id: 'usr_goog_' + Math.random().toString(36).substring(2, 9),
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex.morgan.studio@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'customer',
      loginMethod: 'google'
    };
    setUser(googleUser);
    localStorage.setItem('prizm_user', JSON.stringify(googleUser));
    closeAuthModal();
  };

  const loginAsStaff = (role: 'manager' | 'stylist') => {
    const staffUser: UserProfile = role === 'manager'
      ? {
          id: 'usr_staff_manager_prizm',
          userId: 'manager_prizm',
          firstName: 'Studio',
          lastName: 'Manager',
          phone: '+91 78943 76562',
          role: 'manager',
          loginMethod: 'staff_password',
        }
      : {
          id: 'usr_staff_swagat_prizm',
          userId: 'swagat_prizm',
          firstName: 'Swagat',
          lastName: 'Master Stylist',
          phone: '+91 79812 62237',
          role: 'stylist',
          stylistId: 'swagat',
          loginMethod: 'staff_password',
        };

    setUser(staffUser);
    localStorage.setItem('prizm_user', JSON.stringify(staffUser));
    closeAuthModal();
  };

  const loginWithStaffCredentials = async (userId: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: pass }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('prizm_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: 'Connection failure during login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prizm_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        verifyOtp,
        saveProfileName,
        loginWithGoogle,
        loginAsStaff,
        loginWithStaffCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
