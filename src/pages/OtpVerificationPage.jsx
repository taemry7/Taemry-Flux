import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  LogOut,
  Lock,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OtpVerificationPage({ onNavigate }) {
  const { currentUser, logout } = useAuth();

  // Retrieve user's email from session storage, currentUser, or localStorage
  const [email, setEmail] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const pending =
          sessionStorage.getItem('taemry_pending_otp_email') ||
          localStorage.getItem('taemry_pending_otp_email');
        if (pending && pending.trim()) return pending.trim();
      }
    } catch {}
    return currentUser?.email || '';
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewCode, setPreviewCode] = useState('');

  const inputRefs = useRef([]);

  // Ensure scroll is at top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  // Sync email from currentUser if updated
  useEffect(() => {
    if (!email && currentUser?.email) {
      setEmail(currentUser.email);
      try {
        sessionStorage.setItem('taemry_pending_otp_email', currentUser.email);
      } catch {}
    }
  }, [currentUser, email]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newOtp = [...otp];
    const digit = cleaned.slice(-1); // Take last digit if multiple entered
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // If digit entered, automatically advance to next box
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically submit
    const combined = newOtp.join('');
    if (combined.length === 6 && !newOtp.includes('')) {
      handleVerify(combined);
    }
  };

  // Handle Backspace & Arrow keys navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste event (allows pasting full 6-digit code)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || '';
    }
    setOtp(newOtp);
    setError('');

    // Focus last filled box or trigger verification if complete
    const filledLength = pasteData.length;
    if (filledLength === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(pasteData);
    } else {
      inputRefs.current[filledLength]?.focus();
    }
  };

  // Verify OTP handler
  const handleVerify = async (codeToVerify) => {
    const finalCode = (codeToVerify || otp.join('')).trim();
    if (finalCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('No valid email found for verification. Please sign in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: cleanEmail,
        otp: finalCode,
      });

      if (response?.data?.success || response?.data?.verified) {
        setSuccess(true);
        // Mark permanently verified in localStorage and clear pending flags
        try {
          localStorage.setItem(`taemry_otp_verified_${cleanEmail}`, 'true');
          localStorage.setItem('taemry_otp_verified', 'true');
          sessionStorage.removeItem('taemry_otp_required');
          sessionStorage.removeItem('taemry_waiting_verification');
          sessionStorage.removeItem('taemry_pending_otp_email');
        } catch {}

        // Smooth transition to Put your wallet in motion (home) or selected package
        setTimeout(() => {
          try {
            if (localStorage.getItem('taemry_selected_package')) {
              onNavigate('dashboard', 'buy-package');
              return;
            }
          } catch {}
          onNavigate('home');
        }, 800);
      } else {
        setError(response?.data?.message || 'Verification failed. Please check the code and try again.');
        setLoading(false);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'The verification code is incorrect or expired. Please check your email or request a new code.';
      setError(msg);
      setLoading(false);
      // Reset OTP inputs for quick retry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('No valid email found. Please sign in again.');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/send-otp', {
        email: cleanEmail,
        isResend: true,
      });

      setTimer(60);
      setCanResend(false);
      setResendLoading(false);

      if (res?.data?.previewCode) {
        setPreviewCode(res.data.previewCode);
      }
    } catch (err) {
      setResendLoading(false);
      setError(err?.response?.data?.message || err?.message || 'Failed to resend verification code.');
    }
  };

  // Sign out / change email handler
  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('taemry_otp_required');
      sessionStorage.removeItem('taemry_waiting_verification');
      sessionStorage.removeItem('taemry_pending_otp_email');
      localStorage.removeItem('taemry_pending_otp_email');
    } catch {}

    try {
      await logout();
    } catch {}

    onNavigate('login', 'signin');
  };

  return (
    <div
      id="otpVerificationContainer"
      className="min-h-[calc(100vh-3rem)] w-full flex flex-col items-center justify-center py-10 px-4 bg-[#faf8f5] dark:bg-[#07151a] text-[#112d35] dark:text-[#ecf3f4] select-none-touch"
    >
      {/* Brand Header Display */}
      <div className="mb-6 flex flex-col items-center select-none pointer-events-none">
        <div className="flex flex-col items-center gap-2 cursor-default">
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

      {/* Main OTP Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        id="otp-verification-card"
        className="w-full max-w-md bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#0c5963]/5 border border-[#e4ded2] dark:border-[#1e3a44] text-center"
      >
        {/* Visual Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#eef7f6] dark:bg-[#0d2a33] border border-[#cbe4e1] dark:border-[#174655] flex items-center justify-center mb-5 relative">
          <Mail className="w-8 h-8 text-[#0c5963] dark:text-[#38bdf8]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a1b22] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0a3a46] dark:text-white mb-2">
          Email OTP Verification
        </h1>

        <p className="text-xs sm:text-sm text-[#527077] dark:text-[#8ba7af] mb-3 leading-relaxed">
          Please enter the 6-digit verification code sent to your email:
        </p>

        {/* Highlighted Email Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4efe6] dark:bg-[#0c222a] border border-[#e4ded2] dark:border-[#193d48] text-xs font-mono font-semibold text-[#0c5963] dark:text-[#38bdf8] mb-6 max-w-full truncate">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{email || 'your email'}</span>
        </div>

        {/* 6-Digit OTP Input Boxes */}
        <div
          id="otp-input-group"
          className="flex items-center justify-center gap-2 sm:gap-2.5 mb-6"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={loading || success}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl border transition-all outline-none ${
                digit
                  ? 'border-[#0c5963] dark:border-[#38bdf8] bg-[#f0fbf9] dark:bg-[#0c2830] text-[#0a3a46] dark:text-white ring-2 ring-[#0c5963]/20 dark:ring-[#38bdf8]/20'
                  : 'border-[#ded7ca] dark:border-[#1e3e48] bg-white dark:bg-[#091d24] text-[#112d35] dark:text-white focus:border-[#0c5963] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0c5963]/20'
              }`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div
                id="otp-error-banner"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-left flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                    {error}
                  </p>
                  <button
                    type="button"
                    id="btn-otp-error-ok"
                    onClick={() => setError('')}
                    className="mt-2 text-[11px] font-bold text-rose-800 dark:text-rose-200 underline hover:no-underline cursor-pointer"
                  >
                    Dismiss & Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Banner */}
        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Email verified successfully! Redirecting to TAEMRY FLUX...
            </span>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="button"
          id="btn-verify-otp-submit"
          disabled={loading || success || otp.join('').length < 6}
          onClick={() => handleVerify()}
          className="w-full h-12 rounded-xl bg-[#0c5963] hover:bg-[#0a4952] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md shadow-[#0c5963]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend Code Section */}
        <div className="mt-6 pt-5 border-t border-[#f0ebe0] dark:border-[#14323c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#69848b] dark:text-[#7f9da5]">
            Didn't receive code?
          </span>

          {canResend ? (
            <button
              type="button"
              id="btn-otp-resend"
              disabled={resendLoading}
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-bold text-[#0c5963] dark:text-[#38bdf8] hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              <span>{resendLoading ? 'Sending...' : 'Resend Code'}</span>
            </button>
          ) : (
            <span className="font-mono font-medium text-[#849fa6] dark:text-[#607d86]">
              Resend in {String(Math.floor(timer / 60)).padStart(2, '0')}:
              {String(timer % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Change Account / Sign Out option */}
        <div className="mt-4 text-center">
          <button
            type="button"
            id="btn-otp-switch-account"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 text-xs text-[#78939a] dark:text-[#88a5ad] hover:text-[#0c5963] dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Wrong email? Sign in with another account</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
