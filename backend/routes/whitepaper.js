/**
 * TAEMRY FLUX - Whitepaper & FAQ Management API Routes
 * Public and Admin endpoints to view and dynamically edit the platform Whitepaper,
 * FAQs, rules, and Team Rewards structure.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = express.Router();

export const DEFAULT_WHITEPAPER = {
  version: '2.0.0',
  lastUpdated: 'March 2025',
  title: 'TAEMRY FLUX Official Protocol Whitepaper',
  subtitle: 'Decentralized Reward-Based Advertising & Team Distribution Network',
  executiveSummary: 'TAEMRY FLUX is a decentralized, reward-based advertising and referral growth ecosystem. Members activate advertising allocation contracts from their wallet balances, unlock consecutive daily ad streams delivering up to 20% daily returns, and participate in a 5-tier direct downline commission structure alongside direct referral Team Rewards.',
  packagesNote: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.',
  teamRewards: [
    { referrals: 5, bonus: 1.00, label: '5 Referrals', note: 'Invite 5 members from your direct link' },
    { referrals: 15, bonus: 5.00, label: '15 Referrals', note: '10 more members (+10) = 15 total' },
    { referrals: 40, bonus: 10.00, label: '40 Referrals', note: '25 more members (+25) = 40 total' },
    { referrals: 90, bonus: 25.00, label: '90 Referrals', note: '50 more members (+50) = 90 total' },
    { referrals: 190, bonus: 50.00, label: '190 Referrals', note: '100 more members (+100) = 190 total' },
    { referrals: 250, bonus: 100.00, label: '250 Referrals', note: 'Reach 250 total direct downlines' },
    { referrals: 500, bonus: 250.00, label: '500 Referrals', note: 'Reach 500 total direct downlines' },
    { referrals: 1000, bonus: 600.00, label: '1,000 Referrals', note: '$500 Base + $100 Special Mega Bonus ($600 Total)' },
  ],
  packages: [
    { name: 'Bronze', price: '$1.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'STARTER' },
    { name: 'Silver', price: '$5.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'POPULAR' },
    { name: 'Gold', price: '$10.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'RECOMMENDED' },
    { name: 'Premium', price: '$50.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'PRO' },
    { name: 'Elite', price: '$100.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'HIGH CAPACITY' },
    { name: 'Master', price: '$500.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'ENTERPRISE' },
    { name: 'Apex', price: '$1,000.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'ELITE MASTER' },
  ],
  faqs: [
    {
      q: 'Q1. What is TAEMRY FLUX?',
      a: 'It is a verified reward-based advertising and referral growth ecosystem. You earn US Dollars ($) by watching ads, inviting friends via your direct link to claim Team Rewards, and building an organization.'
    },
    {
      q: 'Q2. Do I have to pay to start earning?',
      a: 'Yes. You must activate a starter package (starting from $1) to unlock daily ad viewing. This prevents bot automation and guarantees legitimate user attention for our advertising partners.'
    },
    {
      q: 'Q3. What is the daily return rate on packages?',
      a: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.'
    },
    {
      q: 'Q4. How do Team Rewards work?',
      a: 'Team Rewards are direct referral cash bonuses credited straight to your balance when you invite members from your link: 5 referrals = $1, 15 referrals = $5, 40 referrals = $10, 90 referrals = $25, 190 referrals = $50, 250 referrals = $100, 500 referrals = $250, and 1,000 referrals = $600 ($500 + $100 Mega Bonus)!'
    },
    {
      q: 'Q5. How deep is the referral network for commissions?',
      a: 'Downline commissions are paid 5 Levels deep (L1: 20%, L2: 10%, L3: 5%, L4: 3%, L5: 2%) whenever direct downlines purchase advertising packages.'
    },
    {
      q: 'Q6. How are member withdrawals processed?',
      a: 'Withdrawals are processed directly to your preferred payment method (Bank, Easypaisa, JazzCash, or USDT/BTC) with a low $1.00 minimum threshold, reviewed within 1 to 24 hours.'
    },
    {
      q: 'Q7. What happens if I do not watch ads for a few days?',
      a: 'Your account remains active. Your accumulated wallet balance and earned referral rewards never expire. You can resume watching ads whenever you wish.'
    },
    {
      q: 'Q8. What deposit and withdrawal methods are supported?',
      a: '1. Local Bank Transfer, 2. Easypaisa / JazzCash (Pegged exchange rate: 1 USD = 300 PKR), 3. Cryptocurrency (USDT TRC20 / BEP20 and Bitcoin).'
    },
    {
      q: 'Q9. What are the minimum and maximum withdrawal thresholds?',
      a: 'Minimum withdrawal is $1.00 USD. Maximum withdrawal per single request is $1,000.00 USD.'
    },
    {
      q: 'Q10. Are there restrictions on withdrawal frequency?',
      a: 'Members may submit one withdrawal request per calendar day, processed within 1 to 24 hours after admin approval.'
    },
    {
      q: 'Q11. Is TAEMRY FLUX a get-rich-quick scheme?',
      a: 'No. TAEMRY FLUX distributes real corporate advertising revenue generated through high-engagement sponsor impressions.'
    },
    {
      q: 'Q12. What are the consequences of using VPNs or multiple accounts?',
      a: 'Strictly prohibited. Operating VPNs, proxy tunnels, headless automation bots, or multi-accounting results in immediate, irreversible suspension and forfeiture of balances.'
    }
  ],
  supportContact: {
    email: 'support@taemryflux.com',
    whatsapp: '+92 300 0000000',
    telegram: '@TaemryFluxOfficial',
    hours: '24/7 Available (Response within 2-4 hours)',
  }
};

/**
 * Helper to fetch whitepaper content from Firestore or return default
 */
