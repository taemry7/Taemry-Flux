/**
 * TAEMRY FLUX - Watch Ads Module (Phase 3)
 * Provides 60-second timed ad streaming, server-verified rewards (0.1% package rate),
 * daily 200 ad limits, cooldown prevention, and live balance updating.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PlaySquare,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  PackageCheck,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../config/milestones.config';

export default function WatchAds({ onSelectTab, onNavigate }) {
  const { userStats, updateLocalStats, fetchUserStats } = useAuth();

  // Component state
  const [adStatus, setAdStatus] = useState({
    isEligible: true,
    currentPackage: userStats?.currentPackage || 'Bronze',
    packagePrice: 25.00,
    rewardPerAd: 0.025,
    dailyAdCount: userStats?.dailyAdCount || 45,
    dailyLimit: 200,
    lifetimeAds: userStats?.lifetimeAds || 1200,
    cooldownRemaining: 0,
  });

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [totalTimerDuration, setTotalTimerDuration] = useState(60);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [recentReward, setRecentReward] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  // Sample curated sponsors for visual variety
  const SPONSOR_ADS = [
    {
      title: 'Solstice Cloud AI',
      sponsor: 'Solstice Intelligence Group',
      tagline: 'Autonomous AI infrastructure built for high-concurrency cloud workloads.',
      accent: 'from-[#0c5963] to-[#062c33]',
      chip: 'Featured Partner',
    },
    {
      title: 'Aura Protocol',
      sponsor: 'Aura Decentralized Ledger',
      tagline: 'Sub-second finality smart contracts with institutional security guarantees.',
      accent: 'from-[#1e3a8a] to-[#0f172a]',
      chip: 'Web3 & FinTech',
    },
    {
      title: 'Apex Vantage Hardware',
      sponsor: 'Vantage Silicon Inc.',
      tagline: 'Next-generation optical computing nodes with ultra-low thermal dissipation.',
      accent: 'from-[#14532d] to-[#052e16]',
      chip: 'Computing',
    },
    {
      title: 'Zenith Quantitative Capital',
      sponsor: 'Zenith Algorithmic Global',
      tagline: 'Real-time high-velocity algorithmic liquidity and cross-border settlement.',
      accent: 'from-[#78350f] to-[#451a03]',
      chip: 'Institutional Liquidity',
    }
  ];

  // Fetch initial ad status from backend
  const fetchAdStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ads/status');
      if (res.data?.success) {
        setAdStatus(res.data);
        if (res.data.cooldownRemaining > 0) {
          setCooldownSeconds(res.data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.warn('Failed to load ad status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdStatus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    let interval = null;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Active Ad Stream Countdown Timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timerSeconds === 0) {
      // Completed timer -> Submit view reward automatically
      setIsPlaying(false);
      handleCompleteAd();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timerSeconds]);

  // Submit Ad Watch Reward to Server
  const handleCompleteAd = async () => {
    try {
      setErrorMessage('');
      const res = await apiClient.post('/ads/watch', {
        adId: `ad_${activeAdIndex}_${Date.now()}`,
      });

      if (res.data?.success) {
        const rewardAmount = res.data.reward;
        const newBalance = res.data.newBalance;
        const newLifetimeAds = res.data.lifetimeAds;
        const newDailyCount = res.data.dailyAdCount;

        // Show celebratory toast
        setRecentReward({
          amount: rewardAmount,
          lifetimeAds: newLifetimeAds,
          dailyCount: newDailyCount,
        });

        // Set 60s cooldown prevention
        setCooldownSeconds(60);

        // Update local stats in AuthContext immediately
        updateLocalStats({
          walletBalance: newBalance,
          lifetimeAds: newLifetimeAds,
          dailyAdCount: newDailyCount,
        });

        // Update component status
        setAdStatus((prev) => ({
          ...prev,
          dailyAdCount: newDailyCount,
          lifetimeAds: newLifetimeAds,
        }));

        // Reset timer for next watch
        setTimerSeconds(totalTimerDuration);

        // Advance to next sponsor ad
        setActiveAdIndex((prev) => (prev + 1) % SPONSOR_ADS.length);

        // Background refetch user stats
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error completing ad view:', err);
      const errorMsg = err.response?.data?.message || 'Failed to claim ad reward. Please try again.';
      setErrorMessage(errorMsg);
      if (err.response?.data?.remainingSeconds) {
        setCooldownSeconds(err.response.data.remainingSeconds);
      }
      setTimerSeconds(totalTimerDuration);
    }
  };

  // Start or resume the ad stream
  const handleStartStream = () => {
    if (cooldownSeconds > 0) return;
    if (adStatus.dailyAdCount >= adStatus.dailyLimit) {
      setErrorMessage('Daily limit reached (200/200). Resets tomorrow.');
      return;
    }
    setErrorMessage('');
    setRecentReward(null);
    setIsPlaying(true);
  };

  const handlePauseStream = () => {
    setIsPlaying(false);
  };

  const handleResetStream = () => {
    setIsPlaying(false);
    setTimerSeconds(totalTimerDuration);
  };

  const currentSponsor = SPONSOR_ADS[activeAdIndex];
  const progressRatio = ((totalTimerDuration - timerSeconds) / totalTimerDuration) * 100;
  const dailyProgressRatio = Math.min(100, Math.round((adStatus.dailyAdCount / adStatus.dailyLimit) * 100));

  // If user has no package or is not eligible
  if (!adStatus.isEligible && !adStatus.currentPackage) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e4ded2] shadow-xs text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#fef3c7] text-[#ca8a04] flex items-center justify-center mx-auto mb-5 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ca8a04] bg-[#fef3c7] px-3.5 py-1 rounded-full border border-[#fde047]">
          Package Activation Required
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09353e] mt-4 mb-2">
          Buy a package to start watching ads!
        </h2>
        <p className="text-sm text-[#546b70] leading-relaxed max-w-md mx-auto mb-8">
          Ad view rewards are mathematically linked to your active tier. Secure a Bronze, Silver, or Gold tier to unlock 200 daily ad views and begin earning 0.1% view distributions today.
        </p>
        <button
          onClick={() => (onSelectTab ? onSelectTab('buy-package') : onNavigate && onNavigate('dashboard'))}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c5963] hover:bg-[#08424b] text-white text-sm font-bold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all cursor-pointer"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Browse Available Packages</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Ad Watching Engine
            </span>
            <span className="text-xs font-semibold text-[#5a7277]">
              Tier: <strong className="text-[#09353e]">{adStatus.currentPackage}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Timed Daily Ads & Stream Player
          </h1>
        </div>

        {/* Quick Testing helper: toggle duration */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-[#718589] font-medium">Timer Mode:</span>
          <button
            onClick={() => {
              setTotalTimerDuration(60);
              setTimerSeconds(60);
              setIsPlaying(false);
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              totalTimerDuration === 60
                ? 'bg-[#0c5963] text-white'
                : 'bg-white text-[#526d72] border border-[#e4ded2]'
            }`}
          >
            Standard 60s
          </button>
          <button
            onClick={() => {
              setTotalTimerDuration(10);
              setTimerSeconds(10);
              setIsPlaying(false);
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              totalTimerDuration === 10
                ? 'bg-[#e89b27] text-white'
                : 'bg-white text-[#526d72] border border-[#e4ded2]'
            }`}
            title="Fast 10-second timer for rapid UI & API testing"
          >
            Fast 10s (Test)
          </button>
        </div>
      </div>

      {/* ERROR TOAST */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUCCESS CELEBRATORY BANNER */}
      {recentReward && (
        <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base text-[#064e3b]">
                Earned +${Number(recentReward.amount).toFixed(3)}!
              </p>
              <p className="text-xs text-[#047857]">
                Ad view verified by server. Credited directly to your active wallet balance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold bg-[#d1fae5] px-3 py-1.5 rounded-xl text-[#065f46]">
              Lifetime: {formatNumber(recentReward.lifetimeAds)} ads
            </span>
          </div>
        </div>
      )}

      {/* TOP METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Today's Ads Progress */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Daily Views
            </span>
            <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2 py-0.5 rounded-full">
              {adStatus.dailyLimit - adStatus.dailyAdCount} Left
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#09353e]">
              {adStatus.dailyAdCount}
            </span>
            <span className="text-xs font-bold text-[#627a7f]">
              / {adStatus.dailyLimit} max
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full h-2.5 bg-[#f0ece3] rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#0c5963] to-[#15808d] rounded-full transition-all duration-500"
              style={{ width: `${dailyProgressRatio}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Lifetime Ads */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Lifetime Views
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#e89b27]" />
          </div>
          <p className="text-2xl font-black text-[#09353e]">
            {formatNumber(adStatus.lifetimeAds)}
          </p>
          <p className="text-xs text-[#627a7f] mt-1">
            Qualifies for Personal Milestone bonuses
          </p>
        </div>

        {/* Metric 3: Reward Rate per Ad */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Reward Per Ad (0.1%)
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#0c5963]" />
          </div>
          <p className="text-2xl font-black text-[#0c5963]">
            ${Number(adStatus.rewardPerAd).toFixed(3)}
          </p>
          <p className="text-xs text-[#627a7f] mt-1">
            {adStatus.currentPackage} tier (${adStatus.packagePrice})
          </p>
        </div>
      </div>

      {/* AD STREAM PLAYER BOX */}
      <div className="bg-white rounded-3xl border border-[#e4ded2] shadow-xs overflow-hidden">
        {/* Stream Player Viewport (Cinema Mode) */}
        <div className={`relative w-full aspect-video sm:aspect-21/9 bg-linear-to-br ${currentSponsor.accent} p-6 sm:p-10 flex flex-col justify-between text-white overflow-hidden shadow-inner`}>
          {/* Animated Background Mesh / Scanlines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Info Bar inside Player */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] border border-white/10 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#22c55e] animate-pulse' : 'bg-[#eab308]'}`} />
                {isPlaying ? 'STREAMING AD' : 'STANDBY'}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-black/30 backdrop-blur-md text-[10px] font-semibold text-white/80 border border-white/10">
                {currentSponsor.chip}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Brand Display */}
          <div className="relative z-10 text-center max-w-xl mx-auto my-auto py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-lg">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-[#e89b27]" />
            </div>
            <h3 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              {currentSponsor.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1 line-clamp-2 max-w-md mx-auto">
              {currentSponsor.tagline}
            </p>
            <span className="text-[10px] text-white/60 tracking-wider uppercase block mt-2">
              Sponsored by {currentSponsor.sponsor}
            </span>
          </div>

          {/* Bottom Stream Progress inside Player */}
          <div className="relative z-10 flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-white/90">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Timer Countdown:</span>
              </div>
              <span className="text-sm font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                {timerSeconds}s / {totalTimerDuration}s
              </span>
            </div>

            {/* Video progress track */}
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
              <div
                className="h-full bg-linear-to-r from-[#38bdf8] to-[#22c55e] transition-all duration-300 rounded-full"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="p-5 sm:p-6 bg-[#faf8f5] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e8e2d5]">
          {/* Status notes on cooldown / completion */}
          <div className="flex items-center gap-3 text-xs">
            {cooldownSeconds > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fef3c7] text-[#92400e] border border-[#fde68a] font-semibold">
                <Clock className="w-4 h-4 animate-spin text-[#d97706]" />
                <span>Cooldown active: Please wait <strong>{cooldownSeconds}s</strong> before next ad</span>
              </div>
            ) : adStatus.dailyAdCount >= adStatus.dailyLimit ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>200/200 views completed today. Reset takes place tomorrow.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#566e73]">
                <ShieldCheck className="w-4 h-4 text-[#0c5963]" />
                <span>Verified Anti-Cheat: Requires full stream duration to credit reward.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {isPlaying ? (
              <button
                id="btn-pause-ad"
                onClick={handlePauseStream}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#eae3d5] text-[#09353e] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-all cursor-pointer shadow-xs"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                id="btn-watch-ad"
                onClick={handleStartStream}
                disabled={cooldownSeconds > 0 || adStatus.dailyAdCount >= adStatus.dailyLimit}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer ${
                  cooldownSeconds > 0 || adStatus.dailyAdCount >= adStatus.dailyLimit
                    ? 'bg-[#d5dedf] text-[#718589] cursor-not-allowed shadow-none'
                    : 'bg-[#0c5963] hover:bg-[#08424b] text-white shadow-[#0c5963]/25 active:scale-[0.98]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {cooldownSeconds > 0
                    ? `Cooldown (${cooldownSeconds}s)`
                    : timerSeconds < totalTimerDuration
                    ? `Resume Ad (${timerSeconds}s left)`
                    : 'Watch Ad (60s)'}
                </span>
              </button>
            )}

            {timerSeconds < totalTimerDuration && !isPlaying && (
              <button
                onClick={handleResetStream}
                className="p-2.5 bg-white hover:bg-[#eae3d5] text-[#566e73] rounded-xl border border-[#d8d1c3] transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HOW AD REWARDS WORK EXPLAINER */}
      <div className="p-6 rounded-3xl bg-[#f5f1e8] border border-[#e4ded2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#0c5963]">
            Rule Engine & Distribution Architecture
          </h4>
          <p className="text-xs text-[#526d72] max-w-2xl leading-relaxed">
            Every completed view awards <strong>0.1%</strong> of your package tier directly to your wallet balance. Simultaneously, the system evaluates your 5-level upline structure to deliver <strong>50% commission</strong> ($0.05%) to active sponsors, while incrementing global <strong>Team Ads</strong> across unlimited depth.
          </p>
        </div>

        <button
          onClick={() => (onSelectTab ? onSelectTab('milestones') : onNavigate && onNavigate('dashboard'))}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#ede7dc] text-[#09353e] text-xs font-bold rounded-xl border border-[#d8d1c3] shadow-xs transition-all whitespace-nowrap self-end md:self-auto cursor-pointer"
        >
          <span>View Milestone Bonuses</span>
        </button>
      </div>
    </div>
  );
}
