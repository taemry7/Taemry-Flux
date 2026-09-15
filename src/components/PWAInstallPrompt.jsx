import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, CheckCircle2, ArrowDownToLine, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallPrompt({ currentPage }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Exactly 13 seconds timer: hide completely after 13 seconds ("13 sec karo")
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 13000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for custom open modal event (e.g. from Sidebar drawer)
  useEffect(() => {
    const handleOpenModal = () => {
      setShowModal(true);
    };
    window.addEventListener('taemry_open_pwa_modal', handleOpenModal);
    return () => window.removeEventListener('taemry_open_pwa_modal', handleOpenModal);
  }, []);

  // If already running in standalone / installed PWA mode, do not show floating icon
  if (isInstalled) return null;

  // Handle click on the floating install icon
  // Directly triggers native browser installation prompt or opens the install & create structure modal
  const handleFloatingClick = async () => {
    if (isIOS) {
      setShowModal(true);
      return;
    }

    if (isInstallable) {
      try {
        const accepted = await install();
        if (accepted) {
          setInstallSuccess(true);
          setTimeout(() => setInstallSuccess(false), 3500);
          return;
        }
      } catch (err) {
        console.warn('[Install Trigger Error]:', err);
      }
    }

    // Direct fallback: Open the install & create structure modal
    setShowModal(true);
  };

  return (
    <>
      {/* Animated Floating Install Icon (Hides completely after 5 seconds, ONLY download icon) */}
      <AnimatePresence>
        {isVisible && (
          <motion.aside
            id="pwa-floating-container"
            aria-label="Install App Floating Shortcut"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 25 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed bottom-6 right-5 sm:bottom-7 sm:right-7 z-[9999] pointer-events-auto"
          >
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative group flex items-center justify-center"
            >
              {/* Subtle pulsating glow ring behind the icon */}
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400/50 to-emerald-400/40 blur-[6px] opacity-70 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

              {/* Floating Install Icon Button: ONLY download icon */}
              <button
                type="button"
                id="btn-pwa-install"
                onClick={handleFloatingClick}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 via-[#0c5963] to-[#08353c] hover:from-teal-400 hover:to-[#0c5963] text-white p-2.5 shadow-xl shadow-[#0c5963]/40 border-2 border-teal-300/60 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                title="Install TAEMRY FLUX & Create Shortcut"
                aria-label="Install App"
              >
                {/* ONLY Download Icon */}
                <Download className="w-5 h-5 text-white stroke-[2.5]" />
              </button>

              {/* Tooltip on Hover */}
              <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#0c5963] text-white text-[11px] font-bold tracking-wide whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block border border-teal-400/30">
                Install App & Create Shortcut
              </span>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Install & Create Shortcut Structure Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#faf8f5] dark:bg-[#0a1b22] text-[#132e35] dark:text-[#f1f5f9] rounded-3xl p-6 shadow-2xl border border-[#e4ded2] dark:border-[#173740] overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header with App Logo & Title */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-13 h-13 rounded-2xl bg-[#0c5963] p-1.5 flex items-center justify-center shadow-md border border-teal-400/30 shrink-0">
                  <img
                    src="/pwa-192x192.png"
                    alt="TAEMRY FLUX Icon"
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#0c5963] dark:text-teal-300 leading-tight">
                      Install TAEMRY FLUX
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-700 dark:text-teal-200 border border-teal-400/30">
                      App
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Create Home Screen Shortcut for 1-tap instant access
                  </p>
                </div>
              </div>

              {/* Direct Install Button if Browser Supports Native Prompt */}
              {isInstallable && (
                <div className="mb-4">
                  <button
                    type="button"
                    id="btn-pwa-install-native"
                    onClick={async () => {
                      const accepted = await install();
                      if (accepted) {
                        setShowModal(false);
                        setInstallSuccess(true);
                        setTimeout(() => setInstallSuccess(false), 3500);
                      }
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-xs rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Install & Create Home Screen Icon</span>
                  </button>
                  <p className="text-center text-[10.5px] text-gray-500 dark:text-gray-400 mt-2">
                    or follow the shortcut creation structure below:
                  </p>
                </div>
              )}

              {/* Step-by-Step Install & Create Structure Guide */}
              <div className="space-y-2.5 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {isIOS ? 'Tap the Share Button' : 'Open Browser Menu'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 leading-snug">
                      {isIOS ? (
                        <>
                          Tap the <Share2 className="w-3.5 h-3.5 text-blue-500 inline shrink-0" /> Share icon in Safari toolbar
                        </>
                      ) : (
                        'Tap the three vertical dots (⋮) in your browser top-right'
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Select &quot;Add to Home Screen&quot; or &quot;Install App&quot;
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 leading-snug">
                      <PlusSquare className="w-3.5 h-3.5 text-[#0c5963] dark:text-teal-300 inline shrink-0" />
                      Choose the option to create the shortcut structure
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Confirm & Launch
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      Tap &quot;Add&quot; or &quot;Install&quot;. TAEMRY FLUX shortcut icon is ready on your Home Screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mt-4 w-full py-2.5 px-4 bg-[#0c5963] hover:bg-[#094750] text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer text-center"
              >
                Got It (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Installation Success Notification */}
      {installSuccess && (
        <div className="fixed top-4 right-4 z-[100000] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>TAEMRY FLUX shortcut created on Home Screen!</span>
        </div>
      )}
    </>
  );
}

