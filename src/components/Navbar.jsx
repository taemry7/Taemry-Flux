import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Wallet, ShieldCheck, User, Sun, Moon, Settings } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenDrawer, onNavigate, currentPage }) {
  const { currentUser, isAdmin, logout, userStats } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taemry_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('taemry_theme', nextTheme);
  };

  // Extract initials from user email or name
  const getInitials = () => {
    if (!currentUser) return 'TF';
    if (currentUser.displayName) {
      const parts = currentUser.displayName.split(' ');
      return parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }
    if (currentUser.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return 'TF';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#e9e3d8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Side: Logo & Menu Button */}
        <div className="flex items-center gap-3">
          {currentUser && onOpenDrawer && (
            <button
              id="btn-nav-drawer"
              onClick={onOpenDrawer}
              className="p-2 -ml-1 text-[#093e4a] hover:bg-[#eae3d5] rounded-xl transition-colors focus:outline-none"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-left focus:outline-none cursor-pointer"
          >
            <Logo size="md" />
          </button>
        </div>

        {/* Center: Quick Site Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#50686d]">
          <button
            onClick={() => {
              onNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('packages-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="hover:text-[#0c5963] transition-colors cursor-pointer"
          >
            Packages
          </button>
          <button
            onClick={() => {
              onNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="hover:text-[#0c5963] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button
            onClick={() => onNavigate('whitepaper')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'whitepaper'
                ? 'text-[#0c5963] font-bold underline underline-offset-4'
                : 'hover:text-[#0c5963]'
            }`}
          >
            Whitepaper
          </button>
          <button
            onClick={() => onNavigate('support')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'support'
                ? 'text-[#0c5963] font-bold underline underline-offset-4'
                : 'hover:text-[#0c5963]'
            }`}
          >
            Support
          </button>
        </nav>

        {/* Right Side: Auth controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Admin Panel Access Pill */}
              {isAdmin && (
                <button
                  id="btn-nav-admin"
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border transition-all cursor-pointer ${
                    currentPage === 'admin'
                      ? 'bg-[#0f172a] text-[#38bdf8] border-[#38bdf8] shadow-sm'
                      : 'bg-[#1e293b] text-[#7dd3fc] border-[#334155] hover:bg-[#0f172a]'
                  }`}
                  title="Open Admin Control Center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Theme Toggle (White Mode / Dark Mode) */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#526d72] hover:text-[#0c5963] hover:bg-[#eef2f3] transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#f59e0b]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#526d72]" />
                )}
              </button>

              {/* Wallet quick balance pill */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center gap-2 bg-[#e6f2f0] hover:bg-[#d8ebe7] text-[#0d5963] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-[#b8ded7] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>${Number(userStats?.walletBalance ?? 0).toFixed(2)}</span>
              </button>

              {/* User Avatar (Photo or Initials) */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-9 h-9 rounded-full overflow-hidden bg-[#e89b27] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#0c5963]/40 transition-all cursor-pointer border border-[#ded8cb]"
                title={currentUser.email || 'Member Profile'}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </button>

              {/* Settings shortcut button */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="p-2 text-[#78888b] hover:text-[#0c5963] hover:bg-[#eef2f3] rounded-xl transition-colors cursor-pointer hidden sm:block"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout button */}
              <button
                id="btn-logout"
                onClick={async () => {
                  await logout();
                  onNavigate('home');
                }}
                className="p-2 text-[#78888b] hover:text-[#b91c1c] hover:bg-[#fee2e2]/60 rounded-xl transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle for logged out guests too */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#526d72] hover:text-[#0c5963] hover:bg-[#eef2f3] transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#f59e0b]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#526d72]" />
                )}
              </button>
              <button
                id="btn-nav-signin"
                onClick={() => onNavigate('login')}
                className="px-3.5 py-2 text-sm font-semibold text-[#093e4a] hover:text-[#0b6370] transition-colors"
              >
                Sign in
              </button>

              <button
                id="btn-nav-getstarted"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c5963] hover:bg-[#08424b] active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-sm shadow-[#0c5963]/20 transition-all"
              >
                <span>Open your wallet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
