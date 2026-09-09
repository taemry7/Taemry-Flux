/**
 * TAEMRY FLUX - Referral System API Routes
 * Handles user unique referral links, direct downline tracking (Level 1),
 * referral tree, and team statistics.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Sample direct referrals for demonstration if user has no downlines yet
const SAMPLE_DOWNLINES = [
  {
    id: 'ref-user-01',
    name: 'Alex Vance',
    email: 'alex.v@taemryflux.com',
    package: 'Gold',
    lifetimeAds: 2450,
    joinedDate: '2026-08-14T10:20:00.000Z',
    status: 'Active',
  },
  {
    id: 'ref-user-02',
    name: 'Sarah Chen',
    email: 'sarah.c@taemryflux.com',
    package: 'Silver',
    lifetimeAds: 1680,
    joinedDate: '2026-08-22T14:45:00.000Z',
    status: 'Active',
  },
  {
    id: 'ref-user-03',
    name: 'Marcus Brody',
    email: 'marcus.b@taemryflux.com',
    package: 'Platinum',
    lifetimeAds: 3870,
    joinedDate: '2026-09-01T09:15:00.000Z',
    status: 'Active',
  },
];

/**
 * Generate a consistent, readable referral code from user ID
 */
const getReferralCode = (uid, existingCode) => {
  if (existingCode) return existingCode;
  const cleanId = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `FLUX-${cleanId.substring(0, 6) || 'MEMBER'}`;
};

/**
 * GET /api/referrals/info
 * Protected: Returns user's referral link, count, direct downlines, and team ads.
 */
router.get('/info', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let userData = userDoc.exists ? userDoc.data() : {};
    let referralCode = userData.referralCode;

    if (!referralCode) {
      referralCode = getReferralCode(uid);
      await userRef.set({ referralCode }, { merge: true });
    }

    // Query direct downlines (users whose referredBy == uid)
    let directReferrals = [];
    try {
      const downlinesSnapshot = await db.collection('users').where('referredBy', '==', uid).get();
      if (downlinesSnapshot && !downlinesSnapshot.empty) {
        directReferrals = downlinesSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Member',
            email: d.email || 'hidden@taemryflux.com',
            package: d.currentPackage || 'Bronze',
            lifetimeAds: Number(d.lifetimeAds) || 0,
            joinedDate: d.createdAt || new Date().toISOString(),
            status: d.isEligible ? 'Active' : 'Pending',
          };
        });
      }
    } catch (queryErr) {
      console.warn('Direct referrals query error:', queryErr.message);
    }

    // Real downlines only (empty array for fresh account)
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const referralLink = `${protocol}://${host}/#/?ref=${referralCode}`;

    const totalReferrals = directReferrals.length;
    const teamAdsCount = userData.teamAdsCount !== undefined ? Number(userData.teamAdsCount) : 0;

    return res.json({
      success: true,
      referralCode,
      referralLink,
      referralCount: totalReferrals,
      teamAdsCount,
      directReferrals,
      uplineCommissionRate: '50% of direct ad reward (Levels 1-5)',
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/info:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch referral info.',
      details: error.message,
    });
  }
});

/**
 * GET /api/referrals/tree
 * Protected: Returns direct children list (Level 1) for lightweight tree performance.
 */
router.get('/tree', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    let children = [];
    try {
      const downlinesSnapshot = await db.collection('users').where('referredBy', '==', uid).get();
      if (downlinesSnapshot && !downlinesSnapshot.empty) {
        children = downlinesSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Member',
            email: d.email || 'hidden@taemryflux.com',
            package: d.currentPackage || 'Bronze',
            lifetimeAds: Number(d.lifetimeAds) || 0,
            createdAt: d.createdAt || new Date().toISOString(),
          };
        });
      }
    } catch (err) {
      console.warn('Referrals tree query warning:', err.message);
    }

    return res.json({
      success: true,
      level: 1,
      totalChildren: children.length,
      children,
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/tree:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch referral tree.',
      details: error.message,
    });
  }
});

export default router;
