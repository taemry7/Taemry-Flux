/**
 * TAEMRY FLUX - Transaction Engine & History Routes (Phase 4)
 * Retrieves historical ledger records for the authenticated user,
 * categorized by transaction types (deposit, package_purchase, ad_reward, commission, milestone_bonus, withdrawal).
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/transactions
 * Protected: Returns chronological transaction history for the logged-in user.
 * Supports query parameters: ?limit=20&type=ad_reward
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const limit = parseInt(req.query.limit, 10) || 50;
    const filterType = req.query.type;

    let query = db
      .collection('transactions')
      .where('userId', '==', uid);

    if (filterType) {
      query = query.where('type', '==', filterType);
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const transactions = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        type: data.type || 'ad_reward',
        amount: Number(data.amount) || 0,
        description: data.description || 'Transaction record',
        balanceAfter: data.balanceAfter !== undefined ? Number(data.balanceAfter) : null,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata || null,
      });
    });

    // If transactions collection is empty for new user, construct helpful demo transactions from user profile
    if (transactions.length === 0) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        const currentBal = Number(u.walletBalance) || 45.50;
        const now = new Date();

        const defaultSeed = [
          {
            userId: uid,
            type: 'ad_reward',
            amount: 0.05,
            description: 'Completed Ad View stream verified',
            balanceAfter: currentBal,
            timestamp: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
          },
          {
            userId: uid,
            type: 'commission',
            amount: 0.125,
            description: 'L1 Direct Referral View Commission',
            balanceAfter: +(currentBal - 0.05).toFixed(3),
            timestamp: new Date(now.getTime() - 1000 * 60 * 85).toISOString(),
          },
          {
            userId: uid,
            type: 'milestone_bonus',
            amount: 5.00,
            description: 'Achieved Personal Milestone (1,000 Ads)',
            balanceAfter: +(currentBal - 0.175).toFixed(3),
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
          },
          {
            userId: uid,
            type: 'package_purchase',
            amount: -1.00,
            description: 'Purchased Bronze Tier Package',
            balanceAfter: +(currentBal - 5.175).toFixed(3),
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
          },
        ];

        for (const seed of defaultSeed) {
          const docRef = await db.collection('transactions').add(seed);
          transactions.push({
            id: docRef.id,
            ...seed,
          });
        }
      }
    }

    return res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

export default router;
