/**
 * TAEMRY FLUX - Firebase Cloud Functions (Phase 7)
 * Automated Scheduled Maintenance, Backup, and Reporting:
 * - dailyBackup: exports Firestore to Cloud Storage with 30-day retention
 * - dailyReport: aggregates DAU, revenue, payouts & dispatches 08:00 AM summary email
 * - cleanupLogs: removes auditLogs older than 90 days
 */

import functions from 'firebase-functions';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Transporter configured via environment variables
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return {
    sendMail: async (opts) => {
      console.log(`[Mock Mailer] To: ${opts.to}, Subject: ${opts.subject}`);
      return { messageId: 'mock-id' };
    },
  };
};

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'mistrtaemry@gmail.com';

/**
 * 1. Scheduled Daily Backup: Runs every 24 hours at 02:00 UTC
 * Exports collections to Cloud Storage bucket with 30-day retention pruning
 */
export const dailyBackup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[Phase 7] Running scheduled daily Firestore backup...');
    const bucketName = process.env.BACKUP_STORAGE_BUCKET || `${admin.instanceId().app.options.projectId}.appspot.com`;
    const bucket = admin.storage().bucket(bucketName);
    const timestamp = new Date().toISOString();
    const backupFileName = `backups/taemry-backup-${timestamp}.json`;

    const collections = ['users', 'deposits', 'withdrawals', 'supportTickets', 'auditLogs', 'systemSettings'];
    const backupData = {
      meta: { timestamp, platform: 'TAEMRY FLUX' },
      data: {},
    };

    for (const col of collections) {
      const snap = await db.collection(col).get();
      backupData.data[col] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    }

    // Save to Cloud Storage
    const file = bucket.file(backupFileName);
    await file.save(JSON.stringify(backupData), {
      contentType: 'application/json',
      metadata: { cacheControl: 'private, max-age=0' },
    });

    console.log(`[Phase 7] Backup saved to gs://${bucketName}/${backupFileName}`);

    // Retention: Delete backups older than 30 days
    try {
      const [files] = await bucket.getFiles({ prefix: 'backups/' });
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      for (const f of files) {
        const [meta] = await f.getMetadata();
        const created = new Date(meta.timeCreated).getTime();
        if (created < thirtyDaysAgo) {
          await f.delete();
          console.log(`[Phase 7] Pruned backup older than 30 days: ${f.name}`);
        }
      }
    } catch (err) {
      console.warn('[Phase 7] Backup retention pruning error:', err.message);
    }

    return null;
  });

/**
 * 2. Scheduled Daily Active Users (DAU) & Platform Report
 * Aggregates statistics at 23:59 UTC / sends 08:00 AM summary
 */
export const dailyReport = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[Phase 7] Generating daily DAU and platform health report...');
    const todayStr = new Date().toISOString().split('T')[0];

    // Count DAU (users who watched ads today)
    const usersSnap = await db.collection('users').get();
    let dauCount = 0;
    let newUsersCount = 0;

    usersSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.lastAdWatchDate === todayStr || (data.dailyAdCount && data.dailyAdCount > 0)) {
        dauCount++;
      }
      if (data.createdAt && data.createdAt.startsWith(todayStr)) {
        newUsersCount++;
      }
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

    // Support tickets pending
    const ticketsSnap = await db.collection('supportTickets').get();
    let pendingTickets = 0;
    ticketsSnap.docs.forEach((d) => {
      const t = d.data();
      if (t.status === 'open' || t.status === 'in-progress') {
        pendingTickets++;
      }
    });

    // Send email to admin
    const mailer = getTransporter();
    await mailer.sendMail({
      from: '"TAEMRY FLUX Daily Engine" <reports@taemryflux.com>',
      to: ADMIN_EMAIL,
      subject: `[DAILY METRICS] TAEMRY FLUX - DAU: ${dauCount}, Revenue: $${totalRevenue.toFixed(2)}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc;">
          <h2 style="color: #38bdf8;">Daily Platform Health Report &bull; ${todayStr}</h2>
          <p><strong>Daily Active Users (DAU):</strong> ${dauCount}</p>
          <p><strong>New Member Signups:</strong> +${newUsersCount}</p>
          <p><strong>Revenue (Deposits Approved):</strong> $${totalRevenue.toFixed(2)} USD</p>
          <p><strong>Payouts Settled:</strong> $${totalPayouts.toFixed(2)} USD</p>
          <p><strong>Pending Support Tickets:</strong> ${pendingTickets}</p>
          <p><strong>Pending Deposits:</strong> ${pendingDeposits}</p>
          <p><strong>Pending Withdrawals:</strong> ${pendingWithdrawals}</p>
        </div>
      `,
    });

    console.log('[Phase 7] Daily report email successfully dispatched.');
    return null;
  });

/**
 * 3. Scheduled Log Cleanup: Runs daily at 00:00 UTC
 * Deletes auditLogs older than 90 days
 */
export const cleanupLogs = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[Phase 7] Running automated audit log cleanup (> 90 days)...');
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const oldLogsSnap = await db.collection('auditLogs')
      .where('timestamp', '<', ninetyDaysAgo)
      .limit(500)
      .get();

    if (oldLogsSnap.empty) {
      console.log('[Phase 7] No audit logs older than 90 days found.');
      return null;
    }

    const batch = db.batch();
    oldLogsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    console.log(`[Phase 7] Successfully deleted ${oldLogsSnap.size} stale audit logs.`);
    return null;
  });
