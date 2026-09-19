/**
 * TAEMRY FLUX - Watch Ads Module (Phase 4 Streamlined Update)
 * - Clean 1 to 20 Ads Directory with individual watch action buttons
 * - Direct watch reward claiming with instant credit and celebratory toast
 * - 20 daily ads allocation (0.2% package reward per ad)
 */

import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Check,
  PackageCheck,
  AlertCircle,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SponsorAdModal from '../components/SponsorAdModal';
import GoogleAdSense from '../components/GoogleAdSense';
import { MONETAG_ADS, getMonetagAdForNumber } from '../config/monetagAds';

const WATCH_ADS_PACKAGES = [
  {
    id: 'bronze',
    name: 'Bronze',
    tierName: 'Bronze',
    price: 1.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'STARTER',
    circleColor: 'bg-[#b45309]',
    color: '#b45309',
    description: 'Entry-level advertising contract with guaranteed daily returns.',
    motivationText: '✨ Start your daily cashflow momentum with just $1.00 USD and build steady growth.',
  },
  {
    id: 'silver',
    name: 'Silver',
    tierName: 'Silver',
    price: 5.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'POPULAR',
    circleColor: 'bg-[#0f766e]',
    color: '#0f766e',
    description: 'Accelerated revenue pace with guaranteed daily returns.',
    motivationText: '🚀 Step up your capital accumulation with verified daily asset compounding.',
  },
  {
    id: 'gold',
    name: 'Gold',
    tierName: 'Gold',
    price: 10.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'RECOMMENDED',
    circleColor: 'bg-[#ca8a04]',
    color: '#ca8a04',
    description: 'High-yield momentum tier with guaranteed daily returns.',
    motivationText: '💼 Accelerate your financial future with maximum daily asset growth and momentum.',
  },
  {
    id: 'premium',
    name: 'Premium',
    tierName: 'Premium',
    price: 50.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'HIGH DEMAND',
    circleColor: 'bg-[#0284c7]',
    color: '#0284c7',
    description: 'Substantial daily earnings yield with daily returns upon activation.',
    motivationText: '🌟 Optimize your earnings portfolio with accelerated automated returns.',
  },
  {
    id: 'elite',
    name: 'Elite',
    tierName: 'Elite',
    price: 100.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'HIGH CAPACITY',
    circleColor: 'bg-[#7c3aed]',
    color: '#7c3aed',
    description: 'Accelerated volume capacity yielding guaranteed daily returns.',
    motivationText: '💎 Unlock elite compounding speed with institutional-grade daily returns.',
  },
  {
    id: 'master',
    name: 'Master',
    tierName: 'Master',
    price: 500.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'MASTER VIP',
    circleColor: 'bg-[#db2777]',
    color: '#db2777',
    description: 'Executive revenue tier with maximum ad value and team rewards.',
    motivationText: '👑 Establish high-capital independence with maximum daily ad allocation.',
  },
  {
    id: 'apex',
    name: 'Apex',
    tierName: 'Apex',
    price: 1000.00,
    rewardRate: 'Guaranteed Returns',
    dailyLimit: 20,
    badge: 'APEX MASTER',
    circleColor: 'bg-[#dc2626]',
    color: '#dc2626',
    description: 'The pinnacle tier for maximum daily yield and network leadership.',
    motivationText: '⚡ The absolute pinnacle of earning capability with unmatched return potential.',
  },
];

const PACKAGE_PRICES = {
  bronze: 1.00,
  silver: 5.00,
  gold: 10.00,
  premium: 50.00,
  elite: 100.00,
  master: 500.00,
  apex: 1000.00,
};

const VERIFIED_SPONSORS = [
  { name: 'Sponsored Push & Display', category: 'Cloud & Digital Services' },
  { name: 'Native Recommendation', category: 'Tech Innovations & AI' },
  { name: 'Global Media & Display', category: 'Global Web Solutions' },
  { name: 'Verified Partner Portal', category: 'Featured Sponsor Portal' },
  { name: 'Financial Analytics Hub', category: 'Financial Analytics' },
  { name: 'Cybersecurity Network', category: 'Cybersecurity & Infrastructure' },
  { name: 'Digital Marketplace', category: 'E-Commerce & Digital Marketplace' },
  { name: 'Mobile Utilities Cloud', category: 'Mobile Utilities & Apps' },
  { name: 'Decentralized Networks', category: 'Decentralized Networks' },
  { name: 'Smart Web Systems', category: 'Smart Web Systems' },
];

