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
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api/client';

export default function HomePage({ onNavigate }) {
  const { currentUser, userStats } = useAuth();
  const [selectedViewMode, setSelectedViewMode] = useState('all'); // 'core' or 'all'
  const [openFaq, setOpenFaq] = useState(null);

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
      q: 'Q3. Why can\'t I withdraw money if I have 0 referrals?',
      a: 'To build an active and genuine community, you must invite at least 1 active direct referral before requesting a withdrawal.'
    },
    {
      q: 'Q4. How does the 5-level referral commission system work?',
      a: 'You earn commissions up to 5 levels deep: Level 1 (20%), Level 2 (10%), Level 3 (5%), Level 4 (3%), and Level 5 (2%). All team milestones count across unlimited depth.'
    },
    {
      q: 'Q5. What are the deposit and withdrawal methods and limits?',
      a: 'Methods: Local Bank Transfer, Easypaisa, JazzCash (1 USD = 300 PKR), and Crypto (USDT/BTC). Minimum withdrawal is $1.00 USD and maximum is $1,000.00 USD per request.'
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
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#d97706]/10 text-[#b45309] border-[#d97706]/30',
      badge: 'STARTER',
      circleColor: 'bg-[#b45309]',
      motivationText: '✨ Empower your financial freedom with guaranteed 25% daily returns upon activation.',
    },
    {
      id: 'silver',
      name: 'Silver',
      tierLabel: 'Silver Tier',
      tagline: 'For accelerated daily revenue momentum',
      entryPrice: '$5.00',
      minWallet: '$0.50',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#0f766e]/10 text-[#0f766e] border-[#0f766e]/30',
      badge: 'POPULAR',
      circleColor: 'bg-[#0f766e]',
      motivationText: '🚀 Build long-term digital wealth with secure, verified daily asset accumulation.',
    },
    {
      id: 'gold',
      name: 'Gold',
      tierLabel: 'Gold Tier',
      tagline: 'For committed momentum with high-velocity returns',
      entryPrice: '$10.00',
      minWallet: '$1.00',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#ca8a04]/10 text-[#ca8a04] border-[#ca8a04]/30',
      badge: 'RECOMMENDED',
      circleColor: 'bg-[#ca8a04]',
      motivationText: '💼 Secure your financial future with maximized cashflow and daily compounding growth.',
    },
    {
      id: 'premium',
      name: 'Premium',
      tierLabel: 'Premium Tier',
      tagline: 'High-velocity professional plan',
      entryPrice: '$50.00',
      minWallet: '$5.00',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'HIGH DEMAND',
      circleColor: 'bg-[#0284c7]',
      motivationText: '🌟 Accelerate your asset portfolio with institutional-grade daily returns.',
    },
    {
      id: 'elite',
      name: 'Elite',
      tierLabel: 'Elite Tier',
      tagline: 'Accelerated daily velocity and high-tier returns',
      entryPrice: '$100.00',
      minWallet: '$10.00',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'HIGH CAPACITY',
      circleColor: 'bg-[#0284c7]',
      motivationText: '⚡ Unlock boundless future opportunities with high-yield automated daily capital.',
    },
    {
      id: 'master',
      name: 'Master',
      tierLabel: 'Master Tier',
      tagline: 'Elite daily multiplier for advanced digital leaders',
      entryPrice: '$500.00',
      minWallet: '$50.00',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#db2777]/10 text-[#db2777] border-[#db2777]/30',
      badge: 'PRO MASTER',
      circleColor: 'bg-[#db2777]',
      motivationText: '👑 Experience top-tier financial scaling and exponential revenue independence.',
    },
    {
      id: 'apex',
      name: 'Apex',
      tierLabel: 'Apex Tier',
      tagline: 'Unbounded reward scale with peak return rate',
      entryPrice: '$1,000.00',
      minWallet: '$100.00',
      rewardRate: '25%',
      dailyLimit: '200 ads/day',
      accentColor: 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30',
      badge: 'APEX MASTER',
      circleColor: 'bg-[#ea580c]',
      motivationText: '🏆 Reach pinnacle financial status with supreme daily capital returns and full power.',
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
              tagline: matchingDefault.tagline || 'Guaranteed 25% daily returns with 200 ads/day allocation.',
              entryPrice: `$${Number(pkg.price || 0).toFixed(2)}`,
              minWallet: `$${Number(pkg.minWallet || 0).toFixed(2)}`,
              rewardRate: '25%',
              dailyLimit: '200 ads/day',
              badge: pkg.badge || matchingDefault.badge || null,
              circleColor: pkg.color ? `bg-[${pkg.color}]` : matchingDefault.circleColor || 'bg-[#0f766e]',
              accentColor: matchingDefault.accentColor || 'bg-[#0f766e]/10 text-[#0f766e]',
              motivationText: matchingDefault.motivationText || '✨ Empower your financial freedom with guaranteed 25% daily returns upon activation.',
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

  const displayedPackages =
    selectedViewMode === 'core' ? packageList.slice(0, 3) : packageList;

  // Handle Primary CTA click
  const handlePrimaryAction = () => {
    if (currentUser) {
      onNavigate('dashboard');
    } else {
      onNavigate('login');
    }
  };

  // Handle Package Selection
  const handleSelectPackage = (pkg) => {
    if (currentUser) {
      onNavigate('dashboard');
    } else {
      onNavigate('login');
    }
  };

  // Compute live card preview values based on user authentication
  const displayBalance = currentUser
    ? Number(userStats?.walletBalance ?? 0).toFixed(2)
    : '0.00';
  const displayProgress = currentUser
    ? Math.min(100, Math.round(((userStats?.dailyAdCount || 0) / 200) * 100))
    : 0;
  const hasBoughtPackage = Boolean(
    currentUser &&
    userStats?.currentPackage &&
    userStats.currentPackage !== 'None' &&
    userStats.isEligible
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Logged In User Live Balance Banner */}
        {currentUser && (
          <div className="w-full max-w-4xl mx-auto mb-8 p-4 sm:p-5 rounded-3xl bg-white border border-[#0c5963]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#697f83] uppercase tracking-wider block">
                  Live Member Status
                </span>
                <span className="text-sm font-bold text-[#09353e]">
                  {currentUser.displayName || currentUser.email} • Package: <strong className="text-[#0c5963] uppercase">{userStats?.currentPackage || 'None'}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0ede6]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#71868a] block">
                  Live Available Balance
                </span>
                <span className="text-2xl font-black text-[#0c5963]">
                  ${Number(userStats?.walletBalance || 0).toFixed(2)} <span className="text-xs font-semibold text-[#546e73]">USD</span>
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
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#0a353f] leading-[1.15] mb-6">
            Put your wallet <br className="hidden sm:block" />
            <span className="text-[#0d5963]">in motion.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#476066] max-w-2xl leading-relaxed mb-8">
            TAEMRY FLUX turns consistent attention into a visible earnings habit.
            Fund your wallet, choose your pace, and earn from the work you can see.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
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
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#eae4d8]/80 hover:bg-[#eae4d8] text-[#133c44] font-semibold rounded-2xl text-base transition-all cursor-pointer"
            >
              <span>See the packages</span>
              <ChevronRight className="w-4 h-4 text-[#597176]" />
            </button>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#486065] pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0c5963]" />
              <span>Transparent 25% Daily Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0c5963]" />
              <span>Secure Session Architecture</span>
            </div>
          </div>
        </div>

        {/* Floating Preview Card */}
        <div className="max-w-md mx-auto mt-12 px-2">
          <div className="relative bg-[#ffffff] rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#0c5963]/5 border border-[#e4ded2] overflow-hidden">
            {/* Top decorative gradient shape */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#e6f4f1] rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] tracking-wider uppercase mb-3">
              <span className="tracking-widest">
                {currentUser ? `MEMBER / ${currentUser.email?.split('@')[0]}` : 'TAEMRY / PERSONAL WALLET'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            </div>

            <p className="text-xs text-[#6e8286] mb-1">
              {currentUser ? 'Your Live Available Balance' : 'Available balance'}
            </p>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#09353e] tracking-tight mb-5">
              ${displayBalance.split('.')[0]}
              <span className="text-2xl sm:text-3xl text-[#0d5963]">
                .{displayBalance.split('.')[1] || '00'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-medium text-[#4f676b]">
                <span>Today's ad rhythm</span>
                <span className="font-bold text-[#0d5963]">{displayProgress}%</span>
              </div>
              <div className="w-full bg-[#f1eee7] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0d5963] to-[#10b981] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>

            {/* Floating Toast / Notification */}
            <div className="bg-[#fcfaf7] border border-[#e5dfd3] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#16a34a]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#09353e]">
                    {currentUser
                      ? (userStats?.currentPackage && userStats?.currentPackage !== 'None'
                          ? 'Active Package: ' + userStats.currentPackage
                          : 'Deposit & Buy Package')
                      : 'Attention to Value'}
                  </p>
                  <p className="text-[11px] text-[#6b7f83]">
                    {currentUser && (!userStats?.currentPackage || userStats?.currentPackage === 'None')
                      ? 'Activate a package to start 200 daily ads'
                      : 'Keep your daily ad rhythm'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#718588] block">DAILY RETURN</span>
                <span className="text-xs font-extrabold text-[#0d5963] bg-[#e6f4f1] px-2 py-0.5 rounded-md">
                  +25%
                </span>
              </div>
            </div>
          </div>
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

            {/* Filter Toggle */}
            <div className="flex items-center bg-[#eae4d8] p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setSelectedViewMode('all')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedViewMode === 'all'
                    ? 'bg-[#0c5963] text-white shadow-xs'
                    : 'text-[#50686d] hover:text-[#0c5963]'
                }`}
              >
                All {packageList.length} Packages
              </button>
              <button
                onClick={() => setSelectedViewMode('core')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedViewMode === 'core'
                    ? 'bg-[#0c5963] text-white shadow-xs'
                    : 'text-[#50686d] hover:text-[#0c5963]'
                }`}
              >
                Starter 3
              </button>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPackages.map((pkg) => {
              const isCurrentActive =
                currentUser &&
                userStats?.currentPackage &&
                userStats.currentPackage.toLowerCase() === pkg.id.toLowerCase();

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
                    <p className="text-xs text-[#637a7f] mb-5">{pkg.tagline}</p>

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
                            25% <span className="text-[10px] font-normal text-[#6f8489]">daily</span>
                          </span>
                        </div>
                      </div>

                      {/* Daily Ads Quota: Shown to users who have bought a package; Hidden for non-buyers with motivation copy */}
                      {hasBoughtPackage ? (
                        <div className="flex items-center justify-between text-xs text-[#065f46] bg-[#ecfdf5] px-3.5 py-2.5 rounded-xl border border-[#a7f3d0]">
                          <span className="font-medium">Daily Ads Quota</span>
                          <span className="font-extrabold">200 ads/day (Unlocked)</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#0c5963] bg-[#fbf8f2] px-3.5 py-2.5 rounded-xl border border-[#ece4d6] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#d97706] shrink-0" />
                          <span className="leading-snug font-medium">
                            {pkg.motivationText || '✨ Empower your financial future with guaranteed 25% daily asset returns upon activation.'}
                          </span>
                        </div>
                      )}
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
                  className="bg-white rounded-2xl border border-[#e4dfd4] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#faf8f4] transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#09353e]">
                      {faq.q}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#f0eae0] text-[#0c5963] flex items-center justify-center shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4d666b] leading-relaxed border-t border-[#f2ede4] bg-[#fcfbfa] whitespace-pre-line">
                      {faq.a}
                    </div>
                  )}
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
