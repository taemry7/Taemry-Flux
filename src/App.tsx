import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SidebarDrawer from './components/SidebarDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import WelcomeOnboardingModal from './components/WelcomeOnboardingModal';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WhitepaperPage from './pages/WhitepaperPage';
import SupportPage from './pages/SupportPage';
import AdminLayout from './layouts/AdminLayout';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();
  const [showNewUserWelcome, setShowNewUserWelcome] = useState(() => {
    try {
      return sessionStorage.getItem('taemry_show_new_user_welcome') === 'true';
    } catch {
      return false;
    }
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('taemry_show_new_user_welcome') === 'true') {
        setShowNewUserWelcome(true);
      }
    } catch {}
  }, [currentUser]);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    const rawPath = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();
    if (rawPath === 'admin' || rawPath.startsWith('admin/') || rawHash === 'admin' || rawHash.startsWith('admin/')) {
      return 'admin';
    }
    if (rawPath === 'login' || rawHash === 'login') return 'login';
    if (rawPath === 'support' || rawHash === 'support') return 'support';
    if (rawPath === 'whitepaper' || rawHash === 'whitepaper') return 'whitepaper';
    if (rawPath.startsWith('dashboard') || rawHash.startsWith('dashboard')) return 'dashboard';
    return 'home';
  });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'daily-views' | 'packages' | 'deposit' | 'withdraw'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const isMenuNavigatingRef = useRef(false);

  const handlePageLoaderFinished = useCallback(() => {
    setIsPageLoading(false);
  }, []);

  // Sync with browser URL (handles both /admin, /login and #/admin, #/login)
  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (diff > 65 && !isDrawerOpen && currentUser) {
        setIsDrawerOpen(true);
      } else if (diff < -55 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawerOpen, currentUser]);

  useEffect(() => {
    const handleLocationChange = () => {
      // If navigation came from menu, keep loader hidden; otherwise trigger visible page loader
      if (isMenuNavigatingRef.current) {
        isMenuNavigatingRef.current = false;
      } else {
        setIsPageLoading(true);
      }

      const rawPath = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
      const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();

      // Check if user is navigating directly to admin (e.g. /admin or #/admin)
      if (rawPath === 'admin' || rawPath.startsWith('admin/') || rawHash === 'admin' || rawHash.startsWith('admin/')) {
        setCurrentPage('admin');
        const parts = (rawHash.startsWith('admin') ? rawHash : rawPath).split('/');
        if (parts[1]) {
          setActiveTab(parts[1]);
        }
        return;
      }

      const effectiveRoute = rawHash || rawPath;

      if (effectiveRoute === 'login' || effectiveRoute.startsWith('login/')) {
        setCurrentPage('login');
        const parts = effectiveRoute.split('/');
        if (parts[1]) {
          setActiveTab(parts[1]);
        } else {
          setActiveTab('signin');
        }
      } else if (effectiveRoute === 'whitepaper') {
        setCurrentPage('whitepaper');
      } else if (effectiveRoute === 'support') {
        setCurrentPage('support');
      } else if (effectiveRoute === 'buy-package') {
        setCurrentPage('dashboard');
        setActiveTab('buy-package');
      } else if (effectiveRoute === 'watch-ads') {
        setCurrentPage('dashboard');
        setActiveTab('watch-ads');
      } else if (effectiveRoute === 'referrals') {
        setCurrentPage('dashboard');
        setActiveTab('referrals');
      } else if (effectiveRoute === 'milestones') {
        setCurrentPage('dashboard');
        setActiveTab('milestones');
      } else if (effectiveRoute === 'deposit') {
        setCurrentPage('dashboard');
        setActiveTab('deposit');
      } else if (effectiveRoute === 'withdraw') {
        setCurrentPage('dashboard');
        setActiveTab('withdraw');
      } else if (effectiveRoute === 'transactions') {
        setCurrentPage('dashboard');
        setActiveTab('transactions');
      } else if (effectiveRoute === 'leaderboard') {
        setCurrentPage('dashboard');
        setActiveTab('leaderboard');
      } else if (effectiveRoute.startsWith('dashboard')) {
        setCurrentPage('dashboard');
        const parts = effectiveRoute.split('/');
        if (parts[1]) {
          setActiveTab(parts[1] === 'packages' ? 'buy-package' : parts[1]);
        } else {
          setActiveTab('overview');
        }
      } else if (effectiveRoute === '' || effectiveRoute === 'home') {
        setCurrentPage('home');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Update hash when navigating (fromMenu flag prevents loader)
  const navigateTo = (page: string, tab: string | null = null, fromMenu: boolean = false) => {
    // If navigating to the exact same page and tab, scroll to top
    if (currentPage === page && (!tab || activeTab === tab)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Do NOT show loader if navigating from menu
    if (fromMenu) {
      isMenuNavigatingRef.current = true;
      setIsPageLoading(false);
    } else {
      isMenuNavigatingRef.current = false;
      setIsPageLoading(true);
    }

    setCurrentPage(page);
    if (page === 'dashboard') {
      setActiveTab(tab || 'overview');
    } else if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview');
    }
    window.location.hash = tab ? `#/${page}/${tab}` : `#/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user signs in while on login page, smoothly transition to member dashboard
  useEffect(() => {
    if (currentUser && currentPage === 'login') {
      navigateTo('dashboard', 'overview');
    }
  }, [currentUser, currentPage]);

  // If user is on the dedicated admin panel
  if (currentPage === 'admin') {
    return (
      <>
        <PageLoader
          isLoading={isPageLoading || !isOnline}
          onFinished={handlePageLoaderFinished}
        />
        <AdminLayout onNavigate={navigateTo} />
      </>
    );
  }

  return (
    <div
      id="appViewport"
      className={`app-viewport relative w-full min-h-screen overflow-x-hidden bg-[#faf8f5] dark:bg-[#07151a] transition-colors ${
        isDrawerOpen ? 'menu-open' : ''
      }`}
    >
      {/* Network-Aware 200ms Page Loader (Offline persistent, 200ms on fast/normal network, hidden on menu) */}
      <PageLoader
        isLoading={isPageLoading || !isOnline}
        onFinished={handlePageLoaderFinished}
      />

      {/* Smart Slide Menu (Rendered underneath/alongside the main screen) */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          // Direct instantaneous switch from menu without any loader
          isMenuNavigatingRef.current = true;
          setIsPageLoading(false);
          setActiveTab(tab);
          setCurrentPage('dashboard');
          window.location.hash = `#/${'dashboard'}/${tab}`;
          setIsDrawerOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigate={(page, tab) => {
          // Instantaneous navigation from menu without loader
          isMenuNavigatingRef.current = true;
          setIsPageLoading(false);
          setIsDrawerOpen(false);
          navigateTo(page, tab, true);
        }}
      />

      {/* 3D Welcome Splash & Full Name Onboarding for newly registered users */}
      <WelcomeOnboardingModal
        isOpen={showNewUserWelcome}
        onComplete={() => {
          try {
            sessionStorage.removeItem('taemry_show_new_user_welcome');
          } catch {}
          setShowNewUserWelcome(false);
          setCurrentPage('dashboard');
          setActiveTab('overview');
          window.location.hash = '#/dashboard/overview';
        }}
      />

      {/* Offline Connectivity Notification Banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-[#b45309] text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>No internet connection detected &bull; Using offline cached mode</span>
        </div>
      )}

      {/* Main Screen (Scales down and slides to the right with 3D perspective shadow) */}
      <div
        id="mainScreen"
        className={`main-screen relative w-full min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#07151a] text-[#112d35] dark:text-[#ecf3f4] transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.3,1.15)] origin-left z-20 ${
          isDrawerOpen
            ? 'scale-[0.82] sm:scale-[0.84] translate-x-[76%] sm:translate-x-[320px] rounded-[28px] shadow-[-20px_25px_50px_rgba(0,0,0,0.55)] cursor-pointer overflow-hidden max-h-screen select-none ring-1 ring-black/5 dark:ring-white/10'
            : 'scale-100 translate-x-0 rounded-none shadow-none'
        }`}
      >
        {/* Transparent tap-to-close backdrop when menu is open */}
        {isDrawerOpen && (
          <div
            id="menuBackdrop"
            className="menu-backdrop-overlay absolute inset-0 z-50 bg-black/15 dark:bg-black/35 backdrop-blur-[1px] cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsDrawerOpen(false);
            }}
            aria-label="Close menu backdrop"
          />
        )}

        {/* Top Navigation Bar */}
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        {/* Main Page Routing */}
        <main className="flex-1">
          {currentPage === 'home' && (
            <HomePage onNavigate={navigateTo} />
          )}

          {currentPage === 'whitepaper' && (
            <WhitepaperPage onNavigate={navigateTo} />
          )}

          {currentPage === 'support' && (
            <SupportPage onNavigate={navigateTo} />
          )}

          {currentPage === 'login' && (
            <LoginPage onNavigate={navigateTo} initialMode={activeTab === 'signup' ? 'signup' : 'signin'} />
          )}

          {currentPage === 'dashboard' && (
            <ProtectedRoute onRedirectToLogin={() => navigateTo('login')}>
              <DashboardPage
                activeTab={activeTab}
                onSelectTab={(tab) => setActiveTab(tab)}
                onNavigate={navigateTo}
              />
            </ProtectedRoute>
          )}
        </main>

        {/* Global Footer with 2026 Copyright */}
        <Footer onNavigate={navigateTo} currentPage={currentPage} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
