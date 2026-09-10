import React from 'react';
import {
  X,
  LayoutDashboard,
  PlaySquare,
  PackageCheck,
  Users,
  Trophy,
  ArrowDownCircle,
  ArrowUpRight,
  History,
  LogOut,
  ExternalLink,
  ShieldCheck,
  FileText,
  LifeBuoy,
  Settings,
  Gift
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function SidebarDrawer({ isOpen, onClose, activeTab, onSelectTab, onNavigate }) {
  const { currentUser, userStats, isAdmin, logout } = useAuth();

  if (!isOpen) return null;

  const hasActivePackage = Boolean(userStats?.currentPackage && userStats?.currentPackage !== 'None');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ...(hasActivePackage ? [{ id: 'watch-ads', label: 'Watch Ads', icon: PlaySquare }] : []),
    { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownCircle },
    ...(hasActivePackage ? [{ id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight }] : []),
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'buy-package', label: 'Buy Package', icon: PackageCheck },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'milestones', label: 'Team Rewards', icon: Gift },
    { id: 'settings', label: 'Settings & Profile', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#051c22]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-72 max-w-[85vw] bg-[#faf8f5] dark:bg-[#07161b] h-full shadow-2xl border-r border-[#e8e2d5] dark:border-[#17323b] flex flex-col z-10 animate-in slide-in-from-left duration-200 transition-colors">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#ece6d9] dark:border-[#17323b] flex items-center justify-between">
          <button
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="flex items-center text-left cursor-pointer"
          >
            <Logo size="sm" />
          </button>

          <button
            id="btn-close-drawer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#617478] dark:text-[#94a3b8] hover:bg-[#eae3d5] dark:hover:bg-[#122e37] hover:text-[#09353e] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSettings = item.id === 'settings';
            return (
              <button
                key={item.id}
                id={`drawer-link-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isSettings
                    ? (isActive
                        ? 'bg-transparent text-[#0c5963] dark:text-[#38bdf8] font-bold'
                        : 'bg-transparent text-[#16363d] dark:text-[#cbd5e1] hover:text-[#0c5963] dark:hover:text-white')
                    : (isActive
                        ? 'bg-[#0c5963] text-white font-semibold shadow-sm shadow-[#0c5963]/25'
                        : 'text-[#16363d] dark:text-[#cbd5e1] hover:bg-[#ede7db] dark:hover:bg-[#122e37] dark:hover:text-white')
                }`}
              >
                <Icon className={`w-4 h-4 ${isSettings ? (isActive ? 'text-[#0c5963] dark:text-[#38bdf8]' : 'text-[#50686d] dark:text-[#94a3b8]') : (isActive ? 'text-white' : 'text-[#50686d] dark:text-[#94a3b8]')}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {isAdmin && (
            <div className="pt-2 border-t border-[#ece6d9] dark:border-[#17323b]">
              <button
                id="drawer-link-admin"
                onClick={() => {
                  onNavigate('admin');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold bg-[#1e293b] text-[#38bdf8] border border-[#334155] hover:bg-[#0f172a] transition-all shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                <span>Admin Panel</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[#ece6d9] dark:border-[#17323b] space-y-1">
            <button
              id="drawer-link-whitepaper"
              onClick={() => {
                onNavigate('whitepaper');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#0c5963] dark:text-[#38bdf8] hover:bg-[#eae3d5] dark:hover:bg-[#122e37] transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Official Whitepaper (v1.0)</span>
            </button>
            <button
              id="drawer-link-support"
              onClick={() => {
                onNavigate('support');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#486065] dark:text-[#94a3b8] hover:bg-[#eae3d5] dark:hover:bg-[#122e37] dark:hover:text-white transition-all cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-[#486065] dark:text-[#94a3b8]" />
              <span>Contact Support</span>
            </button>
          </div>
        </nav>

        {/* User Account / Footer in Drawer */}
        <div className="p-4 border-t border-[#ece6d9] dark:border-[#17323b] bg-[#f5f1e8] dark:bg-[#061418] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#e89b27] text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'TF'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-[#093e4a] dark:text-white truncate">
                {currentUser?.displayName || 'Member'}
              </p>
              <p className="text-[11px] text-[#6d7f83] dark:text-[#94a3b8] truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            id="btn-drawer-signout"
            onClick={async () => {
              await logout();
              onClose();
              onNavigate('home');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#991b1b] dark:text-red-400 hover:bg-[#fee2e2] dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
