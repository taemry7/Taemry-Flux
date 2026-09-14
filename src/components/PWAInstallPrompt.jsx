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

  // Only show floating install icon on landing/home pages when not inside dashboard
  const showPrompt = currentPage !== 'dashboard';

  return (
    <>
      {/* Floating Bottom-Right Install Icon on first page */}
      {showPrompt && (
        <aside
          id="pwa-install-banner"
          aria-label="Install TAEMRY FLUX"
          className="fixed bottom-6 right-6 z-[9999] flex items-center group animate-in fade-in zoom-in-95 duration-300"
        >
          {/* Tooltip on hover */}
          <div className="hidden sm:flex items-center gap-1.5 absolute right-full mr-3 px-3 py-1.5 bg-[#07242c]/95 text-teal-200 text-xs font-bold rounded-xl shadow-lg border border-teal-400/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none backdrop-blur-md">
            <span>Install TAEMRY FLUX</span>
          </div>

          {/* Floating Install Icon Button */}
          <button
            type="button"
            id="btn-pwa-install"
            onClick={handleInstallClick}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#0c5963] to-[#13808f] hover:from-[#094750] hover:to-[#0c5963] text-white shadow-2xl hover:shadow-teal-500/25 border-2 border-teal-300/40 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-400/30"
            title="Install TAEMRY FLUX"
            aria-label="Install TAEMRY FLUX"
          >
            <Download className="w-6 h-6 text-white group-hover:translate-y-0.5 transition-transform" />
          </button>
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
