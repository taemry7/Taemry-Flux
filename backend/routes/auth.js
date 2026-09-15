/**
 * TAEMRY FLUX - Custom Branded Auth API Routes
 * Handles custom password reset and security notifications via SMTP.
 */

import express from 'express';
import { admin, initFirebaseAdmin } from '../firebaseAdmin.js';
import { sendCustomPasswordResetEmail } from '../utils/email.js';

const router = express.Router();

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

    let resetLink = null;

    // 1. Generate secure password reset link via Firebase Admin SDK if configured
    try {
      initFirebaseAdmin();
      const existingApps = admin.apps || [];
      if (existingApps.length > 0 && admin.auth) {
        const actionCodeSettings = {
          url: 'https://taemryflux.online/#/login',
          handleCodeInApp: false,
        };
        resetLink = await admin.auth().generatePasswordResetLink(cleanEmail, actionCodeSettings);
        console.log('[AuthRoute] Generated secure Firebase reset link for:', cleanEmail);
      }
    } catch (adminErr) {
      console.warn('[AuthRoute] Firebase Admin link generation note:', adminErr.message);
    }

    // Fallback direct link if Admin SDK is in preview/mock mode
    if (!resetLink) {
      resetLink = `https://taemryflux.online/#/login?mode=reset&email=${encodeURIComponent(cleanEmail)}`;
    }

    // 2. Dispatch custom branded email via Nodemailer SMTP
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

export default router;
