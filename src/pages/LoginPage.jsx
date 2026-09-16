import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Shield, Sparkles, KeyRound, Mail, X, Loader2, Lock, Check, RefreshCw, User } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../firebase/firebase.config';
import apiClient from '../api/client';

export default function LoginPage({ onNavigate, initialMode = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(() => {
    if (initialMode === 'signup') return true;
    try {
      if (typeof window !== 'undefined') {
        const search = window.location.search || '';
        const hash = window.location.hash || '';
        if (/[?&]ref=/i.test(search) || /[?&]ref=/i.test(hash) || hash.includes('signup')) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  React.useEffect(() => {
    const signupMode = initialMode === 'signup';
    setIsSignUp(signupMode);
    try {
      window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: signupMode ? 'signup' : 'signin' }));
    } catch {}
  }, [initialMode]);

  // Listen for external auth mode switch events
  React.useEffect(() => {
    const handleAuthModeEvent = (e) => {
      if (e?.detail === 'signup') {
        setIsSignUp(true);
        setError('');
      } else if (e?.detail === 'signin') {
        setIsSignUp(false);
        setError('');
      }
    };
    window.addEventListener('taemry_set_auth_mode', handleAuthModeEvent);
    return () => window.removeEventListener('taemry_set_auth_mode', handleAuthModeEvent);
  }, []);

  // Ensure page starts at top without locking swipe or scroll
  React.useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('@');
  const [referredBy, setReferredBy] = useState(() => {
    try {
      if (typeof window === 'undefined') return '';
      // 1. Check URL parameters (?ref=CODE or ?referral=CODE)
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
      // 2. Check localStorage key 'referralCode'
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

  // Sync and freeze referral code when landing via link
  React.useEffect(() => {
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Check URL parameters for email verification or password reset
  React.useEffect(() => {
    try {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const isVerified =
        search.includes('mode=verified') ||
        search.includes('mode=verify') ||
        hash.includes('mode=verified') ||
        hash.includes('mode=verify');

      if (isVerified) {
        setVerifiedSuccess(true);
        setIsSignUp(false);
        setWaitingForVerification(false);
        const emailMatch = (search + hash).match(/email=([^&#]+)/i);
        if (emailMatch && emailMatch[1]) {
          const verifiedEmail = decodeURIComponent(emailMatch[1]);
          setEmail(verifiedEmail);
          try {
            apiClient.post('/auth/mark-verified', { email: verifiedEmail }).catch(() => {});
          } catch {}
        }
      }
    } catch {}
  }, []);

  // Real-time automatic polling when waiting for email verification
  React.useEffect(() => {
    if (!waitingForVerification || !pendingVerificationEmail) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/auth/check-verification?email=${encodeURIComponent(pendingVerificationEmail)}`);
        if (res.data && res.data.verified) {
          clearInterval(interval);
          setWaitingForVerification(false);
          setVerifiedSuccess(true);
          try {
            if (localStorage.getItem('taemry_selected_package')) {
              onNavigate('dashboard', 'buy-package');
              return;
            }
          } catch {}
          onNavigate('home');
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [waitingForVerification, pendingVerificationEmail, onNavigate]);

  const { login, signup, loginWithGoogle, resetPassword, isFirebaseConfigured } = useAuth();

  // Handle Form Submission (Sign in or Sign up)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (isSignUp) {
      const cleanUser = displayName.replace(/^@+/, '').trim();
      if (!cleanUser) {
        setError('Please choose a valid username after the @ symbol.');
        return;
      }

      // Password requirement: at least 1 number
      if (!/\d/.test(password)) {
        setError('Password must contain at least 1 number.');
        return;
      }
    } else {
      if (password.length < 1) {
        setError('Please enter your password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        sessionStorage.setItem('taemry_show_new_user_welcome', 'true');
        const codeToUse = (referredBy && referredBy.trim()) || localStorage.getItem('referralCode') || null;
        if (codeToUse) {
          try {
            localStorage.setItem('referralCode', codeToUse);
          } catch {}
        }
        const usernameToSave = '@' + displayName.replace(/^@+/, '').trim();
        await signup(email, password, usernameToSave, codeToUse);

        // Transition to automatic email verification screen
        setPendingVerificationEmail(email.trim().toLowerCase());
        setWaitingForVerification(true);
        return;
      } else {
        await login(email, password);
      }
      try {
        if (localStorage.getItem('taemry_selected_package')) {
          onNavigate('dashboard', 'buy-package');
          return;
        }
      } catch {}
      onNavigate('home');
    } catch (err) {
      console.error('Auth error:', err);
      // Friendly message
      const msg = err.message || '';
      if (
        msg.includes('user-not-found') ||
        msg.includes('No account found') ||
        msg.includes('create your account first')
      ) {
        setError('No account found with this email. Please sign up to create your account first.');
      } else if (
        msg.includes('wrong-password') ||
        msg.includes('Incorrect password')
      ) {
        setError('Incorrect password. Please verify your password and try again.');
      } else if (msg.includes('invalid-credential')) {
        setError('No account found or invalid credentials. If you have not created an account yet, please click "Sign up" below.');
      } else if (msg.includes('email-already-in-use') || msg.includes('already exists')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (msg.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      try {
        if (localStorage.getItem('taemry_selected_package')) {
          onNavigate('dashboard', 'buy-package');
          return;
        }
      } catch {}
      onNavigate('home');
    } catch (err) {
      console.error('Google Sign In failed:', err);
      setError(err.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (forgotEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotError('');
    setIsSendingReset(true);
    try {
      await resetPassword(cleanEmail);
      setResetSent(true);
    } catch (err) {
      const msg = err.message || '';
      if (
        err.code === 'auth/user-not-found' ||
        msg.includes('user-not-found') ||
        msg.includes('No account found') ||
        msg.includes('account') ||
        msg.includes('not found') ||
        msg.includes('invalid-credential')
      ) {
        setForgotError('No account found with this email address. Please check your email or sign up first.');
      } else {
        console.warn('Password reset notice:', msg);
        if (msg.includes('invalid-email')) {
          setForgotError('Please enter a valid email address.');
        } else if (msg.includes('too-many-requests')) {
          setForgotError('Too many attempts. Please wait a moment before trying again.');
        } else {
          setForgotError(msg || 'Unable to send password reset email. Please try again.');
        }
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div
      id="loginPageContainer"
      className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-start pt-3 sm:pt-6 pb-12 px-4 bg-[#faf8f5] dark:bg-[#07151a] select-none-touch"
      style={{
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        overscrollBehaviorX: 'none',
        touchAction: 'pan-y'
      }}
    >
      {/* Brand Icon Header (Static / Non-clickable display) */}
      <div className="mb-3 sm:mb-4 flex flex-col items-center select-none pointer-events-none">
        <div
          id="brand-header-display"
          className="flex flex-col items-center cursor-default"
        >
          <Logo size="lg" showText={false} />
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display font-extrabold tracking-[0.25em] text-[#0a3a46] dark:text-[#ecf3f4] text-lg uppercase">
              TAEMRY
            </span>
            <span className="text-xs tracking-[0.2em] font-extrabold uppercase text-[#0f766e] dark:text-[#38bdf8] px-2 py-0.5 rounded border border-[#0f766e]/20 dark:border-[#38bdf8]/30 bg-[#0f766e]/5 dark:bg-[#38bdf8]/10">
              FLUX
            </span>
          </div>
        </div>
      </div>

      {/* Main Auth Card (Starts cleanly near top, not pushed down) */}
      <div className="w-full max-w-md bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 shadow-lg shadow-[#0c5963]/5 border border-[#e4ded2] dark:border-[#1e3a44]">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[#09353e] dark:text-white">
            {isSignUp ? 'Create your TAEMRY space' : 'Welcome back'}
          </h2>
          <p className="text-xs sm:text-sm text-[#61777b] dark:text-[#94a3b8] mt-1">
            {isSignUp
              ? 'Start making progress visible'
              : 'Sign in to your TAEMRY space'}
          </p>
        </div>

        {/* Email Verified Banner */}
        {verifiedSuccess && (
          <div
            id="emailVerifiedSuccessBanner"
            className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1">
              <strong className="block text-emerald-900 dark:text-emerald-100 font-semibold text-sm mb-0.5">
                Email Verified Successfully!
              </strong>
              Your TAEMRY FLUX account email has been verified. You can now sign in to your dashboard.
            </div>
            <button
              type="button"
              onClick={() => setVerifiedSuccess(false)}
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Automatic Email Verification Waiting Card */}
        {waitingForVerification && (
          <div
            id="waitingForVerificationCard"
            className="mb-6 p-5 bg-[#f0f9f8] dark:bg-[#09222a] border border-[#a2d4cd] dark:border-[#1a4f5d] rounded-2xl text-center space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-[#0c5963]/10 dark:bg-[#2dd4bf]/10 flex items-center justify-center text-[#0c5963] dark:text-[#2dd4bf]">
              <Mail className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#09353e] dark:text-white">
                Verify Your Email Address
              </h3>
              <p className="text-xs text-[#526a6f] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                We sent a verification link to <strong className="text-[#0c5963] dark:text-[#2dd4bf] font-semibold">{pendingVerificationEmail}</strong>.
                Please check your inbox or spam folder in Gmail.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-[#07171d] rounded-xl border border-[#d2e4e0] dark:border-[#143742] flex items-center justify-center gap-2 text-xs font-semibold text-[#0c5963] dark:text-[#5eead4]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#0c5963] dark:text-[#5eead4]" />
              <span>Checking verification automatically...</span>
            </div>

            <p className="text-[11px] text-[#6b8287] dark:text-[#8099a0]">
              Jesy hi ap Gmail me link par click karenge, ye screen khud ba khud verify ho kar aglay step par redirect ho jay gi!
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleManualCheckVerification}
                disabled={isCheckingVerification}
                className="px-4 py-2 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCheckingVerification ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Now</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaitingForVerification(false);
                  setIsSignUp(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#5a7075] dark:text-[#94a3b8] hover:bg-[#e6efec] dark:hover:bg-[#102b34] rounded-xl transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className={`mb-5 p-3.5 rounded-xl flex flex-col gap-2 text-xs ${
            error.toLowerCase().includes('already exist')
              ? 'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]'
              : 'bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]'
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
            {error.toLowerCase().includes('already exist') && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                className="self-start mt-1 px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white rounded-lg font-bold text-xs transition cursor-pointer"
              >
                👉 Switch to Sign In with this Email
              </button>
            )}
            {(error.toLowerCase().includes('no account') || error.toLowerCase().includes('sign up to create') || error.toLowerCase().includes('sign up below')) && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="self-start mt-1 px-3 py-1.5 bg-[#0c5963] hover:bg-[#09424a] text-white rounded-lg font-bold text-xs transition cursor-pointer"
              >
                👉 Click here to Sign Up (Create Account)
              </button>
            )}
          </div>
        )}

        {/* "Continue with Google" Button */}
        <button
          id="btn-google-auth"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-[#0a1c22] hover:bg-[#faf8f5] dark:hover:bg-[#122e37] active:bg-[#f3eee5] text-[#133842] dark:text-white text-sm font-semibold rounded-2xl border border-[#d8d2c4] dark:border-[#1d4450] shadow-xs transition-all cursor-pointer disabled:opacity-60"
        >
          {/* Google Color G SVG */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-[#133842] dark:text-white">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-[#eae3d5] w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-[#8a9ba0] uppercase tracking-wider absolute">
            or
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] flex items-center gap-1.5">
                  <span>Sponsor Username</span>
                  {isReferralLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#2dd4bf] text-[10px] font-bold rounded-full border border-[#b8ded7] dark:border-[#173740]">
                      <Lock className="w-2.5 h-2.5" /> Frozen Sponsor
                    </span>
                  )}
                </label>
              </div>
              <div className="relative">
                <input
                  id="input-referred-by"
                  type="text"
                  readOnly={isReferralLocked}
                  value={referredBy}
                  onChange={(e) => {
                    if (isReferralLocked) return;
                    const val = e.target.value;
                    setReferredBy(val);
                    try {
                      if (val && val.trim()) {
                        localStorage.setItem('referralCode', val.trim());
                      } else {
                        localStorage.removeItem('referralCode');
                      }
                    } catch {}
                  }}
                  placeholder="Enter sponsor username (e.g. taemry)"
                  className={`w-full px-4 py-3 text-sm rounded-xl transition-all ${
                    isReferralLocked
                      ? 'bg-[#f1eee7] dark:bg-[#081a20] border border-[#d2cbbe] dark:border-[#1f4049] text-[#0c5963] dark:text-[#2dd4bf] font-mono font-bold cursor-not-allowed select-none pr-10'
                      : 'bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none text-[#09353e] dark:text-white placeholder-[#9caea7] dark:placeholder-[#55727a]'
                  }`}
                />
                {isReferralLocked && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0c5963] dark:text-[#2dd4bf] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )}

          {isSignUp && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8]">
                  Username
                </label>
              </div>
              <div className="relative">
                <input
                  id="input-username"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => {
                    let val = e.target.value;
                    // Ensure @ stays at the beginning
                    if (!val.startsWith('@')) {
                      val = '@' + val.replace(/@/g, '');
                    }
                    setDisplayName(val);
                  }}
                  placeholder="@yourusername"
                  className="w-full px-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7] dark:placeholder-[#55727a] font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#324f55] mb-1.5">
              Email address
            </label>
            <input
              id="input-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 text-sm bg-[#faf8f5] border border-[#dcd6c9] rounded-xl focus:bg-white focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] placeholder-[#9caea7]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#324f55]">
                Password
              </label>
              {!isSignUp && (
                <button
                  id="btn-forgot-password-trigger"
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotError('');
                    setResetSent(false);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-[#0c5963] hover:text-[#083a41] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'Include at least 1 number' : 'Enter your password'}
                className="w-full pl-4 pr-11 py-3 text-sm bg-[#faf8f5] border border-[#dcd6c9] rounded-xl focus:bg-white focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] placeholder-[#9caea7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#788e93] hover:text-[#0c5963] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Sign Up' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In & Sign Up */}
        <div className="mt-6 text-center text-xs text-[#526a6f]">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                id="toggle-signin"
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  window.location.hash = '#/login/signin';
                  try {
                    window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: 'signin' }));
                  } catch {}
                }}
                className="font-bold text-[#0c5963] hover:underline"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                id="toggle-signup"
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  window.location.hash = '#/login/signup';
                  try {
                    window.dispatchEvent(new CustomEvent('taemry_set_auth_mode', { detail: 'signup' }));
                  } catch {}
                }}
                className="font-bold text-[#0c5963] hover:underline"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          id="modal-forgot-password-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotModal(false);
            }
          }}
        >
          <div
            id="modal-forgot-password"
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#ded8cb] shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative"
          >
            {/* Top Close Button */}
            <button
              id="btn-close-forgot-modal"
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 p-1.5 text-[#788e93] hover:text-[#09353e] hover:bg-[#f3eee5] rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Key Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center shrink-0 border border-[#bce3db]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#09353e]">Recover Password</h3>
                <p className="text-xs text-[#61777b]">
                  Secure recovery via Authentication
                </p>
              </div>
            </div>

            {resetSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl text-[#166534] space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#16a34a] shrink-0" />
                    <span className="font-bold text-sm">Reset Link Sent!</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#14532d]">
                    We have dispatched a secure password reset link to <strong className="font-semibold">{forgotEmail}</strong>. Please check your inbox and click the link to set a new password.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    id="btn-back-to-signin"
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSent(false);
                      setIsSignUp(false);
                    }}
                    className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#0c5963] hover:bg-[#09424a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
                  >
                    Back to Sign In
                  </button>
                  <button
                    id="btn-resend-reset-email"
                    type="button"
                    disabled={isSendingReset}
                    onClick={() => handleForgotPassword()}
                    className="w-full sm:w-auto py-2.5 px-4 bg-[#f3eee5] hover:bg-[#e8e2d5] text-[#0c5963] rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSendingReset ? 'Resending...' : 'Resend Link'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-[#526a70] leading-relaxed">
                  Enter the email address associated with your TAEMRY account. We will send you an official single-use password reset link.
                </p>

                {forgotError && (
                  <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#991b1b] space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                      <span className="leading-snug font-semibold">{forgotError}</span>
                    </div>
                    {(forgotError.includes('sign up') || forgotError.includes('Sign Up') || forgotError.includes('account')) && (
                      <div className="pt-0.5 pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(false);
                            setIsSignUp(true);
                            setForgotError('');
                          }}
                          className="text-[#0c5963] hover:underline font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          Go to Sign Up &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="input-forgot-email" className="block text-xs font-semibold text-[#324f55] mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="input-forgot-email"
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="e.g. name@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#faf8f5] border border-[#d8d1c3] rounded-xl focus:bg-white focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 text-[#09353e] placeholder-[#9caea7] transition-all"
                    />
                    <Mail className="w-4 h-4 text-[#788e93] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    id="btn-cancel-forgot"
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-[#5a7075] hover:bg-[#f1ede4] hover:text-[#09353e] rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-send-reset-link"
                    type="submit"
                    disabled={isSendingReset || !forgotEmail}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0c5963] hover:bg-[#09424a] text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
