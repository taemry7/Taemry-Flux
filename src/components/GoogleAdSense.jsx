import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Display Unit Component
 * Client ID: ca-pub-2033676745337447
 * Compliant with Google AdSense Publisher Policies
 */
export default function GoogleAdSense({
  slot = '',
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' },
  label = 'Advertisement',
}) {
  const adRef = useRef(null);
  const isPushed = useRef(false);

  useEffect(() => {
    if (isPushed.current) return;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isPushed.current = true;
      }
    } catch (err) {
      // Benign AdSense duplicate push or adblocker catch
      console.warn('[AdSense] notice:', err?.message || err);
    }
  }, []);

  return (
    <div className={`google-adsense-container w-full overflow-hidden my-3 text-center ${className}`}>
      {label && (
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#788e93] dark:text-[#94a3b8]">
            {label} • Google AdSense
          </span>
        </div>
      )}
      
      <div className="min-h-[90px] bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9]/60 dark:border-[#1f4049]/60 rounded-2xl p-2 flex items-center justify-center relative overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client="ca-pub-2033676745337447"
          data-ad-slot={slot || undefined}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
}
