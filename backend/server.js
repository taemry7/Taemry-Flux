/**
 * TAEMRY FLUX - Backend API Server (Express.js)
 * Provides authentication-protected endpoints for user account, packages, and dashboard metrics.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import packageRoutes from './routes/package.js';
import dashboardRoutes from './routes/dashboard.js';
import adsRoutes from './routes/ads.js';
import referralsRoutes from './routes/referrals.js';
import milestonesRoutes from './routes/milestones.js';
import depositsRoutes from './routes/deposits.js';
import withdrawalsRoutes from './routes/withdrawals.js';
import transactionsRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import whitepaperRoutes from './routes/whitepaper.js';
import { sendAdminErrorAlert } from './utils/email.js';
import { getDb } from './firebaseAdmin.js';

// Load environment variables
dotenv.config();

// Auto-purge pre-seeded test accounts, dummy deposits, and dummy withdrawals on boot
function purgePreSeededData() {
  try {
    const db = getDb();
    if (db && db.data && typeof db.data.delete === 'function') {
      const keysToDelete = [];
      for (const [key] of db.data.entries()) {
        if (
          key.startsWith('deposits/') ||
          key.startsWith('withdrawals/') ||
          key.startsWith('auditLogs/') ||
          key.startsWith('supportTickets/') ||
          key.startsWith('transactions/') ||
          (key.startsWith('users/') && key !== 'users/admin_taemry' && key !== 'users/RNva69V1XoMwaxGgVaKtJ4jXfYY2' && (
            key.includes('user_tariq') ||
            key.includes('user_sara') ||
            key.includes('user_bilal') ||
            key.includes('user_hamza') ||
            key.includes('demo-user-1') ||
            key.includes('demo-') ||
            key.includes('transactions/')
          ))
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((k) => db.data.delete(k));

      // Reset admin_taemry to 0 balance & clean state
      const adminDoc = db.data.get('users/admin_taemry');
      if (adminDoc) {
        db.data.set('users/admin_taemry', {
          ...adminDoc,
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

      if (typeof db._persist === 'function') {
        db._persist();
      }
    }
  } catch (err) {
    console.warn('[Data Purge Notice]:', err.message);
  }
}
purgePreSeededData();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development and production deployment
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-user-admin'],
}));

// Body parser
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TAEMRY FLUX Backend API',
    phase: 'Phase 7: Post-Launch Maintenance, Monitoring & Scaling',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/user', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/whitepaper', whitepaperRoutes);

// 404 Handler for undefined API routes
app.all(['/api', '/api/*'], (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found.`,
  });
});

// Global Error Handler & Admin Alert Dispatcher
app.use((err, req, res, next) => {
  console.error('[CRITICAL API ERROR]:', err);
  sendAdminErrorAlert({
    error: err,
    route: req.originalUrl,
    method: req.method,
    user: req.user || null,
    stack: err.stack,
    reqBody: req.body,
  }).catch((e) => console.warn('Alert dispatch failed:', e.message));

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'A critical server error occurred. System administrators have been automatically alerted.',
  });
});

// Only bind and listen when run directly via node/nodemon backend/server.js
const isDirectRun = Boolean(process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('backend')));
if (isDirectRun) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TAEMRY FLUX] Backend API running at http://0.0.0.0:${PORT}`);
    console.log(`[TAEMRY FLUX] CORS enabled for frontend clients`);
  });
}

export default app;
