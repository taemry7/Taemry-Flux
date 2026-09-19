/**
 * TAEMRY FLUX - Admin Package Tiers Management & Live Catalog Editor
 * Enables administrators to edit, add, reorder, or deactivate earning packages live in Firestore.
 * All updates publish immediately and sync live with the User Panel (BuyPackage.jsx, Whitepaper, and Dashboard).
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
  Eye,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Zap,
  X,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../../api/client';

export const FACTORY_PACKAGES = [
  {
    id: 'bronze',
    tierName: 'Bronze',
    name: 'Bronze',
    price: 1.00,
    minWallet: 0.10,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'STARTER',
    color: '#0284c7',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '🌱 Take your first step into daily advertising earnings with minimal capital.',
    isActive: true,
    order: 1,
  },
  {
    id: 'silver',
    tierName: 'Silver',
    name: 'Silver',
    price: 5.00,
    minWallet: 0.50,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'POPULAR',
    color: '#0f766e',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '⚡ Amplify your daily revenue with an optimized Silver contract allocation.',
    isActive: true,
    order: 2,
  },
  {
    id: 'gold',
    tierName: 'Gold',
    name: 'Gold',
    price: 10.00,
    minWallet: 1.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'RECOMMENDED',
    color: '#ca8a04',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '🌟 Accelerate your growth and unlock higher advertising rewards every single day.',
    isActive: true,
    order: 3,
  },
  {
    id: 'premium',
    tierName: 'Premium',
    name: 'Premium',
    price: 50.00,
    minWallet: 5.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'PRO',
    color: '#0284c7',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '💎 Experience pro-grade earning power with enhanced daily reward allocations.',
    isActive: true,
    order: 4,
  },
  {
    id: 'elite',
    tierName: 'Elite',
    name: 'Elite',
    price: 100.00,
    minWallet: 10.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'HIGH CAPACITY',
    color: '#7c3aed',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '🚀 High-velocity contract tier crafted for dedicated digital earners.',
    isActive: true,
    order: 5,
  },
  {
    id: 'master',
    tierName: 'Master',
    name: 'Master',
    price: 500.00,
    minWallet: 50.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'ENTERPRISE',
    color: '#db2777',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '👑 Command the network with enterprise-level rewards and maximum earning capacity.',
    isActive: true,
    order: 6,
  },
  {
    id: 'apex',
    tierName: 'Apex',
    name: 'Apex',
    price: 1000.00,
    minWallet: 100.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'Apex Master',
    color: '#ea580c',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '🔥 The absolute pinnacle of earning power — unbounded potential and supreme rewards.',
    isActive: true,
    order: 7,
  },
];

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // New package form state
  const [newPkg, setNewPkg] = useState({
    id: '',
    tierName: '',
    price: 25.00,
    dailyLimit: 200,
    rewardRate: '20%',
    badge: 'VIP',
    color: '#0284c7',
    description: 'Active contract tier delivering guaranteed 20% daily rewards.',
    motivationText: '✨ Unlock consistent daily digital returns with high-engagement advertising quota.',
    isActive: true,
  });

  // Load packages from admin endpoint
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient.get('/admin/packages');
      if (res.data?.success && Array.isArray(res.data.packages) && res.data.packages.length > 0) {
        setPackages(res.data.packages);
        if (res.data.updatedAt) setLastSaved(res.data.updatedAt);
      } else {
        setPackages(FACTORY_PACKAGES);
      }
    } catch (err) {
      console.warn('Failed to load admin packages, using default catalog:', err.message);
      setPackages(FACTORY_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Save changes live to backend & Firestore
  const handleSaveChanges = async (updatedList) => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const listToSave = updatedList || packages;
      const res = await apiClient.put('/admin/packages', { packages: listToSave });

      if (res.data?.success) {
        setPackages(res.data.packages);
        try {
          localStorage.setItem('taemry_packages_catalog', JSON.stringify(res.data.packages));
          window.dispatchEvent(new CustomEvent('taemry_packages_updated', { detail: { packages: res.data.packages } }));
        } catch (e) {}
        setSuccessMsg('✅ Packages successfully updated and published live to the User Panel!');
        setLastSaved(new Date().toISOString());
        setTimeout(() => setSuccessMsg(null), 4500);
      } else {
        throw new Error(res.data?.message || 'Failed to update packages.');
      }
    } catch (err) {
      console.error('Error saving packages:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error updating packages');
    } finally {
      setSaving(false);
    }
  };

  // Direct field update in packages list
  const handleFieldChange = (idx, field, value) => {
    const updated = [...packages];
    updated[idx] = { ...updated[idx], [field]: value };
    // Synchronize name with tierName
    if (field === 'tierName') {
      updated[idx].name = value;
    }
    setPackages(updated);
  };

  // Move tier position
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= packages.length) return;
    const updated = [...packages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // Reassign order
    const reordered = updated.map((p, i) => ({ ...p, order: i + 1 }));
    setPackages(reordered);
  };

  // Toggle active status
  const handleToggleActive = (index) => {
    const updated = [...packages];
    updated[index].isActive = !updated[index].isActive;
    setPackages(updated);
  };

  // Delete package
  const handleDelete = (index) => {
    const target = packages[index];
    if (window.confirm(`Are you sure you want to delete the "${target.tierName}" package tier?`)) {
      const updated = packages.filter((_, i) => i !== index);
      setPackages(updated);
    }
  };

  // Add new package submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPkg.tierName) {
      alert('Please enter a tier name.');
      return;
    }

    const generatedId = (newPkg.id || newPkg.tierName.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
    if (packages.some((p) => p.id === generatedId)) {
      alert(`A package with ID "${generatedId}" already exists. Please choose a unique name.`);
      return;
    }

    const created = {
      ...newPkg,
      id: generatedId,
      name: newPkg.tierName,
      price: Number(newPkg.price || 0),
      dailyLimit: Number(newPkg.dailyLimit || 200),
      order: packages.length + 1,
    };

    const updated = [...packages, created].sort((a, b) => a.price - b.price);
    setPackages(updated);
    setIsAddModalOpen(false);
    // Reset form
    setNewPkg({
      id: '',
      tierName: '',
      price: 25.00,
      dailyLimit: 200,
      rewardRate: '20%',
      badge: 'VIP',
      color: '#0284c7',
      description: 'Active contract tier delivering guaranteed 20% daily rewards.',
      motivationText: '✨ Unlock consistent daily digital returns with high-engagement advertising quota.',
      isActive: true,
    });
    setSuccessMsg(`Package "${created.tierName}" added to catalog. Click "Save & Publish Changes Live" to activate!`);
  };

  // Restore factory defaults
  const handleRestoreDefaults = () => {
    if (window.confirm('Reset all packages to the official TAEMRY FLUX factory defaults (Bronze, Silver, Gold, Premium, Elite, Master, Apex)?')) {
      setPackages(FACTORY_PACKAGES);
      handleSaveChanges(FACTORY_PACKAGES);
    }
  };

  const activeCount = packages.filter((p) => p.isActive !== false).length;
  const lowestPrice = packages.length > 0 ? Math.min(...packages.map((p) => Number(p.price || 0))) : 0;
  const highestPrice = packages.length > 0 ? Math.max(...packages.map((p) => Number(p.price || 0))) : 0;

  return (
    <div className="space-y-6">
      {/* 3D Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900/90 to-sky-950/40 p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>LIVE USER PANEL SYNCHRONIZATION ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8 text-sky-400" />
              <span>Package Tiers & Contract Pricing</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Configure, edit, and add advertising packages. Any changes saved here update live in Firestore and reflect immediately across the User Panel (Buy Package, Whitepaper, and eligibility gates).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchPackages}
              disabled={loading || saving}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-all flex items-center gap-2 cursor-pointer"
              title="Refresh Packages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Package</span>
            </button>
            <button
              onClick={() => handleSaveChanges()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[3]" />
              <span>{saving ? 'Publishing...' : 'Save & Publish Changes Live'}</span>
            </button>
          </div>
        </div>

        {/* 3D KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Tiers
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-center gap-2">
              <span>{activeCount}</span>
              <span className="text-xs font-normal text-slate-500">/ {packages.length} total</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Entry Tier Price
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">
              ${lowestPrice.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Apex Tier Price
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              ${highestPrice.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Live State
            </span>
            <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synced With Users</span>
            </div>
            {lastSaved && (
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-rose-500/10 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Package Editor Cards */}
      <div className="space-y-4">
        {packages.map((pkg, idx) => (
          <div
            key={pkg.id || idx}
            className={`rounded-2xl border transition-all p-5 backdrop-blur-xl ${
              pkg.isActive !== false
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl'
                : 'bg-slate-950/70 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Package Identity & Controls */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1">
                <div className="flex flex-col gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-white cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === packages.length - 1}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-white cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tier Name */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Tier Name (Title)
                    </label>
                    <input
                      type="text"
                      value={pkg.tierName || ''}
                      onChange={(e) => handleFieldChange(idx, 'tierName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-hidden focus:border-sky-500 transition-colors"
                      placeholder="e.g. Bronze"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Contract Price ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.price !== undefined ? pkg.price : ''}
                        onChange={(e) => handleFieldChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      onChange={(e) => handleFieldChange(idx, 'badge', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-hidden focus:border-sky-500 transition-colors"
                      placeholder="e.g. STARTER / POPULAR"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Quick Status & Actions */}
              <div className="flex items-center gap-3 self-end lg:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleActive(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    pkg.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {pkg.isActive !== false ? 'Active' : 'Disabled'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingId(editingId === (pkg.id || idx) ? null : (pkg.id || idx))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>{editingId === (pkg.id || idx) ? 'Collapse' : 'Details'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete Package Tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Advanced Tier Configuration */}
            {editingId === (pkg.id || idx) && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Daily Ads Quota (ads/day)
                  </label>
                  <input
                    type="number"
                    value={pkg.dailyLimit || 200}
                    onChange={(e) => handleFieldChange(idx, 'dailyLimit', parseInt(e.target.value, 10) || 200)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Delivering guaranteed 20% daily returns.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Daily Return Rate / Slogan
                  </label>
                  <input
                    type="text"
                    value={pkg.rewardRate || '20%'}
                    onChange={(e) => handleFieldChange(idx, 'rewardRate', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
                    placeholder="e.g. 20%"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Guaranteed return percentage displayed on the contract card.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Card Description
                  </label>
                  <textarea
                    rows={2}
                    value={pkg.description || ''}
                    onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-hidden focus:border-sky-500"
                    placeholder="Brief description of the package tier..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Motivation Text (Shown to Non-Contract Users)
                  </label>
                  <textarea
                    rows={2}
                    value={pkg.motivationText || ''}
                    onChange={(e) => handleFieldChange(idx, 'motivationText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-200 focus:outline-hidden focus:border-sky-500"
                    placeholder="Motivational callout displayed below the card..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All edits save directly to Firestore collection <code className="text-sky-300 font-mono">systemSettings/packages</code>.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveChanges()}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[3]" />
            <span>{saving ? 'Publishing...' : 'Save & Publish Changes Live'}</span>
          </button>
        </div>
      </div>

      {/* Add New Package Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl animate-scale-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Package Tier</h3>
                  <p className="text-xs text-slate-400">Creates a new advertising tier available for user purchase.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPkg.tierName}
                    onChange={(e) => setNewPkg({ ...newPkg, tierName: e.target.value })}
                    placeholder="e.g. Diamond"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPkg.price}
                    onChange={(e) => setNewPkg({ ...newPkg, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={newPkg.badge}
                    onChange={(e) => setNewPkg({ ...newPkg, badge: e.target.value })}
                    placeholder="e.g. VIP / POPULAR"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Daily Ads Quota
                  </label>
                  <input
                    type="number"
                    value={newPkg.dailyLimit}
                    onChange={(e) => setNewPkg({ ...newPkg, dailyLimit: parseInt(e.target.value, 10) || 200 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Card Description
                </label>
                <textarea
                  rows={2}
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Motivation Text (For Non-Contract Members)
                </label>
                <textarea
                  rows={2}
                  value={newPkg.motivationText}
                  onChange={(e) => setNewPkg({ ...newPkg, motivationText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black shadow-lg shadow-sky-500/20"
                >
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
