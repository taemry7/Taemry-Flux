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
  Rocket,
  LifeBuoy,
  Trophy
} from 'lucide-react';
import GoLiveModal from '../../components/admin/GoLiveModal';
import AdminDualPreviewCard from '../../components/admin/AdminDualPreviewCard';

export default function AdminDashboard({ stats, onNavigateTab, onNavigate, onRefresh, loading }) {
  const [showGoLive, setShowGoLive] = useState(false);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm font-medium">Loading platform analytics...</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-700 mt-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Now</span>
        </button>
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
    pendingTickets = 0,
    dailyActiveUsers = 0,
    todayActivity = { deposits: 0, withdrawals: 0, total: 0 },
    charts = { growth: [], financials: [] }
  } = stats;

  const growthCharts = Array.isArray(charts?.growth) ? charts.growth : [];
  const financialCharts = Array.isArray(charts?.financials) ? charts.financials : [];

  const maxGrowth = Math.max(...growthCharts.map((d) => Number(d.users) || 0), 5);
  const maxFinancial = Math.max(...financialCharts.map((d) => Math.max(Number(d.revenue) || 0, Number(d.payouts) || 0)), 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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

      {/* Featured Dual Switcher & Interactive Preview Card (Watch Ads & Cloud Miner) */}
      <div className="w-full flex justify-center py-2">
        <AdminDualPreviewCard
          stats={stats}
          onNavigate={onNavigate}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* Core Platform Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalUsers}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>Active: <strong className="text-emerald-400">{activeUsers}</strong></span>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              View &rarr;
            </button>
          </div>
        </div>

        {/* Daily Active Users (DAU) Today (Phase 7) */}
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

        {/* Platform Balance / Total Liability */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Liability</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">${Number(platformBalance).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>User balances</span>
            <span className="text-indigo-300 font-semibold">USD</span>
          </div>
        </div>

        {/* Total Deposits Approved */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deposits</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">${Number(totalDeposits).toFixed(2)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
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
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Withdrawals</span>
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

        {/* Tickets Pending (Phase 7) */}
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
