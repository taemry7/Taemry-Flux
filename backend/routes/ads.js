/**
 * TAEMRY FLUX - Ad Watching Module API Routes
 * Handles watching ads, 60s cooldown validation, daily resets, 
 * 0.1% package reward distribution, 50% upline commission (L1-L5),
 * and unlimited-depth team ads accumulation.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { getSystemSettings } from './settings.js';
import { adBotGuard } from '../middleware/antiBot.js';

const router = express.Router();

// Package pricing directory to calculate exact ad reward (25% daily returns across 200 ads)
const PACKAGE_PRICES = {
  bronze: 1.00,
  silver: 5.00,
  gold: 10.00,
  premium: 50.00,
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
    const settings = await getSystemSettings();
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

    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 0;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    const hasActivePackage = user.currentPackage && user.currentPackage !== 'None';
    const isEligible = Boolean(user.isEligible && hasActivePackage);

    const dailyLimit = Number(settings.dailyAdLimit || 400);
    const timerSeconds = Number(settings.adTimerSeconds || 60);
    // 20% daily return distributed across 400 ads = 0.05% per ad (20% / 400)
    const rewardPercentage = Number(settings.adRewardPercentage) || 0.05;
    const rewardRate = rewardPercentage / 100;

    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
    const rewardPerAd = +(packagePrice * rewardRate).toFixed(4);

    return res.json({
      success: true,
      isEligible,
      currentPackage: user.currentPackage || 'None',
      packagePrice,
      rewardPerAd,
      dailyAdCount,
      dailyLimit,
      timerSeconds,
      adCooldownSeconds: Number(settings.adCooldownSeconds || 0),
      lifetimeAds: user.lifetimeAds !== undefined ? Number(user.lifetimeAds) : 0,
      lastAdWatchTime: user.lastAdWatchTime || null,
      cooldownRemaining: 0,
      cooldownDisabled: (Number(settings.adCooldownSeconds || 0) === 0),
      adVideoUrl: settings.adVideoUrl || '',
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
 * Protected: Returns the full catalog of daily ad items with watched/available status.
 */
