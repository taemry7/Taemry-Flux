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
  ExternalLink
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../config/milestones.config';

export default function WithdrawPage({ onSelectTab, onNavigate }) {
  const { userStats, fetchUserStats } = useAuth();

  // Form State
  const [method, setMethod] = useState('jazzcash'); // 'bank' | 'easypaisa' | 'jazzcash' | 'crypto'
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [amountUSD, setAmountUSD] = useState('');

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
  const isEligible = referralCount >= 1;

  const referralCode = userStats?.referralCode || userStats?.uid?.substring(0, 8) || 'REF1234';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Calculated conversions
  const exchangeRate = settings.exchangeRate || 300;
  const numUSD = parseFloat(amountUSD) || 0;
  const isLocal = ['bank', 'easypaisa', 'jazzcash'].includes(method);
  const calculatedPKR = Math.round(numUSD * exchangeRate);

  // Submit withdrawal
  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    if (!isEligible) {
      setNotification({
        type: 'error',
        message: 'You need at least 1 active referral to withdraw. Share your referral link!',
      });
      return;
    }

    if (numUSD < (settings.minWithdrawal || 1) || numUSD > (settings.maxWithdrawal || 1000)) {
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
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit withdrawal request. Please check requirements.',
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

      {/* ⚠️ STRICT ELIGIBILITY ALERT: If referralCount < 1 */}
      {!isEligible && (
        <div className="p-6 rounded-3xl bg-[#fef2f2] border-2 border-[#fca5a5] text-[#991b1b] shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#7f1d1d]">
                ⚠️ You need at least 1 active referral to withdraw. Share your referral link!
              </h3>
              <p className="text-xs text-[#991b1b] leading-relaxed max-w-2xl">
                To maintain network security and encourage collaborative growth, withdrawals require having at least 1 active member enrolled through your referral link. You currently have <strong>{referralCount} referrals</strong>.
              </p>
            </div>
          </div>

          {/* Referral link share box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <div className="flex-1 bg-white px-3.5 py-2 rounded-xl border border-[#fca5a5] text-xs font-mono text-[#7f1d1d] truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab('referrals')}
              className="px-4 py-2 bg-white hover:bg-[#fef2f2] text-[#991b1b] text-xs font-bold rounded-xl border border-[#fca5a5] transition-colors cursor-pointer"
            >
              Go to Referral Center
            </button>
          </div>
        </div>
      )}

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
            {/* Method Dropdown */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                Withdrawal Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'jazzcash', name: 'JazzCash', icon: Smartphone, color: 'text-[#b91c1c]' },
                  { id: 'easypaisa', name: 'Easypaisa', icon: Smartphone, color: 'text-[#15803d]' },
                  { id: 'bank', name: 'Bank Transfer', icon: Building2, color: 'text-[#0284c7]' },
                  { id: 'crypto', name: 'Crypto (USDT)', icon: Coins, color: 'text-[#ca8a04]' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      method === item.id
                        ? 'border-[#0c5963] bg-[#0c5963]/5 text-[#0c5963] ring-2 ring-[#0c5963]/20 shadow-xs'
                        : 'border-[#e4ded2] hover:bg-[#faf8f5] text-[#526d72]'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-bold">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Fields: Bank / Mobile vs Crypto */}
            {method !== 'crypto' ? (
              <>
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                    Account Holder Name
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
                    {method === 'bank' ? 'IBAN / Bank Account Number' : `${method === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} Mobile Number`}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={method === 'bank' ? 'PK76MEZN...' : '03001234567'}
                    className="w-full px-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-xs font-medium text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                  USDT (TRC20 / BEP20) Wallet Address
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
                  Withdrawal Amount (USD)
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
              disabled={submitting || !isEligible || numUSD > walletBalance || numUSD < 1}
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
                  <span>Request Withdrawal (${numUSD || '0.00'})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Withdrawal Policy & Account Status */}
        <div className="lg:col-span-5 space-y-6">
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
                  <span className="font-bold text-[#09353e]">Active Referral Check</span>
                  <p className="text-[#718589]">Requires at least 1 active referral ({referralCount}/1)</p>
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
  );
}
