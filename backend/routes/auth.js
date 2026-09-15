/**
 * TAEMRY FLUX - Custom Branded Auth API Routes
 * Handles custom password reset and security notifications via SMTP.
 */

import express from 'express';
import { admin, initFirebaseAdmin } from '../firebaseAdmin.js';
import { sendCustomPasswordResetEmail, sendCustomVerificationEmail } from '../utils/email.js';

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
