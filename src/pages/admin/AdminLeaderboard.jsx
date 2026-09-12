import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  Eye,
  Save,
  ArrowUpDown,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Award,
  Users
} from 'lucide-react';
import { FULL_TOP_100_USERS } from '../../components/LiveLeaderboard';
import LiveLeaderboard from '../../components/LiveLeaderboard';

const STORAGE_KEY = 'taemry_admin_leaderboard_custom';

const TIER_COLORS = {
  Apex: 'bg-[#ea580c]/15 text-[#ea580c] border-[#ea580c]/30',
  Master: 'bg-[#db2777]/15 text-[#db2777] border-[#db2777]/30',
  Elite: 'bg-[#7c3aed]/15 text-[#7c3aed] border-[#7c3aed]/30',
  Premium: 'bg-[#0284c7]/15 text-[#0284c7] border-[#0284c7]/30',
  Gold: 'bg-[#eab308]/15 text-[#eab308] border-[#eab308]/30',
  Silver: 'bg-[#64748b]/15 text-[#64748b] border-[#64748b]/30',
  Bronze: 'bg-[#b45309]/15 text-[#b45309] border-[#b45309]/30',
};

const AVATAR_COLORS = {
  Apex: 'bg-[#ea580c]',
  Master: 'bg-[#db2777]',
  Elite: 'bg-[#7c3aed]',
  Premium: 'bg-[#0284c7]',
  Gold: 'bg-[#eab308]',
  Silver: 'bg-[#64748b]',
  Bronze: 'bg-[#b45309]',
};

