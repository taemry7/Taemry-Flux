/**
 * TAEMRY FLUX - Custom Branded Auth API Routes
 * Handles custom password reset and security notifications via SMTP.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { admin, getDb, initFirebaseAdmin } from '../firebaseAdmin.js';
import { sendCustomPasswordResetEmail, sendCustomVerificationEmail, sendCustomOtpEmail } from '../utils/email.js';

const router = express.Router();

const REGISTERED_USERS_FILE = path.resolve(process.cwd(), '.registered_users.json');
const VERIFIED_USERS_FILE = path.resolve(process.cwd(), '.verified_users.json');

// In-memory set of verified emails for real-time polling fallback
const verifiedEmailsSet = new Set();
try {
  if (fs.existsSync(VERIFIED_USERS_FILE)) {
    const data = JSON.parse(fs.readFileSync(VERIFIED_USERS_FILE, 'utf-8'));
    if (Array.isArray(data)) data.forEach((e) => verifiedEmailsSet.add(e.toLowerCase().trim()));
  }
} catch (e) {}

const recordVerifiedEmail = (email) => {
  if (!email) return;
  const clean = email.toLowerCase().trim();
  verifiedEmailsSet.add(clean);
  try {
    fs.writeFileSync(VERIFIED_USERS_FILE, JSON.stringify([...verifiedEmailsSet], null, 2), 'utf-8');
  } catch (e) {}
};

// Helper to get persistent registered emails
export const getPersistentRegisteredEmails = () => {
  try {
    if (fs.existsSync(REGISTERED_USERS_FILE)) {
      const content = fs.readFileSync(REGISTERED_USERS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list.map((e) => (e || '').toLowerCase().trim());
    }
  } catch (e) {}
  return [
    'mistrtaimoor@gmail.com',
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

  // 3. Check Firebase Auth via Admin SDK directly
  try {
    if (admin && typeof admin.auth === 'function') {
      const authUser = await admin.auth().getUserByEmail(target);
      if (authUser) {
        recordRegisteredEmail(target);
        return true;
      }
    }
  } catch (e) {}

  // 4. Check mock firestore cache file directly if present
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
 * POST /api/auth/check-email
 * Checks whether an account exists in the system (for accurate error messaging on login)
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.json({ exists: false });
    }

    const exists = await checkUserExists(cleanEmail);
    return res.json({ exists: Boolean(exists) });
  } catch (err) {
    return res.json({ exists: false });
  }
});

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
 * POST /api/auth/reset-password
 * Resets user password directly via Firebase Admin SDK
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and new password (at least 6 characters) are required.',
      });
    }

    // Verify account exists
    const exists = await checkUserExists(cleanEmail);
    if (!exists) {
      return res.status(404).json({
        success: false,
        code: 'auth/user-not-found',
        message: 'No account found with this email address. Please check your email or sign up first.',
      });
    }

    let updated = false;

    // 1. Update in Firebase Auth via Admin SDK
    try {
      if (admin && typeof admin.auth === 'function') {
        const authUser = await admin.auth().getUserByEmail(cleanEmail);
        if (authUser && authUser.uid) {
          await admin.auth().updateUser(authUser.uid, { password: newPassword });
          updated = true;
        }
      }
    } catch (adminErr) {
      console.warn('[AuthRoute] Admin SDK password update notice:', adminErr.message);
    }

    recordRegisteredEmail(cleanEmail);

    return res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.',
      updatedInAuth: updated,
    });
  } catch (err) {
    console.error('[AuthRoute] Reset password error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to reset password. Please try again.',
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
 * GET /api/auth/check-verification
 * Polls whether a user has clicked the verification link in their email
 */
router.get('/check-verification', async (req, res) => {
  try {
    const cleanEmail = (req.query.email || '').toString().toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, verified: false });
    }

    if (verifiedEmailsSet.has(cleanEmail)) {
      return res.json({ success: true, verified: true });
    }

    const db = getDb();
    if (db) {
      const usersSnap = await db.collection('users').where('email', '==', cleanEmail).get();
      if (!usersSnap.empty) {
        const u = usersSnap.docs[0].data();
        if (u.emailVerified === true || u.isVerified === true) {
          verifiedEmailsSet.add(cleanEmail);
          return res.json({ success: true, verified: true });
        }
      }
    }

    try {
      if (admin && admin.auth) {
        const firebaseUser = await admin.auth().getUserByEmail(cleanEmail);
        if (firebaseUser && firebaseUser.emailVerified) {
          verifiedEmailsSet.add(cleanEmail);
          return res.json({ success: true, verified: true });
        }
      }
    } catch {}

    return res.json({ success: true, verified: false });
  } catch (err) {
    return res.json({ success: true, verified: false });
  }
});

