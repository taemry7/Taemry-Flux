/**
 * TAEMRY FLUX - Admin User Management (Phase 5)
 * Paginated user directory, search filter, inspection modal with Level 1 downline, ledger history, and manual wallet balance adjustment.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  Wallet,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Network,
  History,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Selected User Modal state
  const [selectedUid, setSelectedUid] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Manual Wallet Adjustment state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Fetch paginated users
  const fetchUsers = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/users', {
        params: { page, limit: 10, search: searchQuery },
      });
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setTotalUsers(res.data.totalUsers || 0);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  // Toggle user block status
  const handleToggleBlock = async (user) => {
    const isBlocking = !user.isBlocked;
    const confirmMsg = isBlocking
      ? `Are you sure you want to BLOCK ${user.email}? They will not be able to log in or earn rewards.`
      : `Unblock ${user.email} and restore account privileges?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/users/${user.uid}/block`);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || `User status updated successfully.`,
        });
        // Update local list
        setUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, isBlocked: res.data.isBlocked } : u))
        );
        if (userDetails && userDetails.user?.uid === user.uid) {
          setUserDetails((prev) => ({
            ...prev,
            user: { ...prev.user, isBlocked: res.data.isBlocked },
          }));
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update user block status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open User Inspection Modal
  const handleInspectUser = async (uid) => {
    setSelectedUid(uid);
    setModalLoading(true);
    setUserDetails(null);
    setAdjustAmount('');
    setAdjustReason('');
    try {
      const res = await apiClient.get(`/admin/users/${uid}`);
      if (res.data?.success) {
        setUserDetails(res.data);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load user details.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Submit wallet adjustment
  const handleWalletAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedUid || !adjustAmount || isNaN(Number(adjustAmount)) || Number(adjustAmount) <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const actionText = adjustAction === 'add' ? 'credit' : 'deduct';
    if (!window.confirm(`Confirm: ${actionText} $${adjustAmount} to ${userDetails?.user?.email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/users/${selectedUid}/wallet`, {
        amount: Number(adjustAmount),
        action: adjustAction,
        reason: adjustReason.trim() || 'Admin manual balance correction',
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || 'Wallet balance adjusted successfully.',
        });
        // Update modal state
        setUserDetails((prev) => ({
          ...prev,
          user: { ...prev.user, walletBalance: res.data.newBalance },
          transactions: [
            {
              type: 'admin_adjustment',
              amount: adjustAction === 'add' ? +Number(adjustAmount) : -Number(adjustAmount),
              balanceAfter: res.data.newBalance,
              description: adjustReason || `Admin adjustment (${adjustAction})`,
              timestamp: new Date().toISOString(),
            },
            ...(prev.transactions || []),
          ],
        }));
        // Update table list
        setUsers((prev) =>
          prev.map((u) => (u.uid === selectedUid ? { ...u, walletBalance: res.data.newBalance } : u))
        );
        setAdjustAmount('');
        setAdjustReason('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust user wallet balance.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback Alert */}
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

      {/* Header with Search and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>User Directory & Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {totalUsers} registered member accounts across all tiers
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name or UID..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchUsers(1, '');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Tier Package</th>
                <th className="py-3.5 px-4 text-right">Wallet Balance</th>
                <th className="py-3.5 px-4 text-center">Referrals</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    <span>Loading directory records...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBlocked = Boolean(u.isBlocked);
                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.substring(0, 2).toUpperCase() || 'TF'}
                          </div>
                          <div className="truncate max-w-[200px]">
                            <p className="font-bold text-white truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase text-[10px]">
                          {u.currentPackage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                        ${Number(u.walletBalance || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                        {u.referralCount || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Blocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspectUser(u.uid)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-colors cursor-pointer"
                            title="Inspect User Details & Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(u)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                            }`}
                            title={isBlocked ? 'Unblock Account' : 'Block Account'}
                          >
                            {isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
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

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalUsers} users)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* USER DETAILS INSPECTION MODAL (Profile + Level 1 Downline + Ledger + Adjustment) */}
      {/* ========================================================================= */}
      {selectedUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {userDetails?.user?.name || 'User Profile & Ledger'}
                  </h3>
                  <p className="text-xs text-slate-400">{userDetails?.user?.email} &bull; UID: {selectedUid}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUid(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
              {modalLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-400" />
                  <p>Loading full profile and downline ledger...</p>
                </div>
              ) : userDetails ? (
                <>
                  {/* Account Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Tier</span>
                      <p className="text-sm font-black text-sky-400 mt-1 uppercase">
                        {userDetails.user?.currentPackage || 'Bronze'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Balance</span>
                      <p className="text-sm font-black text-emerald-400 mt-1">
                        ${Number(userDetails.user?.walletBalance || 0).toFixed(2)} USD
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Referral Count</span>
                      <p className="text-sm font-black text-white mt-1">
                        {userDetails.user?.referralCount || 0} members
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Security Status</span>
                      <p className={`text-sm font-black mt-1 ${userDetails.user?.isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {userDetails.user?.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                  </div>

                  {/* Manual Balance Adjustment Form */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <span>Manual Balance Adjustment (Admin Override)</span>
                    </h4>
                    <form onSubmit={handleWalletAdjustment} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Action Type</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjustAction('add')}
                              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                adjustAction === 'add'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Credit (+)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdjustAction('subtract')}
                              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                adjustAction === 'subtract'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>Debit (-)</span>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Amount ($ USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder="e.g. 25.00"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Audit Reason</label>
                          <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="e.g. Compensation for deposit lag"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Execute Balance Adjustment
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Downline Network (Level 1) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Network className="w-4 h-4 text-sky-400" />
                      <span>Level 1 Direct Referrals ({userDetails.downline?.length || 0})</span>
                    </h4>
                    {userDetails.downline?.length === 0 ? (
                      <p className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500 text-center">
                        This member has not sponsored any Level 1 direct referrals yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {userDetails.downline.map((down, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="truncate">
                              <p className="font-bold text-white truncate">{down.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{down.email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                              {down.currentPackage}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Transaction History Ledger */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      <span>Financial Ledger Transactions ({userDetails.transactions?.length || 0})</span>
                    </h4>
                    {userDetails.transactions?.length === 0 ? (
                      <p className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500 text-center">
                        No transactions on record for this user.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-950/40">
                        {userDetails.transactions.map((tx, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900/60 flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <p className="font-semibold text-white">{tx.description || tx.type}</p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(tx.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                Number(tx.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {Number(tx.amount) >= 0 ? '+' : ''}${Number(tx.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">TAEMRY Core Verification Engine</span>
              <button
                onClick={() => setSelectedUid(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
