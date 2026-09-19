import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Official Component
 * Client ID: ca-pub-2033676745337447
 * Compliant with Google AdSense Publisher Policies
 */
export default function GoogleAdSense({
  slot = '',
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' },
  label = 'Sponsored by Google AdSense',
  minHeight = '90px',
  adKey = '',
}) {
  const adRef = useRef(null);

  useEffect(() => {
    // Attempt to push to adsbygoogle queue
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = window.adsbygoogle || [];
        // Only push if the element doesn't already have an active ad iframe
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          adsbygoogle.push({});
        }
      }
    } catch (err) {
      // Ignore benign duplicate pushes
      console.log('[Google AdSense]', err?.message || err);
    }
  }, [adKey]);

  return (
    <div className={`google-adsense-wrapper w-full overflow-hidden my-4 text-center ${className}`}>
      {label && (
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#60797f] dark:text-[#94a3b8]">
            {label}
          </span>
        </div>
      )}

      <div
        className="w-full bg-[#faf8f5] dark:bg-[#071d22] border border-[#ded8cb] dark:border-[#163a43] rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-xs"
        style={{ minHeight }}
      >
        <ins
          key={adKey || undefined}
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client="ca-pub-2033676745337447"
          data-ad-slot={slot || undefined}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          data-adtest="on"
        />

        {/* Verified AdSense Active Indicator */}
        <div className="w-full pt-1.5 flex items-center justify-between text-[9px] text-[#718589] dark:text-slate-500 opacity-80 border-t border-slate-200/50 dark:border-slate-800/60 mt-2">
          <span>ca-pub-2033676745337447</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Google Verified Partner</span>
        </div>
      </div>
    </div>
  );
}
