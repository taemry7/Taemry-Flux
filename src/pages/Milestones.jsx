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
  DollarSign,
  Clock,
  UserCheck,
  UserX,
  MessageCircle
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

  // Active rewards list synced with localStorage and live database
  const [activeRewardsList, setActiveRewardsList] = useState(() => {
    try {
      const cached = localStorage.getItem('taemry_custom_milestones');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.teamRewards) && parsed.teamRewards.length > 0) {
          return parsed.teamRewards;
        }
      }
    } catch (e) {}
    return TEAM_REWARDS;
  });

  const [milestoneStatus, setMilestoneStatus] = useState({
    teamRewards: {
      currentReferrals: 0,
      nextTier: { referralsRequired: 5, bonusAmount: 1.00, label: '5 Referrals' },
      progressPercentage: 0,
      claimableReward: null,
    },
    team: {
      currentAds: 0,
      nextMilestone: { adsRequired: 2500, bonusAmount: 10.00 },
      progressPercentage: 0,
      claimableMilestone: null,
    },
    claimedTeamRewards: [],
    claimedTeamMilestones: [],
    eligibleReferralsCount: 0,
    totalReferralsCount: 0,
    directReferrals: [],
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
        const data = resStatus.value.data;
        setMilestoneStatus(data);
        if (Array.isArray(data.rewardsList) && data.rewardsList.length > 0) {
          setActiveRewardsList(data.rewardsList);
          try {
            localStorage.setItem('taemry_custom_milestones', JSON.stringify({
              teamRewards: data.rewardsList,
              teamMilestones: data.teamMilestones || TEAM_MILESTONES,
            }));
          } catch (e) {}
        }
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

  // Listen for admin panel updates live in real-time
  useEffect(() => {
    const handleMilestonesUpdate = (e) => {
      if (e?.detail?.teamRewards && Array.isArray(e.detail.teamRewards)) {
        setActiveRewardsList(e.detail.teamRewards);
      } else {
        try {
          const cached = localStorage.getItem('taemry_custom_milestones');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.teamRewards)) {
              setActiveRewardsList(parsed.teamRewards);
            }
          }
        } catch (err) {}
      }
      fetchMilestoneData();
    };

    window.addEventListener('taemry_milestones_updated', handleMilestonesUpdate);
    window.addEventListener('storage', handleMilestonesUpdate);
    return () => {
      window.removeEventListener('taemry_milestones_updated', handleMilestonesUpdate);
      window.removeEventListener('storage', handleMilestonesUpdate);
    };
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

        setSuccessMessage(`Claimed $${Number(bonus).toFixed(2)} Team Ads Bonus! Credited directly to your wallet.`);

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

  // Direct Referral List & Eligibility Computation
  const rawDirectReferrals = (Array.isArray(milestoneStatus.directReferrals) && milestoneStatus.directReferrals.length > 0)
    ? milestoneStatus.directReferrals
    : (Array.isArray(referralInfo?.directReferrals) ? referralInfo.directReferrals : []);

  const directReferrals = rawDirectReferrals.map((d) => {
    const pkg = (d.package || d.currentPackage || '').trim();
    const hasPackage = Boolean(pkg && pkg !== 'None' && pkg !== 'No Package');
    const isEligible = Boolean(d.isEligible || hasPackage);
    return {
      ...d,
      package: hasPackage ? pkg : 'No Package',
      isEligible,
      status: isEligible ? 'Eligible' : 'Ineligible',
    };
  });

  const eligibleReferralsList = directReferrals.filter((r) => r.isEligible);
  const ineligibleReferralsList = directReferrals.filter((r) => !r.isEligible);

  // Only eligible referrals count towards progression
  const currentReferrals = eligibleReferralsList.length > 0
    ? eligibleReferralsList.length
    : (milestoneStatus.eligibleReferralsCount ?? milestoneStatus.teamRewards?.currentReferrals ?? 0);

  const totalReferrals = directReferrals.length > 0
    ? directReferrals.length
    : (milestoneStatus.totalReferralsCount ?? referralInfo?.referralCount ?? currentReferrals);

  // Ultra-short direct @username link integration
  const rawUsername = userStats?.username || currentUser?.displayName || referralInfo?.username || referralInfo?.referralCode || 'member';
  const cleanUsername = String(rawUsername).trim().replace(/^@/, '');
  const referralLink = `${window.location.origin}/@${cleanUsername}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TAEMRY FLUX',
          text: 'Join TAEMRY FLUX and start earning daily guaranteed ad returns and team cash bonuses!',
          url: referralLink,
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Join TAEMRY FLUX and earn daily ad returns and team cash bonuses: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const claimedRewardsSet = new Set((milestoneStatus.claimedTeamRewards || []).map(String));
  const claimedTeamAdsSet = new Set((milestoneStatus.claimedTeamMilestones || []).map(Number));

  const nextTier = activeRewardsList.find((t) => t.referrals > currentReferrals) || activeRewardsList[activeRewardsList.length - 1];
  const progressPct = nextTier ? Math.min(100, Math.round((currentReferrals / nextTier.referrals) * 100)) : 100;
  const claimableReward = activeRewardsList.find(
    (t) => currentReferrals >= t.referrals && !claimedRewardsSet.has(String(t.referrals)) && !claimedRewardsSet.has(t.id)
  );

  const totalPotentialRewards = activeRewardsList.reduce((acc, t) => acc + (Number(t.bonus) || 0), 0);

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
            Invite friends using your referral link. Unlock guaranteed cash rewards up to <strong>${totalPotentialRewards.toFixed(2)}</strong> credited directly to your live balance!
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
          {/* PRIMARY TEAM REWARDS CARD - STYLED IDENTICALLY TO TEAM ADS LADDER */}
          <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-7 border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center border border-[#b8dfd7] dark:border-[#173740]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#09353e] dark:text-white">Direct Referral Rewards</h3>
                    <p className="text-xs text-[#546b70] dark:text-[#94a3b8]">Cash bonuses when referred members activate any package</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-3 py-1 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
                  {formatNumber(currentReferrals)} Referrals
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#546b70] dark:text-[#94a3b8]">
                    Next Target: <strong>{nextTier?.referrals || 5} Direct Referrals</strong>
                  </span>
                  <span className="text-[#0c5963] dark:text-[#38bdf8] font-mono">
                    {progressPct}%
                  </span>
                </div>

                <div className="w-full h-3 bg-[#f0ece3] dark:bg-[#122b33] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#0c5963] to-[#0ea5e9] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#546b70] dark:text-[#94a3b8] pt-1">
                  Target Bonus: <strong>${Number(nextTier?.bonus || 1).toFixed(2)}</strong> unlocked when your organization reaches {nextTier?.referrals || 5} direct referrals.
                </p>
              </div>
            </div>

            <div>
              {claimableReward ? (
                <button
                  id="btn-claim-team-reward"
                  onClick={() => handleClaimReward(claimableReward.referrals, claimableReward.id)}
                  disabled={claimLoading}
                  className="w-full py-3.5 px-4 bg-linear-to-r from-[#0c5963] to-[#09424a] hover:from-[#09424a] hover:to-[#07363c] text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-[#0c5963]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    Claim ${Number(claimableReward.bonus).toFixed(2)} Team Rewards Bonus! ({claimableReward.label})
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 bg-[#f2ede4] dark:bg-[#081a20] text-[#718589] dark:text-[#627a7f] text-xs font-bold rounded-2xl border border-[#e4ded2] dark:border-[#173740] flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Next Referral Bonus at {nextTier?.referrals || 5} Direct Referrals</span>
                </div>
              )}
            </div>
          </div>

          {/* 1. HIDDEN PER USER DIRECTIVE: Referral Link Strip */}
          <div className="hidden">
            <div className="bg-linear-to-br from-[#0c5963] to-[#07363c] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                    Your Personal Link
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyLink}
                      title="Copy Link"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleShareLink}
                      title="Share Link"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      title="Share on WhatsApp"
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-black/30 rounded-2xl border border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-200/90 font-mono">
                    <span>Direct Link</span>
                    <span className="text-amber-300 font-bold">@{cleanUsername}</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded-xl text-xs font-mono font-bold text-white break-all select-all">
                    {referralLink}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] leading-relaxed text-emerald-100/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Eligibility Requirement</span>
                  </div>
                  <p>
                    Referred members must activate any advertising package to become <strong>Eligible</strong> and count toward your cash milestone tiers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15">
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-[#0c5963] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleShareLink}
                  className="py-2.5 px-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Share referral link"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Share via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. HIDDEN PER USER DIRECTIVE: Direct Referrals Status Directory (Package Eligibility List) */}
          <div className="hidden">
            <div className="p-5 sm:p-6 border-b border-[#ece4d6] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#faf8f5] dark:bg-[#081a20]">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span>Direct Referrals Status Directory</span>
                </h3>
                <p className="text-xs text-[#546b70] dark:text-[#94a3b8] mt-0.5">
                  Members registered through your link. Only members with an active package count toward cash milestone rewards.
                </p>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{eligibleReferralsList.length} Eligible</span>
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{ineligibleReferralsList.length} Ineligible (No Package)</span>
                </span>
                <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] bg-[#e6f4f1] dark:bg-[#0c262e] px-3 py-1 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
                  {directReferrals.length} Total
                </span>
              </div>
            </div>

            {/* Downlines Table or Empty State */}
            {directReferrals.length === 0 ? (
              <div className="p-8 sm:p-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f2ede4] dark:bg-[#122b33] text-[#718589] dark:text-[#94a3b8] flex items-center justify-center">
                  <Users className="w-7 h-7 opacity-70" />
                </div>
                <h4 className="text-sm font-bold text-[#09353e] dark:text-white">
                  No Direct Referrals Yet
                </h4>
                <p className="text-xs text-[#546b70] dark:text-[#94a3b8] max-w-md mx-auto">
                  Share your personal link to invite members. Once they register and activate any package, they will appear here as <strong>Eligible</strong> and immediately advance your Team Rewards ladder!
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-[#0c5963] text-white hover:bg-[#09424a] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={handleShareLink}
                    className="p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Link</span>
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ece4d6] dark:border-[#173740] text-[11px] font-black text-[#546b70] dark:text-[#94a3b8] uppercase tracking-wider bg-[#fbf9f6] dark:bg-[#0a1d24]">
                      <th className="py-3.5 px-4 sm:px-6">#</th>
                      <th className="py-3.5 px-4 sm:px-6">Member</th>
                      <th className="py-3.5 px-4 sm:px-6">Active Package</th>
                      <th className="py-3.5 px-4 sm:px-6">Joined Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Milestone Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece4d6] dark:divide-[#173740] text-xs">
                    {directReferrals.map((member, idx) => (
                      <tr
                        key={member.id || idx}
                        className={`transition-colors ${
                          member.isEligible
                            ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                            : 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-[#546b70] dark:text-[#94a3b8]">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-[#09353e] dark:text-white">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                member.isEligible
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              }`}
                            >
                              {(member.name || member.username || 'M')[0].toUpperCase()}
                            </div>
                            <div>
                              <span>{member.name || member.username || 'Member'}</span>
                              <span className="block text-[10px] font-mono text-[#718589] dark:text-[#627a7f]">
                                @{(member.username || member.name || 'member').replace(/^@/, '')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              member.isEligible
                                ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {member.package}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-[#546b70] dark:text-[#94a3b8] whitespace-nowrap">
                          {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          {member.isEligible ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Eligible</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Ineligible (No Package)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. HIDDEN PER USER DIRECTIVE: Full Team Rewards Configurable Ladder Table */}
          <div className="hidden">
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
                  Total Potential Rewards: <strong>${totalPotentialRewards.toFixed(2)} USD</strong>
                </span>
              </div>
            </div>

            {/* Ladder Table - Mapping over activeRewardsList */}
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
                  {activeRewardsList.map((tier, idx) => {
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
                            {formatNumber(tier.referrals)} Eligible Members
                          </div>
                          <span className="text-[10px] text-[#718589] dark:text-[#627a7f] block">
                            {tier.stepNote || tier.extraInfo}
                          </span>
                        </td>

                        {/* Cash Bonus */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                            <DollarSign className="w-3.5 h-3.5" />
                            {Number(tier.bonus).toFixed(2)} USD
                          </span>
                        </td>

                        {/* Progression Bar */}
                        <td className="py-4 px-4 sm:px-6 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#546b70] dark:text-[#94a3b8]">
                              <span>
                                {Math.min(currentReferrals, tier.referrals)} / {tier.referrals}
                              </span>
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
                              <span>Claim ${Number(tier.bonus).toFixed(2)}</span>
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
