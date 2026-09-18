/**
 * TAEMRY FLUX - Sponsor Ad Viewer Modal
 * Displays verified partner sponsor ads with interactive countdown timer.
 * Once the ad is watched, enables the user to claim their reward immediately.
 * 100% clean - zero adult content and zero Adsterra references per user directive.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Timer,
  Loader2,
  AlertTriangle,
  Tv,
  Radio,
  Globe,
  Tag,
} from 'lucide-react';
import { getMonetagAdForNumber, triggerAdScript } from '../config/monetagAds';
import GoogleAdSense from './GoogleAdSense';

const AD_WATCH_DURATION = 6; // 6 seconds active viewing requirement

export default function SponsorAdModal({
  isOpen,
  onClose,
  ad,
  adConfig,
  rewardAmount,
  onClaimReward,
  isClaiming,
  totalAdsLimit = 400,
}) {
  const [countdown, setCountdown] = useState(AD_WATCH_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerRef = useRef(null);

  // Resolved Monetag Ad Unit (from ad.adConfig or rotated index)
  const currentAdConfig = adConfig || ad?.adConfig || (ad ? getMonetagAdForNumber(ad.adNumber) : null);

  // Trigger ad script and start countdown on modal open
  useEffect(() => {
    if (!isOpen || !ad) {
      setCountdown(AD_WATCH_DURATION);
      setIsCompleted(false);
      setShowExitConfirm(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setCountdown(AD_WATCH_DURATION);
    setIsCompleted(false);
    setShowExitConfirm(false);

    // Dynamically inject & trigger Monetag ad script if unit is a script/vignette
    const unit = adConfig || ad?.adConfig || getMonetagAdForNumber(ad.adNumber);
    if (unit && (unit.type === 'script' || unit.type === 'vignette_script')) {
      triggerAdScript(unit);
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, ad?.adNumber]);

  if (!isOpen || !ad) return null;

  const progressPercent = Math.min(100, Math.round(((AD_WATCH_DURATION - countdown) / AD_WATCH_DURATION) * 100));

  const handleCloseAttempt = () => {
    if (isCompleted) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleClaim = () => {
    if (!isCompleted || isClaiming) return;
    onClaimReward(ad.adNumber);
  };

  const handleOpenDirectLink = () => {
    if (currentAdConfig?.url) {
      window.open(currentAdConfig.url, '_blank', 'noopener,noreferrer');
    }
  };

  const sponsorName = currentAdConfig?.name || ad.sponsor || 'Monetag Partner Ad';
  const sponsorCategory = currentAdConfig?.category || ad.category || 'Commercial Verified Ad';
  const isDirectLink = currentAdConfig?.type === 'direct_link';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#082228] rounded-3xl border border-[#d4e5e1] dark:border-[#134e5a] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* TOP STATUS BAR */}
        <div className="px-5 py-3.5 bg-[#f6faf9] dark:bg-[#0a2f37] border-b border-[#e2eee9] dark:border-[#134e5a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#0c5963] dark:text-[#2dd4bf] bg-[#0c5963]/10 dark:bg-[#2dd4bf]/10 px-2.5 py-1 rounded-full border border-[#0c5963]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Monetag Partner</span>
            </span>
            <span className="text-xs font-bold text-[#627d83] dark:text-slate-400">
              Ad #{ad.adNumber} of {totalAdsLimit}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCloseAttempt}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            title="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AD INFO & TITLE */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#09353e] dark:text-white leading-tight">
                  {sponsorName}
                </h3>
                {currentAdConfig?.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0c5963]/10 dark:bg-[#2dd4bf]/20 text-[#0c5963] dark:text-[#2dd4bf]">
                    {currentAdConfig.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526d72] dark:text-slate-400 mt-0.5">
                {sponsorCategory} • Channel #{currentAdConfig?.unitNumber || 1} of 13
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-[#0c5963] dark:text-[#2dd4bf] bg-[#e6f4f1] dark:bg-[#0c5963]/40 px-2.5 py-1 rounded-xl border border-[#0c5963]/30 inline-block">
                +${Number(rewardAmount || ad.reward).toFixed(4)} USD
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS & TIMER BAR */}
        <div className="px-5 py-2">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="flex items-center gap-1.5 text-[#0c5963] dark:text-[#2dd4bf]">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              {isCompleted ? (
                <span className="text-[#059669] dark:text-[#34d399] font-black">
                  Ad Complete! You can claim your reward now.
                </span>
              ) : (
                <span>Watching Ad: {countdown}s remaining...</span>
              )}
            </span>
            <span className="text-xs font-black text-[#09353e] dark:text-white">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isCompleted
                  ? 'bg-linear-to-r from-[#10b981] to-[#059669]'
                  : 'bg-linear-to-r from-[#0c5963] via-[#0f766e] to-[#2dd4bf]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* AD DISPLAY CANVAS */}
        <div className="px-5 py-4 flex-1 flex flex-col justify-center items-center min-h-[260px] bg-linear-to-b from-slate-50 to-slate-100 dark:from-[#05171b] dark:to-[#082228] mx-5 my-2 rounded-2xl border border-slate-200 dark:border-[#134e5a]/60 overflow-hidden relative text-center">
          {isDirectLink ? (
            /* DIRECT LINK AD EXPERIENCE */
            <div className="w-full flex flex-col items-center justify-center p-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-[#09353e] dark:text-white">
                  {currentAdConfig.shortName}
                </h4>
                <p className="text-xs text-[#526d72] dark:text-slate-400 mt-1 max-w-sm">
                  {currentAdConfig.description}
                </p>
              </div>

              {/* Direct Link Click Action Button */}
              <button
                type="button"
                onClick={handleOpenDirectLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#09424a] active:scale-95 text-white text-xs font-bold shadow-md shadow-[#0c5963]/25 transition-all cursor-pointer"
              >
                <span>Open Partner Ad in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11px] text-[#627d83] dark:text-slate-400 font-mono bg-white/70 dark:bg-black/30 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 truncate max-w-xs">
                {currentAdConfig.url}
              </div>
            </div>
          ) : (
            /* SCRIPT / VIGNETTE ZONE AD EXPERIENCE */
            <div className="w-full flex flex-col items-center justify-center p-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0c5963]/10 dark:bg-[#2dd4bf]/10 text-[#0c5963] dark:text-[#2dd4bf] flex items-center justify-center">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-black text-[#09353e] dark:text-white">
                  {currentAdConfig?.shortName || sponsorName}
                </h4>
                <p className="text-xs text-[#526d72] dark:text-slate-400 mt-1 max-w-sm">
                  {currentAdConfig?.description || 'Active Monetag verified commercial ad tag stream'}
                </p>
              </div>

              {currentAdConfig?.zone && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c262e] border border-slate-200 dark:border-[#173740] text-xs font-bold text-[#0c5963] dark:text-[#38bdf8]">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Monetag Zone: {currentAdConfig.zone}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Script Zone Active & Streaming</span>
              </div>
            </div>
          )}

          <div className="w-full pt-3 flex items-center justify-between text-[10px] text-[#718589] dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800 mt-4">
            <span>Powered by Monetag & Google AdSense</span>
            <span>Family-safe • Verified Commercial Ad</span>
          </div>
        </div>

        {/* GOOGLE ADSENSE MODAL DISPLAY UNIT */}
        <div className="px-5 py-1">
          <GoogleAdSense label="Sponsored Network" format="auto" className="my-1" />
        </div>

        {/* EXIT CONFIRMATION OVERLAY */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-[#082228]/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-[#09353e] dark:text-white">
              Exit Ad Before Completion?
            </h4>
            <p className="text-xs text-[#526d72] dark:text-slate-400 max-w-sm mt-1 mb-5">
              You need to watch the ad for {countdown} more second(s) to claim your +${Number(rewardAmount || ad.reward).toFixed(4)} USD reward. If you leave now, reward will not be credited.
            </p>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Continue Watching
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="p-5 bg-[#f6faf9] dark:bg-[#0a2f37] border-t border-[#e2eee9] dark:border-[#134e5a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#526d72] dark:text-slate-400">
            {isCompleted ? (
              <span className="text-[#059669] dark:text-[#34d399] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification complete. Claim your reward!</span>
              </span>
            ) : (
              <span>Ad completion verified in real-time</span>
            )}
          </div>

          <button
            type="button"
            disabled={!isCompleted || isClaiming}
            onClick={handleClaim}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isCompleted
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : isClaiming
                ? 'bg-[#ca8a04] text-white cursor-wait'
                : 'bg-linear-to-r from-[#059669] via-[#10b981] to-[#059669] hover:from-[#047857] hover:to-[#059669] text-white shadow-lg shadow-[#10b981]/30 hover:scale-[1.02] active:scale-[0.99] animate-pulse'
            }`}
          >
            {!isCompleted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Watching Ad ({countdown}s)...</span>
              </>
            ) : isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crediting Reward...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Claim +${Number(rewardAmount || ad.reward).toFixed(4)} USD Reward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

