import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import CloudMinerPage from './pages/CloudMinerPage';
import AdminLayout from './layouts/AdminLayout';
import PWAInstallPrompt from './components/PWAInstallPrompt';

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

    // Check if referral link was clicked in query or hash
    let hasReferral = false;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('ref') || searchParams.get('referral')) {
        hasReferral = true;
      } else if (window.location.hash && /[?&]ref=/i.test(window.location.hash)) {
        hasReferral = true;
      }
    } catch {}

    if (rawPath === 'admin' || rawPath.startsWith('admin/') || rawHash === 'admin' || rawHash.startsWith('admin/')) {
      return 'admin';
    }
    if (
      hasReferral ||
      rawPath === 'signup' ||
      rawHash === 'signup' ||
      rawHash.startsWith('signup') ||
      rawPath === 'login' ||
      rawHash === 'login' ||
      rawHash.startsWith('login')
    ) {
      return 'login';
    }
    if (rawPath === 'support' || rawHash === 'support') return 'support';
    if (rawPath === 'whitepaper' || rawHash === 'whitepaper') return 'whitepaper';

    // Verify persisted session in storage before allowing member pages (home/dashboard)
    let hasPersistedSession = false;
    try {
      const rawUser = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
      if (rawUser) {
        hasPersistedSession = true;
      }
    } catch {}

    if (hasPersistedSession) {
      if (rawPath.startsWith('dashboard') || rawHash.startsWith('dashboard')) return 'dashboard';
      if (rawPath === 'home' || rawHash === 'home') return 'home';
    }

    // Default first page is always login
    return 'login';
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    let hasReferral = false;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('ref') || searchParams.get('referral')) {
        hasReferral = true;
      } else if (window.location.hash && /[?&]ref=/i.test(window.location.hash)) {
        hasReferral = true;
      }
    } catch {}
    const rawPath = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();
    if (hasReferral || rawPath === 'signup' || rawHash === 'signup' || rawHash.startsWith('signup') || rawHash === 'login/signup') {
      return 'signup';
    }
    return 'overview';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isInitialSplash, setIsInitialSplash] = useState(true);

  const handlePageLoaderFinished = useCallback(() => {
    setIsPageLoading(false);
    setIsInitialSplash(false);
  }, []);

  // Sync with browser URL (handles both /admin, /login and #/admin, #/login)

  useEffect(() => {
    const handleLocationChange = () => {
      // Capture referral code from URL if present (?ref=CODE or #/?ref=CODE)
      let hasReferral = false;
      try {
        if (typeof window !== 'undefined') {
          let refCode: string | null = null;
          if (window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            refCode = searchParams.get('ref') || searchParams.get('referral');
          }
          if (!refCode && window.location.hash) {
            const match = window.location.hash.match(/[?&]ref=([^&#]+)/i);
            if (match && match[1]) {
              refCode = match[1];
            }
          }
          if (refCode && refCode.trim()) {
            const cleanCode = decodeURIComponent(refCode).trim();
            localStorage.setItem('referralCode', cleanCode);
            hasReferral = true;
          }
        }
      } catch (err) {
        console.warn('[Referral Capture Error]:', err);
      }

      // Keep loader hidden on all menu and internal navigation for smooth, instantaneous transitions
      setIsPageLoading(false);

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

      // Direct referral link opening straight to signup
      if (hasReferral && (!rawPath || rawPath === 'home' || rawHash === '' || rawHash === 'home' || rawHash.includes('ref='))) {
        setCurrentPage('login');
        setActiveTab('signup');
        return;
      }

      const effectiveRoute = rawHash || rawPath;

      if (effectiveRoute === 'signup' || effectiveRoute.startsWith('signup/')) {
        setCurrentPage('login');
        setActiveTab('signup');
      } else if (effectiveRoute === 'login' || effectiveRoute.startsWith('login/')) {
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
      } else if (effectiveRoute === 'cloud-miner' || effectiveRoute === 'miner') {
        setCurrentPage('cloud-miner');
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
        let hasPersistedUser = false;
        try {
          const rawUser = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
          if (rawUser) hasPersistedUser = true;
        } catch {}
        if (!hasPersistedUser) {
          setCurrentPage('login');
          setActiveTab('signin');
          return;
        }
        setCurrentPage('dashboard');
        const parts = effectiveRoute.split('/');
        if (parts[1]) {
          setActiveTab(parts[1] === 'packages' ? 'buy-package' : parts[1]);
        } else {
          setActiveTab('overview');
        }
      } else if (effectiveRoute === 'home') {
        let hasPersistedUser = false;
        try {
          const rawUser = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
          if (rawUser) hasPersistedUser = true;
        } catch {}
        if (!hasPersistedUser) {
          setCurrentPage('login');
          setActiveTab('signin');
          return;
        }
        setCurrentPage('home');
      } else if (effectiveRoute === '') {
        setCurrentPage('login');
        setActiveTab('signin');
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

    // Immediately reset scroll to top so incoming page and overlays start at top 0
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }

    // Never show full-screen loader on menu clicks or client route transitions
    setIsPageLoading(false);

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

  // Track previous user reference to instantly detect logout
  const previousUserRef = useRef(currentUser);

  // If user signs in while on login page, smoothly transition to put your wallet in motion page (home)
  useEffect(() => {
    if (currentUser && currentPage === 'login') {
      try {
        if (localStorage.getItem('taemry_selected_package')) {
          navigateTo('dashboard', 'buy-package');
          return;
        }
      } catch {}
      navigateTo('home');
    }
  }, [currentUser, currentPage]);

  // If user logs out (currentUser transitions from authenticated to null), redirect immediately to login
  useEffect(() => {
    if (previousUserRef.current && !currentUser) {
      navigateTo('login', 'signin');
    }
    previousUserRef.current = currentUser;
  }, [currentUser]);

  // Guard member pages if session is absent
  useEffect(() => {
    if (!currentUser && (currentPage === 'home' || currentPage === 'dashboard')) {
      let hasPersistedUser = false;
      try {
        const rawUser = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
        if (rawUser) hasPersistedUser = true;
      } catch {}
      if (!hasPersistedUser) {
        navigateTo('login', 'signin');
      }
    }
  }, [currentUser, currentPage]);

  // If user is on the dedicated admin panel
  if (currentPage === 'admin') {
    return (
      <>
        <PageLoader
          isLoading={isInitialSplash}
          onFinished={handlePageLoaderFinished}
          isInitialSplash={isInitialSplash}
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
      {/* 5s on initial App boot splash; completely absent during smooth menu/tab navigation */}
      <PageLoader
        isLoading={isInitialSplash}
        onFinished={handlePageLoaderFinished}
        isInitialSplash={isInitialSplash}
      />

      {/* Smart Slide Menu (Rendered underneath/alongside the main screen) */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          // Direct instantaneous switch from menu without any loader
          setIsPageLoading(false);
          setActiveTab(tab);
          setCurrentPage('dashboard');
          window.location.hash = `#/${'dashboard'}/${tab}`;
          setIsDrawerOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigate={(page, tab) => {
          // Instantaneous navigation from menu without loader
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

      {/* Online Requirement Notification Banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-[#b45309] text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>No internet connection detected &bull; Active online connection required</span>
        </div>
      )}

      {/* Main Screen (Normal clean layout without splash scale/shrink animation) */}
      <div
        id="mainScreen"
        className="main-screen relative w-full min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#07151a] text-[#112d35] dark:text-[#ecf3f4] z-10"
      >
        {/* Transparent tap-to-close backdrop when menu is open */}
        {isDrawerOpen && (
          <div
            id="menuBackdrop"
            className="menu-backdrop-overlay fixed inset-0 z-40 bg-black/40 backdrop-blur-xs cursor-pointer transition-opacity"
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
          authMode={currentPage === 'login' ? (activeTab === 'signup' ? 'signup' : 'signin') : null}
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

          {currentPage === 'cloud-miner' && (
            <CloudMinerPage onNavigate={navigateTo} />
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

      {/* PWA Android Home Screen Install Banner & Modal */}
      <PWAInstallPrompt currentPage={currentPage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
