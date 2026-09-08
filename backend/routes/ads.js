/**
 * TAEMRY FLUX - Ad Watching Module API Routes
 * Handles watching ads, 60s cooldown validation, daily resets, 
 * 0.1% package reward distribution, 50% upline commission (L1-L5),
 * and unlimited-depth team ads accumulation.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Package pricing directory to calculate exact 0.1% ad reward
const PACKAGE_PRICES = {
  bronze: 25.00,
  silver: 75.00,
  gold: 150.00,
  platinum: 300.00,
  diamond: 500.00,
  master: 1000.00,
  apex: 2500.00,
};

/**
 * GET /api/ads/status
 * Protected: Returns user's daily ad progress, cooldown status, and eligibility.
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user profile found for this account.',
      });
    }

    const user = doc.data();
    const todayStr = new Date().toISOString().split('T')[0];

    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 45;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    // Cooldown calculation
    let cooldownRemaining = 0;
    if (user.lastAdWatchTime) {
      const elapsedMs = Date.now() - new Date(user.lastAdWatchTime).getTime();
      if (elapsedMs < 60000) {
        cooldownRemaining = Math.ceil((60000 - elapsedMs) / 1000);
      }
    }

    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 25.00;
    const rewardPerAd = +(packagePrice * 0.001).toFixed(4); // 0.1%

    return res.json({
      success: true,
      isEligible: user.isEligible !== false,
      currentPackage: user.currentPackage || 'Bronze',
      packagePrice,
      rewardPerAd,
      dailyAdCount,
      dailyLimit: 200,
      lifetimeAds: user.lifetimeAds !== undefined ? Number(user.lifetimeAds) : 1200,
      lastAdWatchTime: user.lastAdWatchTime || null,
      cooldownRemaining,
    });
  } catch (error) {
    console.error('Error in GET /api/ads/status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch ad status.',
      details: error.message,
    });
  }
});

/**
 * POST /api/ads/watch
 * Protected: Processes single ad watch reward with server-side validation.
 */
router.post('/watch', verifyToken, async (req, res) => {
  try {
    const { adId = 'sample' } = req.body || {};
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let user = doc.exists ? doc.data() : null;

    // If user record doesn't exist yet, initialize default
    if (!user) {
      user = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || 'TAEMRY Member',
        walletBalance: 45.50,
        currentPackage: 'Bronze',
        isEligible: true,
        lifetimeAds: 1200,
        dailyAdCount: 45,
        teamAdsCount: 5000,
        referralCount: 3,
        totalEarned: 138.20,
        createdAt: new Date().toISOString(),
      };
      await userRef.set(user);
    }

    // 1. Check eligibility (must have bought a package)
    if (!user.isEligible && !user.currentPackage) {
      return res.status(403).json({
        error: 'Ineligible',
        message: 'Buy a package to start watching ads and earning rewards!',
      });
    }

    // 2. On-demand daily reset (avoiding separate cron jobs)
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 0;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    // 3. Check daily limit (200 ads per day max)
    if (dailyAdCount >= 200) {
      return res.status(400).json({
        error: 'Daily limit reached',
        message: 'Daily limit reached! You have completed your 200 ads for today. Reset occurs tomorrow.',
        dailyAdCount: 200,
        dailyLimit: 200,
      });
    }

    // 4. Check 60-second cooldown to prevent instant clicking
    if (user.lastAdWatchTime) {
      const elapsedMs = Date.now() - new Date(user.lastAdWatchTime).getTime();
      // Allow 2-second margin for network transit (58,000 ms)
      if (elapsedMs < 58000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        return res.status(429).json({
          error: 'Cooldown active',
          message: `Please wait ${remainingSeconds}s before watching another ad.`,
          remainingSeconds,
        });
      }
    }

    // 5. Calculate reward: packagePrice * 0.001 (0.1%)
    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 25.00;
    const reward = +(packagePrice * 0.001).toFixed(4); // e.g. $25 * 0.001 = $0.025

    const newBalance = +((Number(user.walletBalance) || 0) + reward).toFixed(4);
    const newTotalEarned = +((Number(user.totalEarned) || 0) + reward).toFixed(4);
    const newLifetimeAds = (Number(user.lifetimeAds) || 0) + 1;
    const newDailyAdCount = dailyAdCount + 1;
    const currentTimestamp = new Date().toISOString();

    // 6. Update current user document
    await userRef.update({
      walletBalance: newBalance,
      totalEarned: newTotalEarned,
      lifetimeAds: newLifetimeAds,
      dailyAdCount: newDailyAdCount,
      lastAdWatchTime: currentTimestamp,
      lastAdWatchDate: todayStr,
    });

    // 7. Record transaction for user
    await db.collection('transactions').add({
      uid,
      type: 'ad_reward',
      adId,
      package: user.currentPackage || 'Bronze',
      amount: reward,
      previousBalance: user.walletBalance,
      newBalance,
      createdAt: currentTimestamp,
      description: `Watched ad reward (${user.currentPackage || 'Bronze'} package @ 0.1%)`,
    });

    // 8. Upline Ad Commission (50% Rule) & Unlimited Depth Team Ads Counting
    // Traverse upline chain up to 100 levels for safety
    let currentUplineId = user.referredBy;
    let level = 1;
    const visitedUplines = new Set([uid]);

    while (currentUplineId && level <= 100 && !visitedUplines.has(currentUplineId)) {
      visitedUplines.add(currentUplineId);
      try {
        const uplineRef = db.collection('users').doc(currentUplineId);
        const uplineDoc = await uplineRef.get();

        if (!uplineDoc.exists) break;

        const uplineData = uplineDoc.data();
        const uplineUpdate = {
          teamAdsCount: (Number(uplineData.teamAdsCount) || 0) + 1,
        };

        // For Level 1 to 5, distribute 50% commission:
        // Rate = Original Rate * 0.50 (0.05% of package price or 50% of user reward)
        if (level <= 5) {
          const uplineCommission = +(reward * 0.50).toFixed(5);
          uplineUpdate.walletBalance = +((Number(uplineData.walletBalance) || 0) + uplineCommission).toFixed(4);
          uplineUpdate.totalEarned = +((Number(uplineData.totalEarned) || 0) + uplineCommission).toFixed(4);

          // Log commission record for transparency
          await db.collection('transactions').add({
            uid: currentUplineId,
            type: 'referral_ad_commission',
            fromUser: uid,
            fromUserName: user.name || 'Team Member',
            level,
            amount: uplineCommission,
            createdAt: currentTimestamp,
            description: `Level ${level} Ad Commission (50% of ${reward.toFixed(3)})`,
          });
        }

        await uplineRef.update(uplineUpdate);
        currentUplineId = uplineData.referredBy;
        level++;
      } catch (err) {
        console.warn(`Upline update error at level ${level}:`, err.message);
        break;
      }
    }

    return res.json({
      success: true,
      reward,
      newBalance,
      lifetimeAds: newLifetimeAds,
      dailyAdCount: newDailyAdCount,
      lastAdWatchTime: currentTimestamp,
      message: `Earned $${reward.toFixed(3)} for completed view!`,
    });
  } catch (error) {
    console.error('Error in POST /api/ads/watch:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process ad reward.',
      details: error.message,
    });
  }
});

export default router;
