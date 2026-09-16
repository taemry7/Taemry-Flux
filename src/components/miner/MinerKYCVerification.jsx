import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Send,
  Award,
  ArrowRight
} from 'lucide-react';
import { playMiningTruthSound } from '../../utils/audio';

export default function MinerKYCVerification({ minerState, setMinerState, onSelectTab }) {
  // Step 1: Face Liveness Check state
  const [faceCheckState, setFaceCheckState] = useState('idle'); // 'idle' | 'scanning' | 'verified'

  // Step 2: Social verification
  const [socialHandle, setSocialHandle] = useState('');
  const [socialVerified, setSocialVerified] = useState(false);

  // Step 3: Quiz questions
  const [quizAnswers, setQuizAnswers] = useState({ q1: null, q2: null, q3: null });
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const handleStartFaceScan = () => {
    setFaceCheckState('scanning');
    setTimeout(() => {
      playMiningTruthSound();
      setFaceCheckState('verified');
    }, 2400);
  };

  const handleVerifySocial = (e) => {
    e.preventDefault();
    if (!socialHandle.trim()) return;
    playMiningTruthSound();
    setSocialVerified(true);
  };

  const handleSelectAnswer = (qKey, optionIdx) => {
    if (quizSubmitted && quizPassed) return;
    setQuizAnswers((prev) => ({ ...prev, [qKey]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    // Correct answers: Q1: 0 (24 hours), Q2: 0 (25%), Q3: 0 (Days-Off System)
    const isQ1Correct = quizAnswers.q1 === 0;
    const isQ2Correct = quizAnswers.q2 === 0;
    const isQ3Correct = quizAnswers.q3 === 0;

    setQuizSubmitted(true);

    if (isQ1Correct && isQ2Correct && isQ3Correct) {
      playMiningTruthSound();
      setQuizPassed(true);
      setMinerState((prev) => ({
        ...prev,
        minedYield: parseFloat((prev.minedYield + 1000).toFixed(2)),
      }));
    } else {
      setQuizPassed(false);
    }
  };

  const isAllKycComplete = faceCheckState === 'verified' && socialVerified && quizPassed;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                6. Multi-Step KYC & Knowledge Quiz
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#047857]/40">
                BOT-PROOF VERIFICATION
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Multi-tiered identity verification eliminating sybil bot attacks and testing consensus knowledge.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              isAllKycComplete
                ? 'bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#047857]/40'
                : 'bg-[#faf8f5] dark:bg-[#07151a] text-[#718589] dark:text-[#94a3b8] border-[#e4ded2] dark:border-[#173740]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAllKycComplete ? 'KYC Level 2 Verified' : 'KYC Pending Verification'}</span>
          </span>
        </div>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Step 1: 3D Face Liveness Check */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
                Step 1 of 3
              </span>
              {faceCheckState === 'verified' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
              3D AI Face Liveness Scan
            </h3>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              Biometric check confirming a live, unique human operator behind the node without storing private photos.
            </p>

            {/* Camera Viewport Simulation */}
            <div className="my-4 h-36 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex flex-col items-center justify-center p-3 relative overflow-hidden">
              {faceCheckState === 'scanning' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-20 rounded-full border-2 border-[#0c5963] dark:border-[#38bdf8] border-dashed animate-pulse flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#0c5963] dark:text-[#38bdf8]" />
                  </div>
                  <span className="text-[11px] font-mono text-[#0c5963] dark:text-[#38bdf8]">
                    Scanning Face Oval...
                  </span>
                </div>
              ) : faceCheckState === 'verified' ? (
                <div className="flex flex-col items-center gap-2 text-[#065f46] dark:text-[#6ee7b7]">
                  <CheckCircle2 className="w-10 h-10" />
                  <span className="text-xs font-bold">Biometric Liveness Confirmed!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#718589] dark:text-[#94a3b8]">
                  <Camera className="w-8 h-8 opacity-60" />
                  <span className="text-[11px] text-center">
                    Camera access ready for face verification
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStartFaceScan}
            disabled={faceCheckState === 'scanning' || faceCheckState === 'verified'}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              faceCheckState === 'verified'
                ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] cursor-default'
                : 'bg-[#0c5963] hover:bg-[#08424b] text-white shadow-xs'
            }`}
          >
            {faceCheckState === 'verified' ? 'Face Verified' : faceCheckState === 'scanning' ? 'Verifying...' : 'Start Liveness Scan'}
          </button>
        </div>

        {/* Step 2: Social Handle Verification */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
                Step 2 of 3
              </span>
              {socialVerified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Linked
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
              Social Community Link
            </h3>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              Link your X (Twitter) or Telegram username to stay notified of upcoming hard-fork updates and snapshot epochs.
            </p>

            <form onSubmit={handleVerifySocial} className="my-4 space-y-2">
              <input
                type="text"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                placeholder="@username (X / Telegram)"
                disabled={socialVerified}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] text-[#09353e] dark:text-white outline-hidden"
              />
              <span className="text-[10px] text-[#718589] dark:text-[#94a3b8] block">
                Official handles: @taemryflux
              </span>
            </form>
          </div>

          <button
            onClick={handleVerifySocial}
            disabled={socialVerified || !socialHandle.trim()}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              socialVerified
                ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] cursor-default'
                : 'bg-[#0c5963] hover:bg-[#08424b] text-white shadow-xs'
            }`}
          >
            {socialVerified ? 'Social Verified' : 'Verify Handle'}
          </button>
        </div>

        {/* Step 3: Whitepaper Knowledge Quiz */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
                Step 3 of 3
              </span>
              {quizPassed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Passed (+1,000 TFLX)
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
              Consensus Knowledge Quiz
            </h3>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-1 leading-relaxed">
              Answer 3 core questions about the Whitepaper rules to unlock KYC Level 2 and claim +1,000 TFLX.
            </p>

            <div className="my-3 space-y-3 text-xs max-h-48 overflow-y-auto pr-1">
              {/* Q1 */}
              <div className="space-y-1">
                <span className="font-bold text-[#09353e] dark:text-white">
                  1. How often must you tap the miner?
                </span>
                <div className="flex gap-2">
                  {['12-24h', '1 week'].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer('q1', i)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                        quizAnswers.q1 === i
                          ? 'bg-[#0c5963] text-white border-[#0c5963]'
                          : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#ece6d9] text-[#718589]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-1">
                <span className="font-bold text-[#09353e] dark:text-white">
                  2. What is the Tier 1 referral bonus?
                </span>
                <div className="flex gap-2">
                  {['25%', '10%'].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer('q2', i)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                        quizAnswers.q2 === i
                          ? 'bg-[#0c5963] text-white border-[#0c5963]'
                          : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#ece6d9] text-[#718589]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="space-y-1">
                <span className="font-bold text-[#09353e] dark:text-white">
                  3. What protects against inactivity?
                </span>
                <div className="flex gap-2">
                  {['Days-Off', 'Cash'].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer('q3', i)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                        quizAnswers.q3 === i
                          ? 'bg-[#0c5963] text-white border-[#0c5963]'
                          : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#ece6d9] text-[#718589]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={quizPassed || quizAnswers.q1 === null || quizAnswers.q2 === null || quizAnswers.q3 === null}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              quizPassed
                ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] cursor-default'
                : 'bg-[#0c5963] hover:bg-[#08424b] text-white shadow-xs'
            }`}
          >
            {quizPassed ? 'Quiz Passed (+1,000 TFLX)' : 'Submit Quiz Answers'}
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {isAllKycComplete && (
        <div className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#064e3b]/30 border border-[#a7f3d0] dark:border-[#047857]/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#065f46] dark:text-[#6ee7b7]">
            <Award className="w-5 h-5" />
            <span className="font-bold">
              Congratulations! Your node is fully KYC Level 2 Verified and eligible for 2027 Mainnet token delivery!
            </span>
          </div>
          <button
            onClick={() => onSelectTab && onSelectTab('all')}
            className="px-3 py-1.5 rounded-xl bg-[#065f46] text-white font-bold cursor-pointer shrink-0"
          >
            Return to Overview
          </button>
        </div>
      )}
    </div>
  );
}
