import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Eye, Clock, History, HelpCircle, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import Logo from '../components/Logo';

export default function HomePage({ onNavigate }) {
  const [selectedViewMode, setSelectedViewMode] = useState('all'); // 'core' or 'all'

  // The 7 packages from Bronze to Apex
  const packages = [
    {
      id: 'bronze',
      name: 'Bronze',
      tagline: 'A measured first step',
      entryPrice: '$25.00',
      minWallet: '$1.00',
      rewardRate: '1.8%',
      dailyLimit: '20 views/day',
      accentColor: 'bg-[#d97706]/10 text-[#b45309] border-[#d97706]/30',
      badge: null,
      circleColor: 'bg-[#b45309]',
    },
    {
      id: 'silver',
      name: 'Silver',
      tagline: 'For a stronger rhythm',
      entryPrice: '$75.00',
      minWallet: '$5.00',
      rewardRate: '2.6%',
      dailyLimit: '40 views/day',
      accentColor: 'bg-[#0f766e]/10 text-[#0f766e] border-[#0f766e]/30',
      badge: 'MOST CHOSEN',
      circleColor: 'bg-[#0f766e]',
    },
    {
      id: 'gold',
      name: 'Gold',
      tagline: 'For committed momentum',
      entryPrice: '$150.00',
      minWallet: '$10.00',
      rewardRate: '3.4%',
      dailyLimit: '60 views/day',
      accentColor: 'bg-[#ca8a04]/10 text-[#ca8a04] border-[#ca8a04]/30',
      badge: null,
      circleColor: 'bg-[#ca8a04]',
    },
    {
      id: 'platinum',
      name: 'Platinum',
      tagline: 'Accelerated daily velocity',
      entryPrice: '$300.00',
      minWallet: '$25.00',
      rewardRate: '4.2%',
      dailyLimit: '80 views/day',
      accentColor: 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30',
      badge: null,
      circleColor: 'bg-[#0284c7]',
    },
    {
      id: 'diamond',
      name: 'Diamond',
      tagline: 'Maximum efficiency tier',
      entryPrice: '$500.00',
      minWallet: '$50.00',
      rewardRate: '5.0%',
      dailyLimit: '100 views/day',
      accentColor: 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/30',
      badge: 'POPULAR',
      circleColor: 'bg-[#7c3aed]',
    },
    {
      id: 'master',
      name: 'Master',
      tagline: 'Elite daily multiplier',
      entryPrice: '$1,000.00',
      minWallet: '$100.00',
      rewardRate: '6.0%',
      dailyLimit: '120 views/day',
      accentColor: 'bg-[#db2777]/10 text-[#db2777] border-[#db2777]/30',
      badge: null,
      circleColor: 'bg-[#db2777]',
    },
    {
      id: 'apex',
      name: 'Apex',
      tagline: 'Unbounded reward scale',
      entryPrice: '$2,500.00',
      minWallet: '$250.00',
      rewardRate: '7.5%',
      dailyLimit: '150 views/day',
      accentColor: 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30',
      badge: 'TOP TIER',
      circleColor: 'bg-[#ea580c]',
    },
  ];

  const displayedPackages =
    selectedViewMode === 'core' ? packages.slice(0, 3) : packages;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-left sm:text-center flex flex-col sm:items-center">
          {/* Tagline Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f2f0] border border-[#bce2dc] text-[#0d5963] text-xs sm:text-sm font-semibold mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0d5963] animate-pulse" />
            <span>A clearer way to build daily momentum</span>
          </div>

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
              onClick={() => onNavigate('login')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-md shadow-[#0c5963]/25 transition-all"
            >
              <span>Start with TAEMRY</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-hero-rhythm"
              onClick={() => {
                const el = document.getElementById('packages-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#eae4d8]/80 hover:bg-[#eae4d8] text-[#133c44] font-semibold rounded-2xl text-base transition-all"
            >
              <span>See the rhythm</span>
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

        {/* Floating Preview Card (Matches the video's live wallet demonstration) */}
        <div className="max-w-md mx-auto mt-12 px-2">
          <div className="relative bg-[#ffffff] rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#0c5963]/5 border border-[#e4ded2] overflow-hidden">
            {/* Top decorative gradient shape */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#e6f4f1] rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-semibold text-[#667d81] tracking-wider uppercase mb-3">
              <span className="tracking-widest">TAEMRY / PERSONAL WALLET</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            </div>

            <p className="text-xs text-[#6e8286] mb-1">Available balance</p>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#09353e] tracking-tight mb-5">
              $284<span className="text-2xl sm:text-3xl text-[#0d5963]">.60</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-medium text-[#4f676b]">
                <span>Today's progress</span>
                <span className="font-bold text-[#0d5963]">68%</span>
              </div>
              <div className="w-full bg-[#f1eee7] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0d5963] to-[#10b981] h-full rounded-full transition-all duration-1000"
                  style={{ width: '68%' }}
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
                  <p className="text-xs font-bold text-[#09353e]">Reward credited</p>
                  <p className="text-[11px] text-[#6b7f83]">Keep your rhythm</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#718588] block">LAST REWARD</span>
                <span className="text-xs font-extrabold text-[#0d5963] bg-[#e6f4f1] px-2 py-0.5 rounded-md">
                  +$2.10
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Guide ("SIMPLE BY DESIGN") */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#f4f0e7] border-y border-[#e7e1d5]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-left sm:text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              SIMPLE BY DESIGN
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#09353e] mt-2 mb-3">
              A steady system beats a noisy one.
            </h2>
            <p className="text-sm sm:text-base text-[#50686d] max-w-xl sm:mx-auto">
              Every part of your progress has a place: the wallet, your active package,
              your daily views, and the rewards they create.
            </p>
          </div>

          {/* 3 Steps in Vertical/Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-[#faf8f5] rounded-2xl p-6 border border-[#e5ded1] shadow-xs relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold font-mono text-[#8a9ca0] block mb-4">
                  01
                </span>
                <h3 className="text-xl font-bold text-[#0a353f] mb-2">Fund</h3>
                <p className="text-xs sm:text-sm text-[#50686d] leading-relaxed">
                  Submit a manual deposit and follow its approval status directly in your wallet trail.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#eee8dd] text-[11px] font-semibold text-[#0d5963] flex items-center gap-1">
                <span>Bank, Crypto, Easypaisa, JazzCash</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#faf8f5] rounded-2xl p-6 border border-[#e5ded1] shadow-xs relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#8a9ca0] block mb-4">
                  02
                </span>
                <h3 className="text-xl font-bold text-[#0a353f] mb-2">Choose</h3>
                <p className="text-xs sm:text-sm text-[#50686d] leading-relaxed">
                  Activate one earning package with your wallet balance that matches your target pace.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#eee8dd] text-[11px] font-semibold text-[#0d5963] flex items-center gap-1">
                <span>7 dynamic packages available</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#faf8f5] rounded-2xl p-6 border border-[#e5ded1] shadow-xs relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#8a9ca0] block mb-4">
                  03
                </span>
                <h3 className="text-xl font-bold text-[#0a353f] mb-2">Show up</h3>
                <p className="text-xs sm:text-sm text-[#50686d] leading-relaxed">
                  Complete timed views and see each reward credited instantly to your growing ledger.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#eee8dd] text-[11px] font-semibold text-[#0d5963] flex items-center gap-1">
                <span>Daily rhythm tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Packages Section ("CHOOSE YOUR PACE") */}
      <section id="packages-section" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
                CHOOSE YOUR PACE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#09353e] mt-2">
                Seven packages. Calculated growth.
              </h2>
              <p className="text-sm text-[#556e73] mt-1">
                Start where it makes sense. You can always build into the next level as your wallet grows.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-[#eae4d8] p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setSelectedViewMode('all')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  selectedViewMode === 'all'
                    ? 'bg-[#0c5963] text-white shadow-xs'
                    : 'text-[#50686d] hover:text-[#0c5963]'
                }`}
              >
                All 7 Packages
              </button>
              <button
                onClick={() => setSelectedViewMode('core')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-6 border border-[#e4dfd4] hover:border-[#0c5963]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider text-[#697f83] uppercase">
                      PACKAGE
                    </span>
                    <div className="flex items-center gap-2">
                      {pkg.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4f1] text-[#0d5963] px-2 py-0.5 rounded-full border border-[#bfe3dc]">
                          {pkg.badge}
                        </span>
                      )}
                      <div className={`w-3.5 h-3.5 rounded-full ${pkg.circleColor}`} />
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
                          From
                        </span>
                        <span className="text-xl font-extrabold text-[#09353e]">
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
                      <span>Daily Views</span>
                      <span className="font-semibold text-[#09353e]">{pkg.dailyLimit}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('login')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#faf8f5] hover:bg-[#0c5963] hover:text-white text-[#09353e] border border-[#e0dad0] hover:border-[#0c5963] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Select & Activate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Clarity Section */}
      <section className="py-16 px-4 sm:px-6 bg-[#f4f0e7] border-t border-[#e7e1d5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-left sm:text-center mb-12">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              BUILT FOR CLARITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#09353e] mt-2 mb-3">
              No mystery math. No hidden dashboard corners.
            </h2>
            <p className="text-sm sm:text-base text-[#50686d] max-w-xl sm:mx-auto">
              Everything in TAEMRY FLUX is visible, verifiable, and structured around your daily consistency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-5 bg-[#faf8f5] rounded-2xl border border-[#e4ded2]">
              <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] text-[#0d5963] flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#09353e] mb-1">Daily visibility</h4>
                <p className="text-xs text-[#526b70] leading-relaxed">
                  Know your limit, your completed views, and your earnings at a glance without confusion.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#faf8f5] rounded-2xl border border-[#e4ded2]">
              <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] text-[#0d5963] flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#09353e] mb-1">Request history</h4>
                <p className="text-xs text-[#526b70] leading-relaxed">
                  Deposits keep their status, method, note, and timestamp in one permanent, transparent trail.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#faf8f5] rounded-2xl border border-[#e4ded2]">
              <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] text-[#0d5963] flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#09353e] mb-1">Supportable flow</h4>
                <p className="text-xs text-[#526b70] leading-relaxed">
                  Every action has a clear next step and a record you can easily verify or return to.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#faf8f5] rounded-2xl border border-[#e4ded2]">
              <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] text-[#0d5963] flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#09353e] mb-1">Private by default</h4>
                <p className="text-xs text-[#526b70] leading-relaxed">
                  Your wallet view is yours alone, backed by modern Firebase modular authentication.
                </p>
              </div>
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
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold rounded-2xl text-base shadow-lg shadow-black/20 active:scale-[0.98] transition-all"
          >
            <span>Open your wallet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
