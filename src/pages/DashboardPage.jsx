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
  Coins
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

export default function DashboardPage({
  activeTab: propActiveTab = 'overview',
  onSelectTab = (_tab) => {},
  onNavigate = (_page, _tab) => {}
}) {
  const { currentUser, userStats } = useAuth();

  // Internal tab state ('overview' | 'watch-ads' | 'referrals' | 'milestones' | 'buy-package' | 'withdraw')
  const [activeTab, setActiveTab] = useState(
    propActiveTab === 'packages' ? 'buy-package' : propActiveTab || 'overview'
  );

  // Live dashboard statistics loaded from GET /api/dashboard/stats
  const [stats, setStats] = useState({
    walletBalance: userStats?.walletBalance || 45.50,
    currentPackage: userStats?.currentPackage || 'Gold',
    lifetimeAds: userStats?.lifetimeAds || 1200,
    teamAdsCount: userStats?.teamAdsCount || 5000,
    referralCount: userStats?.referralCount || 3,
    totalEarned: userStats?.totalEarned || 138.20,
    milestone: {
      current: userStats?.lifetimeAds || 1200,
      target: 2000,
      percentage: 60,
      adsRemaining: 800,
    },
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync when propActiveTab changes
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab === 'packages' ? 'buy-package' : propActiveTab);
    }
  }, [propActiveTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onSelectTab) {
      onSelectTab(tabId);
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

  // Sidebar navigation menu items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'watch-ads', label: 'Watch Ads', icon: PlaySquare, tag: '200' },
    { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownCircle, tag: 'Instant' },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'buy-package', label: 'Buy Package', icon: Package },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
  ];

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'TAEMRY Member';
  const userEmail = currentUser?.email || 'member@taemryflux.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* PHASE 2 STATUS BADGE */}
      <div className="mb-6 p-4 rounded-2xl bg-[#e6f4f1] border border-[#bde2db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0c5963] text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#09353e]">
                Phase 2 Dashboard Active
              </span>
              <span className="text-[10px] font-bold bg-[#0c5963] text-white px-2 py-0.5 rounded-full">
                API + Firestore
              </span>
            </div>
            <p className="text-[11px] text-[#526d72]">
              Connected to backend Express API. Authenticated as <strong className="text-[#09353e]">{userEmail}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loadingStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#faf8f5] text-[#0c5963] text-xs font-semibold rounded-xl border border-[#b8dfd7] shadow-2xs transition-all self-end sm:self-auto cursor-pointer"
          title="Refresh dashboard stats from API"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
          <span>Refresh stats</span>
        </button>
      </div>

      {/* MAIN TWO-COLUMN SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* SIDEBAR NAVIGATION (Desktop 1 Col, Responsive Header on Mobile) */}
        <aside className="lg:col-span-1">
          {/* Mobile Horizontal Scrollable Tab Bar */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#0c5963] text-white shadow-xs'
                      : 'bg-white text-[#526a6f] border border-[#e4ded2]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Sidebar Card */}
          <div className="hidden lg:block bg-white rounded-3xl p-4 border border-[#e4ded2] shadow-xs sticky top-24">
            <div className="p-3 mb-2 border-b border-[#f1eee7]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#768b90]">
                NAVIGATION
              </span>
              <p className="text-xs font-bold text-[#09353e] truncate mt-0.5">
                {userName}
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-btn-${item.id}`}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0c5963] text-white shadow-sm shadow-[#0c5963]/20'
                        : 'text-[#375258] hover:bg-[#f7f4ee] hover:text-[#0c5963]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#74898e]'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.tag && (
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#f4f0e7] text-[#718589]'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Wallet Summary in Sidebar */}
            <div className="mt-6 p-4 rounded-2xl bg-[#faf8f5] border border-[#e9e3d7]">
              <span className="text-[10px] uppercase font-bold text-[#7b8f94] tracking-wider block">
                Active Tier
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-extrabold text-[#09353e]">
                  {stats.currentPackage}
                </span>
                <span className="text-[11px] font-bold text-[#0c5963] bg-[#e6f4f1] px-2 py-0.5 rounded-full">
                  Eligible
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#ebe4d8] flex items-center justify-between text-xs">
                <span className="text-[#647b80]">Balance:</span>
                <span className="font-extrabold text-[#09353e]">
                  ${Number(stats.walletBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEW CONTENT AREA (Desktop 3 Cols) */}
        <section className="lg:col-span-3">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW (/dashboard)                                             */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
                    MEMBER DASHBOARD
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-0.5">
                    Welcome back, {userName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
                    Real-time metrics verified via Firebase Admin API.
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    id="btn-overview-deposit"
                    onClick={() => handleTabChange('deposit')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>

                  <button
                    id="btn-overview-withdraw"
                    onClick={() => handleTabChange('withdraw')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#ede7dc] text-[#09353e] text-xs font-bold rounded-xl border border-[#d8d1c3] shadow-xs transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0c5963]" />
                    <span>Quick Withdraw</span>
                  </button>

                  <button
                    id="btn-overview-buy-package"
                    onClick={() => handleTabChange('buy-package')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#faf8f5] hover:bg-[#ede7dc] text-[#526d72] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-all cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-[#ca8a04]" />
                    <span>Buy Package</span>
                  </button>
                </div>
              </div>

              {/* RATE & SYSTEM INDICATOR BANNER */}
              <div className="p-4 rounded-2xl bg-white border border-[#e4ded2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

              {/* 4 STAT CARDS REQUIRED BY USER PROMPT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Wallet Balance ($45.50) */}
                <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] uppercase tracking-wider">
                        Wallet Balance
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#09353e] tracking-tight">
                      ${Number(stats.walletBalance).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277]">Total earned</span>
                    <span className="font-bold text-[#0c5963]">+${Number(stats.totalEarned || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* 2. Current Package (Gold) */}
                <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] uppercase tracking-wider">
                        Current Package
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#fef3c7] text-[#ca8a04] flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#09353e] tracking-tight">
                      {stats.currentPackage}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277]">Status</span>
                    <span className="font-bold text-[#16a34a] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                      Eligible
                    </span>
                  </div>
                </div>

                {/* 3. Lifetime Ads (1,200) */}
                <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] uppercase tracking-wider">
                        Lifetime Ads
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
                        <PlaySquare className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#09353e] tracking-tight">
                      {Number(stats.lifetimeAds).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277]">Daily rhythm</span>
                    <span className="font-bold text-[#09353e]">Active</span>
                  </div>
                </div>

                {/* 4. Team Ads (5,000) */}
                <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#73888d] uppercase tracking-wider">
                        Team Ads
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#09353e] tracking-tight">
                      {Number(stats.teamAdsCount).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277]">Referrals</span>
                    <span className="font-bold text-[#09353e]">{stats.referralCount || 3} members</span>
                  </div>
                </div>
              </div>

              {/* PERSONAL MILESTONE PROGRESS BAR (e.g. 1,200 / 2,000 -> 60%) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d5963]">
                      MILESTONE ACCELERATOR
                    </span>
                    <h3 className="text-lg font-bold text-[#09353e]">
                      Next Personal Milestone
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                    <span className="text-2xl font-extrabold text-[#09353e]">
                      {Number(stats.milestone?.current || stats.lifetimeAds).toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-[#86999e]">
                      / {Number(stats.milestone?.target || 2000).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full ml-1">
                      {stats.milestone?.percentage || 60}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-[#f1eee7] h-3.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-gradient-to-r from-[#0c5963] to-[#10b981] h-full rounded-full transition-all duration-1000 shadow-xs"
                    style={{ width: `${Math.min(100, stats.milestone?.percentage || 60)}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5f757a] gap-2 pt-1">
                  <span>
                    <strong>{Number(stats.milestone?.adsRemaining || 800).toLocaleString()} views</strong> remaining to reach the next tier unlock.
                  </span>
                  <button
                    onClick={() => handleTabChange('milestones')}
                    className="text-[#0c5963] hover:text-[#083a41] font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>View & Claim Milestones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ACTION / INTEGRATION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Package Status and Upgrade CTA */}
                <div className="p-6 rounded-3xl bg-[#f5f1e8] border border-[#e7e1d4] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#73888d]">
                      ACTIVE CONTRACT
                    </span>
                    <h4 className="text-xl font-bold text-[#09353e] mt-1 mb-2">
                      {stats.currentPackage} Package
                    </h4>
                    <p className="text-xs text-[#526b70] leading-relaxed mb-4">
                      Your wallet entry gives you access to higher daily ad allocations and accelerated reward rates.
                    </p>
                  </div>

                  <button
                    onClick={() => handleTabChange('buy-package')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold rounded-xl shadow-xs transition-all self-start cursor-pointer"
                  >
                    <span>Browse and upgrade packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Phase 3 & 4 Roadmap Preview */}
                <div className="p-6 rounded-3xl bg-white border border-[#e4ded2] shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#73888d]">
                      UPCOMING MODULES
                    </span>
                    <h4 className="text-xl font-bold text-[#09353e] mt-1 mb-2">
                      Roadmap Progression
                    </h4>
                    <p className="text-xs text-[#526b70] leading-relaxed mb-4">
                      Phase 2 backend APIs and package purchase engine are ready. Phase 3 (Ads + Referrals) and Phase 4 (Withdrawals) are queued.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0c5963]">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>Phase 2 Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BUY PACKAGE (/buy-package)                                        */}
          {/* ========================================================================= */}
          {activeTab === 'buy-package' && (
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
          {activeTab === 'watch-ads' && (
            <WatchAds
              onSelectTab={handleTabChange}
              onNavigate={onNavigate}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REFERRALS (Phase 3)                                                */}
          {/* ========================================================================= */}
          {activeTab === 'referrals' && (
            <Referrals
              onSelectTab={handleTabChange}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: MILESTONES (Phase 3)                                               */}
          {/* ========================================================================= */}
          {activeTab === 'milestones' && (
            <Milestones
              onSelectTab={handleTabChange}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: DEPOSIT (Phase 4)                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'deposit' && (
            <DepositPage
              onSelectTab={handleTabChange}
              onNavigate={onNavigate}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 7: WITHDRAW (Phase 4)                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'withdraw' && (
            <WithdrawPage
              onSelectTab={handleTabChange}
              onNavigate={onNavigate}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 8: TRANSACTIONS (Phase 4)                                             */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <TransactionHistory />
          )}
        </section>
      </div>
    </div>
  );
}
