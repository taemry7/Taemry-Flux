import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LifeBuoy,
  ShieldCheck,
  Zap,
  Tv,
  Pickaxe,
  Flame,
  PlaySquare,
  Cpu,
  Coins,
  TrendingUp,
  Layers,
  Clock,
  AlertCircle,
  Package,
  ArrowDownCircle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Logo from '../components/Logo';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api/client';
import { db, isFirebaseConfigured } from '../firebase/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

export default function HomePage({ onNavigate }) {
  const { currentUser, userStats, fetchUserStats } = useAuth();
  const [selectedViewMode, setSelectedViewMode] = useState('core'); // 'core' (Starter 3) first
  const [filterSplash, setFilterSplash] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [heroCardMode, setHeroCardMode] = useState('ads'); // 'ads' | 'miner'
  const [cardSplash, setCardSplash] = useState(null);
  const [packagesCardMode, setPackagesCardMode] = useState('ads'); // 'ads' | 'miner'
  const [packagesCardSplash, setPackagesCardSplash] = useState(null);
  const [showMinerIneligibleModal, setShowMinerIneligibleModal] = useState(false);

  // Live Cloud Miner Real Production State (Zero Test Mode, Live Production Synced)
  const [liveMinerData, setLiveMinerData] = useState(() => {
    try {
      const saved = localStorage.getItem('taemry_tflx_miner_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      minedTflx: 0.00,
      isMiningActive: false,
      sessionStartTime: 0,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      effectiveHashrate: 16.0,
    };
  });

  // Hydrate from Firestore collection 'cloudMiner' and localStorage sync
  useEffect(() => {
    const syncFromLocal = () => {
      try {
        const saved = localStorage.getItem('taemry_tflx_miner_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLiveMinerData((prev) => ({
            ...(prev || {}),
            ...parsed,
          }));
        }
      } catch {}
    };

    window.addEventListener('storage', syncFromLocal);
    window.addEventListener('focus', syncFromLocal);

    if (!currentUser?.uid || !isFirebaseConfigured) {
      return () => {
        window.removeEventListener('storage', syncFromLocal);
        window.removeEventListener('focus', syncFromLocal);
      };
    }

    let isMounted = true;
    try {
      const docRef = doc(db, 'cloudMiner', currentUser.uid);
      getDoc(docRef)
        .then((snap) => {
          if (!isMounted || !snap.exists()) return;
          const remote = snap.data();
          setLiveMinerData((prev) => ({
            ...(prev || {}),
            ...remote,
          }));
        })
        .catch(() => {});
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncFromLocal);
      window.removeEventListener('focus', syncFromLocal);
    };
  }, [currentUser?.uid]);

  // Real-time live mining tick
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setLiveMinerData((prev) => {
        if (!prev) return prev;
        const now = Date.now();
        const sessionDuration = prev.sessionDurationMs || (12 * 60 * 60 * 1000);
        const sessionElapsed = now - (prev.sessionStartTime || now);
        const effectiveRate = Number(prev.effectiveHashrate) || 16.0;

        if (prev.isMiningActive && sessionElapsed < sessionDuration) {
          const tflxPerSec = effectiveRate / 3600;
          return {
            ...prev,
            minedTflx: Number((Number(prev.minedTflx || 0) + tflxPerSec).toFixed(4)),
            lastSyncTime: now,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

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

  const handlePackagesCardModeToggle = (e, mode) => {
    if (mode === packagesCardMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    setPackagesCardSplash({
      id: Date.now() + Math.random(),
      mode,
      x,
      y,
    });
    setPackagesCardMode(mode);
  };

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
      q: 'Q1. What is TAEMRY FLUX and its Dual-Earning Architecture?',
      a: 'TAEMRY FLUX is a revolutionary digital wealth ecosystem combining two high-yield earning engines: 1. Watch Ads (immediate daily USD cashflow with guaranteed 20% returns), and 2. Cloud Mining (automated 12-hour session hashing of native TFLX crypto tokens). Both run seamlessly together!'
    },
    {
      q: 'Q2. What is TAEMRY Cloud Mining and how does it generate crypto yield?',
      a: 'TAEMRY Cloud Mining is an automated, server-authoritative 12-hour session mining protocol. With a single tap, your cloud mining session activates for 12 hours. It consumes 0% of your mobile battery, requires no hardware maintenance, and hashes native TFLX tokens continuously at a base rate of +16 TFLX/h.'
    },
    {
      q: 'Q3. How does Watch Ads differ from Cloud Mining?',
      a: 'Watch Ads provides immediate daily USD cashflow (20% daily return on packages across daily ads) with instant wallet balance credit, withdrawable to JazzCash and Easypaisa. Cloud Mining generates passive crypto hashrate and TFLX tokens on 12-hour cycles with pre-staking boosts and halving epochs. You can run both simultaneously!'
    },
    {
      q: 'Q4. What are the Slashing & Days-Off mechanics in Cloud Mining?',
      a: 'To maintain network integrity, mining streaks require regular 12-hour check-ins. If you miss a session without protection, inactive slashing penalties can deduct a portion of uncommitted rewards. However, you can earn or activate "Days-Off" rest passes to pause your streak safely without any penalty.'
    },
    {
      q: 'Q5. How do Pre-Staking boosts and Guild Networks work?',
      a: 'Pre-staking allows you to commit your mined TFLX for up to 3 years to unlock multipliers up to +250% hashrate. Additionally, your 2-Tier Guild Network grants up to 20% extra hashrate power when your invited friends are actively mining.'
    },
    {
      q: 'Q6. How do daily ad returns on packages work?',
      a: 'Every package delivers guaranteed 20% daily returns through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.'
    },
    {
      q: 'Q7. What are the deposit and withdrawal methods?',
      a: '1. Easypaisa, 2. JazzCash (Fixed exchange rate: 1 USD = 300 PKR), 3. Crypto USDT. Instant wallet updates.'
    },
    {
      q: 'Q8. What is the minimum and maximum withdrawal?',
      a: 'Minimum: $1.00 USD. Maximum: $1,000.00 USD (per single request). You can withdraw once per day with a 5-minute cooldown directly to your mobile wallet.'
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

  const currentPackageName = userStats?.currentPackage && userStats.currentPackage !== 'None'
    ? userStats.currentPackage
    : null;

  const activeTierObj = defaultPackages.find(
    (pkg) => pkg.name.toLowerCase() === (currentPackageName || '').toLowerCase()
  ) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#07151a]">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
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
        </div>

        {/* Dual Switcher Controls & Hero Floating Preview Card */}
        <div className="max-w-[460px] w-full mx-auto mt-6 sm:mt-8 px-2 flex flex-col items-center">
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
              id="btn-hero-mode-ads"
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
              id="btn-hero-mode-miner"
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
                  key={`card-glow-${cardSplash.id}`}
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
                  key="hero-mode-ads-card"
                  initial={{ opacity: 0, scale: 0.97, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.97, filter: 'blur(2px)' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col justify-between flex-1"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] dark:text-[#94a3b8] tracking-wider uppercase mb-3">
                      <span className="tracking-widest">
                        {currentUser ? `MEMBER / ${currentUser.email?.split('@')[0]}` : 'TAEMRY / PERSONAL WALLET'}
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
                          <span>${Number(userStats?.totalEarned || 0).toFixed(2).split('.')[0]}</span>
                          <span className="balance-cents text-lg sm:text-xl font-extrabold text-emerald-500">
                            .{Number(userStats?.totalEarned || 0).toFixed(2).split('.')[1] || '00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                        <span>Today's ad rhythm</span>
                        <span className="hidden font-bold text-[#0d5963] dark:text-[#38bdf8]">
                          {userStats?.dailyAdCount || 0} / 200 ({displayProgress}%)
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
                            {currentUser && (userStats?.dailyAdCount || 0) > 0
                              ? `${userStats.dailyAdCount} ads credited today`
                              : (userStats?.currentPackage && userStats.currentPackage !== 'None'
                                  ? `${userStats.currentPackage} • 20% Daily`
                                  : 'Keep your rhythm.')}
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
                    id="btn-card-dashboard"
                    onClick={() => onNavigate('dashboard')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all cursor-pointer mt-1"
                  >
                    <span>Go to My Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="hero-mode-miner-card"
                  initial={{ opacity: 0, scale: 0.97, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.97, filter: 'blur(2px)' }}
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
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tracking-normal">ACTIVE</span>
                      </div>
                    </div>

                    {/* Balance: Mined Hash Yield with live TFLX tokens (Real production sync) */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8]">
                          Mined Hash Yield
                        </p>
                        <span className="hidden text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#fffbeb] dark:bg-[#2a1a08] text-[#d97706] dark:text-[#f59e0b] border border-[#fde68a] dark:border-[#45270c]">
                          USD • TFLX
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                        <span>{Number(liveMinerData?.minedTflx ?? 0).toFixed(2).split('.')[0]}</span>
                        <span className="balance-cents text-lg sm:text-xl font-extrabold text-[#d97706] dark:text-[#f59e0b]">
                          .{Number(liveMinerData?.minedTflx ?? 0).toFixed(2).split('.')[1] || '00'}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#d97706] dark:text-[#f59e0b] ml-1.5">
                          TFLX
                        </span>
                      </div>

                      {/* Hidden Hashrate Power div */}
                      <div className="hidden">
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

                    {/* Progress bar: 12h Mining Hash Session (Live production calculation) */}
                    {(() => {
                      const now = Date.now();
                      const sessionDuration = liveMinerData?.sessionDurationMs || (12 * 60 * 60 * 1000);
                      const sessionElapsed = Math.max(0, now - (liveMinerData?.sessionStartTime || now));
                      const pct = liveMinerData?.isMiningActive
                        ? Math.min(100, Math.max(0, Math.round((sessionElapsed / sessionDuration) * 100)))
                        : 0;
                      const isMining = Boolean(liveMinerData?.isMiningActive && sessionElapsed < sessionDuration);

                      return (
                        <div className="space-y-1.5 mb-5">
                          <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                            <span className="flex items-center gap-1 font-semibold text-[#b45309] dark:text-[#f59e0b]">
                              <Flame className="w-3.5 h-3.5 text-[#d97706] dark:text-[#f59e0b]" />
                              12h Mining Hash Session
                            </span>
                            <span className="font-bold text-[#d97706] dark:text-[#f59e0b]">
                              {isMining ? `Mining Active (${pct}%)` : 'Session Completed'}
                            </span>
                          </div>
                          <div className="w-full bg-[#fef3c7]/60 dark:bg-[#1f190e] h-2.5 rounded-full overflow-hidden relative">
                            <div
                              className="bg-gradient-to-r from-[#d97706] to-[#ea580c] h-full rounded-full transition-all duration-1000 shadow-xs relative overflow-hidden"
                              style={{ width: `${pct}%` }}
                            >
                              <div className="absolute inset-0 bg-white/25 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

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
                          +{Number(liveMinerData?.effectiveHashrate || 16.0).toFixed(0)} TFLX/h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Miner Action Button - Styled with vibrant amber-orange gradient */}
                  <button
                    id="btn-card-miner-paused"
                    onClick={() => {
                      const hasActivePackage = Boolean(userStats?.currentPackage && userStats?.currentPackage !== 'None');
                      if (!hasActivePackage) {
                        setShowMinerIneligibleModal(true);
                      } else {
                        onNavigate('cloud-miner');
                      }
                    }}
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

        {/* Trust points - NICHY */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-[#486065] dark:text-[#94a3b8] mt-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Guaranteed Daily Ad Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <Pickaxe className="w-4 h-4 text-[#ea580c] dark:text-[#fb923c]" />
            <span>Cloud Miner Verified</span>
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
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
              12H Cloud Mining Active
            </span>
            <span className="hidden sm:inline text-[#cbd5e1] dark:text-[#1e3f49]">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              5-Level Matching Bonus
            </span>
          </div>

          <p className="text-xs text-[#6e858a] dark:text-[#647b80] mt-3.5 max-w-xl mx-auto leading-relaxed">
            Experience verified advertising yields and automated 12-hour cloud mining hashpower with transparent session auditing, streak protection, and instant wallet balance synchronization.
          </p>
        </div>
      </section>

      {/* Dual Wealth Engines: Watch Ads & Cloud Miner Section */}
      <section id="packages-section" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c5963]/10 text-[#0c5963] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Dual Digital Wealth Engines</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09353e] tracking-tight">
              Watch Ads & Cloud Mining: Maximize Daily Yields
            </h2>
            <p className="text-sm sm:text-base text-[#556e73] mt-3 leading-relaxed">
              Unlock two complementary, high-yield revenue models: generate instant USD cashflow from daily sponsor ad views with guaranteed 20% returns, or harness automated 12-hour cloud mining hashpower for continuous crypto accumulation.
            </p>
          </div>

          {/* Dual Mode Switcher & Unified Engine Card Container */}
          <div className="max-w-[560px] w-full mx-auto flex flex-col items-center">
            {/* Dual Switcher Controls (Watch Ads vs Cloud Miner) */}
            <div className="relative inline-flex p-1 rounded-2xl bg-white/90 dark:bg-[#0a1b22]/90 border border-[#e4ded2] dark:border-[#173740] shadow-sm mb-6 backdrop-blur-xs overflow-hidden">
              {/* Fluid circular splash wave on click */}
              <AnimatePresence>
                {packagesCardSplash && (
                  <motion.span
                    key={packagesCardSplash.id}
                    initial={{ scale: 0, opacity: 0.85, filter: 'blur(0px)' }}
                    animate={{ scale: 5, opacity: 0, filter: 'blur(16px)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      left: packagesCardSplash.x,
                      top: packagesCardSplash.y,
                    }}
                    className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-28 h-28 ${
                      packagesCardSplash.mode === 'ads'
                        ? 'bg-gradient-to-r from-[#0c5963] to-[#10b981]'
                        : 'bg-gradient-to-r from-[#d97706] to-[#ea580c]'
                    }`}
                  />
                )}
              </AnimatePresence>

              {/* Watch Ads Toggle Button */}
              <button
                type="button"
                id="btn-packages-mode-ads"
                onClick={(e) => handlePackagesCardModeToggle(e, 'ads')}
                className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                  packagesCardMode === 'ads'
                    ? 'bg-[#0c5963] text-white shadow-md shadow-[#0c5963]/30 scale-[1.02]'
                    : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white hover:bg-[#f3eee4]/60 dark:hover:bg-[#12313c]/60'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>Watch Ads</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${packagesCardMode === 'ads' ? 'animate-ping bg-emerald-300 opacity-80' : 'bg-emerald-500/40'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${packagesCardMode === 'ads' ? 'bg-emerald-400' : 'bg-emerald-600'}`}></span>
                </span>
              </button>

              {/* Cloud Miner Toggle Button */}
              <button
                type="button"
                id="btn-packages-mode-miner"
                onClick={(e) => handlePackagesCardModeToggle(e, 'miner')}
                className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                  packagesCardMode === 'miner'
                    ? 'bg-gradient-to-r from-[#d97706] to-[#ea580c] text-white shadow-md shadow-amber-500/30 scale-[1.02]'
                    : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white hover:bg-[#f3eee4]/60 dark:hover:bg-[#12313c]/60'
                }`}
              >
                <Pickaxe className="w-4 h-4 shrink-0" />
                <span>Cloud Miner</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${packagesCardMode === 'miner' ? 'animate-ping bg-amber-300 opacity-80' : 'bg-amber-500/40'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${packagesCardMode === 'miner' ? 'bg-amber-400' : 'bg-amber-600'}`}></span>
                </span>
              </button>
            </div>

            {/* Dynamic Card Container with Animated Transition */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {packagesCardMode === 'ads' ? (
                  <motion.div
                    key="unified-engine-ads"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="wallet-card relative w-full rounded-[28px] p-6 sm:p-7 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-md dark:shadow-black/60 overflow-hidden transition-all flex flex-col justify-between group hover:border-[#0c5963]/50"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-100/40 dark:from-teal-900/20 via-emerald-50/20 dark:via-transparent to-transparent rounded-bl-full pointer-events-none" />

                    <div>
                      {/* Top Header matching First Div */}
                      <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] dark:text-[#94a3b8] tracking-wider uppercase mb-3">
                        <span className="tracking-widest flex items-center gap-1.5 font-bold text-[#0c5963] dark:text-[#38bdf8]">
                          <Tv className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
                          TAEMRY / SPONSOR ADS
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-normal">DAILY ACTIVE</span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0c5963] to-[#08424b] text-white flex items-center justify-center shrink-0 shadow-md">
                          <Tv className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-[#09353e] dark:text-[#f1f5f9] group-hover:text-[#0c5963] dark:group-hover:text-[#38bdf8] transition-colors">
                            Watch &amp; Earn: Guaranteed Daily Cash
                          </h3>
                          <p className="text-xs font-semibold text-[#0c5963] dark:text-[#38bdf8]">
                            Daily Sponsor Ads • Instant Wallet Synchronization
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#50686d] dark:text-[#94a3b8] mb-5 leading-relaxed">
                        Monetize your daily screen time with verifiable returns. Every activated package tier gives you a daily quota of sponsor ads, delivering an industry-leading 20% daily return credited straight to your available balance.
                      </p>

                      {/* Balances & Yields Grid matching First Div */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                          <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                            Daily Ad Quota
                          </p>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                            <span className="hidden">200</span>
                            <span className="text-sm font-bold text-[#0c5963] dark:text-[#38bdf8]">Daily Ads</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                          <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                            Guaranteed Return
                          </p>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                            <span>20%</span>
                            <span className="balance-cents text-xs font-bold text-emerald-500 ml-1">Daily Yield</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar matching First Div */}
                      <div className="hidden space-y-1.5 mb-5">
                        <div className="flex justify-between text-xs font-medium text-[#4f676b] dark:text-[#94a3b8]">
                          <span>Today's ad rhythm</span>
                          <span className="font-bold text-[#0d5963] dark:text-[#38bdf8]">
                            {userStats?.dailyAdCount || 0} / 200 ({displayProgress}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#0d5963] to-[#10b981] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${displayProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Reward Banner matching First Div */}
                      <div className="hidden reward-banner bg-[#faf8f5] dark:bg-[#07151a] rounded-[20px] p-[14px_18px] flex justify-between items-center border border-[#ece6d9] dark:border-[#173740] transition-colors mb-5">
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
                                : (userStats?.currentPackage && userStats.currentPackage !== 'None'
                                    ? `${userStats.currentPackage} • 20% Daily`
                                    : 'Keep your rhythm.')}
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

                      {/* Core Benefits */}
                      <div className="space-y-3 pt-4 border-t border-[#f0ebe0] dark:border-[#173740]">
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#0c5963] dark:text-[#38bdf8]">20% Guaranteed Daily Returns:</strong> Fixed, transparent earnings calculated per ad (0.10% per ad view).
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#0c5963] dark:text-[#38bdf8]">Zero-Delay Instant Credit:</strong> No waiting for cycle closures — funds credit to your wallet in real time.
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#0c5963] dark:text-[#38bdf8]">5-Level Multi-Tier Matching:</strong> Earn 25% (L1), 20% (L2), 15% (L3), 10% (L4), and 5% (L5) matching bonuses when your network watches ads.
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#0c5963] dark:text-[#38bdf8]">Low $1.00 USD Entry:</strong> Start immediately with our starter Bronze tier and withdraw anytime via JazzCash, Easypaisa, or USDT.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons matching First Div */}
                    <div className="mt-8 pt-5 border-t border-[#f0ebe0] dark:border-[#173740] flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) {
                            onNavigate("dashboard", "watch-ads");
                          } else {
                            onNavigate("login");
                          }
                        }}
                        className="w-full sm:flex-1 py-3.5 px-5 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <PlaySquare className="w-4 h-4" />
                        <span>Start Watching Ads</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) {
                            onNavigate("dashboard", "buy-package");
                          } else {
                            onNavigate("login");
                          }
                        }}
                        className="w-full sm:w-auto py-3.5 px-4 bg-[#f4fbf9] dark:bg-[#0c262e] hover:bg-[#e6f4f1] dark:hover:bg-[#133640] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                        <span>View Packages</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unified-engine-miner"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="wallet-card relative w-full rounded-[28px] p-6 sm:p-7 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-md dark:shadow-black/60 overflow-hidden transition-all flex flex-col justify-between group hover:border-[#ea580c]/50"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-100/40 dark:from-amber-900/20 via-orange-50/20 dark:via-transparent to-transparent rounded-bl-full pointer-events-none" />

                    <div>
                      {/* Top Header matching First Div */}
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

                      {/* Title & Subtitle */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d97706] to-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-md">
                          <Pickaxe className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-[#09353e] dark:text-[#f1f5f9] group-hover:text-[#ea580c] dark:group-hover:text-[#fb923c] transition-colors">
                            Cloud Miner: Automated Hashrate
                          </h3>
                          <p className="hidden text-xs font-semibold text-[#d97706] dark:text-[#f59e0b]">
                            12H Tap Cycle • 100% Cloud-Powered • Zero Device Drain
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#50686d] dark:text-[#94a3b8] mb-5 leading-relaxed">
                        Participate in next-generation decentralized token minting. Single-tap activation launches an autonomous 12-hour mining cycle on enterprise servers with zero phone battery drain, zero device heating, and streak-protected continuity.
                      </p>

                      {/* Balances & Yields Grid matching First Div */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8]">
                              1 TFLX ~ 0.7$
                            </p>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#fffbeb] dark:bg-[#2a1a08] text-[#d97706] dark:text-[#f59e0b] border border-[#fde68a] dark:border-[#45270c]">
                              USD • TFLX
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                            <span>1 TFLX</span>
                            <span className="text-sm sm:text-base font-bold text-[#d97706] dark:text-[#f59e0b] ml-1.5">
                              ~ 0.7$
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                          <p className="text-xs font-semibold text-[#6e8286] dark:text-[#94a3b8] mb-1">
                            Base Hashrate
                          </p>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight flex items-baseline">
                            <span>+{Number(liveMinerData?.effectiveHashrate || 16.0).toFixed(0)}</span>
                            <span className="text-xs font-bold text-[#d97706] dark:text-[#f59e0b] ml-1">
                              TFLX/h
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar matching First Div */}
                      <div className="hidden space-y-1.5 mb-5">
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

                      {/* Bottom Banner matching First Div */}
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
                            +{Number(liveMinerData?.effectiveHashrate || 16.0).toFixed(0)} TFLX/h
                          </div>
                        </div>
                      </div>

                      {/* Core Benefits */}
                      <div className="space-y-3 pt-4 border-t border-[#f0ebe0] dark:border-[#173740]">
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#ea580c] dark:text-[#fb923c]">12-Hour Session Rhythm:</strong> Tap once and let the cloud mine +16 TFLX/h passively in the background.
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#ea580c] dark:text-[#fb923c]">Slashing &amp; Days-Off Shield:</strong> Use rest passes to safeguard your mining streak and prevent inactive penalties.
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#ea580c] dark:text-[#fb923c]">Pre-Staking Boost (Up to +250%):</strong> Multiply your minting yields by pre-staking before halving epochs.
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-[#09353e] dark:text-[#e2e8f0]">
                          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-[#ea580c] dark:text-[#fb923c]">2-Tier Guild Network:</strong> Pool computational power with friends for compound referral hashrate bonuses.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons matching First Div */}
                    <div className="mt-8 pt-5 border-t border-[#f0ebe0] dark:border-[#173740] flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigate("cloud-miner")}
                        className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Launch Cloud Miner</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("faqs-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full sm:w-auto py-3.5 px-4 bg-[#fffaf5] dark:bg-[#1a140b] hover:bg-[#ffedd5] dark:hover:bg-[#2e1d08] text-[#ea580c] dark:text-[#fb923c] border border-[#fed7aa] dark:border-[#382613] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Cpu className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>Mining Info</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Strategic Synergy Banner */}
          <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-[#0c5963]/10 via-[#faf8f5] to-[#ea580c]/10 border border-[#e4ded2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#09353e] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Coins className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#09353e]">
                  Dual-Income Synergy: Earn USD Cashflow + Mint TFLX Tokens
                </h4>
                <p className="text-xs text-[#526d72] mt-0.5">
                  Top earners watch daily ads for steady USD cashflow (withdrawable daily to JazzCash/Easypaisa) while keeping Cloud Miner active 24/7 for future token appreciation. Packages can be viewed and activated directly inside Watch Ads.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  onNavigate("dashboard", "watch-ads");
                } else {
                  onNavigate("login");
                }
              }}
              className="px-5 py-2.5 bg-[#09353e] hover:bg-[#0c5963] text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <span>Explore Watch Ads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
          {/* Cloud Mining Protocol Guide Card */}
          <div className="mb-10 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#fff7ed] to-white border border-[#fed7aa] shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d97706] to-[#ea580c] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Pickaxe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#7c2d12]">
                    How TAEMRY Cloud Mining Protocol Operates
                  </h3>
                  <p className="text-xs text-[#9a3412]">
                    Next-generation server-side cryptocurrency mining without hardware wear or battery drain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('cloud-miner')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                <span>Launch Cloud Miner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#fed7aa]/60 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-[#fed7aa]/50">
                <div className="flex items-center gap-1.5 font-bold text-[#7c2d12] mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>12H Tap Cycles</span>
                </div>
                <p className="text-[11px] text-[#9a3412] leading-relaxed">
                  One tap powers 12 hours of hashing at +16 TFLX/h. The app does not need to remain open.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-[#fed7aa]/50">
                <div className="flex items-center gap-1.5 font-bold text-[#7c2d12] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Days-Off Streak Pass</span>
                </div>
                <p className="text-[11px] text-[#9a3412] leading-relaxed">
                  Rest passes protect accumulated tokens from inactive slashing when you miss a session.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-[#fed7aa]/50">
                <div className="flex items-center gap-1.5 font-bold text-[#7c2d12] mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Pre-Staking Boost</span>
                </div>
                <p className="text-[11px] text-[#9a3412] leading-relaxed">
                  Lock tokens for up to 3 years to multiply hashrate up to +250% before epoch halving.
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-center mb-12">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              FREQUENTLY ASKED QUESTIONS (FAQS)
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#09353e] mt-2 mb-3">
              Answers to Common Questions
            </h2>
            <p className="text-sm sm:text-base text-[#50686d] max-w-xl sm:mx-auto">
              Everything you need to know about starting, watching daily ads, Cloud Mining protocols, referral commissions, milestones, and withdrawals.
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
            <span>{currentUser ? 'Go to Dashboard' : 'Start with TAEMRY'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Ineligible to Mine Modal */}
      <AnimatePresence>
        {showMinerIneligibleModal && (
          <div
            id="modal-miner-ineligible-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowMinerIneligibleModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-8 border border-[#e4ded2] dark:border-[#173740] shadow-xl text-center relative overflow-hidden"
            >
              <button
                type="button"
                id="btn-close-miner-ineligible-modal"
                onClick={() => setShowMinerIneligibleModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#7a8c94] dark:text-[#94a3b8] hover:bg-[#faf8f5] dark:hover:bg-[#112d36] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
                <span>Ineligible to Mine</span>
                <span>•</span>
                <span>Package Required</span>
              </div>

              <h3 className="text-2xl font-bold text-[#09353e] dark:text-white mb-2">
                Ineligible to Mine
              </h3>

              <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mb-6 leading-relaxed">
                Package buy karne ke baad ye eligible aur activate hoga. To start live cloud mining and earn TFLX tokens, please activate an advertising package.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  id="btn-modal-miner-buy-package"
                  onClick={() => {
                    setShowMinerIneligibleModal(false);
                    onNavigate('dashboard', 'buy-package');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Buy Package to Activate Mining</span>
                </button>
                <button
                  type="button"
                  id="btn-modal-miner-deposit"
                  onClick={() => {
                    setShowMinerIneligibleModal(false);
                    onNavigate('dashboard', 'deposit');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-[#122e37] text-[#09353e] dark:text-white border border-[#d8d1c3] dark:border-[#1e4854] text-sm font-bold rounded-xl hover:bg-[#f8f5ee] transition-all cursor-pointer"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Deposit Funds</span>
                </button>
                <button
                  type="button"
                  id="btn-modal-miner-view-page"
                  onClick={() => {
                    setShowMinerIneligibleModal(false);
                    onNavigate('cloud-miner');
                  }}
                  className="w-full text-xs text-[#7a8c94] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white py-2 transition-colors cursor-pointer"
                >
                  View Cloud Miner Page &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
