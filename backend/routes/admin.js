/**
 * TAEMRY FLUX - Admin Route Module (Phase 5)
 * Full Administration API Suite:
 * - Dashboard Analytics & 7-Day Performance Charts
 * - User Management (List, Search, Pagination, Inspection, Downline Level 1, Balance Adjustment, Block/Unblock)
 * - Deposit Approvals & Rejections with Ledger Credits & Audit Logging
 * - Withdrawal Settlement (Mark as Paid / Reject) with Ledger Debits & Audit Logging
 * - System Settings Configuration (Exchange Rate, Limits, Cooldown, Admin Accounts)
 * - Broadcast Notifications System
 * - Historical Audit Logs Tracking
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * Helper to record immutable audit log entry
 */
async function recordAuditLog(db, entry) {
  try {
    await db.collection('auditLogs').add({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to record audit log:', err.message);
  }
}

/**
 * a) GET /api/admin/stats
 * Returns overarching platform health, financial liabilities, user counts, and 7-day charts.
 */
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();

    // 1. Fetch Users
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map((d) => d.data());

    const totalUsers = users.length;
    let platformBalance = 0;
    let activeUsers = 0;

    users.forEach((u) => {
      platformBalance += Number(u.walletBalance || 0);
      if (u.isEligible !== false && !u.isBlocked) {
        activeUsers++;
      }
    });

    // 2. Fetch Deposits
    const depositsSnap = await db.collection('deposits').get();
    const deposits = depositsSnap.docs.map((d) => d.data());

    let totalDeposits = 0;
    let pendingDeposits = 0;
    let todayDepositsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    deposits.forEach((d) => {
      if (d.status === 'approved') {
        totalDeposits += Number(d.amountUSD || 0);
      }
      if (d.status === 'pending') {
        pendingDeposits++;
      }
      if (d.createdAt && d.createdAt.startsWith(todayStr)) {
        todayDepositsCount++;
      }
    });

    // 3. Fetch Withdrawals
    const withdrawalsSnap = await db.collection('withdrawals').get();
    const withdrawals = withdrawalsSnap.docs.map((d) => d.data());

    let totalWithdrawals = 0;
    let pendingWithdrawals = 0;
    let todayWithdrawalsCount = 0;

    withdrawals.forEach((w) => {
      if (w.status === 'paid' || w.status === 'approved') {
        totalWithdrawals += Number(w.amountUSD || 0);
      }
      if (w.status === 'pending') {
        pendingWithdrawals++;
      }
      if (w.createdAt && w.createdAt.startsWith(todayStr)) {
        todayWithdrawalsCount++;
      }
    });

    // 4. Generate 7-Day Chart Data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      // Daily users registered
      const dayUsers = users.filter((u) => u.createdAt && u.createdAt.startsWith(dateStr)).length;

      // Daily approved deposits vs paid withdrawals
      const dayRevenue = deposits
        .filter((dep) => dep.status === 'approved' && dep.createdAt && dep.createdAt.startsWith(dateStr))
        .reduce((sum, item) => sum + Number(item.amountUSD || 0), 0);

      const dayPayouts = withdrawals
        .filter((w) => (w.status === 'paid' || w.status === 'approved') && w.createdAt && w.createdAt.startsWith(dateStr))
        .reduce((sum, item) => sum + Number(item.amountUSD || 0), 0);

      last7Days.push({
        date: dateStr,
        label: dayLabel,
        users: dayUsers,
        revenue: +dayRevenue.toFixed(2),
        payouts: +dayPayouts.toFixed(2),
      });
    }

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        platformBalance: +platformBalance.toFixed(2),
        totalDeposits: +totalDeposits.toFixed(2),
        totalWithdrawals: +totalWithdrawals.toFixed(2),
        pendingDeposits,
        pendingWithdrawals,
        todayActivity: {
          deposits: todayDepositsCount,
          withdrawals: todayWithdrawalsCount,
          total: todayDepositsCount + todayWithdrawalsCount,
        },
        charts: {
          growth: last7Days,
          financials: last7Days,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats',
      message: error.message,
    });
  }
});

