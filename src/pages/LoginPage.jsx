import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  X,
  Loader2,
  User,
  RefreshCw,
  TrendingUp,
  Coins,
  AtSign,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function LoginPage({ onNavigate, initialMode = 'signin' }) {
  // Authentication stage: 'email' -> 'otp' -> 'welcome' -> 'profile'
  const [authStage, setAuthStage] = useState('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendNotice, setResendNotice] = useState('');

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

  // Sync and freeze referral code when landing via link
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

  // Ensure page starts at top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (authStage !== 'otp' || otpCountdown <= 0) return;
    const interval = setInterval(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [authStage, otpCountdown]);

  const { loginWithGoogle, establishOtpSession } = useAuth();

  // 1. Submit Email -> Request OTP code
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/send-otp', { email: cleanEmail });
      if (res.data?.success) {
        setIsNewUser(Boolean(res.data.isNewUser));
        setAuthStage('otp');
        setOtpCountdown(15);
        setOtpCode('');
      } else {
        setError(res.data?.message || 'Failed to send OTP code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Resend OTP code
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || loading) return;
    setError('');
    setResendNotice('');
    setLoading(true);
    try {
      const cleanEmail = (email || '').toLowerCase().trim();
      const res = await apiClient.post('/auth/send-otp', { email: cleanEmail });
      if (res.data?.success) {
        setOtpCountdown(15);
        setResendNotice('New verification code sent! Please check your inbox.');
        setTimeout(() => setResendNotice(''), 4000);
      } else {
        setError(res.data?.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP code (Automated on 6-digits entry & protected against bot brute-force)
  const handleVerifyOtp = async (codeToVerify, e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;

    setError('');
    const cleanEmail = (email || '').toLowerCase().trim();
    const candidate = typeof codeToVerify === 'string' ? codeToVerify : otpCode;
    const cleanOtp = (candidate || '').replace(/\D/g, '').trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email: cleanEmail,
        otp: cleanOtp,
      });

      if (res.data?.success) {
        if (res.data.isNewUser) {
          // New user -> Move to dedicated Welcome page first
          setIsNewUser(true);
          setAuthStage('welcome');
          const basePart = (cleanEmail.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, ' ');
          const formattedName = basePart ? basePart.charAt(0).toUpperCase() + basePart.slice(1) : '';
          const formattedUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
          setDisplayName(formattedName);
          setUsername(formattedUsername);
        } else {
          // Existing user -> Instant login and redirect to homepage
          const loggedUser = res.data.user || { email: cleanEmail };
          establishOtpSession(loggedUser);
          try {
            if (localStorage.getItem('taemry_selected_package')) {
              onNavigate('dashboard', 'buy-package');
              return;
            }
          } catch {}
          onNavigate('home');
        }
      } else {
        setError(res.data?.message || 'Invalid or expired code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Complete Profile Setup (New User) -> Homepage
  const handleCompleteOnboarding = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanFullName = (displayName || '').trim();
    const cleanUsername = (username || '').replace(/^@+/, '').trim();

    if (!cleanFullName || cleanFullName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Please enter a username (at least 3 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/complete-otp-signup', {
        email: cleanEmail,
        fullName: cleanFullName,
        name: cleanFullName,
        username: cleanUsername,
        referralCode: referredBy?.trim() || null,
      });

      if (res.data?.success) {
        const createdUser = res.data.user;
        establishOtpSession(createdUser);
        try {
          localStorage.removeItem('referralCode');
          localStorage.removeItem('taemry_referral_sponsor');
        } catch {}

        try {
          window.dispatchEvent(new CustomEvent('taemry_trigger_welcome', { detail: createdUser }));
        } catch {}

        try {
          if (localStorage.getItem('taemry_selected_package')) {
            onNavigate('dashboard', 'buy-package');
            return;
          }
        } catch {}

        // Go directly to Homepage per user instruction ("then homepage OK")
        onNavigate('home');
      } else {
        setError(res.data?.message || 'Failed to complete registration.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    setGoogleLoading(true);
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
      const isDismissed =
        err?.isCancelled ||
        err?.code === 'popup_closed' ||
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('closed');

      if (isDismissed) {
        console.info('Google Sign-In was closed or cancelled by user.');
        return;
      }

      console.warn('Google Sign In notice:', err?.message || err);
      setError(err.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
      setGoogleLoading(false);
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

      {/* 2nd Child: Main Auth Card (Matches CSS Selector 3) */}
      <div
        id="login-auth-card"
        className="w-full max-w-md bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 shadow-lg shadow-[#0c5963]/5 border border-[#e4ded2] dark:border-[#1e3a44]"
      >
        {/* 1st Child: Header Title & Subtitle with 3 New Lines (Matches CSS Selector 4) */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[#09353e] dark:text-white">
            {authStage === 'welcome'
              ? 'Welcome to TAEMRY FLUX'
              : authStage === 'profile'
              ? 'Complete Your Profile'
              : authStage === 'otp'
              ? 'Verify Your Email'
              : 'Welcome back'}
          </h2>

          {/* Matches div#loginPageContainer > div:nth-of-type(2) > div:nth-of-type(1) > p:nth-of-type(1) */}
          <p className="text-xs sm:text-sm text-[#61777b] dark:text-[#94a3b8] mt-1 leading-relaxed">
            {authStage === 'welcome' ? (
              'Your email is verified! Welcome to our ecosystem'
            ) : authStage === 'profile' ? (
              'Enter your full name, username, and sponsor referral'
            ) : authStage === 'otp' ? (
              <>
                Enter the 6-digit code sent to{' '}
                <strong className="text-[#0c5963] dark:text-[#2dd4bf] font-semibold">{email}</strong>
              </>
            ) : (
              'Sign in to your TAEMRY space'
            )}
          </p>

          {/* 3 Decentralized TFLX & Future Motivate Lines under "Sign in to your TAEMRY space" */}
          {authStage === 'email' && (
            <div className="mt-3 text-left bg-[#f8faf9] dark:bg-[#071920] border border-[#e4ebe8] dark:border-[#163842] rounded-2xl p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-[#284950] dark:text-[#cbd5e1]">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-3 h-3" />
                </div>
                <span className="font-medium">Decentralized TFLX protocol unlocking community wealth and next-gen financial freedom</span>
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
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#fef2f2] dark:bg-[#450a0a]/30 border border-[#fecaca] dark:border-[#991b1b] text-[#991b1b] dark:text-[#fca5a5] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Resend Notice */}
        {resendNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resendNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 1: EMAIL ADDRESS ONLY (Matches CSS Selector 1)                      */}
        {/* ========================================================================= */}
        {authStage === 'email' && (
          <>
            {/* "Continue with Google" Button */}
            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mb-4 flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-[#0a1c22] hover:bg-[#faf8f5] dark:hover:bg-[#122e37] active:bg-[#f3eee5] text-[#133842] dark:text-white text-sm font-semibold rounded-2xl border border-[#d8d2c4] dark:border-[#1d4450] shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[#0c5963] dark:border-[#2dd4bf] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
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
              )}
              <span className="text-[#133842] dark:text-white">
                {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#eae3d5] dark:border-[#1c3a44] w-full" />
              <span className="bg-white dark:bg-[#0a1b22] px-3 text-[11px] font-semibold text-[#8a9ba0] uppercase tracking-wider absolute">
                or email
              </span>
            </div>

            {/* Primary Form: ONLY Email Address (Matches CSS Selector 1) */}
            <form id="auth-email-form" onSubmit={handleSendEmailOtp} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                  />
                  <Mail className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    <span>Continue with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: 6-DIGIT EMAIL OTP VERIFICATION                                   */}
        {/* ========================================================================= */}
        {authStage === 'otp' && (
          <form id="auth-otp-form" onSubmit={(e) => handleVerifyOtp(otpCode, e)} className="space-y-4">
            <div className="p-4 bg-[#f0f9f8] dark:bg-[#09222a] border border-[#a2d4cd] dark:border-[#1a4f5d] rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#0c5963]/10 dark:bg-[#2dd4bf]/15 flex items-center justify-center text-[#0c5963] dark:text-[#2dd4bf]">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#526a6f] dark:text-[#94a3b8] leading-relaxed">
                We sent a 6-digit one-time code to <strong className="text-[#0c5963] dark:text-[#2dd4bf]">{email}</strong>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-otp-code"
                  className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8]"
                >
                  Verification Code (6-digits)
                </label>
                <span className="hidden">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Anti-Bot Protection Active
                </span>
              </div>
              <input
                id="input-otp-code"
                type="text"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  setError('');
                  if (val.length === 6 && !loading) {
                    handleVerifyOtp(val);
                  }
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white"
              />
            </div>

            {/* Verify Button with Auto-Continue feedback */}
            <button
              id="btn-verify-otp"
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Code & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Action buttons: Resend & Change email */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                id="btn-back-to-email"
                onClick={() => {
                  setAuthStage('email');
                  setError('');
                }}
                className="text-[#64748b] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                id="btn-resend-otp"
                disabled={otpCountdown > 0 || loading}
                onClick={handleResendOtp}
                className="font-semibold text-[#0c5963] dark:text-[#2dd4bf] hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: NEW USER WELCOME PAGE (DEDICATED SEPARATE SCREEN)                */}
        {/* ========================================================================= */}
        {authStage === 'welcome' && (
          <div id="auth-welcome-page" className="space-y-4">
            {/* Email Verified Confirmation Badge */}
            <div
              id="badge-email-verified"
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Email Verified:{' '}
                <strong className="font-mono font-bold text-emerald-900 dark:text-emerald-200">
                  {email}
                </strong>
              </span>
            </div>

            {/* Welcome Ecosystem Card */}
            <div className="p-4 bg-[#fbfaf8] dark:bg-[#081a20] border border-[#e4ded2] dark:border-[#163842] rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0c5963]/10 dark:bg-[#2dd4bf]/15 text-[#0c5963] dark:text-[#2dd4bf] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#09353e] dark:text-white">Welcome Aboard!</h3>
                  <p className="text-xs text-[#61777b] dark:text-[#94a3b8] leading-snug">
                    Your account is verified. Complete your profile to activate your decentralized space.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#ede7dc] dark:border-[#143039] space-y-2 text-xs text-[#324f55] dark:text-[#cbd5e1]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verified Ad Rewards & 12h Cloud Miner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>5-Level Guild Network Referral Commissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Secure Member Identity & Decentralized Wallet</span>
                </div>
              </div>
            </div>

            {/* Next Button -> Moves to Profile Setup Screen */}
            <button
              id="btn-welcome-next"
              type="button"
              onClick={() => {
                setError('');
                setAuthStage('profile');
              }}
              className="w-full mt-2 py-3.5 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Next: Set Up Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: PROFILE SETUP PAGE (FULL NAME, USERNAME & NICHY REFERRAL)        */}
        {/* ========================================================================= */}
        {authStage === 'profile' && (
          <form id="auth-profile-form" onSubmit={handleCompleteOnboarding} className="space-y-4">
            {/* 1. Full Name Input (Required) */}
            <div>
              <label
                htmlFor="input-onboarding-fullname"
                className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-onboarding-fullname"
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

            {/* 2. Username Input (Required) */}
            <div>
              <label
                htmlFor="input-onboarding-username"
                className="block text-xs font-semibold text-[#324f55] dark:text-[#94a3b8] mb-1.5"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-onboarding-username"
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
              <p className="text-[11px] text-[#61777b] dark:text-[#94a3b8] mt-1">
                Your unique handle for login and referral link sharing.
              </p>
            </div>

            {/* 3. Nichy Referral (Below Username) */}
            <div>
              <label
                htmlFor="input-onboarding-referral"
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
                    id="input-onboarding-referral"
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Enter sponsor username (e.g. sponsor99) or leave blank"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-[#faf8f5] dark:bg-[#081a20] border border-[#dcd6c9] dark:border-[#1f4049] rounded-xl focus:bg-white dark:focus:bg-[#0c242d] focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none text-[#09353e] dark:text-white placeholder-[#9caea7] font-medium"
                  />
                  <Users className="w-4 h-4 text-[#788e93] dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
              <p className="text-[11px] text-[#61777b] dark:text-[#94a3b8] mt-1">
                If invited by a member, enter their username. Otherwise leave blank.
              </p>
            </div>

            {/* Action Buttons: Submit & Back */}
            <div className="pt-1 space-y-2">
              <button
                id="btn-complete-onboarding"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#0c5963] hover:bg-[#09424a] active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete & Enter TAEMRY FLUX</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-back-to-welcome"
                onClick={() => {
                  setError('');
                  setAuthStage('welcome');
                }}
                className="w-full py-2 text-xs font-semibold text-[#61777b] dark:text-[#94a3b8] hover:text-[#0c5963] dark:hover:text-[#2dd4bf] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Welcome</span>
              </button>
            </div>
          </form>
        )}

        {/* 3rd Child: Bottom Reassurance / Prompt (Matches CSS Selector 2) */}
        <div className="mt-6 text-center text-xs text-[#526a6f] dark:text-[#94a3b8]">
          <p id="auth-footer-prompt" className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0f766e] dark:text-[#2dd4bf] shrink-0" />
            <span>Protected by TAEMRY FLUX Decentralized</span>
          </p>
        </div>
      </div>
    </div>
  );
}
