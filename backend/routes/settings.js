/**
 * TAEMRY FLUX - System Settings API Routes (Phase 4)
 * Provides platform financial parameters, exchange rates (USD -> PKR),
 * deposit payment accounts, withdrawal constraints, and tier specs.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';

const router = express.Router();

export const DEFAULT_SETTINGS = {
  exchangeRate: 300,
  bankAccountName: 'TAEMRY FLUX HOLDINGS LTD',
  bankAccountNumber: 'PK76MEZN0000123456789012',
  bankName: 'Meezan Bank Ltd',
  easypaisaNumber: '03451234567',
  easypaisaName: 'TAEMRY OFFICIAL',
  jazzcashNumber: '03009876543',
  jazzcashName: 'TAEMRY OFFICIAL',
  upaisaNumber: '03129876543',
  upaisaName: 'TAEMRY OFFICIAL',
  sadapayNumber: '03009876543',
  sadapayName: 'TAEMRY OFFICIAL',
  cryptoAddresses: {
    USDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d (TRC20 / BEP20)',
    BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  },
  minWithdrawal: 1.00,
  maxWithdrawal: 1000.00,
  withdrawalCooldownMinutes: 0,
  referralRequired: 1,
  // Ads Engine Configuration
  dailyAdLimit: 200,
  adTimerSeconds: 60,
  adRewardPercentage: 0.1, // 0.1% of package price
  adCooldownSeconds: 0, // 0s = disabled / consecutive watching allowed
  uplineCommissionPercentage: 50, // 50% distributed to uplines
  requirePackageForAds: true,
  adVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-artificial-intelligence-head-32863-large.mp4',
};

/**
 * Helper function to retrieve system settings with default fallback
 */
export async function getSystemSettings() {
  try {
    const db = getDb();
    const fetchDoc = db.collection('systemSettings').doc('general').get();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Settings fetch timeout')), 2000));
    const doc = await Promise.race([fetchDoc, timeout]);
    if (doc && doc.exists && doc.data()) {
      return { ...DEFAULT_SETTINGS, ...doc.data() };
    }
  } catch (error) {
    console.warn('Could not read systemSettings from Firestore, using default values:', error.message);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * GET /api/settings
 * Returns public system settings, current exchange rate, and withdrawal parameters.
 */
router.get('/', async (req, res) => {
  try {
    const settings = await getSystemSettings();
    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({
      error: 'Failed to fetch system settings',
      message: error.message,
    });
  }
});

export default router;
