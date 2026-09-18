/**
 * TAEMRY FLUX - Adsterra In-Page Banner Component
 * Displays clean Adsterra banners seamlessly within the Watch Ads directory
 * Responsive: adapts between desktop 728x90 / 468x60 and mobile 320x50 / 300x250
 */

import React from 'react';
import { generateAdsterraHtml, ADSTERRA_ADS } from '../config/adsterraAds';

export default function AdsterraBanner({ unitId = 7, className = '' }) {
  const adConfig = ADSTERRA_ADS.find((a) => a.id === unitId) || ADSTERRA_ADS[6]; // Default unit 7 (728x90)

  // Height based on ad type
  const height = adConfig.height || 90;

  return (
    <div className={`w-full flex flex-col items-center justify-center overflow-hidden my-3 ${className}`}>
      <div className="text-[10px] uppercase font-bold tracking-widest text-[#718589] dark:text-slate-500 mb-1 flex items-center gap-1">
        <span>Sponsored Adsterra Partner</span>
      </div>
      <div
        className="w-full max-w-3xl flex items-center justify-center bg-slate-50/70 dark:bg-[#07242a]/60 rounded-2xl border border-[#d8e8e4] dark:border-[#134e5a] p-1.5 overflow-hidden shadow-xs"
        style={{ minHeight: `${height + 16}px` }}
      >
        <iframe
          title={`Adsterra Banner ${adConfig.name}`}
          srcDoc={generateAdsterraHtml(adConfig)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
          className="w-full border-0 bg-transparent rounded-xl"
          style={{ height: `${height}px`, maxWidth: `${adConfig.width || 728}px` }}
          scrolling="no"
        />
      </div>
    </div>
  );
}
