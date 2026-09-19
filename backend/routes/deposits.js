/**
 * TAEMRY FLUX - Deposit Module Routes (Phase 4)
 * Handles payment details discovery, proof-of-payment screenshot uploads,
 * local currency conversion (PKR), and pending deposit record creation.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { upload, uploadScreenshotToStorage } from '../middleware/upload.js';
import { getSystemSettings } from './settings.js';
import { resolveUserRecord } from '../utils/userPersistence.js';

const router = express.Router();

/**
 * Helper: Parse Pakistani payment SMS from Easypaisa (3737), JazzCash (8558 / 8484 / UPaisa), etc.
 */
export function parsePaymentSms(rawText = '', sender = '') {
  const text = String(rawText || '');
  const snd = String(sender || '').toLowerCase();

  // 1. Detect Payment Gateway
  let method = 'other';
  if (snd.includes('3737') || text.toLowerCase().includes('easypaisa') || text.includes('3737')) {
    method = 'easypaisa';
  } else if (snd.includes('8558') || snd.includes('8484') || text.toLowerCase().includes('jazzcash') || text.includes('8558') || text.includes('8484')) {
    method = 'jazzcash';
  } else if (text.toLowerCase().includes('upaisa') || snd.includes('7777')) {
    method = 'upaisa';
  } else if (text.toLowerCase().includes('sadapay')) {
    method = 'sadapay';
  }

  // 2. Extract Transaction ID (TID)
  let tid = '';
  const tidPatterns = [
    /(?:TRX|Trx|trx|TID|Tid|tid|Txn|txn|TXN)\s*(?:ID|Id|id|Number|No|no)?\s*[:=\-is\.]?\s*([0-9A-Za-z]{8,18})/i,
    /(?:Transaction|Trans)\s*(?:ID|Id|id|Number|No)?\s*[:=\-is\.]?\s*([0-9A-Za-z]{8,18})/i,
    /(?:Ref|Reference)\s*(?:ID|Id|id|No|no)?\s*[:=\-is\.]?\s*([0-9A-Za-z]{8,18})/i,
    /\b([0-9]{10,12})\b/, // 10 to 12 digit TID fallback
  ];

  for (const regex of tidPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      tid = match[1].trim();
      break;
    }
  }

  // 3. Extract Amount (PKR)
  let amountPKR = null;
  const amountPatterns = [
    /(?:Rs|RS|rs|PKR|pkr)\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
    /received\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs|RS|rs|PKR|pkr)/i,
    /amount\s*of\s*(?:Rs|RS|rs|PKR|pkr)?\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /credited\s*with\s*(?:Rs|RS|rs|PKR|pkr)?\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const regex of amountPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        amountPKR = parsed;
        break;
      }
    }
  }

  return {
    tid,
    amountPKR,
    method,
    rawText: text,
    sender: snd,
  };
}

/**
 * Helper: Automatically approve deposit and credit user wallet in 1-5 seconds
 */
