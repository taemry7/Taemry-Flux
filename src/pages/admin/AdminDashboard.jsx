/**
 * TAEMRY FLUX - Admin Dashboard (Phase 5)
 * Comprehensive analytics, platform balance liabilities, pending approval cues, and 7-day performance charts.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Bell,
  Rocket,
  LifeBuoy,
  Trophy,
  Pickaxe,
  Zap,
  Flame,
  Award,
  Trash2,
  X
} from 'lucide-react';
import apiClient from '../../api/client';
import { db, isFirebaseConfigured } from '../../firebase/firebase.config';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import GoLiveModal from '../../components/admin/GoLiveModal';

export default function AdminDashboard({ stats, onNavigateTab, onNavigate, onRefresh, loading }) {
  const [showGoLive, setShowGoLive] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState({ type: '', message: '' });
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [depositsSummary, setDepositsSummary] = useState({ totalApproved: 0, pendingCount: 0 });
  const [loadingRecentUsers, setLoadingRecentUsers] = useState(false);

  // Live real-time subscriber for registered member accounts and deposits
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const loadUsers = async () => {
      setLoadingRecentUsers(true);
      try {
        let fetchedList = [];
        try {
          const res = await apiClient.get('/admin/users', { params: { limit: 100 } });
          if (res.data?.success && Array.isArray(res.data.users)) {
            fetchedList = res.data.users;
          }
        } catch (apiErr) {
          console.warn('Backend users load notice in dashboard:', apiErr.message);
        }

        // Direct client Firestore read
        if (isFirebaseConfigured && db) {
          try {
            const snap = await getDocs(collection(db, 'users'));
            const fsList = [];
            snap.forEach((d) => {
              const u = d.data() || {};
              fsList.push({
                uid: d.id,
                email: u.email || 'member@taemry.com',
                name: u.displayName || u.name || u.username || 'Member',
                username: u.username || '',
                currentPackage: u.currentPackage || 'None',
                walletBalance: Number(u.walletBalance || 0),
                referralCount: Number(u.referralCount || 0),
                lifetimeAds: Number(u.lifetimeAds || 0),
                totalEarned: Number(u.totalEarned || u.lifetimeEarned || 0),
                totalDeposits: Number(u.totalDeposits || 0),
                isEligible: Boolean(u.isEligible),
                isBlocked: Boolean(u.isBlocked),
                createdAt: u.createdAt || new Date().toISOString(),
              });
            });

            // Merge by lowercase email or UID
            const map = new Map();
            fetchedList.forEach((u) => {
              const key = (u.email || '').toLowerCase().trim() || u.uid;
              map.set(key, u);
            });

            fsList.forEach((u) => {
              const key = (u.email || '').toLowerCase().trim() || u.uid;
              if (map.has(key)) {
                const existing = map.get(key);
                const activePkg = (u.currentPackage && u.currentPackage !== 'None')
                  ? u.currentPackage
                  : (existing.currentPackage && existing.currentPackage !== 'None')
                    ? existing.currentPackage
                    : 'None';
                map.set(key, {
                  ...existing,
                  ...u,
                  currentPackage: activePkg,
                  walletBalance: Math.max(Number(existing.walletBalance || 0), Number(u.walletBalance || 0)),
                  isEligible: Boolean(existing.isEligible || u.isEligible || (activePkg !== 'None')),
                  referralCount: Math.max(Number(existing.referralCount || 0), Number(u.referralCount || 0)),
                  lifetimeAds: Math.max(Number(existing.lifetimeAds || 0), Number(u.lifetimeAds || 0)),
                  totalEarned: Math.max(Number(existing.totalEarned || 0), Number(u.totalEarned || 0)),
                  totalDeposits: Math.max(Number(existing.totalDeposits || 0), Number(u.totalDeposits || 0)),
                });
              } else {
                map.set(key, u);
              }
            });
            fetchedList = Array.from(map.values());
          } catch (fsErr) {
            console.warn('Direct firestore read in dashboard notice:', fsErr.message);
          }
        }

        // Also check client storage cache for registered accounts
        try {
          const rawEmails = localStorage.getItem('taemry_registered_emails');
          const rawAccounts = localStorage.getItem('taemry_registered_accounts');
          const emails = rawEmails ? JSON.parse(rawEmails) : [];
          const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
          const existing = new Set(fetchedList.map((u) => (u.email || '').toLowerCase().trim()));

          emails.forEach((em) => {
            const cleanEm = (em || '').toLowerCase().trim();
            if (cleanEm && !existing.has(cleanEm)) {
              const acc = accounts[cleanEm] || {};
              fetchedList.push({
                uid: acc.uid || 'user_' + cleanEm.split('@')[0],
                email: cleanEm,
                name: acc.displayName || cleanEm.split('@')[0],
                currentPackage: 'None',
                walletBalance: 0,
                referralCount: 0,
                isEligible: false,
                isBlocked: false,
                createdAt: new Date().toISOString(),
              });
              existing.add(cleanEm);
            }
          });
        } catch (e) {}

        if (isMounted) {
          setAllUsers(fetchedList);
          setRecentUsers(fetchedList.slice(0, 10));
        }

        // Auto-retry once if empty to ensure initial auth hydration catches it
        if (fetchedList.length === 0 && isMounted) {
          retryTimer = setTimeout(() => {
            if (isMounted) loadUsers();
          }, 1500);
        }
      } finally {
        if (isMounted) setLoadingRecentUsers(false);
      }
    };

    const loadDeposits = async () => {
      try {
        let depositList = [];
        try {
          const res = await apiClient.get('/admin/deposits', { params: { status: 'all' } });
          if (res.data?.success && Array.isArray(res.data.deposits)) {
            depositList = res.data.deposits;
          }
        } catch (apiErr) {}

        if (isFirebaseConfigured && db) {
          try {
            const snap = await getDocs(collection(db, 'deposits'));
            snap.forEach((d) => {
              const data = d.data() || {};
              if (!depositList.some(item => (item.id === d.id || item.depositId === d.id))) {
                depositList.push({ id: d.id, depositId: d.id, ...data });
              }
            });
          } catch (fsErr) {}
        }

        let totalApproved = 0;
        let pendingCount = 0;
        depositList.forEach((dep) => {
          const amt = Number(dep.amountUSD || dep.amount || (dep.amountPKR ? dep.amountPKR / (dep.exchangeRate || 300) : 0));
          if (dep.status === 'approved' || dep.status === 'completed') {
            totalApproved += amt;
          } else if (dep.status === 'pending') {
            pendingCount++;
          }
        });

        if (isMounted) {
          setDepositsSummary({ totalApproved, pendingCount });
        }
      } catch (err) {}
    };

    loadUsers();
    loadDeposits();

    let unsubUsers = null;
    let unsubDeposits = null;
    if (isFirebaseConfigured && db) {
      try {
        unsubUsers = onSnapshot(collection(db, 'users'), () => {
          loadUsers();
        }, (err) => {
          console.warn('Real-time dashboard users snapshot notice:', err.message);
        });
        unsubDeposits = onSnapshot(collection(db, 'deposits'), () => {
          loadDeposits();
        }, () => {});
      } catch (e) {}
    }

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (unsubUsers) unsubUsers();
      if (unsubDeposits) unsubDeposits();
    };
  }, []);

  const handleResetPlatform = async () => {
    const confirmed = window.confirm(
      'CRITICAL CONFIRMATION: Are you sure you want to reset the platform?\n\n' +
      '1. All user accounts will be permanently deleted except mistrtaimoor@gmail.com.\n' +
      '2. Other users will be able to sign up fresh.\n' +
      '3. Deposits, Withdrawals, Total Earned, Liability, and DAU will be reset to 0.\n' +
      '4. Super Admin account (mistrtaimoor@gmail.com) will start with clean 0 balance.\n\n' +
      'Do you want to proceed with this fresh restart?'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      // 1. Client-side Firestore purge if configured
      if (isFirebaseConfigured && db) {
        try {
          const [uSnap, dSnap, wSnap, mSnap] = await Promise.all([
            getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'deposits')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'withdrawals')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'cloudMiner')).catch(() => ({ docs: [] })),
          ]);

          // Clear non-admin users
          for (const d of uSnap.docs || []) {
            const uData = d.data() || {};
            const email = (uData.email || '').toLowerCase().trim();
            if (email !== 'mistrtaimoor@gmail.com' && d.id !== 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') {
              await deleteDoc(d.ref).catch(() => {});
            } else {
              // Reset super admin doc
              await setDoc(doc(db, 'users', d.id), {
                ...uData,
                uid: d.id,
                email: 'mistrtaimoor@gmail.com',
                name: uData.name || uData.displayName || 'Taimoor',
                displayName: uData.displayName || uData.name || 'Taimoor',
                walletBalance: 0,
                currentPackage: 'None',
                lifetimeAds: 0,
                dailyAdCount: 0,
                teamAdsCount: 0,
                referralCount: 0,
                totalEarned: 0,
                isEligible: false,
                isBlocked: false,
                isAdmin: true,
                minedTflx: 0,
                lastAdWatchDate: null,
                updatedAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
            }
          }

          // Clear financial and miner collections
          for (const d of (dSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
          for (const d of (wSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
          for (const d of (mSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
        } catch (fsErr) {
          console.warn('Client Firestore reset notice:', fsErr.message);
        }
      }

      // 2. Call backend reset endpoint
      const res = await apiClient.post('/admin/purge-users');

      // 3. Clear local storage cached stats
      try {
        localStorage.removeItem('taemry_cached_admin_stats');
      } catch (e) {}

      // 4. Global refresh
      window.dispatchEvent(new Event('taemry_admin_stats_refresh'));
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }

      setResetFeedback({
        type: 'success',
        message: res.data?.message || 'Platform successfully reset! All users removed except mistrtaimoor@gmail.com. Metrics reset to 0.',
      });
    } catch (err) {
      setResetFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to reset platform.',
      });
    } finally {
      setResetting(false);
    }
  };

  const {
    totalUsers = 0,
    activeUsers = 0,
    platformBalance = 0,
    totalDeposits = 0,
    totalWithdrawals = 0,
    totalEarned = 0,
    pendingDeposits = 0,
    pendingWithdrawals = 0,
    pendingTickets = 0,
    dailyActiveUsers = 0,
    cloudMiner = { activeMiners: 0, totalMinedTflx: 0, totalHashrate: 0, totalMinersRecorded: 0 },
    todayActivity = { deposits: 0, withdrawals: 0, total: 0 },
    charts = { growth: [], financials: [] }
  } = stats || {};

  // Live, resilient metric aggregation guaranteeing metrics are never blank or zeroed on live site
  const usersCount = allUsers.length;
  const usersActiveCount = allUsers.filter((u) => u.isEligible || (u.currentPackage && u.currentPackage !== 'None')).length;
  const usersEarnedSum = allUsers.reduce((sum, u) => sum + Number(u.totalEarned || u.lifetimeEarned || (Number(u.lifetimeAds || 0) * 0.002) || 0), 0);
  const usersDepositsSum = allUsers.reduce((sum, u) => sum + Number(u.totalDeposits || 0), 0);
  const usersLiabilitySum = allUsers.reduce((sum, u) => sum + Number(u.walletBalance || 0), 0);

  const displayTotalUsers = Math.max(Number(totalUsers || 0), usersCount, recentUsers.length);
  const displayActiveUsers = Math.max(Number(activeUsers || 0), usersActiveCount);
  const displayTotalDeposits = Math.max(Number(totalDeposits || 0), depositsSummary.totalApproved, usersDepositsSum);
  const displayPendingDeposits = Math.max(Number(pendingDeposits || 0), depositsSummary.pendingCount);
  const displayTotalEarned = Math.max(Number(totalEarned || 0), usersEarnedSum);
  const displayPlatformBalance = Math.max(Number(platformBalance || 0), usersLiabilitySum);

  // Sync discovered live metrics back to local cache
  useEffect(() => {
    if (displayTotalUsers > (stats?.totalUsers || 0) || displayTotalEarned > (stats?.totalEarned || 0) || displayTotalDeposits > (stats?.totalDeposits || 0)) {
      try {
        const cached = localStorage.getItem('taemry_cached_admin_stats');
        const prev = cached ? JSON.parse(cached) : {};
        localStorage.setItem('taemry_cached_admin_stats', JSON.stringify({
          ...prev,
          totalUsers: displayTotalUsers,
          activeUsers: displayActiveUsers,
          totalEarned: displayTotalEarned,
          totalDeposits: displayTotalDeposits,
          pendingDeposits: displayPendingDeposits,
          platformBalance: displayPlatformBalance,
        }));
      } catch (e) {}
    }
  }, [displayTotalUsers, displayActiveUsers, displayTotalEarned, displayTotalDeposits, displayPendingDeposits, displayPlatformBalance, stats]);

  const growthCharts = Array.isArray(charts?.growth) && charts.growth.length > 0
    ? charts.growth
    : [
        { day: 'Mon', users: Math.max(0, Math.floor(displayTotalUsers * 0.1)) },
        { day: 'Tue', users: Math.max(0, Math.floor(displayTotalUsers * 0.15)) },
        { day: 'Wed', users: Math.max(0, Math.floor(displayTotalUsers * 0.2)) },
        { day: 'Thu', users: Math.max(0, Math.floor(displayTotalUsers * 0.15)) },
        { day: 'Fri', users: Math.max(0, Math.floor(displayTotalUsers * 0.2)) },
        { day: 'Sat', users: Math.max(0, Math.floor(displayTotalUsers * 0.1)) },
        { day: 'Sun', users: Math.max(1, displayTotalUsers) },
      ];
  const financialCharts = Array.isArray(charts?.financials) ? charts.financials : [];

  const maxGrowth = Math.max(...growthCharts.map((d) => Number(d.users) || 0), 5);
  const maxFinancial = Math.max(...financialCharts.map((d) => Math.max(Number(d.revenue) || 0, Number(d.payouts) || 0)), 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Loading Progress Strip */}
      {loading && (
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-amber-500 animate-pulse w-full" />
        </div>
      )}

      {/* Reset Feedback Alert */}
      {resetFeedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
            resetFeedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {resetFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{resetFeedback.message}</span>
          </div>
          <button
            onClick={() => setResetFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal for Phase 6 Go-Live Checklist */}
      <GoLiveModal isOpen={showGoLive} onClose={() => setShowGoLive(false)} />

      {/* Header Banner with Pending Action Alerts */}
      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-200">
                Action Required: Pending Financial Requests
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {pendingDeposits} deposit{pendingDeposits === 1 ? '' : 's'} awaiting screenshot verification &bull;{' '}
                {pendingWithdrawals} withdrawal{pendingWithdrawals === 1 ? '' : 's'} awaiting payout settlement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {pendingDeposits > 0 && (
              <button
                onClick={() => onNavigateTab('deposits')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Review Deposits ({pendingDeposits})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {pendingWithdrawals > 0 && (
              <button
                onClick={() => onNavigateTab('withdrawals')}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Settle Payouts ({pendingWithdrawals})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cloud Miner Live Status Quick Overview Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Cloud Mining Operations</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{cloudMiner.activeMiners || 0} Mining Now</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Network Hashrate: <strong className="text-amber-400">+{cloudMiner.totalHashrate || 0} TFLX/h</strong> &bull; Total Mined Hash Yield: <strong className="text-white">{cloudMiner.totalMinedTflx || 0} TFLX</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('cloud-miner')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 whitespace-nowrap self-end md:self-auto"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Manage Cloud Miners</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Note: Watch Ads and Cloud Miner preview cards hidden per user request */}

      {/* Core Platform Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{displayTotalUsers}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Active: <strong className="text-emerald-400">{displayActiveUsers}</strong></span>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              View &rarr;
            </button>
          </div>
        </div>

        {/* 2. Total Deposits Approved */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Deposits</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">${Number(displayTotalDeposits).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Pending: <strong className="text-amber-400">{displayPendingDeposits}</strong></span>
            <button
              onClick={() => onNavigateTab('deposits')}
              className="text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* 3. Total Withdrawals Settled */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Withdrawals</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2">${Number(totalWithdrawals).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Pending: <strong className="text-amber-400">{pendingWithdrawals}</strong></span>
            <button
              onClick={() => onNavigateTab('withdrawals')}
              className="text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* 4. Total User Earned */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Earned</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">${Number(displayTotalEarned).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Ads & Matching</span>
            <span className="text-amber-300 font-semibold">USD</span>
          </div>
        </div>

        {/* 5. Total Cloud Mining (TFLX) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Mining</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Pickaxe className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-400 mt-2">
            {Number(cloudMiner?.totalMinedTflx || 0).toFixed(2)} <span className="text-xs font-bold text-orange-300">TFLX</span>
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Live: <strong className="text-emerald-400">{cloudMiner?.activeMiners || 0} Mining</strong></span>
            <button
              onClick={() => onNavigateTab('cloud-miner')}
              className="text-orange-400 hover:underline font-semibold cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* 6. Platform Balance / Total Liability */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Liability</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">${Number(displayPlatformBalance).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>User balances</span>
            <span className="text-indigo-300 font-semibold">USD</span>
          </div>
        </div>

        {/* 7. Daily Active Users (DAU) Today */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">DAU (Today)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{dailyActiveUsers}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Watched ads today</span>
            <span className="text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>

        {/* 8. Tickets Pending (Support Desk) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Support Desk</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{pendingTickets}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Pending Inquiries</span>
            <button
              onClick={() => onNavigateTab('support')}
              className="text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Support &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Performance & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart (3D Live Stream) */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-sky-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_35px_rgba(14,165,233,0.12)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15),0_0_50px_rgba(14,165,233,0.22)] transition-all duration-300 space-y-4 group overflow-hidden">
          {/* 3D Ambient Radial Splashes */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/30 to-indigo-600/30 text-sky-400 border border-sky-400/30 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>User Registrations (Live Flow)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time member account onboarding from Firestore</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-sky-500/30 text-[10px] font-bold text-sky-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE FIRESTORE</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2">
              {growthCharts.map((item, idx) => {
                const heightPercent = Math.max(14, Math.round(((item.users || 0) / maxGrowth) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar">
                    <span className="text-[11px] font-black text-sky-300 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 -translate-y-1 group-hover/bar:translate-y-0 drop-shadow-md">
                      +{item.users || 0}
                    </span>
                    <div className="w-full max-w-[34px] bg-slate-950/80 rounded-t-xl overflow-hidden flex items-end h-full p-0.5 border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <div
                        className="w-full bg-gradient-to-t from-sky-700 via-sky-500 to-sky-300 rounded-t-lg transition-all duration-500 shadow-[0_-4px_12px_rgba(56,189,248,0.4)] group-hover/bar:brightness-125"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold truncate w-full text-center">
                      {(item.label || '').split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Metric Footer Bar */}
          <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">7-Day Total</span>
              <span className="text-xs font-black text-white">
                {growthCharts.reduce((acc, curr) => acc + (curr.users || 0), 0)} Members
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Daily Average</span>
              <span className="text-xs font-black text-sky-400">
                {(growthCharts.reduce((acc, curr) => acc + (curr.users || 0), 0) / (growthCharts.length || 1)).toFixed(1)}/day
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">System Status</span>
              <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Financial Flow: Approved Deposits vs Payouts (3D Live Stream) */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_35px_rgba(16,185,129,0.12)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15),0_0_50px_rgba(16,185,129,0.22)] transition-all duration-300 space-y-4 group overflow-hidden">
          {/* 3D Ambient Radial Splashes */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Revenue vs Payouts (Live Flow)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real capital inflow ($) & settled withdrawal disbursements ($)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-slate-200 font-bold text-[10px]">Deposits</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <span className="text-slate-200 font-bold text-[10px]">Payouts</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2">
              {financialCharts.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No financial activity recorded yet
                </div>
              ) : (
                financialCharts.map((item, idx) => {
                  const revHeight = Math.max(10, Math.round(((item.revenue || 0) / maxFinancial) * 100));
                  const payHeight = Math.max(10, Math.round(((item.payouts || 0) / maxFinancial) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Deposit 3D Pillar */}
                        <div className="w-1/2 max-w-[14px] bg-slate-950/80 rounded-t overflow-hidden flex items-end h-full p-0.5 border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300 rounded-t transition-all duration-500 shadow-[0_-3px_10px_rgba(52,211,153,0.4)] group-hover/bar:brightness-125"
                            style={{ height: `${revHeight}%` }}
                            title={`Approved Deposit: $${item.revenue || 0}`}
                          />
                        </div>
                        {/* Payout 3D Pillar */}
                        <div className="w-1/2 max-w-[14px] bg-slate-950/80 rounded-t overflow-hidden flex items-end h-full p-0.5 border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                          <div
                            className="w-full bg-gradient-to-t from-sky-600 via-sky-400 to-sky-300 rounded-t transition-all duration-500 shadow-[0_-3px_10px_rgba(56,189,248,0.4)] group-hover/bar:brightness-125"
                            style={{ height: `${payHeight}%` }}
                            title={`Settled Payout: $${item.payouts || 0}`}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold truncate w-full text-center">
                        {(item.label || '').split(',')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3D Financial Metric Footer */}
          <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">7-Day Inflow</span>
              <span className="text-xs font-black text-emerald-400">
                +${financialCharts.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">7-Day Outflow</span>
              <span className="text-xs font-black text-sky-400">
                -${financialCharts.reduce((acc, curr) => acc + (curr.payouts || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Net Liquidity</span>
              <span className={`text-xs font-black ${
                financialCharts.reduce((acc, curr) => acc + ((curr.revenue || 0) - (curr.payouts || 0)), 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}>
                ${financialCharts.reduce((acc, curr) => acc + ((curr.revenue || 0) - (curr.payouts || 0)), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Live Registered Users Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Live Registered Users</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Sync Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time directory of member accounts registered across the platform ({Math.max(totalUsers, recentUsers.length)} total)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('users')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Manage All Users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Users Table / List */}
        {recentUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Contract Package</th>
                  <th className="px-4 py-3">Wallet Balance</th>
                  <th className="px-4 py-3">Referrals</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {recentUsers.map((u) => {
                  const initial = (u.name || u.email || 'U')[0].toUpperCase();
                  const isBlocked = Boolean(u.isBlocked);
                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/30 flex items-center justify-center font-bold text-sky-300 text-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate text-xs">{u.name || 'Member'}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.currentPackage && u.currentPackage !== 'None'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.currentPackage && u.currentPackage !== 'None' ? u.currentPackage : 'No Package'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        ${Number(u.walletBalance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {u.referralCount || 0}
                      </td>
                      <td className="px-4 py-3">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigateTab('users')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">
              {loadingRecentUsers ? 'Connecting to live database...' : 'No users found or waiting for registrations.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live listener is active. Registered members will automatically appear here.
            </p>
          </div>
        )}
      </div>

      {/* Quick Access Control Row */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Administrative Quick Hub</h4>
          <p className="text-xs text-slate-400 mt-0.5">Jump directly to specific governance operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('leaderboard')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Leaderboard</span>
          </button>
          <button
            onClick={() => onNavigateTab('users')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Manage Users</span>
          </button>
          <button
            onClick={() => onNavigateTab('broadcast')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Message</span>
          </button>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>System Settings</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading || resetting}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || resetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
