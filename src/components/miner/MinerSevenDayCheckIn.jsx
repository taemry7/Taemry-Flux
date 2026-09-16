import React from 'react';
import { Flame, CheckCircle2, Gift, Sparkles, Award } from 'lucide-react';

export default function MinerSevenDayCheckIn({
  streakDays = 4,
  claimedDays = [1, 2, 3, 4],
  onClaimDay,
}) {
  // 7-day cycle: Day 1 to Day 7 rewards in TFLX bonus
  const checkInDays = [
    { day: 1, reward: 2.0, label: '+2 TFLX' },
    { day: 2, reward: 3.5, label: '+3.5 TFLX' },
    { day: 3, reward: 5.0, label: '+5 TFLX' },
    { day: 4, reward: 7.5, label: '+7.5 TFLX' },
    { day: 5, reward: 10.0, label: '+10 TFLX' },
    { day: 6, reward: 15.0, label: '+15 TFLX' },
    { day: 7, reward: 25.0, label: '+25 TFLX & Day-Off', isSpecial: true },
  ];

  // Active day in 7-day cycle (1-indexed)
  const currentCycleDay = ((streakDays - 1) % 7) + 1;

  return (
    <div className="w-full mt-6 bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ece6d9] dark:border-[#173740]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#d97706] flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#09353e] dark:text-[#f1f5f9] flex items-center gap-2">
              <span>7-Day Mining Check-In Rewards</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-[#d97706]">
                Day {currentCycleDay} of 7
              </span>
            </h3>
            <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-0.5">
              Check in consecutively every day to collect free TFLX yields and unlock Day-Off shields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-[#0c5963] dark:text-[#38bdf8]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Streak: {streakDays} Days</span>
        </div>
      </div>

      {/* 7 Days Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-4">
        {checkInDays.map((item) => {
          const isPast = item.day < currentCycleDay;
          const isCurrent = item.day === currentCycleDay;
          const isUpcoming = item.day > currentCycleDay;
          const isClaimed = claimedDays.includes(item.day);

          return (
            <div
              key={item.day}
              className={`relative rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all ${
                isCurrent
                  ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-2 border-[#d97706] shadow-sm'
                  : isPast
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] opacity-80'
              }`}
            >
              {/* Day Number */}
              <span className="text-[11px] font-bold text-[#7a8c94] dark:text-[#94a3b8] block">
                Day {item.day}
              </span>

              {/* Icon / Status */}
              <div className="my-2">
                {isPast ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500/25 text-[#d97706] flex items-center justify-center mx-auto animate-bounce">
                    <Gift className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-[#7a8c94] flex items-center justify-center mx-auto">
                    {item.isSpecial ? <Award className="w-4 h-4 text-purple-400" /> : <Flame className="w-4 h-4" />}
                  </div>
                )}
              </div>

              {/* Reward label */}
              <span className="text-[11px] font-extrabold text-[#09353e] dark:text-[#f1f5f9] leading-tight">
                {item.label}
              </span>

              {/* Action / State */}
              <div className="mt-2 w-full">
                {isPast ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Collected
                  </span>
                ) : isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onClaimDay(item.day, item.reward)}
                    disabled={isClaimed}
                    className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-600 cursor-default'
                        : 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-xs'
                    }`}
                  >
                    {isClaimed ? 'Claimed' : 'Claim'}
                  </button>
                ) : (
                  <span className="text-[10px] text-[#7a8c94] dark:text-[#64748b]">
                    Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
