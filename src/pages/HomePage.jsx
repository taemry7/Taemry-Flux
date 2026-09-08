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
      a: 'To build a strong community, you must invite at least 1 active friend (direct referral) before you can withdraw any amount.'
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
      tagline: 'A measured first step',
      entryPrice: '$1.00',
      minWallet: '$0.10',
      rewardRate: '2.0%',
      dailyLimit: '20 views/day',
      accentColor: 'bg-[#d97706]/10 text-[#b45309] border-[#d97706]/30',
      badge: 'STARTER',
      circleColor: 'bg-[#b45309]',
    },
    {
      id: 'silver',
      name: 'Silver',
      tagline: 'For a stronger rhythm',
      entryPrice: '$5.00',
      minWallet: '$0.50',
      rewardRate: '2.5%',
      dailyLimit: '40 views/day',
      accentColor: 'bg-[#0f766e]/10 text-[#0f766e] border-[#0f766e]/30',
      badge: 'MOST CHOSEN',
      circleColor: 'bg-[#0f766e]',
    },
    {
      id: 'gold',
      name: 'Gold',
      tagline: 'For committed momentum',
      entryPrice: '$10.00',
      minWallet: '$1.00',
      rewardRate: '3.0%',
      dailyLimit: '60 views/day',
      accentColor: 'bg-[#ca8a04]/10 text-[#ca8a04] border-[#ca8a04]/30',
      badge: 'RECOMMENDED',
      circleColor: 'bg-[#ca8a04]',
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'High-velocity professional plan',
      entryPrice: '$50.00',
      minWallet: '$5.00',
      rewardRate: '3.8%',
      dailyLimit: '80 views/day',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'POPULAR',
      circleColor: 'bg-[#0284c7]',
    },
    {
      id: 'elite',
      name: 'Elite',
      tagline: 'Accelerated daily velocity',
      entryPrice: '$100.00',
      minWallet: '$10.00',
      rewardRate: '4.5%',
      dailyLimit: '100 views/day',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: 'HIGH CAPACITY',
      circleColor: 'bg-[#0284c7]',
    },
    {
      id: 'master',
      name: 'Master',
      tagline: 'Elite daily multiplier',
      entryPrice: '$500.00',
      minWallet: '$50.00',
      rewardRate: '6.0%',
      dailyLimit: '150 views/day',
      accentColor: 'bg-[#db2777]/10 text-[#db2777] border-[#db2777]/30',
      badge: 'ELITE',
      circleColor: 'bg-[#db2777]',
    },
    {
      id: 'apex',
      name: 'Apex',
      tagline: 'Unbounded reward scale',
      entryPrice: '$1,000.00',
      minWallet: '$100.00',
      rewardRate: '7.5%',
      dailyLimit: '200 views/day',
      accentColor: 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30',
      badge: 'ELITE MASTER',
      circleColor: 'bg-[#ea580c]',
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
            return {
              id: pkg.id,
              name: pkg.name || id.toUpperCase(),
              tagline: pkg.description || matchingDefault.tagline || 'Optimized daily earnings',
              entryPrice: `$${Number(pkg.price || 0).toFixed(2)}`,
              minWallet: `$${Number(pkg.minWallet || 0).toFixed(2)}`,
              rewardRate: pkg.rewardRate || '2.5%',
              dailyLimit: `${pkg.dailyLimit || 20} views/day`,
              badge: pkg.badge || matchingDefault.badge || null,
              circleColor: pkg.color ? `bg-[${pkg.color}]` : matchingDefault.circleColor || 'bg-[#0f766e]',
              accentColor: matchingDefault.accentColor || 'bg-[#0f766e]/10 text-[#0f766e]',
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
    ? Number(userStats?.walletBalance || 0).toFixed(2)
    : '284.60';
  const displayProgress = currentUser
    ? Math.min(100, Math.round(((userStats?.dailyAdCount || 0) / (userStats?.dailyLimit || 20)) * 100))
    : 68;
  const currentActivePackageName = currentUser
    ? (userStats?.currentPackage || 'Bronze')
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
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
              <span>Transparent rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0c5963]" />
              <span>Cookie-secured access</span>
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
                <span>Today's view rhythm</span>
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
                    {currentUser ? 'Active Package: ' + (userStats?.currentPackage || 'Bronze') : 'Reward credited'}
                  </p>
                  <p className="text-[11px] text-[#6b7f83]">Keep your daily rhythm</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#718588] block">DAILY RETURN</span>
                <span className="text-xs font-extrabold text-[#0d5963] bg-[#e6f4f1] px-2 py-0.5 rounded-md">
                  +2.5%
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
                        <span className="text-xs font-semibold text-[#697f83]">
                          Plan #{pkg.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentActive && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            YOUR ACTIVE PLAN
                          </span>
                        )}
                        {pkg.badge && !isCurrentActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4f1] text-[#0d5963] px-2 py-0.5 rounded-full border border-[#bfe3dc]">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[#09353e] mb-1 group-hover:text-[#0c5963] transition-colors">
                      {pkg.name}
                    </h3>
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
                            Reward Rate
                          </span>
                          <span className="text-sm font-bold text-[#0d5963]">
                            {pkg.rewardRate} <span className="text-[10px] font-normal text-[#6f8489]">/ view</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#526a6f] bg-[#faf8f5] px-3 py-2 rounded-xl border border-[#efe9de]">
                        <span>Daily View Quota</span>
                        <span className="font-semibold text-[#09353e]">{pkg.dailyLimit}</span>
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
                        ? 'Manage Active Plan'
                        : currentUser
                        ? 'Activate with Wallet'
                        : 'Select & Activate'}
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
                Our support desk is operational. Open a ticket anytime and track admin replies directly.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('support')}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#0c5963] text-[#09353e] hover:text-white font-semibold text-xs border border-[#ddd5c7] hover:border-[#0c5963] transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <span>Open Support Desk</span>
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
