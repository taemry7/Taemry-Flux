import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  FileText,
  Save,
  Loader2,
  Sparkles,
  Palette,
  KeyRound,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// Curated avatar presets for instant profile photo customization
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
];

export default function AccountSettings({ onSelectTab }) {
  const { currentUser, updateUserProfile, userStats, fetchUserStats } = useAuth();

  // Form State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [country, setCountry] = useState(currentUser?.country || 'Pakistan');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Theme State: 'light' (White Mode) or 'dark' (Dark Mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taemry_theme') || 'light';
  });

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Sync initial user data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setCountry(currentUser.country || 'Pakistan');
      setBio(currentUser.bio || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  // Apply Theme to documentElement
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('taemry_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    try {
      await apiClient.put('/user/profile', { theme: newTheme });
    } catch {
      // Ignored for offline preview
    }

    setNotification({
      type: 'success',
      message: `${newTheme === 'dark' ? 'Dark Mode' : 'White Mode'} activated successfully!`,
    });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // Profile Picture File Upload Handler (with FileReader DataURL preview)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size should be under 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target.result;
      setPhotoURL(dataUri);
      setNotification({
        type: 'success',
        message: 'Profile picture preview loaded. Click "Save Profile Changes" to finalize.',
      });
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

      setNotification({
        type: 'success',
        message: 'Account profile and settings updated successfully!',
      });
      setTimeout(() => setNotification({ type: '', message: '' }), 4500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Could not update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || currentUser?.email || 'TF')
    .substring(0, 2)
    .toUpperCase();

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
            Manage your personal profile picture, account details, and switch between White and Dark mode.
          </p>
        </div>

        {/* Security Status Badge */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 sm:py-2.5 border border-[#e4ded2] shadow-xs flex items-center gap-3 self-start sm:self-auto">
          <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#74898e] tracking-wider block">
              Auth Status
            </span>
            <span className="text-xs font-extrabold text-[#09353e]">
              Secure Verified
            </span>
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
      {/* SECTION 1: THEME SELECTOR (White Mode vs Dark Mode)                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0ebe0]">
          <Palette className="w-5 h-5 text-[#0c5963]" />
          <div>
            <h2 className="text-base font-extrabold text-[#09353e]">Display Mode</h2>
            <p className="text-xs text-[#718589]">Choose your preferred visual theme for the platform.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* White Mode Button */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left cursor-pointer ${
              theme === 'light'
                ? 'border-[#0c5963] bg-[#fbfdfc] shadow-xs ring-2 ring-[#0c5963]/15'
                : 'border-[#e4ded2] bg-[#faf8f5] hover:border-[#b8ced2]'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              theme === 'light' ? 'bg-[#0c5963] text-white' : 'bg-white text-[#526a6f] border border-[#e0d9cb]'
            }`}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#09353e]">White Mode</span>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4f1] text-[#0c5963] px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#627a7f] mt-0.5 leading-snug">
                Classic high-contrast warm daylight theme with crisp clarity.
              </p>
            </div>
          </button>

          {/* Dark Mode Button */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left cursor-pointer ${
              theme === 'dark'
                ? 'border-[#0c5963] bg-[#0c242c] text-white shadow-xs ring-2 ring-[#0c5963]/30'
                : 'border-[#e4ded2] bg-[#faf8f5] hover:border-[#b8ced2]'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              theme === 'dark' ? 'bg-[#0ea5e9] text-white' : 'bg-[#112d35] text-white'
            }`}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-[#09353e]'}`}>
                  Dark Mode
                </span>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0ea5e9]/20 text-[#38bdf8] px-2 py-0.5 rounded-full border border-[#0ea5e9]/40">
                    Active
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 leading-snug ${theme === 'dark' ? 'text-white/70' : 'text-[#627a7f]'}`}>
                Sleek midnight dark aesthetic designed for comfortable viewing.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PROFILE PICTURE (Upload / Preset / URL)                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0ebe0]">
          <Camera className="w-5 h-5 text-[#0c5963]" />
          <div>
            <h2 className="text-base font-extrabold text-[#09353e]">Profile Picture</h2>
            <p className="text-xs text-[#718589]">Upload your custom photo or pick a stylish avatar preset.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
          {/* Active Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#0c5963] shadow-md bg-[#faf8f5] flex items-center justify-center">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                  onError={() => setPhotoURL('')}
                />
              ) : (
                <div className="w-full h-full bg-[#0c5963] text-white flex items-center justify-center text-3xl font-extrabold">
                  {userInitials}
                </div>
              )}
            </div>

            {/* Quick Upload Button on avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white shadow-md transition-all cursor-pointer"
              title="Upload photo from computer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 w-full">
            {/* File Upload Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Picture</span>
              </button>

              {photoURL && (
                <button
                  type="button"
                  onClick={() => setPhotoURL('')}
                  className="px-3 py-2.5 text-[#b91c1c] hover:bg-[#fee2e2]/60 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>

            {/* Direct Image URL input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#526d72] uppercase tracking-wider block">
                Or Paste Image Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 px-3.5 py-2 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setPhotoURL(customUrlInput.trim());
                      setCustomUrlInput('');
                    }
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-[#faf8f5] text-[#0c5963] border border-[#b8ded7] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Avatar Presets Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#526d72] uppercase tracking-wider block">
                Choose from Avatar Presets
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(preset)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                      photoURL === preset
                        ? 'border-[#0c5963] ring-2 ring-[#0c5963]/30 scale-105'
                        : 'border-[#ded8cb]'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: ACCOUNT PROFILE DETAILS (Name, Phone, Country, Bio)           */}
      {/* ========================================================================= */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0ebe0]">
          <User className="w-5 h-5 text-[#0c5963]" />
          <div>
            <h2 className="text-base font-extrabold text-[#09353e]">Account Information</h2>
            <p className="text-xs text-[#718589]">Update your personal contact details and identity information.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0c5963]" />
              <span>Full Name / Display Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Mistr Taimoor"
              required
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
            />
          </div>

          {/* Email Address (Read-Only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0c5963]" />
              <span>Registered Email Address</span>
            </label>
            <input
              type="email"
              value={currentUser?.email || 'member@taemryflux.com'}
              disabled
              className="w-full px-4 py-2.5 text-xs bg-[#f1ede4] border border-[#ded8cb] rounded-xl text-[#62777c] cursor-not-allowed font-medium"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0c5963]" />
              <span>Phone / WhatsApp Number</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
            />
          </div>

          {/* Country / Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#09353e] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0c5963]" />
              <span>Country / Location</span>
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Pakistan, UAE, USA"
              className="w-full px-4 py-2.5 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
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
