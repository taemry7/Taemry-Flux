/**
 * TAEMRY FLUX - System Settings API Routes (Phase 4)
 * Provides platform financial parameters, exchange rates (USD -> PKR),
 * deposit payment accounts, withdrawal constraints, and tier specs.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../firebaseAdmin.js';
import { getCombinedBroadcasts } from '../utils/userPersistence.js';

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
  paymentMethodStatus: {
    jazzcash: true,
    upaisa: true,
    easypaisa: true,
    sadapay: false,
    bank: false,
    crypto: false,
  },
  depositApprovalTime: '~1 minute',
  minWithdrawal: 1.00,
  maxWithdrawal: 1000.00,
  withdrawalCooldownMinutes: 0,
  referralRequired: 1,
  testMode: false, // Production Live Mode
  // Ads Engine Configuration
  dailyAdLimit: 20, // 20 daily ads
  adTimerSeconds: 60,
  adRewardPercentage: 0.2, // 0.2% reward per ad
  adCooldownSeconds: 0, // 0s = disabled / consecutive watching allowed
  uplineCommissionPercentage: 50, // 50% distributed to uplines
  requirePackageForAds: true,
  adVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-artificial-intelligence-head-32863-large.mp4',
};

// File path for disk snapshot persistence
const settingsFilePath = path.resolve(process.cwd(), 'backend', 'systemSettings.initial.json');

// Helper to read initial disk settings
function readDiskSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(settingsFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.systemSettings?.general) {
        return parsed.systemSettings.general;
      }
    }
  } catch (e) {
    console.warn('Could not read settings from disk:', e.message);
  }
  return {};
}

// In-memory cache pre-seeded with disk and defaults
let activeSettingsCache = {
  ...DEFAULT_SETTINGS,
  ...readDiskSettings(),
};

// Helper to save settings to disk snapshot
export function saveSettingsToDisk(updatedGeneral) {
  try {
    let fullData = { systemSettings: {} };
    if (fs.existsSync(settingsFilePath)) {
      try {
        fullData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8')) || { systemSettings: {} };
      } catch (e) {}
    }
    if (!fullData.systemSettings) fullData.systemSettings = {};
    fullData.systemSettings.general = {
      ...fullData.systemSettings.general,
      ...updatedGeneral,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(fullData, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not persist settings to disk:', e.message);
  }
}

/**
 * Helper function to retrieve system settings with robust memory, disk, and Firestore layering
 */
export async function getSystemSettings() {
  try {
    const db = getDb();
    const docRef = db.collection('systemSettings').doc('general');
    
    // Fetch from Firestore without an aggressive 2-second timeout that causes resets
    const fetchDocPromise = docRef.get();
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
    const doc = await Promise.race([fetchDocPromise, timeoutPromise]);

    if (doc && doc.exists && doc.data()) {
      const firestoreData = doc.data();
      activeSettingsCache = {
        ...DEFAULT_SETTINGS,
        ...readDiskSettings(),
        ...activeSettingsCache,
        ...firestoreData,
        testMode: false,
      };
      saveSettingsToDisk(activeSettingsCache);
      return activeSettingsCache;
    }
  } catch (error) {
    console.warn('Firestore settings fetch notice, serving verified cache:', error.message);
  }

  // Fallback to active in-memory cache and disk settings
  return {
    ...DEFAULT_SETTINGS,
    ...readDiskSettings(),
    ...activeSettingsCache,
    testMode: false,
  };
}

/**
 * Helper to update system settings across Firestore, memory cache, and disk
 */
export async function updateSystemSettings(updates, adminEmail = 'admin') {
  activeSettingsCache = {
    ...activeSettingsCache,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };
  saveSettingsToDisk(activeSettingsCache);

  try {
    const db = getDb();
    await db.collection('systemSettings').doc('general').set(activeSettingsCache, { merge: true });
  } catch (e) {
    console.warn('Could not write updated settings to Firestore:', e.message);
  }

  return activeSettingsCache;
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

/**
 * GET /api/settings/broadcasts
 * Public route to fetch official admin broadcasts and announcements.
 */
router.get('/broadcasts', async (req, res) => {
  try {
    const db = getDb();
    const broadcasts = await getCombinedBroadcasts(db);
    return res.json({
      success: true,
      broadcasts,
    });
  } catch (error) {
    console.error('Error fetching broadcasts in settings:', error);
    return res.json({
      success: true,
      broadcasts: [],
    });
  }
});

export default router;
