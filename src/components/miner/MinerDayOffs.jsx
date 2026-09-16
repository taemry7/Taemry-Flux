import React, { useState } from 'react';
import { Calendar, Shield, HeartPulse, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function MinerDayOffs({
  minerData,
  onResurrectCoins,
}) {
  const {
    dayOffsCount = 2,
    streakDays = 4,
    slashedCoins = 0,
  } = minerData;

  const [resurrectSuccess, setResurrectSuccess] = useState(false);

  // 6 consecutive days award 1 automatic Day-Off
  const streakProgress = (streakDays % 6) / 6 * 100;
  const daysUntilNextDayOff = 6 - (streakDays % 6);

  const handleResurrect = () => {
    onResurrectCoins();
    setResurrectSuccess(true);
    setTimeout(() => setResurrectSuccess(false), 4000);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#ece6d9] dark:border-[#173740]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#09353e] dark:text-[#f1f5f9]">
              Day-Offs & Slashing Protection
            </h2>
          </div>
          <p className="text-xs text-[#6e8286] dark:text-[#94a3b8] mt-1 max-w-lg">
            Automatic protection shields your mined TFLX from inactivity penalties. Earn 1 Day-Off every 6 consecutive active mining days.
          </p>
        </div>

        {/* Day-Offs Available Badge */}
        <div className="bg-[#faf8f5] dark:bg-[#07151a] p-3 rounded-2xl border border-[#e4ded2] dark:border-[#173740] flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider block">
              Active Day-Offs
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
              {dayOffsCount} Days
            </span>
          </div>
          <Calendar className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak & Next Day-Off Progress */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
              Consecutive Mining Streak
            </span>
            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
              {streakDays} Days Active
            </span>
          </div>
          <p className="text-[11px] text-[#7a8c94] dark:text-[#94a3b8] mb-3">
            {daysUntilNextDayOff} more consecutive active day{daysUntilNextDayOff > 1 ? 's' : ''} to unlock next automatic Day-Off.
          </p>
          <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${streakProgress}%` }}
            />
          </div>
        </div>

        {/* Slashing & Resurrection Module */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              Slashing Status
            </span>
            <span className={`text-xs font-extrabold ${slashedCoins > 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {slashedCoins > 0 ? `-${slashedCoins.toFixed(1)} Slashed` : 'Protected (0 Slashed)'}
            </span>
          </div>
          <p className="text-[11px] text-[#7a8c94] dark:text-[#94a3b8] mb-2 leading-tight">
            If you miss check-ins and run out of Day-Offs, use Resurrection to restore any lost coins.
          </p>
          <button
            type="button"
            id="btn-resurrect-coins"
            onClick={handleResurrect}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resurrect Slashed Balance</span>
          </button>
        </div>
      </div>

      {resurrectSuccess && (
        <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Node Resurrection complete! All slashed tokens restored and streak protected.</span>
        </div>
      )}
    </div>
  );
}
