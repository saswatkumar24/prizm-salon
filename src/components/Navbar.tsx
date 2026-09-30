'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, User, LogOut, Calendar, LayoutDashboard, Menu, X, Shield, Lock } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isStaff = user?.role === 'manager' || user?.role === 'stylist';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & City Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink group-hover:opacity-90 transition-opacity">
                PRIZM
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
            </Link>
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider text-zinc-500 border-l border-zinc-800 pl-4 py-1">
              Mumbai · Est. 2019
            </span>
          </div>

          {/* Desktop Nav Links (Clean for customers) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-white ${
                pathname === '/' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              Studio
            </Link>
            <Link
              href="/#services"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Menu
            </Link>
            <Link
              href="/booking"
              className={`flex items-center gap-1.5 transition-colors hover:text-neon-cyan ${
                pathname === '/booking' ? 'text-neon-cyan font-semibold' : 'text-zinc-400'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Book a slot
            </Link>

            {/* Staff / Management Portal link */}
            {isStaff ? (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-full border ${
                  pathname === '/dashboard'
                    ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40 font-semibold'
                    : 'text-zinc-300 border-surface-border hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-neon-cyan" />
                <span>Dashboard ({user.role === 'manager' ? 'Manager' : 'Stylist'})</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
              >
                <Lock className="w-3 h-3" />
                <span>Staff Portal</span>
              </Link>
            )}
          </nav>

          {/* Right Action: Auth & Direct Contact */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-zinc-700 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.firstName ? user.firstName[0].toUpperCase() : 'P'}
                  </div>
                  <div className="text-xs pr-1">
                    <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Member'}
                      {user.role && user.role !== 'customer' && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-neon-purple/20 text-neon-pink font-mono font-bold">
                          {user.role}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {user.phone || user.email || 'Verified'}
                    </p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 py-2 bg-surface rounded-xl border border-surface-border shadow-2xl backdrop-blur-xl z-50">
                    <div className="px-4 py-2 border-b border-surface-border/60">
                      <p className="text-xs text-zinc-400">Signed in as</p>
                      <p className="text-xs font-semibold text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] uppercase font-mono text-neon-cyan">
                        Role: {user.role || 'Customer'}
                      </span>
                    </div>
                    <Link
                      href="/booking"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800/60"
                    >
                      Book a Slot
                    </Link>

                    {isStaff && (
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-neon-cyan hover:bg-zinc-800/60 font-semibold"
                      >
                        Stylist & Roster Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-surface hover:bg-zinc-800 border border-surface-border hover:border-zinc-600 transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-neon-cyan" />
                Sign In / OTP
              </button>
            )}

            <Link
              href="/booking"
              className="relative group overflow-hidden px-5 py-2.5 rounded-full text-xs font-semibold text-black bg-gradient-to-r from-neon-cyan to-white hover:opacity-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]"
            >
              Book a slot
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-surface-border px-6 py-6 space-y-4">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-300 hover:text-white py-1 text-sm font-medium"
          >
            Studio Home
          </Link>
          <Link
            href="/#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-300 hover:text-white py-1 text-sm font-medium"
          >
            Service Menu
          </Link>
          <Link
            href="/booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-neon-cyan py-1 text-sm font-medium"
          >
            Book a Slot
          </Link>

          {isStaff && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-neon-pink py-1 text-sm font-medium"
            >
              Stylist & Schedule Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-zinc-800">
            {user ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Logged in as <strong className="text-white">{user.firstName} {user.lastName}</strong> ({user.role})
                </p>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-red-950/30 text-red-400 border border-red-900/40 text-xs font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full py-2.5 px-4 rounded-full bg-white text-black font-semibold text-xs text-center"
              >
                Log In (Mobile OTP / Google)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
