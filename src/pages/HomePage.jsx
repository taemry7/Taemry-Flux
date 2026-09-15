import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  LifeBuoy,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Logo from '../components/Logo';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api/client';

export default function HomePage({ onNavigate }) {
  const { currentUser, userStats, fetchUserStats } = useAuth();
  const [selectedViewMode, setSelectedViewMode] = useState('core'); // 'core' (Starter 3) first
  const [filterSplash, setFilterSplash] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const handleFilterToggle = (e, mode) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    setFilterSplash({
      id: Date.now() + Math.random(),
      mode,
      x,
      y,
    });
    setSelectedViewMode(mode);
  };

  const homeFaqs = [
    {
      q: 'Q1. What is TAEMRY FLUX?',
      a: 'It is a revolutionary reward-based advertising platform. You earn US Dollars ($) by watching ads, referring friends, and achieving milestones.'
    },
    {
      q: 'Q2. Do I have to pay to start earning?',
      a: 'Yes. You must buy a starter package (starting from $1) to become eligible. This prevents bots and ensures serious users.'
    },
    {
      q: 'Q3. How do daily ad returns on packages work?',
      a: 'Every package delivers guaranteed daily returns through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.'
    },
    {
      q: 'Q4. What are the deposit and withdrawal methods?',
      a: '1. Local Bank Transfer, 2. Easypaisa / JazzCash (Fixed exchange rate: 1 USD = 300 PKR), 3. Crypto (USDT / BTC).'
    },
    {
      q: 'Q5. What is the minimum and maximum withdrawal?',
      a: 'Minimum: $1.00 USD. Maximum: $1,000.00 USD (per single request). You can withdraw once per day with a 5-minute cooldown.'
    },
  ];

  // Default updated catalog matching official system specifications
  const defaultPackages = [
    {
      id: 'bronze',
      name: 'Bronze',
      tierLabel: 'Bronze Tier',
      tagline: 'A measured first step into daily digital earnings',
      entryPrice: '$1.00',
      minWallet: '$0.10',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#d97706]/10 text-[#b45309] border-[#d97706]/30',
      badge: 'STARTER',
      circleColor: 'bg-[#b45309]',
      motivationText: '✨ Empower your financial freedom with guaranteed 20% daily returns upon activation.',
    },
    {
      id: 'silver',
      name: 'Silver',
      tierLabel: 'Silver Tier',
      tagline: 'For accelerated daily revenue momentum',
      entryPrice: '$5.00',
      minWallet: '$0.50',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#0f766e]/10 text-[#0f766e] border-[#0f766e]/30',
      badge: 'POPULAR',
      circleColor: 'bg-[#0f766e]',
      motivationText: '🚀 Accelerate your daily revenue momentum with verified digital asset accumulation.',
    },
    {
      id: 'gold',
      name: 'Gold',
      tierLabel: 'Gold Tier',
      tagline: 'For committed momentum with high-velocity returns',
      entryPrice: '$10.00',
      minWallet: '$1.00',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#ca8a04]/10 text-[#ca8a04] border-[#ca8a04]/30',
      badge: 'RECOMMENDED',
      circleColor: 'bg-[#ca8a04]',
      motivationText: '💼 Secure your financial growth with maximized cashflow and steady compounding returns.',
    },
    {
      id: 'premium',
      name: 'Premium',
      tierLabel: 'Premium Tier',
      tagline: 'High-velocity professional plan',
      entryPrice: '$50.00',
      minWallet: '$5.00',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'HIGH DEMAND',
      circleColor: 'bg-[#0284c7]',
      motivationText: '🌟 Elevate your portfolio with high-velocity earnings and priority daily payouts.',
    },
    {
      id: 'elite',
      name: 'Elite',
      tierLabel: 'Elite Tier',
      tagline: 'Accelerated daily velocity and high-tier returns',
      entryPrice: '$100.00',
      minWallet: '$10.00',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'HIGH CAPACITY',
      circleColor: 'bg-[#0284c7]',
      motivationText: '⚡ Unlock boundless financial opportunities with high-yield automated daily capital.',
    },
    {
      id: 'master',
      name: 'Master',
      tierLabel: 'Master Tier',
      tagline: 'Elite daily multiplier for advanced digital leaders',
      entryPrice: '$500.00',
      minWallet: '$50.00',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#db2777]/10 text-[#db2777] border-[#db2777]/30',
      badge: 'PRO MASTER',
      circleColor: 'bg-[#db2777]',
      motivationText: '👑 Experience top-tier financial scaling and exponential revenue independence.',
    },
    {
      id: 'apex',
      name: 'Apex',
      tierLabel: 'Elite Master Tier',
      tagline: 'Unbounded reward scale with peak return rate',
      entryPrice: '$1,000.00',
      minWallet: '$100.00',
      rewardRate: '20%',
      dailyLimit: '20% Daily Yield',
      accentColor: 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30',
      badge: 'ELITE MASTER',
      circleColor: 'bg-[#ea580c]',
      motivationText: '🏆 Reach pinnacle financial freedom with maximum daily capital yields and apex VIP benefits.',
    },
  ];

  const [packageList, setPackageList] = useState(defaultPackages);

  // Fetch dynamic packages from backend API on mount
  useEffect(() => {
    let isMounted = true;
    const loadPackages = async () => {
      try {
        const res = await apiGet('/packages');
        if (res.success && Array.isArray(res.packages) && res.packages.length > 0) {
          if (!isMounted) return;
          const mapped = res.packages.map((pkg) => {
            const id = (pkg.id || '').toLowerCase();
            const matchingDefault = defaultPackages.find((p) => p.id === id) || {};
            const cleanName =
              pkg.name && pkg.name !== 'PACKAGE'
                ? pkg.name
                : matchingDefault.name ||
                  (pkg.tierName
                    ? pkg.tierName
                    : pkg.id
                    ? pkg.id.charAt(0).toUpperCase() + pkg.id.slice(1)
                    : 'Package');
            return {
              id: pkg.id,
              name: cleanName,
              tierLabel: matchingDefault.tierLabel || (pkg.tierName ? `${pkg.tierName} Tier` : `${cleanName} Tier`),
              tagline: matchingDefault.tagline || 'Guaranteed daily returns with verified advertising yield.',
              entryPrice: `$${Number(pkg.price || 0).toFixed(2)}`,
              minWallet: `$${Number(pkg.minWallet || 0).toFixed(2)}`,
              rewardRate: '20%',
              dailyLimit: '20% Daily Yield',
              badge: pkg.badge || matchingDefault.badge || null,
              circleColor: pkg.color ? `bg-[${pkg.color}]` : matchingDefault.circleColor || 'bg-[#0f766e]',
              accentColor: matchingDefault.accentColor || 'bg-[#0f766e]/10 text-[#0f766e]',
              motivationText: matchingDefault.motivationText || pkg.motivationText || '✨ Empower your financial freedom with guaranteed 25% daily returns upon activation.',
            };
          });
          setPackageList(mapped);
        }
      } catch (err) {
        console.warn('Using default package catalog for home:', err);
      }
    };
    loadPackages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure live user stats & wallet balance are synchronized on home view
  useEffect(() => {
    if (fetchUserStats && currentUser) {
      fetchUserStats();
    }
  }, [fetchUserStats, currentUser]);

  const displayedPackages =
    selectedViewMode === 'core' ? packageList.slice(0, 3) : packageList;

  // Handle Primary CTA click
  const handlePrimaryAction = () => {
    if (currentUser) {
      onNavigate('dashboard');
    } else {
      onNavigate('login', 'signup');
    }
  };

  // Handle Package Selection
  const handleSelectPackage = (pkg) => {
    try {
      if (pkg?.id) {
        localStorage.setItem('taemry_selected_package', pkg.id);
      }
    } catch {}

    if (currentUser) {
      onNavigate('dashboard', 'buy-package');
    } else {
      onNavigate('login', 'signup');
    }
  };

  // Resolve live wallet balance directly from live stats or persisted storage
  const resolvedWalletBalance = (() => {
    if (userStats?.walletBalance !== undefined && userStats?.walletBalance !== null) {
      return Number(userStats.walletBalance);
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

  const displayBalance = currentUser
    ? resolvedWalletBalance.toFixed(2)
    : '125.00';
  const displayProgress = currentUser
    ? Math.min(100, Math.round(((userStats?.dailyAdCount || 0) / 200) * 100))
    : 37;

  // Live last reward resolution for logged-in user
  const liveLastReward = (() => {
    if (!currentUser) return '+$2.10';

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

    const pkgKey = (userStats?.currentPackage || '').toLowerCase();
    const pkgPrices = {
      bronze: 1.00,
      silver: 5.00,
      gold: 10.00,
      premium: 50.00,
      elite: 100.00,
      master: 500.00,
      apex: 1000.00,
    };
    const price = pkgPrices[pkgKey] || 0;
    const adReward = price * 0.001; // 0.1% per ad reward

    if ((userStats?.dailyAdCount || 0) > 0 && adReward > 0) {
      return adReward >= 0.01 ? `+$${adReward.toFixed(2)}` : `+$${adReward.toFixed(3)}`;
    }

    if (userStats?.totalEarned && Number(userStats.totalEarned) > 0) {
      const num = Number(userStats.totalEarned);
      return num >= 0.01 ? `+$${num.toFixed(2)}` : `+$${num.toFixed(3)}`;
    }

    if (price > 0 && adReward > 0) {
      return adReward >= 0.01 ? `+$${adReward.toFixed(2)}` : `+$${adReward.toFixed(3)}`;
    }

    return '+$0.00';
  })();

  const hasBoughtPackage = Boolean(
    currentUser &&
    userStats?.currentPackage &&
    userStats.currentPackage !== 'None' &&
    userStats.isEligible
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#07151a]">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Logged In User Live Balance Banner */}
        {currentUser && (
          <div className="w-full max-w-4xl mx-auto mb-8 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#0c5963]/20 dark:border-[#0c5963]/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#697f83] dark:text-[#94a3b8] uppercase tracking-wider block">
                  Live Member Status
                </span>
                <span className="text-sm font-bold text-[#09353e] dark:text-[#f1f5f9]">
                  {currentUser.displayName || currentUser.email} • Package: <strong className="text-[#0c5963] dark:text-[#38bdf8] uppercase">{userStats?.currentPackage || 'None'}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0ede6] dark:border-[#17323b]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">
                  Available Balance
                </span>
                <span className="text-2xl font-black text-[#0c5963] dark:text-[#38bdf8]">
                  ${Number(userStats?.walletBalance || 0).toFixed(2)} <span className="text-xs font-semibold text-[#546e73] dark:text-[#94a3b8]">USD</span>
                </span>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2.5 bg-[#0c5963] hover:bg-[#09424a] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto text-left sm:text-center flex flex-col sm:items-center">
          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#0a353f] dark:text-[#f1f5f9] leading-[1.15] mb-6">
            Put your wallet <br className="hidden sm:block" />
            <span className="text-[#0d5963] dark:text-[#38bdf8]">in motion.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#476066] dark:text-[#94a3b8] max-w-2xl leading-relaxed mb-8">
            TAEMRY FLUX turns consistent attention into a visible earnings habit.
            Fund your wallet, choose your pace, and earn from the work you can see.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-8">
            <button
              id="btn-hero-start"
              onClick={handlePrimaryAction}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-md shadow-[#0c5963]/25 transition-all cursor-pointer"
            >
              <span>{currentUser ? 'Go to My Dashboard' : 'Start with TAEMRY'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-hero-rhythm"
              onClick={() => {
                const el = document.getElementById('packages-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#eae4d8]/80 dark:bg-[#122b33] hover:bg-[#eae4d8] dark:hover:bg-[#173740] text-[#133c44] dark:text-[#f1f5f9] font-semibold rounded-2xl text-base transition-all cursor-pointer"
            >
              <span>See the packages</span>
              <ChevronRight className="w-4 h-4 text-[#597176] dark:text-[#94a3b8]" />
            </button>
          </div>
        </div>

        {/* Floating Preview Card - UPAR */}
        <div className="max-w-[420px] w-full mx-auto mt-6 sm:mt-8 px-2">
          <div
            className="wallet-card relative w-full rounded-[28px] p-6 sm:p-7 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-md dark:shadow-black/60 overflow-hidden transition-colors"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] dark:text-[#94a3b8] tracking-wider uppercase mb-3">
              <span className="tracking-widest">
                {currentUser ? `MEMBER / ${currentUser.email?.split('@')[0]}` : 'TAEMRY / PERSONAL WALLET'}
              </span>
              <div className="status-dot w-2.5 h-2.5 bg-[#ffb703] rounded-full shrink-0 shadow-xs" title="Active" />
            </div>

            <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
              Available Balance
            </p>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight mb-5 flex items-baseline">
              <span>${displayBalance.split('.')[0]}</span>
              <span className="balance-cents text-2xl sm:text-3xl font-extrabold text-[#ff9f00]">
                .{displayBalance.split('.')[1] || '00'}
              </span>
              <span className="text-xs font-bold text-[#546e73] dark:text-[#94a3b8] ml-2 tracking-normal">
                USD
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                <span>Today's ad rhythm</span>
                <span className="font-bold text-[#0d5963] dark:text-[#38bdf8]">{displayProgress}%</span>
              </div>
              <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0d5963] to-[#10b981] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>

            {/* Reward Banner */}
            <div className="reward-banner bg-[#faf8f5] dark:bg-[#07151a] rounded-[20px] p-[14px_18px] flex justify-between items-center border border-[#ece6d9] dark:border-[#173740] transition-colors">
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
                    {currentUser && (userStats?.dailyAdCount || 0) > 0
                      ? `${userStats.dailyAdCount} ads credited today`
                      : 'Keep your rhythm.'}
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
        </div>

        {/* Trust points - NICHY */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-[#486065] dark:text-[#94a3b8] mt-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Guaranteed Daily Ad Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Secure Session Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Verified Payout Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Instant Daily Credits</span>
          </div>
        </div>

        {/* Informative Highlights & Platform Trust Details */}
        <div className="max-w-3xl mx-auto mt-7 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 px-5 py-3 rounded-2xl bg-[#f0eae0]/70 dark:bg-[#0a1f26]/60 border border-[#e4ded2] dark:border-[#173740] text-xs text-[#486065] dark:text-[#94a3b8] shadow-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Daily Watch Ads
            </span>
            <span className="hidden sm:inline text-[#cbd5e1] dark:text-[#1e3f49]">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0c5963] dark:bg-[#38bdf8]" />
              Min. Withdrawal $1.00 USD
            </span>
            <span className="hidden sm:inline text-[#cbd5e1] dark:text-[#1e3f49]">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              JazzCash &amp; Easypaisa Live
            </span>
            <span className="hidden sm:inline text-[#cbd5e1] dark:text-[#1e3f49]">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              5-Level Matching Bonus
            </span>
          </div>

          <p className="text-xs text-[#6e858a] dark:text-[#647b80] mt-3.5 max-w-xl mx-auto leading-relaxed">
            Experience verified advertising yields with transparent session auditing, automated matching bonuses, and instant wallet balance synchronization.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages-section" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
                CHOOSE YOUR PACE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#09353e] mt-2">
                Official Earning Packages. Calculated Growth.
              </h2>
              <p className="text-sm text-[#556e73] mt-1">
                Start where it makes sense. You can always build into the next level as your wallet balance grows.
              </p>
            </div>

            {/* Filter Toggle with Fluid Splash Animation */}
            <div className="relative flex items-center bg-[#eae4d8] dark:bg-[#122b33] p-1 rounded-xl self-start sm:self-auto text-xs font-semibold border border-[#dcd6c8] dark:border-[#1a3b45]">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                onClick={(e) => handleFilterToggle(e, 'core')}
                className={`relative px-3.5 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer font-bold overflow-hidden select-none ${
                  selectedViewMode === 'core'
                    ? 'text-white'
                    : 'text-[#50686d] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-white'
                }`}
              >
                {selectedViewMode === 'core' && (
                  <motion.span
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-[#0c5963] rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                {/* Fluid Splash Wave & Ring */}
                {filterSplash && filterSplash.mode === 'core' && (
                  <>
                    <span
                      key={`splash-${filterSplash.id}`}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#38bdf8_0%,rgba(12,89,99,0.5)_50%,transparent_75%)] animate-fluid-splash"
                      style={{
                        left: filterSplash.x,
                        top: filterSplash.y,
                        width: '140px',
                        height: '140px',
                      }}
                    />
                    <span
                      key={`ring-${filterSplash.id}`}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/90 dark:border-teal-300/90 animate-fluid-splash-ring"
                      style={{
                        left: filterSplash.x,
                        top: filterSplash.y,
                        width: '120px',
                        height: '120px',
                      }}
                    />
                  </>
                )}
                <span className="relative z-10">Starter 3</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                onClick={(e) => handleFilterToggle(e, 'all')}
                className={`relative px-3.5 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer font-bold overflow-hidden select-none ${
                  selectedViewMode === 'all'
                    ? 'text-white'
                    : 'text-[#50686d] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-white'
                }`}
              >
                {selectedViewMode === 'all' && (
                  <motion.span
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-[#0c5963] rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                {/* Fluid Splash Wave & Ring */}
                {filterSplash && filterSplash.mode === 'all' && (
                  <>
                    <span
                      key={`splash-${filterSplash.id}`}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#38bdf8_0%,rgba(12,89,99,0.5)_50%,transparent_75%)] animate-fluid-splash"
                      style={{
                        left: filterSplash.x,
                        top: filterSplash.y,
                        width: '160px',
                        height: '160px',
                      }}
                    />
                    <span
                      key={`ring-${filterSplash.id}`}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/90 dark:border-teal-300/90 animate-fluid-splash-ring"
                      style={{
                        left: filterSplash.x,
                        top: filterSplash.y,
                        width: '140px',
                        height: '140px',
                      }}
                    />
                  </>
                )}
                <span className="relative z-10">All {packageList.length} Packages</span>
              </motion.button>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPackages.map((pkg, idx) => {
              const isCurrentActive =
                currentUser &&
                userStats?.currentPackage &&
                userStats.currentPackage.toLowerCase() === pkg.id.toLowerCase();

              const motivationTexts = [
                '✨ Empower your financial freedom with guaranteed 25% daily returns upon activation.',
                '🚀 Accelerate your daily revenue momentum with verified digital asset accumulation.',
                '💼 Secure your financial growth with maximized cashflow and steady compounding returns.',
                '🌟 Elevate your portfolio with high-velocity earnings and priority daily payouts.',
                '⚡ Unlock boundless financial opportunities with high-yield automated daily capital.',
                '👑 Experience executive-grade wealth expansion with supreme daily returns and leadership perks.',
                '🏆 Reach pinnacle financial freedom with maximum daily capital yields and apex VIP benefits.',
              ];
              const uniqueMotivation = pkg.motivationText || motivationTexts[idx % motivationTexts.length];

              const teamRewardLines = [
                'Earn continuous team rewards and matching bonuses whenever your downline watches daily ads.',
                'Amplify daily earnings with active team ad bonuses across verified network members.',
                'Maximize team rewards as your downline completes their daily ad viewing tasks.',
                'Accelerate team ad commissions with priority multi-tier network bonuses.',
                'Unlock high-yield team rewards and daily matching bonuses from team ad views.',
                'Command premier team bonuses with substantial daily rewards fueled by team ads.',
                'Pinnacle team rewards: receive maximum daily bonuses from entire team ad network.',
              ];
              const currentTeamRewardLine = teamRewardLines[idx % teamRewardLines.length];

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    isCurrentActive
                      ? 'border-[#0c5963] ring-2 ring-[#0c5963]/20'
                      : 'border-[#e4dfd4] hover:border-[#0c5963]/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${pkg.circleColor || 'bg-[#0d5963]'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0c5963]">
                          PACKAGE
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentActive && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            YOUR ACTIVE PACKAGE
                          </span>
                        )}
                        {pkg.badge && !isCurrentActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4f1] text-[#0d5963] px-2 py-0.5 rounded-full border border-[#bfe3dc]">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-[#09353e] mb-0.5 group-hover:text-[#0c5963] transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="hidden text-xs font-semibold text-[#0c5963] mb-1">
                      {pkg.tierLabel || `${pkg.entryPrice} Tier`}
                    </p>
                    <p className="text-xs text-[#0c5963] font-medium mb-5 min-h-[36px] flex items-start gap-1.5 leading-relaxed">
                      <Sparkles className="w-3.5 h-3.5 text-[#d97706] shrink-0 mt-0.5" />
                      <span>{uniqueMotivation}</span>
                    </p>

                    <div className="pt-3 border-t border-[#f0ede6] space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-[#71868a] block uppercase font-medium">
                            Activation Price
                          </span>
                          <span className="text-2xl font-extrabold text-[#09353e]">
                            {pkg.entryPrice}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#71868a] block uppercase font-medium">
                            Daily Return
                          </span>
                          <span className="text-sm font-bold text-[#0c5963]">
                            {pkg.rewardRate || '20%'} Daily
                          </span>
                        </div>
                      </div>

                      {/* Team Rewards & Team Ads information */}
                      <div className="bg-[#fbf8f2] p-3 rounded-xl border border-[#ece4d6] text-xs">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-[#0c5963]">Team Rewards &amp; Team Ads</span>
                          <span className="text-[10px] text-[#0d5963] bg-[#e6f4f1] px-2 py-0.5 rounded-md font-semibold">5 Levels</span>
                        </div>
                        <p className="text-[11px] text-[#556e73] leading-snug">
                          {currentTeamRewardLine}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                        : 'bg-[#faf8f5] hover:bg-[#0c5963] hover:text-white text-[#09353e] border border-[#e0dad0] hover:border-[#0c5963]'
                    }`}
                  >
                    <span>
                      {isCurrentActive
                        ? 'Active Package'
                        : currentUser
                        ? 'Activate Package with Wallet'
                        : 'Select & Activate Package'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Leaderboard (Unlimited) */}
      <LiveLeaderboard onNavigate={onNavigate} />

      {/* Support & Clarity Banner (Phase 7 Integration) */}
      <section className="py-12 px-4 sm:px-6 bg-[#f2ede2] border-y border-[#e3dcd0]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0c5963] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#09353e]">Need assistance with your account or deposit?</h3>
              <p className="text-xs text-[#556e73] mt-0.5">
                Contact Support anytime. Our support team is operational to assist with packages and deposits.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('support')}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#0c5963] text-[#09353e] hover:text-white font-semibold text-xs border border-[#ddd5c7] hover:border-[#0c5963] transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQs) Section */}
      <section id="faqs-section" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-left sm:text-center mb-12">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              FREQUENTLY ASKED QUESTIONS (FAQS)
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#09353e] mt-2 mb-3">
              Answers to Common Questions
            </h2>
            <p className="text-sm sm:text-base text-[#50686d] max-w-xl sm:mx-auto">
              Everything you need to know about starting, watching daily ads, referral commissions, milestones, and withdrawals.
            </p>
          </div>

          <div className="space-y-3">
            {homeFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-[#0c5963]/40 ring-2 ring-[#0c5963]/10 shadow-sm' : 'border-[#e4dfd4]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#faf8f4] transition-colors cursor-pointer select-none group"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#09353e] group-hover:text-[#0c5963] transition-colors">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isOpen
                          ? 'bg-[#0c5963] text-white'
                          : 'bg-[#f0eae0] text-[#0c5963] group-hover:bg-[#e4dcce]'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-answer"
                        initial={{ height: 0, opacity: 0, y: -6 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -6 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-[#4d666b] leading-relaxed border-t border-[#f2ede4] bg-[#fcfbfa] whitespace-pre-line">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Quick Helper Banner */}
          <div className="mt-10 p-5 rounded-2xl bg-[#f2ede2] border border-[#e2dacb] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="text-sm font-bold text-[#09353e]">Still have questions or need technical assistance?</h4>
              <p className="text-xs text-[#5a7378] mt-0.5">Read our full official whitepaper documentation or submit a ticket to our support desk.</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigate('whitepaper')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#0c5963] text-[#0c5963] hover:text-white font-bold text-xs border border-[#d8cfbe] transition-all cursor-pointer shadow-xs"
              >
                Whitepaper (v1.0)
              </button>
              <button
                onClick={() => onNavigate('support')}
                className="px-4 py-2 rounded-xl bg-[#0c5963] hover:bg-[#09424a] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer Call to Action */}
      <section className="py-16 px-4 sm:px-6 bg-[#093843] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
            <img src="/taemry-logo.svg" alt="TAEMRY" className="w-full h-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Ready to start your rhythm?
          </h2>
          <p className="text-sm sm:text-base text-[#96b3b9] max-w-md mx-auto mb-8">
            Create your account in seconds. Fund your wallet and activate your first package today.
          </p>
          <button
            onClick={handlePrimaryAction}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold rounded-2xl text-base shadow-lg shadow-black/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{currentUser ? 'Open My Dashboard' : 'Open your wallet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
