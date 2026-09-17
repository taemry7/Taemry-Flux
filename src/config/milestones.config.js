/**
 * TAEMRY FLUX - Frontend Team Rewards & Milestone Configuration
 * Defines direct-referral Team Rewards ladder and helper utilities.
 * Personal Ads milestones have been retired in favor of Team Rewards.
 */

export const TEAM_REWARDS = [
  { id: 'tr-5', referrals: 5, bonus: 1.00, label: '5 Referrals', extraInfo: 'Invite 5 members from your link', stepNote: 'Invite 5 members from your link' },
  { id: 'tr-15', referrals: 15, bonus: 3.00, label: '15 Referrals', extraInfo: '15 more members = 20 total', stepNote: '15 more members = 20 total' },
  { id: 'tr-25', referrals: 25, bonus: 5.00, label: '25 Referrals', extraInfo: '25 more members = 45 total', stepNote: '25 more members = 45 total' },
  { id: 'tr-50', referrals: 50, bonus: 10.00, label: '50 Referrals', extraInfo: '50 more members = 95 total', stepNote: '50 more members = 95 total' },
  { id: 'tr-100', referrals: 100, bonus: 20.00, label: '100 Referrals', extraInfo: '100 more members = 195 total', stepNote: '100 more members = 195 total' },
  { id: 'tr-250', referrals: 250, bonus: 40.00, label: '250 Referrals', extraInfo: '250 more members = 445 total', stepNote: '250 more members = 445 total' },
  { id: 'tr-500', referrals: 500, bonus: 100.00, label: '500 Referrals', extraInfo: '500 more members = 945 total', stepNote: '500 more members = 945 total' },
  { id: 'tr-1000', referrals: 1000, bonus: 250.00, label: '1,000 Referrals', extraInfo: '1000 more members = 1945 total', stepNote: '1000 more members = 1945 total' },
  { id: 'tr-1500', referrals: 1500, bonus: 500.00, label: '1,500 Referrals', extraInfo: 'Reach 3445 total direct downlines', stepNote: 'Reach 3445 total direct downlines' },
  { id: 'tr-2500', referrals: 2500, bonus: 750.00, label: '2,500 Referrals', extraInfo: 'Reach 5945 total direct downlines', stepNote: 'Reach 5945 total direct downlines' },
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

