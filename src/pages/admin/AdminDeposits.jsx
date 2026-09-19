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
  FileText,
  Copy,
  Check,
  Edit2,
  Search,
  Filter,
  Save,
  Zap,
  Radio,
  Smartphone,
  Send
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminDeposits() {
  const [allDeposits, setAllDeposits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedTid, setCopiedTid] = useState('');

  // 3737 / 8484 Instant SMS Gateway State
  const [showSmsGatewayModal, setShowSmsGatewayModal] = useState(false);
  const [smsRecords, setSmsRecords] = useState([]);
  const [smsTestInput, setSmsTestInput] = useState('You have received Rs. 3000 from 03001234567. Trx ID: 1029384756. New balance is Rs. 15000.');
  const [smsTestSender, setSmsTestSender] = useState('3737');
  const [smsTestResult, setSmsTestResult] = useState(null);
  const [smsTesting, setSmsTesting] = useState(false);

  // Lightbox Screenshot Modal
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // Approval / Rejection Action Modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: '', // 'approve' | 'reject'
    deposit: null,
    reason: '',
  });

  // Edit Deposit Details Modal
  const [editModal, setEditModal] = useState({
    isOpen: false,
    deposit: null,
    transactionId: '',
    adminNotes: '',
  });

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/deposits', {
        params: { status: 'all' },
      });
      if (res.data?.success) {
        const list = res.data.deposits || [];
        setAllDeposits(list);
        // If there are pending deposits and we are on initial load, auto-focus on pending
        const hasPending = list.some((d) => d.status === 'pending');
        if (hasPending) {
          setStatusFilter('pending');
        }
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

  const fetchSmsRecords = async () => {
    try {
      const res = await apiClient.get('/deposits/sms-records');
      if (res.data?.success) {
        setSmsRecords(res.data.records || []);
      }
    } catch (e) {
      console.warn('Failed to load SMS records:', e);
    }
  };

  const handleTestSms = async () => {
    setSmsTesting(true);
    setSmsTestResult(null);
    try {
      const res = await apiClient.post('/deposits/sms-webhook', {
        sender: smsTestSender,
        message: smsTestInput,
      });
      setSmsTestResult(res.data);
      fetchSmsRecords();
      fetchDeposits();
      setFeedback({
        type: 'success',
        message: 'Test SMS successfully processed! Verification completed.',
      });
    } catch (err) {
      setSmsTestResult({
        success: false,
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setSmsTesting(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

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
          setAllDeposits((prev) =>
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
          setAllDeposits((prev) =>
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
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || `Failed to ${action} deposit.`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminAttachReceipt = async (depId, file) => {
    if (!file) return;
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('screenshot', file);
      const res = await apiClient.put(`/admin/deposits/${depId}/receipt`, formData);
      if (res.data?.success) {
        const newUrl = res.data.screenshotURL;
        setAllDeposits((prev) =>
          prev.map((d) =>
            (d.depositId || d.id) === depId
              ? { ...d, screenshotURL: newUrl }
              : d
          )
        );
        setFeedback({ type: 'success', message: 'Receipt attached successfully!' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to attach receipt.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (deposit) => {
    setEditModal({
      isOpen: true,
      deposit,
      transactionId: deposit.transactionId || deposit.tid || '',
      adminNotes: deposit.adminNotes || '',
    });
  };

  const handleSaveDepositEdit = async (e) => {
    e.preventDefault();
    if (!editModal.deposit) return;
    const depId = editModal.deposit.depositId || editModal.deposit.id;
    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/deposits/${depId}/edit`, {
        transactionId: editModal.transactionId,
        adminNotes: editModal.adminNotes,
      });
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Deposit details for #${depId} successfully updated.`,
        });
        setAllDeposits((prev) =>
          prev.map((d) =>
            (d.depositId || d.id) === depId
              ? {
                  ...d,
                  transactionId: editModal.transactionId,
                  tid: editModal.transactionId,
                  adminNotes: editModal.adminNotes,
                }
              : d
          )
        );
        setEditModal({ isOpen: false, deposit: null, transactionId: '', adminNotes: '' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update deposit record.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = allDeposits.filter((d) => d.status === 'pending').length;
  const approvedCount = allDeposits.filter((d) => d.status === 'approved').length;
  const rejectedCount = allDeposits.filter((d) => d.status === 'rejected').length;
  const totalCount = allDeposits.length;

  const approvedVolume = allDeposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + Number(d.amountUSD || 0), 0);

  const pendingVolume = allDeposits
    .filter((d) => d.status === 'pending')
    .reduce((sum, d) => sum + Number(d.amountUSD || 0), 0);

  const displayedDeposits = allDeposits.filter((d) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    // 2. Method Filter
    if (methodFilter !== 'all') {
      const m = (d.method || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fm = methodFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!m.includes(fm)) return false;
    }
    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tid = String(d.transactionId || d.tid || '').toLowerCase();
      const email = String(d.userEmail || '').toLowerCase();
      const amount = String(d.amountUSD || '');
      const id = String(d.depositId || d.id || '').toLowerCase();
      if (!tid.includes(q) && !email.includes(q) && !amount.includes(q) && !id.includes(q)) {
        return false;
      }
    }
    return true;
  });

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

      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            <span>Deposit Approvals & Screenshot Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {totalCount} records &bull; Approved ${approvedVolume.toFixed(2)} &bull; Pending ${pendingVolume.toFixed(2)}
          </p>
        </div>

        {/* Tab Filter, SMS Gateway & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowSmsGatewayModal(true);
              fetchSmsRecords();
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Configure and Test 3737 / 8484 SMS Auto-Approval"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>3737 / 8484 SMS Gateway</span>
          </button>
          <button
            onClick={fetchDeposits}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer border border-slate-700"
            title="Refresh Deposits"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'approved', label: `Approved (${approvedCount})` },
              { id: 'rejected', label: `Rejected (${rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* Search & Method Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deposits by TID, Member Email, or Amount..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Gateways</option>
            <option value="jazzcash">JazzCash</option>
            <option value="upaisa">UPaisa</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="bank">Bank Transfer</option>
            <option value="crypto">Crypto (USDT)</option>
          </select>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Receipt Proof</th>
                <th className="py-3.5 px-4">Transaction ID (TID)</th>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Loading deposit records...</span>
                  </td>
                </tr>
              ) : displayedDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No deposits matching the "{statusFilter}" filter.
                  </td>
                </tr>
              ) : (
                displayedDeposits.map((dep) => {
                  const depId = dep.depositId || dep.id;
                  const isPending = dep.status === 'pending';
                  const tid = dep.transactionId || dep.trxId || '';
                  return (
                    <tr key={depId} className="hover:bg-slate-800/30 transition-colors">
                      {/* Screenshot thumbnail & View Receipt button */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const receiptUrl = dep.screenshotURL || dep.screenshot || dep.screenshotUrl || dep.receiptURL || dep.receiptUrl || dep.receiptProof || dep.proofUrl || dep.receipt || dep.image;
                          return receiptUrl ? (
                            <div className="flex items-center gap-2.5">
                              <div
                                onClick={() => setActiveScreenshot(receiptUrl)}
                                className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/60 bg-slate-900 cursor-pointer relative group shrink-0 shadow-md hover:border-emerald-400 transition-all"
                                title="Click to zoom receipt"
                              >
                                <img
                                  src={receiptUrl}
                                  alt="Receipt"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-emerald-400" />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => setActiveScreenshot(receiptUrl)}
                                  className="text-[12px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>View Receipt</span>
                                </button>
                                <span className="text-[10px] text-slate-400">Click to zoom</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-amber-400">No Receipt</span>
                                <label className="text-[10px] text-slate-400 hover:text-emerald-400 cursor-pointer underline">
                                  + Attach Receipt
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleAdminAttachReceipt(depId, e.target.files?.[0])}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Transaction ID (TID) */}
                      <td className="py-3.5 px-4">
                        {tid ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                              {tid}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(tid);
                                setCopiedTid(tid);
                                setTimeout(() => setCopiedTid(''), 2000);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                              title="Copy Transaction ID"
                            >
                              {copiedTid === tid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No TID provided</span>
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
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                            {dep.autoApproved && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                <span>1-Sec SMS</span>
                              </span>
                            )}
                          </div>
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
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
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
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(dep)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 flex items-center gap-1"
                            title="Edit TID or Admin Notes"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-[10px] hidden sm:inline">Edit</span>
                          </button>
                        </div>
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

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-white">{confirmModal.deposit.userEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction ID (TID):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {confirmModal.deposit.transactionId || confirmModal.deposit.trxId || 'N/A'}
                  </span>
                  {(confirmModal.deposit.transactionId || confirmModal.deposit.trxId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const t = confirmModal.deposit.transactionId || confirmModal.deposit.trxId;
                        navigator.clipboard.writeText(t);
                        setCopiedTid(t);
                        setTimeout(() => setCopiedTid(''), 2000);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Copy TID"
                    >
                      {copiedTid === (confirmModal.deposit.transactionId || confirmModal.deposit.trxId) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount USD:</span>
                <span className="font-bold text-emerald-400">${confirmModal.deposit.amountUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold capitalize text-slate-200">{confirmModal.deposit.method}</span>
              </div>

              {(() => {
                const modalReceipt = confirmModal.deposit.screenshotURL || confirmModal.deposit.screenshot || confirmModal.deposit.receiptURL || confirmModal.deposit.receiptProof || confirmModal.deposit.proofUrl;
                return modalReceipt ? (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold text-[11px]">Attached Receipt Proof:</span>
                      <button
                        type="button"
                        onClick={() => setActiveScreenshot(modalReceipt)}
                        className="text-emerald-400 hover:underline text-[11px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Zoom Full View</span>
                      </button>
                    </div>
                    <div
                      onClick={() => setActiveScreenshot(modalReceipt)}
                      className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 cursor-pointer flex items-center justify-center relative group"
                      title="Click to zoom receipt"
                    >
                      <img
                        src={modalReceipt}
                        alt="Receipt Proof"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
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

      {/* ========================================================================= */}
      {/* EDIT DEPOSIT DETAILS MODAL (Admin Edit Option) */}
      {/* ========================================================================= */}
      {editModal.isOpen && editModal.deposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-400" />
                <span>Edit Deposit Record #{editModal.deposit.depositId || editModal.deposit.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, deposit: null, transactionId: '', adminNotes: '' })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepositEdit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-slate-400">
                  <strong className="text-slate-300">Member:</strong> {editModal.deposit.userEmail}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Amount:</strong> ${editModal.deposit.amountUSD} USD ({editModal.deposit.method})
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Status:</strong> <span className="capitalize font-semibold text-emerald-400">{editModal.deposit.status}</span>
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Transaction ID (TID)
                </label>
                <input
                  type="text"
                  value={editModal.transactionId}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, transactionId: e.target.value }))}
                  placeholder="Enter or correct Transaction ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Admin Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={editModal.adminNotes}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="e.g. Verified transaction manually in JazzCash merchant app at 14:32"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, deposit: null, transactionId: '', adminNotes: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 4. 3737 & 8484 SMS AUTO-APPROVAL GATEWAY MODAL                            */}
      {/* ========================================================================= */}
      {showSmsGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>3737 & 8484 Instant Auto-Approval Gateway</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Live Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated 1-to-5 second deposit verification for Easypaisa & JazzCash
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmsGatewayModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Webhook URL Bar */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Incoming SMS Webhook URL (Forwarder Endpoint):</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">POST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/deposits/sms-webhook`}
                  className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/deposits/sms-webhook`);
                    setFeedback({ type: 'success', message: 'Webhook URL copied to clipboard!' });
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* How It Works Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>1. SIM Receives SMS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Easypaisa <strong>3737</strong> or JazzCash <strong>8484/8558</strong> sends transaction SMS to your phone.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>2. 1-Sec Auto Match</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  System parses TID & PKR amount. Matching user deposit is auto-approved in 1 second & balance credited!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3. Permanent Lock</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  TID is marked <strong>CLAIMED</strong> immediately. If anyone tries to submit the same TID again, it is blocked.
                </p>
              </div>
            </div>

            {/* Interactive Live SMS Simulator & Tester */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Simulator / Test Parser (Try it now)</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Sender:</span>
                  <select
                    value={smsTestSender}
                    onChange={(e) => setSmsTestSender(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="3737">Easypaisa (3737)</option>
                    <option value="8484">JazzCash (8484)</option>
                    <option value="8558">JazzCash (8558)</option>
                    <option value="SadaPay">SadaPay</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={smsTestInput}
                onChange={(e) => setSmsTestInput(e.target.value)}
                placeholder="Paste incoming SMS text here..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Simulates incoming SMS payload to test instant TID detection & auto-approval.
                </span>
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={smsTesting || !smsTestInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${smsTesting ? 'animate-spin' : ''}`} />
                  <span>{smsTesting ? 'Processing...' : 'Test & Push SMS Webhook'}</span>
                </button>
              </div>

              {/* Test Result Display */}
              {smsTestResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                  smsTestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {smsTestResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    <span>{smsTestResult.message || (smsTestResult.success ? 'SMS Parsed Successfully!' : 'Failed to parse SMS')}</span>
                  </p>
                  {smsTestResult.tid && (
                    <p className="text-[11px] text-slate-300">
                      Detected TID: <strong>{smsTestResult.tid}</strong> &bull; Amount: <strong>Rs. {smsTestResult.amountPKR}</strong> &bull; Method: <strong className="uppercase">{smsTestResult.method}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* List of Incoming SMS Records */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent SMS Payment Logs ({smsRecords.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={fetchSmsRecords}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                {smsRecords.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No SMS records received yet. Test one above or connect your SMS forwarder app!
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-[11px] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">TID</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Gateway</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {smsRecords.map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 text-slate-200 font-bold">{r.tid}</td>
                            <td className="py-2 px-3 text-emerald-400 font-bold">Rs. {Number(r.amountPKR || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-slate-400 uppercase">{r.method || 'SMS'}</td>
                            <td className="py-2 px-3">
                              {r.status === 'CLAIMED' ? (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                                  CLAIMED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  UNCLAIMED
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[10px]">
                              {r.receivedAt ? new Date(r.receivedAt).toLocaleTimeString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSmsGatewayModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
