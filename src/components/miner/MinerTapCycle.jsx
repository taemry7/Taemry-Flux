import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Pickaxe,
  Zap,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  ArrowRight
} from 'lucide-react';
import { playMiningTruthSound } from '../../utils/audio';

export default function MinerTapCycle({
  minerState,
  setMinerState,
  isMining,
  progressPercent,
  totalRemainingSeconds,
  totalEffectiveHashrate,
  formatTime,
  handleStartMining,
  perSecondYield,
  onSelectTab
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Early check-in condition: when less than 50% time remains (< 6 hours left out of 12h or < 12h out of 24h)
  const isEarlyCheckInAvailable = isMining && progressPercent >= 50;

  const handleEarlyCheckIn = () => {
    if (soundEnabled) playMiningTruthSound();
    setMinerState((prev) => ({
      ...prev,
      isMiningActive: true,
      sessionStartTime: Date.now(),
      sessionDurationMs: 12 * 3600 * 1000,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                1. 24H/12H Tap-to-Mine Cycle
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740]">
                CORE ENGINE
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Zero battery and zero CPU usage proof-of-contribution check-in system with early reset window.
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#e4ded2] dark:border-[#173740] text-xs font-bold text-[#09353e] dark:text-white hover:bg-[#f0ebe0] cursor-pointer self-start sm:self-auto"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#0c5963]" /> : <VolumeX className="w-3.5 h-3.5 text-[#718589]" />}
          <span>528Hz Sound: {soundEnabled ? 'ON' : 'MUTE'}</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Central Reactor */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMining ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isMining ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-bold text-[#09353e] dark:text-white uppercase tracking-wider">
                {isMining ? 'Node Mining in Progress' : 'Mining Cycle Ended'}
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
              {Math.round(progressPercent)}% Elapsed
            </span>
          </div>

          {/* Dial SVG & Button */}
          <div className="my-6 relative flex flex-col items-center justify-center">
            {isMining && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-6 rounded-full border-2 border-dashed border-[#0c5963]/30 dark:border-[#38bdf8]/30 pointer-events-none"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-10 rounded-full border border-dotted border-[#10b981]/25 pointer-events-none"
                />
              </>
            )}

            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xs">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-[#f1eee7] dark:stroke-[#122b33] fill-transparent"
                  strokeWidth="10"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className={`fill-transparent transition-all duration-300 ease-linear ${
                    isEarlyCheckInAvailable ? 'stroke-[#ca8a04]' : 'stroke-[#0c5963] dark:stroke-[#38bdf8]'
                  }`}
                  strokeWidth="10"
                  strokeDasharray="565"
                  strokeDashoffset={565 - (565 * (isMining ? progressPercent : 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>

              <motion.button
                onClick={handleStartMining}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full p-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-md select-none border-2 ${
                  isMining
                    ? 'bg-gradient-to-br from-[#0c5963] via-[#09424a] to-[#042024] text-white border-[#38bdf8]/50 shadow-[#0c5963]/30'
                    : 'bg-gradient-to-br from-[#0c5963] to-[#08363d] text-white border-[#10b981]/60 shadow-[#0c5963]/40 animate-pulse'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#062025]/80 flex flex-col items-center justify-center p-2 text-center border border-white/10 relative overflow-hidden">
                  <Zap className={`w-8 h-8 sm:w-9 sm:h-9 mb-1 ${isMining ? 'text-[#38bdf8] animate-pulse' : 'text-[#facc15] animate-bounce'}`} />

                  {isMining ? (
                    <>
                      <span className="text-[9px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider">
                        SESSION TIMER
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                        {formatTime(totalRemainingSeconds)}
                      </span>
                      <span className="text-[9px] text-[#a7f3d0] font-mono mt-0.5">
                        +{totalEffectiveHashrate} TFLX/h
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                        TAP TO MINE
                      </span>
                      <span className="text-[9px] font-mono text-[#a7f3d0] mt-0.5">
                        Ignite 12H Cycle
                      </span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </div>

          {/* Early Check-in Yellow Notification */}
          {isEarlyCheckInAvailable ? (
            <div className="w-full p-3 rounded-2xl bg-[#fefce8] dark:bg-[#201d07] border border-[#fef08a] dark:border-[#713f12] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ca8a04] shrink-0" />
                <span className="text-xs font-bold text-[#854d0e] dark:text-[#fef08a]">
                  Early Check-In Window Open! Tap to reset your 12h cycle now and prevent any downtime.
                </span>
              </div>
              <button
                onClick={handleEarlyCheckIn}
                className="px-3 py-1.5 rounded-xl bg-[#ca8a04] hover:bg-[#a16207] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                Reset Cycle
              </button>
            </div>
          ) : (
            <div className="w-full text-xs text-[#718589] dark:text-[#94a3b8] flex items-center justify-center gap-1.5 pt-2">
              <Clock className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Next early check-in unlocks when remaining time drops below 50%.</span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Key Metrics & Status */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-[#718589] dark:text-[#64748b] uppercase block">
              Accumulated Mined Yield
            </span>
            <div className="text-3xl font-black text-[#09353e] dark:text-white tracking-tight flex items-baseline">
              <span>${minerState.minedYield.toFixed(2).split('.')[0]}</span>
              <span className="text-xl font-extrabold text-[#0c5963] dark:text-[#38bdf8]">
                .{minerState.minedYield.toFixed(2).split('.')[1] || '00'}
              </span>
              <span className="text-xs text-[#718589] dark:text-[#94a3b8] ml-2 font-mono">
                TFLX
              </span>
            </div>
            <p className="text-[11px] text-[#526b70] dark:text-[#94a3b8]">
              Continuous micro-increment: ~+{(perSecondYield).toFixed(4)} TFLX/s
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-[#718589] dark:text-[#64748b] uppercase block">
              Cycle Rules & Inactivity Shield
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-[#09353e] dark:text-[#f1f5f9]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Tap once every 12 to 24 hours to keep node active</span>
              </div>
              <div className="flex items-start gap-2 text-[#09353e] dark:text-[#f1f5f9]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Yellow Phase allows early tap without losing progress</span>
              </div>
              <div className="flex items-start gap-2 text-[#09353e] dark:text-[#f1f5f9]">
                <AlertCircle className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                <span>Expired sessions trigger Slashing if Days-Off reach 0</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab && onSelectTab('slashing')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] hover:bg-[#f0ebe0] text-[#0c5963] dark:text-[#38bdf8] text-xs font-bold border border-[#e4ded2] dark:border-[#173740] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore 2. Slashing & Days-Off</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
