'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SERVICES, SALON_INFO, STYLISTS } from '@/lib/data';
import { Sparkles, ArrowRight, Clock, ShieldCheck, Star, MapPin, Phone, Mail, MessageCircle, ChevronRight, Play, Pause, Check, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React 18 / browser autoplay requirement: explicitly set properties on DOM element
    video.defaultMuted = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const startPlay = () => {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Autoplay restricted by browser, playing on user gesture:', err);
        // Fallback: trigger play on first interaction anywhere on page
        const resumeOnInteraction = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          window.removeEventListener('click', resumeOnInteraction);
          window.removeEventListener('scroll', resumeOnInteraction);
          window.removeEventListener('touchstart', resumeOnInteraction);
        };
        window.addEventListener('click', resumeOnInteraction, { once: true, passive: true });
        window.addEventListener('scroll', resumeOnInteraction, { once: true, passive: true });
        window.addEventListener('touchstart', resumeOnInteraction, { once: true, passive: true });
      });
    };

    startPlay();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-prism-glow pointer-events-none z-10" />
      <div className="absolute top-80 right-[-150px] w-[500px] h-[500px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[1200px] left-[-150px] w-[500px] h-[500px] bg-neon-pink/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO SECTION WITH ACTIVE VIDEO BACKGROUND */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center min-h-[85vh] flex flex-col justify-center items-center overflow-hidden rounded-b-3xl">
        
        {/* Background Looping Video with Rich Visibility */}
        <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 rounded-3xl bg-zinc-950">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/clip-1.jpg"
            className="w-full h-full object-cover opacity-60 md:opacity-70 scale-105 filter brightness-105 contrast-110 transition-opacity duration-700"
          >
            <source src="/hero-salon.mp4" type="video/mp4" />
          </video>
          {/* Subtle contrast gradient overlays so text remains sharp & readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </div>

        {/* Video Control Bar / Indicator */}
        <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-zinc-300">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-neon-cyan" /> : <Play className="w-3 h-3 text-neon-cyan" />}
            <span>{isPlaying ? 'Studio Feed Playing' : 'Paused'}</span>
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={toggleMute}
            className="hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-400" /> : <Volume2 className="w-3.5 h-3.5 text-neon-cyan" />}
          </button>
        </div>

        {/* City & Year Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/90 border border-surface-border text-xs text-zinc-300 mb-8 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
          <span className="font-mono uppercase tracking-wider">{SALON_INFO.established}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08] drop-shadow-2xl">
          Hair that bends every <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink">colour</span> of the light.
        </h1>

        {/* Subtext */}
        <p className="mt-8 text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-light drop-shadow">
          Architectural cutting, multi-tonal colour and skin rituals under a ceiling of neon. Pick a slot, confirm on WhatsApp, walk in glowing.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 z-20">
          <Link
            href="/booking"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan to-white text-black font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_35px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 group"
          >
            <span>Book a slot</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#services"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface/80 backdrop-blur-md border border-surface-border text-white font-medium text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            See the menu
          </a>
        </div>

        {/* Live Status Board */}
        <div className="mt-14 inline-flex items-center gap-4 sm:gap-6 px-6 py-3 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-surface-border text-xs text-zinc-400 z-20 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-white font-medium">Board is Green</span>
          </div>
          <span className="text-zinc-700">|</span>
          <span>Lead Stylist: <strong className="text-white">Swagat</strong></span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <Check className="w-3.5 h-3.5" /> 3-Way WhatsApp Sync
          </span>
        </div>
      </section>

      {/* SERVICES MENU SECTION */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-mono uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Signatures & Rituals
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              The service menu.
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base font-light">
              Six signatures. Every price includes consultation, wash and finish.
            </p>
          </div>
          <Link
            href="/booking"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 text-xs font-semibold text-neon-cyan hover:underline tracking-wide uppercase font-mono"
          >
            View Live Availability
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="group relative rounded-3xl bg-surface/70 border border-surface-border p-8 flex flex-col justify-between hover:border-neon-cyan/40 transition-all hover:shadow-[0_10px_35px_-10px_rgba(0,240,255,0.2)]"
            >
              {s.tag && (
                <span className="absolute top-6 right-6 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-mono uppercase font-bold">
                  {s.tag}
                </span>
              )}

              <div>
                <span className="text-xs font-mono uppercase text-zinc-500">{s.category}</span>
                <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-neon-cyan transition-colors">
                  {s.name}
                </h3>
                <p className="mt-3 text-zinc-400 text-xs sm:text-sm leading-relaxed font-light">
                  {s.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 block">Pricing</span>
                  <span className="text-xl font-black text-white">₹{s.price.toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-zinc-400 ml-1.5 font-light">/ {s.duration}</span>
                </div>

                <Link
                  href={`/booking?service=${s.id}`}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neon-cyan transition-colors"
                >
                  Book slot
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS IN MOTION: AUTHENTIC VISUAL GALLERY */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-neon-pink">Behind the Lens</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
              Process in motion.
            </h2>
            <p className="mt-2 text-zinc-400 text-sm font-light">
              Your own clips drop straight into this gallery. Hand-painted tones under neon illumination.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Bandra Level 4 Studio</span>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-surface-border">
            <img
              src="/clip-1.jpg"
              alt="Prism Colour Session"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono text-neon-cyan">01 · Prism Colour Blend</span>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-surface-border">
            <img
              src="/clip-2.jpg"
              alt="Architectural Cut Work"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono text-white">02 · Structural Cut</span>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-surface-border">
            <img
              src="/clip-3.jpg"
              alt="Straight Razor Detailing"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono text-neon-pink">03 · Hot Towel Ritual</span>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-surface-border">
            <img
              src="/clip-4.jpg"
              alt="Studio Finish"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono text-white">04 · Chrome Mirror Shine</span>
            </div>
          </div>
        </div>
      </section>

      {/* STORY: COLOUR AS MATERIAL */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-border/50">
        <div className="rounded-3xl bg-gradient-to-br from-surface via-surface to-zinc-950 border border-surface-border p-8 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 blur-[100px] pointer-events-none" />
          
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-neon-pink">Our Philosophy</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">Colour as material.</h2>
            <p className="mt-6 text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
              Our colourists build tone in layers — a base that holds, mids that shift with the room, and highlights tuned to catch studio light. Every formula is logged in your private client profile so your next visit picks up exactly where this one ended.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-zinc-500">Botanical Low-Alkaline Pigment</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-2xl font-black text-white">12s</p>
                <p className="text-xs text-zinc-500">Average Slot Confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT ECHOES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-border/50">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Client echoes.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-surface border border-surface-border relative">
            <div className="flex gap-1 text-neon-cyan mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
              "Not a haircut — architectural maintenance. The colour work reads differently in every light."
            </p>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Rhea Mehta</span>
              <span className="text-zinc-500 font-mono">Prism Colour</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-surface-border relative">
            <div className="flex gap-1 text-neon-cyan mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
              "The slot booking took eleven seconds and the instant WhatsApp confirmation with stylist details was seamless."
            </p>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Kabir Verma</span>
              <span className="text-zinc-500 font-mono">Architectural Cut</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-surface-border relative">
            <div className="flex gap-1 text-neon-cyan mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
              "Best fade in the city, and the only place that gets my beard line exactly right with straight razor work."
            </p>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Aman Singhania</span>
              <span className="text-zinc-500 font-mono">Beard Sculpture</span>
            </div>
          </div>
        </div>
      </section>

      {/* COME SAY HELLO / FOOTER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Come say hello.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed font-light max-w-lg">
              Walk-ins welcome when the board is green, but the good slots go fast. Reserve online and receive immediate booking verification on WhatsApp.
            </p>

            <div className="mt-8 space-y-4 text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-neon-cyan shrink-0" />
                <span>{SALON_INFO.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-neon-pink shrink-0" />
                <a href={`tel:${SALON_INFO.phone}`} className="hover:text-white underline">
                  {SALON_INFO.phone} (Studio Desk)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-neon-purple shrink-0" />
                <a href={`mailto:${SALON_INFO.email}`} className="hover:text-white underline">
                  {SALON_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
                <span className="font-mono text-xs">{SALON_INFO.timings}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/booking"
                className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-neon-cyan transition-colors"
              >
                Reserve & Pay Online
              </Link>
              <a
                href={`https://wa.me/${SALON_INFO.whatsappNumber}?text=${encodeURIComponent('Hello PRIZM Salon, I would like to inquire about appointments.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Studio (+91 {SALON_INFO.whatsappNumber.slice(-10)})
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-surface border border-surface-border p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-500">Live Studio Board</span>
              <h3 className="text-xl font-bold text-white mt-1">Lead Stylist Availability</h3>
              <p className="text-xs text-zinc-400 mt-1">Swagat · Master Stylist (+91 79812 62237)</p>
            </div>

            <div className="my-6 space-y-2.5">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Swagat</span>
                  <span className="text-zinc-500">Prism Colour & Cut</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[11px]">
                  01:15 PM (Station Ready)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Dev K.</span>
                  <span className="text-zinc-500">Architectural Cut</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[11px]">
                  04:00 PM (Available)
                </span>
              </div>
            </div>

            <Link
              href="/booking"
              className="text-center py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              Lock a slot with Swagat →
            </Link>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© 2026 PRIZM Salon. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0 font-mono text-[11px]">
            <span>Instagram</span>
            <span>·</span>
            <span>YouTube</span>
            <span>·</span>
            <span>Vimeo</span>
          </div>
        </div>
      </section>

    </div>
  );
}
