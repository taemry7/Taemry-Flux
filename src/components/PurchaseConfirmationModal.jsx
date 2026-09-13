/**
 * TAEMRY FLUX - Purchase Confirmation Modal
 * Displays comprehensive details of the selected package, wallet impact calculation,
 * and a prominent 'Confirm' button without any touch or swipe gesture locks.
 */

import React, { useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  PlaySquare,
  Users
} from 'lucide-react';

export default function PurchaseConfirmationModal({
  isOpen,
  onClose,
  packageData,
  walletBalance = 0,
  onConfirm,
  isPurchasing = false,
  onSelectTab
}) {
  // Handle Escape key cleanly without locking body scrolling or touch actions
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPurchasing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isPurchasing, onClose]);

  if (!isOpen || !packageData) return null;

  const pkgPrice = Number(packageData.price || 0);
  const currentBal = Number(walletBalance || 0);
  const canAfford = currentBal >= pkgPrice;
  const balanceAfter = currentBal - pkgPrice;
  const dailyYieldPercent = packageData.rewardRate || '20%';
  const dailyLimit = Number(packageData.dailyLimit || 200);
  const estimatedDailyYield = (pkgPrice * 0.20).toFixed(2);
  const tierDisplayName = packageData.tierName || packageData.name || 'Package';

  return (
    <div 
      id="purchase-confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPurchasing) {
          onClose();
        }
      }}
    >
      <div 
        id="purchase-confirmation-modal"
        className="bg-white dark:bg-[#0a1b22] text-[#09353e] dark:text-[#f1f5f9] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#ded8cb] dark:border-[#173740] shadow-2xl relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#0c5963] dark:text-[#38bdf8] uppercase block">
                Order Review
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#09353e] dark:text-white tracking-tight">
                Purchase Confirmation
              </h3>
            </div>
          </div>

          <button
            id="btn-close-purchase-confirmation"
            type="button"
            onClick={onClose}
            disabled={isPurchasing}
            className="p-2 rounded-xl text-[#7c9095] hover:text-[#09353e] dark:text-[#94a3b8] dark:hover:text-white hover:bg-[#f1ede4] dark:hover:bg-[#12313c] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Spotlight Card */}
        <div className="bg-[#faf8f5] dark:bg-[#081c22] rounded-2xl p-4 sm:p-5 border border-[#e8e2d5] dark:border-[#123640] mb-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#0c5963] dark:text-[#38bdf8]">
                {tierDisplayName} Tier
              </span>
              {packageData.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#fef3c7] dark:bg-[#2e2609] text-[#92400e] dark:text-[#facc15] px-2.5 py-0.5 rounded-full border border-[#fde68a] dark:border-[#713f12]">
                  {packageData.badge}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-[#718589] dark:text-[#94a3b8] uppercase block font-semibold">
                Cost
              </span>
              <span className="text-2xl font-black text-[#09353e] dark:text-white">
                ${pkgPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] leading-relaxed mb-4">
            {packageData.motivationText || packageData.description || 'Activate guaranteed daily returns with automated ad allocation and multi-tier rewards.'}
          </p>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#ebe4d8] dark:border-[#173740] text-center">
            <div className="bg-white dark:bg-[#0a1b22] p-2.5 rounded-xl border border-[#ece6d9] dark:border-[#1a3d47]">
              <span className="text-[9px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">
                Daily Yield
              </span>
              <span className="text-xs font-black text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                {dailyYieldPercent}
              </span>
            </div>

            <div className="hidden bg-white dark:bg-[#0a1b22] p-2.5 rounded-xl border border-[#ece6d9] dark:border-[#1a3d47]">
              <span className="text-[9px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">
                Daily Views
              </span>
              <span className="text-xs font-black text-[#09353e] dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <PlaySquare className="w-3 h-3 text-[#0c5963] dark:text-[#38bdf8]" />
                {dailyLimit} Ads
              </span>
            </div>

            <div className="bg-white dark:bg-[#0a1b22] p-2.5 rounded-xl border border-[#ece6d9] dark:border-[#1a3d47]">
              <span className="text-[9px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">
                Est. Daily
              </span>
              <span className="text-xs font-black text-[#16a34a] dark:text-[#4ade80] mt-0.5 block">
                +${estimatedDailyYield}
              </span>
            </div>

            <div className="hidden bg-white dark:bg-[#0a1b22] p-2.5 rounded-xl border border-[#ece6d9] dark:border-[#1a3d47]">
              <span className="text-[9px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">
                Team Ads
              </span>
              <span className="text-xs font-black text-[#09353e] dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3 h-3 text-[#0c5963] dark:text-[#38bdf8]" />
                5 Levels
              </span>
            </div>
          </div>
        </div>

        {/* Financial Accounting Breakdown */}
        <div className="bg-white dark:bg-[#081a20] rounded-2xl p-4 border border-[#e5dfd3] dark:border-[#173740] space-y-2.5 mb-5 text-xs">
          <div className="flex justify-between items-center text-[#5f757a] dark:text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Current Available Balance</span>
            </span>
            <span className="font-bold text-[#09353e] dark:text-white">
              ${currentBal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#5f757a] dark:text-[#94a3b8]">
            <span>Package Activation Fee</span>
            <span className="font-bold text-[#dc2626] dark:text-[#f87171]">
              -${pkgPrice.toFixed(2)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-[#ece6d9] dark:border-[#173740] flex justify-between items-center text-xs font-bold">
            <span className="text-[#09353e] dark:text-white">
              Remaining Balance After Purchase
            </span>
            <span className={canAfford ? 'text-[#0c5963] dark:text-[#38bdf8] font-black' : 'text-[#dc2626] dark:text-[#f87171] font-black'}>
              ${balanceAfter.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Insufficient Balance Alert */}
        {!canAfford && (
          <div className="mb-5 p-3.5 bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fecaca] dark:border-[#7f1d1d]/50 rounded-2xl flex items-start justify-between gap-3 text-xs text-[#991b1b] dark:text-[#fca5a5]">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Insufficient Wallet Balance</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  You need <strong className="font-extrabold">${(pkgPrice - currentBal).toFixed(2)}</strong> more to activate the {tierDisplayName} tier.
                </p>
              </div>
            </div>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('deposit');
                }}
                className="px-3 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Deposit Now
              </button>
            )}
          </div>
        )}

        {/* Safe Guarantee Note */}
        <div className="hidden items-center gap-2 text-[11px] text-[#526d72] dark:text-[#94a3b8] mb-6 px-1">
          <ShieldCheck className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8] shrink-0" />
          <span>Contract activates immediately with protected lifetime record and automated daily resets.</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3">
          <button
            id="btn-cancel-purchase"
            type="button"
            onClick={onClose}
            disabled={isPurchasing}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-[#556c71] dark:text-[#94a3b8] bg-[#f5f1e8] dark:bg-[#122b33] hover:bg-[#eae3d5] dark:hover:bg-[#183944] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-purchase"
            type="button"
            onClick={onConfirm}
            disabled={isPurchasing || !canAfford}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#0c5963] hover:bg-[#09424a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
