/**
 * TAEMRY FLUX - Frontend Milestone Configuration
 * Defines Personal and Team milestone arrays and progress helpers.
 */

export const PERSONAL_MILESTONES = [
  { ads: 1000, bonus: 5.00, label: '1,000 Ads' },
  { ads: 2500, bonus: 15.00, label: '2,500 Ads' },
  { ads: 5000, bonus: 35.00, label: '5,000 Ads' },
  { ads: 10000, bonus: 80.00, label: '10,000 Ads' },
  { ads: 25000, bonus: 220.00, label: '25,000 Ads' },
  { ads: 50000, bonus: 500.00, label: '50,000 Ads' },
  { ads: 100000, bonus: 1200.00, label: '100,000 Ads' },
  { ads: 250000, bonus: 3500.00, label: '250,000 Ads' },
  { ads: 500000, bonus: 8000.00, label: '500,000 Ads' },
];

export const TEAM_MILESTONES = [
  { ads: 2500, bonus: 10.00, label: '2,500 Team Ads' },
  { ads: 5000, bonus: 25.00, label: '5,000 Team Ads' },
  { ads: 10000, bonus: 60.00, label: '10,000 Team Ads' },
  { ads: 20000, bonus: 140.00, label: '20,000 Team Ads' },
  { ads: 40000, bonus: 300.00, label: '40,000 Team Ads' },
  { ads: 80000, bonus: 650.00, label: '80,000 Team Ads' },
  { ads: 160000, bonus: 1400.00, label: '160,000 Team Ads' },
  { ads: 320000, bonus: 3000.00, label: '320,000 Team Ads' },
  { ads: 640000, bonus: 6500.00, label: '640,000 Team Ads' },
  { ads: 1280000, bonus: 14000.00, label: '1.28M Team Ads' },
  { ads: 2560000, bonus: 30000.00, label: '2.56M Team Ads' },
  { ads: 5120000, bonus: 65000.00, label: '5.12M Team Ads' },
  { ads: 10240000, bonus: 150000.00, label: '10.24M Team Ads' },
];

/**
 * Format currency value nicely
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
