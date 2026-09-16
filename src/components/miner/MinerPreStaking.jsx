import React, { useState } from 'react';
import { Lock, ShieldCheck, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function MinerPreStaking({
  minerData,
  onCommitPreStaking,
}) {
  const { committedYears = 0, committedAllocation = 0, preStakingBoost = 0 } = minerData;

  const [selectedYears, setSelectedYears] = useState(committedYears > 0 ? committedYears : 2);
  const [selectedAllocation, setSelectedAllocation] = useState(committedAllocation > 0 ? committedAllocation : 50);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Boost Formula: (years / 5) * (allocation / 100) * 250%
  const currentCalculatedBoost = Math.round((selectedYears / 5) * (selectedAllocation / 100) * 250);

  // Can only commit if values are greater than currently committed or first time
  const isIncrease = selectedYears > committedYears || selectedAllocation > committedAllocation;
  const canCommit = isIncrease && hasAgreed;

  const handleCommit = (e) => {
    e.preventDefault();
    if (!canCommit) return;

    onCommitPreStaking({
      years: selectedYears,
      allocation: selectedAllocation,
      boostPercent: currentCalculatedBoost,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#ece6d9] dark:border-[#173740]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#09353e] dark:text-[#f1f5f9]">
              Pre-Staking & Staking Boost
            </h2>
          </div>
          <p className="text-xs text-[#6e8286] dark:text-[#94a3b8] mt-1 max-w-lg">
            Commit your future TFLX tokens to boost your daily mining speed by up to <strong>+250%</strong>.
            Staking commitment can only be increased, never decreased.
          </p>
        </div>

        {/* Live Boost Multiplier Badge */}
        <div className="flex items-center gap-3 bg-[#faf8f5] dark:bg-[#07151a] p-3 rounded-2xl border border-[#e4ded2] dark:border-[#173740] self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider block">
              Active Multiplier
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#d97706] dark:text-[#f59e0b] leading-none">
              +{committedYears > 0 ? preStakingBoost : currentCalculatedBoost}%
            </span>
          </div>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
      </div>

      <form onSubmit={handleCommit} className="mt-6 space-y-6">
        {/* Slider 1: Lockup Period (1 to 5 Years) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
            <span className="flex items-center gap-1.5">
              <span>Lockup Period:</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                {selectedYears} {selectedYears === 1 ? 'Year' : 'Years'}
              </span>
            </span>
            {committedYears > 0 && (
              <span className="text-[11px] text-[#7a8c94] dark:text-[#64748b]">
                Min locked: {committedYears} yrs
              </span>
            )}
          </div>
          <input
            type="range"
            min={committedYears > 0 ? committedYears : 1}
            max={5}
            step={1}
            value={selectedYears}
            onChange={(e) => setSelectedYears(Number(e.target.value))}
            className="w-full h-2.5 bg-[#f1eee7] dark:bg-[#122b33] rounded-lg appearance-none cursor-pointer accent-[#d97706]"
          />
          <div className="flex justify-between text-[11px] text-[#7a8c94] dark:text-[#64748b] px-0.5">
            <span>1 Year</span>
            <span>2 Years</span>
            <span>3 Years</span>
            <span>4 Years</span>
            <span>5 Years</span>
          </div>
        </div>

        {/* Slider 2: Allocation Percentage (10% to 100%) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
            <span className="flex items-center gap-1.5">
              <span>Allocation Percentage:</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                {selectedAllocation}%
              </span>
            </span>
            {committedAllocation > 0 && (
              <span className="text-[11px] text-[#7a8c94] dark:text-[#64748b]">
                Min locked: {committedAllocation}%
              </span>
            )}
          </div>
          <input
            type="range"
            min={committedAllocation > 0 ? committedAllocation : 10}
            max={100}
            step={10}
            value={selectedAllocation}
            onChange={(e) => setSelectedAllocation(Number(e.target.value))}
            className="w-full h-2.5 bg-[#f1eee7] dark:bg-[#122b33] rounded-lg appearance-none cursor-pointer accent-[#d97706]"
          />
          <div className="flex justify-between text-[11px] text-[#7a8c94] dark:text-[#64748b] px-0.5">
            <span>10%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dynamic Formula Display Box */}
        <div className="bg-[#faf8f5] dark:bg-[#07151a] p-4 rounded-2xl border border-[#e4ded2] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[#7a8c94] dark:text-[#94a3b8] font-medium">Boost Calculation:</span>
            <p className="font-mono text-[#09353e] dark:text-[#f1f5f9] font-bold mt-0.5">
              ({selectedYears}/5 yrs) &times; ({selectedAllocation}/100%) &times; 250% = <span className="text-amber-600 dark:text-amber-400 font-extrabold">+{currentCalculatedBoost}% Boost</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[#7a8c94] dark:text-[#94a3b8] font-medium">New Hashrate:</span>
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
              +{(16 * (1 + currentCalculatedBoost / 100)).toFixed(1)} TFLX/h
            </p>
          </div>
        </div>

        {/* Commitment Agreement Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="checkbox-pre-staking-agree"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#d97706] rounded border-[#d0c7b7] dark:border-[#22444f] focus:ring-[#d97706] cursor-pointer"
          />
          <label htmlFor="checkbox-pre-staking-agree" className="text-xs text-[#546b70] dark:text-[#94a3b8] cursor-pointer">
            I understand that pre-staking commitment is permanent and <strong>cannot be decreased</strong>. It can only be maintained or increased in the future.
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-commit-pre-staking"
            disabled={!canCommit}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canCommit
                ? 'bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] text-white shadow-md shadow-amber-500/20 active:scale-[0.98]'
                : 'bg-[#e4ded2] dark:bg-[#173740] text-[#8e9fa2] dark:text-[#526a73] cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {committedYears > 0 ? 'Increase Pre-Staking Commitment' : 'Lock & Activate Pre-Staking Boost'}
            </span>
          </button>
        </div>

        {/* Success confirmation */}
        {showSuccessToast && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Pre-Staking Boost of +{currentCalculatedBoost}% successfully committed!</span>
          </div>
        )}
      </form>
    </div>
  );
}
