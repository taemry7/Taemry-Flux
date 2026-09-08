/**
 * TAEMRY FLUX - Admin Ads Engine Settings
 * Allows Platform Administrators to configure:
 * - Daily Ad Limit (1 - 500 ads)
 * - Watch Timer Duration (15s, 30s, 45s, 60s)
 * - Base Ad Reward Rate (% of Package Price)
 * - Cooldown between consecutive ads (0s = disabled / instantaneous)
 * - Multi-Level Sponsor Commission (50% rule)
 * - Package Gatekeeper Requirements
 * - Ad Video / Stream Source URL
 * - Curated Sponsor Directory
 */

import React, { useState, useEffect } from 'react';
import {
  PlaySquare,
  Clock,
  Zap,
  Percent,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Video,
  ShieldAlert,
  Sliders,
  DollarSign,
  Users,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import apiClient from '../../api/client';

const DEFAULT_SPONSORS = [
  { name: 'Solstice Cloud AI', category: 'Artificial Intelligence', tag: 'High Performance' },
  { name: 'Aura Protocol', category: 'Web3 & Fintech', tag: 'Secure Settlement' },
  { name: 'Apex Vantage Hardware', category: 'Computing', tag: 'Next-Gen Chips' },
  { name: 'Zenith Global Liquidity', category: 'Institutional Finance', tag: 'Cross-Border' },
  { name: 'Quantum Core Networks', category: 'Infrastructure', tag: 'Zero Latency' },
  { name: 'Hyperion Energy Systems', category: 'Clean Tech', tag: 'Sustainable Grid' },
  { name: 'CyberShield ZeroTrust', category: 'Cybersecurity', tag: 'Enterprise Grade' },
  { name: 'Nexus Orbital Data', category: 'Telecom & Satellite', tag: 'Global Mesh' },
];

const PACKAGES = [
  { id: 'bronze', name: 'Bronze', price: 1.00 },
  { id: 'silver', name: 'Silver', price: 5.00 },
  { id: 'gold', name: 'Gold', price: 10.00 },
  { id: 'elite', name: 'Elite', price: 100.00 },
  { id: 'master', name: 'Master', price: 500.00 },
  { id: 'apex', name: 'Apex', price: 1000.00 },
];

export default function AdminAdsSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    dailyAdLimit: 200,
    adTimerSeconds: 60,
    adRewardPercentage: 0.1, // 0.1%
    adCooldownSeconds: 0,
    uplineCommissionPercentage: 50,
    requirePackageForAds: true,
    adVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-artificial-intelligence-head-32863-large.mp4',
    sponsors: DEFAULT_SPONSORS,
  });

  const [newSponsor, setNewSponsor] = useState({ name: '', category: '', tag: '' });

  // Fetch current settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      if (res.data?.success && res.data.settings) {
        const s = res.data.settings;
        setForm((prev) => ({
          ...prev,
          dailyAdLimit: s.dailyAdLimit !== undefined ? Number(s.dailyAdLimit) : 200,
          adTimerSeconds: s.adTimerSeconds !== undefined ? Number(s.adTimerSeconds) : 60,
          adRewardPercentage: s.adRewardPercentage !== undefined ? Number(s.adRewardPercentage) : 0.1,
          adCooldownSeconds: s.adCooldownSeconds !== undefined ? Number(s.adCooldownSeconds) : 0,
          uplineCommissionPercentage: s.uplineCommissionPercentage !== undefined ? Number(s.uplineCommissionPercentage) : 50,
          requirePackageForAds: s.requirePackageForAds !== undefined ? Boolean(s.requirePackageForAds) : true,
          adVideoUrl: s.adVideoUrl || prev.adVideoUrl,
          sponsors: Array.isArray(s.adSponsors) && s.adSponsors.length > 0 ? s.adSponsors : DEFAULT_SPONSORS,
        }));
      }
    } catch (err) {
      console.warn('Could not load existing ad settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleTimerPreset = (secs) => {
    setForm((prev) => ({ ...prev, adTimerSeconds: secs }));
  };

  const handleAddSponsor = () => {
    if (!newSponsor.name.trim()) return;
    setForm((prev) => ({
      ...prev,
      sponsors: [
        ...prev.sponsors,
        {
          name: newSponsor.name.trim(),
          category: newSponsor.category.trim() || 'General Sponsor',
          tag: newSponsor.tag.trim() || 'Featured',
        },
      ],
    }));
    setNewSponsor({ name: '', category: '', tag: '' });
  };

  const handleRemoveSponsor = (index) => {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        dailyAdLimit: Number(form.dailyAdLimit),
        adTimerSeconds: Number(form.adTimerSeconds),
        adRewardPercentage: Number(form.adRewardPercentage),
        adCooldownSeconds: Number(form.adCooldownSeconds),
        uplineCommissionPercentage: Number(form.uplineCommissionPercentage),
        requirePackageForAds: Boolean(form.requirePackageForAds),
        adVideoUrl: form.adVideoUrl.trim(),
        adSponsors: form.sponsors,
      };

      const res = await apiClient.put('/admin/settings', payload);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: 'Ads Engine parameters updated successfully and applied to all user sessions.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save Ads Engine configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculations for tier reward preview table
  const rewardRateFraction = (Number(form.adRewardPercentage) || 0.1) / 100;
  const dailyLimitNum = Number(form.dailyAdLimit) || 200;

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
            <PlaySquare className="w-5 h-5 text-sky-400" />
            <span>Ads Engine & Monetization Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure ad duration timers, daily quotas, reward distribution percentage, and sponsor rotation
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700/60 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Core Engine Controls */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Ad Watching Rules & Quotas</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Ad Limit */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Daily Ad Quota (Per Member)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="dailyAdLimit"
                  value={form.dailyAdLimit}
                  onChange={handleChange}
                  min="1"
                  max="500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  Ads/Day
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Default: 200 catalog listings.</p>
            </div>

            {/* Ad Timer Seconds */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ad Countdown Duration
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="adTimerSeconds"
                  value={form.adTimerSeconds}
                  onChange={handleChange}
                  min="5"
                  max="300"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  Seconds
                </span>
              </div>
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleTimerPreset(sec)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      form.adTimerSeconds === sec
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Reward Rate Percentage */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ad Reward Rate (% of Package)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="adRewardPercentage"
                  value={form.adRewardPercentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  max="5.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  % / Ad
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Default 0.10% ($1k Apex = $1.00/ad).</p>
            </div>

            {/* Consecutive Ad Cooldown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cooldown Between Ads
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="adCooldownSeconds"
                  value={form.adCooldownSeconds}
                  onChange={handleChange}
                  min="0"
                  max="300"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  Seconds
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">0 = Cooldown disabled (Instant next ad).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
            {/* Upline Ad Commission */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Upline Ad Commission Distribution
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="uplineCommissionPercentage"
                  value={form.uplineCommissionPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[11px] font-bold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                  % Total
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                50% Rule: Level 1 (20%), L2 (10%), L3 (10%), L4 (5%), L5 (5%).
              </p>
            </div>

            {/* Require Package Toggle */}
            <div className="flex flex-col justify-center">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Package Gatekeeper
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  name="requirePackageForAds"
                  checked={form.requirePackageForAds}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-700 bg-slate-900"
                />
                <span className="text-xs text-slate-200">
                  Require member to purchase a package before watching ads
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Live Tier Earning Calculations (Simulation Matrix) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Projected Daily Payouts by Package Tier</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Calculated for {dailyLimitNum} ads @ {(rewardRateFraction * 100).toFixed(2)}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Package Tier</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">Reward / Single Ad</th>
                  <th className="py-2 px-3">Daily Max ({dailyLimitNum} Ads)</th>
                  <th className="py-2 px-3">Monthly Return (30 Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {PACKAGES.map((pkg) => {
                  const singleReward = +(pkg.price * rewardRateFraction).toFixed(4);
                  const dailyMax = +(singleReward * dailyLimitNum).toFixed(2);
                  const monthlyMax = +(dailyMax * 30).toFixed(2);

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span>{pkg.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        ${pkg.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                        ${singleReward.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white font-bold">
                        ${dailyMax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sky-300 font-bold">
                        ${monthlyMax.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Ad Video Stream Media */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Video className="w-4 h-4 text-purple-400" />
            <span>Ad Visual Media Stream Source</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Active Video MP4 Stream URL (Direct HTTP/HTTPS Link)
            </label>
            <input
              type="url"
              name="adVideoUrl"
              value={form.adVideoUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="https://.../video.mp4"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              This video asset streams inside the member ad viewing player during the active countdown.
            </p>
          </div>
        </div>

        {/* Section 4: Sponsor Ads Catalog Management */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Sponsor Ads Directory ({form.sponsors.length} Active Sponsors)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Rotated across the 1-200 ad cards
            </span>
          </div>

          {/* Add New Sponsor */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Sponsor Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Orion Labs"
                value={newSponsor.name}
                onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Cloud AI"
                value={newSponsor.category}
                onChange={(e) => setNewSponsor({ ...newSponsor, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Badge / Tag</label>
              <input
                type="text"
                placeholder="e.g. Premium Tech"
                value={newSponsor.tag}
                onChange={(e) => setNewSponsor({ ...newSponsor, tag: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSponsor}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sponsor</span>
            </button>
          </div>

          {/* Current Sponsors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {form.sponsors.map((sp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{sp.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{sp.category}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {sp.tag}
                  </span>
                </div>
                {form.sponsors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSponsor(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove Sponsor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Ads Engine Configuration...' : 'Save Ads Engine Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
