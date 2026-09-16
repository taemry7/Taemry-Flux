import React, { useState, useEffect, useRef } from 'react';
import { Pickaxe, Flame, AlertTriangle, Zap, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * 3D Tap-to-Mine Reactor Button with 12h Cycle & Early Check-In
 * - 0 to 6 Hours: Green 3D Active Mining
 * - 6 to 12 Hours: Orange/Yellow 3D Early Check-in (Tap & Hold 2s)
 * - > 12 Hours / Expired: Warning Red 3D (Single tap to ignite)
 */
export default function MinerTapButton({
  minerData,
  onStartMining,
  onRenewSessionEarly,
  effectiveHashrate,
}) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(0);
  const animFrameRef = useRef(null);

  const { isMiningActive, sessionStartTime, sessionDurationMs, minedTflx } = minerData;

  const now = Date.now();
  const elapsedMs = isMiningActive ? now - sessionStartTime : sessionDurationMs;
  const remainingMs = Math.max(0, sessionDurationMs - elapsedMs);

  // States:
  // 1. Inactive / Expired (> 12h): Warning Red
  // 2. First 6h: Green 3D (remainingMs > 6h)
  // 3. Second 6h: Orange/Yellow 3D (remainingMs <= 6h && remainingMs > 0)
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const isExpired = !isMiningActive || remainingMs <= 0;
  const isFirstHalf = isMiningActive && remainingMs > sixHoursMs;
  const isSecondHalf = isMiningActive && remainingMs <= sixHoursMs && remainingMs > 0;

  // Format remaining time to HH:MM:SS
  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2-Second Tap and Hold Logic for Early Check-in (Orange phase)
  const handleHoldStart = (e) => {
    if (isExpired) {
      // Direct click to ignite
      onStartMining();
      return;
    }

    if (!isSecondHalf) {
      // In first half, no need to renew yet
      return;
    }

    setIsHolding(true);
    holdStartRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 2000) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setIsHolding(false);
        setHoldProgress(0);
        onRenewSessionEarly();
      } else {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleHoldEnd = () => {
    if (!isHolding) return;
    setIsHolding(false);
    setHoldProgress(0);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 3D REACTOR BUTTON CONTAINER */}
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow ring */}
        <div
          className={`absolute -inset-4 rounded-full filter blur-xl transition-all duration-700 pointer-events-none opacity-60 ${
            isFirstHalf
              ? 'bg-emerald-500/40'
              : isSecondHalf
              ? 'bg-amber-500/40'
              : 'bg-rose-500/40'
          }`}
        />

        {/* Circular Progress Ring for Hold-to-renew (Orange phase) */}
        {isSecondHalf && isHolding && (
          <svg className="absolute w-[240px] h-[240px] -rotate-90 pointer-events-none z-20">
            <circle
              cx="120"
              cy="120"
              r="108"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 108}
              strokeDashoffset={(2 * Math.PI * 108) * (1 - holdProgress / 100)}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Main 3D Tap Button */}
        <button
          type="button"
          id="btn-tap-to-mine"
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          className={`group relative w-52 h-52 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 outline-none transform active:scale-95 ${
            isFirstHalf
              ? 'bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] shadow-[0_15px_30px_rgba(5,150,105,0.4),inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-8px_12px_rgba(0,0,0,0.3)] border-4 border-[#34d399]'
              : isSecondHalf
              ? 'bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-[0_15px_30px_rgba(217,119,6,0.4),inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-8px_12px_rgba(0,0,0,0.3)] border-4 border-[#fbbf24]'
              : 'bg-gradient-to-b from-[#f43f5e] via-[#e11d48] to-[#be123c] shadow-[0_15px_30px_rgba(225,29,72,0.4),inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-8px_12px_rgba(0,0,0,0.3)] border-4 border-[#fb7185] animate-pulse'
          }`}
        >
          {/* Inner 3D Highlight Dome */}
          <div className="absolute inset-2.5 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

          {/* Central Animated Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white">
            <motion.div
              animate={isMiningActive ? { rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="p-3 rounded-2xl bg-black/15 backdrop-blur-xs mb-1.5 shadow-inner"
            >
              {isFirstHalf && <Pickaxe className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md text-emerald-100" />}
              {isSecondHalf && <Flame className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md text-amber-100" />}
              {isExpired && <AlertTriangle className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md text-rose-100" />}
            </motion.div>

            {/* Status Title */}
            <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase drop-shadow-sm">
              {isFirstHalf && 'MINING ACTIVE'}
              {isSecondHalf && (isHolding ? `HOLDING (${Math.round(holdProgress)}%)` : 'HOLD 2S TO RENEW')}
              {isExpired && 'TAP TO MINE'}
            </span>

            {/* Sub-label */}
            <span className="text-[10px] sm:text-[11px] font-semibold opacity-90 mt-0.5">
              {isFirstHalf && `+${effectiveHashrate.toFixed(1)} TFLX/h`}
              {isSecondHalf && `${formatTime(remainingMs)} Left`}
              {isExpired && '12H Session Ready'}
            </span>
          </div>

          {/* Bottom specular reflection */}
          <div className="absolute bottom-3 w-28 h-4 rounded-full bg-white/10 blur-xs pointer-events-none" />
        </button>
      </div>

      {/* Unified Status & Countdown Session Card (Combined Module) */}
      <div className="w-full max-w-sm mt-7 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-2xl p-4 shadow-sm text-center">
        {/* Integrated Status Badge & Time */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center gap-1.5">
            {isFirstHalf && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active (Cloud)
              </span>
            )}
            {isSecondHalf && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold animate-pulse">
                <Clock className="w-3 h-3" />
                Early Check-In
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                Expired
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#7a8c94] dark:text-[#94a3b8]">Time:</span>
            <span className="font-mono font-bold text-xs text-[#09353e] dark:text-[#f1f5f9]">
              {formatTime(remainingMs)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFirstHalf
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : isSecondHalf
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (elapsedMs / sessionDurationMs) * 100))}%` }}
          />
        </div>

        {/* Help tooltip note */}
        <p className="text-[11px] text-[#718589] dark:text-[#94a3b8] mt-2 leading-tight">
          {isFirstHalf && 'Session runs continuously in cloud. Phone CPU & battery are 100% idle.'}
          {isSecondHalf && 'After 6 hours, button turns orange. Hold 2 seconds to renew for another 12h without losing streak!'}
          {isExpired && 'Session expired. Tap the red button to ignite a fresh 12h cloud mining session.'}
        </p>
      </div>
    </div>
  );
}
