/**
 * TAEMRY FLUX - Cloud Miner API Routes
 * Manages the dedicated Firestore 'cloudMiner' collection for cloud mining sessions and TFLX balances.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_MINER_DATA = {
  minedTflx: 283.98,
  isMiningActive: true,
  sessionStartTime: Date.now() - (1.5 * 60 * 60 * 1000),
  sessionDurationMs: 12 * 60 * 60 * 1000,
  committedYears: 0,
  committedAllocation: 0,
  preStakingBoost: 0,
  effectiveHashrate: 16.0,
  tier1Active: 2,
  tier1Total: 3,
  tier2Active: 4,
  tier2Total: 6,
  dayOffsCount: 2,
  streakDays: 4,
  claimedCheckInDays: [1, 2, 3],
  slashedCoins: 0,
  lastSyncTime: Date.now(),
  lastPingTime: 0,
};

/**
 * GET /api/miner/stats
 * Fetches the user's cloudMiner document from Firestore collection 'cloudMiner'
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const minerRef = db.collection('cloudMiner').doc(uid);
    const doc = await minerRef.get();

    if (!doc.exists) {
      const initialDoc = {
        ...DEFAULT_MINER_DATA,
        userId: uid,
        userEmail: req.user.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await minerRef.set(initialDoc, { merge: true });
      return res.json({ success: true, data: initialDoc });
    }

    const data = doc.data();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[CloudMiner API GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/miner/sync
 * Syncs updated cloud miner state to the Firestore 'cloudMiner' collection
 */
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const minerRef = db.collection('cloudMiner').doc(uid);

    const updatePayload = {
      ...req.body,
      userId: uid,
      userEmail: req.user.email || '',
      updatedAt: new Date().toISOString(),
    };

    await minerRef.set(updatePayload, { merge: true });
    return res.json({ success: true, message: 'Cloud miner synced to Firestore' });
  } catch (err) {
    console.error('[CloudMiner API SYNC Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/miner/start
 * Starts a fresh 12h cloud mining session in Firestore
 */
router.post('/start', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const minerRef = db.collection('cloudMiner').doc(uid);
    const doc = await minerRef.get();
    const existing = doc.exists ? doc.data() : DEFAULT_MINER_DATA;

    const now = Date.now();
    const nextStreak = (existing.streakDays || 0) + 1;
    const nextDayOffs = (nextStreak % 6 === 0) ? (existing.dayOffsCount || 0) + 1 : (existing.dayOffsCount || 0);

    const updated = {
      ...existing,
      userId: uid,
      isMiningActive: true,
      sessionStartTime: now,
      sessionDurationMs: 12 * 60 * 60 * 1000,
      lastSyncTime: now,
      streakDays: nextStreak,
      dayOffsCount: nextDayOffs,
      updatedAt: new Date().toISOString(),
    };

    await minerRef.set(updated, { merge: true });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[CloudMiner API START Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
