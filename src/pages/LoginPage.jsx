import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  TrendingUp,
  Coins,
  AtSign,
  Users,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import GoogleAdSense from '../components/GoogleAdSense';

export default function LoginPage({ onNavigate, initialMode = 'signin' }) {
  // Active auth tab: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('signup')) return 'signup';
      if (hash.includes('signin')) return 'signin';
    }
    return initialMode === 'signup' ? 'signup' : 'signin';
  });

  // Fluid click splash state for tab navigation
  const [tabSplash, setTabSplash] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Bottom Ads banner visibility (hidden by default per user instruction: "or is nichy div ko bi filhal hidden kardo jad ads shro ho jay tab show kardo OK")
  const [showAdsBanner, setShowAdsBanner] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return (
          window.__TAEMRY_ADS_STARTED__ === true ||
          localStorage.getItem('taemry_ads_started') === 'true'
        );
      }
      return false;
    } catch {
      return false;
    }
  });

  // Listen for platform ad start events to show banner when ads start
  useEffect(() => {
    const handleAdsStarted = () => setShowAdsBanner(true);
    window.addEventListener('taemry_ads_started', handleAdsStarted);
    return () => window.removeEventListener('taemry_ads_started', handleAdsStarted);
  }, []);

  // Referral state: check if user joined through referral link
  const [referredBy, setReferredBy] = useState(() => {
    try {
      if (typeof window === 'undefined') return '';
      const params = new URLSearchParams(window.location.search);
      let ref = params.get('ref') || params.get('referral');
      if (!ref && window.location.hash) {
        const match = window.location.hash.match(/[?&]ref=([^&#]+)/i);
        if (match && match[1]) ref = match[1];
      }
      if (ref && ref.trim()) {
        const cleanRef = decodeURIComponent(ref).trim();
        localStorage.setItem('referralCode', cleanRef);
        return cleanRef;
      }
      const stored = localStorage.getItem('referralCode') || localStorage.getItem('taemry_referral_sponsor');
      if (stored && stored.trim()) return stored.trim();
      return '';
    } catch {
      return '';
    }
  });

  const [isReferralLocked, setIsReferralLocked] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      let ref = params.get('ref') || params.get('referral');
      if (!ref && window.location.hash) {
        const match = window.location.hash.match(/[?&]ref=([^&#]+)/i);
        if (match && match[1]) ref = match[1];
      }
      if (ref && ref.trim()) return true;
      const stored = localStorage.getItem('referralCode') || localStorage.getItem('taemry_referral_sponsor');
      return Boolean(stored && stored.trim());
    } catch {
      return false;
    }
  });

  // Sync initialMode when prop changes
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode === 'signup' ? 'signup' : 'signin');
    }
  }, [initialMode]);

  // Sync referral code when landing via link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let ref = params.get('ref') || params.get('referral');
      if (!ref && window.location.hash) {
        const match = window.location.hash.match(/[?&]ref=([^&#]+)/i);
        if (match && match[1]) ref = match[1];
      }
      const stored = localStorage.getItem('referralCode') || localStorage.getItem('taemry_referral_sponsor');
      const activeRef = (ref && ref.trim()) || (stored && stored.trim()) || '';
      if (activeRef) {
        const cleanRef = decodeURIComponent(activeRef).trim();
        setReferredBy(cleanRef);
        setIsReferralLocked(true);
        try {
          localStorage.setItem('referralCode', cleanRef);
        } catch {}
      }
    } catch {}
  }, []);

  // Listen to external auth mode triggers (e.g. from Navbar)
  useEffect(() => {
    const handleAuthModeEvent = (e) => {
      if (e?.detail) {
        setAuthMode(e.detail);
        setError('');
        setForgotSuccess('');
      }
    };
    window.addEventListener('taemry_set_auth_mode', handleAuthModeEvent);
    return () => window.removeEventListener('taemry_set_auth_mode', handleAuthModeEvent);
  }, []);

  // Ensure page starts at top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const { login, signup, resetPassword } = useAuth();

  // Mode switcher helper with fluid splash calculation
  const switchMode = (newMode, e) => {
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
      setTabSplash({
        id: Date.now() + Math.random(),
        mode: newMode,
        x,
        y,
      });
    } else {
      setTabSplash({
        id: Date.now() + Math.random(),
        mode: newMode,
        x: newMode === 'signin' ? 80 : 260,
        y: 20,
      });
    }
    setAuthMode(newMode);
    setError('');
    setForgotSuccess('');
    window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: newMode }));
  };

  // 1. Handle Sign In (Email + Password) - capped at 2s duration
  const handleSignIn = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;
    setError('');
    setForgotSuccess('');

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    // 5-second graceful safety timer so button never hangs or freezes
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      await login(cleanEmail, cleanPassword);
      clearTimeout(safetyTimer);
      setLoading(false);

      // Non-blocking persistent user record in backend
      apiClient.post('/auth/save-registered-user', { email: cleanEmail }).catch(() => {});

      // Clear legacy OTP flags completely per user directive
      try {
        sessionStorage.removeItem('taemry_pending_otp_email');
        sessionStorage.removeItem('taemry_otp_required');
        sessionStorage.removeItem('taemry_waiting_verification');
        localStorage.removeItem(`taemry_otp_verified_${cleanEmail}`);
      } catch {}

      // If user had clicked to buy a package previously, route to buy-package
      try {
        if (localStorage.getItem('taemry_selected_package')) {
          onNavigate('dashboard', 'buy-package');
          return;
        }
      } catch {}

      // Navigate directly to the "Put your wallet in motion" page
      onNavigate('home');
    } catch (err) {
      clearTimeout(safetyTimer);
      setLoading(false);

      const errMsg = err?.message || '';
      const lowerMsg = errMsg.toLowerCase();

      if (
        err?.code === 'auth/user-not-found' ||
        lowerMsg.includes('user-not-found') ||
        lowerMsg.includes('no account found') ||
        lowerMsg.includes('user not found')
      ) {
        setError('No account found with this email. Please check your email or Sign Up to create an account.');
      } else if (
        err?.code === 'auth/wrong-password' ||
        lowerMsg.includes('wrong-password') ||
        lowerMsg.includes('incorrect password') ||
        lowerMsg.includes('wrong password')
      ) {
        setError('Incorrect password. Please verify your password and try again.');
      } else if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/invalid-login-credentials' ||
        lowerMsg.includes('invalid-credential') ||
        lowerMsg.includes('invalid credential')
      ) {
        // Accurately verify if this email is registered in system
        let emailExists = false;
        try {
          const checkRes = await apiClient.post('/auth/check-email', { email: cleanEmail });
          if (checkRes.data?.exists) emailExists = true;
        } catch {}

        if (!emailExists) {
          try {
            const rawReg = localStorage.getItem('taemry_registered_emails');
            const list = rawReg ? JSON.parse(rawReg) : [];
            if (Array.isArray(list) && list.includes(cleanEmail)) emailExists = true;
          } catch {}
        }
        if (!emailExists) {
          try {
            const rawAcc = localStorage.getItem('taemry_registered_accounts');
            const accs = rawAcc ? JSON.parse(rawAcc) : {};
            if (accs && accs[cleanEmail]) emailExists = true;
          } catch {}
        }

        if (!emailExists) {
          setError('No account found with this email. Please check your email or Sign Up to create an account.');
        } else {
          setError('Incorrect password. Please verify your password and try again.');
        }
      } else {
        setError(errMsg || 'Incorrect email or password. Please verify your credentials and try again.');
      }
    }
  };

  // 2. Handle Sign Up (Full Name, Username, Email, Password, Referral) - capped at 2s duration
  const handleSignUp = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;
    setError('');
    setForgotSuccess('');

    const cleanFullName = (displayName || '').trim();
    const cleanUsername = (username || '').replace(/^@+/, '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || '').trim();
    const cleanReferral = (referredBy || '').replace(/^@+/, '').trim();

    if (!cleanFullName || cleanFullName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Please enter a username (at least 3 characters).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Check for throwaway / disposable emails
    const emailDomain = (cleanEmail.split('@')[1] || '').toLowerCase();
    const bannedTempDomains = [
      'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 
      'yopmail.com', 'trashmail.com', 'dispostable.com', 'sharklasers.com', 
      'getnada.com', 'burnermail.io', 'fakeinbox.com', 'inboxkitten.com',
      'throwawaymail.com', 'temp-mail.org', 'dropmail.me'
    ];
    if (bannedTempDomains.includes(emailDomain)) {
      setError('Disposable and temporary email addresses are prohibited. Please use a verified email address (Gmail, Yahoo, Outlook, etc.).');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    // 5-second graceful safety timer so signup button never hangs or freezes
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      // 1. Fast client-side duplicate checks
      let emailAlreadyExists = false;
      try {
        const rawReg = localStorage.getItem('taemry_registered_emails');
        const list = rawReg ? JSON.parse(rawReg) : [];
        if (Array.isArray(list) && list.includes(cleanEmail)) emailAlreadyExists = true;
      } catch {}
      if (!emailAlreadyExists) {
        try {
          const rawAcc = localStorage.getItem('taemry_registered_accounts');
          const accs = rawAcc ? JSON.parse(rawAcc) : {};
          if (accs && accs[cleanEmail]) emailAlreadyExists = true;
        } catch {}
      }

      if (emailAlreadyExists) {
        clearTimeout(safetyTimer);
        setLoading(false);
        setError('Account already exists! An account with this email address already exists. Please Sign In instead.');
        return;
      }

      // Non-blocking persistent user record in backend
      apiClient.post('/auth/save-registered-user', {
        email: cleanEmail,
        name: cleanFullName,
        username: cleanUsername,
      }).catch(() => {});

      // 2. Perform authentication signup directly
      await signup(cleanEmail, cleanPassword, cleanFullName, cleanReferral || '');
      clearTimeout(safetyTimer);
      setLoading(false);

      try {
        localStorage.removeItem('referralCode');
        localStorage.removeItem('taemry_referral_sponsor');
        // Clear all legacy OTP flags
        sessionStorage.removeItem('taemry_pending_otp_email');
        sessionStorage.removeItem('taemry_otp_required');
        sessionStorage.removeItem('taemry_waiting_verification');
      } catch {}

      // 3. User directive: "agar new user account create kary to create account ky bad welcome page laya karo OK..."
      try {
        sessionStorage.setItem('taemry_show_new_user_welcome', 'true');
        localStorage.setItem('taemry_show_new_user_welcome', 'true');
        window.dispatchEvent(new CustomEvent('taemry_trigger_welcome'));
      } catch {}

      // Navigate directly to home where the 3D Welcome Splash immediately appears
      onNavigate('home');
    } catch (err) {
      clearTimeout(safetyTimer);
      setLoading(false);
      const errMsg = err?.message || '';
      const lowerMsg = errMsg.toLowerCase();

      if (
        err?.code === 'auth/email-already-in-use' ||
        lowerMsg.includes('already-in-use') ||
        lowerMsg.includes('already exists') ||
        lowerMsg.includes('already in use')
      ) {
        setError('Account already exists! An account with this email address already exists. Please Sign In instead.');
      } else {
        setError(errMsg || 'Failed to create account. Please try again.');
      }
    }
  };

  // 3. Handle Forgot Password (capped at 2s duration)
  const handleForgotPassword = async () => {
    if (loading || forgotLoading) return;
    setError('');
    setForgotSuccess('');

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your email address first in the input field above.');
      return;
    }

    setForgotLoading(true);
    const loadingTimer = setTimeout(() => {
      setForgotLoading(false);
    }, 2000);

    try {
      await resetPassword(cleanEmail);
      clearTimeout(loadingTimer);
      setForgotLoading(false);
      setForgotSuccess(`Password reset instructions have been sent to ${cleanEmail}. Please check your inbox and spam folder.`);
    } catch (err) {
      clearTimeout(loadingTimer);
      setForgotLoading(false);
      setError(err?.message || 'Could not send password reset instructions. Please try again.');
    }
  };

  return (
    <div
      id="loginPageContainer"
      className="min-h-[calc(100vh-3rem)] w-full flex flex-col items-center justify-start pt-1 sm:pt-2 pb-12 px-4 bg-[#faf8f5] dark:bg-[#07151a] select-none-touch"
      style={{
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        overscrollBehaviorX: 'none',
        touchAction: 'pan-y',
      }}
    >
      {/* 1st Child: Brand Icon Header */}
      <div className="mb-3 sm:mb-4 flex flex-col items-center select-none pointer-events-none">
        <div id="brand-header-display" className="flex flex-col items-center gap-2 sm:gap-2.5 cursor-default">
          <Logo size="lg" showText={false} />
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold tracking-[0.25em] text-[#0a3a46] dark:text-[#ecf3f4] text-xl sm:text-2xl uppercase">
              TAEMRY
            </span>
            <span className="text-xs sm:text-sm tracking-[0.2em] font-extrabold uppercase text-[#0f766e] dark:text-[#38bdf8] px-2.5 py-1 rounded-md border border-[#0f766e]/20 dark:border-[#38bdf8]/30 bg-[#0f766e]/5 dark:bg-[#38bdf8]/10">
              FLUX
            </span>
          </div>
        </div>
      </div>

      {/* 2nd Child: Main Auth Card (Matches CSS Selector) */}
      <div
        id="login-auth-card"
        className="w-full max-w-md bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 shadow-lg shadow-[#0c5963]/5 border border-[#e4ded2] dark:border-[#1e3a44]"
      >
        {/* Auth Mode Tabs: Sign In / Sign Up with Fluid Splash Wave & Smooth Tab Transition */}
        <div
          id="auth-mode-tabs"
          className="relative flex items-center p-1 bg-[#f4efe6] dark:bg-[#081a20] rounded-2xl border border-[#e4ded2] dark:border-[#173740] mb-5 overflow-hidden select-none"
        >
          {/* Fluid splash wave ripple on tab toggle */}
          <AnimatePresence>
            {tabSplash && (
              <motion.span
                key={tabSplash.id}
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 3.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  left: tabSplash.x,
                  top: tabSplash.y,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 bg-radial from-[#0c5963]/30 via-[#0f766e]/20 to-transparent will-change-transform"
              />
            )}
          </AnimatePresence>

          <button
            type="button"
            id="btn-tab-signin"
            onClick={(e) => switchMode('signin', e)}
            className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'signin'
                ? 'text-[#09353e] dark:text-white shadow-xs'
                : 'text-[#657d82] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            {authMode === 'signin' && (
              <motion.div
                layoutId="active-auth-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white dark:bg-[#0c242d] rounded-xl shadow-xs -z-10"
              />
            )}
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="btn-tab-signup"
            onClick={(e) => switchMode('signup', e)}
            className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'signup'
                ? 'text-[#09353e] dark:text-white shadow-xs'
                : 'text-[#657d82] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            {authMode === 'signup' && (
              <motion.div
                layoutId="active-auth-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white dark:bg-[#0c242d] rounded-xl shadow-xs -z-10"
              />
            )}
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert with OK Button */}
        {error && (
          <div
            id="auth-error-alert"
            className="mb-4 p-3.5 rounded-2xl bg-[#fef2f2] dark:bg-[#450a0a]/30 border border-[#fecaca] dark:border-[#991b1b] text-[#991b1b] dark:text-[#fca5a5] text-xs flex flex-col gap-2.5 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span className="flex-1 font-medium leading-relaxed">{error}</span>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                id="btn-error-ok"
                type="button"
                onClick={() => setError('')}
                className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center min-w-[54px]"
              >
                <span>OK</span>
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Success Alert with OK Button */}
        {forgotSuccess && (
          <div
            id="auth-forgot-success"
            className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col gap-2 shadow-xs"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium leading-relaxed">{forgotSuccess}</span>
            </div>
            <div className="flex justify-end">
              <button
                id="btn-forgot-success-ok"
                type="button"
                onClick={() => setForgotSuccess('')}
                className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <span>OK</span>
              </button>
            </div>
          </div>
        )}

        {/* Smooth Page Transition Between Sign In and Sign Up Forms */}
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* SIGN IN VIEW                                                              */}
          {/* ========================================================================= */}
          {authMode === 'signin' ? (
            <motion.div
              key="auth-view-signin"
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#09353e] dark:text-white">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-[#61777b] dark:text-[#94a3b8] mt-1 leading-relaxed">
                  Sign in to access your TAEMRY space
                </p>

                {/* Motivation Trust Points on Sign In */}
                <div className="mt-3 text-left bg-[#f8faf9] dark:bg-[#071920] border border-[#e4ebe8] dark:border-[#163842] rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-[#284950] dark:text-[#cbd5e1]">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Coins className="w-3 h-3" />
                    </div>
                    <span className="font-medium">Decentralized TFLX protocol unlocking community wealth</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#284950] dark:text-[#cbd5e1]">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <span className="font-medium">High-hashrate cloud mining & guaranteed daily ad yields</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#284950] dark:text-[#cbd5e1]">
                    <div className="w-5 h-5 rounded-full bg-[#0c5963]/10 dark:bg-[#2dd4bf]/15 text-[#0c5963] dark:text-[#2dd4bf] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span className="font-medium">Autonomous asset sovereignty with decentralized session security</span>
                  </div>
                </div>
              </div>

              {/* Sign In Form */}
              <form id="auth-login-form" onSubmit={handleSignIn} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="input-email"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="input-email"
                      type="email"
                      required
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                    />
                    <Mail className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Password Input with Forgot Password Link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-password"
                      className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8]"
                    >
                      Password
                    </label>
                    <button
                      id="btn-forgot-password"
                      type="button"
                      disabled={forgotLoading || loading}
                      onClick={handleForgotPassword}
                      className="text-xs font-semibold text-[#0c5963] dark:text-[#2dd4bf] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? 'Sending link...' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="input-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                    />
                    <Lock className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      id="btn-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="!absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 flex items-center justify-center text-[#788e93] dark:text-[#64748b] hover:text-[#09353e] dark:hover:text-white cursor-pointer focus:outline-none rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 shrink-0 block" /> : <Eye className="w-4 h-4 shrink-0 block" />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Sign Up */}
                <div className="pt-2 text-center text-xs text-[#61777b] dark:text-[#94a3b8]">
                  <span>Don't have an account? </span>
                  <button
                    id="btn-switch-to-signup"
                    type="button"
                    onClick={(e) => switchMode('signup', e)}
                    className="font-bold text-[#0c5963] dark:text-[#2dd4bf] hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* SIGN UP VIEW                                                              */
            /* ========================================================================= */
            <motion.div
              key="auth-view-signup"
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#09353e] dark:text-white">
                  Create an Account
                </h2>
                <p className="text-xs sm:text-sm text-[#61777b] dark:text-[#94a3b8] mt-1 leading-relaxed">
                  Join TAEMRY FLUX and start earning daily yields
                </p>
              </div>

              {/* Sign Up Form */}
              <form id="auth-signup-form" onSubmit={handleSignUp} className="space-y-4">
                {/* Honeypot Bot Trap: Hidden to humans, filled by automated bot crawlers */}
                <input
                  type="text"
                  name="hp_bot_trap"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* 1. Full Name */}
                <div>
                  <label
                    htmlFor="input-fullname"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-fullname"
                      type="text"
                      required
                      autoFocus
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name (e.g. Alex Rivera)"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7] font-medium"
                    />
                    <User className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 2. Username */}
                <div>
                  <label
                    htmlFor="input-username"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                        setUsername(val);
                      }}
                      placeholder="Choose unique username (e.g. alex99)"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7] font-medium font-mono"
                    />
                    <AtSign className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 3. Email Address */}
                <div>
                  <label
                    htmlFor="input-signup-email"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-signup-email"
                      type="email"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                    />
                    <Mail className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label
                    htmlFor="input-signup-password"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Password (min 6 characters) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="input-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Create your password"
                      className="w-full pl-10 pr-11 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                    />
                    <Lock className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      id="btn-toggle-signup-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="!absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 flex items-center justify-center text-[#788e93] dark:text-[#64748b] hover:text-[#09353e] dark:hover:text-white cursor-pointer focus:outline-none rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 shrink-0 block" /> : <Eye className="w-4 h-4 shrink-0 block" />}
                    </button>
                  </div>
                </div>

                {/* 5. Sponsor / Referral Code */}
                <div>
                  <label
                    htmlFor="input-referral"
                    className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
                  >
                    Referral Code (Optional)
                  </label>
                  {isReferralLocked && referredBy ? (
                    <div
                      id="badge-auto-referral"
                      className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Sponsor:{' '}
                          <strong className="font-mono font-bold text-emerald-900 dark:text-emerald-100">
                            @{referredBy.replace(/^@+/, '')}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded text-emerald-700 dark:text-emerald-300">
                        Connected
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="input-referral"
                        type="text"
                        value={referredBy}
                        onChange={(e) => setReferredBy(e.target.value)}
                        placeholder="Enter sponsor username (e.g. sponsor99) or leave blank"
                        className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none text-[#09353e] dark:text-white placeholder-[#9caea7] font-medium"
                      />
                      <Users className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  )}
                </div>

                {/* Submit Sign Up Button */}
                <button
                  id="btn-signup-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Sign In */}
                <div className="pt-2 text-center text-xs text-[#61777b] dark:text-[#94a3b8]">
                  <span>Already have an account? </span>
                  <button
                    id="btn-switch-to-signin"
                    type="button"
                    onClick={(e) => switchMode('signin', e)}
                    className="font-bold text-[#0c5963] dark:text-[#2dd4bf] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3rd Child: Bottom Reassurance / Prompt */}
        <div className="mt-6 text-center text-xs text-[#526a6f] dark:text-[#94a3b8]">
          <p id="auth-footer-prompt" className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0f766e] dark:text-[#2dd4bf] shrink-0" />
            <span>Protected by TAEMRY FLUX Decentralized</span>
          </p>
        </div>
      </div>

      {/* Google AdSense Sponsor Banner at Base of Login Page - Hidden for now per user instruction ("filhal hidden kardo jad ads shro ho jay tab show kardo OK") */}
      {showAdsBanner && (
        <div id="login-ads-banner" className="w-full max-w-md">
          <GoogleAdSense label="Official Sponsor Network" format="auto" className="mt-6" />
        </div>
      )}
    </div>
  );
}
