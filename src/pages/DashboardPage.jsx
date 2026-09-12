/**
 * TAEMRY FLUX - User Dashboard Page (Phase 2)
 * Features a dedicated Sidebar Layout, live stats from GET /api/dashboard/stats,
 * 4 metric cards, milestone progress tracking, and package purchasing.
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlaySquare, 
  ArrowDownToLine, 
  Users, 
  Trophy,
  Wallet, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowDownCircle,
  ArrowUpRight,
  History,
  Coins,
  Settings,
  Gift,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import BuyPackage from './BuyPackage';
import WatchAds from './WatchAds';
import Referrals from './Referrals';
import Milestones from './Milestones';
import DepositPage from './DepositPage';
import WithdrawPage from './WithdrawPage';
import TransactionHistory from './TransactionHistory';
import AccountSettings from './AccountSettings';

function IneligibleGate({ featureName, onSelectTab }) {
  return (
    <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-8 sm:p-10 border border-[#e4ded2] dark:border-[#173740] text-center max-w-xl mx-auto my-8 shadow-xs">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fee2e2] dark:bg-[#7f1d1d]/30 text-[#dc2626] dark:text-[#f87171] flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee2e2] dark:bg-[#7f1d1d]/40 text-[#dc2626] dark:text-[#f87171] text-xs font-bold mb-3 uppercase tracking-wider">
        <span>Ineligible</span>
        <span>•</span>
        <span>Package Required</span>
      </div>

      <h3 className="text-2xl font-bold text-[#09353e] dark:text-white mb-2">
        {featureName} is Currently Ineligible
      </h3>

      <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mb-6 leading-relaxed">
        As a new member, your account is currently <strong>Ineligible</strong> for this feature.
        Only <strong>Deposit</strong> and <strong>Package</strong> sections are active. To unlock {featureName}, daily ad returns (20%), referral commissions, and withdrawals, please activate an earning package.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onSelectTab('buy-package')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Buy Package to Become Eligible</span>
        </button>
        <button
          onClick={() => onSelectTab('deposit')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#122e37] text-[#09353e] dark:text-white border border-[#d8d1c3] dark:border-[#1e4854] text-xs sm:text-sm font-bold rounded-xl hover:bg-[#f8f5ee] transition-all cursor-pointer"
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Deposit Funds</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage({
  activeTab: propActiveTab = 'overview',
  onSelectTab = (_tab) => {},
  onNavigate = (_page, _tab) => {}
}) {
  const { currentUser, userStats, updateLocalStats, fetchUserStats } = useAuth();

  const validTabs = [
    'overview',
    'watch-ads',
    'deposit',
    'buy-package',
    'withdraw',
    'referrals',
    'milestones',
    'transactions',
    'settings',
  ];

  const sanitizeTab = (tab) => {
    if (!tab) return 'overview';
    if (tab === 'packages') return 'buy-package';
    return validTabs.includes(tab) ? tab : 'overview';
  };

  // Internal tab state ('overview' | 'watch-ads' | 'referrals' | 'milestones' | 'buy-package' | 'withdraw' | 'deposit' | 'transactions' | 'settings')
  const [activeTab, setActiveTab] = useState(() => sanitizeTab(propActiveTab));

  // Live dashboard statistics loaded from GET /api/dashboard/stats
  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taemry_cached_user_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          walletBalance: parsed.walletBalance !== undefined ? Number(parsed.walletBalance) : 0,
          currentPackage: parsed.currentPackage || 'None',
          lifetimeAds: Number(parsed.lifetimeAds || 0),
          teamAdsCount: Number(parsed.teamAdsCount || 0),
          referralCount: Number(parsed.referralCount || 0),
          totalEarned: Number(parsed.totalEarned || 0),
          milestone: {
            current: Number(parsed.lifetimeAds || 0),
            target: 500,
            percentage: 0,
            adsRemaining: 500,
          },
        };
      }
    } catch {}
    return {
      walletBalance: userStats?.walletBalance !== undefined ? Number(userStats.walletBalance) : 0,
      currentPackage: userStats?.currentPackage || 'None',
      lifetimeAds: userStats?.lifetimeAds !== undefined ? Number(userStats.lifetimeAds) : 0,
      teamAdsCount: userStats?.teamAdsCount !== undefined ? Number(userStats.teamAdsCount) : 0,
      referralCount: userStats?.referralCount !== undefined ? Number(userStats.referralCount) : 0,
      totalEarned: userStats?.totalEarned !== undefined ? Number(userStats.totalEarned) : 0,
      milestone: {
        current: userStats?.lifetimeAds ?? 0,
        target: 500,
        percentage: 0,
        adsRemaining: 500,
      },
    };
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync when propActiveTab changes
  useEffect(() => {
    setActiveTab(sanitizeTab(propActiveTab));
  }, [propActiveTab]);

  // Continuously synchronize stats whenever AuthContext userStats updates
  useEffect(() => {
    if (userStats && typeof userStats === 'object') {
      setStats((prev) => ({
        ...prev,
        ...userStats,
        walletBalance: userStats.walletBalance !== undefined ? Number(userStats.walletBalance) : prev.walletBalance,
        currentPackage: userStats.currentPackage || prev.currentPackage,
      }));
    }
  }, [userStats]);

  // Re-fetch dashboard stats when currentUser is restored or changes
  useEffect(() => {
    if (currentUser) {
      setRefreshKey((k) => k + 1);
    }
  }, [currentUser]);

  const handleTabChange = (tabId) => {
    const sanitized = sanitizeTab(tabId);
    setActiveTab(sanitized);
    if (onSelectTab) {
      onSelectTab(sanitized);
    }
  };

  // Fetch Dashboard Stats from Backend API (GET /api/dashboard/stats)
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardStats() {
      try {
        setLoadingStats(true);
        setStatsError('');
        const res = await apiClient.get('/dashboard/stats');
        
        if (isMounted && res.data?.stats) {
          setStats(res.data.stats);
          if (typeof updateLocalStats === 'function') {
            updateLocalStats(res.data.stats);
          }
          try {
            localStorage.setItem('taemry_cached_user_stats', JSON.stringify(res.data.stats));
          } catch {}
        }
      } catch (err) {
        console.warn('Could not fetch live dashboard stats, using initial data:', err.message);
        if (isMounted) {
          setStatsError(err.response?.data?.message || 'Using cached dashboard data.');
        }
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }

    fetchDashboardStats();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Callback when a package is bought in BuyPackage component
  const handlePackageBought = (updatedData) => {
    setStats((prev) => ({
      ...prev,
      walletBalance: updatedData.walletBalance !== undefined ? updatedData.walletBalance : prev.walletBalance,
      currentPackage: updatedData.currentPackage || prev.currentPackage,
    }));
    // Re-fetch backend stats to ensure complete synchronization
    setRefreshKey((k) => k + 1);
  };

  // Check if user has an active package (new users without package do not see Watch Ads or Withdrawal)
  const hasActivePackage = Boolean(stats.currentPackage && stats.currentPackage !== 'None');

  const currentActiveTab = sanitizeTab(activeTab);

  const rawDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Member';
  const userFirstName = rawDisplayName.trim().split(' ')[0];
  const userName = rawDisplayName;
  const userEmail = currentUser?.email || 'member@taemryflux.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* MAIN VIEW CONTENT AREA (Full Width) */}
      <section className="w-full">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW (/dashboard)                                             */}
        {/* ========================================================================= */}
        {currentActiveTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] dark:text-[#f1f5f9]">
                  Welcome Back, {userFirstName}
                </h1>
                <p className="text-xs sm:text-sm text-[#546b70] dark:text-[#94a3b8] mt-1">
                  Real-time protected balance, verified earnings, and instant fund management.
                </p>
              </div>

                {/* Quick Action Buttons (Normal, clean styling - No 3D) */}
                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                  <button
                    id="btn-overview-deposit"
                    onClick={() => handleTabChange('deposit')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c5963] hover:bg-[#094750] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>

                  {hasActivePackage && (
                    <button
                      id="btn-overview-withdraw"
                      onClick={() => handleTabChange('withdraw')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0c222a] hover:bg-[#f3eee4] dark:hover:bg-[#12313c] text-[#09353e] dark:text-white text-xs font-bold rounded-xl border border-[#d8d1c3] dark:border-[#1e4854] transition-colors cursor-pointer shadow-xs"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
                      <span>Quick Withdraw</span>
                    </button>
                  )}

                  <button
                    id="btn-overview-buy-package"
                    onClick={() => handleTabChange('buy-package')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fef9c3] dark:bg-[#232918] hover:bg-[#fef08a] dark:hover:bg-[#2c341f] text-[#854d0e] dark:text-[#fde047] text-xs font-bold rounded-xl border border-[#fef08a] dark:border-[#3f4a27] transition-colors cursor-pointer shadow-xs"
                  >
                    <Package className="w-3.5 h-3.5 text-[#854d0e] dark:text-[#fde047]" />
                    <span>Buy Package</span>
                  </button>
                </div>
              </div>

              {/* RATE & SYSTEM INDICATOR BANNER (Hidden per user request) */}
              <div className="hidden p-4 rounded-2xl bg-white border border-[#e4ded2] shadow-2xs flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="font-bold text-[#09353e]">Financial Gateway Status: Online</span>
                  <span className="text-[#718589]">•</span>
                  <span className="text-[#526d72]">Fixed Settlement Rate: <strong className="text-[#0c5963] font-black">$1 USD = 300 PKR</strong></span>
                </div>
                <button
                  onClick={() => handleTabChange('transactions')}
                  className="text-[#0c5963] hover:underline font-bold text-xs flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Full Transaction Ledger</span>
                </button>
              </div>

              {/* STAT CARDS (Consolidated and refined per user request) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1 & 2: CONSOLIDATED WALLET BALANCE & ACTIVE PACKAGE */}
                <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-[#73888d] dark:text-[#94a3b8] uppercase tracking-wider">
                        Wallet & Package Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#fef3c7] dark:bg-[#2e2609] text-[#ca8a04] dark:text-[#facc15] flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-1">
                      <div className="bg-[#faf8f5] dark:bg-[#081c22] p-3 rounded-2xl border border-[#ece6d9] dark:border-[#123640]">
                        <span className="text-[10px] font-bold text-[#6a8288] dark:text-[#94a3b8] uppercase tracking-wider block">
                          Wallet Balance
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-[#09353e] dark:text-white tracking-tight mt-0.5">
                          ${Number(stats.walletBalance).toFixed(2)}
                        </div>
                        <span className="text-[10px] font-bold text-[#0c5963] dark:text-[#38bdf8] block mt-1">
                          +${Number(stats.totalEarned || 0).toFixed(2)} earned
                        </span>
                      </div>

                      <div className="bg-[#faf8f5] dark:bg-[#081c22] p-3 rounded-2xl border border-[#ece6d9] dark:border-[#123640]">
                        <span className="text-[10px] font-bold text-[#6a8288] dark:text-[#94a3b8] uppercase tracking-wider block">
                          Active Package
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-[#09353e] dark:text-white tracking-tight mt-0.5 truncate">
                          {hasActivePackage ? stats.currentPackage : 'No Package'}
                        </div>
                        <div className="mt-1">
                          {hasActivePackage ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16a34a] dark:text-[#4ade80]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#dc2626] dark:text-[#f87171]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                              Ineligible (Buy Package)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] dark:border-[#173740] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277] dark:text-[#94a3b8]">Account Status:</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${hasActivePackage ? 'text-[#16a34a] dark:text-[#4ade80]' : 'text-[#dc2626] dark:text-[#f87171]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasActivePackage ? 'bg-[#16a34a] dark:bg-[#4ade80]' : 'bg-[#dc2626] dark:bg-[#f87171]'}`} />
                      {hasActivePackage ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* 3. LIFETIME ADS & DAILY ADS ENGINE */}
                <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] dark:text-[#94a3b8] uppercase tracking-wider">
                        Lifetime Ads Watched
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#ede9fe] dark:bg-[#20183b] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center">
                        <PlaySquare className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-extrabold text-[#09353e] dark:text-white tracking-tight">
                        {Number(stats.lifetimeAds || 0).toLocaleString()}
                      </div>
                      <span className="hidden text-xs font-bold text-[#7c3aed] dark:text-[#c084fc] bg-[#f5f3ff] dark:bg-[#2e224e] px-2.5 py-1 rounded-full">
                        Lifetime Verified
                      </span>
                    </div>

                    {/* Daily Ad Rhythm Bar */}
                    <div className="mt-3 bg-[#faf8f5] dark:bg-[#081c22] p-2.5 rounded-2xl border border-[#ece6d9] dark:border-[#123640]">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                        <span className="text-[#647b80] dark:text-[#94a3b8] uppercase tracking-wider">Today's Ads</span>
                        <span className="text-[#09353e] dark:text-white">{stats.dailyAdCount ?? 0} / 200 ads</span>
                      </div>
                      <div className="w-full bg-[#e8e2d5] dark:bg-[#15343d] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-linear-to-r from-[#7c3aed] to-[#0c5963] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(((stats.dailyAdCount ?? 0) / 200) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] dark:border-[#173740] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277] dark:text-[#94a3b8]">Daily Ad Returns:</span>
                    {hasActivePackage ? (
                      <button
                        onClick={() => handleTabChange('watch-ads')}
                        className="font-bold text-[#0c5963] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Watch Ads Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="font-bold text-[#dc2626] dark:text-[#f87171]">
                        Ineligible (Package Needed)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. TEAM NETWORK & ADS */}
                <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] dark:text-[#94a3b8] uppercase tracking-wider">
                        Team Performance
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] dark:bg-[#082836] text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    {/* 2 Types: My Team and Team Ads */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-[#faf8f5] dark:bg-[#081c22] p-2.5 rounded-2xl border border-[#ece6d9] dark:border-[#123640]">
                        <span className="text-[10px] font-bold text-[#6a8288] dark:text-[#94a3b8] uppercase tracking-wider block">
                          My Team
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-[#09353e] dark:text-white mt-0.5 tracking-tight">
                          {Number(stats.referralCount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-[#faf8f5] dark:bg-[#081c22] p-2.5 rounded-2xl border border-[#ece6d9] dark:border-[#123640]">
                        <span className="text-[10px] font-bold text-[#6a8288] dark:text-[#94a3b8] uppercase tracking-wider block">
                          Team Ads
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-[#0c5963] dark:text-[#38bdf8] mt-0.5 tracking-tight">
                          {Number(stats.teamAdsCount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] dark:border-[#173740] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277] dark:text-[#94a3b8] font-semibold">Daily Team Refer:</span>
                    <span className="font-bold text-[#0c5963] dark:text-[#38bdf8]">
                      {stats.dailyReferralCount !== undefined ? stats.dailyReferralCount : 0} today
                    </span>
                  </div>
                </div>
              </div>

              {/* TEAM REFERRAL REWARDS ACCELERATOR (e.g. 5 refs -> $1 | 15 -> $5 | 40 -> $10 | 90 -> $25 etc.) */}
              <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-7 border border-[#e4ded2] dark:border-[#173740] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d5963] dark:text-[#38bdf8]">
                      DIRECT REFERRAL BONUS LADDER
                    </span>
                    <h3 className="text-lg font-bold text-[#09353e] dark:text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-[#0c5963] dark:text-[#38bdf8]" />
                      <span>Team Rewards Accelerator</span>
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                    <span className="text-2xl font-extrabold text-[#09353e] dark:text-white">
                      {Number(stats.referralCount || 0).toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-[#86999e]">
                      / {(stats.referralCount || 0) < 5 ? 5 : (stats.referralCount || 0) < 15 ? 15 : (stats.referralCount || 0) < 40 ? 40 : (stats.referralCount || 0) < 90 ? 90 : (stats.referralCount || 0) < 190 ? 190 : (stats.referralCount || 0) < 250 ? 250 : (stats.referralCount || 0) < 500 ? 500 : 1000} Referrals
                    </span>
                    <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-2.5 py-0.5 rounded-full ml-1">
                      {Math.min(100, Math.round(((stats.referralCount || 0) / ((stats.referralCount || 0) < 5 ? 5 : (stats.referralCount || 0) < 15 ? 15 : (stats.referralCount || 0) < 40 ? 40 : (stats.referralCount || 0) < 90 ? 90 : (stats.referralCount || 0) < 190 ? 190 : (stats.referralCount || 0) < 250 ? 250 : (stats.referralCount || 0) < 500 ? 500 : 1000)) * 100))}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-3.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-linear-to-r from-[#0c5963] via-[#0ea5e9] to-[#10b981] h-full rounded-full transition-all duration-1000 shadow-xs"
                    style={{ width: `${Math.max(4, Math.min(100, Math.round(((stats.referralCount || 0) / ((stats.referralCount || 0) < 5 ? 5 : (stats.referralCount || 0) < 15 ? 15 : (stats.referralCount || 0) < 40 ? 40 : (stats.referralCount || 0) < 90 ? 90 : (stats.referralCount || 0) < 190 ? 190 : (stats.referralCount || 0) < 250 ? 250 : (stats.referralCount || 0) < 500 ? 500 : 1000)) * 100)))}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5f757a] dark:text-[#94a3b8] gap-2 pt-1">
                  <span>
                    Invite members with your link to unlock up to <strong>$600.00 cash rewards</strong> credited directly to your wallet.
                  </span>
                  <button
                    onClick={() => handleTabChange('milestones')}
                    className="text-[#0c5963] dark:text-[#38bdf8] hover:underline font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>View & Claim Team Rewards</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ACTIVE CONTRACT / PACKAGE UPGRADE CARD */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#f5f1e8] dark:bg-[#0c2027] border border-[#e7e1d4] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#73888d] dark:text-[#94a3b8]">
                      ACTIVE CONTRACT
                    </span>
                    <span className={`hidden text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hasActivePackage
                        ? 'bg-[#dcfce7] text-[#16a34a] dark:bg-[#064e3b]/50 dark:text-[#4ade80]'
                        : 'bg-[#fee2e2] text-[#dc2626] dark:bg-[#7f1d1d]/40 dark:text-[#f87171]'
                    }`}>
                      {hasActivePackage ? 'Eligible' : 'Ineligible'}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-[#09353e] dark:text-white mt-1 mb-1">
                    {hasActivePackage ? `${stats.currentPackage} Package` : 'No Active Package'}
                  </h4>
                  <p className="text-xs text-[#526b70] dark:text-[#94a3b8] leading-relaxed max-w-xl">
                    {hasActivePackage
                      ? '"Success does not come from what you do occasionally, it comes from what you do consistently. Keep building your daily momentum, watch your ads, grow your team, and unlock your true financial freedom!"'
                      : 'You do not have an active earning contract. As a new user, you must deposit and activate a package to become eligible for daily ads, 20% daily returns, referral network, and withdrawals.'}
                  </p>
                </div>

                <button
                  onClick={() => handleTabChange('buy-package')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0c5963] hover:bg-[#094750] text-white text-xs font-bold rounded-xl transition-colors self-start sm:self-auto cursor-pointer shrink-0 shadow-xs"
                >
                  <span>{hasActivePackage ? 'Browse & Upgrade Packages' : 'Buy Package to Activate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BUY PACKAGE (/buy-package)                                        */}
          {/* ========================================================================= */}
          {currentActiveTab === 'buy-package' && (
            <BuyPackage
              walletBalance={stats.walletBalance}
              currentPackage={stats.currentPackage}
              onPackageBought={handlePackageBought}
              onSelectTab={handleTabChange}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 3: WATCH ADS (Phase 3)                                                */}
          {/* ========================================================================= */}
          {currentActiveTab === 'watch-ads' && (
            hasActivePackage ? (
              <WatchAds
                onSelectTab={handleTabChange}
                onNavigate={onNavigate}
              />
            ) : (
              <IneligibleGate
                featureName="Daily Ad Watch Center"
                onSelectTab={handleTabChange}
              />
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REFERRALS (Phase 3)                                                */}
          {/* ========================================================================= */}
          {currentActiveTab === 'referrals' && (
            hasActivePackage ? (
              <Referrals
                onSelectTab={handleTabChange}
              />
            ) : (
              <IneligibleGate
                featureName="Referrals & Team Network"
                onSelectTab={handleTabChange}
              />
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TEAM REWARDS (Direct Referral Cash Milestones)                     */}
          {/* ========================================================================= */}
          {(currentActiveTab === 'milestones' || currentActiveTab === 'team-rewards') && (
            hasActivePackage ? (
              <Milestones
                onSelectTab={handleTabChange}
              />
            ) : (
              <IneligibleGate
                featureName="Team Rewards & Cash Milestones"
                onSelectTab={handleTabChange}
              />
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 6: DEPOSIT (Phase 4)                                                  */}
          {/* ========================================================================= */}
          {currentActiveTab === 'deposit' && (
            <DepositPage
              onSelectTab={handleTabChange}
              onNavigate={onNavigate}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 7: WITHDRAW (Phase 4)                                                 */}
          {/* ========================================================================= */}
          {currentActiveTab === 'withdraw' && (
            hasActivePackage ? (
              <WithdrawPage
                onSelectTab={handleTabChange}
                onNavigate={onNavigate}
              />
            ) : (
              <IneligibleGate
                featureName="Instant Withdrawal Gateway"
                onSelectTab={handleTabChange}
              />
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 8: TRANSACTIONS (Phase 4)                                             */}
          {/* ========================================================================= */}
          {currentActiveTab === 'transactions' && (
            hasActivePackage ? (
              <TransactionHistory />
            ) : (
              <IneligibleGate
                featureName="Transaction History & Ledger"
                onSelectTab={handleTabChange}
              />
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 9: PROFILE INFORMATION & SETTINGS (Eligible for All Users)            */}
          {/* ========================================================================= */}
          {currentActiveTab === 'settings' && (
            <AccountSettings onSelectTab={handleTabChange} />
          )}
        </section>
    </div>
  );
}