/**
 * b) GET /api/admin/users
 * Paginated user directory with search by name/email.
 */
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const search = (req.query.search || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const usersSnap = await db.collection('users').get();
    let allUsers = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || 'N/A',
        name: data.name || data.displayName || 'TAEMRY Member',
        currentPackage: data.currentPackage || 'Bronze',
        walletBalance: Number(data.walletBalance || 0),
        referralCount: Number(data.referralCount || 0),
        isEligible: data.isEligible !== false,
        isBlocked: Boolean(data.isBlocked),
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });

    // Apply search filter if provided
    if (search) {
      allUsers = allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.name.toLowerCase().includes(search) ||
          u.uid.toLowerCase().includes(search)
      );
    }

    // Sort newest first
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalUsers = allUsers.length;
    const totalPages = Math.ceil(totalUsers / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      totalUsers,
      totalPages,
      currentPage: page,
      limit,
      users: paginatedUsers,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user list',
      message: error.message,
    });
  }
});

/**
 * c) PUT /api/admin/users/:uid/block
 * Toggle user blocked status.
 */
router.put('/users/:uid/block', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = doc.data();
    const currentStatus = Boolean(userData.isBlocked);
    const newStatus = !currentStatus;

    await userRef.update({
      isBlocked: newStatus,
      updatedAt: new Date().toISOString(),
    });

    const actionName = newStatus ? 'block_user' : 'unblock_user';
    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: actionName,
      targetUid: uid,
      targetEmail: userData.email || 'N/A',
      details: `User was ${newStatus ? 'blocked' : 'unblocked'} by admin.`,
      amountUSD: null,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `User ${newStatus ? 'blocked' : 'unblocked'} successfully.`,
      isBlocked: newStatus,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/block:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle user block status',
      message: error.message,
    });
  }
});

/**
 * d) GET /api/admin/users/:uid
 * Returns comprehensive profile, Level 1 downline network, and transaction audit ledger.
 */
router.get('/users/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();

    // 1. User doc
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = userDoc.data();

    // 2. Transactions
    let transactions = [];
    try {
      const txSnap = await db.collection(`users/${uid}/transactions`).orderBy('timestamp', 'desc').get();
      transactions = txSnap.docs.map((d) => d.data());
    } catch (e) {
      // Fallback
    }

    // 3. Downline Level 1
    const allUsersSnap = await db.collection('users').get();
    const downline = allUsersSnap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((u) => u.referrerUid === uid || u.referredBy === uid || u.sponsorUid === uid)
      .map((u) => ({
        uid: u.uid,
        name: u.name || 'Member',
        email: u.email,
        currentPackage: u.currentPackage || 'Bronze',
        createdAt: u.createdAt,
      }));

    return res.json({
      success: true,
      user: {
        uid,
        ...user,
      },
      transactions,
      downline,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/:uid:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message,
    });
  }
});

/**
 * e) PUT /api/admin/users/:uid/wallet
 * Manually adjust user balance with audit log and ledger entry.
 */
router.put('/users/:uid/wallet', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { amount, action, reason } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    if (!['add', 'subtract'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be either 'add' or 'subtract'." });
    }

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = doc.data();
    const currentBalance = Number(userData.walletBalance || 0);

    let newBalance = currentBalance;
    if (action === 'add') {
      newBalance = +(currentBalance + numAmount).toFixed(2);
    } else {
      if (currentBalance < numAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to deduct $${numAmount}. User only has $${currentBalance.toFixed(2)}.`,
        });
      }
      newBalance = +(currentBalance - numAmount).toFixed(2);
    }

    // Update user balance
    await userRef.update({
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    // Create user transaction entry
    const deltaAmount = action === 'add' ? numAmount : -numAmount;
    await db.collection(`users/${uid}/transactions`).add({
      type: 'admin_adjustment',
      amount: deltaAmount,
      balanceAfter: newBalance,
      description: reason || `Admin adjustment (${action}): $${numAmount.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });

    // Record audit log
    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'wallet_adjustment',
      targetUid: uid,
      targetEmail: userData.email || 'N/A',
      amountUSD: deltaAmount,
      details: `${action === 'add' ? 'Added' : 'Subtracted'} $${numAmount.toFixed(2)}. Reason: ${reason || 'Manual correction'}. Balance: $${currentBalance} -> $${newBalance}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Successfully adjusted balance by ${action === 'add' ? '+' : '-'}$${numAmount.toFixed(2)}.`,
      newBalance,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to adjust wallet balance',
      message: error.message,
    });
  }
});

