/**
 * TAEMRY FLUX - Cloud Miner API Routes
 * Manages the dedicated Firestore 'cloudMiner' collection for cloud mining sessions and TFLX balances.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = express.Router();

const DEFAULT_MINER_DATA = {
  minedTflx: 0.00,
  isMiningActive: false,
  sessionStartTime: 0,
  sessionDurationMs: 12 * 60 * 60 * 1000,
  committedYears: 0,
  committedAllocation: 0,
  preStakingBoost: 0,
  effectiveHashrate: 8.0,
  tier1Active: 0,
  tier1Total: 0,
  tier2Active: 0,
  tier2Total: 0,
  dayOffsCount: 0,
  streakDays: 0,
  claimedCheckInDays: [],
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

/**
 * GET /api/miner/admin/overview
 * Protected (Admin): Retrieves global cloud mining metrics, active sessions, and miner directory
 */
router.get('/admin/overview', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const now = Date.now();

    // 1. Fetch all cloudMiner docs
    const minersSnap = await db.collection('cloudMiner').get().catch(() => ({ docs: [] }));
    const minersList = [];
    let totalMinedTflx = 0;
    let totalActiveMiners = 0;
    let totalHashrateRunning = 0;

    minersSnap.docs.forEach((doc) => {
      const d = doc.data() || {};
      const uid = doc.id;
      const startTime = Number(d.sessionStartTime) || 0;
      const duration = Number(d.sessionDurationMs) || (12 * 60 * 60 * 1000);
      const isSessionLive = d.isMiningActive && (now - startTime < duration);
      const hashrate = Number(d.effectiveHashrate) || 8.0;
      const mined = Number(d.minedTflx) || 0;

      totalMinedTflx += mined;
      if (isSessionLive) {
        totalActiveMiners++;
        totalHashrateRunning += hashrate;
      }

      const timeLeftMs = Math.max(0, (startTime + duration) - now);

      minersList.push({
        uid,
        userId: d.userId || uid,
        userEmail: d.userEmail || d.email || 'member@taemry.com',
        isMiningActive: Boolean(d.isMiningActive),
        isSessionLive,
        minedTflx: +mined.toFixed(2),
        effectiveHashrate: hashrate,
        sessionStartTime: startTime,
        sessionDurationMs: duration,
        timeLeftMs,
        timeLeftFormatted: isSessionLive
          ? `${Math.floor(timeLeftMs / 3600000)}h ${Math.floor((timeLeftMs % 3600000) / 60000)}m`
          : 'Expired / Paused',
        streakDays: d.streakDays || 0,
        preStakingBoost: d.preStakingBoost || 0,
        updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
      });
    });

    // If no records in collection yet, populate with fallback overview
    if (minersList.length === 0) {
      // Check users collection to display members with default miner state
      try {
        const usersSnap = await db.collection('users').get().catch(() => ({ docs: [] }));
        usersSnap.docs.forEach((udoc) => {
          const udata = udoc.data() || {};
          minersList.push({
            uid: udoc.id,
            userId: udoc.id,
            userEmail: udata.email || 'member@taemry.com',
            isMiningActive: false,
            isSessionLive: false,
            minedTflx: 0,
            effectiveHashrate: 8.0,
            sessionStartTime: 0,
            sessionDurationMs: 12 * 60 * 60 * 1000,
            timeLeftMs: 0,
            timeLeftFormatted: 'Not Started',
            streakDays: 0,
            preStakingBoost: 0,
            updatedAt: udata.createdAt || new Date().toISOString(),
          });
        });
      } catch (e) {}
    }

    return res.json({
      success: true,
      data: {
        activeMiners: totalActiveMiners,
        totalMinedTflx: +totalMinedTflx.toFixed(2),
        totalHashrate: +totalHashrateRunning.toFixed(1),
        totalMinersCount: minersList.length,
        miners: minersList,
      },
    });
  } catch (err) {
    console.error('[CloudMiner Admin Overview Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/miner/admin/user/:uid
 * Protected (Admin): Retrieves cloud miner details for a specific user
 */
router.get('/admin/user/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const minerRef = db.collection('cloudMiner').doc(uid);
    const doc = await minerRef.get();

    if (!doc.exists) {
      // Return default template
      return res.json({
        success: true,
        data: {
          ...DEFAULT_MINER_DATA,
          userId: uid,
          minedTflx: 0,
          isMiningActive: false,
        },
      });
    }

    return res.json({ success: true, data: doc.data() });
  } catch (err) {
    console.error('[CloudMiner Admin User GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/miner/admin/user/:uid
 * Protected (Admin): Admin updates user's cloud miner state (activate/pause, mined TFLX, hashrate)
 */
router.put('/admin/user/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const minerRef = db.collection('cloudMiner').doc(uid);
    const doc = await minerRef.get();
    const existing = doc.exists ? doc.data() : { ...DEFAULT_MINER_DATA, userId: uid };

    const {
      isMiningActive,
      minedTflx,
      effectiveHashrate,
      streakDays,
      resetSession,
    } = req.body || {};

    const updates = {
      ...existing,
      updatedAt: new Date().toISOString(),
    };

    if (isMiningActive !== undefined) updates.isMiningActive = Boolean(isMiningActive);
    if (minedTflx !== undefined && !isNaN(Number(minedTflx))) updates.minedTflx = Math.max(0, Number(minedTflx));
    if (effectiveHashrate !== undefined && !isNaN(Number(effectiveHashrate))) updates.effectiveHashrate = Math.max(1, Number(effectiveHashrate));
    if (streakDays !== undefined && !isNaN(Number(streakDays))) updates.streakDays = Math.max(0, Number(streakDays));

    if (resetSession === true) {
      updates.sessionStartTime = Date.now();
      updates.sessionDurationMs = 12 * 60 * 60 * 1000;
      updates.isMiningActive = true;
    }

    await minerRef.set(updates, { merge: true });

    return res.json({
      success: true,
      message: 'User cloud miner profile updated successfully.',
      data: updates,
    });
  } catch (err) {
    console.error('[CloudMiner Admin User PUT Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
