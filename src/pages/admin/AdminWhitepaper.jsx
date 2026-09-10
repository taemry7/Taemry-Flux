/**
 * TAEMRY FLUX - Admin Whitepaper & FAQ Editor
 * Allows administrators to edit the official whitepaper sections,
 * customize FAQs, modify packages/returns text, and update support contact channels.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Award,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  Send
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminWhitepaper() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Active subtab: 'faqs' | 'general' | 'team-rewards' | 'support'
  const [activeTab, setActiveTab] = useState('faqs');

  // Whitepaper data form
  const [formData, setFormData] = useState({
    title: 'TAEMRY FLUX Official Protocol Whitepaper',
    subtitle: 'Decentralized Reward-Based Advertising & Team Distribution Network',
    version: '2.0.0',
    lastUpdated: 'March 2025',
    executiveSummary: 'TAEMRY FLUX is a decentralized, reward-based advertising and referral growth ecosystem. Members activate advertising allocation contracts from their wallet balances, unlock consecutive daily ad streams delivering up to 20% daily returns, and participate in a 5-tier direct downline commission structure alongside direct referral Team Rewards.',
    packagesNote: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.',
    teamRewards: [
      { referrals: 5, bonus: 1.00, label: '5 Referrals', note: 'Invite 5 members from your direct link' },
      { referrals: 15, bonus: 5.00, label: '15 Referrals', note: '10 more members (+10) = 15 total' },
      { referrals: 40, bonus: 10.00, label: '40 Referrals', note: '25 more members (+25) = 40 total' },
      { referrals: 90, bonus: 25.00, label: '90 Referrals', note: '50 more members (+50) = 90 total' },
      { referrals: 190, bonus: 50.00, label: '190 Referrals', note: '100 more members (+100) = 190 total' },
      { referrals: 250, bonus: 100.00, label: '250 Referrals', note: 'Reach 250 total direct downlines' },
      { referrals: 500, bonus: 250.00, label: '500 Referrals', note: 'Reach 500 total direct downlines' },
      { referrals: 1000, bonus: 600.00, label: '1,000 Referrals', note: '$500 Base + $100 Special Mega Bonus ($600 Total)' },
    ],
    faqs: [],
    supportContact: {
      email: 'support@taemryflux.com',
      whatsapp: '+92 300 0000000',
      telegram: '@TaemryFluxOfficial',
      hours: '24/7 Available (Response within 2-4 hours)',
    }
  });

  // Fetch current Whitepaper & FAQ data
  const fetchWhitepaper = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/whitepaper/admin');
      if (res.data?.success && res.data.whitepaper) {
        setFormData(res.data.whitepaper);
      }
    } catch (err) {
      console.warn('Could not fetch whitepaper data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitepaper();
  }, []);

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await apiClient.put('/whitepaper/admin', formData);
      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Whitepaper & FAQs saved successfully!');
        if (res.data.whitepaper) {
          setFormData(res.data.whitepaper);
        }
      }
    } catch (err) {
      console.error('Error updating whitepaper:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save whitepaper changes.');
    } finally {
      setSaving(false);
    }
  };

  // FAQ CRUD handlers
  const handleFaqChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          q: `Q${prev.faqs.length + 1}. New Question Title`,
          a: 'Enter detailed explanation or policy guidance here...'
        }
      ]
    }));
  };

  const handleDeleteFaq = (index) => {
    if (!window.confirm('Are you sure you want to remove this FAQ item?')) return;
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Team Reward tier edit handler
  const handleRewardTierChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.teamRewards];
      updated[index] = {
        ...updated[index],
        [field]: field === 'referrals' || field === 'bonus' ? Number(value) : value
      };
      return { ...prev, teamRewards: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
              Content & Governance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Version: {formData.version}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-sky-400" />
            <span>Whitepaper & FAQ Editor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage public whitepaper documentation, guaranteed return statements, FAQs, and support desk channels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <a
            href="/#/whitepaper"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span>Live Whitepaper</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTICES */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions ({formData.faqs?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>General Info & Returns Note</span>
        </button>

        <button
          onClick={() => setActiveTab('team-rewards')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'team-rewards'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Team Rewards Ladder</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Support Desk Channels</span>
        </button>
      </div>

      {/* 1. FAQS TAB */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Interactive FAQ Items</h3>
              <p className="text-xs text-slate-400">
                These FAQs are loaded live on the Official Whitepaper page and the Support Desk.
              </p>
            </div>
            <button
              onClick={handleAddFaq}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New FAQ</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.faqs?.map((faq, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => handleFaqChange(index, 'q', e.target.value)}
                      placeholder="e.g. Q1. What is TAEMRY FLUX?"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteFaq(index)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={faq.a}
                    onChange={(e) => handleFaqChange(index, 'a', e.target.value)}
                    placeholder="Enter answer / explanation..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. GENERAL TAB */}
      {activeTab === 'general' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Whitepaper Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Version Tag & Subtitle
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="2.0.0"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-sky-400 font-mono focus:outline-hidden focus:border-sky-500"
                />
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtitle"
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Guaranteed Daily Returns Statement (User Mandate)
            </label>
            <textarea
              rows={3}
              value={formData.packagesNote}
              onChange={(e) => setFormData({ ...formData, packagesNote: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 leading-relaxed font-mono focus:outline-hidden focus:border-sky-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Displayed on the Whitepaper packages breakdown section.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Executive Protocol Summary
            </label>
            <textarea
              rows={4}
              value={formData.executiveSummary}
              onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* 3. TEAM REWARDS LADDER TAB */}
      {activeTab === 'team-rewards' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Direct Referral Team Rewards Ladder</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These cash tiers are displayed on the public Whitepaper and awarded in the user Team Rewards page.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-black">
                  <th className="py-3 px-3">Tier #</th>
                  <th className="py-3 px-3">Referrals Target</th>
                  <th className="py-3 px-3">Cash Reward ($ USD)</th>
                  <th className="py-3 px-3">Label</th>
                  <th className="py-3 px-3">Step Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {formData.teamRewards?.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-sky-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={tier.referrals}
                        onChange={(e) => handleRewardTierChange(idx, 'referrals', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tier.bonus}
                        onChange={(e) => handleRewardTierChange(idx, 'bonus', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-400 font-mono"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => handleRewardTierChange(idx, 'label', e.target.value)}
                        className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={tier.note || tier.stepNote || ''}
                        onChange={(e) => handleRewardTierChange(idx, 'note', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUPPORT DESK CHANNELS TAB */}
      {activeTab === 'support' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Support Desk Channels & Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact information displayed to users on the Support Desk page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Official Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={formData.supportContact?.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supportContact: { ...formData.supportContact, email: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                WhatsApp Support Number / Link
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.supportContact?.whatsapp || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supportContact: { ...formData.supportContact, whatsapp: e.target.value }
                    })
                  }
                  placeholder="+92 300 0000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Telegram Support Handle / Channel
              </label>
              <div className="relative">
                <Send className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.supportContact?.telegram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supportContact: { ...formData.supportContact, telegram: e.target.value }
                    })
                  }
                  placeholder="@TaemryFluxOfficial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Support Operating Hours
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.supportContact?.hours || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supportContact: { ...formData.supportContact, hours: e.target.value }
                    })
                  }
                  placeholder="24/7 Available (Response within 2-4 hours)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
