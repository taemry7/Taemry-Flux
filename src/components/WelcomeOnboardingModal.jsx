import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, User, ShieldCheck, Zap } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

/**
 * 3D Welcome Splash & Full Name Onboarding Flow for New Users
 * Features a dynamic 3D perspective card, particle lighting, and step-by-step name setup powered by motion/react.
 */
export default function WelcomeOnboardingModal({ isOpen, onComplete }) {
  const { currentUser, updateUserProfile } = useAuth();
  const [step, setStep] = useState(1); // 1 = 3D Welcome Splash, 2 = Enter Full Name, 3 = Finalizing
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = React.useRef(false);
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setStep(1);
        // Pre-fill if currentUser already has a default name
        if (currentUser?.displayName && currentUser.displayName !== 'Member') {
          setFullName(currentUser.displayName);
        }
      }
    } else {
      hasInitializedRef.current = false;
      isSubmittingRef.current = false;
    }
  }, [isOpen]); // NEVER depend on currentUser here to prevent step being reset back to 1 on profile update

  const handleProceedToName = () => {
    setStep(2);
  };

  const handleSubmitName = async (e) => {
    e?.preventDefault();
    if (isSubmittingRef.current) return;

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Please enter your full name to personalize your account.');
      return;
    }
    if (cleanName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    // Pre-emptively remove session flag to guarantee no double-triggering
    try {
      sessionStorage.removeItem('taemry_show_new_user_welcome');
    } catch {}

    try {
      await updateUserProfile({ displayName: cleanName });
    } catch (err) {
      console.warn('Profile update notice during onboarding:', err);
    }

    // Advance directly to step 3 (Celebration) and then finish
    setStep(3);
    setTimeout(() => {
      setLoading(false);
      isSubmittingRef.current = false;
      onComplete();
    }, 1200);
  };

  const getInitials = (name) => {
    if (!name) return 'TF';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop Blur and Dimming */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* 3D Perspective Card Container */}
          <div className="relative w-full max-w-md perspective-[1200px] z-10">
            {/* Ambient Glow behind card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute -inset-1 bg-gradient-to-r from-[#0c5963] via-[#10b981] to-[#e89b27] rounded-3xl blur-xl"
            />

            {/* Main 3D Card with Spring Entrance */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.82,
                y: 50,
                rotateX: 18,
                rotateY: -6,
                transformPerspective: 1200
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                transformPerspective: 1200
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 30,
                rotateX: 12,
                transformPerspective: 1200
              }}
              transition={{
                type: 'spring',
                damping: 24,
                stiffness: 260,
                mass: 0.85
              }}
              className="relative bg-[#faf8f5] dark:bg-[#081d24] border border-[#ded7ca] dark:border-[#193e4b] rounded-3xl shadow-2xl p-7 sm:p-9 text-[#112d35] dark:text-white overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Subtle 3D Grid Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#0c5963_1px,transparent_1px)] dark:bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

              <AnimatePresence mode="wait">
                {/* ================= STEP 1: 3D WELCOME SPLASH ================= */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.96 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Floating 3D Badge Emblem */}
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: -3 }}
                      transition={{
                        type: 'spring',
                        damping: 18,
                        stiffness: 220,
                        delay: 0.1
                      }}
                      whileHover={{ rotate: 0, scale: 1.05 }}
                      className="relative mb-6 cursor-pointer"
                    >
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#09353e] via-[#0c5963] to-[#134032] p-1 shadow-xl shadow-[#0c5963]/30 flex items-center justify-center">
                        <div className="w-full h-full rounded-[22px] bg-[#faf8f5] dark:bg-[#07161b] flex items-center justify-center">
                          <Logo size="lg" showText={false} />
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.35, type: 'spring' }}
                        className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-1.5 rounded-xl shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    </motion.div>

                    {/* Status Pill */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3 tracking-wide"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ACCOUNT CREATED SUCCESSFULLY</span>
                    </motion.div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09353e] dark:text-white mb-2 leading-tight">
                      Welcome to <span className="text-[#0c5963] dark:text-[#38bdf8]">TAEMRY</span> <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#ea580c]">FLUX</span>
                    </h2>

                    <p className="text-sm text-[#5a7378] dark:text-[#94a3b8] mb-6 leading-relaxed max-w-sm">
                      Your high-performance workspace has been provisioned with bank-grade encryption and real-time wallet tracking.
                    </p>

                    {/* Quick Perks */}
                    <div className="w-full bg-[#f2ede2] dark:bg-[#0d2731] border border-[#e5dfd2] dark:border-[#163844] rounded-2xl p-4 mb-6 text-left space-y-2.5">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-[#324b50] dark:text-[#cbd5e1]">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Daily ad views & commission synchronization</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-[#324b50] dark:text-[#cbd5e1]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Instant access to deposits & advertising contracts</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      id="btn-welcome-next"
                      onClick={handleProceedToName}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0c5963] hover:bg-[#094750] text-white font-bold text-sm shadow-md shadow-[#0c5963]/25 transition-all cursor-pointer"
                    >
                      <span>Continue Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ================= STEP 2: ENTER FULL NAME ================= */}
                {step === 2 && (
                  <motion.form
                    key="step-2"
                    initial={{ opacity: 0, x: 25, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -25, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    onSubmit={handleSubmitName}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Live 3D Avatar Preview */}
                    <motion.div
                      initial={{ scale: 0.8, rotateY: 90 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 240 }}
                      className="relative mb-5"
                    >
                      <div className="w-20 h-20 rounded-full bg-[#e89b27] text-white border-2 border-white dark:border-[#1d4553] shadow-lg flex items-center justify-center font-extrabold text-2xl tracking-wider transform hover:scale-105 transition-transform">
                        {getInitials(fullName)}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-[#0c5963] text-white p-1 rounded-full border border-white dark:border-[#07161b]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    </motion.div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#09353e] dark:text-white mb-1.5">
                      What is your Full Name?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a7378] dark:text-[#94a3b8] mb-5 max-w-xs">
                      Enter your name to personalize your profile and generate your verified citizen badge.
                    </p>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold text-left"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="w-full mb-5 text-left">
                      <label className="block text-xs font-bold text-[#324b50] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        id="input-onboarding-fullname"
                        type="text"
                        required
                        autoFocus
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Taimur Khan"
                        className="w-full px-4 py-3 text-sm bg-white dark:bg-[#07171d] border border-[#dcd6c9] dark:border-[#1a3d4a] rounded-xl focus:border-[#0c5963] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0c5963]/15 focus:outline-none transition-all text-[#09353e] dark:text-white placeholder-[#9caea7]"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      id="btn-onboarding-submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0c5963] hover:bg-[#094750] text-white font-bold text-sm shadow-md shadow-[#0c5963]/25 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <span>Launch My Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.form>
                )}

                {/* ================= STEP 3: FINALIZING CELEBRATION ================= */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                      className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 className="w-9 h-9" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#09353e] dark:text-white mb-1">
                      Account Ready!
                    </h3>
                    <p className="text-xs text-[#5a7378] dark:text-[#94a3b8]">
                      Welcome aboard, <strong className="text-[#0c5963] dark:text-white">{fullName}</strong>. Opening your dashboard...
                    </p>
                    <div className="mt-5 w-32 h-1.5 bg-gray-200 dark:bg-[#12313b] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
