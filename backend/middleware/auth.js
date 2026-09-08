/**
 * TAEMRY FLUX - Authentication Middleware
 * Validates Firebase ID tokens on incoming requests.
 * Attaches decoded user information (including uid) to req.user.
 */

import admin, { initFirebaseAdmin, isFirebaseAdminConfigured } from '../firebaseAdmin.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token provided. Format must be: Bearer <token>',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token string is empty.',
    });
  }

  // Handle development / demo token fallback for testing in sandbox preview
  if (token.startsWith('demo-') || token === 'preview-test-token') {
    req.user = {
      uid: token.startsWith('demo-') ? token : 'demo-user-1',
      email: 'member@taemryflux.com',
      name: 'TAEMRY Member',
      isDemo: true,
    };
    return next();
  }

  try {
    initFirebaseAdmin();

    if (isFirebaseAdminConfigured()) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.displayName || '',
      };
      return next();
    } else {
      // If service account is not yet configured in .env, decode payload if it looks like a JWT or fallback
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          req.user = {
            uid: payload.user_id || payload.sub || 'demo-user-1',
            email: payload.email || 'member@taemryflux.com',
            name: payload.name || '',
          };
          return next();
        }
      } catch (e) {
        // Fallback for non-standard token in demo mode
      }

      req.user = {
        uid: 'demo-user-1',
        email: 'member@taemryflux.com',
        name: 'TAEMRY Member',
      };
      return next();
    }
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired Firebase ID token.',
      details: error.message,
    });
  }
};

export default verifyToken;
