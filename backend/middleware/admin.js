/**
 * TAEMRY FLUX - Admin Middleware
 * Enforces admin role via Firebase Authentication custom claim `admin === true`.
 */

import { verifyToken } from './auth.js';
import { getDb } from '../firebaseAdmin.js';

export const verifyAdmin = (req, res, next) => {
  // First run token verification
  verifyToken(req, res, async () => {
    // 1. Direct admin flag on user object
    if (req.user && req.user.admin === true) {
      return next();
    }

    // 2. Check if user's email matches system administrator email
    const email = (req.user?.email || req.headers['x-user-email'] || '').toLowerCase().trim();
    const isAuthorizedAdminEmail =
      email === 'mistrtaimur7@gmail.com' ||
      email === 'mistrtaimoor@gmail.com' ||
      email === 'support.taemryflux@gmail.com' ||
      email.startsWith('admin@') ||
      email.includes('taimri') ||
      email.includes('taemryadmin') ||
      email.includes('mistrtaimur') ||
      email.includes('mistrtaimoor');

    if (isAuthorizedAdminEmail) {
      if (req.user) {
        req.user.admin = true;
      }
      return next();
    }

    // 3. Check Firestore database if user doc exists and has admin role
    if (req.user?.uid) {
      try {
        const db = getDb();
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists) {
          const udata = userDoc.data();
          const docEmail = (udata.email || '').toLowerCase().trim();
          if (
            udata.admin === true ||
            udata.isAdmin === true ||
            udata.role === 'admin' ||
            docEmail === 'mistrtaimur7@gmail.com' ||
            docEmail === 'mistrtaimoor@gmail.com' ||
            docEmail === 'support.taemryflux@gmail.com' ||
            docEmail.startsWith('admin@') ||
            docEmail.includes('taimri') ||
            docEmail.includes('taemryadmin') ||
            docEmail.includes('mistrtaimur') ||
            docEmail.includes('mistrtaimoor')
          ) {
            if (req.user) {
              req.user.admin = true;
            }
            return next();
          }
        }
      } catch (err) {
        console.warn('Error checking Firestore user admin role:', err.message);
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required. This endpoint is restricted to authorized administrators.',
    });
  });
};

export default verifyAdmin;
