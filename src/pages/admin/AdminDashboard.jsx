/**
 * TAEMRY FLUX - Admin Dashboard (Phase 5)
 * Comprehensive analytics, platform balance liabilities, pending approval cues, and 7-day performance charts.
 */

import React, { useState } from 'react';
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
  Rocket
} from 'lucide-react';
import GoLiveModal from '../../components/admin/GoLiveModal';

export default function AdminDashboard({ stats, onNavigateTab, onRefresh, loading }) {
  const [showGoLive, setShowGoLive] = useState(false);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm font-medium">Loading platform analytics...</p>
      </div>
    );
  }

  const {
    totalUsers = 0,
    activeUsers = 0,
    platformBalance = 0,
    totalDeposits = 0,
    totalWithdrawals = 0,
    pendingDeposits = 0,
    pendingWithdrawals = 0,
    todayActivity = { deposits: 0, withdrawals: 0, total: 0 },
    charts = { growth: [], financials: [] }
  } = stats;

  const maxGrowth = Math.max(...charts.growth.map((d) => d.users), 5);
  const maxFinancial = Math.max(...charts.financials.map((d) => Math.max(d.revenue, d.payouts)), 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Modal for Phase 6 Go-Live Checklist */}
      <GoLiveModal isOpen={showGoLive} onClose={() => setShowGoLive(false)} />

      {/* Phase 6 Go-Live & Deployment Quick Access Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-emerald-950/50 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
            <Rocket className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Phase 6: Final Deployment & Go-Live Architecture
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vercel (Frontend), Render (Express API), Firebase (Auth/Firestore/Storage Rules), and Cloudflare DNS/WAF
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowGoLive(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Launch & Go-Live Checklist</span>
        </button>
      </div>

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

      {/* Core Platform Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{totalUsers}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Active Members: <strong className="text-emerald-400">{activeUsers}</strong></span>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              Directory &rarr;
            </button>
          </div>
        </div>

        {/* Platform Balance / Total Liability */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Liability</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-400 mt-3">${Number(platformBalance).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Cumulative user wallet holdings</span>
            <span className="text-indigo-300 font-semibold">USD</span>
          </div>
        </div>

        {/* Total Deposits Approved */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Deposits</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-3">${Number(totalDeposits).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Pending: <strong className="text-amber-400">{pendingDeposits}</strong></span>
            <button
              onClick={() => onNavigateTab('deposits')}
              className="text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* Total Withdrawals Settled */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Withdrawals</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-sky-400 mt-3">${Number(totalWithdrawals).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Pending: <strong className="text-amber-400">{pendingWithdrawals}</strong></span>
            <button
              onClick={() => onNavigateTab('withdrawals')}
              className="text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Performance & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>User Registrations (Last 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily influx of verified member accounts</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
              7-Day Range
            </span>
          </div>

          <div className="pt-6">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2">
              {charts.growth.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.users / maxGrowth) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      +{item.users}
                    </span>
                    <div className="w-full max-w-[32px] bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg transition-all duration-500 group-hover:from-sky-500 group-hover:to-sky-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                      {item.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial Flow: Approved Deposits vs Payouts */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Revenue vs Payouts (Last 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Comparison of capital inflow ($) and payout disbursements ($)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-semibold">Deposits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-300 font-semibold">Payouts</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2">
              {charts.financials.map((item, idx) => {
                const revHeight = Math.max(8, Math.round((item.revenue / maxFinancial) * 100));
                const payHeight = Math.max(8, Math.round((item.payouts / maxFinancial) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div className="w-1/2 max-w-[14px] bg-slate-800 rounded-t overflow-hidden flex items-end h-full">
                        <div
                          className="w-full bg-emerald-400 rounded-t transition-all duration-500"
                          style={{ height: `${revHeight}%` }}
                          title={`Deposit: $${item.revenue}`}
                        />
                      </div>
                      <div className="w-1/2 max-w-[14px] bg-slate-800 rounded-t overflow-hidden flex items-end h-full">
                        <div
                          className="w-full bg-sky-400 rounded-t transition-all duration-500"
                          style={{ height: `${payHeight}%` }}
                          title={`Payout: $${item.payouts}`}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                      {item.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Control Row */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Administrative Quick Hub</h4>
          <p className="text-xs text-slate-400 mt-0.5">Jump directly to specific governance operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
