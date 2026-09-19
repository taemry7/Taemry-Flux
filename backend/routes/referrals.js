/**
 * TAEMRY FLUX - Referral System API Routes
 * Handles user unique referral links, direct downline tracking (Level 1),
 * referral tree, and team statistics.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { findUplineDoc } from './package.js';

const router = express.Router();

/**
 * Generate a consistent, readable referral code from user ID or username
 */
const getReferralCode = (uid, existingCode, username) => {
  if (username && typeof username === 'string' && username.trim()) {
    return username.trim().replace(/^@/, '');
  }
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
    
    // Prioritize user's unique username for referral code & link
    let cleanUsername = (userData.username || userData.displayName || userData.name || '').trim().replace(/^@/, '');
    let referralCode = cleanUsername || userData.referralCode || getReferralCode(uid);

    if (!userData.referralCode || (cleanUsername && userData.referralCode !== cleanUsername)) {
      await userRef.set({ referralCode }, { merge: true });
    }

    // Query direct downlines (users whose referredBy == uid, username, or referralCode)
    let directReferrals = [];
    try {
      const downlinesSnapshot = await db.collection('users').where('referredBy', '==', uid).get();
      let downlineDocs = downlinesSnapshot && !downlinesSnapshot.empty ? [...downlinesSnapshot.docs] : [];

      // Also check if users registered with username or referralCode
      const queryCodes = [referralCode, cleanUsername, `@${cleanUsername}`].filter(Boolean);
      for (const code of queryCodes) {
        if (code !== uid) {
          const codeSnapshot = await db.collection('users').where('referredBy', '==', code).get();
          if (codeSnapshot && !codeSnapshot.empty) {
            const existingIds = new Set(downlineDocs.map(d => d.id));
            codeSnapshot.docs.forEach(d => {
              if (!existingIds.has(d.id)) {
                downlineDocs.push(d);
              }
            });
          }
        }
      }

      if (downlineDocs.length > 0) {
        directReferrals = downlineDocs.map((doc) => {
          const d = doc.data() || {};
          const pkg = (d.currentPackage || '').trim();
          const hasPackage = Boolean(pkg && pkg !== 'None' && pkg !== 'No Package');
          const isEligible = Boolean(d.isEligible || hasPackage);
          return {
            id: doc.id,
            name: d.name || d.displayName || d.username || 'Member',
            username: d.username || d.displayName || d.name || 'member',
            email: d.email || 'hidden@taemryflux.com',
            package: hasPackage ? pkg : 'None',
            lifetimeAds: Number(d.lifetimeAds) || 0,
            joinedDate: d.createdAt || new Date().toISOString(),
            isEligible,
            status: isEligible ? 'Eligible' : 'Ineligible',
          };
        });
      }
    } catch (queryErr) {
      console.warn('Direct referrals query error:', queryErr.message);
    }

    // Real downlines only (empty array for fresh account)
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const referralLink = `${protocol}://${host}/#/login/signup?ref=${referralCode}`;

    const totalReferrals = directReferrals.length;
    const teamAdsCount = userData.teamAdsCount !== undefined ? Number(userData.teamAdsCount) : 0;

    return res.json({
      success: true,
      referralCode,
      username: cleanUsername || referralCode,
      referralLink,
      referralCount: totalReferrals,
      teamAdsCount,
      directReferrals,
      uplineCommissionRate: 'L1: 25%, L2: 20%, L3: 15%, L4: 10%, L5: 5%',
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

/**
 * POST /api/referrals/record-signup
 * Records a referral signup and increments the referrer's referralCount in Firestore.
 */
router.post('/record-signup', async (req, res) => {
  try {
    const { referralCode, newUserId, newUserEmail } = req.body;
    if (!referralCode) {
      return res.status(400).json({ success: false, message: 'referralCode is required' });
    }

    const cleanCode = String(referralCode).trim();
    const db = getDb();
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database connection not available' });
    }

    const cleanUsername = cleanCode.replace(/^@/, '');
    const docSnap = await findUplineDoc(db, cleanCode);
    let referrerDocRef = (docSnap && docSnap.exists) ? (docSnap.ref || db.collection('users').doc(docSnap.id)) : null;

    if (referrerDocRef && docSnap && docSnap.exists) {
      const currentCount = Number(docSnap.data()?.referralCount || 0);
      const newCount = currentCount + 1;
      await referrerDocRef.set({
        referralCount: newCount,
      }, { merge: true });

      // Also sync other docs with same email if any
      const docEmail = (docSnap.data()?.email || '').toLowerCase().trim();
      if (docEmail) {
        try {
          const emailSnap = await db.collection('users').where('email', '==', docEmail).get();
          for (const otherDoc of emailSnap.docs) {
            if (otherDoc.id !== referrerDocRef.id) {
              const otherRef = otherDoc.ref || db.collection('users').doc(otherDoc.id);
              await otherRef.set({ referralCount: newCount }, { merge: true });
            }
          }
        } catch (e) {}
      }

      // Link new user to referrer if newUserId or newUserEmail is provided
      if (newUserId && newUserId !== referrerDocRef.id) {
        try {
          await db.collection('users').doc(newUserId).set({
            referredBy: referrerDocRef.id,
            referrerUsername: cleanUsername,
          }, { merge: true });
        } catch (linkErr) {
          console.warn('[Referrals] Link newUserId note:', linkErr?.message);
        }
      }

      if (newUserEmail) {
        try {
          const userSnap = await db.collection('users').where('email', '==', newUserEmail).limit(1).get();
          if (!userSnap.empty && userSnap.docs[0].id !== referrerDocRef.id) {
            const targetRef = userSnap.docs[0].ref || db.collection('users').doc(userSnap.docs[0].id);
            await targetRef.set({
              referredBy: referrerDocRef.id,
              referrerUsername: cleanUsername,
            }, { merge: true });
          }
        } catch (emailLinkErr) {
          console.warn('[Referrals] Link newUserEmail note:', emailLinkErr?.message);
        }
      }

      return res.json({
        success: true,
        referrerId: referrerDocRef.id,
        newReferralCount: newCount,
      });
    }

    return res.json({
      success: false,
      message: 'Referrer profile not found in database.',
    });
  } catch (error) {
    console.error('Error in POST /api/referrals/record-signup:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record referral signup.',
      details: error.message,
    });
  }
});

export default router;
