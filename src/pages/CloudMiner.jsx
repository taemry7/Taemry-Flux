import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pickaxe,
  Zap,
  Flame,
  Activity,
  Sparkles,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Check,
  Copy,
  ChevronRight,
  Coins,
  Users,
  Award,
  Volume2,
  VolumeX,
  Tv,
  Calendar,
  ShieldCheck,
  Layers,
  Bot,
  Send,
  X,
  Radio,
  Info,
  Sliders,
  Gift,
  RefreshCw,
  Play,
  ClipboardPaste,
  Trash2,
  Pencil,
  Plus,
  Share2,
  TrendingUp,
  ArrowRight,
  Lock,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playMiningTruthSound } from '../utils/audio';
import MinerTapCycle from '../components/miner/MinerTapCycle';
import MinerSlashing from '../components/miner/MinerSlashing';
import MinerPreStaking from '../components/miner/MinerPreStaking';
import MinerGuildNetwork from '../components/miner/MinerGuildNetwork';
import MinerHalvingEpochs from '../components/miner/MinerHalvingEpochs';
import MinerKYCVerification from '../components/miner/MinerKYCVerification';

const MINER_MENU_TABS = [
  { id: 'all', label: 'All Overview', shortLabel: 'Overview', icon: Layers },
  { id: 'tap-cycle', label: '1. Tap Mining Cycle', shortLabel: '1. Tap Cycle', icon: Pickaxe },
  { id: 'slashing', label: '2. Slashing & Days-Off', shortLabel: '2. Slashing', icon: ShieldAlert },
  { id: 'staking', label: '3. Pre-Staking Boost', shortLabel: '3. Pre-Stake', icon: Lock },
  { id: 'guild', label: '4. 2-Tier Guild Network', shortLabel: '4. 2-Tier Guild', icon: Users },
  { id: 'halving', label: '5. Halving Epochs', shortLabel: '5. Halving', icon: Activity },
  { id: 'kyc', label: '6. KYC & Quiz Verification', shortLabel: '6. KYC & Quiz', icon: UserCheck },
];

const ADOPTION_TIERS = [
  { level: 1, rate: 16, requiredUsers: 50000, label: 'Level 1 (Genesis)', isUnlocked: true },
  { level: 2, rate: 32, requiredUsers: 100000, label: 'Level 2 (Pioneer)', isUnlocked: false },
  { level: 3, rate: 64, requiredUsers: 250000, label: 'Level 3 (Ecosystem)', isUnlocked: false },
  { level: 4, rate: 128, requiredUsers: 500000, label: 'Level 4 (Mainnet Halving)', isUnlocked: false },
  { level: 5, rate: 256, requiredUsers: 1000000, label: 'Level 5 (Global Maturity)', isUnlocked: false },
];

const STREAK_DAYS = [
  { day: 1, reward: 50 },
  { day: 2, reward: 100 },
  { day: 3, reward: 150 },
  { day: 4, reward: 250 },
  { day: 5, reward: 400 },
  { day: 6, reward: 600 },
  { day: 7, reward: 800 },
  { day: 8, reward: 1200 },
  { day: 9, reward: 1600 },
  { day: 10, reward: 2000, isMega: true },
];

const INITIAL_QUESTS = [
  {
    id: 'quest-tg',
    title: 'Join TAEMRY FLUX Official Telegram Channel',
    subtitle: 'Stay updated with halving milestones and snapshot distribution',
    category: 'community',
    reward: 500,
    url: 'https://t.me/taemryflux',
  },
  {
    id: 'quest-x',
    title: 'Follow TAEMRY FLUX on X (Twitter)',
    subtitle: 'Retweet official Mainnet roadmap & decentralized mining announcement',
    category: 'social',
    reward: 500,
    url: 'https://x.com/taemryflux',
  },
  {
    id: 'quest-wallet',
    title: 'Connect TON Non-Custodial Wallet Snapshot',
    subtitle: 'Bind TON chain address to qualify for 2027 Mainnet distribution',
    category: 'security',
    reward: 1000,
  },
  {
    id: 'quest-video-1',
    title: 'Watch Video: 12H Cloud Miner Consensus Engine',
    subtitle: 'Watch 6-second partner clip to unlock verified node yield',
    category: 'video',
    reward: 350,
  },
  {
    id: 'quest-video-2',
    title: 'Watch Video: Proof-of-Contribution Tokenomics',
    subtitle: 'Explore 1 Billion hard-cap distribution & automated liquidity pairs',
    category: 'video',
    reward: 450,
  },
  {
    id: 'quest-guild',
    title: 'Grow Your Mining Guild (Invite Friends)',
    subtitle: 'Earn +2,000 TFLX per active miner plus permanent hashrate boost',
    category: 'growth',
    reward: 1500,
  },
];

