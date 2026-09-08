/**
 * TAEMRY FLUX - Dashboard API Routes
 * Computes and delivers user statistics and milestone progression.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

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
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let data;

    if (!doc.exists) {
      // Default initial record matching user's Phase 2 requirements
      data = {
        walletBalance: 45.50,
        currentPackage: 'Gold',
        lifetimeAds: 1200,
        teamAdsCount: 5000,
        referralCount: 3,
        totalEarned: 138.20,
        isEligible: true,
      };
      await userRef.set({
        ...data,
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || 'TAEMRY Member',
        createdAt: new Date().toISOString(),
      });
    } else {
      const userDocData = doc.data();
      data = {
        walletBalance: userDocData.walletBalance !== undefined ? Number(userDocData.walletBalance) : 45.50,
        currentPackage: userDocData.currentPackage || 'Gold',
        lifetimeAds: userDocData.lifetimeAds !== undefined ? Number(userDocData.lifetimeAds) : 1200,
        teamAdsCount: userDocData.teamAdsCount !== undefined ? Number(userDocData.teamAdsCount) : 5000,
        referralCount: userDocData.referralCount !== undefined ? Number(userDocData.referralCount) : 3,
        totalEarned: userDocData.totalEarned !== undefined ? Number(userDocData.totalEarned) : 138.20,
        isEligible: userDocData.isEligible !== undefined ? userDocData.isEligible : true,
      };
    }

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
