/**
 * TAEMRY FLUX - Admin Cloud Miner Management & Network Hashrate Engine
 * Real-time monitoring of active mining sessions, total mined yield, hashrates, and member mining controls.
 */

import React, { useState, useEffect } from 'react';
import {
  Pickaxe,
  Cpu,
  Zap,
  Activity,
  Flame,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import apiClient from '../../api/client';
import { db, isFirebaseConfigured } from '../../firebase/firebase.config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function AdminCloudMiner() {
  const [miners, setMiners] = useState([]);
  const [summary, setSummary] = useState({
    activeMiners: 0,
    totalMinedTflx: 0,
    totalHashrate: 0,
    totalMinersCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'paused'

  // Fetch Cloud Miner Data from Backend & Firestore
  const fetchMinerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from backend endpoint
      const res = await apiClient.get('/miner/admin/overview').catch(() => null);
      let backendMiners = [];
      let backendSummary = null;

      if (res?.data?.success && res.data.data) {
        backendMiners = res.data.data.miners || [];
        backendSummary = res.data.data;
      }

      // 2. Fetch directly from Firestore collection 'cloudMiner' if available
      let firestoreMiners = [];
      if (isFirebaseConfigured && db) {
        try {
          const snap = await getDocs(collection(db, 'cloudMiner'));
          const now = Date.now();
          snap.forEach((d) => {
            const data = d.data() || {};
            const uid = d.id;
            const startTime = Number(data.sessionStartTime) || 0;
            const duration = Number(data.sessionDurationMs) || (12 * 60 * 60 * 1000);
            const isSessionLive = Boolean(data.isMiningActive) && (now - startTime < duration);
            const timeLeftMs = Math.max(0, (startTime + duration) - now);

            firestoreMiners.push({
              uid,
              userId: data.userId || uid,
              userEmail: data.userEmail || data.email || 'member@taemry.com',
              isMiningActive: Boolean(data.isMiningActive),
              isSessionLive,
              minedTflx: +(Number(data.minedTflx) || 0).toFixed(2),
              effectiveHashrate: Number(data.effectiveHashrate) || 16.0,
              sessionStartTime: startTime,
              sessionDurationMs: duration,
              timeLeftMs,
              timeLeftFormatted: isSessionLive
                ? `${Math.floor(timeLeftMs / 3600000)}h ${Math.floor((timeLeftMs % 3600000) / 60000)}m`
                : 'Expired / Paused',
              streakDays: data.streakDays || 0,
              preStakingBoost: data.preStakingBoost || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });
        } catch (fsErr) {
          console.warn('Firestore cloudMiner read notice:', fsErr.message);
        }
      }

      // Merge backend and Firestore records, deduplicating by uid/userId
      const minerMap = new Map();
      backendMiners.forEach((m) => minerMap.set(m.uid || m.userId, m));
      firestoreMiners.forEach((m) => {
        const key = m.uid || m.userId;
        if (minerMap.has(key)) {
          // Merge prioritizing live firestore status
          minerMap.set(key, { ...minerMap.get(key), ...m });
        } else {
          minerMap.set(key, m);
        }
      });

      const combinedMiners = Array.from(minerMap.values());

      // Recalculate summary metrics accurately
      const now = Date.now();
      let activeCount = 0;
      let totalMined = 0;
      let totalHash = 0;

      combinedMiners.forEach((m) => {
        totalMined += Number(m.minedTflx) || 0;
        const isLive = m.isMiningActive && (now - Number(m.sessionStartTime || 0) < Number(m.sessionDurationMs || (12 * 60 * 60 * 1000)));
        m.isSessionLive = isLive;
        if (isLive) {
          activeCount++;
          totalHash += Number(m.effectiveHashrate) || 16.0;
        }
      });

      setMiners(combinedMiners);
      setSummary({
        activeMiners: activeCount,
        totalMinedTflx: +totalMined.toFixed(2),
        totalHashrate: +totalHash.toFixed(1),
        totalMinersCount: combinedMiners.length,
      });
    } catch (err) {
      console.error('Failed to load cloud miner admin data:', err);
      setFeedback({
        type: 'error',
        message: 'Could not load cloud miner data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinerData();
  }, []);

  // Admin action: Toggle user's mining session
  const handleToggleMining = async (miner) => {
    setActionLoading(true);
    try {
      const nextActive = !miner.isMiningActive;
      const uid = miner.uid || miner.userId;

      // Update via backend
      await apiClient.put(`/miner/admin/user/${uid}`, {
        isMiningActive: nextActive,
        resetSession: nextActive, // start fresh 12h session if activating
      });

      // Update directly in Firestore if available
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'cloudMiner', uid), {
            isMiningActive: nextActive,
            ...(nextActive && {
              sessionStartTime: Date.now(),
              sessionDurationMs: 12 * 60 * 60 * 1000,
            }),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {}
      }

      setFeedback({
        type: 'success',
        message: `Mining ${nextActive ? 'activated for 12h' : 'paused'} for ${miner.userEmail}.`,
      });
      fetchMinerData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update mining state.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin action: Add bonus TFLX
  const handleAddBonusTflx = async (miner, bonusAmount = 50) => {
    setActionLoading(true);
    try {
      const uid = miner.uid || miner.userId;
      const currentMined = Number(miner.minedTflx) || 0;
      const newMined = +(currentMined + bonusAmount).toFixed(2);

      await apiClient.put(`/miner/admin/user/${uid}`, {
        minedTflx: newMined,
      });

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'cloudMiner', uid), {
            minedTflx: newMined,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {}
      }

      setFeedback({
        type: 'success',
        message: `Credited +${bonusAmount} TFLX to ${miner.userEmail}. New Total: ${newMined} TFLX.`,
      });
      fetchMinerData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add bonus TFLX.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter miners by search & status
  const filteredMiners = miners.filter((m) => {
    const matchesSearch =
      (m.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.userId || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return m.isSessionLive;
    if (statusFilter === 'paused') return !m.isSessionLive;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/20 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <Pickaxe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Cloud Miner Operations & Network Hashrate
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervise active 12-hour cloud mining sessions, aggregate token yields, and adjust miner hashrates.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMinerData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Mining Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Miners Now
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
            <span>{summary.activeMiners}</span>
            <span className="text-xs font-bold text-emerald-400">Mining</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Currently executing 12h cycles</span>
          </div>
        </div>

        {/* 2. Total Network Hashrate Running */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Running Network Hashrate
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
            <span>{summary.totalHashrate}</span>
            <span className="text-xs font-bold text-amber-400">TFLX/h</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>Base rate: 16.0 TFLX/h per user</span>
          </div>
        </div>

        {/* 3. Total Mined TFLX Generated */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Mined Hash Yield
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
            <span>{summary.totalMinedTflx}</span>
            <span className="text-xs font-bold text-sky-400">TFLX</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Accumulated community output</span>
          </div>
        </div>

        {/* 4. Total Miners Tracked */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Registered Miner Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
            <span>{summary.totalMinersCount}</span>
            <span className="text-xs font-bold text-purple-400">Members</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Syncing with Firestore collection</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Miners ({miners.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active ({summary.activeMiners})</span>
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Paused / Idle ({miners.length - summary.activeMiners})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or user ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Miners Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">User / Member</th>
                <th className="px-4 py-3.5">Mining Status</th>
                <th className="px-4 py-3.5">Hashrate</th>
                <th className="px-4 py-3.5">Mined TFLX</th>
                <th className="px-4 py-3.5">12h Session Countdown</th>
                <th className="px-4 py-3.5">Streak & Days-Off</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMiners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Pickaxe className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No cloud miner sessions found.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Miners will appear here once members engage with the cloud miner engine.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMiners.map((m) => (
                  <tr key={m.uid || m.userId} className="hover:bg-slate-800/30 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-white text-xs">{m.userEmail}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                        ID: {m.userId}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {m.isSessionLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Mining Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Pause className="w-3 h-3 text-slate-400" />
                          <span>Paused / Idle</span>
                        </span>
                      )}
                    </td>

                    {/* Hashrate */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Zap className="w-3.5 h-3.5" />
                        <span>+{m.effectiveHashrate} TFLX/h</span>
                      </div>
                    </td>

                    {/* Mined TFLX */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-white text-sm">
                        {m.minedTflx}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold ml-1">TFLX</span>
                    </td>

                    {/* Session Countdown */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>{m.timeLeftFormatted}</span>
                          </span>
                        </div>
                        {m.isSessionLive && (
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, (1 - (m.timeLeftMs / (12 * 60 * 60 * 1000))) * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-300">Day {m.streakDays || 0}</span>
                      <p className="text-[10px] text-slate-500">
                        Pre-stake: +{m.preStakingBoost || 0}%
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleMining(m)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            m.isMiningActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                          }`}
                          title={m.isMiningActive ? 'Pause Cloud Mining' : 'Start 12H Session'}
                        >
                          {m.isMiningActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleAddBonusTflx(m, 50)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all cursor-pointer"
                          title="Credit +50 TFLX bonus yield"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+50</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
