/**
 * TAEMRY FLUX - Withdrawal Module Routes (Phase 4)
 * Enforces strict withdrawal qualification logic:
 * 1. Referral check (referralCount >= 1)
 * 2. Daily limit check (once per day)
 * 3. Cooldown check (5 minutes between requests)
 * 4. Amount boundary ($1.00 - $1,000.00)
 * 5. Balance adequacy check (amountUSD <= walletBalance)
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { getSystemSettings } from './settings.js';

const router = express.Router();

/**
 * GET /api/withdrawals/my-withdrawals
 * Protected: Retrieves historical withdrawal requests for the authenticated user.
 */
router.get('/my-withdrawals', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    const snapshot = await db
      .collection('withdrawals')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const withdrawals = [];
    snapshot.docs.forEach((doc) => {
      withdrawals.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error('Error fetching user withdrawals:', error);
    return res.status(500).json({
      error: 'Failed to fetch withdrawals',
      message: error.message,
    });
  }
});

/**
 * POST /api/withdrawals/request
 * Protected: Validates and logs a new withdrawal request without deducting balance yet.
 */
router.post('/request', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const settings = await getSystemSettings();

    const {
      method,
      accountName = '',
      accountNumber = '',
      walletAddress = '',
      amountUSD,
    } = req.body || {};

    const parsedAmount = parseFloat(amountUSD);

    // 1. Fetch user document from Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let userData = userDoc.exists ? userDoc.data() : null;

    if (!userData) {
      // Fallback default initialization if user profile has not been saved yet
      userData = {
        uid,
        walletBalance: 0,
        referralCount: 0,
        lastWithdrawalDate: null,
        lastWithdrawalRequestTime: null,
      };
      await userRef.set(userData, { merge: true });
    }

    // 2. Validate Amount ($1 to $1,000)
    if (isNaN(parsedAmount) || parsedAmount < 1.00 || parsedAmount > 1000.00) {
      return res.status(400).json({
        error: 'Invalid Amount',
        message: 'Withdrawal amount must be between $1.00 and $1,000.00 USD.',
      });
    }

    // 2.5 Strict Rule: Active Package Check
    const hasActivePackage = userData.currentPackage && userData.currentPackage !== 'None' && userData.isEligible;
    if (!hasActivePackage) {
      return res.status(400).json({
        error: 'Package Required',
        message: 'You must purchase an active PACKAGE before requesting withdrawals. Please activate a package first.',
        currentPackage: userData.currentPackage || 'None',
      });
    }

    // 3. Balance Check: amountUSD must be <= user's walletBalance
    const currentBalance = Number(userData.walletBalance) || 0;
    if (parsedAmount > currentBalance) {
      return res.status(400).json({
        error: 'Insufficient Balance',
        message: `Your current wallet balance ($${currentBalance.toFixed(2)}) is lower than the requested withdrawal ($${parsedAmount.toFixed(2)}).`,
        walletBalance: currentBalance,
      });
    }

    // 4. Validate Payment Method
    const allowedMethods = ['bank', 'easypaisa', 'jazzcash', 'crypto'];
    if (!method || !allowedMethods.includes(method.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid Method',
        message: `Withdrawal method must be one of: ${allowedMethods.join(', ')}.`,
      });
    }
    const cleanMethod = method.toLowerCase();

    // Destination account number or wallet address
    const destinationAccount = cleanMethod === 'crypto' ? (walletAddress || accountNumber) : accountNumber;
    if (!destinationAccount || !destinationAccount.trim()) {
      return res.status(400).json({
        error: 'Missing Account Number',
        message: cleanMethod === 'crypto' ? 'Wallet address is required.' : 'Account number or phone number is required.',
      });
    }

    if (cleanMethod !== 'crypto' && (!accountName || !accountName.trim())) {
      return res.status(400).json({
        error: 'Missing Account Name',
        message: 'Account holder name is required for bank and mobile wallet transfers.',
      });
    }

    // 5. Strict Rule: Referral Check (referralCount >= 1)
    const referralCount = Number(userData.referralCount) || 0;
    if (referralCount < 1) {
      return res.status(400).json({
        error: 'Referral Requirement Not Met',
        message: 'You need at least 1 active referral to withdraw.',
        referralCount,
      });
    }

    // 6. Strict Rule: Daily Limit Check (once per day)
    const todayStr = new Date().toISOString().split('T')[0];
    if (userData.lastWithdrawalDate === todayStr) {
      return res.status(400).json({
        error: 'Daily Limit Reached',
        message: 'You can only withdraw once per day.',
        lastWithdrawalDate: userData.lastWithdrawalDate,
      });
    }

    // 7. Strict Rule: Cooldown Check (5 minutes between requests)
    if (userData.lastWithdrawalRequestTime) {
      const lastRequestMs = new Date(userData.lastWithdrawalRequestTime).getTime();
      const elapsedMs = Date.now() - lastRequestMs;
      const cooldownMs = (settings.withdrawalCooldownMinutes || 5) * 60 * 1000;

      if (elapsedMs < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));
        return res.status(429).json({
          error: 'Withdrawal Cooldown Active',
          message: 'Please wait 5 minutes between withdrawal requests.',
          remainingMinutes,
        });
      }
    }

    // 8. Calculate local PKR equivalent
    const exchangeRate = settings.exchangeRate || 300;
    const isLocalMethod = ['bank', 'easypaisa', 'jazzcash'].includes(cleanMethod);
    const amountPKR = isLocalMethod ? Math.round(parsedAmount * exchangeRate) : null;

    const createdAt = new Date().toISOString();

    // 9. Store withdrawal in `withdrawals` collection
    const withdrawalDoc = {
      userId: uid,
      userEmail: req.user.email || '',
      method: cleanMethod,
      accountName: accountName ? accountName.trim() : 'Crypto Recipient',
      accountNumber: destinationAccount.trim(),
      amountUSD: parsedAmount,
      ...(amountPKR !== null && { amountPKR }),
      exchangeRate: isLocalMethod ? exchangeRate : null,
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    };

    const docRef = await db.collection('withdrawals').add(withdrawalDoc);

    // 10. Update user profile timestamps (Do NOT deduct balance yet - handled in Phase 5 upon admin approval)
    await userRef.update({
      lastWithdrawalDate: todayStr,
      lastWithdrawalRequestTime: createdAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted! Wait for admin approval.',
      withdrawalId: docRef.id,
      withdrawal: {
        id: docRef.id,
        ...withdrawalDoc,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/withdrawals/request:', error);
    return res.status(500).json({
      error: 'Withdrawal Request Failed',
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

export default router;
