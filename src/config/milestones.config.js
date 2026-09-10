/**
 * TAEMRY FLUX - Frontend Team Rewards & Milestone Configuration
 * Defines direct-referral Team Rewards ladder and helper utilities.
 * Personal Ads milestones have been retired in favor of Team Rewards.
 */

export const TEAM_REWARDS = [
  { id: 'tr-5', referrals: 5, bonus: 1.00, label: '5 Direct Referrals', stepNote: 'Invite 5 members from your link' },
  { id: 'tr-15', referrals: 15, bonus: 5.00, label: '15 Direct Referrals', stepNote: '10 more members (+10) = 15 total' },
  { id: 'tr-40', referrals: 40, bonus: 10.00, label: '40 Direct Referrals', stepNote: '25 more members (+25) = 40 total' },
  { id: 'tr-90', referrals: 90, bonus: 25.00, label: '90 Direct Referrals', stepNote: '50 more members (+50) = 90 total' },
  { id: 'tr-190', referrals: 190, bonus: 50.00, label: '190 Direct Referrals', stepNote: '100 more members (+100) = 190 total' },
  { id: 'tr-250', referrals: 250, bonus: 100.00, label: '250 Direct Referrals', stepNote: 'Reach 250 total direct downlines' },
  { id: 'tr-500', referrals: 500, bonus: 250.00, label: '500 Direct Referrals', stepNote: 'Reach 500 total direct downlines' },
  { id: 'tr-1000', referrals: 1000, bonus: 600.00, label: '1,000 Direct Referrals', stepNote: '$500 Base + $100 Special Mega Bonus ($600 Total)' },
];

// Empty legacy export to prevent import errors in older components
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
 * Format currency value nicely ($X.XX)
 */
export const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

/**
 * Format integer numbers with commas
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

