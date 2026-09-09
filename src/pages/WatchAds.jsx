/**
 * TAEMRY FLUX - Watch Ads Module (Phase 3 & Phase 4 Update)
 * - Listing 1 to 200 Ads with complete tracking, status badges, and direct selection
 * - Cooldown completely removed per user instruction ("remove cooldown active fix it")
 * - 0.1% Package-linked rewards ($1 Bronze = $0.001, $5 Silver = $0.005, $10 Gold = $0.01, $100 Elite = $0.10, $500 Master = $0.50, $1000 Apex = $1.00)
 * - Seamless consecutive watching up to 200 ads daily.
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
  Maximize2,
  ListOrdered,
  Search,
  Check,
  ChevronRight,
  RefreshCw,
  Loader2,
  Layers
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../config/milestones.config';

const PACKAGE_PRICES = {
  bronze: 1.00,
  silver: 5.00,
  gold: 10.00,
  elite: 100.00,
  master: 500.00,
  apex: 1000.00,
};

export default function WatchAds({ onSelectTab, onNavigate }) {
  const { userStats, updateLocalStats, fetchUserStats } = useAuth();

  const pkgKey = (userStats?.currentPackage || 'Bronze').toLowerCase();
  const pkgPrice = PACKAGE_PRICES[pkgKey] || 1.00;
  const computedReward = +(pkgPrice * 0.001).toFixed(4);

  // Component state
  const [adStatus, setAdStatus] = useState({
    isEligible: true,
    currentPackage: userStats?.currentPackage || 'Bronze',
    packagePrice: pkgPrice,
    rewardPerAd: computedReward,
    dailyAdCount: userStats?.dailyAdCount || 0,
    dailyLimit: 200,
    lifetimeAds: userStats?.lifetimeAds || 0,
  });

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [totalTimerDuration, setTotalTimerDuration] = useState(60);
  const [isMuted, setIsMuted] = useState(true);
  const [recentReward, setRecentReward] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSelectedAdNumber, setCurrentSelectedAdNumber] = useState(1);

  // Listing 1 to 200 state
  const [adListFilter, setAdListFilter] = useState('all'); // 'all' | 'available' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [listingBatch, setListingBatch] = useState(1); // 1: 1-50, 2: 51-100, 3: 101-150, 4: 151-200
  const [adsCatalog, setAdsCatalog] = useState([]);

  // Curated sponsors rotating across 200 ads
  const SPONSORS = [
    { name: 'Solstice Cloud AI', category: 'Artificial Intelligence', tag: 'High Performance', desc: 'Autonomous AI infrastructure designed for massive concurrency.' },
    { name: 'Aura Protocol', category: 'Web3 & Fintech', tag: 'Instant Settlement', desc: 'Enterprise smart contracts and zero-knowledge ledger networks.' },
    { name: 'Apex Vantage Hardware', category: 'Computing', tag: 'Optical Chips', desc: 'Ultra-low latency silicon with extreme energy conservation.' },
    { name: 'Zenith Global Liquidity', category: 'Finance', tag: 'Cross-Border', desc: 'Real-time liquidity routing across institutional capital desks.' },
    { name: 'Quantum Core Networks', category: 'Telecom', tag: 'Low Latency', desc: 'Next-generation orbital mesh and edge-computing infrastructure.' },
    { name: 'Hyperion Energy Systems', category: 'Clean Tech', tag: 'Smart Grid', desc: 'Sustainable energy trading grids powered by decentralized telemetry.' },
    { name: 'CyberShield ZeroTrust', category: 'Cybersecurity', tag: 'Defense Grade', desc: 'Military-grade access tokenization and real-time perimeter protection.' },
    { name: 'Nexus Orbital Data', category: 'Space Tech', tag: 'Global Mesh', desc: 'LEO constellation sensor routing and high-throughput data relays.' },
  ];

  // Generate 1 to N Ads based on dynamic admin dailyLimit & timerSeconds
  const generate200Ads = (watchedCount, rewardRate, limit = 200, duration = 60) => {
    const list = [];
    const totalCount = limit || 200;
    for (let i = 1; i <= totalCount; i++) {
      const sp = SPONSORS[(i - 1) % SPONSORS.length];
      const isCompleted = i <= watchedCount;
      const isAvailable = i === watchedCount + 1;

      list.push({
        adNumber: i,
        id: `ad_${i}`,
        title: `${sp.name} #${i}`,
        sponsor: sp.name,
        category: sp.category,
        tag: sp.tag,
        desc: sp.desc,
        reward: rewardRate,
        durationSeconds: duration || 60,
        status: isCompleted ? 'completed' : isAvailable ? 'available' : 'queued',
        isWatched: isCompleted,
      });
    }
    return list;
  };

  // Fetch initial ad status from backend
  const fetchAdStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ads/status');
      if (res.data?.success) {
        setAdStatus(res.data);
        const watched = res.data.dailyAdCount || 0;
        const duration = res.data.timerSeconds || 60;
        const limit = res.data.dailyLimit || 200;

        setTimerSeconds(duration);
        setTotalTimerDuration(duration);
        setAdsCatalog(generate200Ads(watched, res.data.rewardPerAd || computedReward, limit, duration));
        setCurrentSelectedAdNumber(Math.min(limit, watched + 1));
      } else {
        const fallbackCount = userStats?.dailyAdCount || 0;
        setAdsCatalog(generate200Ads(fallbackCount, computedReward, 200, 60));
        setCurrentSelectedAdNumber(Math.min(200, fallbackCount + 1));
      }
    } catch (err) {
      console.warn('Failed to load ad status:', err.message);
      const fallbackCount = userStats?.dailyAdCount || 0;
      setAdsCatalog(generate200Ads(fallbackCount, computedReward, 200, 60));
      setCurrentSelectedAdNumber(Math.min(200, fallbackCount + 1));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdStatus();
  }, []);

  // Active Ad Stream Countdown Timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timerSeconds === 0) {
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
        adId: `ad_${currentSelectedAdNumber}_${Date.now()}`,
      });

      if (res.data?.success) {
        const rewardAmount = res.data.reward;
        const newBalance = res.data.newBalance;
        const newLifetimeAds = res.data.lifetimeAds;
        const newDailyCount = res.data.dailyAdCount;

        // Show celebratory confirmation
        setRecentReward({
          amount: rewardAmount,
          lifetimeAds: newLifetimeAds,
          dailyCount: newDailyCount,
          adNumber: currentSelectedAdNumber,
        });

        // Update local stats in AuthContext
        updateLocalStats({
          walletBalance: newBalance,
          lifetimeAds: newLifetimeAds,
          dailyAdCount: newDailyCount,
        });

        // Update ad status & catalog state
        setAdStatus((prev) => ({
          ...prev,
          dailyAdCount: newDailyCount,
          lifetimeAds: newLifetimeAds,
        }));

        const limit = adStatus.dailyLimit || 200;
        setAdsCatalog(generate200Ads(newDailyCount, adStatus.rewardPerAd, limit, totalTimerDuration));

        // Reset timer
        setTimerSeconds(totalTimerDuration);

        // Advance to next ad number automatically (smooth consecutive viewing!)
        if (newDailyCount < limit) {
          setCurrentSelectedAdNumber(newDailyCount + 1);
        }

        // Background refetch user stats
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error completing ad view:', err);
      const errorMsg = err.response?.data?.message || 'Failed to claim ad reward. Please try again.';
      setErrorMessage(errorMsg);
      setTimerSeconds(totalTimerDuration);
    }
  };

  // Start playing selected ad
  const handleStartStream = (adNum) => {
    const limit = adStatus.dailyLimit || 200;
    if (adStatus.dailyAdCount >= limit) {
      setErrorMessage(`Daily limit reached (${limit}/${limit}). Resets tomorrow.`);
      return;
    }

    if (adNum) {
      setCurrentSelectedAdNumber(adNum);
    }

    setErrorMessage('');
    setRecentReward(null);
    setTimerSeconds(totalTimerDuration);
    setIsPlaying(true);
  };

  const handlePauseStream = () => {
    setIsPlaying(false);
  };

  const handleResetStream = () => {
    setIsPlaying(false);
    setTimerSeconds(totalTimerDuration);
  };

  // Selected Ad details
  const activeAdInfo =
    adsCatalog.find((a) => a.adNumber === currentSelectedAdNumber) ||
    adsCatalog[0] || {
      adNumber: 1,
      title: 'Solstice Cloud AI #1',
      sponsor: 'Solstice Cloud AI',
      category: 'Artificial Intelligence',
      tag: 'High Performance',
      reward: computedReward,
    };

  const progressRatio = ((totalTimerDuration - timerSeconds) / totalTimerDuration) * 100;
  const dailyProgressRatio = Math.min(100, Math.round((adStatus.dailyAdCount / adStatus.dailyLimit) * 100));

  // Filter ads 1 to 200
  const filteredAds = adsCatalog.filter((ad) => {
    const matchesFilter =
      adListFilter === 'all' ||
      (adListFilter === 'available' && !ad.isWatched) ||
      (adListFilter === 'completed' && ad.isWatched);

    const matchesSearch =
      searchQuery === '' ||
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.adNumber.toString() === searchQuery.replace('#', '').trim();

    return matchesFilter && matchesSearch;
  });

  // Batch slicing (50 ads per batch or view all)
  const batchStart = (listingBatch - 1) * 50;
  const displayedAds = searchQuery
    ? filteredAds
    : filteredAds.slice(batchStart, batchStart + 50);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Ad Viewing Engine • Listing 1 to 200
            </span>
            <span className="text-xs font-semibold text-[#5a7277]">
              Tier: <strong className="text-[#09353e] uppercase">{adStatus.currentPackage}</strong> (Reward: <strong>${adStatus.rewardPerAd}/ad</strong>)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Daily Ad Stream (1 to 200 Ads)
          </h1>
        </div>

        {/* Timer Mode & Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-[#718589] font-medium">Stream Duration:</span>
          <button
            onClick={() => {
              setTotalTimerDuration(15);
              setTimerSeconds(15);
              setIsPlaying(false);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              totalTimerDuration === 15
                ? 'bg-[#0c5963] text-white shadow-xs'
                : 'bg-white text-[#526d72] border border-[#e4ded2]'
            }`}
          >
            15 Seconds (Standard)
          </button>
          <button
            onClick={() => {
              setTotalTimerDuration(5);
              setTimerSeconds(5);
              setIsPlaying(false);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              totalTimerDuration === 5
                ? 'bg-[#ca8a04] text-white shadow-xs'
                : 'bg-white text-[#526d72] border border-[#e4ded2]'
            }`}
            title="Fast 5-second mode for testing and fast completion"
          >
            5s (Fast)
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
        <div className="p-4 sm:p-5 rounded-3xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10b981] text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#064e3b]">
                Ad #{recentReward.adNumber} Completed! +${Number(recentReward.amount).toFixed(4)} USD Credited
              </h3>
              <p className="text-xs text-[#047857]">
                Progress: <strong>{recentReward.dailyCount} of 200</strong> completed today. Ready for Ad #{Math.min(200, recentReward.dailyCount + 1)}!
              </p>
            </div>
          </div>
          <button
            onClick={() => setRecentReward(null)}
            className="text-xs font-bold text-[#065f46] underline self-end sm:self-auto cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daily Progress */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589]">
              Daily Ad Counter
            </span>
            <span className="text-xs font-black text-[#0c5963]">
              {adStatus.dailyAdCount} / {adStatus.dailyLimit}
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#f0ebe0] rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#0c5963] to-[#14b8a6] rounded-full transition-all duration-500"
              style={{ width: `${dailyProgressRatio}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#718589]">
            <span>{200 - adStatus.dailyAdCount} ads remaining today</span>
            <span>{dailyProgressRatio}%</span>
          </div>
        </div>

        {/* Reward Per Ad */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589] block mb-1">
            Reward Per Ad (0.1%)
          </span>
          <p className="text-2xl font-black text-[#0c5963]">
            +${Number(adStatus.rewardPerAd).toFixed(4)} USD
          </p>
          <span className="text-[11px] text-[#718589]">
            Linked to your ${pkgPrice} {adStatus.currentPackage} tier
          </span>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589] block mb-1">
            Wallet Balance
          </span>
          <p className="text-2xl font-black text-[#09353e]">
            {formatCurrency(userStats?.walletBalance ?? 0)}
          </p>
          <span className="text-[11px] text-[#718589]">
            Lifetime Ads: {formatNumber(adStatus.lifetimeAds || 0)}
          </span>
        </div>
      </div>

      {/* Main Stream Player */}
      <div className="bg-[#112d35] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-[#1e4a55]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Ad Metadata & Sponsor Header */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0c5963] text-white text-xs font-black uppercase tracking-wider">
                Ad #{activeAdInfo.adNumber} of 200
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold">
                {activeAdInfo.category}
              </span>
              {activeAdInfo.isWatched && (
                <span className="px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#34d399] text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Completed</span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {activeAdInfo.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 mt-1 leading-relaxed">
                {activeAdInfo.desc || 'Premium sponsor showcase yielding instantaneous tier payouts.'}
              </p>
            </div>

            {/* Reward Preview Badge */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                  Payout on Completion
                </span>
                <p className="text-lg font-black text-[#38bdf8]">
                  +${Number(activeAdInfo.reward).toFixed(4)} USD
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/60 uppercase font-bold">Cooldown Status</span>
                <p className="text-xs font-bold text-[#4ade80]">
                  Cooldown Removed (Instant Watching)
                </p>
              </div>
            </div>

            {/* Play / Pause / Reset Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isPlaying ? (
                <button
                  onClick={() => handleStartStream(currentSelectedAdNumber)}
                  disabled={adStatus.dailyAdCount >= 200}
                  className="px-6 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-[#0ea5e9]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {timerSeconds === totalTimerDuration
                      ? `Watch Ad #${activeAdInfo.adNumber}`
                      : 'Resume Stream'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handlePauseStream}
                  className="px-6 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-[#f59e0b]/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Stream</span>
                </button>
              )}

              <button
                onClick={handleResetStream}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* Skip to Next Ad */}
              {currentSelectedAdNumber < 200 && (
                <button
                  onClick={() => {
                    handleResetStream();
                    setCurrentSelectedAdNumber((prev) => Math.min(200, prev + 1));
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Next Ad #{currentSelectedAdNumber + 1}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="w-full lg:w-1/2 flex flex-col items-center">
            <div className="w-full aspect-video bg-black/60 rounded-2xl border-2 border-white/20 overflow-hidden relative flex flex-col items-center justify-center p-6 shadow-inner">
              {/* Subtle visual simulation */}
              <div
                className={`absolute inset-0 bg-linear-to-br from-[#0c5963]/30 via-transparent to-[#0284c7]/20 transition-opacity ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
              />

              {/* Center Counter */}
              <div className="relative z-10 text-center space-y-2">
                <div className="w-20 h-20 rounded-full border-4 border-[#38bdf8] flex items-center justify-center mx-auto bg-black/40 shadow-lg backdrop-blur-xs">
                  <span className="text-3xl font-black font-mono text-[#38bdf8]">
                    {timerSeconds}s
                  </span>
                </div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                  {isPlaying ? 'Streaming Sponsor Ad...' : 'Stream Ready'}
                </p>
                <p className="text-[11px] text-white/50">
                  {isPlaying ? 'Do not close window until completion' : 'Click Watch to start countdown'}
                </p>
              </div>

              {/* Bottom Progress Bar inside screen */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                <div
                  className="h-full bg-linear-to-r from-[#38bdf8] to-[#4ade80] transition-all duration-300"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>

              {/* Volume & Fullscreen controls */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 200 ADS LISTING CATALOG (User Request: Listing 1 to 200) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f0ebe0] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-[#0c5963]" />
              <h2 className="text-lg sm:text-xl font-black text-[#09353e]">
                Daily Ad Directory (1 to 200)
              </h2>
            </div>
            <p className="text-xs text-[#718589] mt-0.5">
              Select any ready or available ad to play. Cooldowns are removed for rapid daily progression.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All (200)` },
              { id: 'available', label: `Available (${Math.max(0, 200 - adStatus.dailyAdCount)})` },
              { id: 'completed', label: `Completed (${adStatus.dailyAdCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdListFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  adListFilter === tab.id
                    ? 'bg-[#0c5963] text-white border-[#0c5963] shadow-2xs'
                    : 'bg-[#faf8f5] text-[#526d72] border-[#e4ded2] hover:bg-[#ede7dc]'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Search Input */}
            <div className="relative w-40 sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#718589] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find Ad #1 to #200..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
              />
            </div>
          </div>
        </div>

        {/* Range Batch Switcher (1-50, 51-100, 101-150, 151-200) */}
        {!searchQuery && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#718589] uppercase tracking-wider mr-1">
              Select Range:
            </span>
            {[
              { batch: 1, label: 'Ads #1 – 50' },
              { batch: 2, label: 'Ads #51 – 100' },
              { batch: 3, label: 'Ads #101 – 150' },
              { batch: 4, label: 'Ads #151 – 200' },
            ].map((b) => (
              <button
                key={b.batch}
                onClick={() => setListingBatch(b.batch)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                  listingBatch === b.batch
                    ? 'bg-[#112d35] text-white border-[#112d35]'
                    : 'bg-white text-[#526d72] border-[#e4ded2] hover:bg-[#faf8f5]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        {/* 200 Ads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {displayedAds.map((ad) => {
            const isCurrentActive = ad.adNumber === currentSelectedAdNumber;
            const isCompleted = ad.isWatched;
            const isNext = ad.adNumber === adStatus.dailyAdCount + 1;

            return (
              <div
                key={ad.id}
                onClick={() => {
                  if (!isCompleted) {
                    handleStartStream(ad.adNumber);
                  } else {
                    setCurrentSelectedAdNumber(ad.adNumber);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                  isCurrentActive
                    ? 'border-[#0c5963] bg-[#0c5963]/5 ring-2 ring-[#0c5963]/25 shadow-xs'
                    : isCompleted
                    ? 'border-[#dcfce7] bg-[#f0fdf4]/60 hover:bg-[#f0fdf4]'
                    : 'border-[#e4ded2] bg-[#faf8f5] hover:border-[#0c5963]/50 hover:bg-white'
                }`}
              >
                {/* Header row with Ad Number & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#09353e]">
                    Ad #{ad.adNumber}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      Done
                    </span>
                  ) : isNext ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded-full animate-pulse">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#718589] uppercase">
                      Queued
                    </span>
                  )}
                </div>

                {/* Title & Tag */}
                <div>
                  <p className="text-xs font-bold text-[#09353e] truncate">
                    {ad.sponsor}
                  </p>
                  <span className="text-[10px] text-[#718589] font-medium block truncate">
                    {ad.category}
                  </span>
                </div>

                {/* Reward & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[#f0ebe0]">
                  <span className="text-xs font-black text-[#0c5963]">
                    +${Number(ad.reward).toFixed(4)}
                  </span>

                  <button
                    type="button"
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                      isCompleted
                        ? 'text-[#15803d] bg-[#dcfce7]'
                        : isNext
                        ? 'bg-[#0c5963] text-white hover:bg-[#08424b]'
                        : 'bg-white border border-[#d8d1c3] text-[#526d72] hover:bg-[#faf8f5]'
                    }`}
                  >
                    {isCompleted ? 'Watched' : isNext ? 'Watch Now' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
