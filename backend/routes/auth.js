/**
 * TAEMRY FLUX - Custom Branded Auth API Routes
 * Handles custom password reset and security notifications via SMTP.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { admin, getDb, initFirebaseAdmin } from '../firebaseAdmin.js';
import { sendCustomPasswordResetEmail, sendCustomVerificationEmail } from '../utils/email.js';

const router = express.Router();

const REGISTERED_USERS_FILE = path.resolve(process.cwd(), '.registered_users.json');

// Helper to get persistent registered emails
const getPersistentRegisteredEmails = () => {
  try {
    if (fs.existsSync(REGISTERED_USERS_FILE)) {
      const content = fs.readFileSync(REGISTERED_USERS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list.map((e) => (e || '').toLowerCase().trim());
    }
  } catch (e) {}
  return [
    'mistrtaimoor@gmail.com',
    'mistrtaimur7@gmail.com',
    'taemryflux@gmail.com',
    'admin@taemryflux.com',
  ];
};

// Helper to record registered email
const recordRegisteredEmail = (email) => {
  if (!email) return;
  const clean = email.toLowerCase().trim();
  try {
    const existing = getPersistentRegisteredEmails();
    if (!existing.includes(clean)) {
      existing.push(clean);
      fs.writeFileSync(REGISTERED_USERS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    }
  } catch (e) {}
};

// Verify if user account exists in system
const checkUserExists = async (cleanEmail) => {
  if (!cleanEmail) return false;
  const target = cleanEmail.toLowerCase().trim();

  // 1. Check persistent registry
  const regList = getPersistentRegisteredEmails();
  if (regList.includes(target)) return true;

  // 2. Check database 'users' collection
  try {
    const db = getDb();
    const usersSnap = await db.collection('users').get();
    if (usersSnap && usersSnap.docs) {
      for (const doc of usersSnap.docs) {
        const u = doc.data();
        const userEmail = (u.email || '').toLowerCase().trim();
        if (userEmail === target) {
          recordRegisteredEmail(target);
          return true;
        }
      }
    }
  } catch (e) {}

  // 3. Check mock firestore cache file directly if present
  try {
    const cachePath = path.resolve(process.cwd(), '.mock_firestore_cache.json');
    if (fs.existsSync(cachePath)) {
      const cacheEntries = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      for (const [k, v] of cacheEntries) {
        if (k.startsWith('users/') && v && (v.email || '').toLowerCase().trim() === target) {
          recordRegisteredEmail(target);
          return true;
        }
      }
    }
  } catch (e) {}

  // 4. Check known administrator emails
  const isAdminEmail =
    target === 'mistrtaimur7@gmail.com' ||
    target === 'mistrtaimoor@gmail.com' ||
    target.startsWith('admin@') ||
    target.includes('taimri') ||
    target.includes('taemryadmin');

  if (isAdminEmail) {
    recordRegisteredEmail(target);
    return true;
  }

  return false;
};

/**
 * POST /api/auth/forgot-password
 * Dispatches a white-labeled, branded password reset email (Zero Firebase mention)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    // Check if an account actually exists for this email
    const exists = await checkUserExists(cleanEmail);
    if (!exists) {
      return res.json({
        success: false,
        code: 'auth/user-not-found',
        message: 'No account found with this email address. Please check your email or sign up first.',
      });
    }

    // Direct clean TAEMRY FLUX password reset link (Official single-use Firebase link removed per user directive)
    const resetLink = `https://taemryflux.online/#/login?mode=reset&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch custom branded email via Nodemailer SMTP
    const emailResult = await sendCustomPasswordResetEmail({
      userEmail: cleanEmail,
      resetLink,
    });

    return res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      sent: Boolean(emailResult),
    });
  } catch (err) {
    console.error('[AuthRoute] Forgot password dispatch error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again.',
    });
  }
});

/**
 * POST /api/auth/send-verification
 * Dispatches a custom branded account verification email upon new user registration
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, name, uid } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    // Save newly registered user to persistent email list and db
    recordRegisteredEmail(cleanEmail);
    try {
      const db = getDb();
      const userRef = db.collection('users').doc(uid || ('user_' + Date.now()));
      await userRef.set(
        {
          uid: uid || null,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {}

    // Direct clean TAEMRY FLUX email verification link
    const verifyLink = `https://taemryflux.online/#/login?mode=verified&email=${encodeURIComponent(cleanEmail)}${uid ? `&uid=${encodeURIComponent(uid)}` : ''}`;

    const emailResult = await sendCustomVerificationEmail({
      userEmail: cleanEmail,
      userName: name || cleanEmail.split('@')[0],
      verifyLink,
    });

    return res.json({
      success: true,
      message: 'Verification email has been dispatched to your inbox.',
      sent: Boolean(emailResult),
    });
  } catch (err) {
    console.error('[AuthRoute] Send verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.',
    });
  }
});

export default router;
