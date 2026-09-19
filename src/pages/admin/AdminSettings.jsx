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
  Coins,
  PlaySquare,
  Copy,
  Check,
  Eye,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Clock
} from 'lucide-react';
import apiClient from '../../api/client';
import AdminAdsSettings from './AdminAdsSettings';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'ads'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [selectedGatewayTab, setSelectedGatewayTab] = useState('all'); // 'all' | 'jazzcash' | 'upaisa' | 'sadapay' | 'bank' | 'crypto' | 'easypaisa'
  const [copiedKey, setCopiedKey] = useState(null);

  const [settings, setSettings] = useState({
    exchangeRate: 300,
    dailyAdLimit: 200,
    minWithdrawal: 1,
    maxWithdrawal: 1000,
    withdrawalCooldownMinutes: 0,
    referralRequired: 1,
    depositApprovalTime: '~1 minute',
    bankName: 'Meezan Bank Ltd',
    bankAccountName: 'TAEMRY FLUX HOLDINGS LTD',
    bankAccountNumber: 'PK76MEZN0000123456789012',
    easypaisaName: 'TAEMRY OFFICIAL',
    easypaisaNumber: '03451234567',
    jazzcashName: 'TAEMRY OFFICIAL',
    jazzcashNumber: '03009876543',
    upaisaName: 'TAEMRY OFFICIAL',
    upaisaNumber: '03129876543',
    sadapayName: 'TAEMRY OFFICIAL',
    sadapayNumber: '03009876543',
    cryptoUSDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d (TRC20 / BEP20)',
    cryptoBTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    paymentMethodStatus: {
      jazzcash: true,
      upaisa: true,
      easypaisa: true,
      sadapay: false,
      bank: false,
      crypto: false,
    },
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
          exchangeRate: s.exchangeRate !== undefined ? s.exchangeRate : 300,
          dailyAdLimit: s.dailyAdLimit !== undefined ? s.dailyAdLimit : 200,
          minWithdrawal: s.minWithdrawal !== undefined ? s.minWithdrawal : 1,
          maxWithdrawal: s.maxWithdrawal !== undefined ? s.maxWithdrawal : 1000,
          withdrawalCooldownMinutes: s.withdrawalCooldownMinutes !== undefined ? s.withdrawalCooldownMinutes : 0,
          referralRequired: s.referralRequired !== undefined ? s.referralRequired : 1,
          depositApprovalTime: s.depositApprovalTime || '~1 minute',
          bankName: s.bankName || 'Meezan Bank Ltd',
          bankAccountName: s.bankAccountName || 'TAEMRY FLUX HOLDINGS LTD',
          bankAccountNumber: s.bankAccountNumber || 'PK76MEZN0000123456789012',
          easypaisaName: s.easypaisaName || 'TAEMRY OFFICIAL',
          easypaisaNumber: s.easypaisaNumber || '03451234567',
          jazzcashName: s.jazzcashName || 'TAEMRY OFFICIAL',
          jazzcashNumber: s.jazzcashNumber || '03009876543',
          upaisaName: s.upaisaName || 'TAEMRY OFFICIAL',
          upaisaNumber: s.upaisaNumber || '03129876543',
          sadapayName: s.sadapayName || 'TAEMRY OFFICIAL',
          sadapayNumber: s.sadapayNumber || '03009876543',
          cryptoUSDT: s.cryptoAddresses?.USDT || prev.cryptoUSDT,
          cryptoBTC: s.cryptoAddresses?.BTC || prev.cryptoBTC,
          paymentMethodStatus: s.paymentMethodStatus || prev.paymentMethodStatus,
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

  const handleToggleMethodStatus = (methodId) => {
    setSettings((prev) => ({
      ...prev,
      paymentMethodStatus: {
        ...prev.paymentMethodStatus,
        [methodId]: !prev.paymentMethodStatus?.[methodId],
      },
    }));
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
        depositApprovalTime: settings.depositApprovalTime?.trim() || '~1 minute',
        bankName: settings.bankName.trim(),
        bankAccountName: settings.bankAccountName.trim(),
        bankAccountNumber: settings.bankAccountNumber.trim(),
        easypaisaName: settings.easypaisaName.trim(),
        easypaisaNumber: settings.easypaisaNumber.trim(),
        jazzcashName: settings.jazzcashName.trim(),
        jazzcashNumber: settings.jazzcashNumber.trim(),
        upaisaName: settings.upaisaName.trim(),
        upaisaNumber: settings.upaisaNumber.trim(),
        sadapayName: settings.sadapayName.trim(),
        sadapayNumber: settings.sadapayNumber.trim(),
        paymentMethodStatus: settings.paymentMethodStatus,
        cryptoAddresses: {
          USDT: settings.cryptoUSDT.trim(),
          BTC: settings.cryptoBTC.trim(),
        },
      };

      const res = await apiClient.put('/admin/settings', payload);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: 'System settings & payment gateway accounts saved and synchronized across all user flows.',
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
            <span>Platform Configuration & Gateway Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage exchange rate, banking gateways, and ad monetization rules
          </p>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Banking & Financial Parameters</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5" />
          <span>Ads Engine Settings</span>
        </button>
      </div>

      {activeTab === 'ads' ? (
        <AdminAdsSettings />
      ) : (
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
              <p className="text-[10px] text-slate-500 mt-1">Standard listing catalog capacity.</p>
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

        {/* Section 2: Official Deposit & Withdrawal Receiving Gateways (User Panel Step-Based Architecture) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                  User Panel Aligned
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {settings.depositApprovalTime || '~1 minute'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <span>Step 2: Official Receiving Accounts & Payment Gateways</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure account titles, official IBANs, and method statuses exactly as users experience in their Deposit and Withdrawal steps.
              </p>
            </div>

            {/* Approval Time Input */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
              <label className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Approval Speed:</label>
              <input
                type="text"
                name="depositApprovalTime"
                value={settings.depositApprovalTime}
                onChange={handleChange}
                placeholder="~1 minute"
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 text-center"
              />
            </div>
          </div>

          {/* Sub-step 1: Choose Payment Method to Configure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span>Choose Gateway to Configure / Inspect</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Current Mode: <strong className="text-white capitalize">{selectedGatewayTab}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { id: 'all', label: 'All Gateways', desc: 'Overview', active: true },
                { id: 'jazzcash', label: 'JazzCash', desc: 'IBAN Transfer', active: settings.paymentMethodStatus?.jazzcash },
                { id: 'upaisa', label: 'UPaisa', desc: 'IBAN Transfer', active: settings.paymentMethodStatus?.upaisa },
                { id: 'sadapay', label: 'SadaPay', desc: 'IBAN Transfer', active: settings.paymentMethodStatus?.sadapay },
                { id: 'bank', label: 'Bank Transfer', desc: 'Commercial Wire', active: settings.paymentMethodStatus?.bank },
                { id: 'crypto', label: 'Crypto (USDT)', desc: 'TRC20 / BEP20', active: settings.paymentMethodStatus?.crypto },
                { id: 'easypaisa', label: 'Easypaisa', desc: 'Mobile Wallet', active: settings.paymentMethodStatus?.easypaisa },
              ].map((tab) => {
                const isSelected = selectedGatewayTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedGatewayTab(tab.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold leading-tight truncate">{tab.label}</span>
                        {tab.id !== 'all' && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              tab.active ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-slate-600'
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{tab.desc}</span>
                    </div>

                    {tab.id !== 'all' && (
                      <span
                        className={`text-[9px] font-bold mt-2 inline-block px-1.5 py-0.5 rounded ${
                          tab.active
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {tab.active ? 'Active' : 'Locked'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-step 2: Gateway Configuration & Live User Preview */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span>Transfer Details & Live User Preview (Mirroring Deposit / Withdraw Step)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Exchange Rate:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                  $1.00 = {settings.exchangeRate} PKR
                </span>
              </div>
            </div>

            {/* GATEWAYS CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. JAZZCASH */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'jazzcash') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                        JC
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>JazzCash</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Official IBAN Transfer)</span>
                        </h4>
                        <span className="text-[10px] text-emerald-400">PKR Instant Conversion</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('jazzcash')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.jazzcash
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {settings.paymentMethodStatus?.jazzcash ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active • Instant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Not Available for Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Official Account Title</label>
                      <input
                        type="text"
                        name="jazzcashName"
                        value={settings.jazzcashName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">IBAN / Account Number</label>
                      <input
                        type="text"
                        name="jazzcashNumber"
                        value={settings.jazzcashNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Member View Preview</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                        Official Receiver
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <div className="font-bold text-slate-200">{settings.jazzcashName || 'TAEMRY OFFICIAL'}</div>
                        <div className="text-[11px] font-mono text-emerald-400 tracking-wide">
                          {settings.jazzcashNumber || '03009876543'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.jazzcashNumber, 'jazzcash')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'jazzcash' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Test Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. UPAISA */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'upaisa') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                        UP
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>UPaisa</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Official IBAN Transfer)</span>
                        </h4>
                        <span className="text-[10px] text-emerald-400">PKR Instant Conversion</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('upaisa')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.upaisa
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {settings.paymentMethodStatus?.upaisa ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active • Instant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Not Available for Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Official Account Title</label>
                      <input
                        type="text"
                        name="upaisaName"
                        value={settings.upaisaName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">IBAN / Account Number</label>
                      <input
                        type="text"
                        name="upaisaNumber"
                        value={settings.upaisaNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Member View Preview</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                        Official Receiver
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <div className="font-bold text-slate-200">{settings.upaisaName || 'TAEMRY OFFICIAL'}</div>
                        <div className="text-[11px] font-mono text-emerald-400 tracking-wide">
                          {settings.upaisaNumber || '03129876543'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.upaisaNumber, 'upaisa')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'upaisa' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Test Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SADAPAY */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'sadapay') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                        SP
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>SadaPay</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Official IBAN Transfer)</span>
                        </h4>
                        <span className="text-[10px] text-emerald-400">PKR Instant Conversion</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('sadapay')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.sadapay
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {settings.paymentMethodStatus?.sadapay ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active • Instant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Not Available for Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Official Account Title</label>
                      <input
                        type="text"
                        name="sadapayName"
                        value={settings.sadapayName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">IBAN / Account Number</label>
                      <input
                        type="text"
                        name="sadapayNumber"
                        value={settings.sadapayNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Member View Preview</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                        Official Receiver
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <div className="font-bold text-slate-200">{settings.sadapayName || 'TAEMRY OFFICIAL'}</div>
                        <div className="text-[11px] font-mono text-emerald-400 tracking-wide">
                          {settings.sadapayNumber || '03009876543'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.sadapayNumber, 'sadapay')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'sadapay' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Test Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. COMMERCIAL BANK TRANSFER */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'bank') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>Bank Transfer</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Official Account Transfer)</span>
                        </h4>
                        <span className="text-[10px] text-sky-400">Direct Commercial Wire</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('bank')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.bank
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {settings.paymentMethodStatus?.bank ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active • Instant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Not Available for Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={settings.bankName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-semibold"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Official Account Title</label>
                        <input
                          type="text"
                          name="bankAccountName"
                          value={settings.bankAccountName}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Official IBAN / Account Number</label>
                        <input
                          type="text"
                          name="bankAccountNumber"
                          value={settings.bankAccountNumber}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" />
                        <span>Member View Preview ({settings.paymentMethodStatus?.bank ? 'Enabled' : 'Notice Displayed'})</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold">
                        Official Receiver
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <div className="text-[10px] text-slate-400">{settings.bankName}</div>
                        <div className="font-bold text-slate-200">{settings.bankAccountName || 'TAEMRY FLUX HOLDINGS LTD'}</div>
                        <div className="text-[11px] font-mono text-sky-400 tracking-wide">
                          {settings.bankAccountNumber || 'PK76MEZN0000123456789012'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.bankAccountNumber, 'bank')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'bank' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Test Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CRYPTO ADDRESSES (USDT & BTC) */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'crypto') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>Crypto (USDT / BTC)</span>
                          <span className="text-[10px] text-slate-400 font-normal">(TRC20 / BEP20)</span>
                        </h4>
                        <span className="text-[10px] text-amber-400">Blockchain Network</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('crypto')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.crypto
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {settings.paymentMethodStatus?.crypto ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active • Instant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Not Available for Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">USDT (TRC20 / BEP20) Deposit Address</label>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(settings.cryptoUSDT, 'usdt')}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'usdt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'usdt' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="cryptoUSDT"
                        value={settings.cryptoUSDT}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">Bitcoin (BTC) Address</label>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(settings.cryptoBTC, 'btc')}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'btc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'btc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="cryptoBTC"
                        value={settings.cryptoBTC}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>Member View Preview ({settings.paymentMethodStatus?.crypto ? 'Enabled' : 'Notice Displayed'})</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                        Tether TRC20 / BEP20
                      </span>
                    </div>
                    <div className="text-xs pt-1">
                      <div className="text-[10px] text-slate-400">Official Crypto Receiver:</div>
                      <div className="text-[11px] font-mono text-amber-400 break-all select-all pt-0.5">
                        {settings.cryptoUSDT}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. EASYPAISA (OPTIONAL MOBILE WALLET) */}
              {(selectedGatewayTab === 'all' || selectedGatewayTab === 'easypaisa') && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        EP
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>Easypaisa</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Mobile Wallet)</span>
                        </h4>
                        <span className="text-[10px] text-emerald-400">Alternative Gateway</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMethodStatus('easypaisa')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        settings.paymentMethodStatus?.easypaisa
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-700/30 text-slate-400 border-slate-700 hover:bg-slate-700/50'
                      }`}
                    >
                      {settings.paymentMethodStatus?.easypaisa ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Account Title</label>
                      <input
                        type="text"
                        name="easypaisaName"
                        value={settings.easypaisaName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Account Number</label>
                      <input
                        type="text"
                        name="easypaisaNumber"
                        value={settings.easypaisaNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Live User Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Member View Preview</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                        Official Receiver
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <div className="font-bold text-slate-200">{settings.easypaisaName || 'TAEMRY OFFICIAL'}</div>
                        <div className="text-[11px] font-mono text-emerald-400 tracking-wide">
                          {settings.easypaisaNumber || '03451234567'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.easypaisaNumber, 'easypaisa')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'easypaisa' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Test Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
      )}
    </div>
  );
}
