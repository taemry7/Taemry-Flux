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
  UserX,
  Pickaxe,
  Zap,
  Play,
  Pause,
  Flame,
  Clock,
  Package,
  Award,
  Check,
  Trash2
} from 'lucide-react';
import apiClient from '../../api/client';
import { db, isFirebaseConfigured } from '../../firebase/firebase.config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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
  const [userMiner, setUserMiner] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Manual Package & Eligibility state
  const [selectedPackage, setSelectedPackage] = useState('None');
  const [packageReason, setPackageReason] = useState('');

  // Manual Wallet Adjustment state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Miner adjustment state in user profile
  const [minerBonusInput, setMinerBonusInput] = useState('');
  const [minerHashrateInput, setMinerHashrateInput] = useState('');

  // Fetch paginated users (merging Backend and direct Firestore)
  const fetchUsers = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      // 1. Fetch from backend
      const res = await apiClient.get('/admin/users', {
        params: { page, limit: 10, search: searchQuery },
      }).catch(() => null);

      let backendUsers = [];
      let backendTotal = 0;
      let backendPages = 1;

      if (res?.data?.success) {
        backendUsers = res.data.users || [];
        backendTotal = res.data.totalUsers || 0;
        backendPages = res.data.totalPages || 1;
      }

      // 2. Fetch from client Firestore if available
      let firestoreUsers = [];
      if (isFirebaseConfigured && db) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          snap.forEach((d) => {
            const data = d.data() || {};
            firestoreUsers.push({
              uid: d.id,
              email: data.email || 'member@taemry.com',
              name: data.displayName || data.name || 'Member',
              currentPackage: data.currentPackage || 'None',
              walletBalance: Number(data.walletBalance || 0),
              referralCount: Number(data.referralCount || 0),
              isEligible: Boolean(data.isEligible),
              isBlocked: Boolean(data.isBlocked),
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });
        } catch (fsErr) {
          console.warn('Direct Firestore users read notice:', fsErr.message);
        }
      }

      // Merge backend and firestore users
      const userMap = new Map();
      backendUsers.forEach((u) => userMap.set(u.uid, u));
      firestoreUsers.forEach((u) => {
        if (userMap.has(u.uid)) {
          userMap.set(u.uid, { ...userMap.get(u.uid), ...u });
        } else {
          userMap.set(u.uid, u);
        }
      });

      let allMerged = Array.from(userMap.values());
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        allMerged = allMerged.filter(
          (u) =>
            (u.email || '').toLowerCase().includes(q) ||
            (u.name || '').toLowerCase().includes(q) ||
            (u.uid || '').toLowerCase().includes(q)
        );
      }

      setTotalUsers(Math.max(backendTotal, allMerged.length));
      setTotalPages(Math.max(backendPages, Math.ceil(allMerged.length / 10) || 1));
      setCurrentPage(page);
      setUsers(allMerged.slice((page - 1) * 10, page * 10));
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

  // Delete individual user permanently
  const handleDeleteUser = async (user) => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    if (userEmail === 'mistrtaimoor@gmail.com' || user.uid === 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') {
      alert('Super Admin account (mistrtaimoor@gmail.com) is permanently protected and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently DELETE user: ${user.email || user.uid}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiClient.delete(`/admin/users/${user.uid}`);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || `User deleted successfully.`,
        });
        setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        setTotalUsers((prev) => Math.max(0, prev - 1));
        if (selectedUid === user.uid) {
          setSelectedUid(null);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete user.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Purge all fake / test accounts keeping only mistrtaimoor@gmail.com
  const handlePurgeAllExceptAdmin = async () => {
    if (!window.confirm('CRITICAL ACTION: This will purge and delete ALL non-admin user accounts, leaving ONLY mistrtaimoor@gmail.com preserved with 0 balance for the fresh start. Deposits, total earned, liabilities, and DAU will be reset to 0. Other users can then sign up fresh. Continue?')) {
      return;
    }

    setActionLoading(true);
    try {
      // 1. Client-side Firestore purge if configured
      if (isFirebaseConfigured && db) {
        try {
          const [uSnap, dSnap, wSnap, mSnap] = await Promise.all([
            getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'deposits')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'withdrawals')).catch(() => ({ docs: [] })),
            getDocs(collection(db, 'cloudMiner')).catch(() => ({ docs: [] })),
          ]);

          // Clear non-admin users
          for (const d of uSnap.docs || []) {
            const uData = d.data() || {};
            const email = (uData.email || '').toLowerCase().trim();
            if (email !== 'mistrtaimoor@gmail.com' && d.id !== 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') {
              await deleteDoc(d.ref).catch(() => {});
            } else {
              // Reset super admin document to zero state
              await setDoc(doc(db, 'users', d.id), {
                ...uData,
                uid: d.id,
                email: 'mistrtaimoor@gmail.com',
                name: uData.name || uData.displayName || 'Taimoor',
                displayName: uData.displayName || uData.name || 'Taimoor',
                walletBalance: 0,
                currentPackage: 'None',
                lifetimeAds: 0,
                dailyAdCount: 0,
                teamAdsCount: 0,
                referralCount: 0,
                totalEarned: 0,
                isEligible: false,
                isBlocked: false,
                isAdmin: true,
                minedTflx: 0,
                lastAdWatchDate: null,
                updatedAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
            }
          }

          // Clear financial and miner collections
          for (const d of (dSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
          for (const d of (wSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
          for (const d of (mSnap.docs || [])) {
            await deleteDoc(d.ref).catch(() => {});
          }
        } catch (fsErr) {
          console.warn('Client Firestore purge notice:', fsErr.message);
        }
      }

      // 2. Call backend reset endpoint
      const res = await apiClient.post('/admin/purge-users');
      
      // 3. Clear cached admin stats
      try {
        localStorage.removeItem('taemry_cached_admin_stats');
      } catch (e) {}

      // 4. Dispatch global event to update AdminLayout & dashboard
      window.dispatchEvent(new Event('taemry_admin_stats_refresh'));

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || 'System cleaned! Only mistrtaimoor@gmail.com preserved with 0 balance. Fresh start ready!',
        });
        await fetchUsers(1, '');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to purge users.',
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
    setUserMiner(null);
    setAdjustAmount('');
    setAdjustReason('');
    setMinerBonusInput('');
    setMinerHashrateInput('');
    try {
      // 1. Fetch user profile & ledger
      const res = await apiClient.get(`/admin/users/${uid}`).catch(() => null);
      if (res?.data?.success) {
        setUserDetails(res.data);
      } else if (isFirebaseConfigured && db) {
        // Fallback to direct Firestore read
        const userDoc = await getDoc(doc(db, 'users', uid)).catch(() => null);
        if (userDoc?.exists()) {
          const uData = userDoc.data();
          setUserDetails({
            user: { uid, ...uData },
            downline: [],
            transactions: [],
          });
        }
      }

      // 2. Fetch user cloud miner profile
      let minerData = null;
      const minerRes = await apiClient.get(`/miner/admin/user/${uid}`).catch(() => null);
      if (minerRes?.data?.success && minerRes.data.data) {
        minerData = minerRes.data.data;
      } else if (isFirebaseConfigured && db) {
        const minerDoc = await getDoc(doc(db, 'cloudMiner', uid)).catch(() => null);
        if (minerDoc?.exists()) {
          const mData = minerDoc.data();
          const startTime = Number(mData.sessionStartTime) || 0;
          const duration = Number(mData.sessionDurationMs) || (12 * 60 * 60 * 1000);
          const isSessionLive = Boolean(mData.isMiningActive) && (Date.now() - startTime < duration);
          minerData = {
            uid,
            ...mData,
            isSessionLive,
          };
        }
      }

      if (!minerData) {
        minerData = {
          uid,
          isMiningActive: false,
          isSessionLive: false,
          minedTflx: 0,
          effectiveHashrate: 8.0,
          streakDays: 0,
          sessionStartTime: 0,
          sessionDurationMs: 12 * 60 * 60 * 1000,
        };
      }

      setUserMiner(minerData);
      setMinerHashrateInput(String(minerData.effectiveHashrate || 8.0));
      const currentPkg = res?.data?.user?.currentPackage || (userDetails?.user?.currentPackage) || 'None';
      setSelectedPackage(currentPkg);
      setPackageReason('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load user details.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Update user's advertising package tier
  const handleUpdateUserPackage = async (e) => {
    e.preventDefault();
    if (!selectedUid) return;
    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/users/${selectedUid}/package`, {
        packageTier: selectedPackage,
        reason: packageReason || 'Manual package override by Administrator',
      });
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Package successfully updated to ${selectedPackage} for ${userDetails?.user?.email || selectedUid}.`,
        });
        setUserDetails((prev) => ({
          ...prev,
          user: {
            ...prev?.user,
            currentPackage: selectedPackage,
            isEligible: selectedPackage !== 'None',
          },
        }));
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === selectedUid
              ? { ...u, currentPackage: selectedPackage, isEligible: selectedPackage !== 'None' }
              : u
          )
        );
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update package tier.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user's earning and withdrawal eligibility
  const handleToggleUserEligibility = async () => {
    if (!selectedUid || !userDetails?.user) return;
    const nextEligibility = !userDetails.user.isEligible;
    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/users/${selectedUid}/eligibility`, {
        isEligible: nextEligibility,
      });
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `User eligibility updated to ${nextEligibility ? 'Eligible' : 'Ineligible'}.`,
        });
        setUserDetails((prev) => ({
          ...prev,
          user: {
            ...prev?.user,
            isEligible: nextEligibility,
          },
        }));
        setUsers((prev) =>
          prev.map((u) => (u.uid === selectedUid ? { ...u, isEligible: nextEligibility } : u))
        );
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to toggle eligibility.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user's cloud miner state from user profile modal
  const handleToggleUserMiner = async () => {
    if (!selectedUid || !userMiner) return;
    setActionLoading(true);
    try {
      const nextActive = !userMiner.isMiningActive;
      await apiClient.put(`/miner/admin/user/${selectedUid}`, {
        isMiningActive: nextActive,
        resetSession: nextActive,
      });

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'cloudMiner', selectedUid), {
            isMiningActive: nextActive,
            ...(nextActive && {
              sessionStartTime: Date.now(),
              sessionDurationMs: 12 * 60 * 60 * 1000,
            }),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {}
      }

      setUserMiner((prev) => ({
        ...prev,
        isMiningActive: nextActive,
        isSessionLive: nextActive,
        ...(nextActive && {
          sessionStartTime: Date.now(),
          sessionDurationMs: 12 * 60 * 60 * 1000,
        }),
      }));

      setFeedback({
        type: 'success',
        message: `Cloud Miner ${nextActive ? 'activated for 12h' : 'paused'} for this user.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update miner state.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Credit or adjust Mined TFLX from user profile modal
  const handleUpdateUserMinerTflx = async (amount) => {
    if (!selectedUid || !userMiner || isNaN(Number(amount))) return;
    setActionLoading(true);
    try {
      const cur = Number(userMiner.minedTflx) || 0;
      const newTotal = +(cur + Number(amount)).toFixed(2);

      await apiClient.put(`/miner/admin/user/${selectedUid}`, {
        minedTflx: newTotal,
      });

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'cloudMiner', selectedUid), {
            minedTflx: newTotal,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {}
      }

      setUserMiner((prev) => ({ ...prev, minedTflx: newTotal }));
      setMinerBonusInput('');
      setFeedback({
        type: 'success',
        message: `Updated Mined TFLX balance to ${newTotal} TFLX.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update mined TFLX.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Adjust hashrate from user profile modal
  const handleUpdateUserMinerHashrate = async () => {
    if (!selectedUid || !userMiner || isNaN(Number(minerHashrateInput)) || Number(minerHashrateInput) <= 0) {
      alert('Please enter a valid positive hashrate.');
      return;
    }
    setActionLoading(true);
    try {
      const newRate = Number(minerHashrateInput);
      await apiClient.put(`/miner/admin/user/${selectedUid}`, {
        effectiveHashrate: newRate,
      });

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'cloudMiner', selectedUid), {
            effectiveHashrate: newRate,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {}
      }

      setUserMiner((prev) => ({ ...prev, effectiveHashrate: newRate }));
      setFeedback({
        type: 'success',
        message: `Updated user hashrate to +${newRate} TFLX/h.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update hashrate.' });
    } finally {
      setActionLoading(false);
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

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchUsers(currentPage, search)}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh Users List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handlePurgeAllExceptAdmin}
              disabled={actionLoading}
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Purge all fake, bot, and test accounts"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Purge Fake Accounts</span>
            </button>
          </div>
        </div>
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
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                            }`}
                            title={isBlocked ? 'Unblock Account' : 'Block Account'}
                          >
                            {isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          {(u.email?.toLowerCase() !== 'mistrtaimoor@gmail.com' && u.uid !== 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Delete User Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
              <div className="flex items-center gap-2">
                {userDetails?.user?.email?.toLowerCase() !== 'mistrtaimoor@gmail.com' && (
                  <button
                    onClick={() => handleDeleteUser(userDetails.user)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Permanently delete this user"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete User</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedUid(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                        {userDetails.user?.currentPackage || 'None'}
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
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Eligibility</span>
                        <button
                          type="button"
                          onClick={handleToggleUserEligibility}
                          disabled={actionLoading}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                            userDetails.user?.isEligible
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          }`}
                        >
                          {userDetails.user?.isEligible ? 'Revoke' : 'Grant'}
                        </button>
                      </div>
                      <p className={`text-sm font-black mt-1 ${userDetails.user?.isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {userDetails.user?.isEligible ? 'Eligible' : 'Ineligible'}
                      </p>
                    </div>
                  </div>

                  {/* Manual Package Tier Management */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Package className="w-4 h-4 text-sky-400" />
                        <span>Package Tier Management (Admin Override)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
                        Current: {userDetails.user?.currentPackage || 'None'}
                      </span>
                    </div>
                    <form onSubmit={handleUpdateUserPackage} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Select Package Tier</label>
                        <select
                          value={selectedPackage}
                          onChange={(e) => setSelectedPackage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold text-xs focus:outline-none focus:border-sky-500"
                        >
                          <option value="None">None (No Active Contract)</option>
                          <option value="Bronze">Bronze ($20 USD - 40 Ads/day)</option>
                          <option value="Silver">Silver ($50 USD - 80 Ads/day)</option>
                          <option value="Gold">Gold ($100 USD - 120 Ads/day)</option>
                          <option value="Platinum">Platinum ($250 USD - 160 Ads/day)</option>
                          <option value="Diamond">Diamond ($500 USD - 200 Ads/day)</option>
                          <option value="Apex">Apex ($1,000 USD - 200 Ads/day)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Audit Note (Optional)</label>
                        <input
                          type="text"
                          value={packageReason}
                          onChange={(e) => setPackageReason(e.target.value)}
                          placeholder="e.g. Manual package upgrade approved"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={actionLoading || selectedPackage === (userDetails.user?.currentPackage || 'None')}
                          className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Save Package Tier</span>
                        </button>
                      </div>
                    </form>
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

                  {/* Cloud Miner & Hashrate Controls for User */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <Pickaxe className="w-4 h-4 text-amber-400" />
                        <span>Cloud Miner & Hashrate Controls (User Profile)</span>
                      </h4>
                      {userMiner?.isSessionLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Mining Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Pause className="w-3 h-3" />
                          <span>Mining Paused</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Mined TFLX</span>
                        <p className="text-base font-black text-amber-400 mt-1 font-mono">
                          {userMiner?.minedTflx || 0} <span className="text-[10px] text-slate-400">TFLX</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Hashrate</span>
                        <p className="text-base font-black text-white mt-1">
                          +{userMiner?.effectiveHashrate || 8.0} <span className="text-[10px] text-amber-400">TFLX/h</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Streak</span>
                        <p className="text-base font-black text-sky-400 mt-1">
                          Day {userMiner?.streakDays || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleToggleUserMiner}
                          disabled={actionLoading}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            userMiner?.isMiningActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {userMiner?.isMiningActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{userMiner?.isMiningActive ? 'Pause Miner' : 'Start 12h Session'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick TFLX & Hashrate adjust controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 block">Quick TFLX Yield Credit</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateUserMinerTflx(50)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer transition-colors"
                          >
                            +50 TFLX
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateUserMinerTflx(100)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer transition-colors"
                          >
                            +100 TFLX
                          </button>
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="Custom"
                              value={minerBonusInput}
                              onChange={(e) => setMinerBonusInput(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateUserMinerTflx(Number(minerBonusInput))}
                              disabled={actionLoading || !minerBonusInput}
                              className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-40"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 block">Adjust Hashrate (TFLX/h)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            value={minerHashrateInput}
                            onChange={(e) => setMinerHashrateInput(e.target.value)}
                            placeholder="e.g. 8.0"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleUpdateUserMinerHashrate}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold whitespace-nowrap"
                          >
                            Save Rate
                          </button>
                        </div>
                      </div>
                    </div>
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
