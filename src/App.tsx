import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SidebarDrawer from './components/SidebarDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'login' | 'dashboard'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'daily-views' | 'packages' | 'deposit' | 'withdraw'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync with browser hash if present (e.g. #/login, #/dashboard)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash === 'login') {
        setCurrentPage('login');
      } else if (hash.startsWith('dashboard')) {
        setCurrentPage('dashboard');
        const parts = hash.split('/');
        if (parts[1]) {
          setActiveTab(parts[1]);
        }
      } else if (hash === '' || hash === 'home') {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when navigating
  const navigateTo = (page, tab = null) => {
    setCurrentPage(page);
    if (tab) setActiveTab(tab);
    window.location.hash = tab ? `#/${page}/${tab}` : `#/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user signs in while on login page, smoothly transition to dashboard
  useEffect(() => {
    if (currentUser && currentPage === 'login') {
      navigateTo('dashboard');
    }
  }, [currentUser, currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#112d35]">
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

        {currentPage === 'login' && (
          <LoginPage onNavigate={navigateTo} />
        )}

        {currentPage === 'dashboard' && (
          <ProtectedRoute onRedirectToLogin={() => navigateTo('login')}>
            <DashboardPage
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          </ProtectedRoute>
        )}
      </main>

      {/* Global Footer with 2026 Copyright */}
      <Footer onNavigate={navigateTo} />
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
