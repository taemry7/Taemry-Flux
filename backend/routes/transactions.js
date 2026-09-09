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