export async function getWhitepaperContent() {
  try {
    const db = getDb();
    const doc = await db.collection('systemSettings').doc('whitepaper').get();
    if (doc.exists && doc.data()) {
      return { ...DEFAULT_WHITEPAPER, ...doc.data() };
    }
  } catch (err) {
    console.warn('Could not read whitepaper from Firestore:', err.message);
  }
  return { ...DEFAULT_WHITEPAPER };
}

/**
 * GET /api/whitepaper
 * Public endpoint: returns live whitepaper document, FAQs, and Team Rewards structure
 */
router.get('/', async (req, res) => {
  try {
    const content = await getWhitepaperContent();
    return res.json({
      success: true,
      whitepaper: content,
    });
  } catch (error) {
    console.error('Error fetching whitepaper:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve whitepaper content',
      message: error.message,
    });
  }
});

/**
 * GET /api/whitepaper/admin
 * Admin endpoint: returns current editable whitepaper and metadata
 */
router.get('/admin', verifyAdmin, async (req, res) => {
  try {
    const content = await getWhitepaperContent();
    return res.json({
      success: true,
      whitepaper: content,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * PUT /api/whitepaper/admin
 * Admin endpoint: updates whitepaper text, FAQs, and team rewards in Firestore
 */
router.put('/admin', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const {
      title,
      subtitle,
      version,
      lastUpdated,
      executiveSummary,
      packagesNote,
      faqs,
      teamRewards,
      packages,
      supportContact,
    } = req.body || {};

    const updatedData = {
      title: title || DEFAULT_WHITEPAPER.title,
      subtitle: subtitle || DEFAULT_WHITEPAPER.subtitle,
      version: version || DEFAULT_WHITEPAPER.version,
      lastUpdated: lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      executiveSummary: executiveSummary || DEFAULT_WHITEPAPER.executiveSummary,
      packagesNote: packagesNote || DEFAULT_WHITEPAPER.packagesNote,
      faqs: Array.isArray(faqs) ? faqs : DEFAULT_WHITEPAPER.faqs,
      teamRewards: Array.isArray(teamRewards) ? teamRewards : DEFAULT_WHITEPAPER.teamRewards,
      packages: Array.isArray(packages) ? packages : DEFAULT_WHITEPAPER.packages,
      supportContact: supportContact || DEFAULT_WHITEPAPER.supportContact,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.email || 'admin',
    };

    await db.collection('systemSettings').doc('whitepaper').set(updatedData, { merge: true });

    // Record in Audit Logs
    try {
      await db.collection('auditLogs').add({
        adminEmail: req.user?.email || 'admin@taemryflux.com',
        action: 'update_whitepaper_faq',
        details: `Updated Whitepaper (v${updatedData.version}) and ${updatedData.faqs.length} FAQs`,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Whitepaper & FAQ content successfully saved and published!',
      whitepaper: updatedData,
    });
  } catch (error) {
    console.error('Error saving whitepaper content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save whitepaper content',
      message: error.message,
    });
  }
});

export default router;
