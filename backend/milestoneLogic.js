/**
 * TAEMRY FLUX - Team Rewards & Milestone Logic
 * Direct referral-based Team Rewards ladder and computation.
 * Personal Ads milestones have been completely retired per project owner mandate.
 */

export const TEAM_REWARDS = [
  { id: 'tr-5', referrals: 5, bonus: 1.00, label: '5 Referrals', extraInfo: 'Invite 5 members from your link' },
  { id: 'tr-15', referrals: 15, bonus: 5.00, label: '15 Referrals', extraInfo: '10 more members (+10) = 15 total' },
  { id: 'tr-40', referrals: 40, bonus: 10.00, label: '40 Referrals', extraInfo: '25 more members (+25) = 40 total' },
  { id: 'tr-90', referrals: 90, bonus: 25.00, label: '90 Referrals', extraInfo: '50 more members (+50) = 90 total' },
  { id: 'tr-190', referrals: 190, bonus: 50.00, label: '190 Referrals', extraInfo: '100 more members (+100) = 190 total' },
  { id: 'tr-250', referrals: 250, bonus: 100.00, label: '250 Referrals', extraInfo: 'Reach 250 total direct downlines' },
  { id: 'tr-500', referrals: 500, bonus: 250.00, label: '500 Referrals', extraInfo: 'Reach 500 total direct downlines' },
  { id: 'tr-1000', referrals: 1000, bonus: 600.00, label: '1,000 Referrals', extraInfo: '$500 + $100 Mega Bonus ($600 Total)' },
];

// Deprecated empty personal milestones preserved for legacy imports if any
export const PERSONAL_MILESTONES = [];

export const TEAM_MILESTONES = [
  { ads: 2500, bonus: 10.00, label: '2,500 Team Ads' },
  { ads: 5000, bonus: 25.00, label: '5,000 Team Ads' },
  { ads: 10000, bonus: 60.00, label: '10,000 Team Ads' },
  { ads: 20000, bonus: 140.00, label: '20,000 Team Ads' },
  { ads: 40000, bonus: 300.00, label: '40,000 Team Ads' },
  { ads: 80000, bonus: 650.00, label: '80,000 Team Ads' },
  { ads: 160000, bonus: 1400.00, label: '160,000 Team Ads' },
];

/**
 * Calculates user's progression across the Team Rewards ladder.
 */
export const calculateTeamRewardsStatus = (referralsCount = 0, claimedArray = [], rewardsList = TEAM_REWARDS) => {
  const count = Number(referralsCount) || 0;
  const claimedSet = new Set(claimedArray.map((x) => String(x)));
  const list = Array.isArray(rewardsList) && rewardsList.length > 0 ? rewardsList : TEAM_REWARDS;

  // Next target reward tier
  const nextTier = list.find((t) => t.referrals > count) || list[list.length - 1];

  // Highest achieved tier that is not claimed yet (or first unachieved)
  const claimableTier = list.find((t) => count >= t.referrals && !claimedSet.has(String(t.referrals)) && !claimedSet.has(t.id));

  const targetRefs = nextTier ? nextTier.referrals : 5;
  const progressPercentage = Math.min(100, Math.round((count / targetRefs) * 100));

  return {
    currentReferrals: count,
    nextTier: {
      referralsRequired: targetRefs,
      bonusAmount: nextTier ? nextTier.bonus : 0,
      label: nextTier ? nextTier.label : '',
    },
    progressPercentage,
    claimableReward: claimableTier ? {
      id: claimableTier.id,
      referralsRequired: claimableTier.referrals,
      bonusAmount: claimableTier.bonus,
      label: claimableTier.label,
    } : null,
  };
};

/**
 * Legacy milestone calculation helper
 */
export const calculateMilestoneStatus = (currentVal = 0, milestonesList = [], claimedArray = []) => {
  if (!milestonesList || milestonesList.length === 0) {
    return { currentAds: 0, nextMilestone: null, progressPercentage: 0, claimableMilestone: null };
  }
  const claimedSet = new Set(claimedArray.map(Number));
  const nextMilestone = milestonesList.find((m) => m.ads > currentVal) || milestonesList[milestonesList.length - 1];
  const nextClaimable = milestonesList.find((m) => currentVal >= m.ads && !claimedSet.has(m.ads));
  const targetAds = nextMilestone ? nextMilestone.ads : 2500;
  const progressPercentage = Math.min(100, Math.round((currentVal / targetAds) * 100));

  return {
    currentAds: Number(currentVal),
    nextMilestone: {
      adsRequired: targetAds,
      bonusAmount: nextMilestone ? nextMilestone.bonus : 0,
    },
    progressPercentage,
    claimableMilestone: nextClaimable ? {
      adsRequired: nextClaimable.ads,
      bonusAmount: nextClaimable.bonus,
      label: nextClaimable.label,
    } : null,
  };
};

