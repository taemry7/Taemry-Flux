/**
 * TAEMRY FLUX - Team Rewards & Milestone System
 * Replaces personal ads with direct referral Team Rewards ladder:
 * 5 refs -> $1 | 15 refs -> $5 | 40 refs -> $10 | 90 refs -> $25
 * 190 refs -> $50 | 250 refs -> $100 | 500 refs -> $250 | 1,000 refs -> $600 ($500 + $100 Bonus)
 */

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  TEAM_REWARDS,
  TEAM_MILESTONES,
  formatCurrency,
  formatNumber
} from '../config/milestones.config';

export default function Milestones({ onSelectTab }) {
  const { currentUser, userStats, updateLocalStats, fetchUserStats } = useAuth();

  const [milestoneStatus, setMilestoneStatus] = useState({
    teamRewards: {
      currentReferrals: userStats?.referralCount ?? 0,
      nextTier: { referralsRequired: 5, bonusAmount: 1.00, label: '5 Referrals' },
      progressPercentage: 0,
      claimableReward: null,
    },
    team: {
      currentAds: userStats?.teamAdsCount ?? 0,
      nextMilestone: { adsRequired: 2500, bonusAmount: 10.00 },
      progressPercentage: 0,
      claimableMilestone: null,
    },
    claimedTeamRewards: [],
    claimedTeamMilestones: [],
  });

  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('rewards'); // 'rewards' | 'team-ads'

  // Fetch milestone data & referral link
  const fetchMilestoneData = async () => {
    try {
      setLoading(true);
      const [resStatus, resRef] = await Promise.allSettled([
        apiClient.get('/milestones/status'),
        apiClient.get('/referrals/info'),
      ]);

      if (resStatus.status === 'fulfilled' && resStatus.value?.data?.success) {
        setMilestoneStatus(resStatus.value.data);
      }
      if (resRef.status === 'fulfilled' && resRef.value?.data?.success) {
        setReferralInfo(resRef.value.data);
      }
    } catch (err) {
      console.warn('Failed to load milestone data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestoneData();
  }, []);

  // Handle claiming Team Reward
  const handleClaimReward = async (referralsRequired = null, rewardId = null) => {
    try {
      setClaimLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await apiClient.post('/milestones/claim', {
        type: 'team-reward',
        referralsRequired,
        rewardId,
      });

      if (res.data?.success) {
        const bonus = res.data.bonus;
        const newBalance = res.data.newBalance;

        setSuccessMessage(`Claimed $${Number(bonus).toFixed(2)} Cash Reward! Credited directly to your wallet.`);

        // Instantly update AuthContext stats
        updateLocalStats({
          walletBalance: newBalance,
        });

        // Re-fetch milestone status and global stats
        await fetchMilestoneData();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error claiming team reward:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to claim Team Reward.');
    } finally {
      setClaimLoading(false);
    }
  };

  // Handle claiming Team Ads Milestone
  const handleClaimTeamAds = async (milestoneAds) => {
    try {
      setClaimLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await apiClient.post('/milestones/claim', {
        type: 'team',
        milestoneAds,
      });

      if (res.data?.success) {
        const bonus = res.data.bonus;
        const newBalance = res.data.newBalance;

        setSuccessMessage(`Claimed $${Number(bonus).toFixed(2)} Team Ads Bonus! Credited to your wallet.`);

        updateLocalStats({
          walletBalance: newBalance,
        });

        await fetchMilestoneData();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error claiming team ads milestone:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to claim milestone bonus.');
    } finally {
      setClaimLoading(false);
    }
  };

  // Referral link fallback
  const userReferralCode = referralInfo?.referralCode || userStats?.referralCode || (currentUser?.uid ? `FLUX-${currentUser.uid.substring(0, 6).toUpperCase()}` : 'FLUX-MEMBER');
  const referralLink = referralInfo?.referralLink || `${window.location.origin}/#/?ref=${userReferralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const claimedRewardsSet = new Set((milestoneStatus.claimedTeamRewards || []).map(String));
  const claimedTeamAdsSet = new Set((milestoneStatus.claimedTeamMilestones || []).map(Number));

  const currentReferrals = milestoneStatus.teamRewards?.currentReferrals ?? userStats?.referralCount ?? 0;
  const nextTier = milestoneStatus.teamRewards?.nextTier;
  const progressPct = milestoneStatus.teamRewards?.progressPercentage ?? 0;
  const claimableReward = milestoneStatus.teamRewards?.claimableReward;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7] dark:bg-[#0c262e] dark:border-[#173740] dark:text-[#38bdf8]">
              Cash Reward Ladders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] dark:text-white tracking-tight flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Team Rewards & Milestones</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#546b70] dark:text-[#94a3b8] mt-1">
            Invite friends using your referral link. Unlock guaranteed cash rewards up to <strong>$600.00</strong> credited directly to your live balance!
          </p>
        </div>

        {/* View Switcher: Team Rewards (Primary) vs Team Ads (Optional) */}
        <div className="flex items-center gap-1.5 bg-[#f0ece3] dark:bg-[#0a1b22] p-1 rounded-2xl border border-[#ded8cb] dark:border-[#173740] self-start sm:self-auto">
          <button
            onClick={() => setActiveViewTab('rewards')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'rewards'
                ? 'bg-white dark:bg-[#122b33] text-[#09353e] dark:text-white shadow-xs font-extrabold'
                : 'text-[#657d82] dark:text-[#94a3b8] hover:text-[#09353e]'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
            <span>Team Rewards</span>
          </button>
          <button
            onClick={() => setActiveViewTab('team-ads')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'team-ads'
                ? 'bg-white dark:bg-[#122b33] text-[#09353e] dark:text-white shadow-xs font-extrabold'
                : 'text-[#657d82] dark:text-[#94a3b8] hover:text-[#09353e]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Team Ads Ladder</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTICES */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex items-center justify-between text-xs sm:text-sm animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#059669]" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* PRIMARY TAB: TEAM REWARDS (Direct Referrals Cash Program) */}
      {activeViewTab === 'rewards' && (
        <div className="space-y-6">
          {/* Main Hero Card + Referral Link Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Progression & Claim Button */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-7 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center border border-[#b8dfd7] dark:border-[#173740]">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-[#09353e] dark:text-white">
                        Direct Referral Rewards
                      </h2>
                      <p className="text-xs text-[#546b70] dark:text-[#94a3b8]">
                        Unlock tier bonuses automatically when members join through your personal link.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#546b70] dark:text-[#94a3b8] block">
                      Active Referrals
                    </span>
                    <span className="text-2xl font-black text-[#0c5963] dark:text-[#38bdf8]">
                      {currentReferrals} <span className="text-xs font-semibold text-[#546b70] dark:text-[#94a3b8]">Members</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Next Target */}
                <div className="mt-5 p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#081a20] border border-[#ece4d6] dark:border-[#173740] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#09353e] dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#38bdf8]" />
                      Next Target: <strong>{nextTier?.referralsRequired || 5} Direct Referrals</strong>
                    </span>
                    <span className="text-[#0c5963] dark:text-[#38bdf8] font-mono text-sm">
                      {progressPct}%
                    </span>
                  </div>

                  <div className="w-full h-3.5 bg-[#e9e3d7] dark:bg-[#122b33] rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-linear-to-r from-[#0c5963] via-[#0ea5e9] to-[#10b981] rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(4, progressPct))}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-[#546b70] dark:text-[#94a3b8] pt-1">
                    <span>
                      Current: <strong>{currentReferrals}</strong> / {nextTier?.referralsRequired || 5} members
                    </span>
                    <span>
                      Target Reward: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">${Number(nextTier?.bonusAmount || 1).toFixed(2)} USD</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Claim Button */}
              <div>
                {claimableReward ? (
                  <button
                    id="btn-claim-team-reward"
                    onClick={() => handleClaimReward(claimableReward.referralsRequired, claimableReward.id)}
                    disabled={claimLoading}
                    className="w-full py-4 px-6 bg-linear-to-r from-[#0c5963] to-[#0d7380] hover:from-[#09424a] hover:to-[#0c5963] text-white text-sm font-black rounded-2xl shadow-lg shadow-[#0c5963]/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] border border-white/20"
                  >
                    <Gift className="w-5 h-5 animate-bounce" />
                    <span>
                      {claimLoading ? 'Processing Claim...' : `CLAIM $${Number(claimableReward.bonusAmount).toFixed(2)} CASH REWARD! (${claimableReward.label})`}
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#f2ede4] dark:bg-[#081a20] border border-[#e4ded2] dark:border-[#173740]">
                    <div className="flex items-center gap-2.5 text-xs text-[#546b70] dark:text-[#94a3b8]">
                      <Lock className="w-4 h-4 text-[#819599]" />
                      <span>
                        Next reward unlocks at <strong>{nextTier?.referralsRequired || 5} referrals</strong> ({Math.max(0, (nextTier?.referralsRequired || 5) - currentReferrals)} more needed).
                      </span>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-[#122b33] text-[#0c5963] dark:text-[#38bdf8] border border-[#b8dfd7] dark:border-[#173740] rounded-xl hover:bg-[#e6f4f1] transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? 'Link Copied!' : 'Share Referral Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Instant Referral Link & Share Card */}
            <div className="bg-linear-to-br from-[#0c5963] to-[#07363c] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                    Your Referral Gateway
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">Share Your Link</h3>
                <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                  Every friend who creates an account using your referral link counts directly toward your cash reward milestones.
                </p>

                {/* Referral Code & Copy Box */}
                <div className="mt-5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90 block mb-1">
                      Your Referral Code
                    </label>
                    <div className="px-3 py-2 bg-black/25 rounded-xl border border-white/15 font-mono text-sm font-bold text-amber-300">
                      {userReferralCode}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90 block mb-1">
                      Full Referral Link
                    </label>
                    <div className="p-2.5 bg-black/25 rounded-xl border border-white/15 text-[11px] font-mono break-all text-slate-100">
                      {referralLink}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-[#0c5963] font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Referral Link'}</span>
              </button>
            </div>
          </div>

          {/* Full Team Rewards 8-Tier Ladder Table */}
          <div className="bg-white dark:bg-[#0c2027] rounded-3xl border border-[#e4ded2] dark:border-[#173740] shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#ece4d6] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#faf8f5] dark:bg-[#081a20]">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span>Team Rewards Ladder Breakdown</span>
                </h3>
                <p className="text-xs text-[#546b70] dark:text-[#94a3b8] mt-0.5">
                  Complete referral milestone tiers with instant cash bonuses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-3 py-1 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
                  Total Potential Rewards: <strong>$1,041.00 USD</strong>
                </span>
              </div>
            </div>

            {/* Ladder Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ece4d6] dark:border-[#173740] text-[11px] font-black text-[#546b70] dark:text-[#94a3b8] uppercase tracking-wider bg-[#fbf9f6] dark:bg-[#0a1d24]">
                    <th className="py-3.5 px-4 sm:px-6">Tier #</th>
                    <th className="py-3.5 px-4 sm:px-6">Target Referrals</th>
                    <th className="py-3.5 px-4 sm:px-6">Cash Bonus ($)</th>
                    <th className="py-3.5 px-4 sm:px-6">Progression</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4d6] dark:divide-[#173740] text-xs">
                  {TEAM_REWARDS.map((tier, idx) => {
                    const isClaimed = claimedRewardsSet.has(String(tier.referrals)) || claimedRewardsSet.has(tier.id);
                    const isAchieved = currentReferrals >= tier.referrals;
                    const canClaimNow = isAchieved && !isClaimed;
                    const tierPct = Math.min(100, Math.round((currentReferrals / tier.referrals) * 100));

                    return (
                      <tr
                        key={tier.id || tier.referrals}
                        className={`transition-colors ${
                          canClaimNow
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20'
                            : isClaimed
                            ? 'bg-[#faf8f5]/40 dark:bg-[#07171d]/40 opacity-90'
                            : 'hover:bg-[#faf8f5] dark:hover:bg-[#091f27]'
                        }`}
                      >
                        {/* Tier Number & Badge */}
                        <td className="py-4 px-4 sm:px-6 font-bold text-[#09353e] dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#f0ece3] dark:bg-[#122b33] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center text-[11px] font-black">
                              {idx + 1}
                            </span>
                            <span>{tier.label}</span>
                          </div>
                        </td>

                        {/* Target Referrals */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="font-bold text-[#09353e] dark:text-white">
                            {formatNumber(tier.referrals)} Members
                          </div>
                          <span className="text-[10px] text-[#718589] dark:text-[#627a7f] block">
                            {tier.stepNote}
                          </span>
                        </td>

                        {/* Cash Bonus */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                            <DollarSign className="w-3.5 h-3.5" />
                            {tier.bonus.toFixed(2)} USD
                          </span>
                        </td>

                        {/* Progression Bar */}
                        <td className="py-4 px-4 sm:px-6 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#546b70] dark:text-[#94a3b8]">
                              <span>{Math.min(currentReferrals, tier.referrals)} / {tier.referrals}</span>
                              <span>{tierPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#ece4d6] dark:bg-[#122b33] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isAchieved ? 'bg-emerald-500' : 'bg-[#0c5963] dark:bg-[#38bdf8]'
                                }`}
                                style={{ width: `${tierPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status / Claim Button */}
                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Claimed</span>
                            </span>
                          ) : canClaimNow ? (
                            <button
                              onClick={() => handleClaimReward(tier.referrals, tier.id)}
                              disabled={claimLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 animate-pulse"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Claim ${tier.bonus.toFixed(2)}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f2ede4] dark:bg-[#122b33] text-[#718589] dark:text-[#94a3b8] border border-[#e4ded2] dark:border-[#173740]">
                              <Lock className="w-3 h-3 text-[#819599]" />
                              <span>{tier.referrals - currentReferrals} more to unlock</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY TAB: TEAM ADS LADDER (Downline Advertising Watches) */}
      {activeViewTab === 'team-ads' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-7 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#fef3c7] dark:bg-amber-950/40 text-[#d97706] flex items-center justify-center border border-[#fde68a] dark:border-amber-800/40">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#09353e] dark:text-white">Team Ads Organization Milestones</h3>
                    <p className="text-xs text-[#546b70] dark:text-[#94a3b8]">Unlimited depth downline ad views</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#b45309] bg-[#fef3c7] dark:bg-amber-950/50 px-3 py-1 rounded-full border border-[#fde68a] dark:border-amber-800/50">
                  {formatNumber(milestoneStatus.team?.currentAds)} Team Ads
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#546b70] dark:text-[#94a3b8]">
                    Next Target: <strong>{formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} Team Ads</strong>
                  </span>
                  <span className="text-[#d97706] font-mono">
                    {milestoneStatus.team?.progressPercentage}%
                  </span>
                </div>

                <div className="w-full h-3 bg-[#f0ece3] dark:bg-[#122b33] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#e89b27] to-[#f59e0b] rounded-full transition-all duration-700"
                    style={{ width: `${milestoneStatus.team?.progressPercentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#546b70] dark:text-[#94a3b8] pt-1">
                  Target Bonus: <strong>${milestoneStatus.team?.nextMilestone?.bonusAmount?.toFixed(2)}</strong> unlocked when your organization reaches {formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} team ads.
                </p>
              </div>
            </div>

            <div>
              {milestoneStatus.team?.claimableMilestone ? (
                <button
                  id="btn-claim-team"
                  onClick={() => handleClaimTeamAds(milestoneStatus.team.claimableMilestone.adsRequired)}
                  disabled={claimLoading}
                  className="w-full py-3.5 px-4 bg-linear-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-[#d97706]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    Claim ${milestoneStatus.team.claimableMilestone.bonusAmount?.toFixed(2)} Team Ads Bonus! ({formatNumber(milestoneStatus.team.claimableMilestone.adsRequired)} Ads)
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 bg-[#f2ede4] dark:bg-[#081a20] text-[#718589] dark:text-[#627a7f] text-xs font-bold rounded-2xl border border-[#e4ded2] dark:border-[#173740] flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Next Team Ads Bonus at {formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} Ads</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
