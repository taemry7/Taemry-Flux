/**
 * TAEMRY FLUX - Package Purchase & Catalog Routes
 * Handles purchasing packages, checking wallet balance, and recording transactions.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveUserRecord } from '../utils/userPersistence.js';

const router = express.Router();

const packagesFilePath = path.resolve(process.cwd(), 'backend', 'systemSettings.initial.json');

// Helper to read initial disk packages
function readDiskPackages() {
  try {
    if (fs.existsSync(packagesFilePath)) {
      const raw = fs.readFileSync(packagesFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.systemSettings?.packages) {
        return parsed.systemSettings.packages;
      }
    }
  } catch (e) {
    console.warn('Could not read packages from disk:', e.message);
  }
  return null;
}

// Helper to safely find upline user document across all identifier forms
export async function findUplineDoc(db, uplineIdentifier) {
  if (!uplineIdentifier) return null;
  const clean = String(uplineIdentifier).trim();
  if (!clean) return null;

  // 1. Direct doc ID
  try {
    const d = await db.collection('users').doc(clean).get();
    if (d.exists) return d;
  } catch (e) {}

  // 2. Username with @ or without @
  const cleanNoAt = clean.replace(/^@/, '');
  try {
    const s1 = await db.collection('users').where('username', '==', `@${cleanNoAt}`).limit(1).get();
    if (!s1.empty) return s1.docs[0];
    const s2 = await db.collection('users').where('username', '==', cleanNoAt).limit(1).get();
    if (!s2.empty) return s2.docs[0];
  } catch (e) {}

  // 3. referralCode
  try {
    const s3 = await db.collection('users').where('referralCode', '==', clean).limit(1).get();
    if (!s3.empty) return s3.docs[0];
    const s4 = await db.collection('users').where('referralCode', '==', clean.toUpperCase()).limit(1).get();
    if (!s4.empty) return s4.docs[0];
    const s5 = await db.collection('users').where('referralCode', '==', cleanNoAt).limit(1).get();
    if (!s5.empty) return s5.docs[0];
  } catch (e) {}

  // 4. Email
  try {
    const s6 = await db.collection('users').where('email', '==', clean.toLowerCase()).limit(1).get();
    if (!s6.empty) return s6.docs[0];
  } catch (e) {}

  // 5. In-memory / full scan fallback
  try {
    const allSnap = await db.collection('users').get();
    let bestMatch = null;
    for (const d of allSnap.docs) {
      const data = d.data() || {};
      const uName = (data.username || '').replace(/^@/, '').toLowerCase();
      const refC = (data.referralCode || '').toLowerCase();
      const mail = (data.email || '').toLowerCase();
      const nm = (data.name || data.displayName || '').toLowerCase();
      const target = cleanNoAt.toLowerCase();
      if (d.id === clean || uName === target || refC === target || mail === target || nm === target) {
        if (!bestMatch) {
          bestMatch = d;
        } else if (bestMatch.id.startsWith('user_') && !d.id.startsWith('user_')) {
          bestMatch = d; // prefer real UID over synthetic user_ prefix
        }
      }
    }
    if (bestMatch) return bestMatch;
  } catch (e) {}

  return null;
}

// Helper to save packages to disk snapshot
export function savePackagesToDisk(packagesData) {
  try {
    let fullData = { systemSettings: {} };
    if (fs.existsSync(packagesFilePath)) {
      try {
        fullData = JSON.parse(fs.readFileSync(packagesFilePath, 'utf-8')) || { systemSettings: {} };
      } catch (e) {}
    }
    if (!fullData.systemSettings) fullData.systemSettings = {};
    fullData.systemSettings.packages = packagesData;
    fs.writeFileSync(packagesFilePath, JSON.stringify(fullData, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not persist packages to disk:', e.message);
  }
}

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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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
    badge: 'Apex Master',
    color: '#ea580c',
    description: 'Active contract tier with 200 ads/day allocation and guaranteed daily returns.',
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

    let packageData = null;
    if (doc && doc.exists) {
      packageData = doc.data();
      savePackagesToDisk(packageData);
    } else {
      packageData = readDiskPackages();
    }

    const allPackages = normalizePackages(packageData);
    const activePackages = allPackages.filter((p) => p.isActive !== false);

    return res.json({
      success: true,
      packages: activePackages,
    });
  } catch (error) {
    console.error('Error fetching packages, checking disk fallback:', error);
    const diskData = readDiskPackages();
    const allPackages = normalizePackages(diskData || DEFAULT_PACKAGES);
    const activePackages = allPackages.filter((p) => p.isActive !== false);
    return res.json({
      success: true,
      packages: activePackages,
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

    // 2. Fetch current user document safely without washing existing balances or packages
    const { ref: userRef, doc: userDoc, data: resolvedUserData } = await resolveUserRecord(db, {
      uid,
      email: req.user.email,
      name: req.user.name,
    });

    let userData = resolvedUserData || {};
    let currentBalance = Number(userData.walletBalance !== undefined ? userData.walletBalance : 0);

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

    // 5. Update user's currentPackage and eligibility (Permanent Lifetime Package Lock)
    const updatedUserData = {
      ...userData,
      walletBalance: newBalance,
      currentPackage: assignedPackageName,
      isEligible: true,
      hasLifetimePackage: true,
      lastPackagePurchase: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(updatedUserData, { merge: true });

    // Also update any alias email documents so account is never washed
    const userCleanEmail = (req.user.email || userData.email || '').toLowerCase().trim();
    if (userCleanEmail) {
      try {
        const snap = await db.collection('users').where('email', '==', userCleanEmail).get();
        for (const d of snap.docs) {
          if (d.id !== userRef.id) {
            await d.ref.set(updatedUserData, { merge: true });
          }
        }
      } catch (e) {}
    }

    if (typeof db._persist === 'function') {
      db._persist();
    }

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

    // 7. Auto-start live cloud mining upon package activation
    try {
      const minerRef = db.collection('cloudMiner').doc(uid);
      const minerDoc = await minerRef.get();
      const now = Date.now();
      if (!minerDoc.exists) {
        await minerRef.set({
          userId: uid,
          userEmail: userData.email || '',
          minedTflx: 0.00,
          isMiningActive: true,
          sessionStartTime: now,
          sessionDurationMs: 12 * 60 * 60 * 1000,
          effectiveHashrate: 8.0,
          activePackage: assignedPackageName,
          committedYears: 0,
          committedAllocation: 0,
          preStakingBoost: 0,
          tier1Active: 0,
          tier1Total: 0,
          tier2Active: 0,
          tier2Total: 0,
          dayOffsCount: 2,
          streakDays: 1,
          claimedCheckInDays: [],
          slashedCoins: 0,
          lastSyncTime: now,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const mData = minerDoc.data() || {};
        await minerRef.update({
          isMiningActive: true,
          sessionStartTime: mData.sessionStartTime && mData.isMiningActive ? mData.sessionStartTime : now,
          activePackage: assignedPackageName,
          lastSyncTime: now,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (minerErr) {
      console.warn('Could not auto-start cloud miner upon package purchase:', minerErr.message);
    }

    // 8. Distribute Multi-Tier Direct Referral Commissions (Levels 1 to 5)
    // Level 1: 20%, Level 2: 10%, Level 3: 5%, Level 4: 3%, Level 5: 2% of package purchase price
    const directReferralRates = {
      1: 0.20,
      2: 0.10,
      3: 0.05,
      4: 0.03,
      5: 0.02,
    };

    let currentUplineId = userData.referredBy || req.body.referredBy || null;

    // Fallback link for mistrtaemry -> mistrtaimoor
    if (!currentUplineId) {
      const userMail = (userData.email || req.user?.email || '').toLowerCase().trim();
      if (userMail === 'mistrtaemry@gmail.com') {
        currentUplineId = 'mistrtaimoor@gmail.com';
      }
    }

    // Persist referredBy on user document if it was provided on package buy
    if (currentUplineId && !userData.referredBy) {
      try {
        const uplineLookup = await findUplineDoc(db, currentUplineId);
        if (uplineLookup && uplineLookup.exists) {
          await userRef.set({
            referredBy: uplineLookup.id,
            referrerUsername: uplineLookup.data()?.username || uplineLookup.data()?.displayName || '',
          }, { merge: true });
          currentUplineId = uplineLookup.id;
        }
      } catch (e) {}
    }

    let uplineLevel = 1;
    const visitedUplines = new Set([uid]);
    const currentTimestamp = new Date().toISOString();

    while (currentUplineId && uplineLevel <= 5 && !visitedUplines.has(currentUplineId)) {
      visitedUplines.add(currentUplineId);
      try {
        let uplineDoc = await findUplineDoc(db, currentUplineId);

        if (!uplineDoc || !uplineDoc.exists) break;

        const uplineData = uplineDoc.data() || {};
        const rate = directReferralRates[uplineLevel];

        if (rate) {
          const commissionAmount = +(packagePrice * rate).toFixed(4);
          const currentUplineBal = Number(uplineData.walletBalance) || 0;
          const currentUplineEarned = Number(uplineData.totalEarned) || 0;
          const uplineNewBalance = +(currentUplineBal + commissionAmount).toFixed(4);
          const uplineNewTotalEarned = +(currentUplineEarned + commissionAmount).toFixed(4);

          const uplineRef = uplineDoc.ref || db.collection('users').doc(uplineDoc.id);
          await uplineRef.set({
            walletBalance: uplineNewBalance,
            totalEarned: uplineNewTotalEarned,
            updatedAt: currentTimestamp,
          }, { merge: true });

          // Also sync any other doc with the same email to avoid discrepancy
          const uplineEmail = (uplineData.email || '').toLowerCase().trim();
          if (uplineEmail) {
            try {
              const emailSnap = await db.collection('users').where('email', '==', uplineEmail).get();
              for (const otherDoc of emailSnap.docs) {
                if (otherDoc.id !== uplineDoc.id) {
                  const otherRef = otherDoc.ref || db.collection('users').doc(otherDoc.id);
                  await otherRef.set({
                    walletBalance: uplineNewBalance,
                    totalEarned: uplineNewTotalEarned,
                    updatedAt: currentTimestamp,
                  }, { merge: true });
                }
              }
            } catch (e) {}
          }

          // Log transaction for upline
          try {
            await db.collection(`users/${uplineDoc.id}/transactions`).add({
              type: 'referral_package_commission',
              fromUser: uid,
              fromUserName: userData.displayName || userData.name || userData.username || 'Team Member',
              level: uplineLevel,
              amount: commissionAmount,
              balanceAfter: uplineNewBalance,
              packageName: assignedPackageName,
              packagePrice,
              ratePercent: Math.round(rate * 100),
              createdAt: currentTimestamp,
              timestamp: currentTimestamp,
              description: `Level ${uplineLevel} Direct Referral Commission (${Math.round(rate * 100)}% of $${packagePrice.toFixed(2)} ${assignedPackageName} package)`,
            });
          } catch (e) {}

          try {
            await db.collection('transactions').add({
              uid: uplineDoc.id,
              userId: uplineDoc.id,
              type: 'referral_package_commission',
              fromUser: uid,
              fromUserName: userData.displayName || userData.name || userData.username || 'Team Member',
              level: uplineLevel,
              amount: commissionAmount,
              packageName: assignedPackageName,
              packagePrice,
              ratePercent: Math.round(rate * 100),
              createdAt: currentTimestamp,
              timestamp: currentTimestamp,
              description: `Level ${uplineLevel} Direct Referral Commission (${Math.round(rate * 100)}% of $${packagePrice.toFixed(2)} ${assignedPackageName} package)`,
            });
          } catch (e) {}
        }

        currentUplineId = uplineData.referredBy;
        uplineLevel++;
      } catch (refErr) {
        console.warn(`Package referral commission error at level ${uplineLevel}:`, refErr.message);
        break;
      }
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
