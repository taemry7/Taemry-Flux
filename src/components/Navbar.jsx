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

  // Synchronize across components if theme changes elsewhere (e.g. AccountSettings)
  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e?.detail || localStorage.getItem('taemry_theme') || 'light';
      setTheme(newTheme);
    };
    window.addEventListener('taemry-theme-change', handleThemeChange);
    return () => window.removeEventListener('taemry-theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('taemry_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('taemry-theme-change', { detail: nextTheme }));
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
    <header className="sticky top-0 z-40 w-full bg-[#faf8f5]/90 dark:bg-[#07151a]/95 backdrop-blur-md border-b border-[#e9e3d8] dark:border-[#15323b] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Side: Logo & Menu Button */}
        <div className="flex items-center gap-3">
          {currentUser && onOpenDrawer && (
            <button
              id="btn-nav-drawer"
              onClick={onOpenDrawer}
              className="p-2 -ml-1 text-[#093e4a] dark:text-[#f1f5f9] hover:bg-[#eae3d5] dark:hover:bg-[#112d36] rounded-xl transition-colors focus:outline-none cursor-pointer"
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

              {/* 3D Theme Toggle (White Mode / Dark Mode) */}
              <button
                type="button"
                id="btn-nav-theme-toggle"
                onClick={toggleTheme}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-b from-[#ffffff] via-[#f7f4ee] to-[#e4ded2] dark:from-[#1b3a44] dark:via-[#112d36] dark:to-[#07191f] border border-[#d6cfc0] dark:border-[#1e4854] shadow-[0_3px_0_#c3bbb0,0_3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_3px_0_#051318,0_3px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#c3bbb0,inset_0_2px_4px_rgba(0,0,0,0.2)] dark:active:shadow-[0_1px_0_#051318,inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all cursor-pointer select-none"
                title={theme === 'dark' ? 'Switch to White Mode (3D)' : 'Switch to Dark Mode (3D)'}
                aria-label={theme === 'dark' ? 'Switch to White Mode (3D)' : 'Switch to Dark Mode (3D)'}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-linear-to-b from-[#38bdf8] to-[#0284c7] text-white shadow-[0_2px_4px_rgba(2,132,199,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]'
                      : 'bg-linear-to-b from-[#fde047] to-[#eab308] text-[#78350f] shadow-[0_2px_4px_rgba(202,138,4,0.4),inset_0_1px_1px_rgba(255,255,255,0.8)]'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3 h-3 text-white" />
                  ) : (
                    <Moon className="w-3 h-3 text-amber-950" />
                  )}
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase hidden sm:inline text-[#09353e] dark:text-[#f1f5f9] pr-0.5">
                  {theme === 'dark' ? 'Dark 3D' : 'Light 3D'}
                </span>
              </button>

              {/* Wallet quick balance pill */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center gap-2 bg-[#e6f2f0] dark:bg-[#0d2a32] hover:bg-[#d8ebe7] dark:hover:bg-[#123640] text-[#0d5963] dark:text-[#38bdf8] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-[#b8ded7] dark:border-[#1a4450] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>${Number(userStats?.walletBalance ?? 0).toFixed(2)}</span>
              </button>

              {/* User Avatar Button (Opens Information & Profile Settings) */}
              <button
                onClick={() => onNavigate('dashboard', 'settings')}
                className="w-9 h-9 rounded-full overflow-hidden bg-[#e89b27] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#0c5963]/40 transition-all cursor-pointer border border-[#ded8cb] dark:border-[#224450]"
                title={currentUser.email ? `${currentUser.displayName || currentUser.email} - View Profile & Settings` : 'Profile & Settings'}
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
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 3D Theme Toggle for guest */}
              <button
                type="button"
                id="btn-nav-theme-toggle-guest"
                onClick={toggleTheme}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-b from-[#ffffff] via-[#f7f4ee] to-[#e4ded2] dark:from-[#1b3a44] dark:via-[#112d36] dark:to-[#07191f] border border-[#d6cfc0] dark:border-[#1e4854] shadow-[0_3px_0_#c3bbb0,0_3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_3px_0_#051318,0_3px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#c3bbb0,inset_0_2px_4px_rgba(0,0,0,0.2)] dark:active:shadow-[0_1px_0_#051318,inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all cursor-pointer select-none"
                title={theme === 'dark' ? 'Switch to White Mode (3D)' : 'Switch to Dark Mode (3D)'}
                aria-label={theme === 'dark' ? 'Switch to White Mode (3D)' : 'Switch to Dark Mode (3D)'}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-linear-to-b from-[#38bdf8] to-[#0284c7] text-white shadow-[0_2px_4px_rgba(2,132,199,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]'
                      : 'bg-linear-to-b from-[#fde047] to-[#eab308] text-[#78350f] shadow-[0_2px_4px_rgba(202,138,4,0.4),inset_0_1px_1px_rgba(255,255,255,0.8)]'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3 h-3 text-white" />
                  ) : (
                    <Moon className="w-3 h-3 text-amber-950" />
                  )}
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase hidden sm:inline text-[#09353e] dark:text-[#f1f5f9] pr-0.5">
                  {theme === 'dark' ? 'Dark 3D' : 'Light 3D'}
                </span>
              </button>
              <button
                id="btn-nav-signin"
                onClick={() => onNavigate('login')}
                className="px-3.5 py-2 text-sm font-semibold text-[#093e4a] dark:text-white hover:text-[#0b6370] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
              >
                Sign in
              </button>

              <button
                id="btn-nav-getstarted"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c5963] hover:bg-[#08424b] active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-sm shadow-[#0c5963]/20 transition-all cursor-pointer"
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
