/**
 * TAEMRY FLUX - Withdrawal System (Phase 4)
 * Enforces referral threshold rules (>= 1 active referral), daily frequency limit,
 * 5-minute request cooldown, wallet balance checks, and local PKR calculation.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  AlertTriangle,
  Building2,
  Smartphone,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Users,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronDown,
  Share2,
  Sparkles,
  AtSign,
  Lock,
  ShieldCheck,
  PlaySquare,
  UserPlus
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleAdSense from '../components/GoogleAdSense';
import { formatCurrency } from '../config/milestones.config';

export default function WithdrawPage({ onSelectTab, onNavigate }) {
  const { userStats, fetchUserStats } = useAuth();
  const toast = useToast();

  // Form State
  const [method, setMethod] = useState('jazzcash');
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [amountUSD, setAmountUSD] = useState('');

  // Payment methods catalog (strictly without icons)
  const paymentMethodsList = [
    {
      id: 'jazzcash',
      name: 'JazzCash',
      badge: 'Active • Instant',
      description: 'Official Account Transfer',
      isAvailable: true,
    },
    {
      id: 'upaisa',
      name: 'UPaisa',
      badge: 'Active • Instant',
      description: 'Official Account Transfer',
      isAvailable: true,
    },
    {
      id: 'easypaisa',
      name: 'Easypaisa',
      badge: 'Active • Instant',
      description: 'Official Account Transfer',
      isAvailable: true,
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      badge: 'Not Available for Now',
      description: 'Direct Commercial Bank Wire',
      isAvailable: false,
    },
    {
      id: 'crypto',
      name: 'Crypto (USDT)',
      badge: 'Not Available for Now',
      description: 'Tether TRC20 / BEP20 Network',
      isAvailable: false,
    },
  ];

  const currentMethodObj = paymentMethodsList.find((m) => m.id === method) || paymentMethodsList[0];

  // Data & Status State
  const [settings, setSettings] = useState({
    exchangeRate: 300,
    minWithdrawal: 1.00,
    maxWithdrawal: 1000.00,
    withdrawalCooldownMinutes: 5,
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Load user withdrawals & settings
  const loadWithdrawalData = async () => {
    try {
      setLoadingHistory(true);
      const [settingsRes, historyRes] = await Promise.all([
        apiClient.get('/settings').catch(() => null),
        apiClient.get('/withdrawals/my-withdrawals').catch(() => null),
      ]);

      if (settingsRes?.data?.settings) {
        setSettings(settingsRes.data.settings);
      }

      if (historyRes?.data?.withdrawals) {
        setWithdrawals(historyRes.data.withdrawals);
      }
    } catch (err) {
      console.warn('Error loading withdrawal info:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const referralCount = Number(userStats?.referralCount) || 0;
  const walletBalance = Number(userStats?.walletBalance) || 0;
  const totalEarned = Number(userStats?.totalEarned) || 0;
  const hasActivePackage = Boolean(userStats?.currentPackage && userStats?.currentPackage !== 'None' && userStats?.currentPackage !== 'No Package');
  const isUserAdmin = userStats?.role === 'admin' || userStats?.isAdmin;

  // STRICT INVARIANT (UPDATED): Ineligible by default. Even when package is bought,
  // user remains Ineligible until:
  // 1. They have earned at least $1.00 (from watching ads or team matching yield)
  // 2. They have referred at least 1 member (1 referral = permanent eligibility unlocked forever)
  // Once $1.00 is earned AND 1 referral is achieved, the full withdrawal system is shown and unlocked.
  const minEarnedRequired = 1.00;
  const hasEarnedMinimum = totalEarned >= minEarnedRequired;
  const hasRequiredReferral = referralCount >= 1 || Boolean(userStats?.hasUnlockedWithdrawal);
  const isEligible = isUserAdmin || (hasActivePackage && hasEarnedMinimum && hasRequiredReferral);

  // Ultra-Short Direct @Username Link
  const cleanUsername = (
    userStats?.username ||
    userStats?.displayName ||
    userStats?.referralCode ||
    userStats?.email?.split('@')[0] ||
    'sponsor'
  ).replace(/^@/, '').trim();

  const ultraShortLink = `${window.location.origin}/@${encodeURIComponent(cleanUsername)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(ultraShortLink);
    setCopiedLink(true);
    toast.success('Ultra-Short Direct @Username Link copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareLink = async () => {
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads & mining crypto! Sponsor: @${cleanUsername}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TAEMRY FLUX',
          text: shareText,
          url: ultraShortLink,
        });
      } catch (err) {
        // User cancelled or share dismissed
      }
    } else {
      handleWhatsAppShare();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Join TAEMRY FLUX - Earn guaranteed daily returns & mine crypto! Sponsor: @${cleanUsername}\n${ultraShortLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Calculated conversions
  const exchangeRate = settings.exchangeRate || 300;
  const numUSD = parseFloat(amountUSD) || 0;
  const isLocal = ['bank', 'jazzcash', 'upaisa', 'easypaisa'].includes(method);
  const calculatedPKR = Math.round(numUSD * exchangeRate);

  // Submit withdrawal
  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    // Ineligible check triggered on button click
    if (!isEligible) {
      let msg = '';
      if (!hasActivePackage) {
        msg = 'Ineligible: An active package is required to unlock withdrawals. Please buy a package first.';
      } else if (!hasEarnedMinimum) {
        msg = `Ineligible: You must earn at least $1.00 to unlock withdrawals. Currently earned: $${totalEarned.toFixed(2)} / $1.00. Please watch ads to earn!`;
      } else if (!hasRequiredReferral) {
        msg = 'Ineligible: You need at least 1 active referral to unlock withdrawals. Once you refer 1 member, your account is permanently eligible forever!';
      }
      setNotification({
        type: 'error',
        message: msg,
      });
      toast.error(msg);
      return;
    }

    if (method === 'bank' || method === 'crypto') {
      setNotification({
        type: 'error',
        message: 'Not Available for Now. Please select JazzCash, UPaisa, or Easypaisa.',
      });
      return;
    }

    if (method !== 'crypto') {
      if (!accountName || !accountName.trim()) {
        setNotification({
          type: 'error',
          message: 'Please enter your Account Holder Name before submitting.',
        });
        toast.error('Account Holder Name cannot be left empty.');
        return;
      }
      if (!accountNumber || !accountNumber.trim()) {
        setNotification({
          type: 'error',
          message: 'Please enter your Account Number before submitting.',
        });
        toast.error('Account Number cannot be left empty.');
        return;
      }
    } else {
      if (!walletAddress || !walletAddress.trim()) {
        setNotification({
          type: 'error',
          message: 'Please enter your USDT Wallet Address before submitting.',
        });
        toast.error('USDT Wallet Address cannot be left empty.');
        return;
      }
    }

    if (!amountUSD || isNaN(numUSD) || numUSD < (settings.minWithdrawal || 1) || numUSD > (settings.maxWithdrawal || 1000)) {
      setNotification({
        type: 'error',
        message: `Withdrawal amount must be between $${settings.minWithdrawal || 1} and $${settings.maxWithdrawal || 1000} USD.`,
      });
      return;
    }

    if (numUSD > walletBalance) {
      setNotification({
        type: 'error',
        message: `Requested amount ($${numUSD.toFixed(2)}) exceeds your available wallet balance ($${walletBalance.toFixed(2)}).`,
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        method,
        accountName: method === 'crypto' ? 'Crypto Recipient' : accountName,
        accountNumber: method === 'crypto' ? walletAddress : accountNumber,
        walletAddress: method === 'crypto' ? walletAddress : '',
        amountUSD: numUSD,
      };

      const res = await apiClient.post('/withdrawals/request', payload);

      if (res.data?.success) {
        toast.success('Withdrawal request submitted! Wait for admin approval.');
        setNotification({
          type: 'success',
          message: 'Withdrawal request submitted! Wait for admin approval.',
        });

        // Reset inputs
        setAmountUSD('');
        setAccountName('');
        setAccountNumber('');
        setWalletAddress('');

        // Reload data & refresh user balance
        loadWithdrawalData();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Withdrawal request error:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit withdrawal request. Please check requirements.';
      toast.error(errMsg);
      setNotification({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Payout Gateway
            </span>
            <span className="text-xs font-semibold text-[#5a7277]">
              Available: <strong>{formatCurrency(walletBalance)}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Withdraw Funds & Payouts
          </h1>
        </div>

        <button
          onClick={loadWithdrawalData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#ede7dc] text-[#526d72] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]'
              : 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: '', message: '' })}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ⚠️ STRICT REQUIREMENT SCREEN: Rendered ONLY when user is not eligible */}
      {!isEligible ? (
        <div className="space-y-6">
          {/* Main Locked Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0ebe0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#09353e] tracking-tight">
                      Withdrawal Gateway Locked
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
                      2 Requirements Required
                    </span>
                  </div>
                  <p className="text-xs text-[#526d72] mt-1">
                    To unlock the withdrawal system, your account must meet two simple milestones: earn at least $1.00 and refer 1 member.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-3 py-1.5 rounded-xl border border-[#b8dfd7]">
                  Available: {formatCurrency(walletBalance)}
                </span>
              </div>
            </div>

            {/* 2 Requirement Milestones Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* REQUIREMENT 1: MINIMUM $1.00 EARNED */}
              <div className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                hasEarnedMinimum
                  ? 'bg-[#f0fdf4] border-[#86efac]'
                  : 'bg-[#faf8f5] border-[#e4ded2]'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        hasEarnedMinimum
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#e6f4f1] text-[#0c5963]'
                      }`}>
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#718589] block">
                          Requirement 1
                        </span>
                        <h3 className="text-sm font-extrabold text-[#09353e]">
                          Earn Minimum $1.00
                        </h3>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      hasEarnedMinimum
                        ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                        : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
                    }`}>
                      {hasEarnedMinimum ? 'Completed ✅' : 'Incomplete ⏳'}
                    </span>
                  </div>

                  <p className="text-xs text-[#526d72] leading-relaxed">
                    Watch daily sponsored ads or earn team matching commissions to reach at least <strong>$1.00</strong> in earnings.
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#09353e]">
                      <span>Earnings Progress</span>
                      <span>${totalEarned.toFixed(2)} / $1.00 ({Math.min(100, Math.round((totalEarned / 1.00) * 100))}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#e8e2d5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (totalEarned / 1.00) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {onSelectTab && (
                  <button
                    type="button"
                    onClick={() => onSelectTab(hasActivePackage ? 'watch-ads' : 'buy-package')}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
                      hasEarnedMinimum
                        ? 'bg-white text-[#15803d] border border-[#86efac] hover:bg-[#f0fdf4]'
                        : 'bg-[#0c5963] hover:bg-[#08424b] text-white'
                    }`}
                  >
                    <PlaySquare className="w-4 h-4" />
                    <span>{hasActivePackage ? 'Go to Watch Ads & Earn ($1.00)' : 'Activate Package to Start'}</span>
                  </button>
                )}
              </div>

              {/* REQUIREMENT 2: 1 ACTIVE REFERRAL */}
              <div className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                hasRequiredReferral
                  ? 'bg-[#f0fdf4] border-[#86efac]'
                  : 'bg-[#faf8f5] border-[#e4ded2]'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        hasRequiredReferral
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#f3e8ff] text-[#7e22ce]'
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#718589] block">
                          Requirement 2
                        </span>
                        <h3 className="text-sm font-extrabold text-[#09353e]">
                          1 Active Referral Required
                        </h3>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      hasRequiredReferral
                        ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                        : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
                    }`}>
                      {hasRequiredReferral ? 'Completed ✅' : '1 Needed ⏳'}
                    </span>
                  </div>

                  <p className="text-xs text-[#526d72] leading-relaxed">
                    Invite at least 1 friend or member using your personal referral link. <strong>1 referral unlocks withdrawals permanently forever!</strong>
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#09353e]">
                      <span>Referral Progress</span>
                      <span>{referralCount} / 1 Referral ({referralCount >= 1 ? 100 : 0}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#e8e2d5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, referralCount * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Referral Link & Share Tools */}
                <div className="space-y-2 pt-1 border-t border-[#f0ebe0]">
                  <div className="p-2.5 bg-white rounded-xl border border-[#ece6d9] font-mono text-[11px] font-bold text-[#09353e] truncate select-all">
                    {ultraShortLink}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-2 px-2 bg-[#0c5963] hover:bg-[#08424b] text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="py-2 px-2 bg-[#112d35] hover:bg-[#091b20] text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="py-2 px-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Permanent Eligibility Guarantee Box */}
            <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-black text-[#14532d]">
                  Permanent Lifetime Eligibility Rule:
                </strong>
                You only need to satisfy these requirements once. Once you reach <strong>$1.00 in earnings</strong> and <strong>1 active referral</strong>, the full withdrawal system (JazzCash, UPaisa, Easypaisa) will unlock automatically and stay unlocked permanently forever!
              </div>
            </div>
          </div>

          {/* Historical Table if previous withdrawals exist */}
          {withdrawals.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#09353e]">
                    Previous Withdrawal Requests
                  </h3>
                  <p className="text-xs text-[#718589]">
                    Track your last 5 withdrawal submissions and payout statuses
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-1 rounded-full border border-[#b8dfd7]">
                  {withdrawals.length} entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f0ebe0] text-[#718589] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Account / Address</th>
                      <th className="py-3 px-3">Amount USD</th>
                      <th className="py-3 px-3">Amount PKR</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f1e8]">
                    {withdrawals.slice(0, 5).map((w) => (
                      <tr key={w.id} className="hover:bg-[#faf8f5]">
                        <td className="py-3 px-3 text-[#526d72] font-mono whitespace-nowrap">
                          {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#09353e] uppercase">
                          {w.method}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#526d72]">
                          {w.accountNumber || w.walletAddress || '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#b91c1c]">
                          ${Number(w.amountUSD).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-[#526d72]">
                          {w.amountPKR ? `₨ ${w.amountPKR.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              w.status === 'paid'
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : w.status === 'rejected'
                                ? 'bg-[#fee2e2] text-[#b91c1c]'
                                : 'bg-[#fef3c7] text-[#b45309]'
                            }`}
                          >
                            {w.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                            {w.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ✅ ELIGIBLE: Full Withdrawal System */
        <div className="space-y-6">
          {/* ✅ ELIGIBLE SUCCESS BADGE BANNER */}
          <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] flex items-center justify-between flex-wrap gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#14532d]">Withdrawals 100% Eligible</p>
                <p className="text-[11px] text-[#166534]">
                  You have met all requirements ($1.00 Earned & 1 Referral Verified). You can request payouts anytime.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
              Eligible • Unlocked
            </span>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Withdrawal Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0ebe0] pb-4">
            <h2 className="text-lg font-extrabold text-[#09353e] flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#0c5963]" />
              <span>Request Withdrawal</span>
            </h2>
            <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full">
              Balance: {formatCurrency(walletBalance)}
            </span>
          </div>

          <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
            {/* Payment Method Selector: Choose Payment Method Button & Expandable Menu */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block">
                Withdrawal Method
              </label>

              {/* Choose Payment Method Trigger Button */}
              <button
                id="btn-choose-payment-method"
                type="button"
                onClick={() => setIsMethodDropdownOpen((prev) => !prev)}
                className="w-full p-4 rounded-2xl border border-[#d8d1c3] bg-[#faf8f5] hover:bg-[#f4efe5] text-[#09353e] transition-all flex items-center justify-between shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0c5963]/20"
              >
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#718589] block">
                    Choose Payment Method
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-[#09353e]">
                      {currentMethodObj?.name || 'Choose Payment Method'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentMethodObj?.isAvailable
                        ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                        : 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                    }`}>
                      {currentMethodObj?.badge || 'Choose'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#526d72]">
                  <span className="text-xs font-bold hidden sm:inline text-[#0c5963]">
                    {isMethodDropdownOpen ? 'Close Menu' : 'Select Method'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#0c5963] transition-transform duration-200 ${isMethodDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expandable Payment Methods Menu (strictly without icons) */}
              {isMethodDropdownOpen && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#e4ded2] shadow-md space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-[#f0ebe0] text-[11px] font-bold uppercase tracking-wider text-[#718589]">
                    <span>All Payment Methods</span>
                    <span>Click to select</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {paymentMethodsList.map((mItem) => {
                      const isSelected = method === mItem.id;
                      return (
                        <button
                          key={mItem.id}
                          type="button"
                          onClick={() => {
                            setMethod(mItem.id);
                            setIsMethodDropdownOpen(false);
                            if (!mItem.isAvailable) {
                              setNotification({
                                type: 'error',
                                message: 'Not Available for Now. Please select JazzCash, UPaisa, or Easypaisa.',
                              });
                            } else {
                              setNotification({ type: '', message: '' });
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#0c5963] bg-[#0c5963]/5 ring-2 ring-[#0c5963]/20 shadow-xs'
                              : 'border-[#e4ded2] hover:bg-[#faf8f5] hover:border-[#cbd5e1]'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-black text-[#09353e] block">
                              {mItem.name}
                            </span>
                            <span className="text-[10px] text-[#718589] block">
                              {mItem.description}
                            </span>
                          </div>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                            mItem.isAvailable
                              ? 'bg-[#ecfdf5] text-[#047857]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}>
                            {mItem.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Not Available for Now Alert for Bank / Crypto */}
            {(method === 'bank' || method === 'crypto') && (
              <div className="p-4 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#ea580c] mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-black uppercase tracking-wider text-[#9a3412]">
                    Not Available for Now
                  </p>
                  <p className="text-[#c2410c] mt-0.5">
                    {method === 'bank' ? 'Bank Transfer' : 'Crypto (USDT)'} is currently not available for withdrawal. Please use{' '}
                    <button
                      type="button"
                      onClick={() => setMethod('jazzcash')}
                      className="font-bold underline text-[#9a3412] hover:text-[#7c2d12] cursor-pointer"
                    >
                      JazzCash
                    </button>
                    {', '}
                    <button
                      type="button"
                      onClick={() => setMethod('upaisa')}
                      className="font-bold underline text-[#9a3412] hover:text-[#7c2d12] cursor-pointer"
                    >
                      UPaisa
                    </button>
                    {', or '}
                    <button
                      type="button"
                      onClick={() => setMethod('easypaisa')}
                      className="font-bold underline text-[#9a3412] hover:text-[#7c2d12] cursor-pointer"
                    >
                      Easypaisa
                    </button>
                    {' to receive your payout.'}
                  </p>
                </div>
              </div>
            )}

            {/* Conditional Fields: Bank / Mobile vs Crypto */}
            {method !== 'crypto' ? (
              <>
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-xs font-medium text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                    {currentMethodObj?.name || 'Account'} Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. Account number / Mobile number"
                    className="w-full px-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-xs font-medium text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                  USDT (TRC20 / BEP20) Wallet Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x... or T..."
                  className="w-full px-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-xs font-mono text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
                />
              </div>
            )}

            {/* Amount in USD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e]">
                  Withdrawal Amount (USD) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAmountUSD(Math.min(walletBalance, 1000).toString())}
                  className="text-xs font-bold text-[#0c5963] hover:underline cursor-pointer"
                >
                  Use Max Available (${walletBalance.toFixed(2)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#718589]">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="any"
                  required
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  placeholder="10.00"
                  className="w-full pl-9 pr-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-base font-bold text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
                />
              </div>
            </div>

            {/* Auto-Calculated PKR Display */}
            {isLocal && (
              <div className="p-4 rounded-2xl bg-[#f5f1e8] border border-[#e4ded2] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526d72]">
                    You Will Receive (PKR)
                  </span>
                  <p className="text-xl font-black text-[#09353e]">
                    ₨ {calculatedPKR.toLocaleString()} PKR
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#718589] font-medium block">Current Conversion:</span>
                  <span className="text-xs font-bold text-[#0c5963]">$1 = {exchangeRate} PKR</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-[#0c5963] hover:bg-[#08424b] text-white text-sm font-extrabold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Withdrawal Request...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Request Withdrawal (${numUSD ? numUSD.toFixed(2) : '0.00'})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Withdrawal Policy & Account Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Permanent Ultra-Short Referral Link Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e4ded2] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c5963] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0c5963]" />
                <span>Ultra-Short Direct @Username Link</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                {isEligible ? 'Withdrawals Eligible' : 'Requires $1.00 Earned'}
              </span>
            </div>
            <p className="text-xs text-[#526d72] leading-relaxed">
              Earn at least $1.00 from ads or share your referral link to earn team matching bonuses and boost your profits:
            </p>
            <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#ece6d9] font-mono text-xs font-bold text-[#09353e] truncate select-all">
              {ultraShortLink}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                className="py-2 px-3 bg-[#112d35] hover:bg-[#091b20] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
          {/* Policy Checklist Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e4ded2] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#09353e] uppercase tracking-wider">
              Withdrawal Policy & Rules
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-full ${isEligible ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>
                  {isEligible ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="font-bold text-[#09353e]">Minimum $1.00 Earnings Check</span>
                  <p className="text-[#718589]">Requires at least $1.00 total earned (${totalEarned.toFixed(2)} / $1.00)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-full bg-[#e0f2fe] text-[#0284c7]">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-[#09353e]">Daily Limit (1 per Day)</span>
                  <p className="text-[#718589]">Accounts may initiate 1 withdrawal request every 24 hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-full bg-[#fef3c7] text-[#ca8a04]">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-[#09353e]">5-Minute Safety Cooldown</span>
                  <p className="text-[#718589]">Prevents accidental duplicate submissions.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-full bg-[#e6f4f1] text-[#0c5963]">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-[#09353e]">Amount Limits</span>
                  <p className="text-[#718589]">Min: $1.00 USD • Max: $1,000.00 USD per transaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Helper */}
          <div className="bg-[#112d35] text-white rounded-3xl p-6 shadow-sm space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#38bdf8]">
              Payout Execution Flow
            </span>
            <p className="text-xs text-white/80 leading-relaxed">
              When you submit a withdrawal, it is assigned a unique tracking ID and verified by administrators in Phase 5. Once marked "Paid", funds arrive directly in your designated account.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Withdrawal History Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#09353e]">
              Recent Withdrawal Requests
            </h3>
            <p className="text-xs text-[#718589]">
              Track your last 5 withdrawal submissions and payout statuses
            </p>
          </div>
          <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-1 rounded-full border border-[#b8dfd7]">
            {withdrawals.length} entries
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#718589] border border-dashed border-[#e4ded2] rounded-2xl">
            No withdrawal requests on record yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0ebe0] text-[#718589] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Account / Address</th>
                  <th className="py-3 px-3">Amount USD</th>
                  <th className="py-3 px-3">Amount PKR</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f1e8]">
                {withdrawals.slice(0, 5).map((w) => (
                  <tr key={w.id} className="hover:bg-[#faf8f5]">
                    <td className="py-3 px-3 text-[#526d72] font-mono whitespace-nowrap">
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#09353e] uppercase">
                      {w.method}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#526d72]">
                      {w.accountNumber || w.walletAddress || '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#b91c1c]">
                      ${Number(w.amountUSD).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[#526d72]">
                      {w.amountPKR ? `₨ ${w.amountPKR.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          w.status === 'paid'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : w.status === 'rejected'
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-[#fef3c7] text-[#b45309]'
                        }`}
                      >
                        {w.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                        {w.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </div>
      )}

      {/* GOOGLE ADSENSE WITHDRAWAL PAGE BANNER */}
      <GoogleAdSense label="Official Sponsor Network" format="auto" className="mt-4" />
    </div>
  );
}