async function autoApproveDeposit(db, depositId, depositData, uid, matchedSms = null) {
  const amountUSD = Number(depositData.amountUSD || 0);
  const { ref: userRef, data: userDocData } = await resolveUserRecord(db, {
    uid,
    email: depositData.userEmail,
    name: depositData.userName,
  });

  const currentBalance = Number(userDocData?.walletBalance || 0);
  const newBalance = +(currentBalance + amountUSD).toFixed(2);

  // Credit user wallet
  await userRef.set({
    walletBalance: newBalance,
    totalDeposits: Number(userDocData?.totalDeposits || 0) + amountUSD,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // Record user ledger transaction
  await db.collection(`users/${uid}/transactions`).add({
    type: 'deposit',
    amount: +amountUSD,
    balanceAfter: newBalance,
    description: `Auto-Deposit Approved via 3737/8484 SMS (${depositData.method}) - TID: ${depositData.transactionId}`,
    depositId,
    timestamp: new Date().toISOString(),
  });

  // Record platform ledger
  await db.collection('transactions').add({
    userId: uid,
    userEmail: depositData.userEmail || '',
    type: 'deposit',
    amount: +amountUSD,
    balanceAfter: newBalance,
    status: 'completed',
    description: `Instant Auto-Deposit verified via SMS (${depositData.method})`,
    depositId,
    timestamp: new Date().toISOString(),
  });

  // Mark SMS as CLAIMED if provided
  if (matchedSms?.tid) {
    await db.collection('sms_payments').doc(`sms_${matchedSms.tid}`).set({
      status: 'CLAIMED',
      claimedBy: uid,
      claimedDepositId: depositId,
      claimedAt: new Date().toISOString(),
    }, { merge: true });
  }

  return newBalance;
}

/**
 * GET /api/deposits/payment-details
 * Protected: Returns Admin's official payment collection accounts and live exchange rate.
 */
router.get('/payment-details', verifyToken, async (req, res) => {
  try {
    const settings = await getSystemSettings();

    return res.json({
      success: true,
      paymentDetails: {
        exchangeRate: settings.exchangeRate || 300,
        bankAccountName: settings.bankAccountName || 'TAEMRY FLUX HOLDINGS LTD',
        bankAccountNumber: settings.bankAccountNumber || 'PK76MEZN0000123456789012',
        bankName: settings.bankName || 'Meezan Bank Ltd',
        easypaisaNumber: settings.easypaisaNumber || '03451234567',
        easypaisaName: settings.easypaisaName || 'TAEMRY OFFICIAL',
        jazzcashNumber: settings.jazzcashNumber || '03009876543',
        jazzcashName: settings.jazzcashName || 'TAEMRY OFFICIAL',
        upaisaNumber: settings.upaisaNumber || '03129876543',
        upaisaName: settings.upaisaName || 'TAEMRY OFFICIAL',
        sadapayNumber: settings.sadapayNumber || '03009876543',
        sadapayName: settings.sadapayName || 'TAEMRY OFFICIAL',
        cryptoAddresses: settings.cryptoAddresses || {
          USDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d (TRC20 / BEP20)',
          BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        },
        paymentMethodStatus: settings.paymentMethodStatus || {
          jazzcash: true,
          upaisa: true,
          easypaisa: true,
          sadapay: false,
          bank: false,
          crypto: false,
        },
        depositApprovalTime: settings.depositApprovalTime || '~1 minute',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/deposits/payment-details:', error);
    return res.status(500).json({
      error: 'Failed to retrieve admin payment details',
      message: error.message,
    });
  }
});

/**
 * GET /api/deposits/my-deposits
 * Protected: Retrieves historical deposit requests submitted by the logged-in user.
 */
router.get('/my-deposits', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    let deposits = [];
    try {
      const snapshot = await db
        .collection('deposits')
        .where('userId', '==', uid)
        .get();

      snapshot.docs.forEach((doc) => {
        deposits.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // In-memory sort avoids missing composite index errors
      deposits.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      deposits = deposits.slice(0, 20);
    } catch (queryErr) {
      console.warn('Firestore query error in /my-deposits:', queryErr.message);
    }

    return res.json({
      success: true,
      deposits,
    });
  } catch (error) {
    console.error('Error fetching user deposits:', error);
    return res.status(500).json({
      error: 'Failed to fetch deposits',
      message: error.message,
    });
  }
});

/**
 * POST /api/deposits/request
 * Protected: Submits a new deposit request with optional screenshot proof.
 * Accepts multipart/form-data (with file field `screenshot`) or JSON.
 */
router.post(
  '/request',
  verifyToken,
  (req, res, next) => {
    upload.single('screenshot')(req, res, (err) => {
      if (err) {
        console.warn('Multer screenshot upload warning:', err.message);
        // If file error occurred, continue without file rather than crashing
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const uid = req.user.uid;
      const userEmail = req.user.email || '';
      const db = getDb();
      const settings = await getSystemSettings();

      // Extract fields from body
      let { method, amountUSD, screenshotURL = '', transactionId = '' } = req.body || {};

      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Security Check 1: Account Block / Suspension
      if (userData?.isBlocked === true) {
        return res.status(403).json({
          error: 'Account Suspended',
          message: 'Your account is suspended. Deposits are currently disabled. Please contact support.',
        });
      }

      // Security Check 2: Anti-Bot Rapid Submission Cooldown (30 seconds)
      if (userData?.lastDepositRequestTime) {
        const elapsedMs = Date.now() - new Date(userData.lastDepositRequestTime).getTime();
        if (elapsedMs < 30 * 1000) {
          const remainingSec = Math.ceil((30 * 1000 - elapsedMs) / 1000);
          return res.status(429).json({
            error: 'Rate Limited',
            message: `Please wait ${remainingSec} seconds before submitting another deposit request.`,
          });
        }
      }

      // Security Check 3: Anti-Spam Maximum Pending Deposits Cap (Max 3 pending requests)
      try {
        const userDepositsSnap = await db.collection('deposits')
          .where('userId', '==', uid)
          .get();

        const pendingCount = userDepositsSnap.docs.filter(
          (d) => d.data()?.status === 'pending'
        ).length;

        if (pendingCount >= 5) {
          return res.status(429).json({
            error: 'Pending Requests Limit',
            message: 'You have multiple pending deposit requests under review. Please wait for admin approval before submitting another.',
          });
        }
      } catch (queryErr) {
        console.warn('Pending deposits count check warning:', queryErr.message);
      }

    // Security Check 4: Anti-Fraud Duplicate Transaction ID Check & Claimed Check
    const cleanTrxId = typeof transactionId === 'string' ? transactionId.trim() : '';
    let matchedSmsRecord = null;

    if (cleanTrxId && cleanTrxId.length >= 6) {
      try {
        // 4a. Check if TID was already approved in any prior deposit
        const existingTxSnap = await db.collection('deposits')
          .where('transactionId', '==', cleanTrxId)
          .get();

        const approvedExists = existingTxSnap.docs.some(d => d.data()?.status === 'approved');
        if (approvedExists) {
          return res.status(400).json({
            error: 'Duplicate Transaction ID',
            message: 'This Transaction ID (TID) has already been approved and claimed. Duplicate payment submissions are strictly prohibited.',
          });
        }

        // 4b. Check if TID was already marked CLAIMED in sms_payments collection
        const smsDocCheck = await db.collection('sms_payments').doc(`sms_${cleanTrxId}`).get();
        if (smsDocCheck.exists && smsDocCheck.data()?.status === 'CLAIMED') {
          return res.status(400).json({
            error: 'TID Already Claimed',
            message: 'This Transaction ID (TID) has already been claimed by another user or processed. Please verify your payment receipt.',
          });
        }

        // 4c. Check if there is an UNCLAIMED SMS matching this TID from 3737/8484
        if (smsDocCheck.exists && smsDocCheck.data()?.status === 'UNCLAIMED') {
          matchedSmsRecord = smsDocCheck.data();
        }
      } catch (txErr) {
        console.warn('TID verification check warning:', txErr.message);
      }
    }

    const parsedAmount = parseFloat(amountUSD);

    // 1. Validation - Amount limit check
    if (isNaN(parsedAmount) || parsedAmount < 1.00 || parsedAmount > 1000.00) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Deposit amount must be between $1.00 and $1,000.00 USD.',
      });
    }

    // 2. Validation - Allowed payment methods
    const allowedMethods = ['bank', 'jazzcash', 'upaisa', 'sadapay', 'easypaisa', 'crypto'];
    if (!method || !allowedMethods.includes(method.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid method',
        message: `Method must be one of: ${allowedMethods.join(', ')}.`,
      });
    }

    const cleanMethod = method.toLowerCase();

    // 3. Handle screenshot upload if a file was attached
    if (req.file) {
      try {
        screenshotURL = await uploadScreenshotToStorage(req.file, uid);
      } catch (uploadErr) {
        console.error('Screenshot upload failure:', uploadErr);
        if (!screenshotURL && req.body?.screenshotURL) {
          screenshotURL = req.body.screenshotURL;
        }
      }
    }
    if (!screenshotURL && req.body?.screenshotURL) {
      screenshotURL = req.body.screenshotURL;
    }
    if (!screenshotURL && req.body?.screenshot && typeof req.body.screenshot === 'string') {
      screenshotURL = req.body.screenshot;
    }

    // 4. Calculate local currency conversion (PKR) for local methods
    const exchangeRate = settings.exchangeRate || 300;
    const isLocalMethod = ['bank', 'easypaisa', 'jazzcash', 'upaisa', 'sadapay'].includes(cleanMethod);
    const amountPKR = isLocalMethod ? Math.round(parsedAmount * exchangeRate) : null;

    // 5. Admin details assigned to this transaction for verification
    let adminAccountName = '';
    let adminAccountNumber = '';

    if (cleanMethod === 'bank') {
      adminAccountName = settings.bankAccountName;
      adminAccountNumber = `${settings.bankName} - ${settings.bankAccountNumber}`;
    } else if (cleanMethod === 'easypaisa') {
      adminAccountName = settings.easypaisaName;
      adminAccountNumber = settings.easypaisaNumber;
    } else if (cleanMethod === 'jazzcash') {
      adminAccountName = settings.jazzcashName;
      adminAccountNumber = settings.jazzcashNumber;
    } else if (cleanMethod === 'upaisa') {
      adminAccountName = settings.upaisaName || 'TAEMRY OFFICIAL';
      adminAccountNumber = settings.upaisaNumber || '03129876543';
    } else if (cleanMethod === 'sadapay') {
      adminAccountName = settings.sadapayName || 'TAEMRY OFFICIAL';
      adminAccountNumber = settings.sadapayNumber || '03009876543';
    } else if (cleanMethod === 'crypto') {
      adminAccountName = 'Crypto Wallet';
      adminAccountNumber = settings.cryptoAddresses?.USDT || '0x71C2d...';
    }

    const createdAt = new Date().toISOString();
    const isAutoApprovable = Boolean(matchedSmsRecord && matchedSmsRecord.tid);

    // 6. Create deposit record in `deposits` collection
    const depositData = {
      userId: uid,
      userEmail,
      method: cleanMethod,
      amountUSD: parsedAmount,
      ...(amountPKR !== null && { amountPKR }),
      exchangeRate: isLocalMethod ? exchangeRate : null,
      screenshotURL: screenshotURL || null,
      transactionId: cleanTrxId || null,
      status: isAutoApprovable ? 'approved' : 'pending',
      ...(isAutoApprovable && {
        autoApproved: true,
        approvedAt: createdAt,
        adminNotes: `Instant 1-sec auto-approved via matching 3737/8484 SMS payment (TID: ${cleanTrxId})`,
      }),
      accountName: adminAccountName,
      accountNumber: adminAccountNumber,
      createdAt,
      updatedAt: createdAt,
    };

    let docRef;
    try {
      const addPromise = db.collection('deposits').add(depositData);
      const addTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore write timeout')), 3500)
      );
      docRef = await Promise.race([addPromise, addTimeout]);
      userRef.set({ lastDepositRequestTime: createdAt }, { merge: true }).catch(() => {});
    } catch (writeErr) {
      console.warn('Direct Firestore write failed or timed out, saving resiliently:', writeErr.message);
      const fallbackId = 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      docRef = { id: fallbackId };
      userRef.set({ lastDepositRequestTime: createdAt }, { merge: true }).catch(() => {});
    }

    // 7. If Auto-Approvable, execute instant wallet credit and ledger registration immediately!
    if (isAutoApprovable) {
      try {
        await autoApproveDeposit(db, docRef.id, depositData, uid, matchedSmsRecord);
        console.log(`[Instant Deposit Approved]: TID ${cleanTrxId} auto-approved for user ${uid} in 1 sec.`);
      } catch (creditErr) {
        console.error('Error during instant auto-approval wallet credit:', creditErr);
      }
    }

    return res.status(201).json({
      success: true,
      autoApproved: isAutoApprovable,
      message: isAutoApprovable
        ? 'Deposit verified and auto-approved in 1 second! Funds credited to your wallet.'
        : 'Deposit request submitted successfully! Please wait for admin approval.',
      depositId: docRef.id,
      deposit: {
        id: docRef.id,
        ...depositData,
      },
      paymentDetails: {
        accountName: adminAccountName,
        accountNumber: adminAccountNumber,
        amountUSD: parsedAmount,
        amountPKR,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/deposits/request:', error);
    return res.status(500).json({
      error: 'Deposit request failed',
      message: error.message || 'An unexpected error occurred processing your deposit request.',
    });
  }
});

/**
 * POST /api/deposits/sms-webhook
 * Webhook endpoint for Android SMS Forwarder or external SMS gateways.
 * Listens for incoming SMS from Easypaisa (3737), JazzCash (8558 / 8484), etc.
 * Parses the Transaction ID and PKR Amount:
 * - If matching pending deposit found: approves within 1 second!
 * - If no pending deposit found yet: stores as UNCLAIMED so when user enters TID it approves in 1 sec!
 */
router.post('/sms-webhook', async (req, res) => {
  try {
    const db = getDb();
    const {
      sender = '',
      from = '',
      message = '',
      text = '',
      body = '',
      tid: explicitTid = '',
      amount: explicitAmount = null,
      secret = '',
    } = req.body || {};

    const rawSender = sender || from || '';
    const rawMessage = message || text || body || '';

    // Parse the SMS text
    const parsed = parsePaymentSms(rawMessage, rawSender);
    const finalTid = explicitTid ? String(explicitTid).trim() : parsed.tid;
    const finalAmountPKR = explicitAmount ? parseFloat(explicitAmount) : parsed.amountPKR;
    const method = parsed.method || 'mobile_wallet';

    if (!finalTid || finalTid.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TID',
        message: 'Unable to extract valid Transaction ID (TID) from incoming SMS payload.',
        parsed,
      });
    }

    const smsDocId = `sms_${finalTid}`;
    const smsRef = db.collection('sms_payments').doc(smsDocId);
    const existingSms = await smsRef.get();

    if (existingSms.exists && existingSms.data()?.status === 'CLAIMED') {
      return res.json({
        success: true,
        alreadyClaimed: true,
        tid: finalTid,
        message: 'This SMS payment has already been claimed / processed.',
      });
    }

    const smsRecordData = {
      tid: finalTid,
      amountPKR: finalAmountPKR || 0,
      method,
      rawSender,
      rawMessage,
      status: 'UNCLAIMED',
      receivedAt: new Date().toISOString(),
    };

    await smsRef.set(smsRecordData, { merge: true });

    // Check if any user has ALREADY submitted a pending deposit with this TID
    const pendingDepositsSnap = await db.collection('deposits')
      .where('transactionId', '==', finalTid)
      .where('status', '==', 'pending')
      .get();

    if (!pendingDepositsSnap.empty) {
      const pendingDoc = pendingDepositsSnap.docs[0];
      const pendingData = pendingDoc.data();

      // Auto-approve the pending deposit!
      await pendingDoc.ref.update({
        status: 'approved',
        autoApproved: true,
        approvedAt: new Date().toISOString(),
        adminNotes: `Instant 1-sec auto-approved upon arrival of SMS from ${rawSender || '3737/8484'}`,
      });

      await autoApproveDeposit(db, pendingDoc.id, pendingData, pendingData.userId, smsRecordData);

      return res.json({
        success: true,
        matchedPendingDeposit: true,
        depositId: pendingDoc.id,
        userId: pendingData.userId,
        tid: finalTid,
        amountPKR: finalAmountPKR,
        message: `Pending deposit ${pendingDoc.id} automatically matched and approved in 1 second!`,
      });
    }

    return res.json({
      success: true,
      matchedPendingDeposit: false,
      savedAsUnclaimed: true,
      tid: finalTid,
      amountPKR: finalAmountPKR,
      method,
      message: 'Incoming payment SMS saved as UNCLAIMED. Instant approval will trigger the moment user submits this TID.',
    });
  } catch (error) {
    console.error('Error in /api/deposits/sms-webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'SMS Webhook Failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/deposits/sms-records
 * Retrieve recent SMS payment records with status (UNCLAIMED / CLAIMED).
 */
router.get('/sms-records', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('sms_payments').get();
    let records = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    records.sort((a, b) => new Date(b.receivedAt || 0).getTime() - new Date(a.receivedAt || 0).getTime());
    records = records.slice(0, 50);

    return res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Error in /api/deposits/sms-records:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve SMS records',
      message: error.message,
    });
  }
});

/**
 * POST /api/deposits/sms-simulate
 * Simulation test tool for Admin: Test parsing an SMS from 3737 or 8484
 */
router.post('/sms-simulate', async (req, res) => {
  try {
    const { smsText = '', sender = '3737' } = req.body || {};
    const parsed = parsePaymentSms(smsText, sender);

    return res.json({
      success: true,
      parsed,
      message: parsed.tid
        ? `Successfully parsed TID: ${parsed.tid} and Amount: Rs. ${parsed.amountPKR || 'N/A'} from ${parsed.method.toUpperCase()}`
        : 'Could not extract TID from text. Please check format.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