/**
 * f) GET /api/admin/deposits
 * Retrieve deposit requests with status filter.
 */
router.get('/deposits', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const status = req.query.status; // 'pending' | 'approved' | 'rejected' | 'all'

    const depositsSnap = await db.collection('deposits').get();
    let deposits = depositsSnap.docs.map((d) => {
      const data = d.data();
      return {
        depositId: d.id,
        id: d.id,
        ...data,
      };
    });

    if (status && status !== 'all') {
      deposits = deposits.filter((d) => d.status === status);
    }

    deposits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      count: deposits.length,
      deposits,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/deposits:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deposits',
      message: error.message,
    });
  }
});

/**
 * g) PUT /api/admin/deposits/:depositId/approve
 * Approves deposit, credits user wallet, writes transaction, logs audit.
 */
router.put('/deposits/:depositId/approve', verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const db = getDb();

    const depositRef = db.collection('deposits').doc(depositId);
    const depositDoc = await depositRef.get();

    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    const deposit = depositDoc.data();
    if (deposit.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Deposit has already been approved.' });
    }

    const amountUSD = Number(deposit.amountUSD || 0);
    const userId = deposit.userId;

    // Credit user's wallet
    let newBalance = amountUSD;
    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const currentBalance = Number(userDoc.data().walletBalance || 0);
        newBalance = +(currentBalance + amountUSD).toFixed(2);
        await userRef.update({
          walletBalance: newBalance,
          updatedAt: new Date().toISOString(),
        });
      }

      // Add transaction entry
      await db.collection(`users/${userId}/transactions`).add({
        type: 'deposit',
        amount: +amountUSD,
        balanceAfter: newBalance,
        description: `Deposit approved (${deposit.method})`,
        depositId,
        timestamp: new Date().toISOString(),
      });
    }

    // Update deposit status
    await depositRef.update({
      status: 'approved',
      approvedBy: req.user.email,
      approvedAt: new Date().toISOString(),
    });

    // Record audit log
    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'approved_deposit',
      targetUid: userId,
      targetEmail: deposit.userEmail || 'N/A',
      amountUSD,
      depositId,
      details: `Approved $${amountUSD} deposit via ${deposit.method} for ${deposit.userEmail || userId}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Deposit of $${amountUSD} approved successfully. User credited.`,
      depositId,
      newBalance,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/deposits/:depositId/approve:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve deposit',
      message: error.message,
    });
  }
});

/**
 * h) PUT /api/admin/deposits/:depositId/reject
 * Reject deposit request.
 */
