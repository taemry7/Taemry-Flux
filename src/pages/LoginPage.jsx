import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../firebase/firebase.config';

export default function LoginPage({ onNavigate }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const { login, signup, loginWithGoogle, resetPassword, demoLogin, isFirebaseConfigured } = useAuth();

  // Handle Form Submission (Sign in or Sign up)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onNavigate('dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      // Friendly message
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (msg.includes('email-already-in-use')) {
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
      onNavigate('dashboard');
    } catch (err) {
      console.error('Google Sign In failed:', err);
      setError(err.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setError('');
    try {
      await resetPassword(forgotEmail);
      setResetSent(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSent(false);
      }, 3000);
    } catch (err) {
      setError('Unable to send password reset email. Check email address.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 bg-[#faf8f5]">
      {/* Brand Icon Header */}
      <div className="mb-6 flex flex-col items-center">
        <button
          onClick={() => onNavigate('home')}
          className="focus:outline-none transition-transform hover:scale-105"
        >
          <Logo size="lg" showText={false} />
        </button>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-display font-extrabold tracking-[0.25em] text-[#0a3a46] text-lg uppercase">
            TAEMRY
          </span>
          <span className="text-xs tracking-[0.2em] font-bold text-[#0f766e] uppercase bg-[#e6f4f1] px-2 py-0.5 rounded">
            FLUX
          </span>
        </div>
      </div>

      {/* Main Auth Card (Matches the video) */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-lg shadow-[#0c5963]/5 border border-[#e4ded2]">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#09353e]">
            {isSignUp ? 'Create your TAEMRY space' : 'Welcome back'}
          </h2>
          <p className="text-xs sm:text-sm text-[#61777b] mt-1">
            {isSignUp
              ? 'Start making progress visible'
              : 'Sign in to your TAEMRY space'}
          </p>
        </div>

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
          </div>
        )}

        {/* "Continue with Google" Button */}
        <button
          id="btn-google-auth"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#faf8f5] active:bg-[#f3eee5] text-[#133842] text-sm font-semibold rounded-2xl border border-[#d8d2c4] shadow-xs transition-all cursor-pointer disabled:opacity-60"
        >
          {/* Google Color G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
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
              <label className="block text-xs font-semibold text-[#324f55] mb-1.5">
                Full Name
              </label>
              <input
                id="input-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Taimur Khan"
                className="w-full px-4 py-3 text-sm bg-[#faf8f5] border border-[#dcd6c9] rounded-xl focus:bg-white focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] placeholder-[#9caea7]"
              />
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
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#0c5963] hover:text-[#083a41] transition-colors"
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
                placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
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
                <span>{isSignUp ? 'Create account' : 'Continue'}</span>
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
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
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
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="font-bold text-[#0c5963] hover:underline"
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        {/* Firebase Live Status & Fast Access */}
        <div className="mt-6 pt-5 border-t border-[#eee9df]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0f766e] flex items-center gap-1.5 bg-[#e6f4f1] px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Firebase Connected ({firebaseConfig.projectId || 'taemry-flux'})
            </span>
            <button
              type="button"
              onClick={() => {
                demoLogin('mistrtaimoor@gmail.com');
                onNavigate('dashboard');
              }}
              className="text-[11px] font-bold text-[#0c5963] hover:text-[#07363c] bg-[#f1ede4] hover:bg-[#e4ded2] px-2.5 py-1 rounded-lg transition-colors"
              title="Quick demo preview login"
            >
              Quick Preview Login
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#ded8cb] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#09353e] mb-1">Reset Password</h3>
            <p className="text-xs text-[#5a7075] mb-4">
              Enter your email address and we will send you a password reset link.
            </p>

            {resetSent ? (
              <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-xs text-[#166534] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Reset link sent! Please check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#faf8f5] border border-[#d8d1c3] rounded-xl focus:outline-none focus:border-[#0c5963]"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#5a7075] hover:bg-[#f1ede4] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-[#0c5963] text-white rounded-lg hover:bg-[#09424a]"
                  >
                    Send Reset Link
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
