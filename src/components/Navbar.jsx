import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, Wallet, ShieldCheck, User, Sun, Moon, Settings, Bell, X, CheckCheck, MoreVertical, LayoutDashboard, ArrowDownCircle } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenDrawer, onNavigate, currentPage, authMode: externalAuthMode }) {
  const { currentUser, isAdmin, logout, userStats } = useAuth();
  const [currentAuthMode, setCurrentAuthMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('signup')) return 'signup';
      if (hash.includes('signin')) return 'signin';
    }
    return externalAuthMode || 'signin';
  });

  useEffect(() => {
    if (externalAuthMode) {
      setCurrentAuthMode(externalAuthMode);
    }
  }, [externalAuthMode]);

  useEffect(() => {
    const handleAuthModeEvent = (e) => {
      if (e?.detail) {
        setCurrentAuthMode(e.detail);
      }
    };
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('signup')) setCurrentAuthMode('signup');
      else if (hash.includes('signin')) setCurrentAuthMode('signin');
    };
    window.addEventListener('taemry_set_auth_mode', handleAuthModeEvent);
    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('taemry_set_auth_mode', handleAuthModeEvent);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const notificationRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [hasUnread, setHasUnread] = useState(() => {
    return localStorage.getItem('taemry_notifications_status') !== 'read';
  });
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

  const notificationUpdates = [
    {
      id: 1,
      title: 'Daily Ads Rhythm Active',
      desc: '200 daily ads allocation unlocked for active contract packages.',
      time: 'Live',
      isNew: true
    },
    {
      id: 2,
      title: 'Instant Withdrawal Channels',
      desc: 'Local Bank, Easypaisa, JazzCash & Crypto payouts running 24/7.',
      time: '2h ago',
      isNew: false
    },
    {
      id: 3,
      title: 'Team Milestone Rewards',
      desc: 'Reach referral milestones to claim up to $600 directly to your balance.',
      time: '1d ago',
      isNew: false
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showNotifications || showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showMoreMenu]);

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

  const toggleNotificationRead = () => {
    const next = !hasUnread;
    setHasUnread(next);
    localStorage.setItem('taemry_notifications_status', next ? 'unread' : 'read');
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
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="2" />
                <circle cx="13.5" cy="6.5" r="2" />
                <circle cx="6.5" cy="13.5" r="2" />
                <circle cx="13.5" cy="13.5" r="2" />
              </svg>
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
                  className={`hidden items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border transition-all active:scale-95 cursor-pointer ${
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

              {/* Clean Theme Toggle: ONLY Sun / Moon icon, NO 3D, NO text */}
              <button
                type="button"
                id="btn-nav-theme-toggle"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#0c222a] border border-[#ded7ca] dark:border-[#1a3f4a] text-[#4d666b] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-[#38bdf8] hover:bg-[#f5f1e8] dark:hover:bg-[#12313c] transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#09353e]" />
                )}
              </button>

              {/* Notification Updates Icon on Right Side */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  id="btn-nav-notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#0c222a] border border-[#ded7ca] dark:border-[#1a3f4a] text-[#4d666b] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-[#38bdf8] hover:bg-[#f5f1e8] dark:hover:bg-[#12313c] transition-colors cursor-pointer"
                  title="Notification Updates"
                  aria-label="Notification Updates"
                >
                  <Bell className="w-4 h-4" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#07151a]" />
                  )}
                </button>

                {/* Notifications Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-[#0a1c22] border border-[#e5dfd3] dark:border-[#193d48] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f1ece1] dark:border-[#15343d]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                        <span className="text-xs font-bold text-[#09353e] dark:text-white uppercase tracking-wider">
                          Notification Updates
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id="btn-notifications-mark-unread"
                          onClick={toggleNotificationRead}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c5963] dark:text-[#38bdf8] hover:text-[#09353e] dark:hover:text-white bg-[#eef7f6] dark:bg-[#112d36] px-2 py-1 rounded-lg border border-[#cbe4e1] dark:border-[#1e4450] transition-colors cursor-pointer"
                          title={hasUnread ? 'Mark notifications as read' : 'Mark notifications as unread'}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{hasUnread ? 'Mark as read' : 'Mark as unread'}</span>
                        </button>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-[#72888e] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                          aria-label="Close Notifications"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-[#f4f0e6] dark:divide-[#15343d] mt-2 max-h-72 overflow-y-auto">
                      {notificationUpdates.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-start gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              hasUnread && item.isNew
                                ? 'bg-emerald-500'
                                : 'bg-[#94a3b8] dark:bg-[#475569]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9] truncate">
                                {item.title}
                              </p>
                              <span className="text-[10px] text-[#768c91] dark:text-[#64748b] shrink-0 font-medium">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#556e73] dark:text-[#94a3b8] leading-relaxed mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet quick balance pill */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center gap-2 bg-[#e6f2f0] dark:bg-[#0d2a32] hover:bg-[#d8ebe7] dark:hover:bg-[#123640] text-[#0d5963] dark:text-[#38bdf8] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-[#b8ded7] dark:border-[#1a4450] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>${Number(userStats?.walletBalance ?? 0).toFixed(2)}</span>
              </button>

              {/* User Avatar Button (Opens Information & Profile Settings) - Hidden per user directive */}
              <button
                onClick={() => onNavigate('dashboard', 'settings')}
                className="hidden w-9 h-9 rounded-full overflow-hidden bg-[#e89b27] text-white items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#0c5963]/40 transition-all cursor-pointer border border-[#ded8cb] dark:border-[#224450]"
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

              {/* 2x2 Dots More Options Menu - Removed per user request */}
              <div className="relative hidden" ref={moreMenuRef}>
                <button
                  type="button"
                  id="btn-nav-more-menu"
                  className="hidden"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <div className="grid grid-cols-2 gap-[3px] p-0.5" aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Clean Theme Toggle for guest: ONLY Sun / Moon icon, NO 3D, NO text */}
              <button
                type="button"
                id="btn-nav-theme-toggle-guest"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#0c222a] border border-[#ded7ca] dark:border-[#1a3f4a] text-[#4d666b] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-[#38bdf8] hover:bg-[#f5f1e8] dark:hover:bg-[#12313c] transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#09353e]" />
                )}
              </button>

              {/* Hidden sign in button per request */}
              <button
                id="btn-nav-signin"
                onClick={() => onNavigate('login', 'signin')}
                className="hidden"
                aria-hidden="true"
              >
                Sign in
              </button>

              {/* Hidden sign up button per request */}
              <button
                id="btn-nav-signup"
                onClick={() => onNavigate('login', 'signup')}
                className="hidden"
                aria-hidden="true"
              >
                Sign Up
              </button>

              <button
                id="btn-nav-getstarted"
                onClick={() => {
                  const isSignInPage = currentPage === 'login' && currentAuthMode === 'signin';
                  if (isSignInPage) {
                    onNavigate('login', 'signup');
                    setCurrentAuthMode('signup');
                    try {
                      window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: 'signup' }));
                    } catch {}
                  } else {
                    onNavigate('login', 'signin');
                    setCurrentAuthMode('signin');
                    try {
                      window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: 'signin' }));
                    } catch {}
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0c5963] hover:bg-[#08424b] active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-sm shadow-[#0c5963]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="text-white font-semibold leading-none">
                  {currentPage === 'login' && currentAuthMode === 'signin' ? 'Sign Up' : 'Open your wallet'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
