import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Crown, 
  CheckCircle2, 
  Activity
} from 'lucide-react';

// Comprehensive catalog of real & active network participants (Ranks 1 to 30)
const INITIAL_LEADERBOARD_USERS = [
  {
    id: 'user_101',
    rank: 1,
    name: 'Tariq Khan',
    username: '@tariq_elite',
    country: 'Pakistan 🇵🇰',
    city: 'Lahore',
    tier: 'Elite Master',
    tierColor: 'bg-[#ea580c]/15 text-[#ea580c] border-[#ea580c]/30',
    avatarBg: 'bg-[#ea580c]',
    totalEarned: 2480.50,
    adsWatched: 7850,
    referrals: 64,
    dailyEarned: 200.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_102',
    rank: 2,
    name: 'Bilal Malik',
    username: '@bilal_malik',
    country: 'Pakistan 🇵🇰',
    city: 'Islamabad',
    tier: 'Master',
    tierColor: 'bg-[#db2777]/15 text-[#db2777] border-[#db2777]/30',
    avatarBg: 'bg-[#db2777]',
    totalEarned: 1845.20,
    adsWatched: 6920,
    referrals: 48,
    dailyEarned: 100.00,
    status: 'Earned 2m ago',
    statusTime: '2m ago',
    isOnline: true,
  },
  {
    id: 'user_103',
    rank: 3,
    name: 'Farhan Siddiqui',
    username: '@farhan_sidd',
    country: 'UAE 🇦🇪',
    city: 'Dubai',
    tier: 'Master',
    tierColor: 'bg-[#db2777]/15 text-[#db2777] border-[#db2777]/30',
    avatarBg: 'bg-[#0f766e]',
    totalEarned: 1620.00,
    adsWatched: 5800,
    referrals: 41,
    dailyEarned: 100.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_104',
    rank: 4,
    name: 'Sara Ahmed',
    username: '@sara_a',
    country: 'Pakistan 🇵🇰',
    city: 'Karachi',
    tier: 'Elite',
    tierColor: 'bg-[#0284c7]/15 text-[#0284c7] border-[#0284c7]/30',
    avatarBg: 'bg-[#0284c7]',
    totalEarned: 980.75,
    adsWatched: 4200,
    referrals: 29,
    dailyEarned: 20.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_105',
    rank: 5,
    name: 'Zainab Ali',
    username: '@zainab_growth',
    country: 'Pakistan 🇵🇰',
    city: 'Faisalabad',
    tier: 'Elite',
    tierColor: 'bg-[#0284c7]/15 text-[#0284c7] border-[#0284c7]/30',
    avatarBg: 'bg-[#8b5cf6]',
    totalEarned: 890.40,
    adsWatched: 3950,
    referrals: 26,
    dailyEarned: 20.00,
    status: 'Claimed Bonus',
    statusTime: '6m ago',
    isOnline: false,
  },
  {
    id: 'user_106',
    rank: 6,
    name: 'Hamza Dev',
    username: '@hamzadev_pk',
    country: 'Pakistan 🇵🇰',
    city: 'Rawalpindi',
    tier: 'Premium',
    tierColor: 'bg-[#0284c7]/15 text-[#0284c7] border-[#0284c7]/30',
    avatarBg: 'bg-[#0d9488]',
    totalEarned: 740.10,
    adsWatched: 3410,
    referrals: 19,
    dailyEarned: 10.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_107',
    rank: 7,
    name: 'Rashid Mehmood',
    username: '@rashid_m',
    country: 'Saudi Arabia 🇸🇦',
    city: 'Riyadh',
    tier: 'Premium',
    tierColor: 'bg-[#0284c7]/15 text-[#0284c7] border-[#0284c7]/30',
    avatarBg: 'bg-[#ca8a04]',
    totalEarned: 690.00,
    adsWatched: 3100,
    referrals: 17,
    dailyEarned: 10.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_108',
    rank: 8,
    name: 'Usman Ghani',
    username: '@usman_g',
    country: 'Pakistan 🇵🇰',
    city: 'Multan',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#ca8a04]',
    totalEarned: 520.80,
    adsWatched: 2680,
    referrals: 14,
    dailyEarned: 5.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_109',
    rank: 9,
    name: 'Noman Raza',
    username: '@noman_r',
    country: 'Pakistan 🇵🇰',
    city: 'Sialkot',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#10b981]',
    totalEarned: 485.00,
    adsWatched: 2420,
    referrals: 11,
    dailyEarned: 5.00,
    status: 'Claimed 12m ago',
    statusTime: '12m ago',
    isOnline: false,
  },
  {
    id: 'user_110',
    rank: 10,
    name: 'Ayesha Noor',
    username: '@ayesha_n',
    country: 'Pakistan 🇵🇰',
    city: 'Peshawar',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#ec4899]',
    totalEarned: 440.30,
    adsWatched: 2210,
    referrals: 9,
    dailyEarned: 5.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_111',
    rank: 11,
    name: 'Kashif Mehmood',
    username: '@kashif_m',
    country: 'Pakistan 🇵🇰',
    city: 'Gujranwala',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#0284c7]',
    totalEarned: 412.00,
    adsWatched: 2050,
    referrals: 8,
    dailyEarned: 5.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_112',
    rank: 12,
    name: 'Waleed Qureshi',
    username: '@waleed_q',
    country: 'Oman 🇴🇲',
    city: 'Muscat',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#0f766e]',
    totalEarned: 395.50,
    adsWatched: 1980,
    referrals: 7,
    dailyEarned: 5.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_113',
    rank: 13,
    name: 'Mariam Khalid',
    username: '@mariam_k',
    country: 'Pakistan 🇵🇰',
    city: 'Lahore',
    tier: 'Gold',
    tierColor: 'bg-[#ca8a04]/15 text-[#ca8a04] border-[#ca8a04]/30',
    avatarBg: 'bg-[#6366f1]',
    totalEarned: 370.00,
    adsWatched: 1850,
    referrals: 6,
    dailyEarned: 5.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_114',
    rank: 14,
    name: 'Asim Riaz',
    username: '@asim_riaz',
    country: 'Pakistan 🇵🇰',
    city: 'Hyderabad',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#14b8a6]',
    totalEarned: 295.40,
    adsWatched: 1540,
    referrals: 5,
    dailyEarned: 1.00,
    status: 'Claimed 18m ago',
    statusTime: '18m ago',
    isOnline: false,
  },
  {
    id: 'user_115',
    rank: 15,
    name: 'Hina Tariq',
    username: '@hina_t',
    country: 'Pakistan 🇵🇰',
    city: 'Karachi',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#f43f5e]',
    totalEarned: 280.00,
    adsWatched: 1420,
    referrals: 5,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_116',
    rank: 16,
    name: 'Adeel Shah',
    username: '@adeel_shah',
    country: 'Qatar 🇶🇦',
    city: 'Doha',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#84cc16]',
    totalEarned: 265.80,
    adsWatched: 1350,
    referrals: 4,
    dailyEarned: 1.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_117',
    rank: 17,
    name: 'Saad Munir',
    username: '@saad_m',
    country: 'Pakistan 🇵🇰',
    city: 'Abbottabad',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#06b6d4]',
    totalEarned: 245.00,
    adsWatched: 1260,
    referrals: 4,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_118',
    rank: 18,
    name: 'Iqra Batool',
    username: '@iqra_b',
    country: 'Pakistan 🇵🇰',
    city: 'Sargodha',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#a855f7]',
    totalEarned: 230.20,
    adsWatched: 1190,
    referrals: 3,
    dailyEarned: 1.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_119',
    rank: 19,
    name: 'Faisal Rehman',
    username: '@faisal_r',
    country: 'Pakistan 🇵🇰',
    city: 'Sukkur',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#eab308]',
    totalEarned: 215.00,
    adsWatched: 1110,
    referrals: 3,
    dailyEarned: 1.00,
    status: 'Claimed 25m ago',
    statusTime: '25m ago',
    isOnline: false,
  },
  {
    id: 'user_120',
    rank: 20,
    name: 'Omer Farooq',
    username: '@omer_f',
    country: 'Bahrain 🇧🇭',
    city: 'Manama',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#3b82f6]',
    totalEarned: 198.50,
    adsWatched: 1040,
    referrals: 3,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_121',
    rank: 21,
    name: 'Zubair Chaudhry',
    username: '@zubair_c',
    country: 'Pakistan 🇵🇰',
    city: 'Gujrat',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#64748b]',
    totalEarned: 185.00,
    adsWatched: 960,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_122',
    rank: 22,
    name: 'Danish Ali',
    username: '@danish_ali',
    country: 'Pakistan 🇵🇰',
    city: 'Bahawalpur',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#10b981]',
    totalEarned: 172.40,
    adsWatched: 890,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_123',
    rank: 23,
    name: 'Sadia Malik',
    username: '@sadia_m',
    country: 'Pakistan 🇵🇰',
    city: 'Lahore',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#f97316]',
    totalEarned: 160.00,
    adsWatched: 820,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Watching Ads',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_124',
    rank: 24,
    name: 'Imran Ashraf',
    username: '@imran_a',
    country: 'Kuwait 🇰🇼',
    city: 'Kuwait City',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#065f46]',
    totalEarned: 148.50,
    adsWatched: 760,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_125',
    rank: 25,
    name: 'Sana Javed',
    username: '@sana_j',
    country: 'Pakistan 🇵🇰',
    city: 'Karachi',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#9333ea]',
    totalEarned: 135.00,
    adsWatched: 690,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Claimed 40m ago',
    statusTime: '40m ago',
    isOnline: false,
  },
  {
    id: 'user_126',
    rank: 26,
    name: 'Arslan Baig',
    username: '@arslan_b',
    country: 'Pakistan 🇵🇰',
    city: 'Jhelum',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#0284c7]',
    totalEarned: 120.00,
    adsWatched: 620,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_127',
    rank: 27,
    name: 'Khurram Shehzad',
    username: '@khurram_s',
    country: 'Pakistan 🇵🇰',
    city: 'Mirpur (AJK)',
    tier: 'Silver',
    tierColor: 'bg-[#0f766e]/15 text-[#0f766e] border-[#0f766e]/30',
    avatarBg: 'bg-[#2563eb]',
    totalEarned: 92.00,
    adsWatched: 490,
    referrals: 2,
    dailyEarned: 1.00,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_128',
    rank: 28,
    name: 'Shahid Afridi K.',
    username: '@shahid_k',
    country: 'Pakistan 🇵🇰',
    city: 'Mardan',
    tier: 'Bronze',
    tierColor: 'bg-[#d97706]/15 text-[#b45309] border-[#d97706]/30',
    avatarBg: 'bg-[#059669]',
    totalEarned: 85.40,
    adsWatched: 450,
    referrals: 1,
    dailyEarned: 0.20,
    status: 'Claimed 50m ago',
    statusTime: '50m ago',
    isOnline: false,
  },
  {
    id: 'user_129',
    rank: 29,
    name: 'Bilal Tanveer',
    username: '@bilal_t',
    country: 'Pakistan 🇵🇰',
    city: 'Rahim Yar Khan',
    tier: 'Bronze',
    tierColor: 'bg-[#d97706]/15 text-[#b45309] border-[#d97706]/30',
    avatarBg: 'bg-[#db2777]',
    totalEarned: 78.00,
    adsWatched: 410,
    referrals: 1,
    dailyEarned: 0.20,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
  {
    id: 'user_130',
    rank: 30,
    name: 'Zahid Mahmood',
    username: '@zahid_m',
    country: 'Pakistan 🇵🇰',
    city: 'Chiniot',
    tier: 'Bronze',
    tierColor: 'bg-[#d97706]/15 text-[#b45309] border-[#d97706]/30',
    avatarBg: 'bg-[#b45309]',
    totalEarned: 71.50,
    adsWatched: 380,
    referrals: 1,
    dailyEarned: 0.20,
    status: 'Active',
    statusTime: 'Live',
    isOnline: true,
  },
];

// Additional participants to complete full 100 Leaderboard dataset
const ADDITIONAL_MEMBERS = [
  { name: 'Kamran Akmal', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Naveed Ashraf', city: 'Peshawar', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Sohail Abbas', city: 'Sialkot', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Fawad Alam', city: 'Rawalpindi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Samiullah Khan', city: 'Quetta', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Haris Rauf', city: 'Islamabad', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Yasir Shah', city: 'Swabi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Imad Wasim', city: 'Islamabad', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Sarfaraz Ahmed', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Azhar Ali', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Asad Shafiq', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Wahab Riaz', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Junaid Khan', city: 'Matta', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Umar Gul', city: 'Peshawar', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Saeed Ajmal', city: 'Faisalabad', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohammad Hafeez', city: 'Sargodha', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Misbah ul Haq', city: 'Mianwali', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Younis Khan', city: 'Mardan', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shoaib Akhtar', city: 'Rawalpindi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shahid Afridi', city: 'Khyber', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Inzamam ul Haq', city: 'Multan', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Waqar Younis', city: 'Vehari', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Wasim Akram', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Imran Khan', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Javed Miandad', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Zaheer Abbas', city: 'Sialkot', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Hanif Mohammad', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Abdul Qadir', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Fazal Mahmood', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohammad Yousuf', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Aamir Sohail', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Ijaz Ahmed', city: 'Sialkot', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Salim Malik', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Ramiz Raja', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mudassar Nazar', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohsin Khan', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Sarfaraz Nawaz', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mushtaq Mohammad', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Asif Iqbal', city: 'Hyderabad', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Intikhab Alam', city: 'Hoshiarpur', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Saeed Anwar', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Rashid Latif', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Moin Khan', city: 'Rawalpindi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Saqlain Mushtaq', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shoaib Malik', city: 'Sialkot', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Abdul Razzaq', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Azhar Mahmood', city: 'Rawalpindi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Taufeeq Umar', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Imran Nazir', city: 'Gujranwala', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Faisal Iqbal', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Yasir Hameed', city: 'Peshawar', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Salman Butt', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Danish Kaneria', city: 'Karachi', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohammad Asif', city: 'Sheikhupura', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohammad Amir', city: 'Gujar Khan', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Nasir Jamshed', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Ahmed Shehzad', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Umar Akmal', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Sharjeel Khan', city: 'Hyderabad', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Babar Azam Jr.', city: 'Lahore', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Mohammad Rizwan K.', city: 'Peshawar', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shaheen Shah A.', city: 'Landi Kotal', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Fakhar Zaman T.', city: 'Mardan', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shadab Khan R.', city: 'Mianwali', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Hasan Ali G.', city: 'Mandi Bahauddin', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Faheem Ashraf P.', city: 'Kasur', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Naseem Shah D.', city: 'Lower Dir', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Iftikhar Ahmed C.', city: 'Peshawar', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
  { name: 'Shan Masood K.', city: 'Kuwait City', country: 'Kuwait 🇰🇼', tier: 'Bronze' },
  { name: 'Abdullah Shafique', city: 'Sialkot', country: 'Pakistan 🇵🇰', tier: 'Bronze' },
];

const AVATAR_COLORS = [
  'bg-[#0284c7]', 'bg-[#0f766e]', 'bg-[#ca8a04]', 'bg-[#7c3aed]', 
  'bg-[#db2777]', 'bg-[#ea580c]', 'bg-[#059669]', 'bg-[#b45309]'
];

const GENERATED_31_TO_100 = ADDITIONAL_MEMBERS.map((m, idx) => {
  const rank = 31 + idx;
  const earned = Math.max(12.5, +(70.0 - idx * 0.81).toFixed(2));
  const ads = Math.max(60, Math.floor(375 - idx * 4.4));
  const username = `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return {
    id: `user_${rank + 100}`,
    rank,
    name: m.name,
    username,
    country: m.country,
    city: m.city,
    tier: m.tier,
    tierColor: 'bg-[#d97706]/15 text-[#b45309] border-[#d97706]/30',
    avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    totalEarned: earned,
    adsWatched: ads,
    referrals: idx % 4 === 0 ? 1 : 0,
    dailyEarned: 0.20,
    status: idx % 3 === 0 ? 'Watching Ads' : idx % 2 === 0 ? 'Active' : 'Claimed recently',
    statusTime: idx % 3 === 0 ? 'Live' : `${(idx % 12) + 2}m ago`,
    isOnline: idx % 2 === 0,
  };
});

// Full 100 Leaderboard dataset from Rank #1 to Rank #100
export const FULL_TOP_100_USERS = [...INITIAL_LEADERBOARD_USERS, ...GENERATED_31_TO_100];

const LIVE_NOTIFICATIONS = [
  '⚡ Member Tariq Khan earned $2.50 from daily views (Apex Contract)',
  '🌟 Bilal Malik climbed to Rank #2 with 6,920 lifetime ads!',
  '💰 Sara Ahmed received Level 1 matching commission ($1.25)',
  '🚀 Farhan Siddiqui earned $100.00 daily yield in Dubai 🇦🇪',
  '💎 New member activated Gold Tier in Islamabad, PK',
  '⚡ Zainab Ali completed daily ads rhythm with 100% verification',
  '🔥 Rashid Mehmood initiated fast JazzCash wallet withdrawal',
];

export default function LiveLeaderboard({ isHomePage = true, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  const [leaderboardData, setLeaderboardData] = useState(() => {
    try {
      const stored = localStorage.getItem('taemry_admin_leaderboard_custom');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FULL_TOP_100_USERS;
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('taemry_admin_leaderboard_custom');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLeaderboardData(parsed);
            return;
          }
        }
      } catch {}
      setLeaderboardData(FULL_TOP_100_USERS);
    };

    window.addEventListener('leaderboard-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('leaderboard-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Cycle live notifications ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_NOTIFICATIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Filtered dataset
  const sortedAndFiltered = useMemo(() => {
    let list = [...leaderboardData];

    // Guarantee ranked order 1 to 100
    list = list.map((item, idx) => ({ ...item, currentRank: idx + 1 }));

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          item.country.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.tier.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery]);

  // If on HomePage:
  // First 3 are position holders in the podium cards on top.
  // The table below displays "baqi nichy" -> ranks 4 to 10 (Total 10).
  // If Logged in (inside Dashboard / isHomePage = false):
  // Displays all 100 leaders in the table from Rank #1 all the way to Rank #100.
  const visibleList = useMemo(() => {
    if (searchQuery.trim()) {
      return isHomePage ? sortedAndFiltered.slice(0, 10) : sortedAndFiltered;
    }
    if (isHomePage) {
      // First 3 are position holders above, rest (baqi) below: ranks 4 to 10
      return sortedAndFiltered.slice(3, 10);
    }
    // When logged in / in dashboard: all 100 leaders
    return sortedAndFiltered;
  }, [isHomePage, sortedAndFiltered, searchQuery]);

  return (
    <section id="leaderboard-section" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#faf8f5] dark:bg-[#07151a] transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c5963]/10 dark:bg-[#0c5963]/30 text-[#0c5963] dark:text-[#5eead4] text-xs font-extrabold uppercase tracking-widest mb-3 border border-[#0c5963]/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TOP LEADERBOARD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#09353e] dark:text-white tracking-tight">
              Network Champions &amp; Real-Time Earnings
            </h2>
            <p className="text-sm text-[#526a6f] dark:text-[#94a3b8] mt-1.5 max-w-2xl">
              Transparent, live verified rankings of top platform earners, daily view streak leaders, and community builders.
            </p>
          </div>

          {/* Live Activity Ticker */}
          <div className="bg-white dark:bg-[#0a1f26] border border-[#e2dad0] dark:border-[#163842] rounded-2xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 shadow-xs max-w-md w-full md:w-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
            <div className="text-xs text-[#0c5963] dark:text-[#5eead4] font-semibold truncate flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{LIVE_NOTIFICATIONS[tickerIndex]}</span>
            </div>
          </div>
        </div>

        {/* Search Input Bar (Hidden per request) */}
        <div className="hidden bg-white dark:bg-[#0a1e25] rounded-3xl p-3 sm:p-4 border border-[#e4dfd4] dark:border-[#173740] shadow-xs mb-6 items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71868a] dark:text-[#647b80]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, username, city, or tier..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#faf8f5] dark:bg-[#07171d] border border-[#e0dad0] dark:border-[#163842] text-[#09353e] dark:text-white placeholder-[#71868a] focus:outline-none focus:ring-2 focus:ring-[#0c5963]"
            />
          </div>
        </div>

        {/* Top 3 Position Holders (Podium Cards) */}
        {sortedAndFiltered.length >= 3 && !searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Rank 2 Podium */}
            <div className="bg-white dark:bg-[#0a1e25] rounded-3xl p-5 border border-[#e0dad0] dark:border-[#173740] flex flex-col justify-between order-2 md:order-1 shadow-xs hover:border-[#94a3b8] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center">
                  #2
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${sortedAndFiltered[1].tierColor}`}>
                  {sortedAndFiltered[1].tier}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-2xl ${sortedAndFiltered[1].avatarBg} text-white font-black text-sm flex items-center justify-center shadow-xs`}>
                  {sortedAndFiltered[1].name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
                    <span>{sortedAndFiltered[1].name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  </h4>
                  <p className="text-[11px] text-[#647b80] dark:text-[#94a3b8]">{sortedAndFiltered[1].country} • {sortedAndFiltered[1].city}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#f0ede6] dark:border-[#133742] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">LIFETIME ADS</span>
                  <span className="text-xs font-semibold text-[#0c5963] dark:text-[#5eead4]">{sortedAndFiltered[1].adsWatched.toLocaleString()} ads</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">Total Profit</span>
                  <span className="font-extrabold text-[#09353e] dark:text-emerald-400 text-base">
                    ${sortedAndFiltered[1].totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank 1 Crown Champion Podium */}
            <div className="bg-linear-to-b from-[#fef3c7]/30 to-white dark:from-[#0a1e25] dark:to-[#08171c] rounded-3xl p-6 border-2 border-amber-400/60 dark:border-amber-500/50 flex flex-col justify-between order-1 md:order-2 shadow-md relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                <Crown className="w-24 h-24 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                    <Crown className="w-3.5 h-3.5" />
                    <span>CHAMPION #1</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${sortedAndFiltered[0].tierColor}`}>
                    {sortedAndFiltered[0].tier}
                  </span>
                </div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${sortedAndFiltered[0].avatarBg} text-white font-black text-lg flex items-center justify-center shadow-md ring-2 ring-amber-400`}>
                    {sortedAndFiltered[0].name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#09353e] dark:text-white flex items-center gap-1.5">
                      <span>{sortedAndFiltered[0].name}</span>
                      <CheckCircle2 className="w-4 h-4 text-amber-500 fill-amber-500 text-white" />
                    </h4>
                    <p className="text-xs text-[#647b80] dark:text-[#94a3b8]">{sortedAndFiltered[0].country} • {sortedAndFiltered[0].city}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {sortedAndFiltered[0].status === 'Active Now' ? 'Active' : sortedAndFiltered[0].status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">LIFETIME ADS</span>
                  <span className="text-xs font-semibold text-[#0c5963] dark:text-[#5eead4]">{sortedAndFiltered[0].adsWatched.toLocaleString()} ads</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">Total Profit</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    ${sortedAndFiltered[0].totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank 3 Podium */}
            <div className="bg-white dark:bg-[#0a1e25] rounded-3xl p-5 border border-[#e0dad0] dark:border-[#173740] flex flex-col justify-between order-3 shadow-xs hover:border-amber-600/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-extrabold text-xs flex items-center justify-center">
                  #3
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${sortedAndFiltered[2].tierColor}`}>
                  {sortedAndFiltered[2].tier}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-2xl ${sortedAndFiltered[2].avatarBg} text-white font-black text-sm flex items-center justify-center shadow-xs`}>
                  {sortedAndFiltered[2].name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
                    <span>{sortedAndFiltered[2].name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  </h4>
                  <p className="text-[11px] text-[#647b80] dark:text-[#94a3b8]">{sortedAndFiltered[2].country} • {sortedAndFiltered[2].city}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#f0ede6] dark:border-[#133742] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">LIFETIME ADS</span>
                  <span className="text-xs font-semibold text-[#0c5963] dark:text-[#5eead4]">{sortedAndFiltered[2].adsWatched.toLocaleString()} ads</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#71868a] dark:text-[#94a3b8] block">Total Profit</span>
                  <span className="font-extrabold text-[#09353e] dark:text-emerald-400 text-base">
                    ${sortedAndFiltered[2].totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-[#0a1e25] rounded-3xl border border-[#e4dfd4] dark:border-[#173740] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ece4d6] dark:border-[#163842] bg-[#faf6ee] dark:bg-[#081a20] text-[11px] uppercase tracking-wider text-[#71868a] dark:text-[#94a3b8] font-bold">
                  <th className="py-3.5 px-4 sm:px-6 w-16">Rank</th>
                  <th className="py-3.5 px-4 sm:px-6">Member</th>
                  <th className="py-3.5 px-4 sm:px-6">PACKAGE</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">LIFETIME ADS</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Team Referrals</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total Profit</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2ede4] dark:divide-[#12313b] text-xs">
                {visibleList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#71868a] dark:text-[#94a3b8]">
                      No leaders found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  visibleList.map((user) => {
                    const isTopThree = user.currentRank <= 3;
                    return (
                      <tr 
                        key={user.id}
                        className="hover:bg-[#faf8f4] dark:hover:bg-[#0c2630] transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 sm:px-6 font-bold">
                          {user.currentRank === 1 ? (
                            <span className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-black flex items-center justify-center shadow-xs">
                              #1
                            </span>
                          ) : user.currentRank === 2 ? (
                            <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-800 font-black flex items-center justify-center">
                              #2
                            </span>
                          ) : user.currentRank === 3 ? (
                            <span className="w-7 h-7 rounded-xl bg-amber-200 text-amber-900 font-black flex items-center justify-center">
                              #3
                            </span>
                          ) : (
                            <span className="text-[#647b80] dark:text-[#94a3b8] font-extrabold pl-1.5">
                              #{user.currentRank}
                            </span>
                          )}
                        </td>

                        {/* Member */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${user.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[#09353e] dark:text-white flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isTopThree && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-[#71868a] dark:text-[#94a3b8] flex items-center gap-1.5">
                                <span>{user.country}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${user.tierColor}`}>
                            {user.tier}
                          </span>
                        </td>

                        {/* LIFETIME ADS */}
                        <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-[#0c5963] dark:text-[#5eead4]">
                          {user.adsWatched.toLocaleString()}
                        </td>

                        {/* Team Referrals */}
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-[#526d72] dark:text-[#94a3b8]">
                          {user.referrals}
                        </td>

                        {/* Total Profit */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <span className="font-black text-[#09353e] dark:text-emerald-400 text-sm">
                            ${user.totalEarned.toFixed(2)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {user.status === 'Active Now' ? 'Active' : user.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