export default function AdminLeaderboard({ onNavigate }) {
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FULL_TOP_100_USERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [editingUser, setEditingUser] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    country: 'Pakistan 🇵🇰',
    city: 'Karachi',
    tier: 'Gold',
    totalEarned: '150.00',
    adsWatched: '1200',
    referrals: '15',
    dailyEarned: '5.00',
    status: 'Watching Ads',
    statusTime: 'Live',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const saveLeaderboard = (updatedList, successMessage = 'Leaderboard updated successfully!') => {
    // Re-index ranks 1 to N
    const reindexed = updatedList.map((item, index) => ({
      ...item,
      rank: index + 1,
      currentRank: index + 1,
    }));

    setLeaderboard(reindexed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reindexed));
      window.dispatchEvent(new Event('leaderboard-updated'));
    } catch (e) {
      console.error('Failed to save custom leaderboard:', e);
    }
    showToast(successMessage);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all leaderboard entries back to default 100 participants?')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('leaderboard-updated'));
      } catch {}
      setLeaderboard(FULL_TOP_100_USERS);
      showToast('Leaderboard reset to official default state');
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = leaderboard.map((user) => {
      if (user.id === editingUser.id) {
        const tier = editingUser.tier || 'Gold';
        return {
          ...user,
          ...editingUser,
          totalEarned: parseFloat(editingUser.totalEarned) || 0,
          adsWatched: parseInt(editingUser.adsWatched, 10) || 0,
          referrals: parseInt(editingUser.referrals, 10) || 0,
          dailyEarned: parseFloat(editingUser.dailyEarned) || 0,
          tierColor: TIER_COLORS[tier] || TIER_COLORS.Gold,
          avatarBg: AVATAR_COLORS[tier] || AVATAR_COLORS.Gold,
        };
      }
      return user;
    });

    saveLeaderboard(updated, `Updated #${editingUser.rank} ${editingUser.name} successfully!`);
    setEditingUser(null);
  };

  const handleAddNewUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim()) return;

    const tier = newUserForm.tier || 'Gold';
    const newEntry = {
      id: `custom_user_${Date.now()}`,
      rank: 1, // Default inserted at top or end
      name: newUserForm.name.trim(),
      username: newUserForm.username.trim().startsWith('@') ? newUserForm.username.trim() : `@${newUserForm.username.trim()}`,
      country: newUserForm.country.trim(),
      city: newUserForm.city.trim(),
      tier,
      tierColor: TIER_COLORS[tier] || TIER_COLORS.Gold,
      avatarBg: AVATAR_COLORS[tier] || AVATAR_COLORS.Gold,
      totalEarned: parseFloat(newUserForm.totalEarned) || 0,
      adsWatched: parseInt(newUserForm.adsWatched, 10) || 0,
      referrals: parseInt(newUserForm.referrals, 10) || 0,
      dailyEarned: parseFloat(newUserForm.dailyEarned) || 0,
      status: newUserForm.status || 'Active Now',
      statusTime: newUserForm.statusTime || 'Live',
      isOnline: true,
    };

    // Insert at beginning
    const updated = [newEntry, ...leaderboard];
    saveLeaderboard(updated, `Added new member ${newEntry.name} to leaderboard!`);
    setIsAddingNew(false);
    setNewUserForm({
      name: '',
      username: '',
      country: 'Pakistan 🇵🇰',
      city: 'Karachi',
      tier: 'Gold',
      totalEarned: '150.00',
      adsWatched: '1200',
      referrals: '15',
      dailyEarned: '5.00',
      status: 'Watching Ads',
      statusTime: 'Live',
    });
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to remove "${userName}" from the leaderboard?`)) {
      const filtered = leaderboard.filter((u) => u.id !== userId);
      saveLeaderboard(filtered, `Removed ${userName} from leaderboard`);
    }
  };

  const handleMoveRank = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= leaderboard.length) return;

    const listCopy = [...leaderboard];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    saveLeaderboard(listCopy, `Re-ordered rank positions`);
  };

  // Filtered dataset
  const filteredList = leaderboard.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.rank) === searchQuery.replace('#', '').trim();

    const matchesTier = tierFilter === 'ALL' || item.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs sm:text-sm font-bold animate-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700'
              : 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
          }`}
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Admin Control Room
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Total Members: <strong className="text-white">{leaderboard.length}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Live Leaderboard Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Edit ranking positions, member names, earned payouts, ads volume, and tier ranks. All updates apply live in real-time across Home and Member Dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'editor'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'preview'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset all changes back to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: LIVE PREVIEW MODE */}
      {viewMode === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-sky-200 text-xs flex items-center justify-between">
            <span>Viewing real-time public leaderboard layout as seen by members.</span>
            <button
              onClick={() => setViewMode('editor')}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Back to Editor
            </button>
          </div>
          <LiveLeaderboard isHomePage={false} onNavigate={onNavigate} />
        </div>
      )}

      {/* VIEW 2: EDITOR TABLE */}
      {viewMode === 'editor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-lg space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, username, city, rank..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Apex', 'Master', 'Elite', 'Premium', 'Gold', 'Silver', 'Bronze'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    tierFilter === tier
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-700 text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-3 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Contract Tier</th>
                  <th className="py-3.5 px-4">Total Earned</th>
                  <th className="py-3.5 px-4">Ads Viewed</th>
                  <th className="py-3.5 px-4">Referrals</th>
                  <th className="py-3.5 px-4">Daily Yield</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500">
                      No members match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((user, idx) => {
                    const originalIndex = leaderboard.findIndex((u) => u.id === user.id);
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3 px-3 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                              user.rank === 1
                                ? 'bg-amber-400 text-slate-950 font-extrabold'
                                : user.rank === 2
                                ? 'bg-slate-200 text-slate-950 font-bold'
                                : user.rank === 3
                                ? 'bg-amber-600 text-white font-bold'
                                : 'text-slate-400 bg-slate-800'
                            }`}
                          >
                            #{user.rank}
                          </span>
                        </td>

                        {/* Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full ${user.avatarBg || 'bg-sky-600'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{user.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {user.country}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {user.username} &bull; {user.city}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              user.tierColor || TIER_COLORS[user.tier] || TIER_COLORS.Gold
                            }`}
                          >
                            {user.tier}
                          </span>
                        </td>

                        {/* Total Earned */}
                        <td className="py-3 px-4 font-black text-emerald-400">
                          ${Number(user.totalEarned || 0).toFixed(2)}
                        </td>

                        {/* Ads Watched */}
                        <td className="py-3 px-4 font-bold text-white">
                          {Number(user.adsWatched || 0).toLocaleString()}
                        </td>

                        {/* Referrals */}
                        <td className="py-3 px-4 font-bold text-sky-400">
                          {Number(user.referrals || 0)}
                        </td>

                        {/* Daily Yield */}
                        <td className="py-3 px-4 text-slate-300">
                          ${Number(user.dailyEarned || 0).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{user.status || 'Active'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveRank(originalIndex, -1)}
                              disabled={originalIndex === 0}
                              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-20 cursor-pointer"
                              title="Move Up in Rank"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveRank(originalIndex, 1)}
                              disabled={originalIndex === leaderboard.length - 1}
                              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-20 cursor-pointer"
                              title="Move Down in Rank"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingUser({ ...user })}
                              className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg cursor-pointer ml-1"
                              title="Edit Member Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* MODAL 1: EDIT MEMBER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit #{editingUser.rank} &bull; {editingUser.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">Update ranking metrics & credentials</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Country & Flag
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.country}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.city}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Contract Tier
                  </label>
                  <select
                    value={editingUser.tier}
                    onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    {['Apex', 'Master', 'Elite', 'Premium', 'Gold', 'Silver', 'Bronze'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Status Label
                  </label>
                  <input
                    type="text"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Total Earned ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.totalEarned}
                    onChange={(e) => setEditingUser({ ...editingUser, totalEarned: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Ads Viewed
                  </label>
                  <input
                    type="number"
                    value={editingUser.adsWatched}
                    onChange={(e) => setEditingUser({ ...editingUser, adsWatched: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Referrals
                  </label>
                  <input
                    type="number"
                    value={editingUser.referrals}
                    onChange={(e) => setEditingUser({ ...editingUser, referrals: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW MEMBER */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Member to Leaderboard</h3>
                  <span className="text-[11px] text-slate-400">Position will appear at top of ranking</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Siddiqui"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@asad_flux"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Country & Flag
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.country}
                    onChange={(e) => setNewUserForm({ ...newUserForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Contract Tier
                  </label>
                  <select
                    value={newUserForm.tier}
                    onChange={(e) => setNewUserForm({ ...newUserForm, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {['Apex', 'Master', 'Elite', 'Premium', 'Gold', 'Silver', 'Bronze'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Total Earned ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUserForm.totalEarned}
                    onChange={(e) => setNewUserForm({ ...newUserForm, totalEarned: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Ads Watched
                  </label>
                  <input
                    type="number"
                    value={newUserForm.adsWatched}
                    onChange={(e) => setNewUserForm({ ...newUserForm, adsWatched: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Referrals
                  </label>
                  <input
                    type="number"
                    value={newUserForm.referrals}
                    onChange={(e) => setNewUserForm({ ...newUserForm, referrals: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
