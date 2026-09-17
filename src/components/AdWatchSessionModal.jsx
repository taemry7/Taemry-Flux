/**
 * TAEMRY FLUX - Ad Watch & Verified Countdown Session Modal
 * 
 * Supports both sponsor direct ad links:
 * - Link 1: https://www.profitableratecpmnetwork.com/p7zqx848?key=3c7f2a3413418fb1d727cd8caf52d4e5
 * - Link 2: https://furydonkeypharmacy.com/m2yyh6fuzg?key=258f0b8a0d61b6d793930f6153fa4634
 * 
 * Features:
 * - Alternates between Link 1 and Link 2 across the 200 daily ads
 * - Strictly NO popunders or adult push notifications on general pages
 * - Live on-screen 15-second view countdown with animated progress bar
 * - Displays live Adsterra 300x250 Medium Rectangle inside modal
 * - Blocks reward until countdown timer completes ("ads dek kar osko reward mely ga pehly nhi mely ga OK")
 * - Submits authenticated claim to backend API only upon verified completion
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Tv,
} from 'lucide-react';
import { getDirectAdLink, AdsterraBanner } from './AdsterraAds';

export default function AdWatchSessionModal({
  isOpen,
  adData,
  onCompleteReward,
  onClose,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOpenedAdTab, setHasOpenedAdTab] = useState(false);
  const timerRef = useRef(null);

  const TOTAL_SECONDS = 15;
  const targetAdUrl = adData ? getDirectAdLink(adData.adNumber) : '';

  // Initialize session whenever modal opens with adData
  useEffect(() => {
    if (isOpen && adData) {
      setSecondsRemaining(TOTAL_SECONDS);
      setIsTimerFinished(false);
      setIsSubmitting(false);

      const adUrl = getDirectAdLink(adData.adNumber);

      // Attempt to open the specific Direct Ad Link in a new tab
      try {
        const win = window.open(adUrl, '_blank', 'noopener,noreferrer');
        if (win) {
          setHasOpenedAdTab(true);
        } else {
          setHasOpenedAdTab(false);
        }
      } catch {
        setHasOpenedAdTab(false);
      }

      // Start countdown
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timerRef.current);
      };
    }
  }, [isOpen, adData]);

  if (!isOpen || !adData) return null;

  const progressPercentage = Math.round(
    ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100
  );

  const handleManualOpenAd = () => {
    try {
      window.open(targetAdUrl, '_blank', 'noopener,noreferrer');
      setHasOpenedAdTab(true);
    } catch (e) {
      console.error('Could not open ad link:', e);
    }
  };

  const handleClaim = async () => {
    if (!isTimerFinished || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCompleteReward(adData.adNumber);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEarlyClose = () => {
    if (!isTimerFinished) {
      const confirmAbort = window.confirm(
        'Warning: The ad timer has not finished yet. If you close now, you will NOT receive the reward for this ad. Are you sure you want to exit?'
      );
      if (!confirmAbort) return;
    }
    clearInterval(timerRef.current);
    onClose();
  };

  const adIdx = ((Number(adData.adNumber) || 1) - 1) % 3;
  const sponsorNetworkLabel =
    adIdx === 0
      ? 'Profitable CPM Network'
      : adIdx === 1
      ? 'FuryDonkey Pharmacy Network #1'
      : 'FuryDonkey Pharmacy Network #2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0a1c22] rounded-3xl border border-[#e4ded2] dark:border-[#173740] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#faf8f5] dark:bg-[#07151a] border-b border-[#eee8dd] dark:border-[#173740] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0c5963] text-white flex items-center justify-center font-bold shadow-xs">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#09353e] dark:text-white flex items-center gap-1.5">
                <span>Ad #{adData.adNumber}</span>
                <span className="text-[10px] font-bold text-[#0c5963] dark:text-[#2dd4bf] bg-[#e6f4f1] dark:bg-[#0c262e] px-2 py-0.5 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
                  +{adData.reward ? `$${Number(adData.reward).toFixed(4)}` : 'Reward'}
                </span>
              </h3>
              <p className="text-[11px] text-[#718589] dark:text-[#94a3b8] truncate max-w-[240px]">
                {sponsorNetworkLabel}
              </p>
            </div>
          </div>

          <button
            onClick={handleEarlyClose}
            className="p-1.5 rounded-xl text-[#718589] hover:text-[#09353e] dark:hover:text-white hover:bg-[#eee8dd] dark:hover:bg-[#122e37] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          {/* Progress / Timer Status Box */}
          <div className="p-4 rounded-2xl bg-[#f5f1e8] dark:bg-[#0c2027] border border-[#e7e1d4] dark:border-[#173740]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
                {isTimerFinished ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    <span>Ad View Verified!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8] animate-pulse" />
                    <span>Viewing Ad Verification</span>
                  </>
                )}
              </span>

              <span className="text-xs font-mono font-black text-[#0c5963] dark:text-[#2dd4bf]">
                {isTimerFinished ? '00:00' : `00:${String(secondsRemaining).padStart(2, '0')}`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#e3dcd0] dark:bg-[#173740] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isTimerFinished
                    ? 'bg-[#16a34a]'
                    : 'bg-linear-to-r from-[#0c5963] to-[#2dd4bf]'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-[11px] text-[#526b70] dark:text-[#94a3b8] mt-2 leading-relaxed">
              {isTimerFinished ? (
                <strong className="text-[#16a34a] dark:text-[#4ade80]">
                  Verification complete! You watched this ad. Click below to claim your reward.
                </strong>
              ) : (
                <>
                  Viewing sponsored ad. Reward will only be credited after the <strong>{secondsRemaining}s</strong> timer finishes.
                </>
              )}
            </p>
          </div>

          {/* Direct Link Pop-up trigger if blocked by browser */}
          {!hasOpenedAdTab && !isTimerFinished && (
            <div className="p-3 rounded-xl bg-[#fffbeb] dark:bg-[#2d2208] border border-[#fde68a] text-left flex items-center justify-between gap-2 text-xs text-[#92400e] dark:text-[#fde047]">
              <span>Sponsored ad tab didn't open?</span>
              <button
                type="button"
                onClick={handleManualOpenAd}
                className="px-2.5 py-1 bg-[#d97706] hover:bg-[#b45309] text-white text-[11px] font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Ad</span>
              </button>
            </div>
          )}

          {/* Embedded Adsterra 300x250 Rectangle Ad Unit #8 inside Modal */}
          <div className="pt-1">
            <AdsterraBanner format="300x250" showLabel={true} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#faf8f5] dark:bg-[#07151a] border-t border-[#eee8dd] dark:border-[#173740] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleEarlyClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#718589] hover:text-[#09353e] dark:hover:text-white transition-colors cursor-pointer"
          >
            {isTimerFinished ? 'Cancel' : 'Cancel (No Reward)'}
          </button>

          {isTimerFinished ? (
            <button
              id="btn-claim-ad-reward"
              type="button"
              disabled={isSubmitting}
              onClick={handleClaim}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Crediting Reward...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Claim +${Number(adData.reward || 0).toFixed(4)} USD Reward</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-5 py-2.5 bg-[#d8d1c3] dark:bg-[#1b3b44] text-[#718589] dark:text-[#94a3b8] text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Viewing Ad ({secondsRemaining}s)...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
