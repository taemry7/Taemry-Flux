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
  version: '2.5.0',
  lastUpdated: 'March 2026',
  title: 'TAEMRY FLUX Official Protocol Whitepaper',
  subtitle: 'Decentralized Reward-Based Advertising, Cloud Hash Miner & TFLX Network',
  executiveSummary: 'TAEMRY FLUX is a decentralized ecosystem uniting reward-based verified advertising, continuous 12-hour tap-to-mine Cloud Hash Mining, and TFLX Token network distribution. Members activate advertising allocation contracts to unlock guaranteed daily ad returns up to 20%, participate in 5-tier direct downline commissions and Team Rewards, and power their cloud mining engines with pre-staking yields and guild multipliers.',
  packagesNote: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.',
  cloudMiner: {
    baseRate: '16.0 TFLX/h',
    cycleDuration: '12 Hours (Tap-to-Mine)',
    maxPreStakeBoost: '+250%',
    guildTier1Boost: '+4.0 TFLX/h per active miner',
    guildTier2Boost: '+0.8 TFLX/h per active miner',
    dailyShields: 'Streak Check-In & Day-Off Protection'
  },
  teamRewards: [
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
  ],
  packages: [
    { name: 'Bronze', price: '$1.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'STARTER' },
    { name: 'Silver', price: '$5.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'POPULAR' },
    { name: 'Gold', price: '$10.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'RECOMMENDED' },
    { name: 'Premium', price: '$50.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'PRO' },
    { name: 'Elite', price: '$100.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'HIGH CAPACITY' },
    { name: 'Master', price: '$500.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'ENTERPRISE' },
    { name: 'Apex', price: '$1,000.00', dailyLimit: '200 ads/day', dailyReturn: '20% Daily Return', badge: 'GRAND MASTER' },
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
      a: 'Downline commissions are distributed 5 Levels deep: Daily Ads Matching Commissions (L1: 25%, L2: 20%, L3: 15%, L4: 10%, L5: 5%) and Package Activation Referral Commissions (L1: 20%, L2: 10%, L3: 5%, L4: 3%, L5: 2%).'
    },
    {
      q: 'Q6. How are member withdrawals processed and what are the requirements?',
      a: 'Withdrawals require a low $1.00 minimum threshold and 1 active direct referral to unlock lifetime permanent eligibility. Once unlocked, requests are processed to your mobile account or IBAN within 1 to 5 hours.'
    },
    {
      q: 'Q7. What happens if I do not watch ads for a few days?',
      a: 'Your account remains active. Your accumulated wallet balance and earned referral rewards never expire. You can resume watching ads whenever you wish.'
    },
    {
      q: 'Q8. What deposit and withdrawal methods are supported?',
      a: 'Active channels: JazzCash, UPaisa, and SadaPay (Pegged exchange rate: 1 USD = 300 PKR). Direct Bank Transfer and Cryptocurrency USDT are currently undergoing scheduled upgrades.'
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
    },
    {
      q: 'Q13. What is the TAEMRY FLUX Cloud Miner and how does it work?',
      a: 'The TAEMRY FLUX Cloud Miner is a decentralized tap-to-mine hashrate engine operating on a 12-hour continuous cycle. Members activate a 12h session by tapping the miner core, generating TFLX tokens at a base speed of 16.0 TFLX/hour without consuming phone battery or device hardware.'
    },
    {
      q: 'Q14. What are the prerequisites to activate Cloud Mining?',
      a: 'An active advertising package contract (Bronze $1 to Apex $1,000) is required to unlock full Cloud Miner eligibility. Once a package is active, cloud mining and token accumulation run continuously.'
    },
    {
      q: 'Q15. How does Pre-Staking & Guild Boosting increase mining speed?',
      a: 'Members can lock future TFLX tokens (up to 5 years and 100% allocation) to unlock up to a +250% Pre-Staking hashrate boost. Additionally, active downline members in your 2-Tier Guild add extra hashrate: +4.0 TFLX/h per Tier 1 active miner and +0.8 TFLX/h per Tier 2 active miner.'
    },
    {
      q: 'Q16. What are Day-Offs and the Slashing mechanism in Cloud Mining?',
      a: 'If a member fails to re-tap the miner within the grace period after their 12-hour session concludes, inactivity slashing reduces unverified tokens. However, earned Day-Off shields automatically protect your streak and mined balance from penalties.'
    }
  ],
  supportContact: {
    email: 'support@taemryflux.com',
    whatsapp: '+92 300 0000000',
    telegram: '@TaemryFluxOfficial',
    hours: '24/7 Available (Response within 2-5 hours)',
  }
};

/**
 * Helper to fetch whitepaper content from Firestore or return default
 */
export async function getWhitepaperContent() {
  try {
    const db = getDb();
    const [wpDoc, pkgDoc] = await Promise.all([
      db.collection('systemSettings').doc('whitepaper').get(),
      db.collection('systemSettings').doc('packages').get(),
    ]);

    let base = { ...DEFAULT_WHITEPAPER };
    if (wpDoc.exists && wpDoc.data()) {
      base = { ...base, ...wpDoc.data() };
    }

    if (pkgDoc.exists && pkgDoc.data()) {
      const { normalizePackages } = await import('./package.js');
      const livePackages = normalizePackages(pkgDoc.data());
      base.packages = livePackages
        .filter((p) => p.isActive !== false)
        .map((p) => ({
          name: p.tierName || p.name,
          price: `$${Number(p.price || 0).toFixed(2)}`,
          dailyLimit: `${p.dailyLimit || 200} ads/day`,
          dailyReturn: `${p.rewardRate || '20%'} Daily Return`,
          badge: p.badge || 'ACTIVE',
        }));
    }

    return base;
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
