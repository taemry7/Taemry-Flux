import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Guards dashboard and private screens. Redirects unauthenticated visitors to login.
 */
export default function ProtectedRoute({ children, onRedirectToLogin }) {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser && onRedirectToLogin) {
      onRedirectToLogin();
    }
  }, [loading, currentUser, onRedirectToLogin]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0c5963] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#52666a]">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