export default function CloudMiner({ onSelectTab, onNavigate }) {
  const { currentUser, userStats } = useAuth();

  // Miner State Persistence
  const [minerState, setMinerState] = useState(() => {
    try {
      const saved = localStorage.getItem('taemry_cloud_miner_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          minedYield: parsed.minedYield !== undefined ? Number(parsed.minedYield) : 14.80,
          isMiningActive: parsed.isMiningActive !== undefined ? Boolean(parsed.isMiningActive) : true,
          sessionStartTime: parsed.sessionStartTime || Date.now() - (8.64 * 3600 * 1000), // ~72% elapsed
          sessionDurationMs: parsed.sessionDurationMs || (12 * 3600 * 1000), // 12 hours cycle
          baseHashrate: parsed.baseHashrate || 16.0,
          streakDays: parsed.streakDays !== undefined ? Number(parsed.streakDays) : 3,
          lastStreakDate: parsed.lastStreakDate || null,
          tonWalletAddress: parsed.tonWalletAddress || '',
          completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : ['quest-tg'],
          referralCount: parsed.referralCount || 0,
        };
      }
    } catch {}
    return {
      minedYield: 14.80,
      isMiningActive: true,
      sessionStartTime: Date.now() - (8.64 * 3600 * 1000),
      sessionDurationMs: 12 * 3600 * 1000,
      baseHashrate: 16.0,
      streakDays: 3,
      lastStreakDate: null,
      tonWalletAddress: '',
      completedQuests: ['quest-tg'],
      referralCount: 0,
    };
  });

  // Save on update
  useEffect(() => {
    try {
      localStorage.setItem('taemry_cloud_miner_state', JSON.stringify(minerState));
    } catch {}
  }, [minerState]);

  // Modals
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isTokenomicsModalOpen, setIsTokenomicsModalOpen] = useState(false);
  const [isAiSupportOpen, setIsAiSupportOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [activeAdQuest, setActiveAdQuest] = useState(null);

  // Active Menu Tab: 'all' | 'tap-cycle' | 'slashing' | 'staking' | 'guild' | 'halving' | 'kyc'
  const [activeMinerTab, setActiveMinerTab] = useState('all');

  // Audio & celebration states
  const [audioFeedback, setAudioFeedback] = useState(false);
  const [celebrationToast, setCelebrationToast] = useState(null);

  // Wallet binding form state
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState(minerState.tonWalletAddress || '');
  const [copiedWallet, setCopiedWallet] = useState(false);

  // Referral link copy state
  const [copiedRef, setCopiedRef] = useState(false);

  // Time calculations
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Remaining time in cycle
  const remainingMs = useMemo(() => {
    if (!minerState.isMiningActive || !minerState.sessionStartTime) return 0;
    const elapsed = now - minerState.sessionStartTime;
    return Math.max(0, minerState.sessionDurationMs - elapsed);
  }, [minerState.isMiningActive, minerState.sessionStartTime, minerState.sessionDurationMs, now]);

  const totalRemainingSeconds = Math.floor(remainingMs / 1000);
  const progressPercent = useMemo(() => {
    if (!minerState.isMiningActive || !minerState.sessionDurationMs) return 0;
    const elapsed = minerState.sessionDurationMs - remainingMs;
    return Math.min(100, Math.max(0, (elapsed / minerState.sessionDurationMs) * 100));
  }, [minerState.isMiningActive, minerState.sessionDurationMs, remainingMs]);

  // Color Phase
  // Active with > 50% left: green/teal phase
  // Active with <= 50% left: yellow/amber milestone phase
  // Stopped / 0 left: red/ready phase (prompt tap-to-mine)
  const isMining = minerState.isMiningActive && remainingMs > 0;
  const isFirstHalf = isMining && remainingMs > (minerState.sessionDurationMs / 2);
  const isSecondHalf = isMining && remainingMs <= (minerState.sessionDurationMs / 2);

  const phase = isFirstHalf
    ? 'green'
    : isSecondHalf
    ? 'yellow'
    : 'red';

  // Effective Hashrate Calculation
  const activeReferralsBoost = (minerState.referralCount || 0) * 4.0;
  const walletBoost = minerState.tonWalletAddress ? 4.0 : 0.0;
  const streakBoost = (minerState.streakDays || 1) * 1.0;
  const questsBoost = (minerState.completedQuests.length || 0) * 0.5;

  const totalEffectiveHashrate = parseFloat(
    (minerState.baseHashrate + activeReferralsBoost + walletBoost + streakBoost + questsBoost).toFixed(2)
  );

  // Per second rate in TFLX
  const perSecondYield = totalEffectiveHashrate / 3600;

  // Real-time second-by-second micro accumulation while active
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    if (!isMining) return;
    const interval = setInterval(() => {
      const current = Date.now();
      const deltaSec = (current - lastTickRef.current) / 1000;
      lastTickRef.current = current;
      if (deltaSec > 0) {
        const increment = deltaSec * perSecondYield;
        setMinerState((prev) => ({
          ...prev,
          minedYield: parseFloat((prev.minedYield + increment).toFixed(4)),
        }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isMining, perSecondYield]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tap-to-Mine action
  const handleStartMining = () => {
    playMiningTruthSound();
    setAudioFeedback(true);
    setTimeout(() => setAudioFeedback(false), 2000);

    setMinerState((prev) => ({
      ...prev,
      isMiningActive: true,
      sessionStartTime: Date.now(),
      sessionDurationMs: 12 * 3600 * 1000,
    }));

    setCelebrationToast({
      title: '12-Hour Cloud Miner Ignited!',
      message: `Active session running at +${totalEffectiveHashrate} TFLX/h. Keep your rhythm!`,
    });
  };

  // 10-Day Streak Check-in
  const todayStr = new Date().toISOString().split('T')[0];
  const isStreakClaimedToday = minerState.lastStreakDate === todayStr;

  const handleClaimStreak = (dayNumber) => {
    if (isStreakClaimedToday) return;
    playMiningTruthSound();
    const dayItem = STREAK_DAYS.find((s) => s.day === dayNumber) || STREAK_DAYS[0];
    const reward = dayItem.reward;

    setMinerState((prev) => ({
      ...prev,
      streakDays: Math.min(10, prev.streakDays + 1),
      minedYield: parseFloat((prev.minedYield + reward).toFixed(2)),
      lastStreakDate: todayStr,
    }));

    setCelebrationToast({
      title: `Day ${dayNumber} Streak Claimed!`,
      message: `+${reward} TFLX credited to your mined balance!`,
    });
  };

  // TON Wallet save
  const handleSaveWallet = (e) => {
    e.preventDefault();
    const clean = walletInput.trim();
    if (!clean || clean.length < 10) return;

    setMinerState((prev) => ({
      ...prev,
      tonWalletAddress: clean,
      minedYield: parseFloat((prev.minedYield + 500).toFixed(2)),
      completedQuests: prev.completedQuests.includes('quest-wallet')
        ? prev.completedQuests
        : [...prev.completedQuests, 'quest-wallet'],
    }));
    setIsEditingWallet(false);
    playMiningTruthSound();
    setCelebrationToast({
      title: 'TON Wallet Snapshot Bound!',
      message: 'Your address is verified for 2027 Mainnet +500 TFLX bounty credited!',
    });
  };

  // Copy referral
  const referralCode = currentUser?.email?.split('@')[0] || 'MINER7';
  const referralLink = `${window.location.origin}/#/login/signup?ref=${encodeURIComponent(referralCode)}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setCelebrationToast({
      title: 'Invite Link Copied!',
      message: 'Share on Telegram & WhatsApp to earn +2,000 TFLX per referral.',
    });
    setTimeout(() => setCopiedRef(false), 2200);
  };

  // Watch Sponsored Video Ad Quest
  const handleStartAdQuest = (quest) => {
    setActiveAdQuest(quest);
    setIsAdModalOpen(true);
  };

  const handleCompleteAdQuest = (quest) => {
    playMiningTruthSound();
    setMinerState((prev) => ({
      ...prev,
      minedYield: parseFloat((prev.minedYield + quest.reward).toFixed(2)),
      completedQuests: prev.completedQuests.includes(quest.id)
        ? prev.completedQuests
        : [...prev.completedQuests, quest.id],
    }));
    setIsAdModalOpen(false);
    setCelebrationToast({
      title: 'Sponsored Verification Completed!',
      message: `+${quest.reward} TFLX added to your mined balance!`,
    });
  };

  // Teammates List
  const mockTeammates = [
    { id: 'tm-1', name: 'Zeeshan Malik', handle: '@zeeshan_m', hashrate: 16.0, isActive: true, joined: 'Yesterday' },
    { id: 'tm-2', name: 'Kamran Ali', handle: '@kamran_a', hashrate: 18.5, isActive: true, joined: '2d ago' },
    { id: 'tm-3', name: 'Bilal Khan', handle: '@bilal_k', hashrate: 16.0, isActive: false, joined: '3d ago' },
  ];
  const [pingedMembers, setPingedMembers] = useState({});

  const handlePing = (id, name) => {
    setPingedMembers((prev) => ({ ...prev, [id]: true }));
    setCelebrationToast({
      title: 'Ping Broadcasted',
      message: `Reminder sent to ${name} to resume their 12h cloud mining cycle.`,
    });
    setTimeout(() => {
      setPingedMembers((prev) => ({ ...prev, [id]: false }));
    }, 12000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Celebration Toast Banner */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#064e3b]/30 border border-[#a7f3d0] dark:border-[#047857]/40 text-[#065f46] dark:text-[#6ee7b7] flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#10b981] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#064e3b] dark:text-white">
                  {celebrationToast.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#047857] dark:text-[#a7f3d0]">
                  {celebrationToast.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCelebrationToast(null)}
              className="text-xs font-bold underline cursor-pointer text-[#065f46] dark:text-[#a7f3d0]"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: Title, Subtitle, and Specs/Tokenomics Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-2.5 py-0.5 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
              TAEMRY / 12H MINER PROTOCOL
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-[#15803d] dark:text-[#4ade80]">
              LIVE NODE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] dark:text-white tracking-tight">
            Cloud Mining Reactor
          </h1>
          <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mt-0.5">
            Continuous proof-of-contribution hashrate yield, 12-hour active cycles, and TON snapshot binding.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsSpecsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0c222a] hover:bg-[#f3eee4] dark:hover:bg-[#12313c] text-[#09353e] dark:text-white text-xs font-bold rounded-xl border border-[#d8d1c3] dark:border-[#1e4854] transition-colors cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Specifications</span>
          </button>
          <button
            onClick={() => setIsTokenomicsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0c222a] hover:bg-[#f3eee4] dark:hover:bg-[#12313c] text-[#09353e] dark:text-white text-xs font-bold rounded-xl border border-[#d8d1c3] dark:border-[#1e4854] transition-colors cursor-pointer shadow-xs"
          >
            <Coins className="w-3.5 h-3.5 text-[#ca8a04] dark:text-[#fde047]" />
            <span>Token Supply</span>
          </button>
          <button
            onClick={() => setIsAiSupportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* CLOUD MINER 1 TO 6 INTERACTIVE NAVIGATION MENU BAR */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs min-w-max">
          {MINER_MENU_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMinerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMinerTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#0c5963] text-white shadow-xs shadow-[#0c5963]/30 scale-[1.02]'
                    : 'text-[#546b70] dark:text-[#94a3b8] hover:text-[#09353e] dark:hover:text-white hover:bg-[#faf8f5] dark:hover:bg-[#12313c]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-[#718589] dark:text-[#94a3b8]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW CONTENT (WHEN ALL IS SELECTED) */}
      {activeMinerTab === 'all' && (
        <div className="space-y-6">
          {/* 1. MAIN HERO CARD: 4D Quantum Reactor & Live Yield Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Central Tap-to-Mine 4D Reactor */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between relative overflow-hidden text-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0c5963]/10 to-transparent pointer-events-none" />

          {/* Top Status Indicators */}
          <div className="w-full flex items-center justify-between pb-4 border-b border-[#f0ebe0] dark:border-[#173740] relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
                <Pickaxe className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-black text-[#09353e] dark:text-white">
                  12-Hour Tap-to-Mine Reactor
                </h3>
                <p className="text-[10px] text-[#718589] dark:text-[#94a3b8] font-mono">
                  Harmonic 528Hz Consensus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isMining ? 'CYCLE ACTIVE' : 'READY TO MINE'}</span>
            </div>
          </div>

          {/* Central Reactor Sphere / Interactive Tap Trigger */}
          <div className="my-6 sm:my-8 relative flex flex-col items-center justify-center">
            {/* Outer Rotating Concentric Rings */}
            {isMining && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-6 rounded-full border-2 border-dashed border-[#0c5963]/30 dark:border-[#38bdf8]/30 pointer-events-none"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-10 rounded-full border border-dotted border-[#10b981]/25 pointer-events-none"
                />
              </>
            )}

            {/* Circular SVG Track */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xs">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-[#f1eee7] dark:stroke-[#122b33] fill-transparent"
                  strokeWidth="10"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-[#0c5963] dark:stroke-[#38bdf8] fill-transparent transition-all duration-300 ease-linear"
                  strokeWidth="10"
                  strokeDasharray="565"
                  strokeDashoffset={565 - (565 * (isMining ? progressPercent : 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Central Trigger Button */}
              <motion.button
                onClick={handleStartMining}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full p-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-md select-none border-2 ${
                  isMining
                    ? 'bg-gradient-to-br from-[#0c5963] via-[#09424a] to-[#042024] text-white border-[#38bdf8]/50 shadow-[#0c5963]/30'
                    : 'bg-gradient-to-br from-[#0c5963] to-[#08363d] text-white border-[#10b981]/60 shadow-[#0c5963]/40 animate-pulse'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#062025]/80 flex flex-col items-center justify-center p-2 text-center border border-white/10 relative overflow-hidden">
                  <Zap className={`w-8 h-8 sm:w-9 sm:h-9 mb-1 ${isMining ? 'text-[#38bdf8] animate-pulse' : 'text-[#facc15] animate-bounce'}`} />

                  {isMining ? (
                    <>
                      <span className="text-[9px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider">
                        12H CYCLE
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                        {formatTime(totalRemainingSeconds)}
                      </span>
                      <span className="text-[9px] text-[#a7f3d0] font-mono mt-0.5">
                        +{totalEffectiveHashrate} TFLX/h
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                        TAP TO MINE
                      </span>
                      <span className="text-[9px] font-mono text-[#a7f3d0] mt-0.5">
                        Start 12H Cycle
                      </span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </div>

          {/* Audio ignition feedback note */}
          <div className="w-full flex items-center justify-between text-xs text-[#6e8286] dark:text-[#94a3b8] pt-3 border-t border-[#f0ebe0] dark:border-[#173740]">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
              <span>528 Hz Harmonic Ignition Feedback Active</span>
            </span>
            <span className="font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
              Cycle Progress: {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        {/* Right 1 Col: Live Balance & Hashrate Breakdown */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Mined Hash Yield Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e8286] dark:text-[#94a3b8]">
                Mined Hash Yield
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740]">
                USD • TFLX
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-[#09353e] dark:text-white tracking-tight flex items-baseline">
              <span>${minerState.minedYield.toFixed(2).split('.')[0]}</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#0c5963] dark:text-[#38bdf8]">
                .{minerState.minedYield.toFixed(2).split('.')[1] || '00'}
              </span>
              <span className="text-xs text-[#718589] dark:text-[#94a3b8] ml-2 font-mono">
                TFLX
              </span>
            </div>

            <p className="text-xs text-[#526b70] dark:text-[#94a3b8]">
              Real-time micro-accumulation running at ~+{(perSecondYield).toFixed(4)} TFLX/s.
            </p>
          </div>

          {/* Hashrate Power Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e8286] dark:text-[#94a3b8]">
                Total Effective Hashrate
              </span>
              <span className="text-[10px] font-bold text-[#15803d] dark:text-[#4ade80] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Boost
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-[#09353e] dark:text-white tracking-tight flex items-baseline">
              <span>{totalEffectiveHashrate.toFixed(1)}</span>
              <span className="text-sm font-bold text-[#0c5963] dark:text-[#38bdf8] ml-1.5 font-mono">
                MH/s (+{totalEffectiveHashrate} TFLX/h)
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#526b70] dark:text-[#94a3b8] pt-1">
              <div className="flex justify-between">
                <span>Base Tier Rate</span>
                <span className="font-mono font-bold text-[#09353e] dark:text-white">+{minerState.baseHashrate} TFLX/h</span>
              </div>
              <div className="flex justify-between">
                <span>Referral Guild ({minerState.referralCount} miners)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{activeReferralsBoost} TFLX/h</span>
              </div>
              <div className="flex justify-between">
                <span>TON Wallet Binding</span>
                <span className="font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">+{walletBoost} TFLX/h</span>
              </div>
              <div className="flex justify-between">
                <span>Streak Day Multiplier ({minerState.streakDays}d)</span>
                <span className="font-mono font-bold text-[#ca8a04] dark:text-[#facc15]">+{streakBoost} TFLX/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 10-DAY STREAK LOYALTY & CHECK-IN SECTION */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ebe0] dark:border-[#173740] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fef3c7] dark:bg-[#2e2609] text-[#ca8a04] dark:text-[#facc15] flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
                10-Day Streak Loyalty Check-In
              </h3>
              <p className="text-xs text-[#718589] dark:text-[#94a3b8]">
                Consecutive check-in bonuses with progressive TFLX grant distribution
              </p>
            </div>
          </div>

          <div className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-[#fef3c7] dark:bg-[#2e2609] text-[#b45309] dark:text-[#fbbf24] border border-[#fde68a] dark:border-[#78350f]">
            {minerState.streakDays} / 10 Days Active
          </div>
        </div>

        {/* 10-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {STREAK_DAYS.map((item) => {
            const isClaimed = minerState.streakDays >= item.day;
            const isTodayTarget = minerState.streakDays + 1 === item.day;

            return (
              <button
                key={item.day}
                onClick={() => isTodayTarget && handleClaimStreak(item.day)}
                disabled={isClaimed}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                  isClaimed
                    ? 'bg-[#f0fdf4] dark:bg-[#064e3b]/30 border border-[#bbf7d0] dark:border-[#047857]/50 text-[#15803d] dark:text-[#4ade80]'
                    : isTodayTarget
                    ? 'bg-[#e6f4f1] dark:bg-[#0c262e] border-2 border-[#0c5963] dark:border-[#38bdf8] text-[#0c5963] dark:text-[#38bdf8] shadow-xs animate-pulse'
                    : 'bg-[#faf8f5] dark:bg-[#07151a] border border-[#e4ded2] dark:border-[#173740] text-[#718589] dark:text-[#64748b]'
                }`}
              >
                <span className="text-[10px] font-black uppercase">Day {item.day}</span>
                <span className="text-xs font-black font-mono my-1">
                  +{item.reward}
                </span>
                <span className="text-[9px] font-bold">
                  {isClaimed ? 'Claimed' : isTodayTarget ? 'Claim Now' : 'TFLX'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 7-DAY CONSISTENCY VELOCITY CHART */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ebe0] dark:border-[#173740] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
                7-Day Consistency Velocity Chart
              </h3>
              <p className="text-xs text-[#718589] dark:text-[#94a3b8]">
                Daily mining cycle completion & network block contributions
              </p>
            </div>
          </div>

          <span className="text-xs font-bold font-mono text-[#0c5963] dark:text-[#38bdf8]">
            5/7 Target Met
          </span>
        </div>

        {/* Bar Chart Representation */}
        <div className="grid grid-cols-7 gap-2.5 items-end h-32 pt-4 px-2">
          {[
            { day: 'Mon', pct: 90, mined: 192 },
            { day: 'Tue', pct: 100, mined: 216 },
            { day: 'Wed', pct: 85, mined: 180 },
            { day: 'Thu', pct: 100, mined: 216 },
            { day: 'Fri', pct: 95, mined: 204 },
            { day: 'Sat', pct: 75, mined: 160 },
            { day: 'Today', pct: Math.max(25, Math.round(progressPercent)), mined: 14.8, isToday: true },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-mono text-[#718589] dark:text-[#94a3b8]">
                {bar.mined}
              </span>
              <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] rounded-xl p-0.5 flex items-end h-20">
                <div
                  style={{ height: `${bar.pct}%` }}
                  className={`w-full rounded-lg transition-all ${
                    bar.isToday
                      ? 'bg-gradient-to-t from-[#0c5963] to-[#10b981]'
                      : 'bg-gradient-to-t from-[#08424b] to-[#0c5963]'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-bold ${bar.isToday ? 'text-[#0c5963] dark:text-[#38bdf8]' : 'text-[#718589] dark:text-[#64748b]'}`}>
                {bar.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TON WALLET BINDING CARD (Mainnet 2027 Snapshot) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ebe0] dark:border-[#173740] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] dark:bg-[#082f49] text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
                Bind Non-Custodial TON Address
              </h3>
              <p className="text-xs text-[#718589] dark:text-[#94a3b8]">
                Registered snapshot for 2027 Mainnet TFLX tokens distribution
              </p>
            </div>
          </div>

          {minerState.tonWalletAddress && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#047857]/40">
              <Check className="w-3 h-3" />
              Snapshot Bound
            </span>
          )}
        </div>

        {minerState.tonWalletAddress && !isEditingWallet ? (
          <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold text-[#718589] dark:text-[#64748b] uppercase block">
                Bound Address
              </span>
              <p className="text-xs sm:text-sm font-mono text-[#09353e] dark:text-white font-bold truncate">
                {minerState.tonWalletAddress}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(minerState.tonWalletAddress);
                  setCopiedWallet(true);
                  setTimeout(() => setCopiedWallet(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#122e37] border border-[#d8d1c3] dark:border-[#1e4854] text-xs font-bold text-[#09353e] dark:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedWallet ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWallet ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => {
                  setWalletInput(minerState.tonWalletAddress);
                  setIsEditingWallet(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveWallet} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="Paste your TON wallet address (e.g. UQ... or EQ...)"
                className="w-full px-4 py-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#e4ded2] dark:border-[#173740] text-[#09353e] dark:text-white placeholder-[#94a3b8] font-mono text-xs focus:outline-none focus:border-[#0c5963] transition-colors"
                required
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#718589] dark:text-[#94a3b8]">
                Qualifies for automated Mainnet distribution. +500 TFLX welcome bounty credited upon binding.
              </p>
              <div className="flex items-center gap-2">
                {isEditingWallet && (
                  <button
                    type="button"
                    onClick={() => setIsEditingWallet(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#718589] hover:text-[#09353e] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save TON Address</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 5. ECOSYSTEM BOUNTY QUESTS & VIDEO ADS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ebe0] dark:border-[#173740] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
                Ecosystem Bounty Quests & Video Ads
              </h3>
              <p className="text-xs text-[#718589] dark:text-[#94a3b8]">
                Watch sponsored clips and verify official community channels for instant TFLX rewards
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-2.5 py-1 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
            {minerState.completedQuests.length} / {INITIAL_QUESTS.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INITIAL_QUESTS.map((quest) => {
            const isDone = minerState.completedQuests.includes(quest.id);

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isDone
                    ? 'bg-[#f0fdf4]/60 dark:bg-[#064e3b]/20 border-[#bbf7d0] dark:border-[#047857]/40'
                    : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#e4ded2] dark:border-[#173740] hover:border-[#0c5963]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-2 py-0.5 rounded-md">
                      +{quest.reward} TFLX
                    </span>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#718589] uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#09353e] dark:text-white">
                    {quest.title}
                  </h4>
                  <p className="text-[11px] text-[#526b70] dark:text-[#94a3b8] mt-0.5">
                    {quest.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#f0ebe0] dark:border-[#173740] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#718589] dark:text-[#64748b]">
                    Instant Verification
                  </span>

                  {isDone ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Reward Credited
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartAdQuest(quest)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Watch & Claim</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. REFERRAL GUILD & TEAM NETWORK */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ebe0] dark:border-[#173740] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#09353e] dark:text-white">
                Mining Guild & Teammates
              </h3>
              <p className="text-xs text-[#718589] dark:text-[#94a3b8]">
                Earn +2,000 TFLX instant bonus + permanent +4 MH/s hashrate per invited miner
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] font-mono">
            {mockTeammates.length} Teammates
          </span>
        </div>

        {/* Invite link card */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-[#718589] dark:text-[#64748b] uppercase block">
              Your Referral Link
            </span>
            <p className="text-xs sm:text-sm font-mono text-[#09353e] dark:text-white font-bold truncate">
              {referralLink}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyRef}
              className="px-3.5 py-2 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRef ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => {
                const text = `Join my TAEMRY FLUX Cloud Mining Node! Earn daily advertising and cloud hashrate yields: ${referralLink}`;
                window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#122e37] border border-[#d8d1c3] dark:border-[#1e4854] text-[#09353e] dark:text-white hover:bg-[#f8f5ee] cursor-pointer"
              title="Share on Telegram"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Teammates List */}
        <div className="space-y-2">
          {mockTeammates.map((tm) => (
            <div
              key={tm.id}
              className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0c5963] text-white flex items-center justify-center font-bold text-xs">
                  {tm.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#09353e] dark:text-white">{tm.name}</span>
                    <span className="text-[10px] font-mono text-[#718589] dark:text-[#94a3b8]">{tm.handle}</span>
                  </div>
                  <p className="text-[10px] text-[#526b70] dark:text-[#94a3b8]">
                    Hashrate: {tm.hashrate} MH/s • Joined {tm.joined}
                  </p>
                </div>
              </div>

              <div>
                {tm.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803d] dark:text-[#4ade80] bg-[#dcfce7] dark:bg-[#064e3b]/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Mining Active
                  </span>
                ) : (
                  <button
                    onClick={() => handlePing(tm.id, tm.name)}
                    disabled={pingedMembers[tm.id]}
                    className="px-2.5 py-1 rounded-lg bg-[#0c5963]/10 hover:bg-[#0c5963] text-[#0c5963] hover:text-white dark:text-[#38bdf8] text-[10px] font-bold border border-[#0c5963]/20 transition-all cursor-pointer"
                  >
                    {pingedMembers[tm.id] ? 'Pinged' : 'Ping Teammate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* TAB 1: 24H/12H TAP MINING CYCLE */}
  {activeMinerTab === 'tap-cycle' && (
    <MinerTapCycle
      minerState={minerState}
      setMinerState={setMinerState}
      isMining={isMining}
      progressPercent={progressPercent}
      totalRemainingSeconds={totalRemainingSeconds}
      totalEffectiveHashrate={totalEffectiveHashrate}
      formatTime={formatTime}
      handleStartMining={handleStartMining}
      perSecondYield={perSecondYield}
      onSelectTab={setActiveMinerTab}
    />
  )}

  {/* TAB 2: SLASHING & DAYS-OFF INACTIVITY SHIELD */}
  {activeMinerTab === 'slashing' && (
    <MinerSlashing
      minerState={minerState}
      setMinerState={setMinerState}
      onSelectTab={setActiveMinerTab}
    />
  )}

  {/* TAB 3: PRE-STAKING MULTIPLIER BOOST */}
  {activeMinerTab === 'staking' && (
    <MinerPreStaking
      minerState={minerState}
      setMinerState={setMinerState}
      onSelectTab={setActiveMinerTab}
    />
  )}

  {/* TAB 4: 2-TIER GUILD COLLABORATIVE NETWORK */}
  {activeMinerTab === 'guild' && (
    <MinerGuildNetwork
      currentUser={currentUser}
      onSelectTab={setActiveMinerTab}
    />
  )}

  {/* TAB 5: HALVING EPOCHS & DEFLATIONARY SCARCITY */}
  {activeMinerTab === 'halving' && (
    <MinerHalvingEpochs
      onSelectTab={setActiveMinerTab}
    />
  )}

  {/* TAB 6: MULTI-STEP KYC & CONSENSUS QUIZ */}
  {activeMinerTab === 'kyc' && (
    <MinerKYCVerification
      minerState={minerState}
      setMinerState={setMinerState}
      onSelectTab={setActiveMinerTab}
    />
  )}

      {/* ========================================================================= */}
      {/* MODAL 1: 6-SECOND SPONSORED VIDEO AD WATCHER                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAdModalOpen && activeAdQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 text-[#09353e] dark:text-white shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Sponsored Ad Verification (6s)
                  </span>
                </div>
                <button
                  onClick={() => setIsAdModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Player Stage */}
              <div className="rounded-2xl bg-[#07151a] p-5 text-white text-center space-y-3 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-[#0c5963] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {activeAdQuest.title}
                </h4>
                <p className="text-xs text-zinc-400">
                  Verifying decentralized consensus contribution node...
                </p>

                <div className="w-full bg-[#122b33] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0c5963] to-[#10b981] rounded-full animate-pulse w-full" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] font-mono">
                  Bounty Reward: +{activeAdQuest.reward} TFLX
                </span>
                <button
                  onClick={() => handleCompleteAdQuest(activeAdQuest)}
                  className="px-5 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Claim Bounty (+{activeAdQuest.reward} TFLX)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: SPECIFICATIONS & HALVING SCHEDULE                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSpecsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 text-[#09353e] dark:text-white shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Mining Specifications & Halving Schedule
                  </span>
                </div>
                <button
                  onClick={() => setIsSpecsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hashrate Formula */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] space-y-2 text-xs">
                <h4 className="font-bold text-[#09353e] dark:text-white">
                  Active Hashrate Formula
                </h4>
                <p className="text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
                  Hashrate = Base Rate ({minerState.baseHashrate} MH/s) + (Guild Referrals × 4.0 MH/s) + (TON Wallet × 4.0 MH/s) + (Check-in Streak × 1.0 MH/s) + (Completed Quests × 0.5 MH/s)
                </p>
                <div className="pt-2 border-t border-[#ece6d9] dark:border-[#173740] flex justify-between font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
                  <span>Total Calculated Hashrate</span>
                  <span>{totalEffectiveHashrate} MH/s (+{totalEffectiveHashrate} TFLX/h)</span>
                </div>
              </div>

              {/* Halving Schedule */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#718589] dark:text-[#94a3b8]">
                  Global Adoption Halving Schedule
                </h4>
                <div className="space-y-2 text-xs">
                  {ADOPTION_TIERS.map((tier) => (
                    <div
                      key={tier.level}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        tier.isUnlocked
                          ? 'bg-[#ecfdf5] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#047857]/50 text-[#065f46] dark:text-[#6ee7b7]'
                          : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#e4ded2] dark:border-[#173740] text-[#718589] dark:text-[#64748b]'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">{tier.label}</span>
                        <span className="text-[10px]">Target: {tier.requiredUsers.toLocaleString()} Miners</span>
                      </div>
                      <span className="font-mono font-bold">+{tier.rate} TFLX/h</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsSpecsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold cursor-pointer"
              >
                Close Specifications
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: TOKEN SUPPLY & 1B HARD CAP                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTokenomicsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 text-[#09353e] dark:text-white shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#ca8a04] dark:text-[#fde047]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Total Supply & Token Allocation
                  </span>
                </div>
                <button
                  onClick={() => setIsTokenomicsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span className="text-[10px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">TOTAL MAX SUPPLY</span>
                  <p className="text-lg font-black font-mono text-[#09353e] dark:text-white mt-0.5">1,000,000,000</p>
                  <span className="text-[10px] text-[#0c5963] dark:text-[#38bdf8] font-mono">TFLX Hard Cap</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span className="text-[10px] font-bold text-[#718589] dark:text-[#94a3b8] uppercase block">CIRCULATING MINED</span>
                  <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">342,819,420</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">34.28% Minted</span>
                </div>
              </div>

              {/* Allocation list */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span>Community 12H Mining Sessions</span>
                  <span className="font-mono font-bold">60% (600M TFLX)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span>Referral Guilds & Welcome Grants</span>
                  <span className="font-mono font-bold">20% (200M TFLX)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span>TON Mainnet Liquidity Pools & DEX</span>
                  <span className="font-mono font-bold">15% (150M TFLX)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
                  <span>Security Reserve & Genesis Team</span>
                  <span className="font-mono font-bold">5% (50M TFLX)</span>
                </div>
              </div>

              <button
                onClick={() => setIsTokenomicsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold cursor-pointer"
              >
                Close Tokenomics
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: 24/7 AI COPILOT & SUPPORT CHAT                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAiSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] p-6 text-[#09353e] dark:text-white shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0] dark:border-[#173740]">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    24/7 Cloud Miner AI Copilot
                  </span>
                </div>
                <button
                  onClick={() => setIsAiSupportOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#0c5963] dark:text-[#38bdf8] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask anything about your Cloud Miner</span>
                </div>
                <p className="text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
                  Your 12-hour session accumulates TFLX hashrate yield continuously. You can bind your TON address for 2027 Mainnet, watch sponsored clips for immediate tokens, and ping your teammates to multiply your hourly hashrate.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#e4ded2] dark:border-[#173740] text-xs text-[#09353e] dark:text-white focus:outline-none focus:border-[#0c5963]"
                />
                <button
                  onClick={() => {
                    setCelebrationToast({
                      title: 'Support Query Dispatched',
                      message: 'AI Copilot response and guidance transmitted successfully.',
                    });
                    setIsAiSupportOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
