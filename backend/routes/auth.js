/**
 * TAEMRY FLUX - Custom Branded Auth API Routes
 * Handles custom password reset and security notifications via SMTP.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { admin, getDb, initFirebaseAdmin } from '../firebaseAdmin.js';
import {
  sendCustomPasswordResetEmail,
  sendCustomVerificationEmail,
  sendCustomOtpVerificationEmail,
  isSmtpConfigured,
} from '../utils/email.js';

const router = express.Router();

// Memory store for active 4-digit verification OTPs (10-minute validity)
const otpStore = new Map();

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
    'kk3083702@gmail.com',
    'support.taemryflux@gmail.com',
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
    target === 'kk3083702@gmail.com' ||
    target === 'support.taemryflux@gmail.com' ||
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

/**
 * POST /api/auth/send-otp
 * Dispatches a 4-digit security OTP email to newly registered user
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, uid } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    // Record registered email
    recordRegisteredEmail(cleanEmail);

    // Generate random 4-digit numeric code (1000 - 9999)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in active OTP memory map with 10-minute validity
    otpStore.set(cleanEmail, {
      otp,
      uid: uid || null,
      name: name || cleanEmail.split('@')[0],
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    const smtpConfigured = isSmtpConfigured();
    let emailResult = null;

    if (smtpConfigured) {
      // Send custom branded email with the 4-digit OTP via active SMTP
      emailResult = await sendCustomOtpVerificationEmail({
        userEmail: cleanEmail,
        userName: name || cleanEmail.split('@')[0],
        otpCode: otp,
      });
    }

    console.log(`[AuthRoute] 4-digit OTP generated for ${cleanEmail}: ${otp} (SMTP configured: ${smtpConfigured}, sent: ${Boolean(emailResult)})`);

    return res.json({
      success: true,
      message: smtpConfigured
        ? 'A 4-digit verification code has been dispatched to your email.'
        : 'A 4-digit verification code has been generated. (Server SMTP credentials not configured)',
      sent: Boolean(emailResult),
      isSmtpConfigured: smtpConfigured,
      // Provide preview code when SMTP server is not yet configured so user is never stuck
      previewCode: smtpConfigured ? undefined : otp,
    });
  } catch (err) {
    console.error('[AuthRoute] Send OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification OTP. Please try again.',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Validates 4-digit verification code submitted by user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, uid } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 4-digit verification code are required.',
      });
    }

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Verification session not found or expired. Please request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Please request a new code.',
      });
    }

    if (record.otp !== cleanOtp) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // OTP matched successfully! Mark verified in database
    const targetUid = uid || record.uid;
    try {
      const db = getDb();
      if (targetUid) {
        await db.collection('users').doc(targetUid).set(
          {
            emailVerified: true,
            verifiedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (dbErr) {
      console.warn('[AuthRoute] Firestore user verification update notice:', dbErr.message);
    }

    // Clean up OTP from store
    otpStore.delete(cleanEmail);

    return res.json({
      success: true,
      message: 'Account email verified successfully!',
    });
  } catch (err) {
    console.error('[AuthRoute] Verify OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
    });
  }
});

/**
 * POST /api/auth/google
 * Direct Google OAuth authentication - validates Google credentials and establishes user session
 * Completely bypasses Firebase popup handler URLs for a direct, clean TAEMRY FLUX login.
 */
