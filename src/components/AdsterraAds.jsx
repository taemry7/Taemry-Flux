/**
 * TAEMRY FLUX - Verified Watch Ads Integration
 * 
 * Direct Ad Links:
 * 1. https://www.profitableratecpmnetwork.com/p7zqx848?key=3c7f2a3413418fb1d727cd8caf52d4e5
 * 2. https://furydonkeypharmacy.com/m2yyh6fuzg?key=258f0b8a0d61b6d793930f6153fa4634
 * 
 * Banners:
 * - 468x60 (ae6ca3a4298ab47e37f02d12bbd99e13)
 * - 160x300 (531fd24ab9f16665091f2944cf7cef86)
 * - 160x600 (9d769744d1c1d618a65ef0c57650a877)
 * - 300x250 (e9cc2ce0febb6b96abe85d542e61bf1b)
 * - 728x90 (3488686311db4e94cd243ce7d2cb48c7)
 * - 320x50 (30eb2a290232a12e731eccafb3f7a4e4)
 * 
 * STRICT INVARIANT:
 * - NO popunders, NO notification push ads, NO adult redirects on page clicks!
 * - Ads trigger ONLY when user explicitly clicks "Watch Now" in the Watch Ads section.
 * - Both direct ad links are alternated dynamically across the 200 daily ads.
 * - Countdown verification protects reward crediting.
 */

import React, { useEffect, useRef } from 'react';

export const DIRECT_AD_LINKS = [
  'https://www.profitableratecpmnetwork.com/p7zqx848?key=3c7f2a3413418fb1d727cd8caf52d4e5',
  'https://furydonkeypharmacy.com/m2yyh6fuzg?key=258f0b8a0d61b6d793930f6153fa4634',
  'https://furydonkeypharmacy.com/ibmz0gh3?key=382df18935f3b33da64b35a8d336644c',
];

export function getDirectAdLink(adNumber = 1) {
  const num = Number(adNumber) || 1;
  const idx = (num - 1) % DIRECT_AD_LINKS.length;
  return DIRECT_AD_LINKS[idx < 0 ? 0 : idx];
}

export const BANNER_CONFIGS = {
  '468x60': {
    key: 'ae6ca3a4298ab47e37f02d12bbd99e13',
    width: 468,
    height: 60,
    name: 'Standard Banner (468x60)',
  },
  '160x300': {
    key: '531fd24ab9f16665091f2944cf7cef86',
    width: 160,
    height: 300,
    name: 'Skyscraper (160x300)',
  },
  '160x600': {
    key: '9d769744d1c1d618a65ef0c57650a877',
    width: 160,
    height: 600,
    name: 'Wide Skyscraper (160x600)',
  },
  '300x250': {
    key: 'e9cc2ce0febb6b96abe85d542e61bf1b',
    width: 300,
    height: 250,
    name: 'Medium Rectangle (300x250)',
  },
  '728x90': {
    key: '3488686311db4e94cd243ce7d2cb48c7',
    width: 728,
    height: 90,
    name: 'Leaderboard (728x90)',
  },
  '320x50': {
    key: '30eb2a290232a12e731eccafb3f7a4e4',
    width: 320,
    height: 50,
    name: 'Mobile Banner (320x50)',
  },
};

/**
 * Isolated Iframe Banner component that protects window.atOptions
 * from collision across multiple banner formats.
 */
export function AdsterraBanner({ format = '300x250', className = '', showLabel = true }) {
  const config = BANNER_CONFIGS[format];
  if (!config) return null;

  const { key, width, height } = config;

  const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/${key}/invoke.js"></script>
</body>
</html>`;

  return (
    <div className={`flex flex-col items-center justify-center overflow-hidden my-3 ${className}`}>
      {showLabel && (
        <span className="text-[9px] uppercase tracking-widest font-bold text-[#889ea2] dark:text-[#64748b] mb-1 select-none">
          Sponsored Partner Ad
        </span>
      )}
      <div
        className="overflow-hidden rounded-xl border border-[#e5dfd3] dark:border-[#1e3a43] bg-white/50 dark:bg-[#0c1f26]/50 shadow-2xs flex items-center justify-center"
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
      >
        <iframe
          title={`ad-unit-${key}`}
          srcDoc={htmlDoc}
          width={width}
          height={height}
          style={{
            border: 'none',
            overflow: 'hidden',
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100%',
          }}
          scrolling="no"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/**
 * Responsive Header/Footer Leaderboard Ad:
 * - 728x90 on Desktop/Laptop
 * - 468x60 on Tablets
 * - 320x50 on Mobile devices
 */
export function ResponsiveAdLeaderboard({ className = '', showLabel = true }) {
  return (
    <div className={`w-full flex flex-col items-center justify-center my-3 ${className}`}>
      {/* Desktop 728x90 */}
      <div className="hidden lg:block">
        <AdsterraBanner format="728x90" showLabel={showLabel} />
      </div>

      {/* Tablet 468x60 */}
      <div className="hidden sm:block lg:hidden">
        <AdsterraBanner format="468x60" showLabel={showLabel} />
      </div>

      {/* Mobile 320x50 */}
      <div className="block sm:hidden">
        <AdsterraBanner format="320x50" showLabel={showLabel} />
      </div>
    </div>
  );
}

/**
 * Native Ad Container (Ad Unit #2):
 * Injects invoke.js and renders #container-29f4cbe8df6dafcc91e7ea00058f30b5
 */
export function AdsterraNativeContainer({ className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const scriptId = 'script-adsterra-native-invoke';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl31367146.profitableratecpmnetwork.com/29f4cbe8df6dafcc91e7ea00058f30b5/invoke.js';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className={`w-full rounded-2xl p-3 sm:p-4 bg-white dark:bg-[#0a1c22] border border-[#e3dcd0] dark:border-[#173740] shadow-xs my-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f0ebe0] dark:border-[#173740]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#73888d] dark:text-[#94a3b8]">
          Featured Sponsored Network
        </span>
        <span className="text-[9px] font-bold text-[#0c5963] dark:text-[#2dd4bf] bg-[#e6f4f1] dark:bg-[#0c262e] px-2 py-0.5 rounded-full">
          Verified Ad Feed
        </span>
      </div>
      <div
        id="container-29f4cbe8df6dafcc91e7ea00058f30b5"
        ref={containerRef}
        className="w-full min-h-[90px] overflow-hidden flex items-center justify-center text-xs text-gray-400"
      />
    </div>
  );
}
