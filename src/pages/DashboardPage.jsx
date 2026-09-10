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
  ChevronRight
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
    walletBalance: userStats?.walletBalance ?? 0,
    currentPackage: userStats?.currentPackage || 'None',
    lifetimeAds: userStats?.lifetimeAds ?? 0,
    teamAdsCount: userStats?.teamAdsCount ?? 0,
    referralCount: userStats?.referralCount ?? 0,
    totalEarned: userStats?.totalEarned ?? 0,
    milestone: {
      current: userStats?.lifetimeAds ?? 0,
      target: 500,
      percentage: 0,
      adsRemaining: 500,
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

  // Check if user has an active package (new users without package do not see Watch Ads or Withdrawal)
  const hasActivePackage = Boolean(stats.currentPackage && stats.currentPackage !== 'None');

  // Sidebar navigation menu items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ...(hasActivePackage ? [{ id: 'watch-ads', label: 'Watch Ads', icon: PlaySquare }] : []),
    { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownCircle, tag: 'Instant' },
    ...(hasActivePackage ? [{ id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight }] : []),
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'buy-package', label: 'Buy Package', icon: Package },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'milestones', label: 'Team Rewards', icon: Gift, tag: 'Cash' },
    { id: 'settings', label: 'Settings & Profile', icon: Settings },
  ];

  const rawDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Member';
  const userFirstName = rawDisplayName.trim().split(' ')[0];
  const userName = rawDisplayName;
  const userEmail = currentUser?.email || 'member@taemryflux.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#0c5963] text-white shadow-xs'
                      : 'bg-white text-[#526a6f] border border-[#e4ded2]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === 'overview' && (
                    <ChevronRight className="w-3 h-3 opacity-85 ml-0.5" />
                  )}
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
                      {item.id === 'overview' && (
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-white/90 translate-x-0.5' : 'text-[#82999f]'}`} />
                      )}
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
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] dark:text-[#38bdf8] uppercase">
                    MEMBER DASHBOARD
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] dark:text-[#f1f5f9] mt-0.5">
                    Welcome Back, {userFirstName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#546b70] dark:text-[#94a3b8] mt-0.5">
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
                    {stats.currentPackage && stats.currentPackage !== 'None' ? (
                      <span className="font-bold text-[#16a34a] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        Active
                      </span>
                    ) : (
                      <span className="font-bold text-[#73888d] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                        No Package
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Lifetime Ads */}
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
                      {Number(stats.lifetimeAds || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f4f0e7] flex items-center justify-between text-[11px]">
                    <span className="text-[#597277]">Daily rhythm</span>
                    <span className="font-bold text-[#09353e]">{stats.dailyAdCount ?? 0} today</span>
                  </div>
                </div>

                {/* 4. Team Network & Ads */}
                <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between hover:border-[#0c5963]/40 transition-all">
                  <div>
                    <div className="flex items-center justify-end mb-2">
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
                    <span className="text-[#597277] dark:text-[#94a3b8] font-semibold">Daily Team Refer</span>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#73888d] dark:text-[#94a3b8]">
                    ACTIVE CONTRACT
                  </span>
                  <h4 className="text-xl font-bold text-[#09353e] dark:text-white mt-1 mb-1">
                    {stats.currentPackage} Package
                  </h4>
                  <p className="text-xs text-[#526b70] dark:text-[#94a3b8] leading-relaxed max-w-xl">
                    "Success does not come from what you do occasionally, it comes from what you do consistently. Keep building your daily momentum, watch your ads, grow your team, and unlock your true financial freedom!"
                  </p>
                </div>

                <button
                  onClick={() => handleTabChange('buy-package')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0c5963] hover:bg-[#094750] text-white text-xs font-bold rounded-xl transition-colors self-start sm:self-auto cursor-pointer shrink-0 shadow-xs"
                >
                  <span>Browse & Upgrade Packages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
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
            hasActivePackage ? (
              <WatchAds
                onSelectTab={handleTabChange}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-8 border border-[#e4ded2] dark:border-[#173740] text-center max-w-xl mx-auto my-8 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center mb-4">
                  <PlaySquare className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#09353e] dark:text-white mb-2">
                  Package Required to Watch Ads
                </h3>
                <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mb-6 leading-relaxed">
                  Watching daily ads and earning daily returns unlocks immediately upon depositing and activating an advertising package.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handleTabChange('deposit')}
                    className="px-5 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Deposit Funds
                  </button>
                  <button
                    onClick={() => handleTabChange('buy-package')}
                    className="px-5 py-2.5 bg-white dark:bg-[#122e37] text-[#09353e] dark:text-white border border-[#d8d1c3] dark:border-[#1e4854] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Buy Package
                  </button>
                </div>
              </div>
            )
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
          {/* TAB 5: TEAM REWARDS (Direct Referral Cash Milestones)                     */}
          {/* ========================================================================= */}
          {(activeTab === 'milestones' || activeTab === 'team-rewards') && (
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
            hasActivePackage ? (
              <WithdrawPage
                onSelectTab={handleTabChange}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-8 border border-[#e4ded2] dark:border-[#173740] text-center max-w-xl mx-auto my-8 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center mb-4">
                  <ArrowUpRight className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#09353e] dark:text-white mb-2">
                  Package Required for Withdrawals
                </h3>
                <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mb-6 leading-relaxed">
                  Withdrawal requests are exclusively available for active package holders. Please deposit and activate an advertising package to unlock withdrawals.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handleTabChange('deposit')}
                    className="px-5 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Deposit Funds
                  </button>
                  <button
                    onClick={() => handleTabChange('buy-package')}
                    className="px-5 py-2.5 bg-white dark:bg-[#122e37] text-[#09353e] dark:text-white border border-[#d8d1c3] dark:border-[#1e4854] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Buy Package
                  </button>
                </div>
              </div>
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 8: TRANSACTIONS (Phase 4)                                             */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <TransactionHistory />
          )}

          {/* ========================================================================= */}
          {/* TAB 9: SETTINGS & PROFILE (Theme, Photo, Info)                            */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <AccountSettings onSelectTab={handleTabChange} />
          )}
        </section>
      </div>
    </div>
  );
}
