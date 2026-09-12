/**
 * TAEMRY FLUX - Package Purchase & Catalog Routes
 * Handles purchasing packages, checking wallet balance, and recording transactions.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Fallback catalog of packages with user-specified specifications
export const DEFAULT_PACKAGES = [
  {
    id: 'bronze',
    tierName: 'Bronze',
    name: 'Bronze',
    price: 1.00,
    minWallet: 0.10,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'STARTER',
    color: '#0284c7',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '🌱 Take your first step into daily advertising earnings with minimal capital.',
    isActive: true,
    order: 1,
  },
  {
    id: 'silver',
    tierName: 'Silver',
    name: 'Silver',
    price: 5.00,
    minWallet: 0.50,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'POPULAR',
    color: '#0f766e',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '⚡ Amplify your daily revenue with an optimized Silver contract allocation.',
    isActive: true,
    order: 2,
  },
  {
    id: 'gold',
    tierName: 'Gold',
    name: 'Gold',
    price: 10.00,
    minWallet: 1.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'RECOMMENDED',
    color: '#ca8a04',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '🌟 Accelerate your growth and unlock higher advertising rewards every single day.',
    isActive: true,
    order: 3,
  },
  {
    id: 'premium',
    tierName: 'Premium',
    name: 'Premium',
    price: 50.00,
    minWallet: 5.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'PRO',
    color: '#0284c7',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '💎 Experience pro-grade earning power with enhanced daily reward allocations.',
    isActive: true,
    order: 4,
  },
  {
    id: 'elite',
    tierName: 'Elite',
    name: 'Elite',
    price: 100.00,
    minWallet: 10.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'HIGH CAPACITY',
    color: '#7c3aed',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '🚀 High-velocity contract tier crafted for dedicated digital earners.',
    isActive: true,
    order: 5,
  },
  {
    id: 'master',
    tierName: 'Master',
    name: 'Master',
    price: 500.00,
    minWallet: 50.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'ENTERPRISE',
    color: '#db2777',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '👑 Command the network with enterprise-level rewards and maximum earning capacity.',
    isActive: true,
    order: 6,
  },
  {
    id: 'apex',
    tierName: 'Apex',
    name: 'Apex',
    price: 1000.00,
    minWallet: 100.00,
    rewardRate: '20%',
    dailyLimit: 200,
    badge: 'ELITE MASTER',
    color: '#ea580c',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
    motivationText: '🔥 The absolute pinnacle of earning power — unbounded potential and supreme rewards.',
    isActive: true,
    order: 7,
  },
];

export function normalizePackages(data) {
  if (!data) return DEFAULT_PACKAGES;

  let rawList = [];
  if (Array.isArray(data.packages)) {
    rawList = data.packages;
  } else if (Array.isArray(data)) {
    rawList = data;
  } else if (typeof data === 'object') {
    const keys = Object.keys(data).filter(
      (k) =>
        k !== 'updatedAt' &&
        k !== 'updatedBy' &&
        k !== 'id' &&
        typeof data[k] === 'object' &&
        data[k] !== null
    );
    if (keys.length > 0) {
      rawList = keys.map((k) => ({ id: k, ...data[k] }));
    }
  }

  if (!rawList || rawList.length === 0) {
    return DEFAULT_PACKAGES;
  }

  // Ensure all fundamental default packages (especially Premium) are preserved
  DEFAULT_PACKAGES.forEach((dp) => {
    const exists = rawList.some(
      (p) => (p.id || '').toLowerCase().trim() === dp.id.toLowerCase().trim()
    );
    if (!exists) {
      rawList.push({ ...dp });
    }
  });

  return rawList
    .map((pkg, idx) => {
      const id = (pkg.id || `pkg_${idx}`).toLowerCase().trim();
      const fallback = DEFAULT_PACKAGES.find((p) => p.id === id) || {};
      const tierName = pkg.tierName || pkg.name || fallback.tierName || (id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Package');
      return {
        id,
        tierName,
        name: pkg.name || tierName,
        price: Number(pkg.price !== undefined ? pkg.price : (fallback.price || 0)),
        minWallet: Number(pkg.minWallet !== undefined ? pkg.minWallet : (fallback.minWallet || (Number(pkg.price || 0) * 0.1))),
        rewardRate: pkg.rewardRate || fallback.rewardRate || '20%',
        dailyLimit: Number(pkg.dailyLimit !== undefined ? pkg.dailyLimit : (fallback.dailyLimit || 200)),
        badge: pkg.badge !== undefined ? pkg.badge : fallback.badge,
        color: pkg.color || fallback.color || '#0284c7',
        description: pkg.description || fallback.description || 'Active contract tier with 200 ads/day allocation and guaranteed daily rewards.',
        motivationText: pkg.motivationText || fallback.motivationText || '✨ Build your digital earnings foundation with consistent daily rewards.',
        isActive: pkg.isActive !== false,
        order: Number(pkg.order !== undefined ? pkg.order : idx + 1),
      };
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.price - b.price);
}

/**
 * GET /api/packages
 * Public/Protected: Returns list of all available packages.
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const settingsRef = db.collection('systemSettings').doc('packages');
    const doc = await settingsRef.get();

    const allPackages = normalizePackages(doc.exists ? doc.data() : null);
    const activePackages = allPackages.filter((p) => p.isActive !== false);

    return res.json({
      success: true,
      packages: activePackages,
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.json({
      success: true,
      packages: DEFAULT_PACKAGES,
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
    const settingsDoc = await db.collection('systemSettings').doc('packages').get();
    const allPackages = normalizePackages(settingsDoc.exists ? settingsDoc.data() : null);
    const packageInfo = allPackages.find(
      (p) =>
        p.id?.toLowerCase() === normalizedPackageId ||
        p.tierName?.toLowerCase() === normalizedPackageId ||
        p.name?.toLowerCase() === normalizedPackageId
    );

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

    let currentBalance = 0; // Clean initial zero balance
    let userData = {};

    if (userDoc.exists) {
      userData = userDoc.data();
      currentBalance = Number(userData.walletBalance !== undefined ? userData.walletBalance : 0);
    } else {
      userData = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || 'TAEMRY Member',
        currentPackage: 'None',
        isEligible: false,
        lifetimeAds: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
      };
    }

    // 3. Check if user's walletBalance >= package price
    if (currentBalance < packagePrice) {
      const pkgDisplayName = packageInfo.tierName || packageInfo.name || packageInfo.id;
      return res.status(400).json({
        error: 'Insufficient Funds',
        message: `Your wallet balance ($${currentBalance.toFixed(2)}) is insufficient to purchase the ${pkgDisplayName} package ($${packagePrice.toFixed(2)}).`,
        requiredAmount: packagePrice,
        currentBalance,
      });
    }

    // 4. Deduct price from walletBalance
    const newBalance = Number((currentBalance - packagePrice).toFixed(2));
    const assignedPackageName = packageInfo.tierName || packageInfo.name || packageInfo.id;

    // 5. Update user's currentPackage and eligibility
    const updatedUserData = {
      ...userData,
      walletBalance: newBalance,
      currentPackage: assignedPackageName,
      isEligible: true,
      lastPackagePurchase: new Date().toISOString(),
    };

    await userRef.set(updatedUserData, { merge: true });

    // 6. Create transaction record
    const transactionData = {
      uid,
      type: 'package_purchase',
      packageId: packageInfo.id,
      packageName: assignedPackageName,
      amount: -packagePrice,
      previousBalance: currentBalance,
      newBalance,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: `Purchased ${assignedPackageName} package for $${packagePrice.toFixed(2)}`,
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
      message: `${assignedPackageName} package bought successfully!`,
      currentPackage: assignedPackageName,
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