router.put('/deposits/:depositId/reject', verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const { reason } = req.body;
    const db = getDb();

    const depositRef = db.collection('deposits').doc(depositId);
    const depositDoc = await depositRef.get();

    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    const deposit = depositDoc.data();

    await depositRef.update({
      status: 'rejected',
      rejectReason: reason || 'Invalid screenshot or unconfirmed payment transfer.',
      rejectedBy: req.user.email,
      rejectedAt: new Date().toISOString(),
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'rejected_deposit',
      targetUid: deposit.userId,
      targetEmail: deposit.userEmail || 'N/A',
      amountUSD: Number(deposit.amountUSD || 0),
      depositId,
      details: `Rejected deposit of $${deposit.amountUSD}. Reason: ${reason || 'Unverified receipt'}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Deposit request rejected successfully.',
      depositId,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/deposits/:depositId/reject:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject deposit',
      message: error.message,
    });
  }
});

/**
 * i) GET /api/admin/withdrawals
 * Retrieve withdrawals list with status filter.
 */
router.get('/withdrawals', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const status = req.query.status; // 'pending' | 'paid' | 'rejected' | 'all'

    const withdrawalsSnap = await db.collection('withdrawals').get();
    let withdrawals = withdrawalsSnap.docs.map((d) => {
      const data = d.data();
      return {
        withdrawalId: d.id,
        id: d.id,
        ...data,
      };
    });

    if (status && status !== 'all') {
      withdrawals = withdrawals.filter((w) => w.status === status);
    }

    withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/withdrawals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawals',
      message: error.message,
    });
  }
});

/**
 * j) PUT /api/admin/withdrawals/:withdrawalId/mark-paid
 * Marks withdrawal as paid, deducts wallet balance, creates transaction, logs audit.
 */
router.put('/withdrawals/:withdrawalId/mark-paid', verifyAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const db = getDb();

    const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    const doc = await withdrawalRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }

    const withdrawal = doc.data();
    if (withdrawal.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Withdrawal is already marked as paid.' });
    }

    const amountUSD = Number(withdrawal.amountUSD || 0);
    const userId = withdrawal.userId;

    let newBalance = 0;
    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const currentBalance = Number(userDoc.data().walletBalance || 0);
        newBalance = Math.max(0, +(currentBalance - amountUSD).toFixed(2));
        await userRef.update({
          walletBalance: newBalance,
          updatedAt: new Date().toISOString(),
        });
      }

      // Add debit transaction
      await db.collection(`users/${userId}/transactions`).add({
        type: 'withdrawal',
        amount: -amountUSD,
        balanceAfter: newBalance,
        description: `Withdrawal paid via ${withdrawal.method}`,
        withdrawalId,
        timestamp: new Date().toISOString(),
      });
    }

    await withdrawalRef.update({
      status: 'paid',
      paidBy: req.user.email,
      paidAt: new Date().toISOString(),
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'mark_withdrawal_paid',
      targetUid: userId,
      targetEmail: withdrawal.userEmail || 'N/A',
      amountUSD,
      withdrawalId,
      details: `Settled withdrawal of $${amountUSD} (${withdrawal.amountPKR} PKR) to ${withdrawal.accountName} via ${withdrawal.method}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Withdrawal of $${amountUSD} marked as paid successfully. User wallet debited.`,
      withdrawalId,
      newBalance,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/withdrawals/:withdrawalId/mark-paid:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark withdrawal as paid',
      message: error.message,
    });
  }
});

/**
 * k) PUT /api/admin/withdrawals/:withdrawalId/reject
 * Rejects withdrawal request.
 */
router.put('/withdrawals/:withdrawalId/reject', verifyAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const db = getDb();

    const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    const doc = await withdrawalRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }

    const withdrawal = doc.data();

    await withdrawalRef.update({
      status: 'rejected',
      rejectReason: reason || 'Invalid recipient details or security policy restriction.',
      rejectedBy: req.user.email,
      rejectedAt: new Date().toISOString(),
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'reject_withdrawal',
      targetUid: withdrawal.userId,
      targetEmail: withdrawal.userEmail || 'N/A',
      amountUSD: Number(withdrawal.amountUSD || 0),
      withdrawalId,
      details: `Rejected withdrawal of $${withdrawal.amountUSD}. Reason: ${reason || 'Invalid account details'}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Withdrawal request rejected.',
      withdrawalId,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/withdrawals/:withdrawalId/reject:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject withdrawal',
      message: error.message,
    });
  }
});

/**
 * l) GET /api/admin/audit-logs
 * Fetch auditLogs collection sorted by timestamp desc.
 */
router.get('/audit-logs', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const logsSnap = await db.collection('auditLogs').get();

    const logs = logsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error.message,
    });
  }
});

/**
 * m) PUT /api/admin/settings
 * Updates systemSettings document and writes audit log.
 */
router.put('/settings', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const updates = req.body || {};

    const settingsRef = db.collection('systemSettings').doc('general');
    const existingDoc = await settingsRef.get();
    const existing = existingDoc.exists ? existingDoc.data() : {};

    const newSettings = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    };

    await settingsRef.set(newSettings, { merge: true });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'update_settings',
      targetUid: null,
      targetEmail: null,
      amountUSD: null,
      details: `Updated platform settings: ${Object.keys(updates).join(', ')}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'System settings saved successfully.',
      settings: newSettings,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save system settings',
      message: error.message,
    });
  }
});

/**
 * n) POST /api/admin/notifications/broadcast
 * Broadcast notification to all members.
 */
router.post('/notifications/broadcast', verifyAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const db = getDb();
    const notifRecord = {
      title: title.trim(),
      message: message.trim(),
      author: req.user.email,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('notifications').add(notifRecord);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'broadcast_notification',
      targetUid: null,
      targetEmail: 'ALL_USERS',
      amountUSD: null,
      details: `Broadcast notification: "${title.trim()}"`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Broadcast notification published successfully.',
      notification: {
        id: docRef.id,
        ...notifRecord,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/notifications/broadcast:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification',
      message: error.message,
    });
  }
});

export default router;
