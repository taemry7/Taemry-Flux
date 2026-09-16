import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Clock,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { playMiningTruthSound } from '../../utils/audio';

export default function MinerSlashing({ minerState, setMinerState, onSelectTab }) {
  // Days off accumulated (e.g., 3 days)
  const [daysOff, setDaysOff] = useState(3);
  const [isSimulatingInactivity, setIsSimulatingInactivity] = useState(false);
  const [isResurrected, setIsResurrected] = useState(false);

  const handleResurrect = () => {
    playMiningTruthSound();
    setIsSimulatingInactivity(false);
    setIsResurrected(true);
    setMinerState((prev) => ({
      ...prev,
      isMiningActive: true,
      sessionStartTime: Date.now(),
    }));
    setTimeout(() => setIsResurrected(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fef2f2] dark:bg-[#3b1212] text-[#dc2626] dark:text-[#f87171] flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                2. Slashing & Days-Off Inactivity System
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef2f2] dark:bg-[#3b1212] text-[#dc2626] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]">
                PENALTY & PROTECTION
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Decentralized integrity mechanism penalizing non-contributing nodes while safeguarding loyal miners with Days-Off.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#047857]/40 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Account Status: {isSimulatingInactivity ? 'SLASHING (INACTIVE)' : 'PROTECTED & ACTIVE'}</span>
          </span>
        </div>
      </div>

      {/* Grid: 3 Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Days-Off Shield Balance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
              Auto-Earned
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#718589] dark:text-[#94a3b8] uppercase tracking-wider block">
              Available Days-Off
            </span>
            <div className="text-3xl font-black text-[#09353e] dark:text-white mt-1">
              {daysOff} Days
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              For every 6 consecutive active mining days, you earn 1 Day-Off. If you miss a 24h cycle, 1 Day-Off is automatically consumed so your coins never get slashed!
            </p>
          </div>

          <div className="pt-3 border-t border-[#f0ebe0] dark:border-[#173740] flex items-center justify-between text-xs text-[#065f46] dark:text-[#6ee7b7] font-semibold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Shield Active
            </span>
            <span>+1 Day in 3 Days</span>
          </div>
        </div>

        {/* Card 2: Slashing Formula & Inactivity Rate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#fff7ed] dark:bg-[#2b1604] text-[#ea580c] dark:text-[#fb923c] flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-[#ea580c]">
              Hourly Penalty
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#718589] dark:text-[#94a3b8] uppercase tracking-wider block">
              Slashing Decay Rate
            </span>
            <div className="text-3xl font-black text-[#dc2626] dark:text-[#f87171] mt-1">
              -8.0 TFLX / hr
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              If all Days-Off expire and a node remains inactive, tokens are deducted on an hourly basis matching the unearned base yield to remove idle speculative coins from supply.
            </p>
          </div>

          <div className="pt-3 border-t border-[#f0ebe0] dark:border-[#173740] text-xs text-[#718589] dark:text-[#94a3b8]">
            <span>Continuous decay stops immediately upon tapping to resume.</span>
          </div>
        </div>

        {/* Card 3: Resurrection Mechanism */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
              Resurrection
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#718589] dark:text-[#94a3b8] uppercase tracking-wider block">
              Instant Node Recovery
            </span>
            <div className="text-base font-bold text-[#09353e] dark:text-white mt-1">
              1-Tap Reactivation
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              Returned after an absence? Tapping the miner instantly stops the slashing formula, resets your streak, and places the node back into regular reward generation.
            </p>
          </div>

          <div className="pt-3 border-t border-[#f0ebe0] dark:border-[#173740]">
            <button
              onClick={handleResurrect}
              className="w-full py-2 px-3 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResurrected ? 'Resurrection Confirmed!' : 'Test Resurrection Call'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slashing Simulator & Technical Rules Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#09353e] dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
          <span>Ice Network Slashing Rules & Mathematical Safeguards</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] space-y-2">
            <h4 className="font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Why Slashing Exists in Web3
            </h4>
            <p className="text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
              Traditional networks suffer from millions of abandoned accounts that hold supply forever. Slashing ensures that only engaged, verified human users hold tokens at mainnet snapshot.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] space-y-2">
            <h4 className="font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0c5963]"></span>
              How to Never Lose Coins
            </h4>
            <p className="text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
              Accumulate Days-Off by mining consistently. If traveling or away without internet, your Days-Off will protect your balance up to several weeks automatically.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => onSelectTab && onSelectTab('staking')}
            className="px-4 py-2 rounded-xl bg-[#0c5963] text-white text-xs font-bold hover:bg-[#08424b] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Proceed to 3. Pre-Staking Boost</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