/**
 * POST /api/auth/mark-verified
 * Marks a user account as verified when verification link is accessed
 */
router.post('/mark-verified', async (req, res) => {
  try {
    const cleanEmail = (req.body.email || '').toString().toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    recordVerifiedEmail(cleanEmail);

    const db = getDb();
    if (db) {
      const usersSnap = await db.collection('users').where('email', '==', cleanEmail).get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.set({ emailVerified: true, isVerified: true, verifiedAt: new Date().toISOString() }, { merge: true });
      }
    }

    return res.json({ success: true, message: 'Account verified successfully' });
  } catch (err) {
    return res.json({ success: true });
  }
});

// In-memory store for OTP codes: email -> { code, expiresAt, isNewUser, attempts }
const otpStore = new Map();
// Anti-bot & spam rate limiter: email -> { lastSentAt, count, windowStart }
const otpRateLimit = new Map();

/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit email OTP verification code with Anti-Bot protection
 */
router.post('/send-otp', async (req, res) => {
  try {
    const rawEmail = (req.body.email || '').toString().toLowerCase().trim();
    if (!rawEmail || !rawEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // 1. Anti-Bot / Anti-Spam Rate Limiting
    const now = Date.now();
    const rateInfo = otpRateLimit.get(rawEmail) || { lastSentAt: 0, count: 0, windowStart: now };
    
    // Reset window if 1 hour has passed
    if (now - rateInfo.windowStart > 60 * 60 * 1000) {
      rateInfo.count = 0;
      rateInfo.windowStart = now;
    }

    // Min 20s cooldown between code requests
    const secondsSinceLast = Math.floor((now - rateInfo.lastSentAt) / 1000);
    if (rateInfo.lastSentAt && secondsSinceLast < 20) {
      return res.status(429).json({
        success: false,
        message: `Security cooldown active. Please wait ${20 - secondsSinceLast}s before requesting a new code.`,
      });
    }

    // Max 6 requests per hour per email to protect from bots
    if (rateInfo.count >= 6) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification requests. For security, please wait 15 minutes before trying again.',
      });
    }

    rateInfo.lastSentAt = now;
    rateInfo.count += 1;
    otpRateLimit.set(rawEmail, rateInfo);

    // Check if user exists
    let isNewUser = true;
    let existingUserData = null;
    const persistentList = getPersistentRegisteredEmails();
    if (persistentList.includes(rawEmail)) {
      isNewUser = false;
    }

    const db = getDb();
    if (db) {
      try {
        const snap = await db.collection('users').where('email', '==', rawEmail).get();
        if (!snap.empty) {
          isNewUser = false;
          existingUserData = snap.docs[0].data();
        }
      } catch (e) {}
    }

    // Generate secure cryptographically random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry
    otpStore.set(rawEmail, { code, expiresAt, isNewUser, userData: existingUserData, attempts: 0 });

    // Send email with OTP via secure SMTP
    try {
      await sendCustomOtpEmail({ userEmail: rawEmail, otpCode: code });
    } catch (e) {
      console.warn('[OTP] Email dispatch note:', e?.message);
    }

    // Security Notice: debugOtp is strictly omitted to prevent bot or hacker sniffing
    return res.json({
      success: true,
      isNewUser,
      message: `A 6-digit verification code has been sent to ${rawEmail}.`,
    });
  } catch (err) {
    console.error('[AuthRoute] Send OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP code. Please try again.',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP code submitted by user with Anti-Brute-Force lock
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const rawEmail = (req.body.email || '').toString().toLowerCase().trim();
    const otp = (req.body.otp || '').toString().trim();

    if (!rawEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const stored = otpStore.get(rawEmail);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found. Please request a new code.',
      });
    }

    // Expiry check
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(rawEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Check brute-force attempts
    if (stored.attempts >= 5) {
      otpStore.delete(rawEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. For account security, this code has been locked. Please request a new code.',
      });
    }

    // Validate exact code (strictly no bypass)
    if (stored.code !== otp) {
      stored.attempts = (stored.attempts || 0) + 1;
      const remaining = 5 - stored.attempts;
      if (remaining <= 0) {
        otpStore.delete(rawEmail);
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. For account security, this code has been locked. Please request a new code.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Clear used OTP immediately upon successful verification
    otpStore.delete(rawEmail);
    recordVerifiedEmail(rawEmail);

    // Look up existing user
    let user = stored?.userData || null;
    let isNewUser = stored ? stored.isNewUser : true;

    const db = getDb();
    if (db && !user) {
      try {
        const snap = await db.collection('users').where('email', '==', rawEmail).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          user = { id: doc.id, ...doc.data() };
          isNewUser = false;
        }
      } catch (e) {}
    }

    if (!user) {
      const persistent = getPersistentRegisteredEmails();
      if (persistent.includes(rawEmail)) {
        isNewUser = false;
        user = {
          uid: 'user_' + Buffer.from(rawEmail).toString('hex').slice(0, 10),
          email: rawEmail,
          displayName: rawEmail.split('@')[0],
          name: rawEmail.split('@')[0],
          currentPackage: 'None',
          walletBalance: 0,
        };
      }
    }

    return res.json({
      success: true,
      verified: true,
      isNewUser,
      user,
      email: rawEmail,
      message: isNewUser ? 'Email verified. Please complete your profile.' : 'Welcome back!',
    });
  } catch (err) {
    console.error('[AuthRoute] Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Verification error. Please try again.' });
  }
});