export default function WatchAds({ onSelectTab, onNavigate }) {
  const { userStats, updateLocalStats, fetchUserStats } = useAuth();

  const hasActivePkg = Boolean(userStats?.currentPackage && userStats?.currentPackage !== 'None');
  const pkgKey = (userStats?.currentPackage || 'None').toLowerCase();
  const pkgPrice = PACKAGE_PRICES[pkgKey] || 0.00;
  // 0.2% reward per ad (pkgPrice * 0.2 / 100 = pkgPrice * 0.002)
  const computedReward = hasActivePkg ? +(pkgPrice * 0.002).toFixed(4) : 0;

  // Component state
  const [adStatus, setAdStatus] = useState({
    isEligible: Boolean(userStats?.isEligible && hasActivePkg),
    currentPackage: userStats?.currentPackage || 'None',
    packagePrice: pkgPrice,
    rewardPerAd: computedReward,
    dailyAdCount: userStats?.dailyAdCount ?? 0,
    dailyLimit: 20,
    lifetimeAds: userStats?.lifetimeAds ?? 0,
  });

  const [recentReward, setRecentReward] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [adsCatalog, setAdsCatalog] = useState([]);
  const [watchingAdNum, setWatchingAdNum] = useState(null);

  // Sponsor Ad Player Modal State
  const [activeModalAd, setActiveModalAd] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Generate 1 to N Ads mapped to the 13 official Monetag partner units rotation
  const generate20Ads = (watchedCount, rewardRate, limit = 20) => {
    const list = [];
    const totalCount = limit || 20;
    for (let i = 1; i <= totalCount; i++) {
      const monetagUnit = getMonetagAdForNumber(i);
      const isCompleted = i <= watchedCount;
      const isAvailable = i === watchedCount + 1;

      list.push({
        adNumber: i,
        id: `ad_${i}`,
        title: monetagUnit.name,
        sponsor: monetagUnit.shortName,
        category: monetagUnit.category,
        badge: monetagUnit.badge,
        adConfig: monetagUnit,
        reward: rewardRate,
        isWatched: isCompleted,
        isAvailable,
      });
    }
    return list;
  };

  // Fetch initial ad status from backend
  const fetchAdStatus = async () => {
    try {
      const res = await apiClient.get('/ads/status');
      if (res.data?.success) {
        setAdStatus(res.data);
        const watched = res.data.dailyAdCount || 0;
        const limit = res.data.dailyLimit || 20;
        setAdsCatalog(generate20Ads(watched, res.data.rewardPerAd || computedReward, limit));
      } else {
        const fallbackCount = userStats?.dailyAdCount || 0;
        setAdsCatalog(generate20Ads(fallbackCount, computedReward, 20));
      }
    } catch (err) {
      console.error('Error fetching ad status:', err);
      const fallbackCount = userStats?.dailyAdCount || 0;
      setAdsCatalog(generate20Ads(fallbackCount, computedReward, 20));
    }
  };

  useEffect(() => {
    fetchAdStatus();
  }, []);

  // Open Sponsor Ad Player modal to watch ad before reward claim
  const handleOpenAdModal = (ad) => {
    const limit = adStatus.dailyLimit || 20;
    if (adStatus.dailyAdCount >= limit) {
      setErrorMessage(`Daily limit reached (${limit}/${limit}). Resets tomorrow.`);
      return;
    }
    if (!hasActivePkg || !adStatus.isEligible) {
      setErrorMessage('Please activate an advertising package first to unlock watching ads.');
      return;
    }

    setErrorMessage('');
    setActiveModalAd(ad);
    setIsModalOpen(true);
  };

  // Submit ad watch reward to server after user finishes watching ad
  const handleClaimReward = async (adNumber) => {
    const limit = adStatus.dailyLimit || 20;
    if (adStatus.dailyAdCount >= limit) {
      setErrorMessage(`Daily limit reached (${limit}/${limit}). Resets tomorrow.`);
      setIsModalOpen(false);
      return;
    }

    try {
      setIsClaiming(true);
      setWatchingAdNum(adNumber);
      setErrorMessage('');

      // Submit ad watch reward to server
      const res = await apiClient.post('/ads/watch', {
        adId: `ad_${adNumber}_${Date.now()}`,
      });

      if (res.data?.success) {
        const rewardAmount = res.data.reward;
        const newBalance = res.data.newBalance;
        const newLifetimeAds = res.data.lifetimeAds;
        const newDailyCount = res.data.dailyAdCount;

        // Close ad modal
        setIsModalOpen(false);
        setActiveModalAd(null);

        // Show celebratory confirmation
        setRecentReward({
          amount: rewardAmount,
          lifetimeAds: newLifetimeAds,
          dailyCount: newDailyCount,
          adNumber,
        });

        try {
          localStorage.setItem('taemry_last_ad_reward', String(rewardAmount));
        } catch {}

        // Update local stats in AuthContext
        updateLocalStats({
          walletBalance: newBalance,
          lifetimeAds: newLifetimeAds,
          dailyAdCount: newDailyCount,
        });

        // Update ad status & catalog state
        setAdStatus((prev) => ({
          ...prev,
          dailyAdCount: newDailyCount,
          lifetimeAds: newLifetimeAds,
        }));

        const lim = adStatus.dailyLimit || 20;
        setAdsCatalog(generate20Ads(newDailyCount, adStatus.rewardPerAd || computedReward, lim));

        // Background refetch user stats
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error completing ad view:', err);
      const errorMsg = err.response?.data?.message || 'Failed to claim ad reward. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsClaiming(false);
      setWatchingAdNum(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* INELIGIBILITY BANNER FOR NEW USERS WITHOUT PACKAGE */}
      {(!hasActivePkg || !adStatus.isEligible) && (
        <div className="p-5 rounded-3xl bg-[#fffbeb] border border-[#fde68a] text-[#92400e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#78350f]">
                Package Activation Required
              </h3>
              <p className="text-xs text-[#92400e] mt-0.5">
                New accounts are only eligible for deposit and buying a package. Once you activate a package, 20 daily ads and guaranteed daily returns will be unlocked immediately!
              </p>
            </div>
          </div>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('buy-package')}
              className="px-4 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buy a Package</span>
            </button>
          )}
        </div>
      )}

      {/* ERROR TOAST */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUCCESS CELEBRATORY BANNER */}
      {recentReward && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10b981] text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#064e3b]">
                Ad #{recentReward.adNumber} Completed! +${Number(recentReward.amount).toFixed(4)} USD Credited
              </h3>
              <p className="text-xs text-[#047857]">
                Progress: <strong>{recentReward.dailyCount} of 20</strong> completed today. Ready for Ad #{Math.min(20, recentReward.dailyCount + 1)}!
              </p>
            </div>
          </div>
          <button
            onClick={() => setRecentReward(null)}
            className="text-xs font-bold text-[#065f46] underline self-end sm:self-auto cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP GOOGLE ADSENSE SPONSOR BANNER */}
      <GoogleAdSense label="Sponsored Network" format="auto" className="my-3" />

      {/* 20 ADS LISTING CATALOG */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f0ebe0] pb-4 gap-2">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-[#0c5963]" />
            <h2 className="text-lg sm:text-xl font-black text-[#09353e]">
              Daily Ad Directory (1 to 20)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-1 rounded-full border border-[#b8dfd7] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Sponsor Network</span>
            </span>
            <div className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-3 py-1 rounded-full border border-[#b8dfd7]">
              {adStatus.dailyAdCount} / {adStatus.dailyLimit || 20} Completed
            </div>
          </div>
        </div>

        {/* 20 Ads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {adsCatalog.map((ad) => {
            const isCompleted = ad.isWatched;
            const isNext = ad.adNumber === adStatus.dailyAdCount + 1;
            const isBusy = watchingAdNum === ad.adNumber;

            return (
              <div
                key={ad.id}
                className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-2.5 ${
                  isCompleted
                    ? 'border-[#dcfce7] bg-[#f0fdf4]/60 hover:bg-[#f0fdf4]'
                    : isNext
                    ? 'border-[#0c5963] bg-[#0c5963]/5 ring-2 ring-[#0c5963]/20 shadow-xs'
                    : 'border-[#e4ded2] bg-[#faf8f5] hover:border-[#0c5963]/40 hover:bg-white'
                }`}
              >
                {/* Header row with Ad Number & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#09353e]">
                    Ad #{ad.adNumber}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      Done
                    </span>
                  ) : isNext ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded-full animate-pulse">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#718589] uppercase">
                      Queued
                    </span>
                  )}
                </div>

                {/* Title & Tag */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#09353e] truncate">
                      {ad.sponsor}
                    </p>
                    {ad.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#0c5963]/10 text-[#0c5963] shrink-0">
                        {ad.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#718589] font-medium block truncate mt-0.5">
                    {ad.category}
                  </span>
                </div>

                {/* Reward & Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#f0ebe0]">
                  <span className="text-xs font-black text-[#0c5963]">
                    +${Number(ad.reward).toFixed(4)}
                  </span>

                  <button
                    type="button"
                    disabled={isCompleted || isBusy || adStatus.dailyAdCount >= (adStatus.dailyLimit || 20)}
                    onClick={() => handleOpenAdModal(ad)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      isCompleted
                        ? 'text-[#15803d] bg-[#dcfce7] cursor-default'
                        : isBusy
                        ? 'bg-[#ca8a04] text-white cursor-wait'
                        : isNext
                        ? 'bg-[#0c5963] hover:bg-[#08424b] text-white shadow-xs'
                        : 'bg-white border border-[#d8d1c3] text-[#526d72] hover:bg-[#faf8f5]'
                    }`}
                  >
                    {isCompleted ? (
                      'Watched'
                    ) : isBusy ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Watching...</span>
                      </>
                    ) : (
                      'Watch Now'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM GOOGLE ADSENSE SPONSOR BANNER */}
      <GoogleAdSense label="Sponsored Network" format="auto" className="mt-4" />

      {/* SPONSOR AD VIEWER & REWARD CLAIM MODAL */}
      <SponsorAdModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveModalAd(null);
        }}
        ad={activeModalAd}
        adConfig={activeModalAd?.adConfig}
        rewardAmount={adStatus.rewardPerAd || computedReward}
        onClaimReward={handleClaimReward}
        isClaiming={isClaiming}
        totalAdsLimit={adStatus.dailyLimit || 20}
      />
    </div>
  );
}

