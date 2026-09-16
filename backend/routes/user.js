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
      let initialBalance = 0;
      try {
        const depSnap = await db.collection('deposits').where('userId', '==', uid).where('status', '==', 'approved').get();
        depSnap.docs.forEach((d) => {
          initialBalance += Number(d.data().amountUSD || 0);
        });
      } catch (e) {}

      // Initialize default user document if newly registered (Clean zeroed account, or approved deposits)
      const rawUserVal = req.user.username || req.user.name || req.user.email?.split('@')[0] || 'member';
      const defaultUsername = rawUserVal.startsWith('@') ? rawUserVal : `@${rawUserVal.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

      userData = {
        uid,
        email: req.user.email || 'member@taemryflux.com',
        name: req.user.name || req.user.email?.split('@')[0] || 'TAEMRY Member',
        username: defaultUsername,
        walletBalance: initialBalance,
        currentPackage: 'None',
        isEligible: false,
        lifetimeAds: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
        createdAt: new Date().toISOString(),
      };
      await userRef.set(userData);
    } else {
      userData = doc.data();
      // Ensure all required fields exist
      if (!userData.username) {
        const rawVal = userData.name || userData.email?.split('@')[0] || 'member';
        userData.username = rawVal.startsWith('@') ? rawVal : `@${rawVal.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      }
      if (userData.walletBalance === undefined) userData.walletBalance = 0;
      if (!userData.currentPackage) userData.currentPackage = 'None';
      if (userData.lifetimeAds === undefined) userData.lifetimeAds = 0;
      if (userData.teamAdsCount === undefined) userData.teamAdsCount = 0;
      if (userData.referralCount === undefined) userData.referralCount = 0;
      if (userData.totalEarned === undefined) userData.totalEarned = 0;
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

/**
 * PUT /api/user/profile
 * Protected: Updates profile information (name, phone, photoURL, country, bio).
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, phoneNumber, photoURL, country, bio, theme } = req.body || {};
    const db = getDb();
    const userRef = db.collection('users').doc(uid);

    const updates = {
      updatedAt: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (photoURL !== undefined) updates.photoURL = photoURL;
    if (country !== undefined) updates.country = country.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (theme !== undefined) updates.theme = theme;

    await userRef.set(updates, { merge: true });

    const updatedDoc = await userRef.get();
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedDoc.data(),
    });
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile.',
      details: error.message,
    });
  }
});

export default router;
