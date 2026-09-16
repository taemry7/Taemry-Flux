import React, { useState, useEffect, useRef } from 'react';
import { Flame, AlertTriangle, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Clean Fire Reactor Button (No Circle) with:
 * - 1-second hold with audio chime tune
 * - Blue Fire Active state
 * - 6h+ early renewal on 1s hold
 * - 12h expired warning red with 1s hold to ignite blue fire
 */
export default function MinerTapButton({
  minerData,
  onStartMining,
  onRenewSessionEarly,
  effectiveHashrate,
  isPackageActive = true,
}) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdStartRef = useRef(0);
  const animFrameRef = useRef(null);

  const { isMiningActive, sessionStartTime, sessionDurationMs } = minerData;

  const now = Date.now();
  const elapsedMs = isMiningActive ? now - sessionStartTime : sessionDurationMs;
  const remainingMs = Math.max(0, sessionDurationMs - elapsedMs);

  const sixHoursMs = 6 * 60 * 60 * 1000;
  const isExpired = !isMiningActive || remainingMs <= 0;
  const isFirstHalf = isMiningActive && remainingMs > sixHoursMs;
  const isSecondHalf = isMiningActive && remainingMs <= sixHoursMs && remainingMs > 0;

  // Audio ignition tune generator using Web Audio API
  const playIgniteTune = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const startTime = ctx.currentTime;

      // Cyber futuristic blue fire chime: 4 rising harmonic sine tones
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

        gain.gain.setValueAtTime(0, startTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, startTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.08);
        osc.stop(startTime + idx * 0.08 + 0.4);
      });
    } catch (err) {
      console.log('Web Audio ignition notice:', err);
    }
  };

  // Format remaining time to HH:MM:SS
  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tap & Hold Logic: Hold for exactly 1 second (1000ms) to start/renew session
  // Rule: Do not allow hold until 6 hours have completed during an active session
  const handleHoldStart = () => {
    if (isPackageActive === false) {
      onStartMining(); // Triggers "Ineligible to Mine: Package buy karne ke baad ye eligible aur activate hoga."
      return;
    }
    if (isFirstHalf) return; // Block hold until 6 hours have elapsed

    setIsHolding(true);
    holdStartRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - holdStartRef.current;
      // Exactly 1 second hold (1000ms)
      const progress = Math.min(100, (elapsed / 1000) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setIsHolding(false);
        setHoldProgress(0);
        // Play futuristic sound tune
        playIgniteTune();

        if (isExpired || !minerData.isMiningActive) {
          onStartMining();
        } else {
          onRenewSessionEarly();
        }
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
      {/* Clean Fire Button Container */}
      <div className="relative flex items-center justify-center w-full max-w-sm py-4">
        {/* Glowing Blue Fire Blur Aura (Static rounded-3xl) */}
        <div
          className={`absolute -inset-3 sm:-inset-4 rounded-3xl filter blur-2xl transition-all duration-700 pointer-events-none ${
            isHolding
              ? 'bg-gradient-to-r from-cyan-400/90 via-blue-500/90 to-indigo-600/80 opacity-100 scale-105 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500/75 via-blue-600/70 to-indigo-600/60 opacity-90'
          }`}
        />

        {/* Clean Static Rounded Fire Button (Hold unlocked after 6 hours per user request) */}
        <button
          type="button"
          id="btn-tap-to-mine"
          disabled={isFirstHalf}
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          title={isFirstHalf ? `Mining active. Hold unlocks in ${formatTime(remainingMs - sixHoursMs)}` : 'Hold 1s to start/renew mining session'}
          className={`relative w-full max-w-sm py-7 px-6 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 outline-none select-none overflow-hidden ${
            isFirstHalf
              ? 'cursor-not-allowed bg-gradient-to-b from-[#02101f] via-[#082f49] to-[#0c4a6e] text-white shadow-xl shadow-cyan-900/30 ring-2 ring-cyan-500/40 opacity-95'
              : isHolding
              ? 'cursor-pointer bg-gradient-to-b from-[#02182b] via-[#0284c7] to-[#0369a1] text-white shadow-2xl ring-4 ring-cyan-300 scale-98 shadow-cyan-500/50'
              : 'cursor-pointer bg-gradient-to-b from-[#02101f] via-[#082f49] to-[#0c4a6e] text-white shadow-2xl shadow-cyan-600/40 ring-2 ring-cyan-400/60 hover:scale-[1.01]'
          }`}
        >
          {/* Top Glass Specular Curve */}
          <div className="absolute top-0 inset-x-4 h-5 bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl pointer-events-none" />

          {/* REAL BLUE FIRE BACKGROUND & SLOWMO RISING EMBERS */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Real Blue Heat Radial Glow at Base - Slowmo Pulse */}
            <motion.div
              animate={{ opacity: [0.75, 0.95, 0.75], scaleY: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: isHolding ? 1.2 : 4.0, ease: 'easeInOut' }}
              className="absolute bottom-0 inset-x-0 h-32 rounded-full blur-xl bg-gradient-to-t from-cyan-400/80 via-blue-500/50 to-transparent"
            />

            {/* Rising Blue Sparks / Embers Particle Stream in Slow-Motion (Slowmo) */}
            {[
              { left: '18%', duration: 4.8, delay: 0.2, size: 'w-1 h-1' },
              { left: '30%', duration: 5.4, delay: 1.1, size: 'w-1.5 h-1.5' },
              { left: '42%', duration: 4.2, delay: 0.5, size: 'w-1 h-1' },
              { left: '52%', duration: 5.8, delay: 1.6, size: 'w-2 h-2' },
              { left: '65%', duration: 4.6, delay: 0.8, size: 'w-1 h-1' },
              { left: '78%', duration: 5.2, delay: 1.9, size: 'w-1.5 h-1.5' },
              { left: '25%', duration: 6.0, delay: 2.3, size: 'w-1 h-1' },
              { left: '72%', duration: 5.0, delay: 2.7, size: 'w-1.5 h-1.5' },
            ].map((spark, idx) => (
              <motion.div
                key={idx}
                animate={{
                  y: [35, -115],
                  x: [0, (idx % 2 === 0 ? 10 : -10), (idx % 3 === 0 ? -14 : 14)],
                  opacity: [0, 1, 0.85, 0],
                  scale: [0.7, 1.25, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: isHolding ? spark.duration * 0.4 : spark.duration,
                  delay: spark.delay,
                  ease: 'easeInOut',
                }}
                className={`absolute bottom-3 rounded-full ${spark.size} bg-cyan-200 shadow-[0_0_10px_#22d3ee]`}
                style={{ left: spark.left }}
              />
            ))}

            {/* Animated SVG Dancing Blue Flame Layer Tongues in Slow-Motion */}
            <div className="absolute inset-x-0 bottom-0 h-28 flex items-end justify-center opacity-65">
              <motion.svg
                viewBox="0 0 100 80"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Pure Blue Fire Gradient */}
                  <linearGradient id="blueFireOuter" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="blueFireInner" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#e0f2fe" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Outer Blue Flame Waves (Slowmo) */}
                <motion.path
                  d="M0 80 Q 15 35 25 55 T 50 25 T 75 50 T 100 80 Z"
                  fill="url(#blueFireOuter)"
                  animate={{
                    d: [
                      'M0 80 Q 15 35 25 55 T 50 25 T 75 50 T 100 80 Z',
                      'M0 80 Q 20 45 35 35 T 60 15 T 85 40 T 100 80 Z',
                      'M0 80 Q 10 30 20 60 T 45 30 T 70 45 T 100 80 Z',
                      'M0 80 Q 15 35 25 55 T 50 25 T 75 50 T 100 80 Z',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: isHolding ? 1.4 : 4.4, ease: 'easeInOut' }}
                />

                {/* Inner White-Hot Blue Flame Core (Slowmo) */}
                <motion.path
                  d="M15 80 Q 30 50 40 60 T 50 40 T 65 58 T 85 80 Z"
                  fill="url(#blueFireInner)"
                  animate={{
                    d: [
                      'M15 80 Q 30 50 40 60 T 50 40 T 65 58 T 85 80 Z',
                      'M15 80 Q 35 55 45 45 T 55 35 T 70 50 T 85 80 Z',
                      'M15 80 Q 25 45 35 65 T 48 45 T 60 52 T 85 80 Z',
                      'M15 80 Q 30 50 40 60 T 50 40 T 65 58 T 85 80 Z',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: isHolding ? 1.0 : 3.4, ease: 'easeInOut' }}
                />
              </motion.svg>
            </div>
          </div>

          {/* 1s Hold Progress Bar Inside Button */}
          {isHolding && (
            <div className="absolute inset-x-0 bottom-0 h-2 bg-black/40 overflow-hidden z-30">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-white shadow-[0_0_15px_#38bdf8] transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            </div>
          )}

          {/* Center Blue Flame Icon & Slowmo Animation */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center">
            {/* Dancing Flame Icon */}
            <div className="relative mb-2 flex items-center justify-center">
              {/* Blue Flame Glow Ring */}
              <div className="absolute inset-0 rounded-full filter blur-md opacity-85 bg-cyan-400" />

              <motion.div
                animate={
                  isHolding
                    ? { scale: [1, 1.15, 1], y: [0, -3, 0], rotate: [-3, 3, -3] }
                    : { scale: [1, 1.08, 0.98, 1.06, 1], y: [0, -4, 1, -2, 0], rotate: [-2, 2, -1, 1, 0] }
                }
                transition={{
                  repeat: Infinity,
                  duration: isHolding ? 0.6 : 3.8,
                  ease: 'easeInOut',
                }}
                className="relative p-3.5 rounded-2xl border backdrop-blur-md transition-colors bg-cyan-950/70 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.75)]"
              >
                <Flame className="w-10 h-10 sm:w-11 sm:h-11 text-cyan-300 fill-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,1)]" />
              </motion.div>
            </div>

            {/* Fire Button State Title (HOLD TO MINE after 6h / MINING ACTIVE before 6h) */}
            <span className="text-base sm:text-lg font-black tracking-widest uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {!isPackageActive
                ? 'INELIGIBLE TO MINE'
                : isHolding
                ? `HOLDING (${Math.round(holdProgress)}%)`
                : isFirstHalf
                ? 'MINING ACTIVE'
                : 'HOLD TO MINE'}
            </span>

            {/* Subtitle Details: Shows unlock countdown before 6h, or instruction when ready */}
            <span className="text-xs font-bold mt-1 text-cyan-200 drop-shadow-sm flex items-center gap-1">
              {!isPackageActive ? (
                <span>Package buy karne ke baad activate hoga</span>
              ) : isFirstHalf ? (
                <>
                  <Clock className="w-3 h-3 text-cyan-300 inline shrink-0" />
                  <span>Hold unlocks in {formatTime(remainingMs - sixHoursMs)}</span>
                </>
              ) : isHolding ? (
                'Starting session...'
              ) : (
                'Hold 1s to start session'
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Sleek, Beautiful & Normal Mining Active Console */}
      <div className="w-full max-w-md mt-6 bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Top Status & Clean Countdown */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#ece6d9] dark:border-[#173740]">
          {/* Status pill hidden per user directive: "or is div ko bi hidden kardo" */}
          <div className="hidden items-center gap-2">
            {isFirstHalf && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 dark:bg-cyan-500/25 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-black">
                <Flame className="w-3.5 h-3.5 text-cyan-500 animate-pulse fill-cyan-400" />
                <span>Blue Fire Active 🔥</span>
              </div>
            )}
            {isSecondHalf && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 dark:bg-cyan-500/25 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>6h+ Passed &bull; Blue Fire Renewable</span>
              </div>
            )}
            {isExpired && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 dark:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>12h Complete &bull; Hold for Blue Fire</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-[#7a8c94] dark:text-[#94a3b8]">
              Cycle Remaining
            </span>
            {/* Clean Time Countdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
              <Clock className="w-3.5 h-3.5 text-[#7a8c94] dark:text-[#94a3b8]" />
              <span className="font-mono text-xs sm:text-sm font-black tracking-wide text-[#09353e] dark:text-[#38bdf8] tabular-nums">
                {formatTime(remainingMs)}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Progress Indicator - Pure Blue Fire */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8]">
            <span>Cycle Progress</span>
            <span>{Math.round(progressPercent)}% Elapsed</span>
          </div>
          <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3-Column Micro-Stats (Hidden per user request: "nichy div ko bi hidden kardo") */}
        <div className="hidden grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#ece6d9] dark:border-[#173740] text-center">
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
            <p className="text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
              12 Hours
            </p>
          </div>
        </div>

        {/* Dynamic Context Notice (Hidden per user request: "or is p ko bi hiddden kardo") */}
        <p className="hidden text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-3 leading-relaxed text-center font-medium">
          {isFirstHalf && 'Blue Fire Cloud mining is active with 0% battery and CPU load.'}
          {isSecondHalf && '6 hours passed! You can hold button for 1s to renew session for another 12 hours.'}
          {isExpired && '12 hours completed (Warning Red). Hold button for 1s to ignite blue fire and start mining.'}
        </p>
      </div>
    </div>
  );
}
