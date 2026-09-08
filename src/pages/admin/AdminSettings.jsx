/**
 * TAEMRY FLUX - Admin System Settings (Phase 5)
 * Platform parameters: Exchange Rate, Withdrawal Limits & Cooldowns, Payment Accounts (Bank, Easypaisa, JazzCash, Crypto).
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Building,
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Coins
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [settings, setSettings] = useState({
    exchangeRate: 300,
    dailyAdLimit: 200,
    minWithdrawal: 1,
    maxWithdrawal: 1000,
    withdrawalCooldownMinutes: 0,
    referralRequired: 0,
    bankName: 'Meezan Bank Ltd',
    bankAccountName: 'TAEMRY FLUX HOLDINGS LTD',
    bankAccountNumber: 'PK76MEZN0000123456789012',
    easypaisaName: 'TAEMRY OFFICIAL',
    easypaisaNumber: '03451234567',
    jazzcashName: 'TAEMRY OFFICIAL',
    jazzcashNumber: '03009876543',
    cryptoUSDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d',
    cryptoBTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  });

  // Fetch current settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      if (res.data?.success && res.data.settings) {
        const s = res.data.settings;
        setSettings((prev) => ({
          ...prev,
          exchangeRate: s.exchangeRate || 300,
          dailyAdLimit: s.dailyAdLimit || 200,
          minWithdrawal: s.minWithdrawal || 1,
          maxWithdrawal: s.maxWithdrawal || 1000,
          withdrawalCooldownMinutes: s.withdrawalCooldownMinutes || 0,
          referralRequired: s.referralRequired || 0,
          bankName: s.bankName || 'Meezan Bank Ltd',
          bankAccountName: s.bankAccountName || 'TAEMRY FLUX HOLDINGS LTD',
          bankAccountNumber: s.bankAccountNumber || 'PK76MEZN0000123456789012',
          easypaisaName: s.easypaisaName || 'TAEMRY OFFICIAL',
          easypaisaNumber: s.easypaisaNumber || '03451234567',
          jazzcashName: s.jazzcashName || 'TAEMRY OFFICIAL',
          jazzcashNumber: s.jazzcashNumber || '03009876543',
          cryptoUSDT: s.cryptoAddresses?.USDT || prev.cryptoUSDT,
          cryptoBTC: s.cryptoAddresses?.BTC || prev.cryptoBTC,
        }));
      }
    } catch (err) {
      console.warn('Could not load existing settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        exchangeRate: Number(settings.exchangeRate),
        dailyAdLimit: Number(settings.dailyAdLimit),
        minWithdrawal: Number(settings.minWithdrawal),
        maxWithdrawal: Number(settings.maxWithdrawal),
        withdrawalCooldownMinutes: Number(settings.withdrawalCooldownMinutes),
        referralRequired: Number(settings.referralRequired),
        bankName: settings.bankName.trim(),
        bankAccountName: settings.bankAccountName.trim(),
        bankAccountNumber: settings.bankAccountNumber.trim(),
        easypaisaName: settings.easypaisaName.trim(),
        easypaisaNumber: settings.easypaisaNumber.trim(),
        jazzcashName: settings.jazzcashName.trim(),
        jazzcashNumber: settings.jazzcashNumber.trim(),
        cryptoAddresses: {
          USDT: settings.cryptoUSDT.trim(),
          BTC: settings.cryptoBTC.trim(),
        },
      };

      const res = await apiClient.put('/admin/settings', payload);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: 'System settings updated and synchronized across platform services.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save system settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Platform Configuration & Payment Gateway Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set universal exchange rate, daily ad parameters, and official deposit receiving accounts
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Financial & Policy Parameters */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span>Core Financial & Limit Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exchange Rate */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Exchange Rate (1 USD = PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="exchangeRate"
                  value={settings.exchangeRate}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  PKR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Converts deposit and withdrawal calculations.</p>
            </div>

            {/* Daily Ad Limit */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Daily Ad Limit Per Member
              </label>
              <input
                type="number"
                name="dailyAdLimit"
                value={settings.dailyAdLimit}
                onChange={handleChange}
                min="1"
                max="500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">Standard: 200 ads listing catalog.</p>
            </div>

            {/* Withdrawal Cooldown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Withdrawal Cooldown (Minutes)
              </label>
              <input
                type="number"
                name="withdrawalCooldownMinutes"
                value={settings.withdrawalCooldownMinutes}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">0 = Cooldown completely disabled.</p>
            </div>

            {/* Min Withdrawal */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Minimum Withdrawal ($ USD)
              </label>
              <input
                type="number"
                name="minWithdrawal"
                value={settings.minWithdrawal}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* Max Withdrawal */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Maximum Withdrawal ($ USD)
              </label>
              <input
                type="number"
                name="maxWithdrawal"
                value={settings.maxWithdrawal}
                onChange={handleChange}
                min="1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* Required Referrals */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Required Active Referrals for Payout
              </label>
              <input
                type="number"
                name="referralRequired"
                value={settings.referralRequired}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">Set 0 for unconstrained instant payouts.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Official Deposit Receiving Accounts */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Admin Deposit Receiving Accounts (Displayed to Users)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Transfer Details */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>Commercial Bank Account</span>
              </h4>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={settings.bankName}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Account Title / Name</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={settings.bankAccountName}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">IBAN / Account Number</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={settings.bankAccountNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Easypaisa & JazzCash */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile Wallets (Easypaisa & JazzCash)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Easypaisa Title</label>
                  <input
                    type="text"
                    name="easypaisaName"
                    value={settings.easypaisaName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Easypaisa Number</label>
                  <input
                    type="text"
                    name="easypaisaNumber"
                    value={settings.easypaisaNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">JazzCash Title</label>
                  <input
                    type="text"
                    name="jazzcashName"
                    value={settings.jazzcashName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">JazzCash Number</label>
                  <input
                    type="text"
                    name="jazzcashNumber"
                    value={settings.jazzcashNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Crypto Addresses */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Crypto Deposit Addresses</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">USDT (TRC20 / ERC20) Address</label>
                  <input
                    type="text"
                    name="cryptoUSDT"
                    value={settings.cryptoUSDT}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bitcoin (BTC) Address</label>
                  <input
                    type="text"
                    name="cryptoBTC"
                    value={settings.cryptoBTC}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save CTA Row */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving System Changes...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
