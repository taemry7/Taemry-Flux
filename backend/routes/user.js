/**
 * TAEMRY FLUX - User API Routes
 * Handles user profile and account details.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/user/me
 * Protected: Returns profile data for the authenticated user.
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;

    if (!doc.exists) {
      // Initialize default user document if newly registered
      userData = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || req.user.email?.split('@')[0] || 'TAEMRY Member',
        walletBalance: 45.50, // Initial balance for Phase 2 demonstration
        currentPackage: 'Bronze',
        isEligible: true,
        lifetimeAds: 1200,
        teamAdsCount: 5000,
        referralCount: 3,
        totalEarned: 138.20,
        createdAt: new Date().toISOString(),
      };
      await userRef.set(userData);
    } else {
      userData = doc.data();
      // Ensure all required fields exist
      if (userData.walletBalance === undefined) userData.walletBalance = 45.50;
      if (!userData.currentPackage) userData.currentPackage = 'Bronze';
      if (userData.lifetimeAds === undefined) userData.lifetimeAds = 1200;
      if (userData.teamAdsCount === undefined) userData.teamAdsCount = 5000;
      if (userData.referralCount === undefined) userData.referralCount = 3;
      if (userData.totalEarned === undefined) userData.totalEarned = 138.20;
    }

    return res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error in GET /api/user/me:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user data.',
      details: error.message,
    });
  }
});

export default router;
