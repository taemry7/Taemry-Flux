import 'dotenv/config';
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
import authRoutes from './backend/routes/auth.js';
import minerRoutes from './backend/routes/miner.js';
import { initFirebaseAdmin, getDb } from './backend/firebaseAdmin.js';
import { sendAdminErrorAlert } from './backend/utils/email.js';
import { antiBotGuard } from './backend/middleware/antiBot.js';
import { getPersistentRegisteredEmails } from './backend/routes/auth.js';

async function startServer() {
  // Initialize Firebase Admin SDK (lazy fallback if keys not in env)
  initFirebaseAdmin();

  // Ensure persistent registered user accounts are initialized without wiping balances or referral counts
  try {
    const db = getDb() as any;
    if (db && db.data) {
      const persistentEmails = getPersistentRegisteredEmails();
      persistentEmails.forEach((email) => {
        if (email) {
          const emailLower = email.toLowerCase().trim();
          let foundKey: string | null = null;
          for (const [key, val] of db.data.entries()) {
            if (key.startsWith('users/') && (val?.email || '').toLowerCase().trim() === emailLower) {
              foundKey = key;
              break;
            }
          }
          if (!foundKey) {
            const uid = 'user_' + Buffer.from(emailLower).toString('hex').slice(0, 10);
            db.data.set(`users/${uid}`, {
              uid,
              email: emailLower,
              name: emailLower.split('@')[0],
              displayName: emailLower.split('@')[0],
              username: emailLower.split('@')[0],
              walletBalance: 0,
              currentPackage: 'None',
              lifetimeAds: 0,
              dailyAdCount: 0,
              teamAdsCount: 0,
              referralCount: 0,
              totalEarned: 0,
              isEligible: false,
              isBlocked: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      });

      if (typeof db._persist === 'function') {
        db._persist();
      }
    }
  } catch (err: any) {
    console.warn('[User Initialization Notice]:', err.message);
  }

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

  // Anti-Bot & Anti-Fake Security Middleware on all /api routes
  app.use('/api', antiBotGuard);

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
  app.use('/api/auth', authRoutes);
  app.use('/api/miner', minerRoutes);

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

  // Dedicated Crawlers & Favicon Endpoints (Prevents SPA fallback from ever serving HTML to Googlebot)
  app.get('/favicon.ico', (req, res) => {
    const icoPath = path.join(process.cwd(), 'public', 'favicon.ico');
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(icoPath);
  });

  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(robotsPath);
  });

  app.get('/ads.txt', (req, res) => {
    const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(adsTxtPath);
  });

  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(sitemapPath);
  });

  // Google Search Console Site Verification Endpoint
  app.get('/googlee39205dcefb8c59c.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send('google-site-verification: googlee39205dcefb8c59c.html');
  });

  // Short vanity referral link redirect:
  // 1. /ref/:username (e.g. /ref/taemry or /ref/@taemry -> /#/login/signup?ref=taemry)
  // 2. Direct /@username (e.g. /@taemry -> /#/login/signup?ref=taemry)
  app.get(['/ref/:username', '/ref', '/@:username'], (req, res) => {
    const usernameParam = (req.params as any)?.username || (req.query as any)?.u || '';
    const cleanUser = encodeURIComponent(String(usernameParam).replace(/^@/, '').trim());
    if (cleanUser) {
      res.redirect(`/#/login/signup?ref=${cleanUser}`);
    } else {
      res.redirect('/#/login/signup');
    }
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
