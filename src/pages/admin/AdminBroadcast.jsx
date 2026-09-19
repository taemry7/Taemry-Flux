/**
 * TAEMRY FLUX - Admin Broadcast Notification (Phase 5)
 * Global announcements dispatch to all active platform members with live preview card.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminBroadcast() {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/admin/notifications/broadcast').then((res) => {
      if (mounted && res.data?.notifications?.length > 0) {
        setHistory(res.data.notifications.map((n) => ({
          title: n.title,
          message: n.message,
          author: n.author || 'Admin',
          date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent',
        })));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill out both title and message.');
      return;
    }

    setSending(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await apiClient.post('/admin/notifications/broadcast', {
        title: title.trim(),
        message: message.trim(),
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: 'Announcement broadcasted to all platform members successfully.',
        });
        setHistory((prev) => [
          {
            title: title.trim(),
            message: message.trim(),
            author: currentUser?.email || 'Admin',
            date: new Date().toLocaleDateString(),
          },
          ...prev,
        ]);
        setTitle('');
        setMessage('');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to dispatch broadcast announcement.',
      });
    } finally {
      setSending(false);
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
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-400" />
          <span>Global Member Broadcast System</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Dispatch official announcements and platform updates directly to user dashboards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Send className="w-4 h-4 text-sky-400" />
            <span>Compose Announcement</span>
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Announcement Headline / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Upgrade Complete: Ad Stream Payouts Doubled"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Broadcast Body Message
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide clear, concise details for all users to read on their dashboard..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 leading-relaxed resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sends to all registered member dashboards</span>
              </span>

              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Publishing...' : 'Dispatch Broadcast'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card & Recent Broadcasts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Preview */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>User Dashboard Live Preview</span>
            </h4>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 text-white space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>Platform Announcement</span>
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {title || 'Headline will appear here'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {message || 'The full message text will be displayed to all users upon signing into their dashboard.'}
              </p>
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Previous Broadcast Records
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white truncate max-w-[200px]">{item.title}</p>
                    <span className="text-[10px] text-slate-500">{item.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