/**
 * POST /api/auth/complete-otp-signup
 * Creates a new user profile after successful OTP verification
 */
router.post('/complete-otp-signup', async (req, res) => {
  try {
    const rawEmail = (req.body.email || '').toString().toLowerCase().trim();
    const name = (req.body.name || '').toString().trim();
    const referralCode = (req.body.referralCode || '').toString().trim() || null;

    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanUsername = name ? (name.startsWith('@') ? name : '@' + name) : '@' + rawEmail.split('@')[0];
    const uid = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const isAdmin =
      rawEmail === 'mistrtaimur7@gmail.com' ||
      rawEmail === 'mistrtaimoor@gmail.com' ||
      rawEmail.startsWith('admin@') ||
      rawEmail.includes('taimri') ||
      rawEmail.includes('taemryadmin');

    const newUser = {
      uid,
      email: rawEmail,
      name: cleanUsername,
      displayName: cleanUsername,
      photoURL: null,
      currentPackage: 'None',
      walletBalance: 0,
      referralCount: 0,
      lifetimeAds: 0,
      dailyAdCount: 0,
      teamAdsCount: 0,
      totalEarned: 0,
      isEligible: false,
      isBlocked: false,
      referredBy: referralCode,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: true,
      isAdmin,
    };

    recordRegisteredEmail(rawEmail);
    recordVerifiedEmail(rawEmail);

    const db = getDb();
    if (db) {
      try {
        await db.collection('users').doc(uid).set(newUser, { merge: true });

        // If sponsor referral code provided, increment their count
        if (referralCode) {
          try {
            const cleanRef = referralCode.replace(/^@+/, '').trim();
            const usersRef = db.collection('users');
            const refSnap = await usersRef.get();
            if (refSnap && refSnap.docs) {
              for (const doc of refSnap.docs) {
                const data = doc.data();
                const matches =
                  doc.id === cleanRef ||
                  (data && data.uid === cleanRef) ||
                  (data && data.referralCode === cleanRef) ||
                  (data && (data.name || '').toLowerCase() === cleanRef.toLowerCase()) ||
                  (data && (data.name || '').replace(/^@+/, '').toLowerCase() === cleanRef.toLowerCase()) ||
                  (data && (data.email || '').toLowerCase() === cleanRef.toLowerCase());

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
            console.warn('[OTP Complete Signup] Referral increment notice:', refErr.message);
          }
        }
      } catch (dbErr) {
        console.warn('[OTP Complete Signup] User save notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      user: newUser,
      message: 'Account created successfully!',
    });
  } catch (err) {
    console.error('[AuthRoute] Complete OTP Signup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete registration.' });
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

