import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SidebarDrawer from './components/SidebarDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WhitepaperPage from './pages/WhitepaperPage';
import SupportPage from './pages/SupportPage';
import AdminLayout from './layouts/AdminLayout';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetLabel, setTargetLabel] = useState('');
  const [pendingNav, setPendingNav] = useState<{ page: string; tab?: string | null } | null>(null);

  // Friendly names for display in loader
  const getPageDisplayName = (page: string, tab?: string | null) => {
    if (page === 'home') return 'Home';
    if (page === 'login') return tab === 'signup' ? 'Sign Up' : 'Sign In';
    if (page === 'whitepaper') return 'Whitepaper';
    if (page === 'support') return 'Support';
    if (page === 'dashboard') {
      if (tab === 'deposit') return 'Deposit Funds';
      if (tab === 'withdraw') return 'Withdraw Funds';
      if (tab === 'buy-package') return 'Packages';
      if (tab === 'watch-ads') return 'Daily Ads';
      if (tab === 'referrals') return 'Referrals';
      if (tab === 'transactions') return 'Transactions';
      if (tab === 'profile') return 'Profile';
      return 'Dashboard';
    }
    if (page === 'admin') return 'Admin Portal';
    return page;
  };

  // Sync with browser URL (handles both /admin, /login and #/admin, #/login)
  useEffect(() => {
    const handleLocationChange = () => {
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

  // Update hash when navigating with adaptive loading
  const navigateTo = (page: string, tab: string | null = null) => {
    // If navigating to the exact same page and tab, scroll to top
    if (currentPage === page && (!tab || activeTab === tab)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setTargetLabel(getPageDisplayName(page, tab));
    setPendingNav({ page, tab });
    setIsNavigating(true);
  };

  const handleLoadingFinished = () => {
    if (pendingNav) {
      const { page, tab } = pendingNav;
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
      setPendingNav(null);
    }
    setIsNavigating(false);
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
          isLoading={isInitialLoading || isNavigating}
          targetPage={isInitialLoading ? 'Admin Portal' : targetLabel}
          onFinished={() => {
            if (isInitialLoading) {
              setIsInitialLoading(false);
            } else {
              handleLoadingFinished();
            }
          }}
        />
        <AdminLayout onNavigate={navigateTo} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#112d35]">
      {/* Adaptive Page Transition Loader */}
      <PageLoader
        isLoading={isInitialLoading || isNavigating}
        targetPage={isInitialLoading ? 'TAEMRY FLUX' : targetLabel}
        onFinished={() => {
          if (isInitialLoading) {
            setIsInitialLoading(false);
          } else {
            handleLoadingFinished();
          }
        }}
      />

      {/* Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Sidebar Navigation Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          navigateTo('dashboard', tab);
        }}
        onNavigate={navigateTo}
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
