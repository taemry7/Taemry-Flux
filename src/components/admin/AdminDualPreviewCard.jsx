import React, { useState } from 'react';
import { Tv, Pickaxe, Flame, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDualPreviewCard({ stats, onNavigate, onNavigateTab }) {
  const { currentUser, userStats } = useAuth();
  const [heroCardMode, setHeroCardMode] = useState('ads'); // 'ads' | 'miner'
  const [cardSplash, setCardSplash] = useState(null);

  const handleHeroModeToggle = (e, mode) => {
    if (mode === heroCardMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    setCardSplash({
      id: Date.now() + Math.random(),
      mode,
      x,
      y,
    });
    setHeroCardMode(mode);
  };

  // Determine admin name
  const adminName = (
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    (currentUser?.email ? currentUser.email.split('@')[0].toUpperCase() : 'ADMIN')
  );

  // Available Balance calculation
  const resolvedWalletBalance = (() => {
    if (userStats?.walletBalance !== undefined && userStats?.walletBalance !== null) {
      return Number(userStats.walletBalance);
    }
    if (stats?.platformBalance !== undefined && stats?.platformBalance !== null) {
      return Number(stats.platformBalance);
    }
    try {
      const cached = localStorage.getItem('taemry_cached_user_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.walletBalance !== undefined && parsed?.walletBalance !== null) {
          return Number(parsed.walletBalance);
        }
      }
    } catch {}
    return 0;
  })();

  const displayBalance = resolvedWalletBalance.toFixed(2);
  const displayProgress = Math.min(100, Math.round(((userStats?.dailyAdCount || stats?.dailyActiveUsers || 0) / 200) * 100));

  // Live last reward resolution
  const liveLastReward = (() => {
    try {
      const storedLast = localStorage.getItem('taemry_last_ad_reward');
      if (storedLast && Number(storedLast) > 0) {
        const num = Number(storedLast);
        return num >= 0.01 ? `+$${num.toFixed(2)}` : `+$${num.toFixed(3)}`;
      }
    } catch {}

    if (userStats?.lastReward !== undefined && userStats?.lastReward !== null && Number(userStats.lastReward) > 0) {
      const num = Number(userStats.lastReward);
      return num >= 0.01 ? `+$${num.toFixed(2)}` : `+$${num.toFixed(3)}`;
    }

    return '+$2.10';
  })();

  const totalEarned = Number(userStats?.totalEarned || stats?.totalDeposits || 0).toFixed(2);

  const handleDashboardNavigation = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  const handleMinerNavigation = () => {
    if (onNavigate) {
      onNavigate('cloud-miner');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Dual Switcher Controls & Hero Floating Preview Card */}
      <div className="max-w-[460px] w-full mx-auto px-2 flex flex-col items-center">
        {/* Dual Switcher Controls (Watch Ads vs Cloud Miner) */}
        <div className="relative inline-flex p-1 rounded-2xl bg-white/90 dark:bg-[#0a1b22]/90 border border-[#e4ded2] dark:border-[#173740] shadow-sm mb-3.5 backdrop-blur-xs overflow-hidden">
          {/* Fluid circular splash wave on click */}
          <AnimatePresence>
            {cardSplash && (
              <motion.span
                key={cardSplash.id}
                initial={{ scale: 0, opacity: 0.85, filter: 'blur(0px)' }}
                animate={{ scale: 5, opacity: 0, filter: 'blur(16px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  left: cardSplash.x,
                  top: cardSplash.y,
                }}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-28 h-28 ${
                  cardSplash.mode === 'ads'
                    ? 'bg-gradient-to-r from-[#0c5963] to-[#10b981]'
                    : 'bg-gradient-to-r from-[#d97706] to-[#ea580c]'
                }`}
              />
            )}
          </AnimatePresence>

          {/* Watch Ads Toggle Button */}
          <button
            type="button"
            id="btn-admin-mode-ads"
            onClick={(e) => handleHeroModeToggle(e, 'ads')}
            className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
              heroCardMode === 'ads'
                ? 'bg-[#0c5963] text-white shadow-md shadow-[#0c5963]/30 scale-[1.02]'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white hover:bg-[#f3eee4]/60 dark:hover:bg-[#12313c]/60'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span>Watch Ads</span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className={`absolute inline-flex h-full w-full rounded-full ${heroCardMode === 'ads' ? 'animate-ping bg-emerald-300 opacity-80' : 'bg-emerald-500/40'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${heroCardMode === 'ads' ? 'bg-emerald-400' : 'bg-emerald-600'}`}></span>
            </span>
          </button>

          {/* Cloud Miner Toggle Button */}
          <button
            type="button"
            id="btn-admin-mode-miner"
            onClick={(e) => handleHeroModeToggle(e, 'miner')}
            className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
              heroCardMode === 'miner'
                ? 'bg-gradient-to-r from-[#d97706] to-[#ea580c] text-white shadow-md shadow-amber-500/30 scale-[1.02]'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white hover:bg-[#f3eee4]/60 dark:hover:bg-[#12313c]/60'
            }`}
          >
            <Pickaxe className="w-4 h-4 shrink-0" />
            <span>Cloud Miner</span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className={`absolute inline-flex h-full w-full rounded-full ${heroCardMode === 'miner' ? 'animate-ping bg-amber-300 opacity-80' : 'bg-amber-500/40'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${heroCardMode === 'miner' ? 'bg-amber-400' : 'bg-amber-600'}`}></span>
            </span>
          </button>
        </div>

        {/* Unified Floating Preview Card with Dual Mode Transitions */}
        <div
          className="wallet-card relative w-full rounded-[28px] p-6 sm:p-7 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-md dark:shadow-black/60 overflow-hidden transition-all flex flex-col justify-between min-h-[385px]"
        >
          {/* Ambient Background Glow Wave */}
          <AnimatePresence>
            {cardSplash && (
              <motion.div
                key={`admin-card-glow-${cardSplash.id}`}
                initial={{ scale: 0, opacity: 0.35, filter: 'blur(12px)' }}
                animate={{ scale: 3.5, opacity: 0, filter: 'blur(28px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className={`pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full ${
                  cardSplash.mode === 'miner'
                    ? 'bg-gradient-to-br from-[#d97706]/30 to-[#ea580c]/20'
                    : 'bg-gradient-to-br from-[#0c5963]/30 to-[#10b981]/20'
                }`}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {heroCardMode === 'ads' ? (
              <motion.div
                key="admin-hero-mode-ads-card"
                initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col justify-between flex-1"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] dark:text-[#94a3b8] tracking-wider uppercase mb-3">
                    <span className="tracking-widest">
                      ADMIN / {adminName}
                    </span>
                    <div className="status-dot w-2.5 h-2.5 bg-[#ffb703] rounded-full shrink-0 shadow-xs" title="Active" />
                  </div>

                  {/* Balances Grid: Available Balance & Total Earned Yield */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                        Available Balance
                      </p>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                        <span>${displayBalance.split('.')[0]}</span>
                        <span className="balance-cents text-lg sm:text-xl font-extrabold text-[#ff9f00]">
                          .{displayBalance.split('.')[1] || '00'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                        Total Earned Yield
                      </p>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                        <span>${totalEarned.split('.')[0]}</span>
                        <span className="balance-cents text-lg sm:text-xl font-extrabold text-emerald-500">
                          .{totalEarned.split('.')[1] || '00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                      <span>Today's ad rhythm</span>
                      <span className="font-bold text-[#0d5963] dark:text-[#38bdf8]">
                        {userStats?.dailyAdCount || stats?.dailyActiveUsers || 0} / 200 ({displayProgress}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0d5963] to-[#10b981] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward Banner */}
                  <div className="reward-banner bg-[#faf8f5] dark:bg-[#07151a] rounded-[20px] p-[14px_18px] flex justify-between items-center border border-[#ece6d9] dark:border-[#173740] transition-colors mb-5">
                    <div className="reward-left flex items-center gap-[14px]">
                      <div className="reward-icon-container w-[32px] h-[32px] bg-[#fff9e6] dark:bg-[#2e260c] rounded-full flex justify-center items-center border border-[#ffe699] dark:border-[#574312] shrink-0">
                        <div className="reward-icon w-[16px] h-[16px] border-2 border-[#ffb703] rounded-full relative flex items-center justify-center">
                          <span className="w-1 h-1.5 border-r-2 border-b-2 border-[#ffb703] rotate-45 -mt-0.5 ml-0.5 inline-block" />
                        </div>
                      </div>
                      <div className="reward-text">
                        <div className="reward-text-title text-[14px] font-bold text-[#0d2137] dark:text-[#f1f5f9] mb-[2px] leading-tight">
                          Reward credited
                        </div>
                        <div className="reward-text-subtitle text-[13px] text-[#7a8c94] dark:text-[#94a3b8] leading-tight">
                          {(userStats?.dailyAdCount || 0) > 0
                            ? `${userStats.dailyAdCount} ads credited today`
                            : '20% Daily Yield • System Active'}
                        </div>
                      </div>
                    </div>
                    <div className="reward-right text-right">
                      <div className="reward-label text-[10px] font-bold text-[#9aaab0] dark:text-[#64748b] uppercase tracking-[0.5px] mb-[4px] text-right block">
                        Last Reward
                      </div>
                      <div className="reward-amount text-[16px] font-bold text-[#00796b] dark:text-[#2dd4bf] text-right block leading-tight">
                        {liveLastReward}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Go to My Dashboard Button inside Card */}
                <button
                  id="btn-admin-card-dashboard"
                  onClick={handleDashboardNavigation}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all cursor-pointer mt-1"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="admin-hero-mode-miner-card"
                initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col justify-between flex-1"
              >
                <div>
                  {/* Header: TAEMRY / 12H MINER with active status indicator */}
                  <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] dark:text-[#94a3b8] tracking-wider uppercase mb-3">
                    <span className="tracking-widest flex items-center gap-1.5 font-bold text-[#d97706] dark:text-[#f59e0b]">
                      <Pickaxe className="w-3.5 h-3.5 text-[#d97706] dark:text-[#f59e0b]" />
                      TAEMRY / 12H MINER
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-[#d97706] dark:text-[#f59e0b] tracking-normal">ACTIVE</span>
                    </div>
                  </div>

                  {/* Balance: Mined Hash Yield with amber accented decimal formatting and USD • TFLX currency badge */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8]">
                          Mined Hash Yield
                        </p>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#fffbeb] dark:bg-[#2a1a08] text-[#d97706] dark:text-[#f59e0b] border border-[#fde68a] dark:border-[#45270c]">
                          USD • TFLX
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                        <span>${Number((Number(totalEarned) * 0.6) + 14.8).toFixed(2).split('.')[0]}</span>
                        <span className="balance-cents text-lg sm:text-xl font-extrabold text-[#d97706] dark:text-[#f59e0b]">
                          .{Number((Number(totalEarned) * 0.6) + 14.8).toFixed(2).split('.')[1] || '80'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                        Hashrate Power
                      </p>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                        <span>16.0</span>
                        <span className="text-sm sm:text-base font-bold text-[#d97706] dark:text-[#f59e0b] ml-1">
                          MH/s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar: 12h Mining Hash Session (Active) */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                      <span className="flex items-center gap-1 font-semibold text-[#b45309] dark:text-[#f59e0b]">
                        <Flame className="w-3.5 h-3.5 text-[#d97706] dark:text-[#f59e0b]" />
                        12h Mining Hash Session
                      </span>
                      <span className="font-bold text-[#d97706] dark:text-[#f59e0b]">
                        Mining Active (72%)
                      </span>
                    </div>
                    <div className="w-full bg-[#fef3c7]/60 dark:bg-[#1f190e] h-2.5 rounded-full overflow-hidden relative">
                      <div
                        className="bg-gradient-to-r from-[#d97706] to-[#ea580c] h-full rounded-full transition-all duration-1000 shadow-xs relative overflow-hidden"
                        style={{ width: '72%' }}
                      >
                        <div className="absolute inset-0 bg-white/25 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Banner: Pickaxe icon with "Mining Active" status */}
                  <div className="reward-banner bg-[#fffbeb]/70 dark:bg-[#1a140b] rounded-[20px] p-[14px_18px] flex justify-between items-center border border-[#fde68a] dark:border-[#382613] transition-colors mb-5 shadow-xs">
                    <div className="reward-left flex items-center gap-[14px]">
                      <div className="reward-icon-container w-[36px] h-[36px] bg-[#fef3c7] dark:bg-[#2e1d08] rounded-full flex justify-center items-center border border-[#fde68a] dark:border-[#52320b] shrink-0 shadow-2xs">
                        <Pickaxe className="w-4 h-4 text-[#d97706] dark:text-[#f59e0b]" />
                      </div>
                      <div className="reward-text">
                        <div className="reward-text-title text-[14px] font-bold text-[#0d2137] dark:text-[#f1f5f9] mb-[2px] leading-tight flex items-center gap-1.5">
                          <span>Mining Active</span>
                          <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <div className="reward-text-subtitle text-[13px] text-[#7a8c94] dark:text-[#94a3b8] leading-tight">
                          12h tap-to-mine session active
                        </div>
                      </div>
                    </div>
                    <div className="reward-right text-right">
                      <div className="reward-label text-[10px] font-bold text-[#9aaab0] dark:text-[#64748b] uppercase tracking-[0.5px] mb-[4px] text-right block">
                        Base Hashrate
                      </div>
                      <div className="reward-amount text-[15px] font-extrabold text-[#d97706] dark:text-[#f59e0b] text-right block leading-tight">
                        +16 TFLX/h
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cloud Miner Action Button */}
                <button
                  id="btn-admin-card-miner"
                  onClick={handleMinerNavigation}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-sm shadow-amber-500/25 transition-all cursor-pointer mt-1"
                >
                  <Pickaxe className="w-4 h-4" />
                  <span>Go to Cloud Miner</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
