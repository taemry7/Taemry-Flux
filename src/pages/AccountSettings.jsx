import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  FileText,
  Save,
  Loader2,
  Trash2,
  LogOut,
  AtSign,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';

export default function AccountSettings({ onSelectTab }) {
  const { currentUser, updateUserProfile, userStats, fetchUserStats, logout } = useAuth();
  const toast = useToast();

  // Form State
  const [displayName, setDisplayName] = useState(() => {
    return currentUser?.displayName || currentUser?.name || userStats?.name || userStats?.username || '';
  });
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [country, setCountry] = useState(currentUser?.country || 'Pakistan');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');

  // Theme State: 'light' (White Mode) or 'dark' (Dark Mode) synced with Navbar
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taemry_theme') || 'light';
  });

  // Listen for theme toggle events from Navbar
  useEffect(() => {
    const handleSyncTheme = (e) => {
      const newTheme = e?.detail || localStorage.getItem('taemry_theme') || 'light';
      setTheme(newTheme);
    };
    window.addEventListener('taemry-theme-change', handleSyncTheme);
    return () => window.removeEventListener('taemry-theme-change', handleSyncTheme);
  }, []);

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Active Contract Package Status determination
  const hasActivePackage = Boolean(
    userStats?.currentPackage &&
    userStats.currentPackage !== 'None' &&
    userStats.currentPackage !== 'No Package' &&
    userStats.currentPackage !== 'No Active Package'
  );

  // Sync initial user data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || userStats?.name || userStats?.username || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setCountry(currentUser.country || 'Pakistan');
      setBio(currentUser.bio || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser, userStats?.name, userStats?.username]);

  // Profile Picture File Upload Handler (with FileReader DataURL preview and auto-compression)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size should be under 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawData = uploadEvent.target.result;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedUri = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoURL(optimizedUri);
          } else {
            setPhotoURL(rawData);
          }
        } catch {
          setPhotoURL(rawData);
        }
        setNotification({
          type: 'success',
          message: 'Profile picture preview loaded. Click "Save Profile Changes" to finalize.',
        });
      };
      img.onerror = () => {
        setPhotoURL(rawData);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile Changes
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setNotification({ type: '', message: '' });

    try {
      // 1. Update in AuthContext & Firebase Auth profile
      if (updateUserProfile) {
        await updateUserProfile({
          displayName,
          phoneNumber,
          country,
          bio,
          photoURL,
        });
      }

      // 2. Persist to backend database via API
      await apiClient.put('/user/profile', {
        name: displayName,
        phoneNumber,
        country,
        bio,
        photoURL,
        theme,
      });

      if (fetchUserStats) {
        await fetchUserStats();
      }

      toast.success('Profile updated successfully!');
      setNotification({
        type: 'success',
        message: 'Account profile and settings updated successfully!',
      });
      setTimeout(() => setNotification({ type: '', message: '' }), 4500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data?.message || err.message || 'Could not update profile. Please try again.';
      toast.error(errMsg);
      setNotification({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || currentUser?.email || 'TF')
    .substring(0, 2)
    .toUpperCase();

  // Permanent Username calculation (Permanent network identifier established at registration)
  const permanentUsername = (() => {
    if (userStats?.username) {
      const u = String(userStats.username).trim();
      return u.startsWith('@') ? u : `@${u}`;
    }
    if (currentUser?.username) {
      const u = String(currentUser.username).trim();
      return u.startsWith('@') ? u : `@${u}`;
    }
    const dn = currentUser?.displayName || currentUser?.name || userStats?.name || '';
    if (dn.startsWith('@')) return dn;
    const base = dn || currentUser?.email?.split('@')[0] || 'member';
    return `@${base.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
            ACCOUNT & SETTINGS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09353e] mt-1">
            Profile & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
            Manage your personal profile photo and verified account information.
          </p>
        </div>

        {/* Status Badge: Red INACTIVE for new users, Green ACTIVE upon package purchase */}
        <div className={`rounded-2xl p-3 sm:px-4 sm:py-2.5 border shadow-xs flex items-center gap-3 self-start sm:self-auto transition-all ${
          hasActivePackage
            ? 'bg-[#ecfdf5] border-[#a7f3d0]'
            : 'bg-[#fef2f2] border-[#fecaca]'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            hasActivePackage
              ? 'bg-[#d1fae5] text-[#059669]'
              : 'bg-[#fee2e2] text-[#dc2626]'
          }`}>
            {hasActivePackage ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
              hasActivePackage ? 'text-[#047857]' : 'text-[#991b1b]'
            }`}>
              STATUS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                hasActivePackage ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'
              }`} />
              <span className={`text-xs font-extrabold tracking-wide ${
                hasActivePackage ? 'text-[#065f46]' : 'text-[#dc2626]'
              }`}>
                {hasActivePackage ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {notification.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-md text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-[#0c5963] text-white'
              : 'bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#ef4444]" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: '', message: '' })}
            className="p-1 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACCOUNT PROFILE DETAILS (Name, Phone, Country, Bio, Profile Photo)        */}
      {/* ========================================================================= */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0ebe0]">
          <User className="w-5 h-5 text-[#0c5963]" />
          <div>
            <h2 className="text-base font-extrabold text-[#09353e]">Account Information</h2>
            <p className="text-xs text-[#718589]">Update your personal contact details and identity information.</p>
          </div>
        </div>

        {/* Profile Photo Upload inside Form (No avatar presets, no URL link - only direct photo upload) */}
        <div className="pb-5 border-b border-[#f0ebe0]">
          <label className="text-xs font-bold text-[#09353e] block mb-3">
            Profile Photo
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Active Photo Preview */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#0c5963] shadow-xs bg-[#faf8f5] flex items-center justify-center">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setPhotoURL('')}
                  />
                ) : (
                  <div className="w-full h-full bg-[#0c5963] text-white flex items-center justify-center text-2xl font-extrabold">
                    {userInitials}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload Actions */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={() => setPhotoURL('')}
                    className="px-3 py-2 text-[#b91c1c] hover:bg-[#fee2e2]/60 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#6b8287]">
                Allowed formats: JPG, PNG, WebP (max 5MB). Photo is automatically optimized.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Permanent Username (Locked / Non-editable established at account creation) */}
          <div className="space-y-1.5">
            <div className="hidden flex items-center justify-between">
              <label className="hidden text-xs font-bold text-[#09353e] dark:text-[#94a3b8] flex items-center gap-1.5">
                <AtSign className="hidden w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
                <span className="hidden">Permanent Username</span>
              </label>
              <span className="hidden inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0c5963] dark:text-[#38bdf8] bg-[#0c5963]/10 dark:bg-[#38bdf8]/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Lock className="w-2.5 h-2.5" />
                <span>Permanent</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                id="profile-permanent-username"
                value={permanentUsername}
                disabled
                readOnly
                className="w-full px-4 py-2.5 text-xs bg-[#f1ede4] dark:bg-[#07191e] border border-[#ded8cb] dark:border-[#15323b] rounded-xl text-[#09353e] dark:text-[#e2e8f0] cursor-not-allowed font-mono font-bold"
              />
            </div>
            <p className="text-[10.5px] text-[#718589] dark:text-[#64748b]">
              Your permanent network username assigned at registration. Cannot be changed.
            </p>
          </div>

          {/* Email Address (Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#09353e] dark:text-[#94a3b8] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
                <span>Registered Email Address</span>
              </label>
              <span className="hidden inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0c5963] dark:text-[#38bdf8] bg-[#0c5963]/10 dark:bg-[#38bdf8]/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Lock className="w-2.5 h-2.5" />
                <span>Verified</span>
              </span>
            </div>
            <input
              type="email"
              id="profile-registered-email"
              value={currentUser?.email || 'member@taemryflux.com'}
              disabled
              readOnly
              className="w-full px-4 py-2.5 text-xs bg-[#f1ede4] dark:bg-[#07191e] border border-[#ded8cb] dark:border-[#15323b] rounded-xl text-[#62777c] dark:text-[#94a3b8] cursor-not-allowed font-medium"
            />
            <p className="text-[10.5px] text-[#718589] dark:text-[#64748b]">
              Linked authentication email associated with this account.
            </p>
          </div>

          {/* Display Name / Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] dark:text-[#94a3b8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Full Name / Display Name</span>
            </label>
            <input
              type="text"
              id="profile-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Mistr Taimoor"
              required
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] dark:bg-[#07191e] border border-[#d8d1c3] dark:border-[#15323b] rounded-xl text-[#09353e] dark:text-white focus:outline-none focus:border-[#0c5963]"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] dark:text-[#94a3b8] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Phone / WhatsApp Number</span>
            </label>
            <input
              type="tel"
              id="profile-phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] dark:bg-[#07191e] border border-[#d8d1c3] dark:border-[#15323b] rounded-xl text-[#09353e] dark:text-white focus:outline-none focus:border-[#0c5963]"
            />
          </div>

          {/* Country / Region */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-[#09353e] dark:text-[#94a3b8] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>Country / Location</span>
            </label>
            <input
              type="text"
              id="profile-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Pakistan, UAE, USA"
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] dark:bg-[#07191e] border border-[#d8d1c3] dark:border-[#15323b] rounded-xl text-[#09353e] dark:text-white focus:outline-none focus:border-[#0c5963]"
            />
          </div>
        </div>

        {/* Bio / Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#09353e] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0c5963]" />
            <span>Bio / Personal Note (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself or your investment goals..."
            className="w-full px-4 py-2 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
          />
        </div>

        {/* Save Changes Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
