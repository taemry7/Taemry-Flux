/**
 * TAEMRY FLUX - Master Admin Layout & Router (Phase 5)
 * Executive administration control shell with role verification, persistent sidebar, and sub-module navigation.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpRight,
  Sliders,
  PlaySquare,
  FileText,
  Radio,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  AlertOctagon,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Logo from '../components/Logo';

// Sub-page components
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminDeposits from '../pages/admin/AdminDeposits';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminAdsSettings from '../pages/admin/AdminAdsSettings';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import AdminBroadcast from '../pages/admin/AdminBroadcast';

export default function AdminLayout({ onNavigate }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch admin stats for pending badges
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get('/admin/stats');
      if (res.data?.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load admin summary stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, activeTab]);

  // Access Control Guard
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-black text-white">Administrative Access Restricted</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested control surface requires an administrative role with verified custom claims
            (<code className="text-rose-400">admin: true</code>). Your account ({currentUser?.email || 'Guest'}) does not possess system clearance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Member Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users Directory', icon: Users },
    {
      id: 'deposits',
      label: 'Deposits',
      icon: ArrowDownCircle,
      badge: stats?.pendingDeposits || 0,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'withdrawals',
      label: 'Withdrawals',
      icon: ArrowUpRight,
      badge: stats?.pendingWithdrawals || 0,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    { id: 'settings', label: 'System Settings', icon: Sliders },
    { id: 'ads-settings', label: 'Ads Settings', icon: PlaySquare },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'broadcast', label: 'Broadcasts', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Administrative Header */}
      <header className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-4 sm:px-6 justify-between">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-sm font-black tracking-wider text-white uppercase block">
                TAEMRY FLUX
              </span>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block -mt-1">
                Admin Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions & Portal link */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60"
            title="Switch to Member App View"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>Member View</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center font-black">
              {currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="font-bold text-white text-[11px] truncate max-w-[140px]">
                {currentUser?.email}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold block">System Admin</span>
            </div>
          </div>

          <button
            onClick={async () => {
              await logout();
              onNavigate('home');
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Shell Body (Sidebar + Content) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop & Mobile Sidebar */}
        <aside
          className={`fixed md:sticky top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-2">
              Platform Governance
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Security Tier:</span>
              <span className="text-emerald-400 font-bold">L3 Custom Claim</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Network:</span>
              <span className="text-slate-400 font-mono">TAEMRY-PROD</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-10 md:hidden"
          />
        )}

        {/* Primary Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              stats={stats}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefresh={fetchStats}
              loading={loadingStats}
            />
          )}

          {activeTab === 'users' && <AdminUsers />}

          {activeTab === 'deposits' && <AdminDeposits />}

          {activeTab === 'withdrawals' && <AdminWithdrawals />}

          {activeTab === 'settings' && <AdminSettings />}

          {activeTab === 'ads-settings' && <AdminAdsSettings />}

          {activeTab === 'audit-logs' && <AdminAuditLogs />}

          {activeTab === 'broadcast' && <AdminBroadcast />}
        </main>
      </div>
    </div>
  );
}
