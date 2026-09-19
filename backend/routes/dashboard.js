/**
 * TAEMRY FLUX - Dashboard API Routes
 * Computes and delivers user statistics and milestone progression.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveUserRecord } from '../utils/userPersistence.js';

const router = express.Router();

/**
 * Milestone ladder for personal ads progress calculation
 */
const MILESTONE_TIERS = [500, 1000, 2000, 5000, 10000, 25000];

const calculateMilestone = (lifetimeAds = 0) => {
  const nextTier = MILESTONE_TIERS.find((tier) => tier > lifetimeAds) || (lifetimeAds + 5000);
  const previousTier = [...MILESTONE_TIERS].reverse().find((tier) => tier <= lifetimeAds) || 0;
  
  // Calculate relative progress between previous milestone and next milestone
  const range = nextTier - previousTier;
  const progressInRange = lifetimeAds - previousTier;
  const percentage = range > 0 ? Math.min(100, Math.round((progressInRange / range) * 100)) : 100;
  
  // Overall ratio towards next target (e.g. 1,200 / 2,000 = 60%)
  const overallPercentage = Math.min(100, Math.round((lifetimeAds / nextTier) * 100));

  return {
    current: lifetimeAds,
    target: nextTier,
    percentage: overallPercentage,
    rangePercentage: percentage,
    adsRemaining: Math.max(0, nextTier - lifetimeAds),
  };
};

/**
 * GET /api/dashboard/stats
 * Protected: Returns live stats for the user dashboard overview.
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = (req.user.email || '').toLowerCase().trim();
    const db = getDb();

    // Safely resolve or retrieve user record without washing balances or packages
    const { doc, data: resolvedData } = await resolveUserRecord(db, {
      uid,
      email,
      name: req.user.name,
      username: req.user.username,
    });

    const userDocData = (doc && doc.exists ? doc.data() : resolvedData) || resolvedData;

    const data = {
      walletBalance: userDocData.walletBalance !== undefined ? Number(userDocData.walletBalance) : 0,
      currentPackage: userDocData.currentPackage || 'None',
      lifetimeAds: userDocData.lifetimeAds !== undefined ? Number(userDocData.lifetimeAds) : 0,
      dailyAdCount: userDocData.dailyAdCount !== undefined ? Number(userDocData.dailyAdCount) : 0,
      teamAdsCount: userDocData.teamAdsCount !== undefined ? Number(userDocData.teamAdsCount) : 0,
      referralCount: userDocData.referralCount !== undefined ? Number(userDocData.referralCount) : 0,
      totalEarned: userDocData.totalEarned !== undefined ? Number(userDocData.totalEarned) : 0,
      username: userDocData.username || (userDocData.name && userDocData.name.startsWith('@') ? userDocData.name : `@${(userDocData.name || userDocData.email?.split('@')[0] || 'member').toLowerCase().replace(/[^a-z0-9_]/g, '')}`),
      isEligible: userDocData.isEligible !== undefined ? Boolean(userDocData.isEligible) : Boolean(userDocData.currentPackage && userDocData.currentPackage !== 'None'),
    };

    const adsCount = Number(data.lifetimeAds || 0);
    let worldRank = '# 1000+';
    if (adsCount >= 10000) worldRank = '# 45';
    else if (adsCount >= 7500) worldRank = '# 120';
    else if (adsCount >= 5000) worldRank = '# 350';
    else if (adsCount >= 3000) worldRank = '# 680';
    else if (adsCount >= 2000) worldRank = '# 920';
    else worldRank = '# 1000+';
    data.worldRank = (doc && doc.exists && doc.data()?.worldRank) ? doc.data().worldRank : worldRank;

    const milestone = calculateMilestone(data.lifetimeAds);

    return res.json({
      success: true,
      stats: {
        ...data,
        milestone,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard stats.',
      details: error.message,
    });
  }
});

export default router;
