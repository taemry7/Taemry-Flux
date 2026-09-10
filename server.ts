import express from 'express';
import path from 'path';
import cors from 'cors';
import userRoutes from './backend/routes/user.js';
import packageRoutes from './backend/routes/package.js';
import dashboardRoutes from './backend/routes/dashboard.js';
import adsRoutes from './backend/routes/ads.js';
import referralsRoutes from './backend/routes/referrals.js';
import milestonesRoutes from './backend/routes/milestones.js';
import depositsRoutes from './backend/routes/deposits.js';
import withdrawalsRoutes from './backend/routes/withdrawals.js';
import transactionsRoutes from './backend/routes/transactions.js';
import settingsRoutes from './backend/routes/settings.js';
import adminRoutes from './backend/routes/admin.js';
import supportRoutes from './backend/routes/support.js';
import whitepaperRoutes from './backend/routes/whitepaper.js';
import { initFirebaseAdmin } from './backend/firebaseAdmin.js';
import { sendAdminErrorAlert } from './backend/utils/email.js';

async function startServer() {
  // Initialize Firebase Admin SDK (lazy fallback if keys not in env)
  initFirebaseAdmin();

  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());

  // Normalize duplicate /api/api prefix if any client request arrives with it
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/api/')) {
      req.url = req.url.replace(/^\/api\/api\//, '/api/');
    }
    next();
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TAEMRY FLUX Full-Stack Server',
      phase: 'Phase 7: Post-Launch Maintenance, Monitoring & Scaling',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Backend API Routes
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

  // Global Error Alerting Middleware for API
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[CRITICAL API ERROR]', err);
    sendAdminErrorAlert({
      error: err,
      route: req.originalUrl,
      method: req.method,
      user: (req as any).user || null,
      stack: err.stack,
      reqBody: req.body,
    }).catch((e) => console.warn('Alert dispatch failed:', e.message));

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'A critical server error occurred. System administrators have been automatically alerted.',
    });
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TAEMRY FLUX] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
