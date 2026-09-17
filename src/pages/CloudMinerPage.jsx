import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Menu,
  X,
  LayoutGrid,
  CheckCircle2,
  BellRing,
  Database,
  AlertCircle,
  Package,
  ArrowDownCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/firebase.config';
import MinerTapButton from '../components/miner/MinerTapButton';
import MinerPreStaking from '../components/miner/MinerPreStaking';
import MinerTeamBoost from '../components/miner/MinerTeamBoost';
import MinerDayOffs from '../components/miner/MinerDayOffs';
import MinerSevenDayCheckIn from '../components/miner/MinerSevenDayCheckIn';

const LOCAL_STORAGE_KEY = 'taemry_tflx_miner_data';

export default function CloudMinerPage({ onNavigate }) {
  const { currentUser, userStats } = useAuth();
  const { showToast } = useToast();

  const isPackageActive = Boolean(userStats?.currentPackage && userStats?.currentPackage !== 'None');

  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'reactor' | 'pre-staking' | 'guild' | 'protection'
  const [isMinerMenuOpen, setIsMinerMenuOpen] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  // Listen to Navbar menu button toggle
  useEffect(() => {
    const handleToggle = () => setIsMinerMenuOpen((prev) => !prev);
    const handleOpen = () => setIsMinerMenuOpen(true);
    const handleClose = () => setIsMinerMenuOpen(false);

    window.addEventListener('taemry_toggle_miner_menu', handleToggle);
    window.addEventListener('taemry_open_miner_menu', handleOpen);
    window.addEventListener('taemry_close_miner_menu', handleClose);

    return () => {
      window.removeEventListener('taemry_toggle_miner_menu', handleToggle);
      window.removeEventListener('taemry_open_miner_menu', handleOpen);
      window.removeEventListener('taemry_close_miner_menu', handleClose);
    };
  }, []);

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
        const baseMined = (!isNaN(existing) && existing >= 0) ? existing : 0;
        return {
          ...parsed,
          minedTflx: Number((baseMined + addedCoins).toFixed(2)),
          lastSyncTime: now,
        };
      }
    } catch (e) {
      console.error('Failed to parse miner state:', e);
    }

    // Default 12-hour session (clean initial reset state)
    const now = Date.now();
    return {
      minedTflx: 0.00,
      isMiningActive: false,
      sessionStartTime: 0,
      sessionDurationMs: 12 * 60 * 60 * 1000, // 12 hours
      committedYears: 0,
      committedAllocation: 0,
      preStakingBoost: 0,
      tier1Active: 0,
      tier1Total: 0,
      tier2Active: 0,
      tier2Total: 0,
      dayOffsCount: 0,
      streakDays: 0,
      claimedCheckInDays: [],
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

  // Persist to local storage (throttled every 5 seconds to keep the UI super fast & responsive)
  const lastLocalSaveRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastLocalSaveRef.current > 5000) {
      lastLocalSaveRef.current = now;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          ...minerData,
          effectiveHashrate,
        }));
      } catch (e) {}
    }
  }, [minerData, effectiveHashrate]);

  // Ensure final save on window unload / unmount
  useEffect(() => {
    const saveImmediately = () => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          ...minerData,
          effectiveHashrate,
        }));
      } catch (e) {}
    };
    window.addEventListener('beforeunload', saveImmediately);
    return () => {
      saveImmediately();
      window.removeEventListener('beforeunload', saveImmediately);
    };
  }, [minerData, effectiveHashrate]);

  // Firestore 'cloudMiner' collection sync state
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'local'

  // Helper to persist state to Firestore collection 'cloudMiner'
  const syncToFirestore = useCallback((dataToSync) => {
    if (!currentUser?.uid || !isFirebaseConfigured) return;
    try {
      const docRef = doc(db, 'cloudMiner', currentUser.uid);
      setDoc(
        docRef,
        {
          ...dataToSync,
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          effectiveHashrate,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
        .then(() => setFirestoreSyncStatus('synced'))
        .catch((err) => console.warn('[Firestore cloudMiner sync warning]:', err?.message));
    } catch (e) {
      console.warn('[Firestore sync call error]:', e);
    }
  }, [currentUser?.uid, currentUser?.email, effectiveHashrate]);

  // Load and hydrate from Firestore collection 'cloudMiner'
  useEffect(() => {
    if (!currentUser?.uid || !isFirebaseConfigured) {
      setFirestoreSyncStatus('local');
      return;
    }

    let isMounted = true;
    const docRef = doc(db, 'cloudMiner', currentUser.uid);

    getDoc(docRef)
      .then((snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const remote = snap.data();
          const now = Date.now();
          const lastSync = remote.lastSyncTime || now;
          const elapsedSeconds = Math.max(0, (now - lastSync) / 1000);
          const sessionDuration = remote.sessionDurationMs || (12 * 60 * 60 * 1000);
          const sessionElapsed = now - (remote.sessionStartTime || now);

          let addedCoins = 0;
          let isMiningStillActive = remote.isMiningActive;
          if (remote.isMiningActive) {
            const effectiveRate = remote.effectiveHashrate || 16.0;
            if (sessionElapsed < sessionDuration) {
              addedCoins = (effectiveRate / 3600) * elapsedSeconds;
            } else {
              const remainingActiveSec = Math.max(0, (sessionDuration - (lastSync - remote.sessionStartTime)) / 1000);
              addedCoins = (effectiveRate / 3600) * remainingActiveSec;
              isMiningStillActive = false;
            }
          }

          const existing = Number(remote.minedTflx);
          const baseMined = (!isNaN(existing) && existing >= 0) ? existing : 0.00;
          setMinerData((prev) => ({
            ...prev,
            ...remote,
            minedTflx: Number((baseMined + addedCoins).toFixed(4)),
            isMiningActive: isMiningStillActive,
            lastSyncTime: now,
          }));
          setFirestoreSyncStatus('synced');
        } else {
          // Initialize user's cloudMiner document in Firestore
          const initialPayload = {
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            minedTflx: 0.00,
            isMiningActive: false,
            sessionStartTime: 0,
            sessionDurationMs: 12 * 60 * 60 * 1000,
            committedYears: 0,
            committedAllocation: 0,
            preStakingBoost: 0,
            effectiveHashrate: 16.0,
            tier1Active: 0,
            tier1Total: 0,
            tier2Active: 0,
            tier2Total: 0,
            dayOffsCount: 0,
            streakDays: 0,
            claimedCheckInDays: [],
            slashedCoins: 0,
            lastSyncTime: Date.now(),
            lastPingTime: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDoc(docRef, initialPayload, { merge: true })
            .then(() => {
              if (isMounted) setFirestoreSyncStatus('synced');
            })
            .catch(() => {
              if (isMounted) setFirestoreSyncStatus('local');
            });
        }
      })
      .catch((err) => {
        console.warn('[Firestore cloudMiner fetch error]:', err?.message);
        if (isMounted) setFirestoreSyncStatus('local');
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Periodic background synchronization to Firestore collection 'cloudMiner' (every 30s to keep app responsive)
  useEffect(() => {
    if (!currentUser?.uid || !isFirebaseConfigured) return;
    const timer = setInterval(() => {
      setMinerData((current) => {
        syncToFirestore(current);
        return current;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [currentUser?.uid, syncToFirestore]);

  // Handlers
  const handleStartMining = () => {
    if (!isPackageActive) {
      showToast('Ineligible to Mine: Package buy karne ke baad ye eligible aur activate hoga.', 'error');
      return;
    }
    const now = Date.now();
    const updated = {
      ...minerData,
      isMiningActive: true,
      sessionStartTime: now,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      lastSyncTime: now,
      streakDays: minerData.streakDays + 1,
      // If streak reached multiple of 6, give +1 Day-Off
      dayOffsCount: ((minerData.streakDays + 1) % 6 === 0) ? minerData.dayOffsCount + 1 : minerData.dayOffsCount,
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast('12-Hour Cloud Mining session ignited! Green 3D Reactor active.', 'success');
  };

  const handleRenewSessionEarly = () => {
    if (!isPackageActive) {
      showToast('Ineligible to Mine: Package buy karne ke baad ye eligible aur activate hoga.', 'error');
      return;
    }
    const now = Date.now();
    const updated = {
      ...minerData,
      isMiningActive: true,
      sessionStartTime: now,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      lastSyncTime: now,
      streakDays: minerData.streakDays + 1,
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast('Early Check-In successful! New 12-hour session restarted without breaking streak.', 'success');
  };

  const handleCommitPreStaking = ({ years, allocation, boostPercent }) => {
    const updated = {
      ...minerData,
      committedYears: years,
      committedAllocation: allocation,
      preStakingBoost: boostPercent,
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast(`Pre-Staking Boost of +${boostPercent}% committed!`, 'success');
  };

  const handlePingInactive = () => {
    const updated = {
      ...minerData,
      lastPingTime: Date.now(),
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast('Push alert sent to all inactive team members!', 'info');
  };

  const handleResurrectCoins = () => {
    const updated = {
      ...minerData,
      minedTflx: Number((minerData.minedTflx + minerData.slashedCoins).toFixed(4)),
      slashedCoins: 0,
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast('Slashed coins resurrected and restored to node balance!', 'success');
  };

  const handleClaimCheckIn = (day, reward) => {
    const alreadyClaimed = (minerData.claimedCheckInDays || []).includes(day);
    if (alreadyClaimed) return;

    const newClaimed = [...(minerData.claimedCheckInDays || []), day];
    const givesDayOff = day === 7;
    const updated = {
      ...minerData,
      minedTflx: Number((minerData.minedTflx + reward).toFixed(4)),
      claimedCheckInDays: newClaimed,
      dayOffsCount: givesDayOff ? minerData.dayOffsCount + 1 : minerData.dayOffsCount,
    };
    setMinerData(updated);
    syncToFirestore(updated);
    showToast(`Day ${day} check-in reward claimed: +${reward} TFLX!`, 'success');
  };

  // Menu Items for Cloud Miner (1 to All)
  const menuItems = [
    {
      id: 'all',
      title: 'All Overview',
      subtitle: 'Show all 1 to 4 miner modules',
      icon: <LayoutGrid className="w-4 h-4" />,
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'reactor',
      title: '1. Tap-to-Mine Cycle (12h)',
      subtitle: '3D Reactor & 12H lifecycle',
      icon: <Flame className="w-4 h-4" />,
      iconBg: 'bg-[#0c5963]/15 text-[#0c5963] dark:text-[#38bdf8]',
    },
    {
      id: 'pre-staking',
      title: '2. Pre-Staking & Boost (+250%)',
      subtitle: 'Lock allocation yield multiplier',
      icon: <Lock className="w-4 h-4" />,
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'guild',
      title: '3. 2-Tier Guild Network',
      subtitle: 'Active miner team commissions',
      icon: <Users className="w-4 h-4" />,
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    },
    {
      id: 'protection',
      title: '4. Day-Offs & Slashing',
      subtitle: 'Protection shield & streak restore',
      icon: <ShieldCheck className="w-4 h-4" />,
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    },
  ];

  const nowTime = Date.now();
  const sessionElapsedMs = nowTime - (minerData.sessionStartTime || nowTime);
  const sessionTotalDuration = minerData.sessionDurationMs || (12 * 60 * 60 * 1000);
  const isSessionActive = Boolean(minerData.isMiningActive && sessionElapsedMs < sessionTotalDuration);

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] dark:bg-[#07151a] text-[#112d35] dark:text-[#ecf3f4] pt-4 sm:pt-6 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Cloud Miner Dedicated Menu Drawer (1 to All) */}
      {isMinerMenuOpen && (
        <div
          id="minerMenuBackdrop"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs cursor-pointer transition-opacity"
          onClick={() => setIsMinerMenuOpen(false)}
          aria-label="Close Miner Menu"
        />
      )}

      <aside
        id="cloudMinerMenuDrawer"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-[#091f27] border-r border-[#e4ded2] dark:border-[#173740] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMinerMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#d97706]">
              <Pickaxe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d97706] block">
                TAEMRY FLUX
              </span>
              <h2 className="text-sm font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                Cloud Miner Menu
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-miner-menu"
            onClick={() => setIsMinerMenuOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#7a8c94] dark:text-[#94a3b8] hover:bg-[#faf8f5] dark:hover:bg-[#112d36] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (1 to All) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#7a8c94] dark:text-[#94a3b8]">
            Miner Navigation &bull; 1 to All
          </div>

          {menuItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`btn-miner-menu-${item.id}`}
                onClick={() => {
                  setActiveSubTab(item.id);
                  setIsMinerMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0c5963] text-white shadow-sm font-bold'
                    : 'bg-[#faf8f5]/60 dark:bg-[#07151a]/60 text-[#09353e] dark:text-[#ecf3f4] hover:bg-[#ece6d9] dark:hover:bg-[#112d36]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : item.iconBg
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isActive ? 'text-white' : 'text-[#09353e] dark:text-[#f1f5f9]'
                      }`}
                    >
                      {item.title}
                    </p>
                    <span
                      className={`text-[10px] block ${
                        isActive ? 'text-white/80' : 'text-[#7a8c94] dark:text-[#94a3b8]'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Status */}
        <div className="p-4 border-t border-[#ece6d9] dark:border-[#173740] bg-[#faf8f5] dark:bg-[#07151a]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase">
              Effective Hashrate
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              +{effectiveHashrate.toFixed(1)} TFLX/h
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase">
              Mined Yield
            </span>
            <span className="font-black text-[#09353e] dark:text-[#f1f5f9]">
              {minerData.minedTflx.toFixed(2)} TFLX
            </span>
          </div>
        </div>
      </aside>

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

        {/* Hero Header Card: Mined Hash Balance & Live Hashrate (Made compact per user request) */}
        <div className="w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-sm relative overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#d97706]/15 to-[#ea580c]/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Bar inside Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ece6d9] dark:border-[#173740]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    isSessionActive
                      ? 'bg-amber-500/15 border-amber-500/30 text-[#d97706]'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <motion.div
                    animate={
                      isSessionActive
                        ? {
                            rotate: [0, -36, 12, -26, 0],
                            y: [0, -2, 2, -1, 0],
                          }
                        : { rotate: 0, y: 0 }
                    }
                    transition={{
                      repeat: isSessionActive ? Infinity : 0,
                      duration: 0.9,
                      ease: 'easeInOut',
                    }}
                    className="flex items-center justify-center"
                  >
                    <Pickaxe
                      className={`w-4 h-4 ${
                        isSessionActive
                          ? 'text-[#d97706]'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    />
                  </motion.div>
                </div>
                <div>
                  <span className="text-[11px] font-black tracking-widest text-[#d97706] uppercase block">
                    TAEMRY FLUX
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9] tracking-tight">
                    TLFX Token
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <div
                  id="badge-firestore-cloudminer"
                  className="hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-2xs"
                  title="Backed by Firestore collection 'cloudMiner'"
                >
                  <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">Firestore: cloudMiner</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${firestoreSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                </div>

                <button
                  type="button"
                  id="btn-miner-updates-coming-soon"
                  onClick={() => {
                    setShowUpdatesModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#faf8f5] dark:bg-[#07151a] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 border border-[#ece6d9] dark:border-[#173740] hover:border-amber-500/40 text-[#09353e] dark:text-[#f1f5f9] transition-all cursor-pointer shadow-2xs group"
                  title="Coming Soon Updates"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <BellRing className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] whitespace-nowrap">
                    Updates Coming Soon
                  </span>
                </button>
              </div>
            </div>

            {/* Main Showcase: Big Mined Balance (Smooth rounded and compact) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#faf8f5] dark:bg-[#07151a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#ece6d9] dark:border-[#173740]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider">
                    Total Mined Reward Balance
                  </span>
                </div>

                {/* Giant Typography for Mined Balance */}
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#09353e] dark:text-[#f8fafc] tracking-tight tabular-nums">
                    {minerData.minedTflx.toFixed(2)}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#ea580c]">
                    TFLX
                  </span>
                </div>

                {/* Real-time USD Valuation */}
                <p className="text-xs sm:text-sm font-semibold text-[#6e8286] dark:text-[#94a3b8] flex items-center gap-1.5">
                  <span>&asymp; ${(minerData.minedTflx * 0.7).toFixed(2)} USD</span>
                  <span className="hidden text-[10px] text-[#94a3b8] dark:text-[#64748b]">&bull; Target Listing Value</span>
                </p>

                {/* Hashrate moved under valuation span & made smaller per user request */}
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1 pt-0.5">
                  <span>+{effectiveHashrate.toFixed(1)} TFLX/h</span>
                </p>
              </div>

              {/* Hashrate - Hidden per user request: "or ye div 27 wala ko hidden kardo" */}
              <div className="hidden rounded-2xl bg-white dark:bg-[#0a1b22] border border-[#ece6d9] dark:border-[#173740] shadow-2xs px-4 py-2.5 shrink-0">
                <span className="hidden text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider">
                  Effective Speed
                </span>
                <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                  +{effectiveHashrate.toFixed(1)} <span className="text-xs font-bold">TFLX/h</span>
                </p>
              </div>
            </div>

            {/* Extra New Features Grid (Hidden per user request: "is div ko bi hidden kardo ok") */}

          </div>
        </div>

        {/* Ineligible to Mine Gate if user has no package */}
        {!isPackageActive && (
          <div
            id="cloud-miner-ineligible-gate"
            className="w-full bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-8 border-2 border-amber-500/30 dark:border-amber-500/30 shadow-xs mb-8 text-center max-w-2xl mx-auto"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2 uppercase tracking-wider">
              <span>Ineligible to Mine</span>
              <span>•</span>
              <span>Package Required</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#09353e] dark:text-white mb-2">
              Ineligible to Mine
            </h3>

            <p className="text-xs sm:text-sm text-[#526b70] dark:text-[#94a3b8] mb-5 leading-relaxed max-w-lg mx-auto">
              Package buy karne ke baad ye eligible aur activate hoga. To start live cloud mining and earn TFLX tokens, please activate an advertising package.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                id="btn-miner-ineligible-buy"
                onClick={() => onNavigate && onNavigate('dashboard', 'buy-package')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Buy Package to Activate Mining</span>
              </button>
              <button
                type="button"
                id="btn-miner-ineligible-deposit"
                onClick={() => onNavigate && onNavigate('dashboard', 'deposit')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#122e37] text-[#09353e] dark:text-white border border-[#d8d1c3] dark:border-[#1e4854] text-xs sm:text-sm font-bold rounded-xl hover:bg-[#f8f5ee] transition-all cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Deposit Funds</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: 3D TAP-TO-MINE REACTOR (12H CYCLE & EARLY CHECK-IN) */}
        {(activeSubTab === 'all' || activeSubTab === 'reactor') && (
          <div className="w-full bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col items-center">
            <MinerTapButton
              minerData={minerData}
              onStartMining={handleStartMining}
              onRenewSessionEarly={handleRenewSessionEarly}
              effectiveHashrate={effectiveHashrate}
              isPackageActive={isPackageActive}
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
                  {/* Segment 1: Blue (Green 3D replaced with Blue per user request) */}
                  <div className="p-4 flex flex-col justify-between space-y-2 bg-blue-500/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Pickaxe className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        0 - 6 Hours (Blue)
                      </h4>
                      <p className="text-[11px] text-[#6e8286] dark:text-[#94a3b8] mt-1 leading-relaxed">
                        Active cloud mining running at full hashrate. Continuous coin generation with zero battery usage.
                      </p>
                    </div>
                  </div>

                  {/* Segment 2: Orange (3D removed per user request) */}
                  <div className="p-4 flex flex-col justify-between space-y-2 bg-amber-500/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        6 - 12 Hours (Orange)
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
        {(activeSubTab === 'all' || activeSubTab === 'pre-staking') && (
          <div className="w-full">
            <MinerPreStaking
              minerData={minerData}
              onCommitPreStaking={handleCommitPreStaking}
            />
          </div>
        )}

        {/* TAB 3: 2-TIER GUILD NETWORK */}
        {(activeSubTab === 'all' || activeSubTab === 'guild') && (
          <div className="w-full">
            <MinerTeamBoost
              user={currentUser}
              minerData={minerData}
              onPingInactive={handlePingInactive}
            />
          </div>
        )}

        {/* TAB 4: DAY-OFFS & SLASHING */}
        {(activeSubTab === 'all' || activeSubTab === 'protection') && (
          <div className="w-full">
            <MinerDayOffs
              minerData={minerData}
              onResurrectCoins={handleResurrectCoins}
            />
          </div>
        )}

      </div>

      {/* Coming Soon Updates Modal */}
      <AnimatePresence>
        {showUpdatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpdatesModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#0a1f27] border border-[#e4ded2] dark:border-[#173740] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#173740]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      TAEMRY FLUX
                    </span>
                    <h3 className="text-lg font-black text-[#09353e] dark:text-[#f8fafc] tracking-tight">
                      Coming Soon Updates
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-close-updates-modal"
                  onClick={() => setShowUpdatesModal(false)}
                  className="p-1.5 rounded-xl text-[#7a8c94] dark:text-[#94a3b8] hover:bg-[#faf8f5] dark:hover:bg-[#112d36] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-[#546b70] dark:text-[#94a3b8] leading-relaxed">
                  Exciting new upgrades and decentralized protocol features are actively being developed for your Cloud Mining experience:
                </p>

                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        On-Chain Smart Staking Pools
                      </h4>
                      <p className="text-[11px] text-[#7a8c94] dark:text-[#94a3b8] mt-0.5">
                        Stake mined TFLX tokens directly to unlock multiplier hash boost tiers.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        Real-Time Guild Hashrate Sync
                      </h4>
                      <p className="text-[11px] text-[#7a8c94] dark:text-[#94a3b8] mt-0.5">
                        Live visual tracking for Tier 1 & Tier 2 active downline mining contributions.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
                        Web3 Non-Custodial Wallet Connect
                      </h4>
                      <p className="text-[11px] text-[#7a8c94] dark:text-[#94a3b8] mt-0.5">
                        Seamlessly withdraw and trade TFLX on decentralized liquidity pools upon listing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-confirm-updates-modal"
                onClick={() => setShowUpdatesModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#b45309] hover:to-[#c2410c] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
