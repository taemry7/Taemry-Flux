/**
 * TAEMRY FLUX - Admin Profile Information Modal
 * Provides comprehensive administrative profile inspection, display name editing,
 * avatar selection, contact details, and security clearance inspection.
 */

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Lock,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export default function AdminProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const { currentUser, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Taimoor');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '+92 300 0000000');
  const [country, setCountry] = useState(currentUser?.country || 'Pakistan');
  const [bio, setBio] = useState(currentUser?.bio || 'Lead Platform Governance & System Administrator');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const updates = {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      };

      if (updateUserProfile) {
        await updateUserProfile(updates);
      }

      // Also sync to backend users collection if needed
      try {
        await apiClient.put('/user/profile', updates);
      } catch (err) {
        console.warn('Backend user profile sync warning:', err.message);
      }

      setStatus({ type: 'success', text: 'Admin profile information updated successfully!' });
      if (onProfileUpdated) {
        onProfileUpdated(updates);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Failed to update admin profile:', error);
      setStatus({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-sky-500/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top 3D Ambient Gradient Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Admin Profile Information</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  L3 ROOT
                </span>
              </h2>
              <p className="text-xs text-slate-400">View and update administrative credentials and contact details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {status && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          {/* Avatar & Identicon Preview */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-4">
            <div className="relative">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Admin"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400/50 shadow-md shadow-sky-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center border-2 border-sky-400/40 shadow-md shadow-sky-500/20">
                  {currentUser?.email?.substring(0, 2).toUpperCase() || 'MI'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avatar Selection</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setPhotoURL(preset)}
                    className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                      photoURL === preset ? 'border-sky-400 scale-105' : 'border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {photoURL && (
                  <button
                    type="button"
                    onClick={() => setPhotoURL('')}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display / First Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Admin Display / First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-sky-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Taimoor"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Root Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-sky-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Country
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-sky-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pakistan"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Bio / Admin Statement */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Administrative Title & Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="System Administrator"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors resize-none"
            />
          </div>

          {/* Security & Access Info Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security Clearance:</span>
              </span>
              <span className="text-emerald-400 font-bold">Level 3 (Root Administrator)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Authentication UID:</span>
              <span className="font-mono text-slate-300 truncate max-w-[240px]">
                {currentUser?.uid || 'Root-Claim'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform Network:</span>
              <span className="text-sky-400 font-mono">TAEMRY-PROD-LIVE</span>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
