import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * TAEMRY FLUX Splash Screen Loader
 * Renders an app-grade immersive splash screen with brand aesthetics,
 * glowing logo halo, animated progress line, and network-aware timing.
 */
export default function PageLoader({ isLoading, targetPage = '', onFinished }) {
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [visible, setVisible] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Splash animation timer & progress
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setIsFadingOut(false);
      }, 200);
      return () => clearTimeout(timer);
    }

    setVisible(true);
    setIsFadingOut(false);
    setProgress(20);

    // Detect slow internet
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const conn = nav && (nav.connection || nav.mozConnection || nav.webkitConnection);
    
    let isSlow = false;
    if (conn) {
      if (
        conn.effectiveType === 'slow-2g' ||
        conn.effectiveType === '2g' ||
        conn.effectiveType === '3g' ||
        (conn.rtt && conn.rtt > 350) ||
        (conn.downlink && conn.downlink < 1.5)
      ) {
        isSlow = true;
      }
    }
    setIsSlowConnection(isSlow);

    if (isOffline) {
      setProgress(40);
      return;
    }

    // Splash duration: snappy 250ms on fast connection, 700ms on weak connection
    const targetDuration = isSlow ? 700 : 250;
    const intervalTime = 16;
    const steps = Math.max(1, Math.round(targetDuration / intervalTime));
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const pct = Math.min(96, Math.round((currentStep / steps) * 96));
      setProgress(pct);

      if (currentStep >= steps) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            if (onFinished) onFinished();
            setVisible(false);
            setIsFadingOut(false);
          }, 120);
        }, 40);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isLoading, isOffline, onFinished]);

  if (!visible) return null;

  return (
    <div
      id="taemry-splash-loader"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between py-12 px-6 bg-[#faf8f5] dark:bg-[#07151a] transition-all duration-200 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-[1.02]' : 'opacity-100'
      }`}
    >
      {/* Subtle Top Ambient Bar / Spacer */}
      <div className="w-full max-w-sm flex items-center justify-between opacity-50 text-[10px] uppercase font-bold tracking-widest text-[#0a3a46]/60 dark:text-slate-400">
        <span>TAEMRY OS</span>
        <span className="flex items-center gap-1">
          {isOffline ? (
            <span className="text-amber-500 flex items-center gap-1 font-bold">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          )}
        </span>
      </div>

      {/* Main Center Splash Content */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {/* Glow halo behind the brand icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#0d5963]/30 via-[#0f766e]/20 to-[#10b981]/25 dark:from-[#38bdf8]/25 dark:to-[#0f766e]/30 blur-2xl animate-pulse" />
          <div className="relative transform transition-transform duration-500 hover:scale-105">
            <Logo size="xl" showText={false} />
          </div>
        </div>

        {/* Brand Display Title */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-display font-black text-2xl md:text-3xl tracking-wider text-[#0a3a46] dark:text-[#f8fafc] uppercase">
            TAEMRY
          </h1>
          <span className="font-display font-black text-2xl md:text-3xl tracking-wider text-[#0d5963] dark:text-[#38bdf8] uppercase">
            FLUX
          </span>
        </div>

        {/* Dynamic Status / Progress Note */}
        <div className="min-h-[22px] flex items-center justify-center text-xs font-medium text-[#0a3a46]/80 dark:text-slate-300">
          {isOffline ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Reconnecting to network...
            </span>
          ) : targetPage ? (
            <span className="text-[#0d5963] dark:text-[#38bdf8] font-semibold tracking-wide">
              {targetPage}
            </span>
          ) : null}
        </div>
      </div>

      {/* Splash Footer: Security & Encryption Tag */}
      <div className="flex flex-col items-center gap-1 text-[11px] text-[#82979a] dark:text-[#64748b]">
        <span className="font-medium tracking-wide">End-to-End Encrypted Session</span>
        <span className="text-[10px] opacity-70">v2.4.0 &bull; Secure Cloud Infrastructure</span>
      </div>
    </div>
  );
}