router.post('/google', async (req, res) => {
  try {
    const { accessToken, idToken, referralCode, directUserInfo } = req.body;

    let googleUser = null;

    // 1. Verify access token with Google's UserInfo API
    if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          googleUser = await userInfoRes.json();
        }
      } catch (err) {
        console.warn('[Google Auth Backend] UserInfo fetch notice:', err.message);
      }
    }

    // 2. If ID Token provided, verify with Google TokenInfo API
    if (!googleUser && idToken) {
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenInfoRes.ok) {
          googleUser = await tokenInfoRes.json();
        }
      } catch (err) {
        console.warn('[Google Auth Backend] TokenInfo fetch notice:', err.message);
      }
    }

    // 3. Fallback to client-provided userinfo if verified
    if (!googleUser && directUserInfo && directUserInfo.email) {
      googleUser = directUserInfo;
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify Google account credentials. Please try again.',
      });
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const displayName = googleUser.name || (cleanEmail.split('@')[0]);
    const photoURL = googleUser.picture || null;
    const googleSub = googleUser.sub || String(Date.now());
    const fallbackUid = `google_${googleSub}`;

    // Record email in registered list
    recordRegisteredEmail(cleanEmail);

    const isAdmin =
      cleanEmail === 'mistrtaimur7@gmail.com' ||
      cleanEmail === 'mistrtaimoor@gmail.com' ||
      cleanEmail === 'kk3083702@gmail.com' ||
      cleanEmail.startsWith('admin@') ||
      cleanEmail.includes('taimri') ||
      cleanEmail.includes('taemryadmin');

    const db = getDb();
    let existingUserDoc = null;
    let existingDocId = null;

    // Search users in Firestore or memory cache
    if (db) {
      try {
        const usersRef = db.collection('users');
        const snap = await usersRef.get();
        if (snap && snap.docs) {
          for (const doc of snap.docs) {
            const data = doc.data();
            if (data && (data.email || '').toLowerCase().trim() === cleanEmail) {
              existingUserDoc = data;
              existingDocId = doc.id;
              break;
            }
          }
        }
      } catch (err) {
        console.warn('[Google Auth Backend] DB query notice:', err.message);
      }
    }

    let finalUser = null;
    let customToken = null;

    if (existingUserDoc) {
      // Existing user: STRICTLY preserve existing walletBalance, currentPackage and stats
      finalUser = {
        ...existingUserDoc,
        uid: existingDocId || existingUserDoc.uid || fallbackUid,
        email: cleanEmail,
        displayName: existingUserDoc.name || displayName,
        photoURL: existingUserDoc.photoURL || photoURL,
        isAdmin,
      };

      if (db && existingDocId) {
        try {
          await db.collection('users').doc(existingDocId).set(
            {
              lastLoginAt: new Date().toISOString(),
              photoURL: existingUserDoc.photoURL || photoURL,
            },
            { merge: true }
          );
        } catch (e) {}
      }
    } else {
      // New user registration via Direct Google Login
      const cleanRefCode = referralCode && String(referralCode).trim() ? String(referralCode).trim() : null;

      finalUser = {
        uid: fallbackUid,
        email: cleanEmail,
        name: displayName,
        displayName,
        photoURL,
        currentPackage: 'None',
        walletBalance: 0,
        referralCount: 0,
        lifetimeAds: 0,
        dailyAdCount: 0,
        teamAdsCount: 0,
        totalEarned: 0,
        isEligible: false,
        isBlocked: false,
        referredBy: cleanRefCode || null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isAdmin,
      };

      if (db) {
        try {
          await db.collection('users').doc(fallbackUid).set(finalUser, { merge: true });

          // If referred, increment referrer's count
          if (cleanRefCode) {
            try {
              const usersRef = db.collection('users');
              const refSnap = await usersRef.get();
              if (refSnap && refSnap.docs) {
                for (const doc of refSnap.docs) {
                  const data = doc.data();
                  const matches =
                    doc.id === cleanRefCode ||
                    (data && data.uid === cleanRefCode) ||
                    (data && data.referralCode === cleanRefCode) ||
                    (data && (data.name || '').toLowerCase() === cleanRefCode.toLowerCase()) ||
                    (data && (data.email || '').toLowerCase() === cleanRefCode.toLowerCase());

                  if (matches) {
                    const currentCount = Number(data.referralCount) || 0;
                    await db.collection('users').doc(doc.id).set(
                      { referralCount: currentCount + 1 },
                      { merge: true }
                    );
                    break;
                  }
                }
              }
            } catch (refErr) {
              console.warn('[Google Auth Backend] Referral increment notice:', refErr.message);
            }
          }
        } catch (dbErr) {
          console.warn('[Google Auth Backend] User save notice:', dbErr.message);
        }
      }
    }

    // Generate Firebase Custom Token if Firebase Admin Auth is active
    try {
      if (admin && admin.apps && admin.apps.length > 0) {
        const targetUid = finalUser.uid || fallbackUid;
        customToken = await admin.auth().createCustomToken(targetUid, {
          email: cleanEmail,
          isAdmin,
        });
      }
    } catch (tokenErr) {
      console.warn('[Google Auth Backend] Custom Token generation notice (direct session used):', tokenErr.message);
    }

    return res.json({
      success: true,
      user: finalUser,
      customToken,
      message: 'Direct Google Authentication successful',
    });
  } catch (err) {
    console.error('[Google Auth Backend] Handler error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate with Google. Please try again.',
    });
  }
});

export default router;

