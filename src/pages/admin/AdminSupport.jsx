import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
  Send,
  ExternalLink,
  ShieldCheck,
  User,
  Mail
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../../api/client';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for modal inspection / reply
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusDraft, setStatusDraft] = useState('open');
  const [updating, setUpdating] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let url = `/support/admin/all?status=${statusFilter}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await apiGet(url);
      if (res.success) {
        setTickets(res.tickets || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load admin support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || '');
    setStatusDraft(ticket.status || 'open');
    setActionAlert(null);
  };

  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    try {
      setUpdating(true);
      setActionAlert(null);

      const res = await apiPut(`/support/admin/${selectedTicket.ticketId}/status`, {
        status: statusDraft,
        adminReply: replyText,
      });

      if (res.success) {
        setActionAlert({ type: 'success', text: `Ticket #${selectedTicket.ticketId} successfully updated and user notified.` });
        setSelectedTicket(res.ticket);
        fetchTickets();
      } else {
        setActionAlert({ type: 'error', text: res.message || 'Failed to update ticket.' });
      }
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickResolve = async () => {
    setStatusDraft('resolved');
    try {
      setUpdating(true);
      const res = await apiPut(`/support/admin/${selectedTicket.ticketId}/status`, {
        status: 'resolved',
        adminReply: replyText || 'Issue resolved by administration.',
      });
      if (res.success) {
        setActionAlert({ type: 'success', text: `Ticket #${selectedTicket.ticketId} marked as RESOLVED.` });
        setSelectedTicket(res.ticket);
        fetchTickets();
      }
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-[#38bdf8]" />
            User Support & Ticketing Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review member issues, provide official admin responses, and monitor resolution velocity.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Inquiries</span>
          <p className="text-2xl font-black text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-slate-900/70 border border-amber-500/20 p-4 rounded-xl">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Open / Pending</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{metrics.open}</p>
        </div>
        <div className="bg-slate-900/70 border border-sky-500/20 p-4 rounded-xl">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">In Progress</span>
          <p className="text-2xl font-black text-sky-400 mt-1">{metrics.inProgress}</p>
        </div>
        <div className="bg-slate-900/70 border border-emerald-500/20 p-4 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Resolved</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.resolved}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTickets();
          }}
          className="relative w-full sm:w-72"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ticket ID, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            Loading support tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-300">No tickets found</p>
            <p className="mt-0.5">Try selecting another filter or searching a different term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">User / Email</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t.ticketId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-400">
                      {t.ticketId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[160px]">{t.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200 max-w-xs truncate">
                      {t.subject}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.priority === 'urgent'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {t.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'in-progress'
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenTicket(t)}
                        className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Inspect & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-sky-400 px-2.5 py-1 bg-sky-950 border border-sky-800 rounded-lg">
                  {selectedTicket.ticketId}
                </span>
                <span className="text-xs text-slate-400">
                  Opened {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert in Modal */}
            {actionAlert && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  actionAlert.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border-red-800 text-red-300'
                }`}
              >
                {actionAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{actionAlert.text}</span>
              </div>
            )}

            {/* Member & Ticket Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">User Email</span>
                <span className="text-white font-medium truncate block">{selectedTicket.userEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Priority</span>
                <span className="text-amber-400 font-bold uppercase text-[11px]">{selectedTicket.priority || 'normal'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">User UID</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block">{selectedTicket.userId}</span>
              </div>
            </div>

            {/* User Subject & Message */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Status Selector & Admin Reply */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ticket Status
                </label>
                <div className="flex items-center gap-1.5">
                  {['open', 'in-progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusDraft(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        statusDraft === st
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'in-progress' ? 'In Progress' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Official Administrator Reply (Emailed to user)
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your official guidance, resolution note, or instructions here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleQuickResolve}
                disabled={updating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Quick Resolve</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTicket}
                  disabled={updating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updating ? 'Saving...' : 'Save & Notify User'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
