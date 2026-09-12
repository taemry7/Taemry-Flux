import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

/**
 * Intelligent Adaptive Page Loader
 * - Fast/Normal Internet: Half a second (200ms) smooth loading transition
 * - Slow/Weak Internet: 1.5s - 2s loading with optimization indicator
 * - Offline/No Internet: Stays loading until connection recovers
 */
export default function PageLoader({ isLoading, targetPage = '', onFinished }) {
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [visible, setVisible] = useState(isLoading);

  // Monitor online / offline status
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

  // Determine network speed and run loading animation
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }

    setVisible(true);
    setProgress(15);

    // Detect weak / slow internet
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

    // If offline, wait indefinitely until back online
    if (isOffline) {
      setProgress(35);
      return;
    }

    // Duration: 200 milliseconds for fast loading, slightly adaptive for slow connections
    const targetDuration = isSlow ? 600 : 200;
    const intervalTime = 20;
    const steps = Math.max(1, Math.round(targetDuration / intervalTime));
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const pct = Math.min(95, Math.round((currentStep / steps) * 95));
      setProgress(pct);

      if (currentStep >= steps) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          if (onFinished) onFinished();
          setVisible(false);
        }, 50);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isLoading, isOffline, onFinished]);

  if (!visible) return null;

  return (
    <div
      id="taemry-page-loader"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#faf8f5]/90 dark:bg-[#07151a]/95 backdrop-blur-md transition-opacity duration-200"
    >
      <div className="flex flex-col items-center max-w-xs w-full px-6 text-center">
        {/* Animated Brand Logo */}
        <div className="relative mb-6">
          <Logo size="lg" showText={false} />
        </div>
        {/* Dynamic Status Text */}
        <p className="text-xs font-medium text-[#647c81] dark:text-[#94a3b8] mb-4 min-h-[18px]">
          {isOffline ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Internet weak / disconnected. Waiting to reconnect...
            </span>
          ) : isSlowConnection ? (
            <span className="text-[#0d5963] dark:text-[#38bdf8] flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Weak connection detected &bull; Optimizing page securely...
            </span>
          ) : (
            <span className="text-[#647c81] dark:text-[#94a3b8] flex items-center justify-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#10b981]" />
              {targetPage ? `Opening ${targetPage}...` : 'Loading page...'}
            </span>
          )}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-[#e8e2d8] dark:bg-[#122b33] h-1.5 rounded-full overflow-hidden shadow-inner mb-2">
          <div
            className="bg-gradient-to-r from-[#0d5963] via-[#0f766e] to-[#10b981] h-full rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timing / Speed Hint */}
        <div className="flex items-center justify-between w-full text-[10px] font-semibold text-[#82979a] dark:text-[#64748b]">
          <span>
            {isOffline
              ? 'Offline'
              : isSlowConnection
              ? 'Weak network'
              : 'Fast network'}
          </span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
