/**
 * TAEMRY FLUX - Buy Package Component (Phase 2)
 * Fetches package options, displays cards in grid, and coordinates package purchase flow.
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Wallet, 
  TrendingUp,
  X,
  Loader2
} from 'lucide-react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';

export default function BuyPackage({ walletBalance = 0, currentPackage = 'None', onPackageBought, onSelectTab }) {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Default fallback catalog if network is slow or offline
  const fallbackPackages = [
    {
      id: 'bronze',
      name: 'PACKAGE',
      tierName: 'Bronze',
      price: 1.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: null,
      color: '#b45309',
      description: 'The starter tier ($1.00) generating guaranteed 20% daily returns.',
      motivationText: '✨ Start your journey to consistent daily cashflow with guaranteed 20% returns upon activation.',
    },
    {
      id: 'silver',
      name: 'PACKAGE',
      tierName: 'Silver',
      price: 5.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'POPULAR',
      color: '#0f766e',
      description: 'Accelerated revenue pace with guaranteed 20% daily returns.',
      motivationText: '🚀 Step up your capital accumulation with verified daily asset compounding.',
    },
    {
      id: 'gold',
      name: 'PACKAGE',
      tierName: 'Gold',
      price: 10.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'RECOMMENDED',
      color: '#ca8a04',
      description: 'High-yield momentum tier with guaranteed 20% daily returns.',
      motivationText: '💼 Accelerate your financial future with maximum daily asset growth and momentum.',
    },
    {
      id: 'premium',
      name: 'PACKAGE',
      tierName: 'Premium',
      price: 50.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'HIGH DEMAND',
      color: '#0284c7',
      description: 'Substantial daily earnings yield with 20% daily returns upon activation.',
      motivationText: '🌟 Optimize your earnings portfolio with accelerated automated returns.',
    },
    {
      id: 'elite',
      name: 'PACKAGE',
      tierName: 'Elite',
      price: 100.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'HIGH CAPACITY',
      color: '#7c3aed',
      description: 'Accelerated volume capacity yielding 20% guaranteed daily returns.',
      motivationText: '⚡ Unlock high-tier digital income with boundless daily earning power.',
    },
    {
      id: 'master',
      name: 'PACKAGE',
      tierName: 'Master',
      price: 500.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'PRO TIER',
      color: '#db2777',
      description: 'Elite return multiplier delivering 20% guaranteed daily returns.',
      motivationText: '👑 Experience top-tier financial scaling and exponential revenue independence.',
    },
    {
      id: 'apex',
      name: 'PACKAGE',
      tierName: 'Apex',
      price: 1000.00,
      rewardRate: '20%',
      dailyLimit: 200,
      badge: 'Apex Master',
      color: '#ea580c',
      description: 'Peak performance tier generating 20% guaranteed daily returns.',
      motivationText: '🏆 Reach pinnacle financial status with supreme daily capital returns and full power.',
    },
  ];

  // Fetch package catalog from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadPackages() {
      try {
        setLoadingPackages(true);
        const res = await apiClient.get('/packages');
        if (isMounted && res.data?.packages?.length > 0) {
          const sanitized = res.data.packages
            .filter((pkg) => pkg.isActive !== false)
            .map((pkg) => {
              const fallback = fallbackPackages.find((f) => f.id === pkg.id) || {};
              const resolvedTierName =
                pkg.tierName ||
                (pkg.name && pkg.name !== 'PACKAGE' ? pkg.name : null) ||
                fallback.tierName ||
                (pkg.id ? pkg.id.charAt(0).toUpperCase() + pkg.id.slice(1) : 'Package');
              return {
                ...fallback,
                ...pkg,
                id: pkg.id || fallback.id,
                tierName: resolvedTierName,
                name: resolvedTierName,
                price: Number(pkg.price !== undefined ? pkg.price : fallback.price || 0),
                dailyLimit: Number(pkg.dailyLimit !== undefined ? pkg.dailyLimit : fallback.dailyLimit || 200),
                rewardRate: pkg.rewardRate || fallback.rewardRate || '20%',
                badge: (pkg.id === 'apex' || fallback.id === 'apex') ? 'Apex Master' : (pkg.badge !== undefined ? pkg.badge : fallback.badge),
                color: pkg.color || fallback.color || '#0284c7',
                description: pkg.description || fallback.description || 'Active contract tier with guaranteed daily returns upon activation.',
                motivationText: pkg.motivationText || fallback.motivationText || '✨ Build your digital earnings foundation with consistent daily rewards.',
              };
            });
          setPackages(sanitized);
        } else if (isMounted) {
          setPackages(fallbackPackages);
        }
      } catch (err) {
        console.warn('Using fallback package catalog:', err.message);
        if (isMounted) setPackages(fallbackPackages);
      } finally {
        if (isMounted) setLoadingPackages(false);
      }
    }

    loadPackages();
    return () => { isMounted = false; };
  }, []);

  // Auto-focus and open modal if user selected a specific package from Homepage
  useEffect(() => {
    if (!loadingPackages && packages.length > 0) {
      try {
        const storedPkgId = localStorage.getItem('taemry_selected_package');
        if (storedPkgId) {
          localStorage.removeItem('taemry_selected_package');
          const target = packages.find(
            (p) =>
              p.id?.toLowerCase() === storedPkgId.toLowerCase() ||
              p.name?.toLowerCase() === storedPkgId.toLowerCase() ||
              p.tierName?.toLowerCase() === storedPkgId.toLowerCase()
          );
          if (target) {
            setSelectedPkg(target);
            setIsModalOpen(true);
            setTimeout(() => {
              const el = document.getElementById(`package-card-${target.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 150);
          }
        }
      } catch (err) {
        console.warn('Error reading selected package:', err);
      }
    }
  }, [loadingPackages, packages]);

  // Open confirmation modal
  const handleInitiateBuy = (pkg) => {
    setSelectedPkg(pkg);
    setIsModalOpen(true);
    setNotification({ type: '', message: '' });
  };

  // Confirm and execute purchase
  const handleConfirmPurchase = async () => {
    if (!selectedPkg) return;

    // Client-side quick check
    if (walletBalance < selectedPkg.price) {
      setNotification({
        type: 'error',
        message: `Insufficient wallet balance ($${walletBalance.toFixed(2)}). You need $${Number(selectedPkg.price).toFixed(2)} to buy ${selectedPkg.name}.`
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await apiClient.post('/packages/buy', {
        packageId: selectedPkg.id,
      });

      const data = response.data;
      setIsModalOpen(false);
      
      // Notify parent Dashboard to update live wallet and active package
      if (onPackageBought) {
        onPackageBought({
          walletBalance: data.walletBalance,
          currentPackage: data.currentPackage || selectedPkg.name,
        });
      }

      const successMsg = `Package bought successfully! You are now on the ${selectedPkg.name} tier.`;
      toast.success(successMsg);
      setNotification({
        type: 'success',
        message: successMsg,
      });

      // Clear toast after 5 seconds
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 5000);
    } catch (err) {
      console.error('Purchase failed:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Purchase transaction could not be processed.';
      toast.error(errMsg);
      setNotification({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const displayList = packages.length > 0 ? packages : fallbackPackages;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification.message && (
        <div 
          className={`p-4 rounded-2xl flex items-center justify-between shadow-md text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-[#0c5963] text-white'
              : 'bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#ef4444]" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification({ type: '', message: '' })}
            className="p-1 text-current opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
            EARNING PACKAGES
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
            Choose your pace
          </h1>
          <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
            Activating a package configures your reward rate and unlocks your daily view limit.
          </p>
        </div>

        {/* Current Balance Pill */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 sm:py-2.5 border border-[#e4ded2] shadow-xs flex items-center gap-3 self-start sm:self-auto">
          <div className="w-9 h-9 rounded-xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#74898e] tracking-wider block">
              Wallet Balance
            </span>
            <span className="text-base font-extrabold text-[#09353e]">
              ${Number(walletBalance).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayList.map((pkg, idx) => {
          const isCurrent = currentPackage && currentPackage !== 'None' && (
            currentPackage.toLowerCase() === pkg.id?.toLowerCase() ||
            currentPackage.toLowerCase() === pkg.tierName?.toLowerCase() ||
            currentPackage.toLowerCase() === pkg.name?.toLowerCase()
          );
          const userHasPackage = currentPackage && currentPackage !== 'None';
          const canAfford = walletBalance >= pkg.price;

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
              id={`package-card-${pkg.id}`}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-xs ${
                isCurrent
                  ? 'border-[#0c5963] ring-2 ring-[#0c5963]/20 bg-[#fbfdfc]'
                  : 'border-[#e4dfd4] hover:border-[#b8ced2]'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#0c5963] uppercase">
                    PACKAGE
                  </span>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4f1] text-[#0c5963] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
                        Active
                      </span>
                    )}
                    {pkg.badge && !isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#fef3c7] text-[#92400e] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
                        {(pkg.id === 'apex' || pkg.tierName?.toLowerCase() === 'apex') ? 'Apex Master' : pkg.badge}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[#09353e] mb-0.5">
                  {pkg.tierName || (pkg.name && pkg.name !== 'PACKAGE' ? pkg.name : (pkg.id ? pkg.id.charAt(0).toUpperCase() + pkg.id.slice(1) : 'Package'))}
                </h3>
                <p className="hidden text-xs font-semibold text-[#0c5963] mb-1">
                  {pkg.tierName || `${pkg.id?.toUpperCase()} Tier`} (${Number(pkg.price).toFixed(2)})
                </p>
                <p className="text-xs text-[#0c5963] font-medium mb-5 min-h-[36px] flex items-start gap-1.5 leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706] shrink-0 mt-0.5" />
                  <span>{pkg.motivationText || '✨ Build your digital earnings foundation with consistent daily rewards.'}</span>
                </p>

                {/* Pricing and Stats */}
                <div className="pt-4 border-t border-[#f4f0e7] space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-[#788e93] block uppercase font-medium">
                        Package Price
                      </span>
                      <span className="text-2xl font-extrabold text-[#09353e]">
                        ${Number(pkg.price).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#788e93] block uppercase font-medium">
                        Daily Return
                      </span>
                      <span className="text-sm font-bold text-[#0c5963]">
                        {pkg.rewardRate || '20%'} Daily
                      </span>
                    </div>
                  </div>

                  {/* Team Rewards & Team Ads information (matching first page) */}
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

              {/* Action Button */}
              <div className="mt-6 pt-2">
                {isCurrent ? (
                  <div className="w-full py-2.5 px-4 bg-[#e6f4f1] text-[#0c5963] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-[#b8dfd7]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Currently Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleInitiateBuy(pkg)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      canAfford
                        ? 'bg-[#0c5963] hover:bg-[#09424a] text-white shadow-xs'
                        : 'bg-[#faf8f5] hover:bg-[#f1ede4] text-[#09353e] border border-[#d8d1c3]'
                    }`}
                  >
                    <span>{canAfford ? `Buy PACKAGE` : `Buy for $${Number(pkg.price).toFixed(2)}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmationModal
        isOpen={isModalOpen && Boolean(selectedPkg)}
        onClose={() => setIsModalOpen(false)}
        packageData={selectedPkg}
        walletBalance={walletBalance}
        onConfirm={handleConfirmPurchase}
        isPurchasing={isPurchasing}
        onSelectTab={onSelectTab}
      />
    </div>
  );
}
