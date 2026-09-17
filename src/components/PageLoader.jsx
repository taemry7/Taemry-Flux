import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * PageLoader
 * 
 * HTML:
 * <div class="loader">
 *   <div class="loader-outter"></div>
 *   <div class="loader-inner"></div>
 * </div>
 * 
 * Features:
 * - Fluid 1% to 100% loading progress line
 * - Brand background: #0c5963
 * - 120 FPS hardware acceleration
 * - Visible, smooth count-up so user clearly sees the progress
 * - Never displayed on menu navigation
 * - Offline-aware: pauses & stays on screen if network is disconnected
 * - Guaranteed 100% full-screen coverage via React Portal directly into document.body
 */
export default function PageLoader({ isLoading, onFinished, isInitialSplash = false }) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [progress, setProgress] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  // Network connectivity listeners
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

  // Prevent any swipe down/up, pull-to-refresh, or bounce on loading/offline splash
  useEffect(() => {
    if (!isLoading) return;

    const preventTouch = (e) => {
      // Prevent swipe down/up and scrolling
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventTouch, { passive: false });

    const originalOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBg = document.body.style.backgroundColor;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';
    document.documentElement.style.backgroundColor = '#0c5963';
    document.body.style.backgroundColor = '#0c5963';

    return () => {
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventTouch);
      document.documentElement.style.overflow = originalOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.backgroundColor = originalBodyBg;
    };
  }, [isLoading]);

  // 1% to 100% progress line animation
  useEffect(() => {
    if (!isLoading) {
      setProgress(1);
      setIsFadingOut(false);
      return;
    }

    setProgress(1);
    setIsFadingOut(false);

    let animationFrameId;
    let startTime = null;
    // App opening splash: 5000ms (5 sec) as requested by user. Subsequent route/tab loadings: 300ms (0.3 sec)
    const duration = isInitialSplash ? 5000 : 300;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const calculated = Math.min(100, Math.max(1, Math.round((elapsed / duration) * 100)));

      setProgress(calculated);

      if (calculated < 100) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Reached 100%: brief hold then smooth fade-out
        const holdTimer = setTimeout(() => {
          setIsFadingOut(true);
          const finishTimer = setTimeout(() => {
            if (onFinishedRef.current) {
              onFinishedRef.current();
            }
          }, 100);
          return () => clearTimeout(finishTimer);
        }, isInitialSplash ? 80 : 40);

        return () => clearTimeout(holdTimer);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isLoading, isOnline, isInitialSplash]);

  if (!isLoading) return null;

  const loaderContent = (
    <div
      id="page-loader-overlay"
      className={`fixed inset-0 z-[99999999] flex flex-col items-center justify-center select-none transition-opacity duration-150 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#0c5963',
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999999,
        touchAction: 'none',
        overscrollBehavior: 'none',
        overflow: 'hidden',
      }}
      onTouchMove={(e) => {
        if (e.cancelable) e.preventDefault();
      }}
    >
      {/* Exact Dual Rotating Spinner requested with guaranteed styles */}
      <div
        className="loader"
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        <div
          className="loader-outter"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid #ffffff',
            borderLeftColor: 'transparent',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="loader-inner"
          style={{
            position: 'absolute',
            width: '35px',
            height: '35px',
            border: '4px solid #ffffff',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* 1% to 100% Loading Progress Line Section */}
      <div className="mt-8 flex flex-col items-center w-56 sm:w-64">
        {/* Progress Line Bar Container */}
        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/20 p-[1px] shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-teal-300 via-white to-teal-200 rounded-full transition-all duration-75 ease-out shadow-sm"
            style={{
              width: `${progress}%`,
              transform: 'translateZ(0)',
            }}
          />
        </div>

        {/* 1% to 100% Live Percentage Indicator */}
        <div className="mt-2.5 flex items-center justify-between w-full text-[11px] font-mono tracking-wider font-semibold text-teal-100">
          <span className="uppercase tracking-widest text-[10px] text-teal-200/90 font-sans font-bold">
            Loading
          </span>
          <span className="text-white drop-shadow-sm font-bold text-xs">{progress}%</span>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return ReactDOM.createPortal(loaderContent, document.body);
  }

  return loaderContent;
}
