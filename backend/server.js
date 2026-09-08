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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development (e.g. port 5173, port 3000, or any local port)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TAEMRY FLUX Backend API',
    phase: 'Phase 2',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/user', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
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
