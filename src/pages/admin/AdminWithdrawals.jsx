/**
 * TAEMRY FLUX - Admin Withdrawals Settlement Engine (Phase 5)
 * Payout verification, account disbursement check, mark as paid / rejection handler.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'paid' | 'rejected' | 'all'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedId, setCopiedId] = useState(null);

  // Settlement Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: '', // 'mark-paid' | 'reject'
    withdrawal: null,
    reason: '',
  });

  const fetchWithdrawals = async (filter = statusFilter) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/withdrawals', {
        params: { status: filter },
      });
      if (res.data?.success) {
        setWithdrawals(res.data.withdrawals || []);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load withdrawals.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(statusFilter);
  }, [statusFilter]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openActionModal = (withdrawal, action) => {
    setConfirmModal({
      isOpen: true,
      action,
      withdrawal,
      reason: action === 'reject' ? 'Recipient account details mismatch or bank failure.' : '',
    });
  };

  const handleConfirmAction = async () => {
    const { withdrawal, action, reason } = confirmModal;
    if (!withdrawal) return;

    setActionLoading(true);
    const wid = withdrawal.withdrawalId || withdrawal.id;
    try {
      if (action === 'mark-paid') {
        const res = await apiClient.put(`/admin/withdrawals/${wid}/mark-paid`);
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Withdrawal of $${withdrawal.amountUSD} marked as paid successfully. User debited.`,
          });
          setWithdrawals((prev) =>
            prev.map((w) =>
              (w.withdrawalId || w.id) === wid ? { ...w, status: 'paid' } : w
            )
          );
        }
      } else {
        const res = await apiClient.put(`/admin/withdrawals/${wid}/reject`, {
          reason: reason.trim() || 'Invalid recipient details.',
        });
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Withdrawal of $${withdrawal.amountUSD} rejected.`,
          });
          setWithdrawals((prev) =>
            prev.map((w) =>
              (w.withdrawalId || w.id) === wid ? { ...w, status: 'rejected', rejectReason: reason } : w
            )
          );
        }
      }
      setConfirmModal({ isOpen: false, action: '', withdrawal: null, reason: '' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || `Failed to ${action} withdrawal.`,
      });
    } finally {
      setActionLoading(false);
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

      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-sky-400" />
            <span>Withdrawal Requests & Payout Settlement</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process member cashouts to Easypaisa, JazzCash, Meezan Bank, and Crypto wallets
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'paid', label: 'Paid' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
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

      {/* Withdrawals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Recipient Account Details</th>
                <th className="py-3.5 px-4">Member User</th>
                <th className="py-3.5 px-4">Disbursement Method</th>
                <th className="py-3.5 px-4 text-right">Amount (USD / PKR)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Requested At</th>
                <th className="py-3.5 px-4 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    <span>Loading withdrawal requests...</span>
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No withdrawals matching the "{statusFilter}" filter.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => {
                  const wid = w.withdrawalId || w.id;
                  const isPending = w.status === 'pending';
                  return (
                    <tr key={wid} className="hover:bg-slate-800/30 transition-colors">
                      {/* Recipient Account Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span>{w.accountName || 'Beneficiary'}</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300">
                            <span className="truncate max-w-[180px]">{w.accountNumber || 'N/A'}</span>
                            {w.accountNumber && (
                              <button
                                onClick={() => copyToClipboard(w.accountNumber, wid)}
                                className="p-1 hover:text-white transition-colors cursor-pointer"
                                title="Copy account number"
                              >
                                {copiedId === wid ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{w.userEmail || 'Member'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {wid}</p>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium capitalize text-[11px]">
                          {w.method?.replace('_', ' ') || 'Cashout'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-black text-sky-400 text-sm">
                          ${Number(w.amountUSD || 0).toFixed(2)} USD
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {Number(w.amountPKR || 0).toLocaleString()} PKR
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {w.status === 'paid' || w.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : w.status === 'rejected' ? (
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
                        {w.createdAt ? new Date(w.createdAt).toLocaleString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openActionModal(w, 'mark-paid')}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => openActionModal(w, 'reject')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Disbursed</span>
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
      {/* MARK AS PAID / REJECT MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && confirmModal.withdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {confirmModal.action === 'mark-paid' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-sky-400" />
                    <span>Confirm Payout Settlement</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Reject Withdrawal Request</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: '', withdrawal: null, reason: '' })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-semibold text-white">{confirmModal.withdrawal.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account / IBAN:</span>
                <span className="font-mono text-sky-300">{confirmModal.withdrawal.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount USD:</span>
                <span className="font-bold text-sky-400">${confirmModal.withdrawal.amountUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PKR Payout:</span>
                <span className="font-bold text-white">{confirmModal.withdrawal.amountPKR} PKR</span>
              </div>
            </div>

            {confirmModal.action === 'mark-paid' ? (
              <p className="text-xs text-sky-300/90 leading-relaxed">
                Ensure you have dispatched <strong>{confirmModal.withdrawal.amountPKR} PKR</strong> to {confirmModal.withdrawal.accountName}. Confirming will mark this withdrawal as paid and deduct ${confirmModal.withdrawal.amountUSD} USD from their platform wallet.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">
                  Rejection Reason:
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
                onClick={() => setConfirmModal({ isOpen: false, action: '', withdrawal: null, reason: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer ${
                  confirmModal.action === 'mark-paid'
                    ? 'bg-sky-600 hover:bg-sky-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmModal.action === 'mark-paid'
                  ? 'Confirm Settlement'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
