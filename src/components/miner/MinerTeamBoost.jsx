import React, { useState } from 'react';
import { Users, Bell, Share2, Copy, Check, Sparkles, UserCheck, Shield, ArrowRight } from 'lucide-react';

export default function MinerTeamBoost({
  user,
  userStats,
  minerData,
  onPingInactive,
}) {
  const [copied, setCopied] = useState(false);
  const [pingCooldown, setPingCooldown] = useState(false);
  const [pingMessage, setPingMessage] = useState(null);

  const referralCode = user?.referralCode || user?.id?.substring(0, 8) || 'TFLX88';
  const referralLink = `${window.location.origin}/#/signup?ref=${referralCode}`;

  const { tier1Active = 2, tier1Total = 3, tier2Active = 4, tier2Total = 6, lastPingTime = 0 } = minerData;

  // Calculate live boost from team:
  // Tier 1: +25% base rate per active member = 16 * 0.25 = +4 TFLX/h each
  // Tier 2: +5% base rate per active member = 16 * 0.05 = +0.8 TFLX/h each
  const tier1BoostRate = tier1Active * 4.0;
  const tier2BoostRate = tier2Active * 0.8;
  const totalTeamBoostRate = tier1BoostRate + tier2BoostRate;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePing = () => {
    if (pingCooldown) return;
    onPingInactive();
    setPingCooldown(true);
    setPingMessage('Push notification ping sent to all inactive team members!');
    setTimeout(() => {
      setPingMessage(null);
    }, 4000);
    setTimeout(() => {
      setPingCooldown(false);
    }, 15000); // UI cooldown demonstration
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#ece6d9] dark:border-[#173740]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#09353e] dark:text-[#f1f5f9]">
              2-Tier Guild Network Boost
            </h2>
          </div>
          <p className="text-xs text-[#6e8286] dark:text-[#94a3b8] mt-1 max-w-lg">
            Earn extra mining hashrate when your guild members are actively running their 12h sessions.
          </p>
        </div>

        {/* Total Team Hashrate Bonus */}
        <div className="bg-[#faf8f5] dark:bg-[#07151a] p-3 rounded-2xl border border-[#e4ded2] dark:border-[#173740] flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#7a8c94] dark:text-[#94a3b8] uppercase tracking-wider block">
              Team Hashrate
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#0c5963] dark:text-[#38bdf8] leading-none">
              +{totalTeamBoostRate.toFixed(1)} TFLX/h
            </span>
          </div>
          <Sparkles className="w-5 h-5 text-teal-500" />
        </div>
      </div>

      {/* 2-Tier Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tier 1 Card */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tier 1 (Direct Friends)
            </span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              +25% per active
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div>
              <span className="text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                {tier1Active}
              </span>
              <span className="text-xs text-[#7a8c94] dark:text-[#64748b] ml-1">
                / {tier1Total} Active Miners
              </span>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              +{tier1BoostRate.toFixed(1)} TFLX/h
            </span>
          </div>
        </div>

        {/* Tier 2 Card */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Tier 2 (Extended Friends)
            </span>
            <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400">
              +5% per active
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div>
              <span className="text-2xl font-extrabold text-[#09353e] dark:text-[#f1f5f9]">
                {tier2Active}
              </span>
              <span className="text-xs text-[#7a8c94] dark:text-[#64748b] ml-1">
                / {tier2Total} Active Miners
              </span>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              +{tier2BoostRate.toFixed(1)} TFLX/h
            </span>
          </div>
        </div>
      </div>

      {/* Ping Inactive Members Action */}
      <div className="p-4 rounded-2xl bg-[#fffbeb] dark:bg-[#1a160d] border border-[#fde68a] dark:border-[#3d2f13] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9]">
              Ping Inactive Team Members
            </h3>
            <p className="text-[11px] text-[#786c57] dark:text-[#94a3b8] mt-0.5">
              Team members who forgot to tap the 12h reactor can be alerted once every 12 hours.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-ping-inactive"
          onClick={handlePing}
          disabled={pingCooldown}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer ${
            pingCooldown
              ? 'bg-[#e4ded2] dark:bg-[#252525] text-[#8e9fa2] cursor-not-allowed'
              : 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm shadow-amber-500/20'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{pingCooldown ? 'Ping Sent (Cooldown)' : 'Ping Inactive (12h)'}</span>
        </button>
      </div>

      {pingMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{pingMessage}</span>
        </div>
      )}

      {/* Referral Link & Share Box */}
      <div className="pt-2">
        <span className="text-xs font-bold text-[#09353e] dark:text-[#f1f5f9] block mb-2">
          Your Mining Referral Link
        </span>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#07151a] border border-[#ece6d9] dark:border-[#173740] font-mono text-xs text-[#546b70] dark:text-[#94a3b8] truncate">
            {referralLink}
          </div>
          <button
            type="button"
            id="btn-copy-miner-link"
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
