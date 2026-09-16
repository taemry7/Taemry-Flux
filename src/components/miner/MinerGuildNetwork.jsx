import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Radio,
  Share2,
  Copy,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { playMiningTruthSound } from '../../utils/audio';

const MOCK_TEAMMATES = [
  { id: 1, name: 'Tariq Mehmood', tier: 1, status: 'mining', hashrate: 16.0, rewardYield: '+4.0 TFLX/h', country: 'PK' },
  { id: 2, name: 'Sana Malik', tier: 1, status: 'mining', hashrate: 24.0, rewardYield: '+6.0 TFLX/h', country: 'PK' },
  { id: 3, name: 'Rashid Khan', tier: 1, status: 'idle', hashrate: 0.0, rewardYield: '0.0 (Idle)', country: 'AE' },
  { id: 4, name: 'Zeeshan Ali', tier: 2, status: 'mining', hashrate: 16.0, rewardYield: '+0.8 TFLX/h', country: 'PK' },
  { id: 5, name: 'Imran Bashir', tier: 2, status: 'idle', hashrate: 0.0, rewardYield: '0.0 (Idle)', country: 'SA' },
];

export default function MinerGuildNetwork({ currentUser, onSelectTab }) {
  const [teammates, setTeammates] = useState(MOCK_TEAMMATES);
  const [isPingedAll, setIsPingedAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = currentUser?.email?.split('@')[0] || 'MINER7';
  const referralLink = `${window.location.origin}/#/login/signup?ref=${encodeURIComponent(referralCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePingAll = () => {
    playMiningTruthSound();
    setIsPingedAll(true);
    // Wake up idle teammates in simulation
    setTeammates((prev) =>
      prev.map((t) => (t.status === 'idle' ? { ...t, status: 'pinged' } : t))
    );
    setTimeout(() => setIsPingedAll(false), 3500);
  };

  const activeCount = teammates.filter((t) => t.status === 'mining' || t.status === 'pinged').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                4. 2-Tier Guild Network (Tier 1 25% & Tier 2 5%)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740]">
                COLLABORATIVE MINING
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Mine together as a synchronized team. Earn 25% bonus from direct friends and 5% from sub-affiliates when active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePingAll}
            disabled={isPingedAll}
            className="px-4 py-2 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{isPingedAll ? 'Pings Sent to Team!' : 'Ping All Inactive Miners'}</span>
          </button>
        </div>
      </div>

      {/* 2-Tier Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tier 1 Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-white">
                Tier 1 (Direct Friends)
              </span>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#6ee7b7]">
              +25% Mining Boost
            </span>
          </div>
          <p className="text-xs text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
            Every direct invite that taps their 24h node contributes 25% of their mined reward rate directly to your hash yield in real time.
          </p>
          <div className="pt-2 border-t border-[#f0ebe0] dark:border-[#173740] flex justify-between text-xs font-semibold">
            <span className="text-[#718589] dark:text-[#94a3b8]">Active Tier 1 Miners</span>
            <span className="text-[#09353e] dark:text-white font-mono">2 / 3 Active</span>
          </div>
        </div>

        {/* Tier 2 Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0c5963] dark:bg-[#38bdf8]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-white">
                Tier 2 (Friends of Friends)
              </span>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8]">
              +5% Sub-Mining Boost
            </span>
          </div>
          <p className="text-xs text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
            When your Tier 1 friends expand the community by inviting their contacts, you receive an automated 5% passive hashrate contribution.
          </p>
          <div className="pt-2 border-t border-[#f0ebe0] dark:border-[#173740] flex justify-between text-xs font-semibold">
            <span className="text-[#718589] dark:text-[#94a3b8]">Active Tier 2 Miners</span>
            <span className="text-[#09353e] dark:text-white font-mono">1 / 2 Active</span>
          </div>
        </div>
      </div>

      {/* Share Invite Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-white">
          Your Mining Guild Invite Link
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] text-[#09353e] dark:text-white outline-hidden"
          />
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Teammates Directory */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-white">
            Guild Members Directory ({activeCount}/{teammates.length} Active)
          </h3>
          <span className="text-xs text-[#718589] dark:text-[#94a3b8]">
            Ping notification refreshes hourly
          </span>
        </div>

        <div className="divide-y divide-[#f0ebe0] dark:divide-[#173740] text-xs">
          {teammates.map((member) => (
            <div key={member.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#faf8f5] dark:bg-[#0c262e] border border-[#ece6d9] dark:border-[#173740] flex items-center justify-center font-bold text-[#0c5963] dark:text-[#38bdf8]">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
                    <span>{member.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-[#718589]">
                      Tier {member.tier}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#718589] dark:text-[#94a3b8]">
                    Contribution: {member.rewardYield}
                  </span>
                </div>
              </div>

              <div>
                {member.status === 'mining' ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#6ee7b7] font-bold text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Mining
                  </span>
                ) : member.status === 'pinged' ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#fefce8] dark:bg-[#2e2605] text-[#ca8a04] font-bold text-[11px] flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    Pinged
                  </span>
                ) : (
                  <button
                    onClick={handlePingAll}
                    className="px-2.5 py-1 rounded-full bg-[#fff7ed] dark:bg-[#2b1604] hover:bg-[#fed7aa] text-[#ea580c] font-bold text-[11px] cursor-pointer"
                  >
                    Nudge Ping
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => onSelectTab && onSelectTab('halving')}
            className="px-4 py-2 rounded-xl bg-[#0c5963] text-white text-xs font-bold hover:bg-[#08424b] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Proceed to 5. Halving Epochs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
