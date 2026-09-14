import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallPrompt({ currentPage }) {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowIOSModal(true);
    };
    window.addEventListener('taemry_open_pwa_modal', handleOpenModal);
    return () => window.removeEventListener('taemry_open_pwa_modal', handleOpenModal);
  }, []);

  // If already installed in standalone mode, don't show prompt
  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      // Fallback for browsers where prompt is not yet ready or manual instructions
      setShowIOSModal(true);
    }
  };

  // Only show floating banner on landing/home pages when not dismissed, never inside dashboard
  const showBanner = !isDismissed && currentPage !== 'dashboard';

  return (
    <>
      {/* Floating Bottom Action Banner (English, excluded from dashboard) */}
      {showBanner && (
        <aside
          id="pwa-install-banner"
          aria-label="Install App Prompt"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] bg-[#0c5963] dark:bg-[#07242c] text-white p-4 rounded-2xl shadow-2xl border border-teal-400/30 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3.5">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1 shrink-0 border border-white/20 shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src="/pwa-192x192.png"
                alt="TAEMRY FLUX Icon"
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  Android App
                </span>
              </div>
              <h3 className="font-bold text-sm text-white mt-1 leading-tight">
                Install TAEMRY FLUX
              </h3>
              <p className="text-xs text-teal-100/80 mt-0.5 leading-snug">
                Install to your Home Screen for faster access and a smooth full-screen experience.
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              id="btn-pwa-dismiss"
              onClick={dismiss}
              className="text-teal-200/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/15">
            <button
              type="button"
              id="btn-pwa-install"
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-[#07242c] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install to Home Screen</span>
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2 text-xs font-semibold text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </aside>
      )}

      {/* Manual / iOS Installation Guidance Modal (English) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#faf8f5] dark:bg-[#0a1b22] text-[#132e35] dark:text-[#f1f5f9] rounded-3xl p-6 shadow-2xl border border-[#e4ded2] dark:border-[#173740]">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0c5963] p-1.5 flex items-center justify-center shadow-md">
                <img
                  src="/pwa-192x192.png"
                  alt="App Icon"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0c5963] dark:text-teal-300">
                  Install to Home Screen
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Follow these simple steps:
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {isIOS ? 'Tap the Share icon in Safari' : 'Open the browser menu (three dots)'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {isIOS ? (
                      <>
                        Tap the <Share2 className="w-3.5 h-3.5 text-blue-500 inline" /> Share button at the bottom
                      </>
                    ) : (
                      'Tap the 3 vertical dots in the top right corner'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Select &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <PlusSquare className="w-3.5 h-3.5 text-[#0c5963] dark:text-teal-300 inline" />
                    Tap the option and click &quot;Install&quot; or &quot;Add&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#07151a] border border-[#e8e2d5] dark:border-[#142e37]">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-[#0c5963] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Enjoy native app experience
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    TAEMRY FLUX will be added directly to your mobile home screen.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 px-4 bg-[#0c5963] hover:bg-[#094750] text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              Got It (Close)
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed top-4 right-4 z-[100000] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>App successfully installed to Home Screen!</span>
        </div>
      )}
    </>
  );
}
