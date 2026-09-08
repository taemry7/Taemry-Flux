import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import userRoutes from './backend/routes/user.js';
import packageRoutes from './backend/routes/package.js';
import dashboardRoutes from './backend/routes/dashboard.js';
import { initFirebaseAdmin } from './backend/firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TAEMRY FLUX Full-Stack Server',
      phase: 'Phase 2',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Backend API Routes
  app.use('/api/user', userRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
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
