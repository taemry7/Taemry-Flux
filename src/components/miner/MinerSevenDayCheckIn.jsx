import React, { useRef } from 'react';
import { Flame, CheckCircle2, Gift, Sparkles, Award, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

export default function MinerSevenDayCheckIn({
  streakDays = 4,
  claimedDays = [1, 2, 3, 4],
  onClaimDay,
}) {
  const scrollRef = useRef(null);

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

  const scrollSide = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mt-5 bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
      {/* Compact Header (Hidden per user request: "upar h3 or div ko bi hidden kardo") */}
      <div className="hidden items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#ece6d9] dark:border-[#173740]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-[#d97706] flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="hidden text-xs sm:text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                7-Day Check-In Yield
              </h3>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/15 text-[#d97706]">
                Day {currentCycleDay} of 7
              </span>
            </div>
            <p className="text-[10px] text-[#6e8286] dark:text-[#94a3b8] hidden sm:block">
              Consecutive daily check-in rewards and streak shields.
            </p>
          </div>
        </div>

        {/* Right Action & Controls: Streak + Swipe Buttons (Hidden per user request) */}
        <div className="hidden items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#d97706] text-[10px] font-black">
            <Sparkles className="w-3 h-3" />
            <span>{streakDays}D Streak</span>
          </div>

          {/* Side Swipe Arrow Nav Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollSide('left')}
              className="w-6 h-6 rounded-md bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] text-[#6e8286] hover:text-[#09353e] dark:hover:text-[#f1f5f9] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              aria-label="Swipe Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollSide('right')}
              className="w-6 h-6 rounded-md bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] text-[#6e8286] hover:text-[#09353e] dark:hover:text-[#f1f5f9] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              aria-label="Swipe Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Swipeable Horizontal Carousel Container (Side Swipe & Chota Karo) */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-stretch gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scrollbar-none scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {checkInDays.map((item) => {
            const isPast = item.day < currentCycleDay;
            const isCurrent = item.day === currentCycleDay;
            const isUpcoming = item.day > currentCycleDay;
            const isClaimed = claimedDays.includes(item.day);

            return (
              <div
                key={item.day}
                className={`snap-start shrink-0 min-w-[98px] sm:min-w-[110px] rounded-xl p-2.5 flex flex-col items-center justify-between text-center transition-all duration-200 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-2 border-[#d97706] shadow-xs'
                    : isPast
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] opacity-85'
                }`}
              >
                {/* Top Action / Claim / Claimed / Locked Button (Moved up per user directive) */}
                <div className="w-full flex items-center justify-between gap-1 mb-1">
                  {isPast ? (
                    <span className="w-full text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block py-0.5">
                      Claimed
                    </span>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      onClick={() => onClaimDay(item.day, item.reward)}
                      disabled={isClaimed}
                      className={`w-full py-0.5 px-1.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-600 cursor-default'
                          : 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-2xs'
                      }`}
                    >
                      {isClaimed ? 'Claimed' : 'Claim'}
                    </button>
                  ) : (
                    <span className="w-full text-center text-[9px] text-[#7a8c94] dark:text-[#64748b] block py-0.5">
                      Locked
                    </span>
                  )}
                  {item.isSpecial && (
                    <span className="text-[8px] font-black px-1 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase shrink-0">
                      Bonus
                    </span>
                  )}
                </div>

                {/* Center Icon */}
                <div className="my-1.5">
                  {isPast ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-amber-500/25 text-[#d97706] flex items-center justify-center mx-auto animate-bounce">
                      <Gift className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 text-[#7a8c94] flex items-center justify-center mx-auto">
                      {item.isSpecial ? (
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <Flame className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                </div>

                {/* Reward Label */}
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#09353e] dark:text-[#f1f5f9] leading-tight block line-clamp-1">
                  {item.label}
                </span>

                {/* Compact Action Button (Hidden per user directive: "or is div ko yahn sy hidden kardy") */}
                <div className="hidden mt-1.5 w-full">
                  {isPast ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block py-0.5">
                      Collected
                    </span>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      onClick={() => onClaimDay(item.day, item.reward)}
                      disabled={isClaimed}
                      className={`w-full py-0.5 px-1.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-600 cursor-default'
                          : 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-2xs'
                      }`}
                    >
                      {isClaimed ? 'Claimed' : 'Claim'}
                    </button>
                  ) : (
                    <span className="text-[9px] text-[#7a8c94] dark:text-[#64748b] block py-0.5">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Swipe hint indicator for mobile (Hidden per user request) */}
        <div className="hidden items-center justify-center gap-1 text-[9px] text-[#7a8c94] dark:text-[#94a3b8] mt-1.5 font-medium">
          <span>Swipe horizontally for Days 1–7</span>
          <ChevronsRight className="w-3 h-3 text-[#d97706]" />
        </div>
      </div>
    </div>
  );
}
