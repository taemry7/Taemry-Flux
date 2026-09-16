import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  TrendingUp,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Coins,
  ArrowRight
} from 'lucide-react';
import { playMiningTruthSound } from '../../utils/audio';

export default function MinerPreStaking({ minerState, setMinerState, onSelectTab }) {
  const [years, setYears] = useState(2);
  const [percent, setPercent] = useState(50);
  const [isCommitted, setIsCommitted] = useState(false);

  // Pre-staking boost calculation: (years * 25) * (percent / 50) => max 250% for 5 years @ 100%
  const boostPercent = Math.min(250, Math.round((years * 25) * (percent / 50)));
  const baseRate = minerState.baseHashrate || 16.0;
  const boostedRate = parseFloat((baseRate * (1 + boostPercent / 100)).toFixed(1));
  const additionalHourlyYield = parseFloat((boostedRate - baseRate).toFixed(1));

  const handleCommitPreStaking = () => {
    playMiningTruthSound();
    setIsCommitted(true);
    setMinerState((prev) => ({
      ...prev,
      baseHashrate: boostedRate,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] dark:bg-[#172554] text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                3. Pre-Staking Multiplier Boost
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] dark:bg-[#172554] text-[#2563eb] dark:text-[#60a5fa] border border-[#bfdbfe] dark:border-[#1e3a8a]">
                UP TO +250% MULTIPLIER
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Lock a percentage of your mined balance for 1 to 5 years to unlock massive compounding hashrate bonuses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#047857]/40 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>Active Boost: +{boostPercent}%</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Sliders + Live Yield Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Sliders & Lockup Config */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
            <h3 className="text-sm font-bold text-[#09353e] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Configure Pre-Staking Allocation</span>
            </h3>
            <span className="text-xs text-[#718589] dark:text-[#94a3b8]">
              Non-custodial pledge
            </span>
          </div>

          {/* Slider 1: Period in Years */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#09353e] dark:text-white">Lockup Duration</span>
              <span className="text-base font-black font-mono text-[#0c5963] dark:text-[#38bdf8]">
                {years} {years === 1 ? 'Year' : 'Years'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={years}
              onChange={(e) => {
                setYears(Number(e.target.value));
                setIsCommitted(false);
              }}
              className="w-full h-2.5 bg-[#f1eee7] dark:bg-[#122b33] rounded-lg appearance-none cursor-pointer accent-[#0c5963] dark:accent-[#38bdf8]"
            />
            <div className="flex justify-between text-[11px] text-[#718589] dark:text-[#94a3b8] font-mono">
              <span>1 Year</span>
              <span>2 Years</span>
              <span>3 Years</span>
              <span>4 Years</span>
              <span>5 Years (Max)</span>
            </div>
          </div>

          {/* Slider 2: Percentage Allocation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#09353e] dark:text-white">Mined Balance Allocation</span>
              <span className="text-base font-black font-mono text-[#0c5963] dark:text-[#38bdf8]">
                {percent}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={percent}
              onChange={(e) => {
                setPercent(Number(e.target.value));
                setIsCommitted(false);
              }}
              className="w-full h-2.5 bg-[#f1eee7] dark:bg-[#122b33] rounded-lg appearance-none cursor-pointer accent-[#0c5963] dark:accent-[#38bdf8]"
            />
            <div className="flex justify-between text-[11px] text-[#718589] dark:text-[#94a3b8] font-mono">
              <span>10%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Commit Action */}
          <div className="pt-3 border-t border-[#f0ebe0] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#526b70] dark:text-[#94a3b8]">
              {isCommitted ? (
                <span className="text-[#065f46] dark:text-[#6ee7b7] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Pre-staking allocation locked for Mainnet launch!
                </span>
              ) : (
                <span>Commitment activates immediately on your current mining node.</span>
              )}
            </div>
            <button
              onClick={handleCommitPreStaking}
              className="px-5 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isCommitted ? 'Update Allocation' : 'Commit Pre-Stake Multiplier'}</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Projected Multiplier Summary */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-[#718589] dark:text-[#64748b] uppercase tracking-wider block">
              Resulting Hashrate Multiplier
            </span>

            <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#526b70] dark:text-[#94a3b8]">Base Mining Hashrate</span>
                <span className="font-mono font-bold text-[#09353e] dark:text-white">{baseRate} MH/s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#526b70] dark:text-[#94a3b8]">Pre-Staking Multiplier</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{boostPercent}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#526b70] dark:text-[#94a3b8]">Bonus Yield Gain</span>
                <span className="font-mono font-bold text-[#ca8a04]">+{additionalHourlyYield} TFLX/h</span>
              </div>

              <div className="pt-2 border-t border-[#ece6d9] dark:border-[#173740] flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#09353e] dark:text-white">Effective Rate</span>
                <span className="text-2xl font-black font-mono text-[#0c5963] dark:text-[#38bdf8]">
                  {boostedRate} <span className="text-xs font-normal">MH/s</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
              Locked coins generate high-yield mining returns. At mainnet genesis, pre-staked funds unlock according to the on-chain vesting smart contract.
            </p>

            <button
              onClick={() => onSelectTab && onSelectTab('guild')}
              className="w-full py-2 px-3 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] hover:bg-[#f0ebe0] text-[#0c5963] dark:text-[#38bdf8] text-xs font-bold border border-[#e4ded2] dark:border-[#173740] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore 4. 2-Tier Guild Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
