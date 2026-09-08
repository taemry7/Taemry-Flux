import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Database,
  Mail,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  User,
  ShieldCheck,
  Calendar,
  Activity,
  Server
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../api/client';

export default function AdminMaintenance() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }

  // Manual Override State: Reset daily limit
  const [users, setUsers] = useState([]);
  const [selectedUid, setSelectedUid] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await apiGet('/api/admin/users');
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load users for maintenance override:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiPost('/api/admin/maintenance/backup');
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Firestore backup generated successfully: ${res.backup?.filename || 'backup.json'}. Stored in /backups directory with 30-day retention.`,
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Backup failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDailyReport = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiPost('/api/admin/maintenance/daily-report');
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Daily performance report generated and emailed to admin (${res.reportStats?.dauCount} DAU, $${Number(res.reportStats?.totalRevenue || 0).toFixed(2)} USD revenue).`,
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to dispatch report.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    if (!window.confirm('Are you sure you want to purge audit logs older than 90 days?')) return;
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiPost('/api/admin/maintenance/cleanup-logs');
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'Audit logs pruned successfully.',
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to prune logs.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiPost('/api/admin/maintenance/test-error');
      if (res.success) {
        setFeedback({
          type: 'success',
          text: 'Simulated critical error generated. Admin notification email dispatched successfully.',
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to test error.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetLimit = async (uid) => {
    const targetUid = uid || selectedUid;
    if (!targetUid) {
      setFeedback({ type: 'error', text: 'Please select or search a user first.' });
      return;
    }

    try {
      setOverrideLoading(true);
      setFeedback(null);
      const res = await apiPut(`/api/admin/users/${targetUid}/reset-daily-limit`);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Daily ad count reset to 0 for user UID: ${targetUid}. User can watch ads immediately!`,
        });
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to reset daily limit.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-[#38bdf8]" />
            Post-Launch Maintenance & Operations (Phase 7)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute manual maintenance tasks, trigger automated database exports, and perform member overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Healthy
          </span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium">{feedback.text}</div>
        </div>
      )}

      {/* Phase 7 Maintenance Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Firestore Backup */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DATA INTEGRITY
              </span>
              <div className="p-2 bg-sky-950 text-sky-400 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Firestore Database Backup
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Automated Cloud Function triggers every 24 hours at 02:00 UTC. Export all core collections (users, deposits, withdrawals, tickets, logs) to a structured JSON archive with 30-day retention pruning.
            </p>
          </div>

          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{loading ? 'Exporting...' : 'Export Full Backup Now'}</span>
          </button>
        </div>

        {/* Card 2: Daily Active Users & Performance Report */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DAILY METRICS & DAU
              </span>
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Platform Health & DAU Report
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Automated Cloud Scheduler job runs at 23:59 UTC and delivers an aggregated performance email to the administrator at 08:00 AM UTC containing DAU, signups, deposit revenue, and pending ticket alerts.
            </p>
          </div>

          <button
            onClick={handleDailyReport}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending...' : 'Generate & Email Report Now'}</span>
          </button>
        </div>

        {/* Card 3: 90-Day Audit Log Cleanup */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DATABASE HYGIENE
              </span>
              <div className="p-2 bg-amber-950 text-amber-400 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Prune Audit Logs (&gt; 90 Days)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Runs automatically on schedule to prevent Firestore bloat by clearing administrative and activity logs older than 90 days while preserving recent operational audit history.
            </p>
          </div>

          <button
            onClick={handleCleanupLogs}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Pruning...' : 'Run 90-Day Log Prune'}</span>
          </button>
        </div>

        {/* Card 4: Critical Error Alert System Test */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ERROR MONITORING
              </span>
              <div className="p-2 bg-red-950 text-red-400 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Admin Critical Error Alert Pipeline
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Server-wide Express error middleware catches unexpected exceptions, generates full stack traces, and immediately emails admin@taemryflux.com via Nodemailer.
            </p>
          </div>

          <button
            onClick={handleTestAlert}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{loading ? 'Testing...' : 'Test Error Alert Email'}</span>
          </button>
        </div>
      </div>

      {/* Manual Override Tool: Daily Ad View Reset */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-sky-400" />
              Manual Override: Reset Member Daily Ad Limit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              If a member experiences an issue or requires support override, reset their watched ad count to 0 to re-enable viewing.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user by email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Package</th>
                <th className="px-4 py-2.5">Daily Limit</th>
                <th className="px-4 py-2.5">Ads Watched Today</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.slice(0, 15).map((u) => (
                <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-white truncate max-w-xs">{u.email}</div>
                    <div className="text-[10px] font-mono text-slate-500">{u.uid}</div>
                  </td>
                  <td className="px-4 py-2.5 uppercase font-bold text-sky-400">
                    {u.currentPackage || 'None'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    {u.dailyLimit || 20} ads/day
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        (u.dailyAdCount || 0) >= (u.dailyLimit || 20)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.dailyAdCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleResetLimit(u.uid)}
                      disabled={overrideLoading}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reset to 0
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
