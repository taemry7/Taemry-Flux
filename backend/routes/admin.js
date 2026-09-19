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
import fs from 'fs';
import path from 'path';
import { admin, getDb } from '../firebaseAdmin.js';
import { verifyAdmin } from '../middleware/admin.js';
import { sendDailyReportEmail, sendAdminErrorAlert } from '../utils/email.js';
import { exportFirestoreBackup } from '../scripts/backupFirestore.js';
import { TEAM_REWARDS, TEAM_MILESTONES } from '../milestoneLogic.js';
import { DEFAULT_PACKAGES, normalizePackages, savePackagesToDisk } from './package.js';
import { getPersistentRegisteredEmails } from './auth.js';
import { upload, uploadScreenshotToStorage } from '../middleware/upload.js';
import { updateSystemSettings } from './settings.js';
import { saveMilestonesToDisk } from './milestones.js';
import {
  findAdminUserRef,
  recordPermanentAuditLog,
  getCombinedAuditLogs,
  savePermanentBroadcast,
  getCombinedBroadcasts,
  persistRegisteredUserEmail,
} from '../utils/userPersistence.js';

const router = express.Router();

/**
 * Helper to record immutable audit log entry permanently to Firestore and disk
 */
async function recordAuditLog(db, entry) {
  try {
    await recordPermanentAuditLog(db, entry);
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
    const todayStr = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // 1. Parallel collection queries for maximum speed
    const [usersSnap, ticketsSnap, depositsSnap, withdrawalsSnap, minerSnap] = await Promise.all([
      db.collection('users').get().catch(() => ({ docs: [] })),
      db.collection('supportTickets').get().catch(() => ({ docs: [] })),
      db.collection('deposits').get().catch(() => ({ docs: [] })),
      db.collection('withdrawals').get().catch(() => ({ docs: [] })),
      db.collection('cloudMiner').get().catch(() => ({ docs: [] })),
    ]);

    // 2. Parse Users
    const users = (usersSnap.docs || []).map((d) => ({ uid: d.id, ...d.data() }));

    // Merge persistent registered accounts so user counts never drop
    try {
      const persistentEmails = getPersistentRegisteredEmails();
      const existingEmails = new Set(users.map((u) => (u.email || '').toLowerCase().trim()));
      persistentEmails.forEach((email) => {
        if (email && !existingEmails.has(email)) {
          users.push({
            uid: 'user_' + Buffer.from(email).toString('hex').slice(0, 10),
            email,
            name: email.split('@')[0],
            displayName: email.split('@')[0],
            walletBalance: 0,
            currentPackage: 'None',
            isEligible: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
    } catch (regErr) {
      console.warn('Persistent registered emails merge notice:', regErr.message);
    }

    let totalUsers = users.length;
    let platformBalance = 0;
    let totalEarned = 0;
    let activeUsers = 0;
    let dailyActiveUsers = 0;
    let usersDepositsTotal = 0;

    users.forEach((u) => {
      platformBalance += Number(u.walletBalance || 0);
      const uEarned = Number(u.totalEarned || u.lifetimeEarned || u.earnings || 0);
      totalEarned += uEarned;
      if (!uEarned && u.lifetimeAds) {
        totalEarned += Number(u.lifetimeAds) * 0.002;
      }
      if (u.totalDeposits) {
        usersDepositsTotal += Number(u.totalDeposits || 0);
      }
      if (u.isEligible !== false && !u.isBlocked) {
        activeUsers++;
      }
      if (u.lastAdWatchDate === todayStr || (u.dailyAdCount && u.dailyAdCount > 0)) {
        dailyActiveUsers++;
      }
    });

    // Also check transactions collection to verify total earned yields and deposits
    try {
      const txSnap = await db.collection('transactions').get().catch(() => ({ docs: [] }));
      let txEarned = 0;
      let txDeposits = 0;
      (txSnap.docs || []).forEach((tDoc) => {
        const t = tDoc.data() || {};
        if (['ad_reward', 'ad_earning', 'matching_commission', 'referral_bonus', 'milestone_reward', 'yield_credit'].includes(t.type)) {
          txEarned += Math.abs(Number(t.amount || 0));
        }
        if (t.type === 'deposit') {
          txDeposits += Math.abs(Number(t.amount || 0));
        }
      });
      if (txEarned > totalEarned) {
        totalEarned = txEarned;
      }
      if (txDeposits > usersDepositsTotal) {
        usersDepositsTotal = txDeposits;
      }
    } catch (e) {}

    // 3. Support Tickets
    let pendingTickets = 0;
    (ticketsSnap.docs || []).forEach((d) => {
      const t = d.data() || {};
      if (t.status === 'open' || t.status === 'in-progress') {
        pendingTickets++;
      }
    });

    // 4. Parse Deposits
    const deposits = (depositsSnap.docs || []).map((d) => ({ id: d.id, depositId: d.id, ...d.data() }));
    let totalDeposits = 0;
    let pendingDeposits = 0;
    let todayDepositsCount = 0;

    deposits.forEach((d) => {
      const amt = Number(d.amountUSD || d.amount || (d.amountPKR ? (d.amountPKR / (d.exchangeRate || 300)) : 0));
      if (d.status === 'approved' || d.status === 'completed') {
        totalDeposits += amt;
      }
      if (d.status === 'pending') {
        pendingDeposits++;
      }
      if (d.createdAt && d.createdAt.startsWith(todayStr)) {
        todayDepositsCount++;
      }
    });

    if (usersDepositsTotal > totalDeposits) {
      totalDeposits = usersDepositsTotal;
    }

    // 5. Parse Withdrawals
    const withdrawals = (withdrawalsSnap.docs || []).map((d) => ({ id: d.id, ...d.data() }));
    let totalWithdrawals = 0;
    let pendingWithdrawals = 0;
    let todayWithdrawalsCount = 0;

    withdrawals.forEach((w) => {
      const amt = Number(w.amountUSD || w.amount || 0);
      if (w.status === 'paid' || w.status === 'approved' || w.status === 'completed') {
        totalWithdrawals += amt;
      }
      if (w.status === 'pending') {
        pendingWithdrawals++;
      }
      if (w.createdAt && w.createdAt.startsWith(todayStr)) {
        todayWithdrawalsCount++;
      }
    });

    // 6. Cloud Miner Metrics
    let activeMiners = 0;
    let totalMinedTflx = 0;
    let totalHashrateRunning = 0;

    const recordedMiners = new Set();
    (minerSnap.docs || []).forEach((d) => {
      recordedMiners.add(d.id);
      const m = d.data() || {};
      const startTime = Number(m.sessionStartTime) || 0;
      const duration = Number(m.sessionDurationMs) || (12 * 60 * 60 * 1000);
      const isLive = m.isMiningActive && (now - startTime < duration);
      const hashrate = Number(m.effectiveHashrate) || 8.0;
      const mined = Number(m.minedTflx) || 0;

      totalMinedTflx += mined;
      if (isLive) {
        activeMiners++;
        totalHashrateRunning += hashrate;
      }
    });

    // Also include any user records that have minedTflx
    users.forEach((u) => {
      if (!recordedMiners.has(u.uid) && u.minedTflx) {
        totalMinedTflx += Number(u.minedTflx) || 0;
      }
    });

    // 7. Generate 7-Day Chart Data
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
        totalEarned: +totalEarned.toFixed(2),
        platformBalance: +platformBalance.toFixed(2),
        totalDeposits: +totalDeposits.toFixed(2),
        totalWithdrawals: +totalWithdrawals.toFixed(2),
        pendingDeposits,
        pendingWithdrawals,
        pendingTickets,
        dailyActiveUsers,
        cloudMiner: {
          activeMiners,
          totalMinedTflx: +totalMinedTflx.toFixed(2),
          totalHashrate: +totalHashrateRunning.toFixed(1),
          totalMinersRecorded: Math.max((minerSnap.docs || []).length, users.length),
        },
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

    const usersSnap = await db.collection('users').get().catch(() => ({ docs: [] }));
    let allUsers = (usersSnap.docs || []).map((doc) => {
      const data = doc.data() || {};
      return {
        uid: doc.id,
        email: data.email || 'N/A',
        name: data.name || data.displayName || 'TAEMRY Member',
        currentPackage: data.currentPackage || 'None',
        walletBalance: Number(data.walletBalance || 0),
        referralCount: Number(data.referralCount || 0),
        isEligible: Boolean(data.isEligible),
        isBlocked: Boolean(data.isBlocked),
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });

    // Merge persistent registered accounts so users are never missing
    try {
      const persistentEmails = getPersistentRegisteredEmails();
      persistentEmails.forEach((email) => {
        if (email) {
          allUsers.push({
            uid: 'user_' + Buffer.from(email).toString('hex').slice(0, 10),
            email,
            name: email.split('@')[0],
            currentPackage: 'None',
            walletBalance: 0,
            referralCount: 0,
            isEligible: false,
            isBlocked: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
    } catch (e) {}

    // Deduplicate allUsers by lowercase email, merging properties
    const userByEmail = new Map();
    allUsers.forEach((u) => {
      const emailKey = (u.email || '').toLowerCase().trim();
      if (!emailKey || emailKey === 'n/a') {
        userByEmail.set(u.uid, u);
      } else if (!userByEmail.has(emailKey)) {
        userByEmail.set(emailKey, u);
      } else {
        const existing = userByEmail.get(emailKey);
        // Prefer non-zero / active data
        const merged = {
          ...existing,
          ...u,
          uid: existing.uid.startsWith('user_') && !u.uid.startsWith('user_') ? u.uid : existing.uid,
          walletBalance: Math.max(existing.walletBalance || 0, u.walletBalance || 0),
          referralCount: Math.max(existing.referralCount || 0, u.referralCount || 0),
          currentPackage: existing.currentPackage !== 'None' ? existing.currentPackage : u.currentPackage,
          isEligible: existing.isEligible || u.isEligible,
          isBlocked: existing.isBlocked || u.isBlocked,
        };
        userByEmail.set(emailKey, merged);
      }
    });
    allUsers = Array.from(userByEmail.values());

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
 * c1) DELETE /api/admin/users/:uid
 * Permanently deletes a single user from Firestore, memory, and registry.
 * Protected: Super Admin (mistrtaimoor@gmail.com) can never be deleted.
 */
router.delete('/users/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    const userData = doc.exists ? doc.data() : null;
    const userEmail = (userData?.email || '').toLowerCase().trim();

    if (userEmail === 'mistrtaimoor@gmail.com' || uid === 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account (mistrtaimoor@gmail.com) is permanently protected and cannot be deleted.',
      });
    }

    // 1. Delete from database
    await userRef.delete().catch(() => {});
    if (db && db.data && typeof db.data.delete === 'function') {
      db.data.delete(`users/${uid}`);
      if (typeof db._persist === 'function') db._persist();
    }

    // 2. Remove from persistent files
    try {
      const regFile = path.resolve(process.cwd(), '.registered_users.json');
      if (fs.existsSync(regFile) && userEmail) {
        const list = JSON.parse(fs.readFileSync(regFile, 'utf-8'));
        const updated = list.filter((e) => (e || '').toLowerCase().trim() !== userEmail);
        fs.writeFileSync(regFile, JSON.stringify(updated, null, 2), 'utf-8');
      }
      const verFile = path.resolve(process.cwd(), '.verified_users.json');
      if (fs.existsSync(verFile) && userEmail) {
        const list = JSON.parse(fs.readFileSync(verFile, 'utf-8'));
        const updated = list.filter((e) => (e || '').toLowerCase().trim() !== userEmail);
        fs.writeFileSync(verFile, JSON.stringify(updated, null, 2), 'utf-8');
      }
    } catch (e) {}

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'delete_user',
      targetUid: uid,
      targetEmail: userEmail || 'N/A',
      details: `User ${userEmail || uid} was permanently deleted by admin.`,
      amountUSD: null,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `User ${userEmail || uid} has been permanently deleted.`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/:uid:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

/**
 * c2) POST /api/admin/purge-users and POST /api/admin/reset-platform
 * Deletes all non-admin users, keeping ONLY mistrtaimoor@gmail.com,
 * and resets all deposits, withdrawals, transactions, earned stats, and platform liabilities to 0.
 */
const handlePlatformPurgeAndReset = async (req, res) => {
  try {
    const db = getDb();
    let deletedCount = 0;

    // 1. If standard Firestore (with collection method)
    if (db && typeof db.collection === 'function') {
      const collectionsToClear = [
        'deposits',
        'withdrawals',
        'transactions',
        'cloudMiner',
        'supportTickets',
        'auditLogs',
        'smsRecords',
      ];

      for (const colName of collectionsToClear) {
        try {
          const snap = await db.collection(colName).get();
          if (snap && snap.docs) {
            const batchPromises = snap.docs.map((d) => d.ref.delete().catch(() => {}));
            await Promise.all(batchPromises);
          }
        } catch (e) {
          console.warn(`Error clearing collection ${colName}:`, e.message);
        }
      }

      // Clear users except mistrtaimoor@gmail.com
      try {
        const usersSnap = await db.collection('users').get();
        if (usersSnap && usersSnap.docs) {
          for (const doc of usersSnap.docs) {
            const u = doc.data() || {};
            const email = (u.email || '').toLowerCase().trim();
            if (email !== 'mistrtaimoor@gmail.com' && doc.id !== 'RNva69V1XoMwaxGgVaKtJ4jXfYY2') {
              await doc.ref.delete().catch(() => {});
              deletedCount++;
            } else {
              // Reset mistrtaimoor to completely clean state
              await doc.ref.set({
                ...u,
                uid: doc.id,
                email: 'mistrtaimoor@gmail.com',
                name: u.name || u.displayName || 'Taimoor',
                displayName: u.displayName || u.name || 'Taimoor',
                walletBalance: 0,
                currentPackage: 'None',
                lifetimeAds: 0,
                dailyAdCount: 0,
                teamAdsCount: 0,
                referralCount: 0,
                totalEarned: 0,
                isEligible: false,
                isBlocked: false,
                isAdmin: true,
                minedTflx: 0,
                lastAdWatchDate: null,
                updatedAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.warn('Error clearing users collection:', e.message);
      }
    }

    // 2. If MockFirestore (with in-memory map)
    if (db && db.data && typeof db.data.delete === 'function') {
      const keysToDelete = [];
      for (const [key, val] of db.data.entries()) {
        // Delete all deposits, withdrawals, transactions, logs, miner sessions
        if (
          key.startsWith('deposits/') ||
          key.startsWith('withdrawals/') ||
          key.startsWith('transactions/') ||
          key.startsWith('cloudMiner/') ||
          key.startsWith('supportTickets/') ||
          key.startsWith('auditLogs/') ||
          key.startsWith('smsRecords/')
        ) {
          keysToDelete.push(key);
        }

        // Delete all users except mistrtaimoor@gmail.com / Super Admin
        if (
          key.startsWith('users/') &&
          key !== 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2' &&
          val?.email?.toLowerCase() !== 'mistrtaimoor@gmail.com'
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((k) => {
        db.data.delete(k);
        if (k.startsWith('users/')) deletedCount++;
      });

      // Reset mistrtaimoor to clean state (0 balance, 0 earned, 0 ads, 0 liability)
      for (const [key, val] of db.data.entries()) {
        if (key.startsWith('users/') && (val?.email === 'mistrtaimoor@gmail.com' || key === 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2')) {
          db.data.set(key, {
            ...val,
            uid: 'RNva69V1XoMwaxGgVaKtJ4jXfYY2',
            email: 'mistrtaimoor@gmail.com',
            name: 'Taimoor',
            displayName: 'Taimoor',
            walletBalance: 0,
            currentPackage: 'None',
            lifetimeAds: 0,
            dailyAdCount: 0,
            teamAdsCount: 0,
            referralCount: 0,
            totalEarned: 0,
            isEligible: false,
            isBlocked: false,
            isAdmin: true,
            minedTflx: 0,
            lastAdWatchDate: null,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (typeof db._persist === 'function') db._persist();
    }

    // 3. Purge Firebase Auth users if Admin SDK auth is configured
    try {
      if (admin && typeof admin.auth === 'function') {
        const authInstance = admin.auth();
        if (typeof authInstance.listUsers === 'function') {
          const listRes = await authInstance.listUsers(1000).catch(() => null);
          if (listRes && listRes.users) {
            for (const userRecord of listRes.users) {
              const uEmail = (userRecord.email || '').toLowerCase().trim();
              if (uEmail && uEmail !== 'mistrtaimoor@gmail.com') {
                await authInstance.deleteUser(userRecord.uid).catch(() => {});
              }
            }
          }
        }
      }
    } catch (authErr) {
      console.warn('Firebase Auth users purge notice:', authErr.message);
    }

    // 4. Clean registry files to contain strictly mistrtaimoor@gmail.com
    try {
      const regFile = path.resolve(process.cwd(), '.registered_users.json');
      fs.writeFileSync(regFile, JSON.stringify(['mistrtaimoor@gmail.com'], null, 2), 'utf-8');
      const verFile = path.resolve(process.cwd(), '.verified_users.json');
      fs.writeFileSync(verFile, JSON.stringify(['mistrtaimoor@gmail.com'], null, 2), 'utf-8');
    } catch (e) {}

    // 5. Update .mock_firestore_cache.json if exists
    try {
      const cachePath = path.resolve(process.cwd(), '.mock_firestore_cache.json');
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const cleaned = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (k.startsWith('systemSettings/')) {
            cleaned[k] = v;
          } else if (k === 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2' || v?.email === 'mistrtaimoor@gmail.com') {
            cleaned[k] = {
              ...v,
              uid: 'RNva69V1XoMwaxGgVaKtJ4jXfYY2',
              email: 'mistrtaimoor@gmail.com',
              name: 'Taimoor',
              displayName: 'Taimoor',
              walletBalance: 0,
              currentPackage: 'None',
              lifetimeAds: 0,
              dailyAdCount: 0,
              teamAdsCount: 0,
              referralCount: 0,
              totalEarned: 0,
              isEligible: false,
              isBlocked: false,
              isAdmin: true,
              minedTflx: 0,
              lastAdWatchDate: null,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        fs.writeFileSync(cachePath, JSON.stringify(cleaned, null, 2), 'utf-8');
      }
    } catch (e) {}

    return res.json({
      success: true,
      deletedCount,
      message: `System successfully reset! All non-admin accounts removed. Deposits ($0.00), Total Earned ($0.00), Liability ($0.00), and DAU (0) reset to zero. Fresh start ready!`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/purge-users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to purge users and reset stats',
      message: error.message,
    });
  }
};

router.post('/purge-users', verifyAdmin, handlePlatformPurgeAndReset);
router.post('/reset-platform', verifyAdmin, handlePlatformPurgeAndReset);

/**
 * d) GET /api/admin/users/:uid
 * Returns comprehensive profile, Level 1 downline network, and transaction audit ledger.
 */
router.get('/users/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();

    // 1. User doc lookup with comprehensive fallback (UID, email, username, synthetic ID)
    const { ref: userRef, doc: userDoc, data: userData, uid: resolvedUid } = await findAdminUserRef(db, uid);
    if (!userDoc || !userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const actualUid = resolvedUid || uid;

    // 2. Transactions
    let transactions = [];
    try {
      const txSnap = await db.collection(`users/${actualUid}/transactions`).orderBy('timestamp', 'desc').get();
      transactions = txSnap.docs.map((d) => d.data());
    } catch (e) {
      // Fallback
    }

    // 3. Downline Level 1
    let downline = [];
    try {
      const allUsersSnap = await db.collection('users').get();
      downline = allUsersSnap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .filter((u) => u.referrerUid === actualUid || u.referredBy === actualUid || u.sponsorUid === actualUid || u.referrerUid === uid || u.referredBy === uid)
        .map((u) => ({
          uid: u.uid || u.id,
          name: u.name || 'Member',
          email: u.email,
          currentPackage: u.currentPackage || 'None',
          createdAt: u.createdAt,
        }));
    } catch (e) {}

    return res.json({
      success: true,
      user: {
        uid: actualUid,
        ...userData,
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
    const { ref: userRef, doc: userDoc, data: userData, uid: actualUid } = await findAdminUserRef(db, uid);

    if (!userRef || !userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentBalance = Number(userData?.walletBalance || 0);

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
    await userRef.set({
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Create user transaction entry
    const deltaAmount = action === 'add' ? numAmount : -numAmount;
    try {
      await db.collection(`users/${actualUid}/transactions`).add({
        type: 'admin_adjustment',
        amount: deltaAmount,
        balanceAfter: newBalance,
        description: reason || `Admin adjustment (${action}): $${numAmount.toFixed(2)}`,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}

    // Record audit log
    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'wallet_adjustment',
      targetUid: actualUid,
      targetEmail: userData?.email || 'N/A',
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
 * e0) POST /api/admin/users/send-reward
 * Directly sends bonuses/rewards (milestone, referral, special bonus, compensation) to any user.
 */
router.post('/users/send-reward', verifyAdmin, async (req, res) => {
  try {
    const { target, uid, amount, rewardType, reason, note } = req.body;
    const identifier = uid || target;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Target user (UID, email, or username) is required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Reward amount must be a positive number.' });
    }

    const db = getDb();
    const { ref: userRef, doc: userDoc, data: userData, uid: actualUid } = await findAdminUserRef(db, identifier);

    if (!userRef || !userDoc) {
      return res.status(404).json({ success: false, message: `User "${identifier}" not found.` });
    }

    const currentBalance = Number(userData?.walletBalance || 0);
    const currentTotalEarned = Number(userData?.totalEarned || 0);
    const newBalance = +(currentBalance + numAmount).toFixed(2);
    const newTotalEarned = +(currentTotalEarned + numAmount).toFixed(2);

    const typeLabel = rewardType || 'milestone_reward';
    const desc = reason || note || `Admin Reward (${typeLabel}): +$${numAmount.toFixed(2)}`;

    // Credit user balance and total earned
    await userRef.set({
      walletBalance: newBalance,
      totalEarned: newTotalEarned,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Ledger entry
    try {
      await db.collection(`users/${actualUid}/transactions`).add({
        type: 'reward',
        rewardType: typeLabel,
        amount: +numAmount.toFixed(2),
        balanceAfter: newBalance,
        description: desc,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}

    // Audit log
    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'send_reward',
      targetUid: actualUid,
      targetEmail: userData?.email || 'N/A',
      amountUSD: numAmount,
      rewardType: typeLabel,
      details: `Sent reward +$${numAmount.toFixed(2)} (${typeLabel}) to ${userData?.email || actualUid}. Reason: ${desc}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Successfully sent reward of $${numAmount.toFixed(2)} to ${userData?.email || actualUid}.`,
      newBalance,
      user: {
        uid: actualUid,
        email: userData?.email,
        walletBalance: newBalance,
        totalEarned: newTotalEarned,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/send-reward:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send reward',
      message: error.message,
    });
  }
});

/**
 * e1) PUT /api/admin/users/:uid/package
 * Manually update or assign a user's advertising package tier.
 */
router.put('/users/:uid/package', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { packageTier, reason } = req.body;
    const db = getDb();

    const allowedPackages = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Apex'];
    const selectedPkg = packageTier || 'None';

    const { ref: userRef, doc: userDoc, data: userData, uid: actualUid } = await findAdminUserRef(db, uid);
    if (!userRef || !userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldPackage = userData?.currentPackage || 'None';
    const isEligible = selectedPkg !== 'None';

    await userRef.set({
      currentPackage: selectedPkg,
      isEligible,
      packagePurchasedAt: selectedPkg !== 'None' ? (userData?.packagePurchasedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'update_user_package',
      targetUid: actualUid,
      targetEmail: userData?.email || 'N/A',
      details: `Admin changed package tier from ${oldPackage} to ${selectedPkg}. Reason: ${reason || 'Admin manual update'}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `User package successfully updated to ${selectedPkg}.`,
      currentPackage: selectedPkg,
      isEligible,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/package:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user package',
      message: error.message,
    });
  }
});

/**
 * e2) PUT /api/admin/users/:uid/eligibility
 * Manually toggle a user's withdrawal and earning eligibility.
 */
router.put('/users/:uid/eligibility', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { isEligible, reason } = req.body;
    const db = getDb();

    const { ref: userRef, doc: userDoc, data: userData, uid: actualUid } = await findAdminUserRef(db, uid);
    if (!userRef || !userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = typeof isEligible === 'boolean' ? isEligible : !userData?.isEligible;

    await userRef.set({
      isEligible: newStatus,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'toggle_user_eligibility',
      targetUid: actualUid,
      targetEmail: userData?.email || 'N/A',
      details: `Admin set user eligibility to ${newStatus}. Reason: ${reason || 'Admin manual toggle'}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `User eligibility updated to ${newStatus ? 'Eligible' : 'Ineligible'}.`,
      isEligible: newStatus,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/eligibility:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle user eligibility',
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
 * PUT /api/admin/deposits/:depositId/receipt
 * Allows admin to upload or attach receipt/screenshot to a deposit record.
 */
router.put('/deposits/:depositId/receipt', verifyAdmin, (req, res, next) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err) console.warn('Multer admin receipt warning:', err.message);
    next();
  });
}, async (req, res) => {
  try {
    const { depositId } = req.params;
    const db = getDb();
    let screenshotURL = req.body?.screenshotURL || '';

    if (req.file) {
      try {
        screenshotURL = await uploadScreenshotToStorage(req.file, 'admin');
      } catch (e) {
        console.warn('Admin upload error:', e.message);
      }
    }

    if (!screenshotURL && req.body?.screenshot) {
      screenshotURL = req.body.screenshot;
    }

    if (!screenshotURL) {
      return res.status(400).json({ success: false, message: 'No receipt file or URL provided.' });
    }

    let depositRef = db.collection('deposits').doc(depositId);
    let depositDoc = await depositRef.get();
    if (!depositDoc.exists) {
      const snap = await db.collection('deposits').get();
      const match = snap.docs.find((d) => d.id === depositId || d.data().id === depositId || d.data().depositId === depositId);
      if (match) {
        depositRef = db.collection('deposits').doc(match.id);
        depositDoc = match;
      }
    }

    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }

    await depositRef.update({
      screenshotURL,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      screenshotURL,
      message: 'Receipt updated successfully.',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/deposits/:depositId/receipt:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update receipt',
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

    let depositRef = db.collection('deposits').doc(depositId);
    let depositDoc = await depositRef.get();

    // 1. If not found by direct doc ID, search collection for matching id or depositId
    if (!depositDoc.exists) {
      const snap = await db.collection('deposits').get();
      const match = snap.docs.find(
        (d) => d.id === depositId || d.data().id === depositId || d.data().depositId === depositId
      );
      if (match) {
        depositRef = db.collection('deposits').doc(match.id);
        depositDoc = match;
      }
    }

    // 2. If not found, return 404
    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }

    const deposit = depositDoc.data();
    if (deposit.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Deposit has already been approved.' });
    }

    const amountUSD = Number(deposit.amountUSD || 0);
    const userId = deposit.userId;

    // Credit user's wallet safely finding user by userId OR userEmail
    const { ref: userRef, doc: userDoc, data: userData, uid: actualUid } = await findAdminUserRef(db, userId || deposit.userEmail);
    let newBalance = amountUSD;
    if (userRef) {
      const currentBalance = Number(userData?.walletBalance || 0);
      newBalance = +(currentBalance + amountUSD).toFixed(2);
      await userRef.set({
        walletBalance: newBalance,
        totalDeposits: Number(userData?.totalDeposits || 0) + amountUSD,
        email: deposit.userEmail || userData?.email || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (deposit.userEmail) {
        persistRegisteredUserEmail(deposit.userEmail);
      }

      // Add transaction entry
      try {
        await db.collection(`users/${actualUid || userId}/transactions`).add({
          type: 'deposit',
          amount: +amountUSD,
          balanceAfter: newBalance,
          description: `Deposit approved (${deposit.method})`,
          depositId,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}
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

    let depositRef = db.collection('deposits').doc(depositId);
    let depositDoc = await depositRef.get();

    // 1. If not found by direct doc ID, search collection for matching id or depositId
    if (!depositDoc.exists) {
      const snap = await db.collection('deposits').get();
      const match = snap.docs.find(
        (d) => d.id === depositId || d.data().id === depositId || d.data().depositId === depositId
      );
      if (match) {
        depositRef = db.collection('deposits').doc(match.id);
        depositDoc = match;
      }
    }

    // 2. If not found, return 404
    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
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
 * h1) PUT /api/admin/deposits/:depositId/edit
 * Edit deposit Transaction ID (TID) or Admin notes.
 */
router.put('/deposits/:depositId/edit', verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const { tid, adminNotes } = req.body;
    const db = getDb();

    let depositRef = db.collection('deposits').doc(depositId);
    let depositDoc = await depositRef.get();

    if (!depositDoc.exists) {
      const snap = await db.collection('deposits').get();
      const match = snap.docs.find(
        (d) => d.id === depositId || d.data().id === depositId || d.data().depositId === depositId
      );
      if (match) {
        depositRef = db.collection('deposits').doc(match.id);
        depositDoc = match;
      }
    }

    if (!depositDoc.exists) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }

    const updates = {
      updatedAt: new Date().toISOString(),
    };
    if (tid !== undefined && tid !== null) {
      updates.tid = String(tid).trim();
    }
    if (adminNotes !== undefined && adminNotes !== null) {
      updates.adminNotes = String(adminNotes).trim();
    }

    await depositRef.update(updates);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'edit_deposit_details',
      targetUid: depositDoc.data().userId || null,
      targetEmail: depositDoc.data().userEmail || 'N/A',
      details: `Admin edited deposit details: TID updated to ${updates.tid || '(unchanged)'}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Deposit details updated successfully.',
      depositId,
      updates,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/deposits/:depositId/edit:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update deposit details',
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

    let withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    let doc = await withdrawalRef.get();

    // 1. Search by id or withdrawalId in collection if not found by path
    if (!doc.exists) {
      const snap = await db.collection('withdrawals').get();
      const match = snap.docs.find(
        (d) => d.id === withdrawalId || d.data().id === withdrawalId || d.data().withdrawalId === withdrawalId
      );
      if (match) {
        withdrawalRef = db.collection('withdrawals').doc(match.id);
        doc = match;
      }
    }

    // 2. If not found, return 404
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Withdrawal record not found.' });
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

    const { payoutTid, payoutReference } = req.body || {};
    const updateData = {
      status: 'paid',
      paidBy: req.user.email,
      paidAt: new Date().toISOString(),
    };
    if (payoutTid) updateData.payoutTid = String(payoutTid).trim();
    if (payoutReference) updateData.payoutReference = String(payoutReference).trim();

    await withdrawalRef.update(updateData);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'mark_withdrawal_paid',
      targetUid: userId,
      targetEmail: withdrawal.userEmail || 'N/A',
      amountUSD,
      withdrawalId,
      details: `Settled withdrawal of $${amountUSD} (${withdrawal.amountPKR} PKR) to ${withdrawal.accountName} via ${withdrawal.method}${payoutTid ? ` (TID: ${payoutTid})` : ''}`,
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

    let withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    let doc = await withdrawalRef.get();

    if (!doc.exists) {
      const snap = await db.collection('withdrawals').get();
      const match = snap.docs.find(
        (d) => d.id === withdrawalId || d.data().id === withdrawalId || d.data().withdrawalId === withdrawalId
      );
      if (match) {
        withdrawalRef = db.collection('withdrawals').doc(match.id);
        doc = match;
      }
    }

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Withdrawal record not found.' });
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
 * Fetch auditLogs collection merged with disk logs, sorted by timestamp desc.
 */
router.get('/audit-logs', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const logs = await getCombinedAuditLogs(db);

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
 * Updates systemSettings document, memory cache, and persistent disk file.
 */
router.put('/settings', verifyAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const db = getDb();

    // Updates in-memory cache, persistent disk file, and Firestore
    const newSettings = await updateSystemSettings(updates, req.user.email);

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
      message: 'System settings saved and applied live across the platform.',
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
 * m2) GET /api/admin/milestones
 * Retrieves live configurable team referral rewards and team ads milestones.
 */
router.get('/milestones', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('systemSettings').doc('milestones').get();
    let teamRewards = TEAM_REWARDS;
    let teamMilestones = TEAM_MILESTONES;

    if (doc && doc.exists && doc.data()) {
      const data = doc.data();
      if (Array.isArray(data.teamRewards) && data.teamRewards.length > 0) {
        teamRewards = data.teamRewards;
      }
      if (Array.isArray(data.teamMilestones) && data.teamMilestones.length > 0) {
        teamMilestones = data.teamMilestones;
      }
    }

    return res.json({
      success: true,
      teamRewards,
      teamMilestones,
      updatedAt: doc && doc.exists ? doc.data()?.updatedAt : null,
      updatedBy: doc && doc.exists ? doc.data()?.updatedBy : null,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/milestones:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch milestones settings',
      message: error.message,
    });
  }
});

/**
 * m3) PUT /api/admin/milestones
 * Updates configurable team rewards ladder and team ads milestones live in Firestore and disk.
 */
router.put('/milestones', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { teamRewards, teamMilestones } = req.body || {};

    if (!Array.isArray(teamRewards) && !Array.isArray(teamMilestones)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: teamRewards or teamMilestones array is required.',
      });
    }

    const milestonesRef = db.collection('systemSettings').doc('milestones');
    const existingDoc = await milestonesRef.get();
    const existing = existingDoc.exists ? existingDoc.data() : {};

    const updatedData = {
      ...existing,
      teamRewards: Array.isArray(teamRewards) ? teamRewards : (existing.teamRewards || TEAM_REWARDS),
      teamMilestones: Array.isArray(teamMilestones) ? teamMilestones : (existing.teamMilestones || TEAM_MILESTONES),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    };

    await milestonesRef.set(updatedData, { merge: true });

    // Persist to disk snapshot so it survives cold boots
    saveMilestonesToDisk(updatedData);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'update_milestones',
      targetUid: null,
      targetEmail: null,
      amountUSD: null,
      details: `Updated platform milestones ladder (${updatedData.teamRewards.length} referral rewards, ${updatedData.teamMilestones.length} ads milestones)`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Milestones and Team Rewards updated live in database and disk!',
      milestones: updatedData,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/milestones:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update milestones settings',
      message: error.message,
    });
  }
});

/**
 * n0) GET /api/admin/notifications/broadcast
 * Returns all past broadcast announcements.
 */
router.get('/notifications/broadcast', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const list = await getCombinedBroadcasts(db);
    return res.json({
      success: true,
      count: list.length,
      notifications: list,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/broadcast:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch broadcasts',
      message: error.message,
    });
  }
});

/**
 * n) POST /api/admin/notifications/broadcast
 * Broadcast notification to all members with persistent Firestore & disk storage.
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

    const saved = await savePermanentBroadcast(db, notifRecord);

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
      notification: saved,
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

/**
 * =========================================================================
 * PHASE 7: MANUAL OVERRIDES, MONITORING, BACKUP & MAINTENANCE ENDPOINTS
 * =========================================================================
 */

/**
 * o) PUT /api/admin/users/:uid/reset-daily-limit
 * Admin manual override: resets a member's daily ad count to 0 so they can view ads again immediately.
 */
router.put('/users/:uid/reset-daily-limit', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = doc.data();
    const todayStr = new Date().toISOString().split('T')[0];

    await userRef.update({
      dailyAdCount: 0,
      lastAdWatchDate: todayStr,
      updatedAt: new Date().toISOString(),
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'reset_daily_limit_override',
      targetUid: uid,
      targetEmail: userData.email || 'N/A',
      amountUSD: null,
      details: `Admin reset daily ad watch count to 0 for ${userData.email || uid}.`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Daily ad view limit successfully reset for ${userData.email || uid}.`,
      dailyAdCount: 0,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/reset-daily-limit:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset daily limit',
      message: error.message,
    });
  }
});

/**
 * p) PUT /api/admin/users/:uid/unblock
 * Explicitly unblock an account and restore full earning privileges.
 */
router.put('/users/:uid/unblock', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = doc.data();
    await userRef.update({
      isBlocked: false,
      updatedAt: new Date().toISOString(),
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'unblock_user',
      targetUid: uid,
      targetEmail: userData.email || 'N/A',
      details: `Account unblocked by admin.`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `User ${userData.email} successfully unblocked.`,
      isBlocked: false,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:uid/unblock:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unblock user',
      message: error.message,
    });
  }
});

/**
 * q) POST /api/admin/maintenance/backup
 * Manually trigger or test the full Firestore collections backup.
 */
router.post('/maintenance/backup', verifyAdmin, async (req, res) => {
  try {
    const backupResult = await exportFirestoreBackup();
    const db = getDb();

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'manual_firestore_backup',
      targetUid: null,
      targetEmail: 'SYSTEM',
      details: `Generated backup file: ${backupResult.filename}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Firestore database backup created successfully.',
      backup: backupResult,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/maintenance/backup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute database backup',
      message: error.message,
    });
  }
});

/**
 * r) POST /api/admin/maintenance/daily-report
 * Trigger generation and delivery of the daily platform performance email report.
 */
router.post('/maintenance/daily-report', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute DAU
    const usersSnap = await db.collection('users').get();
    let dauCount = 0;
    let newUsersCount = 0;
    let totalAdsCount = 0;

    usersSnap.docs.forEach((d) => {
      const u = d.data();
      if (u.lastAdWatchDate === todayStr || (u.dailyAdCount && u.dailyAdCount > 0)) {
        dauCount++;
      }
      if (u.createdAt && u.createdAt.startsWith(todayStr)) {
        newUsersCount++;
      }
      totalAdsCount += Number(u.dailyAdCount || 0);
    });

    // Approved deposits today
    const depositsSnap = await db.collection('deposits').get();
    let totalRevenue = 0;
    let pendingDeposits = 0;
    depositsSnap.docs.forEach((d) => {
      const dep = d.data();
      if (dep.status === 'approved' && dep.createdAt && dep.createdAt.startsWith(todayStr)) {
        totalRevenue += Number(dep.amountUSD || 0);
      }
      if (dep.status === 'pending') {
        pendingDeposits++;
      }
    });

    // Withdrawals today
    const withdrawalsSnap = await db.collection('withdrawals').get();
    let totalPayouts = 0;
    let pendingWithdrawals = 0;
    withdrawalsSnap.docs.forEach((d) => {
      const wd = d.data();
      if ((wd.status === 'paid' || wd.status === 'approved') && wd.createdAt && wd.createdAt.startsWith(todayStr)) {
        totalPayouts += Number(wd.amountUSD || 0);
      }
      if (wd.status === 'pending') {
        pendingWithdrawals++;
      }
    });

    // Tickets pending
    let pendingTicketsCount = 0;
    try {
      const ticketsSnap = await db.collection('supportTickets').get();
      ticketsSnap.docs.forEach((t) => {
        const item = t.data();
        if (item.status === 'open' || item.status === 'in-progress') {
          pendingTicketsCount++;
        }
      });
    } catch (e) {}

    const reportStats = {
      date: todayStr,
      dauCount,
      newUsersCount,
      totalRevenue,
      totalPayouts,
      pendingTicketsCount,
      pendingDeposits,
      pendingWithdrawals,
      todayAdsCount: totalAdsCount,
    };

    await sendDailyReportEmail(reportStats);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'manual_daily_report_dispatched',
      targetUid: null,
      targetEmail: 'ADMIN',
      details: `Dispatched daily report: DAU=${dauCount}, Revenue=$${totalRevenue.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Daily health report generated and emailed to administrator.',
      reportStats,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/maintenance/daily-report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate daily report',
      message: error.message,
    });
  }
});

/**
 * s) POST /api/admin/maintenance/cleanup-logs
 * Deletes auditLogs older than 90 days.
 */
router.post('/maintenance/cleanup-logs', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const oldLogsSnap = await db.collection('auditLogs')
      .where('timestamp', '<', ninetyDaysAgo)
      .get();

    let deletedCount = 0;
    for (const doc of oldLogsSnap.docs) {
      await doc.ref.delete();
      deletedCount++;
    }

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'cleanup_audit_logs',
      targetUid: null,
      targetEmail: 'SYSTEM',
      details: `Purged ${deletedCount} audit logs older than 90 days.`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Successfully pruned ${deletedCount} audit log records older than 90 days.`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/maintenance/cleanup-logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to prune audit logs',
      message: error.message,
    });
  }
});

/**
 * t) POST /api/admin/maintenance/test-error
 * Intentionally triggers a test critical error to verify that admin error alerts work.
 */
router.post('/maintenance/test-error', verifyAdmin, async (req, res) => {
  try {
    const simulatedError = new Error('Test Critical Exception: Verification of Phase 7 Admin Alert Dispatcher');
    simulatedError.stack = `Error: Test Critical Exception\n    at /backend/routes/admin.js:999:15\n    at Layer.handle [as handle_request]`;

    await sendAdminErrorAlert({
      error: simulatedError,
      route: '/api/admin/maintenance/test-error',
      method: 'POST',
      user: req.user,
      stack: simulatedError.stack,
      reqBody: req.body,
    });

    return res.json({
      success: true,
      message: 'Test critical error dispatched to administrator email successfully.',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/maintenance/test-error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to dispatch test error',
      message: error.message,
    });
  }
});

/**
 * u) GET /api/admin/packages
 * Retrieves live packages list directly from systemSettings/packages.
 */
router.get('/packages', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('systemSettings').doc('packages').get();
    const packages = normalizePackages(doc.exists ? doc.data() : null);

    return res.json({
      success: true,
      packages,
      updatedAt: doc.exists ? doc.data()?.updatedAt : null,
      updatedBy: doc.exists ? doc.data()?.updatedBy : null,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/packages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch packages catalog',
      message: error.message,
    });
  }
});

/**
 * v) PUT /api/admin/packages
 * Saves and publishes the entire package tiers catalog live to Firestore and audit logs.
 */
router.put('/packages', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { packages } = req.body || {};

    if (!Array.isArray(packages)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: packages array is required.',
      });
    }

    // Clean & normalize each package
    const cleanPackages = packages.map((pkg, idx) => {
      const id = (pkg.id || `pkg_${idx}`).toLowerCase().trim();
      const tierName = (pkg.tierName || pkg.name || id).trim();
      return {
        id,
        tierName,
        name: pkg.name || tierName,
        price: Math.max(0, Number(pkg.price || 0)),
        minWallet: Math.max(0, Number(pkg.minWallet !== undefined ? pkg.minWallet : Number(pkg.price || 0) * 0.1)),
        rewardRate: pkg.rewardRate || '20%',
        dailyLimit: Math.max(1, Number(pkg.dailyLimit || 20)),
        badge: pkg.badge ? String(pkg.badge).trim() : null,
        color: pkg.color || '#0284c7',
        description: pkg.description || 'Active contract tier with 20 ads/day allocation and guaranteed daily rewards.',
        motivationText: pkg.motivationText || '✨ Build your digital earnings foundation with consistent daily rewards.',
        isActive: pkg.isActive !== false,
        order: Number(pkg.order !== undefined ? pkg.order : idx + 1),
      };
    });

    const packagesDocRef = db.collection('systemSettings').doc('packages');
    const updatePayload = {
      packages: cleanPackages,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    };

    await packagesDocRef.set(updatePayload);

    // Save to disk backup so it persists across restarts
    savePackagesToDisk(cleanPackages);

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'update_packages',
      targetUid: null,
      targetEmail: null,
      amountUSD: null,
      details: `Saved & published ${cleanPackages.length} package tiers to systemSettings`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Packages successfully updated and published live to all users!',
      packages: cleanPackages,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/packages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update packages',
      message: error.message,
    });
  }
});

/**
 * w) POST /api/admin/packages
 * Adds or modifies an individual package.
 */
router.post('/packages', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const pkg = req.body || {};

    if (!pkg.id || !pkg.tierName) {
      return res.status(400).json({
        success: false,
        message: 'Package id and tierName are required.',
      });
    }

    const doc = await db.collection('systemSettings').doc('packages').get();
    let currentPackages = normalizePackages(doc.exists ? doc.data() : null);

    const normId = pkg.id.toLowerCase().trim();
    const existingIndex = currentPackages.findIndex((p) => p.id === normId);

    const newPkg = {
      id: normId,
      tierName: pkg.tierName.trim(),
      name: pkg.name || pkg.tierName.trim(),
      price: Math.max(0, Number(pkg.price || 0)),
      minWallet: Math.max(0, Number(pkg.minWallet !== undefined ? pkg.minWallet : Number(pkg.price || 0) * 0.1)),
      rewardRate: pkg.rewardRate || '20%',
      dailyLimit: Math.max(1, Number(pkg.dailyLimit || 20)),
      badge: pkg.badge ? String(pkg.badge).trim() : null,
      color: pkg.color || '#0284c7',
      description: pkg.description || 'Active contract tier with 20 ads/day allocation and guaranteed daily rewards.',
      motivationText: pkg.motivationText || '✨ Build your digital earnings foundation with consistent daily rewards.',
      isActive: pkg.isActive !== false,
      order: Number(pkg.order !== undefined ? pkg.order : currentPackages.length + 1),
    };

    if (existingIndex >= 0) {
      currentPackages[existingIndex] = { ...currentPackages[existingIndex], ...newPkg };
    } else {
      currentPackages.push(newPkg);
    }

    currentPackages.sort((a, b) => (a.order || 0) - (b.order || 0) || a.price - b.price);

    await db.collection('systemSettings').doc('packages').set({
      packages: currentPackages,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'save_single_package',
      details: `Admin ${existingIndex >= 0 ? 'updated' : 'added'} package '${newPkg.tierName}' ($${newPkg.price})`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Package ${newPkg.tierName} saved successfully!`,
      package: newPkg,
      packages: currentPackages,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/packages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save package',
      message: error.message,
    });
  }
});

/**
 * x) DELETE /api/admin/packages/:id
 * Deactivates or removes a package from systemSettings/packages.
 */
router.delete('/packages/:id', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const pkgId = (req.params.id || '').toLowerCase().trim();

    const doc = await db.collection('systemSettings').doc('packages').get();
    let currentPackages = normalizePackages(doc.exists ? doc.data() : null);

    const initialLength = currentPackages.length;
    // Mark as inactive or remove if hard delete
    const filtered = currentPackages.filter((p) => p.id !== pkgId);

    if (filtered.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: `Package with id '${pkgId}' not found.`,
      });
    }

    await db.collection('systemSettings').doc('packages').set({
      packages: filtered,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    });

    await recordAuditLog(db, {
      adminEmail: req.user.email,
      action: 'delete_package',
      details: `Admin removed package id '${pkgId}'`,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Package '${pkgId}' deleted successfully!`,
      packages: filtered,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/packages/:id:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete package',
      message: error.message,
    });
  }
});

/**
 * y) POST /api/admin/reset-system-data
 * Completely resets all user balances to 0, clears all dummy records,
 * purges deposits and withdrawals, and starts all accounts completely clean and live.
 */
router.post('/reset-system-data', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    if (db && db.data && typeof db.data.delete === 'function') {
      const keysToDelete = [];
      for (const [key, val] of db.data.entries()) {
        if (
          key.startsWith('deposits/') ||
          key.startsWith('withdrawals/') ||
          key.startsWith('auditLogs/') ||
          key.startsWith('supportTickets/') ||
          key.startsWith('transactions/') ||
          key.startsWith('cloudMiner/') ||
          (key.startsWith('users/') && key !== 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2' && (val?.email !== 'mistrtaimoor@gmail.com'))
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((k) => db.data.delete(k));

      // Also ensure any non-mistrtaimoor@gmail.com user document is deleted
      for (const [key, val] of db.data.entries()) {
        if (key.startsWith('users/') && val?.email && val.email.toLowerCase() !== 'mistrtaimoor@gmail.com') {
          db.data.delete(key);
        }
      }

      // Reset mistrtaimoor user to 0 balance & clean state
      for (const [key, val] of db.data.entries()) {
        if (key.startsWith('users/') && (val?.email === 'mistrtaimoor@gmail.com' || key === 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2')) {
          db.data.set(key, {
            ...val,
            walletBalance: 0,
            currentPackage: 'None',
            lifetimeAds: 0,
            dailyAdCount: 0,
            teamAdsCount: 0,
            referralCount: 0,
            totalEarned: 0,
            isEligible: false,
          });
        }
      }

      if (typeof db._persist === 'function') {
        db._persist();
      }
    }

    return res.json({
      success: true,
      message: 'Complete reset applied: all bots removed, cloud mining reset, and only mistrtaimoor@gmail.com preserved with clean balance.',
    });
  } catch (err) {
    console.error('Error in /api/admin/reset-system-data:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset system data',
      message: err.message,
    });
  }
});

export default router;

