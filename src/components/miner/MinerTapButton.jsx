import React, { useState, useEffect, useRef } from 'react';
import { Pickaxe, Flame, AlertTriangle, Zap, CheckCircle2, ShieldCheck, Clock, Sparkles, Activity, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * 3D Tap-to-Mine Reactor Button with 12h Cycle & Early Check-In
 * Enhanced with deep tactile 3D extrusion, perspective dome, mechanical turbine bevels, and glowing orbital rings.
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
  const holdStartRef = useRef(0);
  const animFrameRef = useRef(null);

  const { isMiningActive, sessionStartTime, sessionDurationMs, minedTflx } = minerData;

  const now = Date.now();
  const elapsedMs = isMiningActive ? now - sessionStartTime : sessionDurationMs;
  const remainingMs = Math.max(0, sessionDurationMs - elapsedMs);

  // Cycle States:
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
  const handleHoldStart = () => {
    if (isExpired) {
      onStartMining();
      return;
    }

    if (!isSecondHalf) return;

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

  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / sessionDurationMs) * 100));

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      {/* 3D REACTOR MECHANICAL PLATFORM */}
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow pulse */}
        <div
          className={`absolute -inset-6 sm:-inset-8 rounded-full filter blur-2xl transition-all duration-700 pointer-events-none opacity-50 ${
            isFirstHalf
              ? 'bg-emerald-500/40'
              : isSecondHalf
              ? 'bg-amber-500/40'
              : 'bg-rose-500/40'
          }`}
        />

        {/* 3D Mechanical Outer Base Ring with Beveled Rim */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2.5 bg-gradient-to-b from-[#e4ded2] via-[#cfc7b6] to-[#b8af9c] dark:from-[#1b3d47] dark:via-[#11282f] dark:to-[#091519] shadow-[0_20px_40px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center">
          {/* Inner Groove Track & Hash Ticks */}
          <div className="absolute inset-2 rounded-full border border-dashed border-black/20 dark:border-white/20 pointer-events-none" />

          {/* Rotating Laser Beam / Orbital Energy Ring (Active Mining) */}
          {isMiningActive && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              className="absolute inset-1 rounded-full border-2 border-transparent border-t-emerald-400 border-r-amber-400 opacity-70 pointer-events-none"
            />
          )}

          {/* Circular Progress Ring for Hold-to-renew (Orange phase) */}
          {isSecondHalf && isHolding && (
            <svg className="absolute w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] -rotate-90 pointer-events-none z-30">
              <circle
                cx="120"
                cy="120"
                r="112"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 112}
                strokeDashoffset={(2 * Math.PI * 112) * (1 - holdProgress / 100)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}

          {/* MAIN 3D TACTILE PUSH-BUTTON (Physical 3D Bevel, Extrusion & Depress) */}
          <button
            type="button"
            id="btn-tap-to-mine"
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            className={`group relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-150 outline-none transform active:translate-y-2.5 select-none ${
              isFirstHalf
                ? 'bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] border-4 border-[#34d399] shadow-[0_16px_0px_#064e3b,0_25px_35px_rgba(0,0,0,0.5),inset_0_4px_8px_rgba(255,255,255,0.6),inset_0_-8px_16px_rgba(0,0,0,0.4)] active:shadow-[0_4px_0px_#064e3b,0_10px_15px_rgba(0,0,0,0.3)]'
                : isSecondHalf
                ? 'bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] border-4 border-[#fde047] shadow-[0_16px_0px_#78350f,0_25px_35px_rgba(0,0,0,0.5),inset_0_4px_8px_rgba(255,255,255,0.6),inset_0_-8px_16px_rgba(0,0,0,0.4)] active:shadow-[0_4px_0px_#78350f,0_10px_15px_rgba(0,0,0,0.3)]'
                : 'bg-gradient-to-b from-[#f43f5e] via-[#e11d48] to-[#9f1239] border-4 border-[#fb7185] shadow-[0_16px_0px_#4c0519,0_25px_35px_rgba(0,0,0,0.5),inset_0_4px_8px_rgba(255,255,255,0.6),inset_0_-8px_16px_rgba(0,0,0,0.4)] active:shadow-[0_4px_0px_#4c0519,0_10px_15px_rgba(0,0,0,0.3)] animate-pulse'
            }`}
          >
            {/* Top 3D Curvature Specular Light Arc */}
            <div className="absolute top-2 w-32 sm:w-36 h-10 sm:h-12 rounded-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none blur-2xs" />

            {/* Inner Holographic 3D Convex Lens */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-black/25 via-transparent to-white/20 pointer-events-none" />

            {/* Center Floating 3D Icon & Typography */}
            <div className="relative z-20 flex flex-col items-center justify-center text-white text-center px-3">
              {/* Floating 3D Icon */}
              <motion.div
                animate={isMiningActive ? { y: [-2, 2, -2], rotate: [0, 4, -4, 0] } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="p-3 sm:p-3.5 rounded-2xl bg-black/25 backdrop-blur-sm mb-1.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_6px_12px_rgba(0,0,0,0.3)] border border-white/20"
              >
                {isFirstHalf && <Pickaxe className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" />}
                {isSecondHalf && <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" />}
                {isExpired && <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-200 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" />}
              </motion.div>

              {/* Status Action Title */}
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {isFirstHalf && 'MINING ACTIVE (3D)'}
                {isSecondHalf && (isHolding ? `HOLDING (${Math.round(holdProgress)}%)` : 'HOLD 2S TO RENEW')}
                {isExpired && 'TAP TO MINE'}
              </span>

              {/* Dynamic Hashrate / Countdown Subtext */}
              <span className="text-[10px] sm:text-[11px] font-bold opacity-95 mt-0.5 tracking-tight drop-shadow-sm">
                {isFirstHalf && `+${effectiveHashrate.toFixed(1)} TFLX/h LIVE`}
                {isSecondHalf && `${formatTime(remainingMs)} Left in Cycle`}
                {isExpired && '12H Cloud Node Ready'}
              </span>
            </div>

            {/* Bottom 3D Specular Highlight */}
            <div className="absolute bottom-3 w-28 sm:w-32 h-3 rounded-full bg-white/15 blur-xs pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Sleek, Beautiful & Normal Mining Active Console */}
      <div className="w-full max-w-md mt-6 bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Top Status & Clean Countdown */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center gap-2">
            {isFirstHalf && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Mining Active</span>
              </div>
            )}
            {isSecondHalf && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Early Check-In</span>
              </div>
            )}
            {isExpired && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Session Expired</span>
              </div>
            )}
          </div>

          {/* Clean Time Countdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
            <Clock className="w-3.5 h-3.5 text-[#7a8c94] dark:text-[#94a3b8]" />
            <span className="font-mono text-xs sm:text-sm font-black tracking-wide text-[#09353e] dark:text-[#38bdf8] tabular-nums">
              {formatTime(remainingMs)}
            </span>
          </div>
        </div>

        {/* Clean Progress Indicator */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8]">
            <span>Cycle Progress</span>
            <span>{Math.round(progressPercent)}% Elapsed</span>
          </div>
          <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFirstHalf
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : isSecondHalf
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3-Column Micro-Stats: Boost + Daily Yield + Session Cycle */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#ece6d9] dark:border-[#173740] text-center">
          <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase block">
              Boost
            </span>
            <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{effectiveHashrate.toFixed(1)}/h
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase block">
              Daily Yield
            </span>
            <p className="text-xs sm:text-sm font-black text-[#0c5963] dark:text-[#38bdf8] mt-0.5">
              +{(effectiveHashrate * 24).toFixed(0)} TFLX
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase block">
              Session Cycle
            </span>
            <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
              12 Hours
            </p>
          </div>
        </div>

        {/* Dynamic Context Notice */}
        <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-3 leading-relaxed text-center font-medium">
          {isFirstHalf && 'Cloud mining is active with 0% battery and CPU load.'}
          {isSecondHalf && 'Early Check-In active: Hold button for 2s to renew for another 12 hours.'}
          {isExpired && 'Session complete. Tap the button above to ignite a fresh 12h run.'}
        </p>
      </div>
    </div>
  );
}
