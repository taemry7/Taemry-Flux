/**
 * TAEMRY FLUX - Milestone System Page (Phase 3)
 * Displays Personal and Team milestone progress bars, claim buttons,
 * and full milestone ladders with live claiming and wallet updates.
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Gift
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PERSONAL_MILESTONES,
  TEAM_MILESTONES,
  formatCurrency,
  formatNumber
} from '../config/milestones.config';

export default function Milestones({ onSelectTab }) {
  const { userStats, updateLocalStats, fetchUserStats } = useAuth();

  const [milestoneStatus, setMilestoneStatus] = useState({
    personal: {
      currentAds: userStats?.lifetimeAds ?? 0,
      nextMilestone: { adsRequired: 1000, bonusAmount: 5.00 },
      progressPercentage: 0,
      claimableMilestone: null,
    },
    team: {
      currentAds: userStats?.teamAdsCount ?? 0,
      nextMilestone: { adsRequired: 2500, bonusAmount: 10.00 },
      progressPercentage: 0,
      claimableMilestone: null,
    },
    claimedPersonalMilestones: [],
    claimedTeamMilestones: [],
  });

  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeViewTab, setActiveViewTab] = useState('both'); // 'both' | 'personal' | 'team'

  // Fetch milestone status from API
  const fetchMilestoneData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/milestones/status');
      if (res.data?.success) {
        setMilestoneStatus(res.data);
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

  // Handle claiming milestone
  const handleClaim = async (type, milestoneAds = null) => {
    try {
      setClaimLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await apiClient.post('/milestones/claim', {
        type,
        milestoneAds,
      });

      if (res.data?.success) {
        const bonus = res.data.bonus;
        const newBalance = res.data.newBalance;

        setSuccessMessage(`Claimed $${bonus.toFixed(2)} Bonus! Credited to your wallet.`);

        // Instantly update AuthContext stats
        updateLocalStats({
          walletBalance: newBalance,
        });

        // Re-fetch milestone status and global stats
        await fetchMilestoneData();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error claiming milestone:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to claim milestone bonus.');
    } finally {
      setClaimLoading(false);
    }
  };

  const claimedPersonalSet = new Set((milestoneStatus.claimedPersonalMilestones || []).map(Number));
  const claimedTeamSet = new Set((milestoneStatus.claimedTeamMilestones || []).map(Number));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Bonus Ladders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Milestone Rewards & Ladder System
          </h1>
        </div>

        {/* View Filter */}
        <div className="flex items-center gap-1.5 bg-[#f0ece3] p-1 rounded-2xl border border-[#ded8cb] self-start sm:self-auto">
          <button
            onClick={() => setActiveViewTab('both')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeViewTab === 'both'
                ? 'bg-white text-[#09353e] shadow-xs'
                : 'text-[#657d82] hover:text-[#09353e]'
            }`}
          >
            All Ladders
          </button>
          <button
            onClick={() => setActiveViewTab('personal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeViewTab === 'personal'
                ? 'bg-white text-[#09353e] shadow-xs'
                : 'text-[#657d82] hover:text-[#09353e]'
            }`}
          >
            Personal Ads
          </button>
          <button
            onClick={() => setActiveViewTab('team')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeViewTab === 'team'
                ? 'bg-white text-[#09353e] shadow-xs'
                : 'text-[#657d82] hover:text-[#09353e]'
            }`}
          >
            Team Ads
          </button>
        </div>
      </div>

      {/* FEEDBACK TOASTS */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex items-center justify-between text-xs sm:text-sm animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#059669]" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TWO PRIMARY PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. PERSONAL MILESTONES CARD */}
        {(activeViewTab === 'both' || activeViewTab === 'personal') && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#09353e]">Personal Milestone</h3>
                    <p className="text-xs text-[#627a7f]">Based on your lifetime ads watched</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-1 rounded-full border border-[#b8dfd7]">
                  {formatNumber(milestoneStatus.personal?.currentAds)} Ads
                </span>
              </div>

              {/* Progress Display */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#526d72]">
                    Next Target: <strong>{formatNumber(milestoneStatus.personal?.nextMilestone?.adsRequired)} Ads</strong>
                  </span>
                  <span className="text-[#0c5963] font-mono">
                    {milestoneStatus.personal?.progressPercentage}%
                  </span>
                </div>

                <div className="w-full h-3 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#0c5963] to-[#148391] rounded-full transition-all duration-700"
                    style={{ width: `${milestoneStatus.personal?.progressPercentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#6d8286] pt-1">
                  Target Bonus: <strong>${milestoneStatus.personal?.nextMilestone?.bonusAmount?.toFixed(2)}</strong> credited directly to balance upon reaching {formatNumber(milestoneStatus.personal?.nextMilestone?.adsRequired)} ads.
                </p>
              </div>
            </div>

            {/* Claim Action or Status */}
            <div>
              {milestoneStatus.personal?.claimableMilestone ? (
                <button
                  id="btn-claim-personal"
                  onClick={() => handleClaim('personal', milestoneStatus.personal.claimableMilestone.adsRequired)}
                  disabled={claimLoading}
                  className="w-full py-3.5 px-4 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-[#0c5963]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    Claim ${milestoneStatus.personal.claimableMilestone.bonusAmount?.toFixed(2)} Bonus! ({formatNumber(milestoneStatus.personal.claimableMilestone.adsRequired)} Ads)
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#f2ede4] text-[#819599] text-xs font-bold rounded-2xl cursor-not-allowed border border-[#e4ded2] flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Next Bonus at {formatNumber(milestoneStatus.personal?.nextMilestone?.adsRequired)} Ads</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. TEAM MILESTONES CARD */}
        {(activeViewTab === 'both' || activeViewTab === 'team') && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#09353e]">Team Milestone</h3>
                    <p className="text-xs text-[#627a7f]">Unlimited depth downline ads</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-full border border-[#fde68a]">
                  {formatNumber(milestoneStatus.team?.currentAds)} Team Ads
                </span>
              </div>

              {/* Progress Display */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#526d72]">
                    Next Target: <strong>{formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} Team Ads</strong>
                  </span>
                  <span className="text-[#d97706] font-mono">
                    {milestoneStatus.team?.progressPercentage}%
                  </span>
                </div>

                <div className="w-full h-3 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#e89b27] to-[#f59e0b] rounded-full transition-all duration-700"
                    style={{ width: `${milestoneStatus.team?.progressPercentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#6d8286] pt-1">
                  Target Bonus: <strong>${milestoneStatus.team?.nextMilestone?.bonusAmount?.toFixed(2)}</strong> unlocked when your organization reaches {formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} team ads.
                </p>
              </div>
            </div>

            {/* Claim Action or Status */}
            <div>
              {milestoneStatus.team?.claimableMilestone ? (
                <button
                  id="btn-claim-team"
                  onClick={() => handleClaim('team', milestoneStatus.team.claimableMilestone.adsRequired)}
                  disabled={claimLoading}
                  className="w-full py-3.5 px-4 bg-[#e89b27] hover:bg-[#d48817] text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-[#e89b27]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    Claim ${milestoneStatus.team.claimableMilestone.bonusAmount?.toFixed(2)} Team Bonus! ({formatNumber(milestoneStatus.team.claimableMilestone.adsRequired)} Ads)
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#f2ede4] text-[#819599] text-xs font-bold rounded-2xl cursor-not-allowed border border-[#e4ded2] flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Next Bonus at {formatNumber(milestoneStatus.team?.nextMilestone?.adsRequired)} Team Ads</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* COMPLETE MILESTONE LADDERS */}
      <div className="space-y-6">
        {/* PERSONAL LADDER TABLE */}
        {(activeViewTab === 'both' || activeViewTab === 'personal') && (
          <div className="bg-white rounded-3xl border border-[#e4ded2] shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#eee8dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#09353e]">
                  Personal Milestones Ladder (1,000 to 500,000 Ads)
                </h3>
                <p className="text-xs text-[#627a7f] mt-0.5">
                  Milestones are calculated from your personal cumulative ad watches
                </p>
              </div>

              <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-3 py-1 rounded-full border border-[#b8dfd7] self-start sm:self-auto">
                Current: {formatNumber(milestoneStatus.personal?.currentAds)} Ads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf8f5] text-[11px] font-bold uppercase tracking-wider text-[#73888c] border-b border-[#eee8dd]">
                    <th className="py-3.5 px-6">Milestone Level</th>
                    <th className="py-3.5 px-6">Required Lifetime Ads</th>
                    <th className="py-3.5 px-6">Bonus Amount</th>
                    <th className="py-3.5 px-6 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ede4] text-xs">
                  {PERSONAL_MILESTONES.map((tier, idx) => {
                    const isClaimed = claimedPersonalSet.has(tier.ads);
                    const isAchieved = (milestoneStatus.personal?.currentAds || 0) >= tier.ads;
                    const isClaimable = isAchieved && !isClaimed;

                    return (
                      <tr
                        key={tier.ads}
                        className={`transition-colors ${
                          isClaimable
                            ? 'bg-[#ecfdf5]/60 hover:bg-[#ecfdf5]'
                            : isClaimed
                            ? 'bg-[#faf8f5]/40 opacity-75'
                            : 'hover:bg-[#faf8f5]'
                        }`}
                      >
                        <td className="py-4 px-6 font-bold text-[#09353e]">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#f0ece3] text-[#556e73] flex items-center justify-center text-[10px] font-mono">
                              #{idx + 1}
                            </span>
                            <span>{tier.label}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono font-semibold text-[#09353e]">
                          {formatNumber(tier.ads)} views
                        </td>

                        <td className="py-4 px-6 font-mono font-bold text-[#0c5963] text-sm">
                          ${tier.bonus.toFixed(2)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#64748b]" />
                              <span>Claimed</span>
                            </span>
                          ) : isClaimable ? (
                            <button
                              onClick={() => handleClaim('personal', tier.ads)}
                              disabled={claimLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0c5963] hover:bg-[#08424b] text-white shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Claim ${tier.bonus.toFixed(2)}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f4efe6] text-[#8c9ea2]">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
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
        )}

        {/* TEAM LADDER TABLE */}
        {(activeViewTab === 'both' || activeViewTab === 'team') && (
          <div className="bg-white rounded-3xl border border-[#e4ded2] shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#eee8dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#09353e]">
                  Team Milestones Ladder (2,500 to 10.24M Team Ads)
                </h3>
                <p className="text-xs text-[#627a7f] mt-0.5">
                  Accumulated across your entire downline organization with unlimited depth
                </p>
              </div>

              <span className="text-xs font-bold text-[#b45309] bg-[#fef3c7] px-3 py-1 rounded-full border border-[#fde68a] self-start sm:self-auto">
                Current: {formatNumber(milestoneStatus.team?.currentAds)} Team Ads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf8f5] text-[11px] font-bold uppercase tracking-wider text-[#73888c] border-b border-[#eee8dd]">
                    <th className="py-3.5 px-6">Milestone Level</th>
                    <th className="py-3.5 px-6">Required Team Ads</th>
                    <th className="py-3.5 px-6">Bonus Amount</th>
                    <th className="py-3.5 px-6 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ede4] text-xs">
                  {TEAM_MILESTONES.map((tier, idx) => {
                    const isClaimed = claimedTeamSet.has(tier.ads);
                    const isAchieved = (milestoneStatus.team?.currentAds || 0) >= tier.ads;
                    const isClaimable = isAchieved && !isClaimed;

                    return (
                      <tr
                        key={tier.ads}
                        className={`transition-colors ${
                          isClaimable
                            ? 'bg-[#fefce8]/80 hover:bg-[#fefce8]'
                            : isClaimed
                            ? 'bg-[#faf8f5]/40 opacity-75'
                            : 'hover:bg-[#faf8f5]'
                        }`}
                      >
                        <td className="py-4 px-6 font-bold text-[#09353e]">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#f0ece3] text-[#556e73] flex items-center justify-center text-[10px] font-mono">
                              #{idx + 1}
                            </span>
                            <span>{tier.label}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono font-semibold text-[#09353e]">
                          {formatNumber(tier.ads)} team views
                        </td>

                        <td className="py-4 px-6 font-mono font-bold text-[#d97706] text-sm">
                          ${formatNumber(tier.bonus)}.00
                        </td>

                        <td className="py-4 px-6 text-right">
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#64748b]" />
                              <span>Claimed</span>
                            </span>
                          ) : isClaimable ? (
                            <button
                              onClick={() => handleClaim('team', tier.ads)}
                              disabled={claimLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#e89b27] hover:bg-[#d48817] text-white shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Claim ${tier.bonus.toFixed(2)}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f4efe6] text-[#8c9ea2]">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
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
        )}
      </div>
    </div>
  );
}
