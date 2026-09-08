import React from 'react';
import { X, LayoutDashboard, PlaySquare, PackageCheck, CreditCard, ArrowDownToLine, LogOut, ExternalLink } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function SidebarDrawer({ isOpen, onClose, activeTab, onSelectTab, onNavigate }) {
  const { currentUser, logout } = useAuth();

  if (!isOpen) return null;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'buy-package', label: 'Buy Package', icon: PackageCheck },
    { id: 'watch-ads', label: 'Watch Ads', icon: PlaySquare },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine },
    { id: 'referrals', label: 'Referrals', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#051c22]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-72 max-w-[85vw] bg-[#faf8f5] h-full shadow-2xl border-r border-[#e8e2d5] flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#ece6d9] flex items-center justify-between">
          <button
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="flex items-center text-left"
          >
            <Logo size="sm" />
          </button>

          <button
            id="btn-close-drawer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#617478] hover:bg-[#eae3d5] transition-colors"
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
            return (
              <button
                key={item.id}
                id={`drawer-link-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0c5963] text-white font-semibold shadow-sm shadow-[#0c5963]/25'
                    : 'text-[#16363d] hover:bg-[#ede7db]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#50686d]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account / Footer in Drawer */}
        <div className="p-4 border-t border-[#ece6d9] bg-[#f5f1e8]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#e89b27] text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'TF'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-[#093e4a] truncate">
                {currentUser?.displayName || 'Member'}
              </p>
              <p className="text-[11px] text-[#6d7f83] truncate">
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
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#991b1b] hover:bg-[#fee2e2] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
