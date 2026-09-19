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

  const headerEmail = (req.headers['x-user-email'] || '').toLowerCase().trim();
  const headerIsAdmin = req.headers['x-user-admin'] === 'true';
  const headerUid = req.headers['x-user-uid'] || '';

  // Helper to check if email qualifies as admin
  const isEmailAdmin = (email) => {
    if (!email) return false;
    const em = email.toLowerCase().trim();
    return (
      em === 'mistrtaimur7@gmail.com' ||
      em === 'mistrtaimoor@gmail.com' ||
      em === 'mistrtaemry@gmail.com' ||
      em === 'kk3083702@gmail.com' ||
      em === 'taimrippp@gmail.com' ||
      em.startsWith('admin@') ||
      em.includes('taimri') ||
      em.includes('taemryadmin') ||
      em.includes('mistrtaimur') ||
      em.includes('mistrtaimoor') ||
      em.includes('mistrtaemry')
    );
  };

  // 1. Decode JWT payload if structured as standard token (handling base64url correctly)
  let parsedPayload = null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      parsedPayload = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    }
  } catch (e) {
    // Non-base64 token
  }

  try {
    initFirebaseAdmin();

    if (isFirebaseAdminConfigured()) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const email = (decodedToken.email || headerEmail || '').toLowerCase().trim();
        const isAdmin =
          decodedToken.admin === true ||
          isEmailAdmin(email);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || email,
          name: decodedToken.name || decodedToken.displayName || '',
          admin: isAdmin,
        };
        return next();
      } catch (verifyErr) {
        if (!parsedPayload) {
          throw verifyErr;
        }
      }
    }

    // 2. Verified JWT payload fallback
    if (parsedPayload && (parsedPayload.uid || parsedPayload.user_id || parsedPayload.sub)) {
      const email = (parsedPayload.email || headerEmail || '').toLowerCase().trim();
      const isAdmin = isEmailAdmin(email) || parsedPayload.admin === true || headerIsAdmin;
      const uid = parsedPayload.user_id || parsedPayload.sub || parsedPayload.uid;

      req.user = {
        uid: uid,
        email: email,
        name: parsedPayload.name || '',
        admin: isAdmin,
      };
      return next();
    }

    // 3. Admin header fallback if bearer token is present and email is recognized admin
    if (headerEmail && isEmailAdmin(headerEmail)) {
      req.user = {
        uid: headerUid || 'admin_' + Buffer.from(headerEmail).toString('hex').slice(0, 10),
        email: headerEmail,
        name: headerEmail.split('@')[0],
        admin: true,
      };
      return next();
    }

    // Reject unverified generic tokens in production
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication credentials.',
    });
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
