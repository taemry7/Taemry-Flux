import React, { useState, useEffect } from 'react';

/**
 * PageLoader
 * 
 * Custom page loader requested by user:
 * - When internet is available (normal/fast): finishes loading in 200 milliseconds.
 * - When network is disconnected/offline: stays in loading state until internet is restored.
 */
export default function PageLoader({ isLoading, onFinished }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

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
    if (!isLoading) return;

    // If online, complete loading in exactly 200 milliseconds
    if (isOnline) {
      const timer = setTimeout(() => {
        if (onFinished) {
          onFinished();
        }
      }, 200);

      return () => clearTimeout(timer);
    }
    // If offline, stay in loading state indefinitely until online event fires
  }, [isLoading, isOnline, onFinished]);

  if (!isLoading) return null;

  return (
    <div
      id="page-loader-overlay"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0c5963] select-none transition-opacity duration-150"
      style={{
        backgroundColor: '#0c5963',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Exact User HTML Structure */}
      <div className="loader">
        <div className="loader-outter" />
        <div className="loader-inner" />
      </div>

      {/* Offline network indicator if internet is down */}
      {!isOnline && (
        <div className="mt-6 flex flex-col items-center gap-1.5 text-center px-4 animate-pulse">
          <span className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
            No Internet Connection
          </span>
          <span className="text-[11px] text-gray-400">
            Waiting for network to reconnect...
          </span>
        </div>
      )}
    </div>
  );
}
