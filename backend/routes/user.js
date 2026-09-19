/**
 * TAEMRY FLUX - User API Routes
 * Handles user profile and account details.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveUserRecord } from '../utils/userPersistence.js';

const router = express.Router();

/**
 * GET /api/user/me
 * Protected: Returns profile data for the authenticated user.
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = (req.user.email || '').toLowerCase().trim();
    const db = getDb();

    // Safely resolve or retrieve user document without overwriting or washing
    const { doc, data: resolvedData } = await resolveUserRecord(db, {
      uid,
      email,
      name: req.user.name,
      username: req.user.username,
    });

    const userDocData = (doc && doc.exists ? doc.data() : resolvedData) || resolvedData;

    // Ensure all required fields exist cleanly
    const rawVal = userDocData.username || userDocData.name || email.split('@')[0] || 'member';
    const cleanUsername = rawVal.startsWith('@') ? rawVal : `@${rawVal.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

    const userData = {
      ...userDocData,
      uid,
      email: userDocData.email || email || 'member@taemryflux.com',
      username: cleanUsername,
      walletBalance: userDocData.walletBalance !== undefined ? Number(userDocData.walletBalance) : 0,
      currentPackage: userDocData.currentPackage || 'None',
      lifetimeAds: userDocData.lifetimeAds !== undefined ? Number(userDocData.lifetimeAds) : 0,
      teamAdsCount: userDocData.teamAdsCount !== undefined ? Number(userDocData.teamAdsCount) : 0,
      referralCount: userDocData.referralCount !== undefined ? Number(userDocData.referralCount) : 0,
      totalEarned: userDocData.totalEarned !== undefined ? Number(userDocData.totalEarned) : 0,
      isEligible: Boolean(userDocData.isEligible || (userDocData.currentPackage && userDocData.currentPackage !== 'None')),
    };

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
