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
    const email = (req.user.email || '').toLowerCase().trim();
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    let doc = await userRef.get();

    let data;

    if (!doc.exists) {
      // Check if user has an existing record under this email with balance or package
      let foundRecord = null;
      if (email) {
        try {
          const emailSnap = await db.collection('users').where('email', '==', email).limit(5).get();
          if (!emailSnap.empty) {
            const sorted = emailSnap.docs.sort((a, b) => (Number(b.data().walletBalance || 0) - Number(a.data().walletBalance || 0)));
            foundRecord = sorted[0]?.data();
          }
        } catch (e) {
          console.warn('Could not query users by email:', e.message);
        }
      }

      if (foundRecord && (Number(foundRecord.walletBalance || 0) > 0 || (foundRecord.currentPackage && foundRecord.currentPackage !== 'None'))) {
        data = {
          walletBalance: Number(foundRecord.walletBalance || 0),
          currentPackage: foundRecord.currentPackage || 'None',
          lifetimeAds: Number(foundRecord.lifetimeAds || 0),
          teamAdsCount: Number(foundRecord.teamAdsCount || 0),
          referralCount: Number(foundRecord.referralCount || 0),
          totalEarned: Number(foundRecord.totalEarned || 0),
          isEligible: Boolean(foundRecord.isEligible),
        };
        await userRef.set({
          ...foundRecord,
          ...data,
          uid,
          email: email || req.user.email,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        // Default clean initial record for new user
        data = {
          walletBalance: 0,
          currentPackage: 'None',
          lifetimeAds: 0,
          teamAdsCount: 0,
          referralCount: 0,
          totalEarned: 0,
          isEligible: false,
        };
        await userRef.set({
          ...data,
          uid,
          email: req.user.email || 'member@taemryflux.com',
          name: req.user.name || 'TAEMRY Member',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      let userDocData = doc.data();

      // If current doc has 0 balance, check if another doc with the same email has the user's approved balance
      if (email && Number(userDocData.walletBalance || 0) === 0) {
        try {
          const emailSnap = await db.collection('users').where('email', '==', email).limit(5).get();
          if (!emailSnap.empty) {
            const sorted = emailSnap.docs.sort((a, b) => (Number(b.data().walletBalance || 0) - Number(a.data().walletBalance || 0)));
            const best = sorted[0]?.data();
            if (best && Number(best.walletBalance || 0) > 0) {
              userDocData = { ...userDocData, ...best };
              await userRef.update({
                walletBalance: Number(best.walletBalance),
                currentPackage: best.currentPackage || userDocData.currentPackage || 'None',
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (e) {
          console.warn('Could not check secondary email doc:', e.message);
        }
      }

      data = {
        walletBalance: userDocData.walletBalance !== undefined ? Number(userDocData.walletBalance) : 0,
        currentPackage: userDocData.currentPackage || 'None',
        lifetimeAds: userDocData.lifetimeAds !== undefined ? Number(userDocData.lifetimeAds) : 0,
        teamAdsCount: userDocData.teamAdsCount !== undefined ? Number(userDocData.teamAdsCount) : 0,
        referralCount: userDocData.referralCount !== undefined ? Number(userDocData.referralCount) : 0,
        totalEarned: userDocData.totalEarned !== undefined ? Number(userDocData.totalEarned) : 0,
        isEligible: userDocData.isEligible !== undefined ? userDocData.isEligible : false,
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
