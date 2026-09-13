/**
 * TAEMRY FLUX - Team Rewards & Milestone Logic
 * Direct referral-based Team Rewards ladder and computation.
 * Personal Ads milestones have been completely retired per project owner mandate.
 */

export const TEAM_REWARDS = [
  { id: 'tr-5', referrals: 5, bonus: 1.00, label: '5 Referrals', extraInfo: 'Invite 5 members from your link' },
  { id: 'tr-15', referrals: 15, bonus: 3.00, label: '15 Referrals', extraInfo: '15 more members = 20 total' },
  { id: 'tr-25', referrals: 25, bonus: 5.00, label: '25 Referrals', extraInfo: '25 more members = 45 total' },
  { id: 'tr-50', referrals: 50, bonus: 10.00, label: '50 Referrals', extraInfo: '50 more members = 95 total' },
  { id: 'tr-100', referrals: 100, bonus: 20.00, label: '100 Referrals', extraInfo: '100 more members = 195 total' },
  { id: 'tr-250', referrals: 250, bonus: 40.00, label: '250 Referrals', extraInfo: '250 more members = 445 total' },
  { id: 'tr-500', referrals: 500, bonus: 100.00, label: '500 Referrals', extraInfo: '500 more members = 945 total' },
  { id: 'tr-1000', referrals: 1000, bonus: 250.00, label: '1,000 Referrals', extraInfo: '1000 more members = 1945 total' },
   { id: 'tr-1500', referrals: 1500, bonus: 500.00, label: '1,500 Referrals', extraInfo: 'Reach 3445 total direct downlines' },
  { id: 'tr-2500', referrals: 2500, bonus: 750.00, label: '2,500 Referrals', extraInfo: 'Reach 5945 total direct downlines' },
];

// Deprecated empty personal milestones preserved for legacy imports if any
export const PERSONAL_MILESTONES = [];

export const TEAM_MILESTONES = [
  { ads: 2500, bonus: 5.00, label: '2,500 Team Ads' },
  { ads: 5000, bonus: 10.00, label: '5,000 Team Ads' },
  { ads: 10000, bonus: 20.00, label: '10,000 Team Ads' },
  { ads: 20000, bonus: 40.00, label: '20,000 Team Ads' },
  { ads: 40000, bonus: 80.00, label: '40,000 Team Ads' },
  { ads: 80000, bonus: 160.00, label: '80,000 Team Ads' },
  { ads: 160000, bonus: 320.00, label: '160,000 Team Ads' },
  { ads: 320000, bonus: 640.00, label: '320,000 Team Ads' },
  { ads: 640000, bonus: 1280.00, label: '640,000 Team Ads' },
  { ads: 1280000, bonus: 2560.00, label: '1,280,000 Team Ads' },
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