router.get('/listing', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const settings = await getSystemSettings();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    const user = doc.exists ? doc.data() : {};

    const todayStr = new Date().toISOString().split('T')[0];
    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 0;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    const dailyLimit = Number(settings.dailyAdLimit || 400);
    const timerSeconds = Number(settings.adTimerSeconds || 60);
    const rewardRate = (Number(settings.adRewardPercentage) || 0.05) / 100;

    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
    const rewardPerAd = +(packagePrice * rewardRate).toFixed(4);

    // 10 Clean Verified Digital Sponsors rotation per publisher specification
    const sponsorTemplates = [
      { name: 'Sponsored Push & Display', category: 'Cloud & Digital Services', tag: 'Unit #1' },
      { name: 'Native Recommendation', category: 'Tech Innovations & AI', tag: 'Unit #2' },
      { name: 'Global Media & Display', category: 'Global Web Solutions', tag: 'Unit #3' },
      { name: 'Verified Partner Portal', category: 'Featured Sponsor Portal', tag: 'Unit #4' },
      { name: 'Financial Analytics', category: 'Financial Analytics', tag: 'Unit #5' },
      { name: 'Cybersecurity & Infrastructure', category: 'Cybersecurity & Infrastructure', tag: 'Unit #6' },
      { name: 'E-Commerce & Digital Marketplace', category: 'E-Commerce & Digital Marketplace', tag: 'Unit #7' },
      { name: 'Mobile Utilities & Apps', category: 'Mobile Utilities & Apps', tag: 'Unit #8' },
      { name: 'Decentralized Networks', category: 'Decentralized Networks', tag: 'Unit #9' },
      { name: 'Smart Web Systems', category: 'Smart Web Systems', tag: 'Unit #10' },
    ];

    // Generate ads based on dynamic dailyLimit
    const ads = [];
    for (let i = 1; i <= dailyLimit; i++) {
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
        durationSeconds: timerSeconds,
        status: isWatched ? 'completed' : isCurrent ? 'available' : 'queued',
        watched: isWatched,
      });
    }

    return res.json({
      success: true,
      totalAds: dailyLimit,
      dailyLimit,
      timerSeconds,
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
 * Protected: Processes single ad watch reward with server-side validation & anti-bot velocity protection.
 */
router.post('/watch', verifyToken, adBotGuard, async (req, res) => {
  try {
    const { adId = 'sample' } = req.body || {};
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let user = doc.exists ? doc.data() : null;

    // If user record doesn't exist yet, initialize default clean user
    if (!user) {
      user = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || 'TAEMRY Member',
        walletBalance: 0,
        currentPackage: 'None',
        isEligible: false,
        lifetimeAds: 0,
        dailyAdCount: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
        createdAt: new Date().toISOString(),
      };
      await userRef.set(user);
    }

    const settings = await getSystemSettings();
    const dailyLimit = Number(settings.dailyAdLimit || 400);
    // 20% daily return distributed across 400 ads = 0.05% per ad (20% / 400)
    const rewardPercentage = Number(settings.adRewardPercentage) || 0.05;
    const rewardRate = rewardPercentage / 100;

    // 1. Strict eligibility: new accounts only eligible for deposit and buying a package
    const hasActivePackage = user.currentPackage && user.currentPackage !== 'None';
    if (!user.isEligible || !hasActivePackage) {
      return res.status(403).json({
        error: 'Ineligible',
        message: 'New accounts are only eligible for deposit and buying a package. Please buy a package first to unlock watching ads and earning rewards!',
      });
    }

    // 2. On-demand daily reset (avoiding separate cron jobs)
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyAdCount = user.dailyAdCount !== undefined ? Number(user.dailyAdCount) : 0;
    if (user.lastAdWatchDate !== todayStr) {
      dailyAdCount = 0;
    }

    // 3. Check dynamic daily limit
    if (dailyAdCount >= dailyLimit) {
      return res.status(400).json({
        error: 'Daily limit reached',
        message: `Daily limit reached! You have completed your ${dailyLimit} ads for today. Reset occurs tomorrow.`,
        dailyAdCount: dailyLimit,
        dailyLimit,
      });
    }

    // 4. Cooldown check (if configured by admin > 0)
    const cooldownSecs = Number(settings.adCooldownSeconds || 0);
    if (cooldownSecs > 0 && user.lastAdWatchTime) {
      const elapsedSecs = (Date.now() - new Date(user.lastAdWatchTime).getTime()) / 1000;
      if (elapsedSecs < cooldownSecs) {
        return res.status(429).json({
          error: 'Cooldown active',
          message: `Please wait ${Math.ceil(cooldownSecs - elapsedSecs)}s before watching the next ad.`,
          cooldownRemaining: Math.ceil(cooldownSecs - elapsedSecs),
        });
      }
    }

    // 5. Calculate reward dynamically based on packagePrice * rewardRate
    const packageKey = (user.currentPackage || 'bronze').toLowerCase();
    const packagePrice = PACKAGE_PRICES[packageKey] || 1.00;
    const reward = +(packagePrice * rewardRate).toFixed(4);

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
      description: `Daily Ad View Reward (#${newDailyAdCount} / 400 - ${user.currentPackage || 'Bronze'} tier)`,
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

        // Upline Daily Ad Commission for Levels 1 to 5:
        // Level 1: 25%, Level 2: 20%, Level 3: 15%, Level 4: 10%, Level 5: 5% of user's earned ad reward
        const adCommissionRates = {
          1: 0.25,
          2: 0.20,
          3: 0.15,
          4: 0.10,
          5: 0.05,
        };

        if (level <= 5 && adCommissionRates[level]) {
          const rate = adCommissionRates[level];
          const uplineCommission = +(reward * rate).toFixed(5);
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
            description: `Level ${level} Ad Commission (${Math.round(rate * 100)}% of $${reward.toFixed(3)})`,
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
