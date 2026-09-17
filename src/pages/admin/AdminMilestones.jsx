/**
 * TAEMRY FLUX - Admin Milestones & Team Rewards Management
 * Live configuration of direct-referral Team Rewards and Team Ads milestones.
 * Allows administrators to update bonus amounts, thresholds, and tier descriptions live in Firestore.
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Gift,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import apiClient from '../../api/client';
import { TEAM_REWARDS as DEFAULT_TEAM_REWARDS, TEAM_MILESTONES as DEFAULT_TEAM_MILESTONES } from '../../config/milestones.config';

export default function AdminMilestones() {
  const [activeSubTab, setActiveSubTab] = useState('referrals'); // 'referrals' | 'team-ads'
  const [teamRewards, setTeamRewards] = useState([]);
  const [teamMilestones, setTeamMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch live milestones from backend
  const fetchMilestones = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await apiClient.get('/admin/milestones');
      if (res.data?.success) {
        const tr = res.data.teamRewards || DEFAULT_TEAM_REWARDS;
        const tm = res.data.teamMilestones || DEFAULT_TEAM_MILESTONES;
        setTeamRewards(tr);
        setTeamMilestones(tm);
        try {
          localStorage.setItem('taemry_custom_milestones', JSON.stringify({ teamRewards: tr, teamMilestones: tm }));
        } catch (e) {}
      } else {
        const cached = localStorage.getItem('taemry_custom_milestones');
        if (cached) {
          const parsed = JSON.parse(cached);
          setTeamRewards(parsed.teamRewards || DEFAULT_TEAM_REWARDS);
          setTeamMilestones(parsed.teamMilestones || DEFAULT_TEAM_MILESTONES);
        } else {
          setTeamRewards(DEFAULT_TEAM_REWARDS);
          setTeamMilestones(DEFAULT_TEAM_MILESTONES);
        }
      }
    } catch (err) {
      console.warn('Failed to load milestones from API, using defaults:', err.message);
      const cached = localStorage.getItem('taemry_custom_milestones');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setTeamRewards(parsed.teamRewards || DEFAULT_TEAM_REWARDS);
          setTeamMilestones(parsed.teamMilestones || DEFAULT_TEAM_MILESTONES);
        } catch (e) {
          setTeamRewards(DEFAULT_TEAM_REWARDS);
          setTeamMilestones(DEFAULT_TEAM_MILESTONES);
        }
      } else {
        setTeamRewards(DEFAULT_TEAM_REWARDS);
        setTeamMilestones(DEFAULT_TEAM_MILESTONES);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  // Save changes live to database
  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await apiClient.put('/admin/milestones', {
        teamRewards,
        teamMilestones,
      });
      if (res.data?.success) {
        try {
          localStorage.setItem('taemry_custom_milestones', JSON.stringify({ teamRewards, teamMilestones }));
          window.dispatchEvent(new CustomEvent('taemry_milestones_updated', { detail: { teamRewards, teamMilestones } }));
        } catch (e) {}
        setStatusMessage({
          type: 'success',
          text: 'Milestones & Team Rewards updated live in database! All user accounts will instantly see the new parameters.',
        });
        setEditingIndex(null);
      } else {
        throw new Error(res.data?.message || 'Failed to save changes');
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error updating milestones.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to original platform defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all milestones to factory standard defaults? You will need to click Save to persist.')) {
      setTeamRewards(DEFAULT_TEAM_REWARDS);
      setTeamMilestones(DEFAULT_TEAM_MILESTONES);
      setEditingIndex(null);
      setStatusMessage({
        type: 'info',
        text: 'Standard defaults loaded. Click "Save Live Changes" to apply.',
      });
    }
  };

  // Start editing a specific row
  const startEdit = (index, item, type) => {
    setEditingIndex(`${type}-${index}`);
    setEditForm({ ...item });
  };

  // Commit edit to local state
  const saveEditRow = (index, type) => {
    if (type === 'referrals') {
      const updated = [...teamRewards];
      updated[index] = {
        ...updated[index],
        referrals: Number(editForm.referrals) || updated[index].referrals,
        bonus: Number(editForm.bonus) || updated[index].bonus,
        label: editForm.label || updated[index].label,
        stepNote: editForm.stepNote || editForm.extraInfo || updated[index].stepNote || updated[index].extraInfo,
      };
      setTeamRewards(updated);
    } else {
      const updated = [...teamMilestones];
      updated[index] = {
        ...updated[index],
        ads: Number(editForm.ads) || updated[index].ads,
        bonus: Number(editForm.bonus) || updated[index].bonus,
        label: editForm.label || updated[index].label,
      };
      setTeamMilestones(updated);
    }
    setEditingIndex(null);
    setEditForm({});
  };

  // Add new tier
  const addNewTier = (type) => {
    if (type === 'referrals') {
      const last = teamRewards[teamRewards.length - 1];
      const newRefs = last ? last.referrals + 500 : 5;
      const newBonus = last ? last.bonus + 200 : 1.00;
      const newItem = {
        id: `tr-${newRefs}`,
        referrals: newRefs,
        bonus: newBonus,
        label: `${newRefs.toLocaleString()} Direct Referrals`,
        stepNote: `Reach ${newRefs.toLocaleString()} total verified direct team members`,
      };
      setTeamRewards([...teamRewards, newItem]);
      startEdit(teamRewards.length, newItem, 'referrals');
    } else {
      const last = teamMilestones[teamMilestones.length - 1];
      const newAds = last ? last.ads * 2 : 2500;
      const newBonus = last ? last.bonus * 2 : 10.00;
      const newItem = {
        ads: newAds,
        bonus: newBonus,
        label: `${newAds.toLocaleString()} Team Ads`,
      };
      setTeamMilestones([...teamMilestones, newItem]);
      startEdit(teamMilestones.length, newItem, 'team-ads');
    }
  };

  // Remove tier
  const removeTier = (index, type) => {
    if (type === 'referrals') {
      setTeamRewards(teamRewards.filter((_, i) => i !== index));
    } else {
      setTeamMilestones(teamMilestones.filter((_, i) => i !== index));
    }
    if (editingIndex === `${type}-${index}`) {
      setEditingIndex(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 3D Header Banner with Glow */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 shadow-[0_20px_50px_rgba(14,165,233,0.15)] overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 font-black shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Milestones & Team Rewards Configuration
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE EDITABLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Configure direct referral reward bonuses ($1 &ndash; $600+), team ads progression ladders, and claim eligibility rules live for all users.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700/60 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Database...' : 'Save Live Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Feedback Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'info'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('referrals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'referrals'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Direct Referral Rewards ({teamRewards.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('team-ads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'team-ads'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Team Ads Milestones ({teamMilestones.length})</span>
        </button>
      </div>

      {/* Tab 1: Direct Referral Rewards Ladder */}
      {activeSubTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-sky-400" />
                <span>Team Referral Rewards Ladder</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bonus credits awarded to members upon reaching direct referral milestones.
              </p>
            </div>
            <button
              onClick={() => addNewTier('referrals')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reward Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamRewards.map((item, idx) => {
              const isEditing = editingIndex === `referrals-${idx}`;

              return (
                <div
                  key={item.id || idx}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 shadow-lg shadow-black/40 transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.label || ''}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold w-full"
                            placeholder="e.g. 5 Direct Referrals"
                          />
                        ) : (
                          <h4 className="text-sm font-bold text-white">{item.label}</h4>
                        )}
                        <span className="text-[11px] text-slate-400 block">
                          Requirement: {item.referrals} Direct Friends
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-emerald-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={editForm.bonus !== undefined ? editForm.bonus : ''}
                            onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-black w-20 text-right"
                          />
                        </div>
                      ) : (
                        <span className="text-lg font-black text-emerald-400 tracking-tight">
                          ${Number(item.bonus).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Cash Bonus</span>
                    </div>
                  </div>

                  {/* Sub-note / Instructions */}
                  <div>
                    {isEditing ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                          Referral Target & Step Note:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editForm.referrals !== undefined ? editForm.referrals : ''}
                            onChange={(e) => setEditForm({ ...editForm, referrals: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold w-28"
                            placeholder="Ref count"
                          />
                          <input
                            type="text"
                            value={editForm.stepNote || editForm.extraInfo || ''}
                            onChange={(e) => setEditForm({ ...editForm, stepNote: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white flex-1"
                            placeholder="Step note description"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        {item.stepNote || item.extraInfo || 'Verified direct member invitation milestone'}
                      </p>
                    )}
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">Tier ID: {item.id || `tr-${item.referrals}`}</span>
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEditRow(idx, 'referrals')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(idx, item, 'referrals')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
                            title="Edit Tier Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeTier(idx, 'referrals')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Team Ads Milestones */}
      {activeSubTab === 'team-ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Team Ads Milestones Ladder</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Volume milestones achieved through cumulative team advertising views across levels.
              </p>
            </div>
            <button
              onClick={() => addNewTier('team-ads')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ads Milestone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMilestones.map((item, idx) => {
              const isEditing = editingIndex === `team-ads-${idx}`;

              return (
                <div
                  key={item.ads || idx}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 shadow-lg shadow-black/40 transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.label || ''}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold w-full"
                          />
                        ) : (
                          <h4 className="text-sm font-bold text-white">{item.label}</h4>
                        )}
                        <span className="text-[11px] text-slate-400 block">
                          Target: {Number(item.ads).toLocaleString()} Team Views
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-emerald-400 font-bold">$</span>
                          <input
                            type="number"
                            step="1"
                            value={editForm.bonus !== undefined ? editForm.bonus : ''}
                            onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-black w-20 text-right"
                          />
                        </div>
                      ) : (
                        <span className="text-lg font-black text-emerald-400 tracking-tight">
                          ${Number(item.bonus).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Reward</span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-bold block">
                        Required Team Ads Target:
                      </label>
                      <input
                        type="number"
                        value={editForm.ads !== undefined ? editForm.ads : ''}
                        onChange={(e) => setEditForm({ ...editForm, ads: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">{Number(item.ads).toLocaleString()} ads cumulative</span>
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEditRow(idx, 'team-ads')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(idx, item, 'team-ads')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
                            title="Edit Tier Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeTier(idx, 'team-ads')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
