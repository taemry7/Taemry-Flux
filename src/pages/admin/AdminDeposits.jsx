/**
 * TAEMRY FLUX - Admin Deposits Approval Engine (Phase 5)
 * Deposit request verification, screenshot lightbox viewer, and ledger approval/rejection handling.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Lightbox Screenshot Modal
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // Approval / Rejection Action Modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: '', // 'approve' | 'reject'
    deposit: null,
    reason: '',
  });

  const fetchDeposits = async (filter = statusFilter) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/deposits', {
        params: { status: filter },
      });
      if (res.data?.success) {
        setDeposits(res.data.deposits || []);
      }
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load deposits.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(statusFilter);
  }, [statusFilter]);

  // Open modal for approve or reject
  const openActionModal = (deposit, action) => {
    setConfirmModal({
      isOpen: true,
      action,
      deposit,
      reason: action === 'reject' ? 'Screenshot unreadable or unconfirmed transaction' : '',
    });
  };

  // Submit approval or rejection
  const handleConfirmAction = async () => {
    const { deposit, action, reason } = confirmModal;
    if (!deposit) return;

    setActionLoading(true);
    try {
      if (action === 'approve') {
        const res = await apiClient.put(`/admin/deposits/${deposit.depositId || deposit.id}/approve`);
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Deposit of $${deposit.amountUSD} successfully approved and credited to ${deposit.userEmail}.`,
          });
          // Update list status
          setDeposits((prev) =>
            prev.map((d) =>
              (d.depositId || d.id) === (deposit.depositId || deposit.id)
                ? { ...d, status: 'approved' }
                : d
            )
          );
        }
      } else {
        const res = await apiClient.put(`/admin/deposits/${deposit.depositId || deposit.id}/reject`, {
          reason: reason.trim() || 'Unverified screenshot or transaction.',
        });
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Deposit of $${deposit.amountUSD} was rejected.`,
          });
          setDeposits((prev) =>
            prev.map((d) =>
              (d.depositId || d.id) === (deposit.depositId || deposit.id)
                ? { ...d, status: 'rejected', rejectReason: reason }
                : d
            )
          );
        }
      }
      setConfirmModal({ isOpen: false, action: '', deposit: null, reason: '' });
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} deposit.`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = deposits.filter((d) => d.status === 'pending').length;

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

      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            <span>Deposit Approvals & Screenshot Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review member bank slips, Easypaisa/JazzCash receipts, and crypto transaction records
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Receipt</th>
                <th className="py-3.5 px-4">Member User</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount (USD / PKR)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Requested Date</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Loading deposit records...</span>
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No deposits matching the "{statusFilter}" filter.
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => {
                  const depId = dep.depositId || dep.id;
                  const isPending = dep.status === 'pending';
                  return (
                    <tr key={depId} className="hover:bg-slate-800/30 transition-colors">
                      {/* Screenshot thumbnail */}
                      <td className="py-3.5 px-4">
                        {dep.screenshotURL ? (
                          <div
                            onClick={() => setActiveScreenshot(dep.screenshotURL)}
                            className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer relative group shrink-0"
                            title="Click to view full receipt"
                          >
                            <img
                              src={dep.screenshotURL}
                              alt="Receipt"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{dep.userEmail || 'Member'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {depId}</p>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium capitalize text-[11px]">
                          {dep.method?.replace('_', ' ') || 'Bank Transfer'}
                        </span>
                      </td>

                      {/* Amount USD & PKR */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-black text-emerald-400 text-sm">
                          +${Number(dep.amountUSD || 0).toFixed(2)} USD
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {Number(dep.amountPKR || 0).toLocaleString()} PKR
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {dep.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : dep.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {dep.createdAt ? new Date(dep.createdAt).toLocaleString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openActionModal(dep, 'approve')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(dep, 'reject')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREENSHOT LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-bold text-slate-300">Payment Screenshot Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={activeScreenshot}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:text-white transition-colors"
                  title="Open image in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActiveScreenshot(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[80vh] flex items-center justify-center bg-black/40">
              <img
                src={activeScreenshot}
                alt="Receipt Full View"
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE / REJECT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && confirmModal.deposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {confirmModal.action === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Approve Deposit Request</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Reject Deposit Request</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: '', deposit: null, reason: '' })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-white">{confirmModal.deposit.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount USD:</span>
                <span className="font-bold text-emerald-400">${confirmModal.deposit.amountUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold capitalize text-slate-200">{confirmModal.deposit.method}</span>
              </div>
            </div>

            {confirmModal.action === 'approve' ? (
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                By confirming, <strong>+${confirmModal.deposit.amountUSD} USD</strong> will be credited directly to the member's wallet balance and recorded in the audit ledger.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">
                  Rejection Reason (Audit record):
                </label>
                <input
                  type="text"
                  value={confirmModal.reason}
                  onChange={(e) =>
                    setConfirmModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: '', deposit: null, reason: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer ${
                  confirmModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmModal.action === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
