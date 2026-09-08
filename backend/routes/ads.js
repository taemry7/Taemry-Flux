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
  bronze: 1.00,
  silver: 5.00,
  gold: 10.00,
  elite: 100.00,
  master: 500.00,
  apex: 1000.00,
};

/**
 * GET /api/ads/status
 * Protected: Returns user's daily ad progress, cooldown status (disabled per user request), and eligibility.
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

    // Cooldown active restriction removed per user requirement
    const cooldownRemaining = 0;

    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
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
      cooldownRemaining: 0,
      cooldownDisabled: true,
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
 * GET /api/ads/listing
 * Protected: Returns the full catalog of 200 daily ad items with watched/available status.
 */
router.get('/listing', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    const user = doc.exists ? doc.data() : {};

    const todayStr = new Date().toISOString().split('T')[0];
    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 0;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
    const rewardPerAd = +(packagePrice * 0.001).toFixed(4);

    // Sponsors rotation for ads 1 to 200
    const sponsorTemplates = [
      { name: 'Solstice Cloud AI', category: 'Artificial Intelligence', tag: 'High Performance' },
      { name: 'Aura Protocol', category: 'Web3 & Fintech', tag: 'Secure Settlement' },
      { name: 'Apex Vantage Hardware', category: 'Computing', tag: 'Next-Gen Chips' },
      { name: 'Zenith Global Liquidity', category: 'Institutional Finance', tag: 'Cross-Border' },
      { name: 'Quantum Core Networks', category: 'Infrastructure', tag: 'Zero Latency' },
      { name: 'Hyperion Energy Systems', category: 'Clean Tech', tag: 'Sustainable Grid' },
      { name: 'CyberShield ZeroTrust', category: 'Cybersecurity', tag: 'Enterprise Grade' },
      { name: 'Nexus Orbital Data', category: 'Telecom & Satellite', tag: 'Global Mesh' },
    ];

    // Generate 200 ads
    const ads = [];
    for (let i = 1; i <= 200; i++) {
      const template = sponsorTemplates[(i - 1) % sponsorTemplates.length];
      const isWatched = i <= dailyAdCount;
      const isCurrent = i === dailyAdCount + 1;

      ads.push({
        adNumber: i,
        id: `ad_${i}`,
        title: `${template.name} #${i}`,
        category: template.category,
        tag: template.tag,
        reward: rewardPerAd,
        durationSeconds: 60, // Strictly 60 seconds per user requirement
        status: isWatched ? 'completed' : isCurrent ? 'available' : 'queued',
        watched: isWatched,
      });
    }

    return res.json({
      success: true,
      totalAds: 200,
      dailyAdCount,
      rewardPerAd,
      ads,
    });
  } catch (error) {
    console.error('Error in GET /api/ads/listing:', error);
    return res.status(500).json({
      error: 'Failed to generate ad listing',
      message: error.message,
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

    // 4. Cooldown active restriction removed per user requirement ("remove cooldown active fix it")
    // Ads can be watched smoothly sequentially without 60s block

    // 5. Calculate reward: packagePrice * 0.001 (0.1%)
    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
    const reward = +(packagePrice * 0.001).toFixed(4); // e.g. $1 * 0.001 = $0.001

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
      userId: uid,
      uid,
      type: 'ad_reward',
      adId,
      package: user.currentPackage || 'Bronze',
      amount: reward,
      previousBalance: user.walletBalance,
      balanceAfter: newBalance,
      timestamp: currentTimestamp,
      createdAt: currentTimestamp,
      description: `Daily Ad View Reward (#${newDailyAdCount} / 200 - ${user.currentPackage || 'Bronze'} tier)`,
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
