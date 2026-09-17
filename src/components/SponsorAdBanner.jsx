import React, { useState } from 'react';
import { ExternalLink, Sparkles, ShieldCheck, Play, Radio, Check } from 'lucide-react';
import { DIRECT_AD_LINKS, openDirectAdLink } from './AdNetworkLoader';

export default function SponsorAdBanner({ className = '', onAdWatched = null }) {
  const [clickedUrl, setClickedUrl] = useState(null);

  const handleOpenAd = (urlIndex) => {
    const res = openDirectAdLink(urlIndex);
    setClickedUrl(res.url);
    if (onAdWatched) {
      onAdWatched(res.url);
    }
    setTimeout(() => setClickedUrl(null), 4000);
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0c5963]/10 via-[#faf8f5] to-[#e6f4f1] dark:from-[#0a2f38] dark:via-[#07151a] dark:to-[#0d3b45] border border-[#b8dfd7] dark:border-[#1b4e5a] shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info & status */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0c5963] text-white">
              <Sparkles className="w-3 h-3 text-[#38bdf8]" />
              Official Ad Network & Direct Sponsors
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0f766e] dark:text-[#38bdf8] bg-[#ccfbf1] dark:bg-[#134e4a] px-2 py-0.5 rounded-full">
              <Radio className="w-2.5 h-2.5 animate-pulse text-[#10b981]" />
              Live & Verified
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-[#09353e] dark:text-white">
            High-Yield Direct Sponsor Ads & Monetag Partners
          </h3>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] max-w-xl">
            Watch verified direct sponsor campaigns and earn guaranteed daily ad yield credited directly into your wallet balance.
          </p>
        </div>

        {/* Right CTA direct buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAd(0)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0c5963] hover:bg-[#08424b] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#38bdf8] fill-current" />
            <span>Sponsor #1</span>
            <ExternalLink className="w-2.5 h-2.5 text-white/70" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAd(1)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0f766e] hover:bg-[#115e59] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#38bdf8] fill-current" />
            <span>Sponsor #2</span>
            <ExternalLink className="w-2.5 h-2.5 text-white/70" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAd(2)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0e7490] hover:bg-[#155e75] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#38bdf8] fill-current" />
            <span>Sponsor #3</span>
            <ExternalLink className="w-2.5 h-2.5 text-white/70" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAd(3)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#38bdf8] fill-current" />
            <span>Sponsor #4</span>
            <ExternalLink className="w-2.5 h-2.5 text-white/70" />
          </button>
        </div>
      </div>

      {clickedUrl && (
        <div className="mt-3 p-2.5 rounded-xl bg-[#ecfdf5] dark:bg-[#064e3b]/40 border border-[#a7f3d0] dark:border-[#047857] text-[11px] font-bold text-[#065f46] dark:text-[#6ee7b7] flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <span>Sponsor ad opened in new tab. Return here to claim your reward!</span>
        </div>
      )}
    </div>
  );
}
