/**
 * TAEMRY FLUX - Package Purchase & Catalog Routes
 * Handles purchasing packages, checking wallet balance, and recording transactions.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Fallback catalog of the 7 packages with specifications
const DEFAULT_PACKAGES = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    price: 25.00,
    minWallet: 1.00,
    rewardRate: '1.8%',
    dailyLimit: 20,
    description: 'A measured first step to begin daily earnings.',
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    price: 75.00,
    minWallet: 5.00,
    rewardRate: '2.6%',
    dailyLimit: 40,
    description: 'For a stronger rhythm and higher daily capacity.',
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    price: 150.00,
    minWallet: 10.00,
    rewardRate: '3.4%',
    dailyLimit: 60,
    description: 'For committed momentum with accelerated view allocation.',
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    price: 300.00,
    minWallet: 25.00,
    rewardRate: '4.2%',
    dailyLimit: 80,
    description: 'Accelerated daily velocity and high-tier rewards.',
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    price: 500.00,
    minWallet: 50.00,
    rewardRate: '5.0%',
    dailyLimit: 100,
    description: 'Maximum efficiency tier with 100 views daily.',
  },
  master: {
    id: 'master',
    name: 'Master',
    price: 1000.00,
    minWallet: 100.00,
    rewardRate: '6.0%',
    dailyLimit: 120,
    description: 'Elite daily multiplier for advanced volume.',
  },
  apex: {
    id: 'apex',
    name: 'Apex',
    price: 2500.00,
    minWallet: 250.00,
    rewardRate: '7.5%',
    dailyLimit: 150,
    description: 'Unbounded reward scale and highest tier return.',
  },
};

/**
 * GET /api/packages
 * Public/Protected: Returns list of all available packages.
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const settingsRef = db.collection('systemSettings').doc('packages');
    const doc = await settingsRef.get();

    let packagesData = DEFAULT_PACKAGES;

    if (doc.exists && doc.data()) {
      packagesData = { ...DEFAULT_PACKAGES, ...doc.data() };
    }

    return res.json({
      success: true,
      packages: Object.values(packagesData),
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.json({
      success: true,
      packages: Object.values(DEFAULT_PACKAGES),
    });
  }
});

/**
 * POST /api/packages/buy
 * Protected: Purchases an earning package using the user's wallet balance.
 */
router.post('/buy', verifyToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const uid = req.user.uid;

    if (!packageId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'packageId is required (e.g. "bronze", "silver", "gold").',
      });
    }

    const normalizedPackageId = packageId.toLowerCase().trim();
    const db = getDb();

    // 1. Fetch package pricing from systemSettings (or fallback to defaults)
    let packageInfo = DEFAULT_PACKAGES[normalizedPackageId];
    try {
      const settingsDoc = await db.collection('systemSettings').doc('packages').get();
      if (settingsDoc.exists && settingsDoc.data()?.[normalizedPackageId]) {
        packageInfo = settingsDoc.data()[normalizedPackageId];
      }
    } catch (e) {
      console.warn('System settings fetch warning:', e.message);
    }

    if (!packageInfo) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Package '${packageId}' does not exist.`,
      });
    }

    const packagePrice = Number(packageInfo.price);

    // 2. Fetch current user document
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let currentBalance = 45.50; // Initial fallback balance
    let userData = {};

    if (userDoc.exists) {
      userData = userDoc.data();
      currentBalance = Number(userData.walletBalance !== undefined ? userData.walletBalance : 45.50);
    } else {
      userData = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || 'TAEMRY Member',
        currentPackage: 'None',
        isEligible: false,
        lifetimeAds: 1200,
        teamAdsCount: 5000,
        referralCount: 3,
        totalEarned: 138.20,
      };
    }

    // 3. Check if user's walletBalance >= package price
    if (currentBalance < packagePrice) {
      return res.status(400).json({
        error: 'Insufficient Funds',
        message: `Your wallet balance ($${currentBalance.toFixed(2)}) is insufficient to purchase the ${packageInfo.name} package ($${packagePrice.toFixed(2)}).`,
        requiredAmount: packagePrice,
        currentBalance,
      });
    }

    // 4. Deduct price from walletBalance
    const newBalance = Number((currentBalance - packagePrice).toFixed(2));

    // 5. Update user's currentPackage and eligibility
    const updatedUserData = {
      ...userData,
      walletBalance: newBalance,
      currentPackage: packageInfo.name,
      isEligible: true,
      lastPackagePurchase: new Date().toISOString(),
    };

    await userRef.set(updatedUserData, { merge: true });

    // 6. Create transaction record
    const transactionData = {
      uid,
      type: 'package_purchase',
      packageId: packageInfo.id,
      packageName: packageInfo.name,
      amount: -packagePrice,
      previousBalance: currentBalance,
      newBalance,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: `Purchased ${packageInfo.name} package for $${packagePrice.toFixed(2)}`,
    };

    const txDoc = await db.collection('transactions').add(transactionData);

    // Also link under user's transactions subcollection
    try {
      await userRef.collection('transactions').doc(txDoc.id).set(transactionData);
    } catch (e) {
      // Subcollection optional if root collection exists
    }

    return res.status(200).json({
      success: true,
      message: `${packageInfo.name} package bought successfully!`,
      currentPackage: packageInfo.name,
      walletBalance: newBalance,
      transaction: {
        id: txDoc.id,
        ...transactionData,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/packages/buy:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process package purchase.',
      details: error.message,
    });
  }
});

export default router;
