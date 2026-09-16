import React, { useState, useEffect, useRef } from 'react';
import {
  Pickaxe,
  Flame,
  Zap,
  TrendingUp,
  ShieldCheck,
  Users,
  Lock,
  Calendar,
  ArrowLeft,
  Sparkles,
  Info,
  Clock,
  RotateCcw,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MinerTapButton from '../components/miner/MinerTapButton';
import MinerPreStaking from '../components/miner/MinerPreStaking';
import MinerTeamBoost from '../components/miner/MinerTeamBoost';
import MinerDayOffs from '../components/miner/MinerDayOffs';
import MinerSevenDayCheckIn from '../components/miner/MinerSevenDayCheckIn';

const LOCAL_STORAGE_KEY = 'taemry_tflx_miner_data';

export default function CloudMinerPage({ onNavigate }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('reactor'); // 'reactor' | 'pre-staking' | 'guild' | 'protection'

  // Initialize Miner State from LocalStorage or Defaults
  const [minerData, setMinerData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Calculate cloud elapsed mining while away
        const now = Date.now();
        const lastSync = parsed.lastSyncTime || now;
        const elapsedSeconds = Math.max(0, (now - lastSync) / 1000);

        // Check if session was active during elapsed
        const sessionDuration = parsed.sessionDurationMs || (12 * 60 * 60 * 1000);
        const sessionElapsed = now - (parsed.sessionStartTime || now);

        let addedCoins = 0;
        if (parsed.isMiningActive) {
          const effectiveRate = parsed.effectiveHashrate || 16.0;
          if (sessionElapsed < sessionDuration) {
            // Still active
            addedCoins = (effectiveRate / 3600) * elapsedSeconds;
          } else {
            // Expired in between
            const remainingActiveSec = Math.max(0, (sessionDuration - (lastSync - parsed.sessionStartTime)) / 1000);
            addedCoins = (effectiveRate / 3600) * remainingActiveSec;
            parsed.isMiningActive = false;
          }
        }

        const existing = Number(parsed.minedTflx);
        const baseMined = (!isNaN(existing) && existing >= 283.98) ? existing : 283.98;
        return {
          ...parsed,
          minedTflx: Number((baseMined + addedCoins).toFixed(2)),
          lastSyncTime: now,
        };
      }
    } catch (e) {
      console.error('Failed to parse miner state:', e);
    }

    // Default 12-hour session (started 1.5 hours ago so it starts in active Green state)
    const now = Date.now();
    return {
      minedTflx: 283.98,
      isMiningActive: true,
      sessionStartTime: now - (1.5 * 60 * 60 * 1000), // 1.5h in -> ~10.5h remaining (Green phase)
      sessionDurationMs: 12 * 60 * 60 * 1000, // 12 hours
      committedYears: 0,
      committedAllocation: 0,
      preStakingBoost: 0,
      tier1Active: 2,
      tier1Total: 3,
      tier2Active: 4,
      tier2Total: 6,
      dayOffsCount: 2,
      streakDays: 4,
      claimedCheckInDays: [1, 2, 3],
      slashedCoins: 0,
      lastSyncTime: now,
      lastPingTime: 0,
    };
  });

  // Calculate Base and Total Hashrate
  // Base: 16 TFLX/h
  // Pre-Staking Multiplier: e.g. +50% -> 16 * 1.5 = 24
  // Guild: Tier 1 (+4 TFLX/h each) + Tier 2 (+0.8 TFLX/h each)
  const baseRate = 16.0;
  const preStakingMultiplier = 1 + (minerData.preStakingBoost || 0) / 100;
  const teamRate = (minerData.tier1Active * 4.0) + (minerData.tier2Active * 0.8);
  const effectiveHashrate = (baseRate * preStakingMultiplier) + teamRate;

  // Real-time ticking engine for Continuous Cloud Mining
  useEffect(() => {
    const timer = setInterval(() => {
      setMinerData((prev) => {
        const now = Date.now();
        const elapsedSinceStart = now - prev.sessionStartTime;

        if (!prev.isMiningActive || elapsedSinceStart >= prev.sessionDurationMs) {
          // Session expired or paused
          return {
            ...prev,
            isMiningActive: false,
            lastSyncTime: now,
          };
        }

        // Add 1-second increment of TFLX
        const tflxPerSec = effectiveHashrate / 3600;
        const newBalance = Number((prev.minedTflx + tflxPerSec).toFixed(4));

        return {
          ...prev,
          minedTflx: newBalance,
          lastSyncTime: now,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [effectiveHashrate]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ...minerData,
        effectiveHashrate,
      }));
    } catch (e) {}
  }, [minerData, effectiveHashrate]);

  // Handlers
  const handleStartMining = () => {
    const now = Date.now();
    setMinerData((prev) => ({
      ...prev,
      isMiningActive: true,
      sessionStartTime: now,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      lastSyncTime: now,
      streakDays: prev.streakDays + 1,
      // If streak reached multiple of 6, give +1 Day-Off
      dayOffsCount: ((prev.streakDays + 1) % 6 === 0) ? prev.dayOffsCount + 1 : prev.dayOffsCount,
    }));

    showToast('12-Hour Cloud Mining session ignited! Green 3D Reactor active.', 'success');
  };

  const handleRenewSessionEarly = () => {
    const now = Date.now();
    setMinerData((prev) => ({
      ...prev,
      isMiningActive: true,
      sessionStartTime: now,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      lastSyncTime: now,
      streakDays: prev.streakDays + 1,
    }));

    showToast('Early Check-In successful! New 12-hour session restarted without breaking streak.', 'success');
  };

  const handleCommitPreStaking = ({ years, allocation, boostPercent }) => {
    setMinerData((prev) => ({
      ...prev,
      committedYears: years,
      committedAllocation: allocation,
      preStakingBoost: boostPercent,
    }));
    showToast(`Pre-Staking Boost of +${boostPercent}% committed!`, 'success');
  };

  const handlePingInactive = () => {
    setMinerData((prev) => ({
      ...prev,
      lastPingTime: Date.now(),
    }));
    showToast('Push alert sent to all inactive team members!', 'info');
  };

  const handleResurrectCoins = () => {
    setMinerData((prev) => ({
      ...prev,
      minedTflx: Number((prev.minedTflx + prev.slashedCoins).toFixed(4)),
      slashedCoins: 0,
    }));
    showToast('Slashed coins resurrected and restored to node balance!', 'success');
  };

  const handleClaimCheckIn = (day, reward) => {
    setMinerData((prev) => {
      const alreadyClaimed = (prev.claimedCheckInDays || []).includes(day);
      if (alreadyClaimed) return prev;

      const newClaimed = [...(prev.claimedCheckInDays || []), day];
      const givesDayOff = day === 7;
      return {
        ...prev,
        minedTflx: Number((prev.minedTflx + reward).toFixed(4)),
        claimedCheckInDays: newClaimed,
        dayOffsCount: givesDayOff ? prev.dayOffsCount + 1 : prev.dayOffsCount,
      };
    });
    showToast(`Day ${day} check-in reward claimed: +${reward} TFLX!`, 'success');
  };

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] dark:bg-[#07151a] text-[#112d35] dark:text-[#ecf3f4] pt-4 sm:pt-6 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Breadcrumb & Navigation (Hidden per user request) */}
        <div className="hidden items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-miner-back-home"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Hero Header Card: Mined Hash Balance & Live Hashrate */}
        <div className="w-full rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-sm relative overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#d97706]/15 to-[#ea580c]/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Bar inside Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ece6d9] dark:border-[#173740]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#d97706]">
                  <Pickaxe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-black tracking-widest text-[#d97706] uppercase block">
                    TAEMRY &bull; CLOUD MINER (12H)
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight">
                    TFLX Cloud Reactor
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>NODE SYNCED (100%)</span>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#faf8f5] dark:bg-[#112d36] border border-[#ece6d9] dark:border-[#1d4450] text-[#0c5963] dark:text-[#38bdf8] text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1 TFLX &asymp; $0.15</span>
                </div>
              </div>
            </div>

            {/* Main Showcase: Big Mined Balance (Bara Karo & 2 Decimals) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#faf8f5] dark:bg-[#07151a] p-6 sm:p-7 rounded-2xl border border-[#ece6d9] dark:border-[#173740]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider">
                    Total Mined Reward Balance
                  </span>
                </div>

                {/* Giant Typography for Mined Balance (Bara Karo) */}
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#09353e] dark:text-[#f8fafc] tracking-tight tabular-nums">
                    {minerData.minedTflx.toFixed(2)}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#ea580c]">
                    TFLX
                  </span>
                </div>

                {/* Real-time USD Valuation */}
                <p className="text-xs sm:text-sm font-semibold text-[#6e8286] dark:text-[#94a3b8] flex items-center gap-1.5">
                  <span>&asymp; ${(minerData.minedTflx * 0.15).toFixed(2)} USD</span>
                  <span className="text-[10px] text-[#94a3b8] dark:text-[#64748b]">&bull; Target Listing Value</span>
                </p>
              </div>

              {/* Hashrate & 24h Yield Highlights - Consolidated Unified Card (Ikatta) */}
              <div className="flex divide-x divide-[#ece6d9] dark:divide-[#173740] rounded-2xl bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] shadow-2xs overflow-hidden shrink-0">
                <div className="p-3.5 sm:p-4">
                  <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Effective Speed
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                    +{effectiveHashrate.toFixed(1)} <span className="text-xs font-bold">TFLX/h</span>
                  </p>
                </div>

                <div className="p-3.5 sm:p-4">
                  <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider block">
                    24H Projected
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#0c5963] dark:text-[#38bdf8] mt-0.5 tabular-nums">
                    +{(effectiveHashrate * 24).toFixed(1)} <span className="text-xs font-bold">TFLX</span>
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                    &asymp; ${((effectiveHashrate * 24) * 0.15).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Extra New Features Grid (Baqi Ismy Or Bi Dal) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#faf8f5]/80 dark:bg-[#07151a]/80 border border-[#ece6d9] dark:border-[#173740]">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Base Rate</span>
                </div>
                <p className="text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                  +16.0 TFLX/h
                </p>
                <span className="text-[10px] text-[#7a8c94] dark:text-[#94a3b8]">Level 1 Base Protocol</span>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f5]/80 dark:bg-[#07151a]/80 border border-[#ece6d9] dark:border-[#173740]">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Pre-Staking Boost</span>
                </div>
                <p className="text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                  +{minerData.preStakingBoost || 0}% Boost
                </p>
                <span className="text-[10px] text-[#7a8c94] dark:text-[#94a3b8]">Lock Allocation Yield</span>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f5]/80 dark:bg-[#07151a]/80 border border-[#ece6d9] dark:border-[#173740]">
                <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-bold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Guild Team</span>
                </div>
                <p className="text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                  {minerData.tier1Active + minerData.tier2Active} Active Miners
                </p>
                <span className="text-[10px] text-[#7a8c94] dark:text-[#94a3b8]">+{teamRate.toFixed(1)} TFLX/h added</span>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f5]/80 dark:bg-[#07151a]/80 border border-[#ece6d9] dark:border-[#173740]">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protection</span>
                </div>
                <p className="text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                  {minerData.dayOffsCount} Days-Off
                </p>
                <span className="text-[10px] text-[#7a8c94] dark:text-[#94a3b8]">{minerData.streakDays} Days Streak Active 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-2xl overflow-x-auto shadow-2xs">
          <button
            type="button"
            id="tab-miner-reactor"
            onClick={() => setActiveSubTab('reactor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'reactor'
                ? 'bg-[#0c5963] text-white shadow-sm'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>1. Tap-to-Mine Cycle (12h)</span>
          </button>

          <button
            type="button"
            id="tab-miner-staking"
            onClick={() => setActiveSubTab('pre-staking')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'pre-staking'
                ? 'bg-[#d97706] text-white shadow-sm'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>2. Pre-Staking & Boost (+250%)</span>
          </button>

          <button
            type="button"
            id="tab-miner-guild"
            onClick={() => setActiveSubTab('guild')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'guild'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. 2-Tier Guild Network</span>
          </button>

          <button
            type="button"
            id="tab-miner-protection"
            onClick={() => setActiveSubTab('protection')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'protection'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Day-Offs & Slashing</span>
          </button>
        </div>

        {/* TAB 1: 3D TAP-TO-MINE REACTOR (12H CYCLE & EARLY CHECK-IN) */}
        {activeSubTab === 'reactor' && (
          <div className="w-full bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col items-center">
            <MinerTapButton
              minerData={minerData}
              onStartMining={handleStartMining}
              onRenewSessionEarly={handleRenewSessionEarly}
              effectiveHashrate={effectiveHashrate}
            />

            {/* 7-Day Mining Check-In Rewards */}
            <MinerSevenDayCheckIn
              streakDays={minerData.streakDays || 4}
              claimedDays={minerData.claimedCheckInDays || [1, 2, 3]}
              onClaimDay={handleClaimCheckIn}
            />

            {/* Operational Rules Info Grid - Consolidated Unified Card (Ikatta) */}
            <div className="w-full mt-8 pt-6 border-t border-[#ece6d9] dark:border-[#173740]">
              <div className="w-full rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] p-4 sm:p-5 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-3 border-b border-[#ece6d9] dark:border-[#173740]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#09353e] dark:text-[#f1f5f9]">
                      12-Hour Mining Lifecycle & Action Phases
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#6e8286] dark:text-[#94a3b8]">
                    Sequential Cycle Progression
                  </span>
                </div>

                {/* Consolidated connected timeline with 3 unified phase segments */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#ece6d9] dark:divide-[#173740] rounded-xl bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] overflow-hidden">
                  {/* Segment 1: Green */}
                  <div className="p-4 flex flex-col justify-between space-y-2 bg-emerald-500/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                        <Pickaxe className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        0 - 6 Hours (Green 3D)
                      </h4>
                      <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-1 leading-relaxed">
                        Active cloud mining running at full hashrate. Continuous coin generation with zero battery usage.
                      </p>
                    </div>
                  </div>

                  {/* Segment 2: Orange */}
                  <div className="p-4 flex flex-col justify-between space-y-2 bg-amber-500/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        6 - 12 Hours (Orange 3D)
                      </h4>
                      <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-1 leading-relaxed">
                        Early Check-In window unlocks! Hold button for 2s to renew session early without breaking streak.
                      </p>
                    </div>
                  </div>

                  {/* Segment 3: Red */}
                  <div className="p-4 flex flex-col justify-between space-y-2 bg-rose-500/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        &gt; 12 Hours (Warning Red)
                      </h4>
                      <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-1 leading-relaxed">
                        Session expired and idle. Single tap immediately reignites a fresh 12h cloud mining session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRE-STAKING & STAKING BOOST */}
        {activeSubTab === 'pre-staking' && (
          <MinerPreStaking
            minerData={minerData}
            onCommitPreStaking={handleCommitPreStaking}
          />
        )}

        {/* TAB 3: 2-TIER GUILD NETWORK */}
        {activeSubTab === 'guild' && (
          <MinerTeamBoost
            user={currentUser}
            minerData={minerData}
            onPingInactive={handlePingInactive}
          />
        )}

        {/* TAB 4: DAY-OFFS & SLASHING */}
        {activeSubTab === 'protection' && (
          <MinerDayOffs
            minerData={minerData}
            onResurrectCoins={handleResurrectCoins}
          />
        )}

      </div>
    </div>
  );
}
