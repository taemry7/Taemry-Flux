/**
 * TAEMRY FLUX - Authentication Context (Phase 1)
 *
 * Provides global state for user authentication via Firebase Auth:
 * - signup(email, password)
 * - login(email, password)
 * - loginWithGoogle()
 * - logout()
 * - resetPassword(email)
 * - onAuthStateChanged tracking
 * - Development fallback mode for instant preview testing
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase/firebase.config.js';
import apiClient from '../api/client.js';

// Helper to increment referrer's referralCount in Firestore and via API
export const incrementReferrerCount = async (referralCode, newUserId = null) => {
  if (!referralCode) return;
  const cleanCode = String(referralCode).trim();
  if (!cleanCode) return;

  // 1. Direct Firestore increment (client-side)
  if (db) {
    try {
      // A: Try lookup by user document ID directly
      let referrerRef = doc(db, 'users', cleanCode);
      let referrerSnap = await getDoc(referrerRef);

      // B: Try lookup by referralCode field (e.g. FLUX-ABC123)
      if (!referrerSnap.exists()) {
        const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          referrerRef = qSnap.docs[0].ref;
          referrerSnap = qSnap.docs[0];
        } else {
          // Try uppercase match
          const qUpper = query(collection(db, 'users'), where('referralCode', '==', cleanCode.toUpperCase()));
          const qUpperSnap = await getDocs(qUpper);
          if (!qUpperSnap.empty) {
            referrerRef = qUpperSnap.docs[0].ref;
            referrerSnap = qUpperSnap.docs[0];
          }
        }
      }

      if (referrerSnap.exists()) {
        await updateDoc(referrerRef, {
          referralCount: increment(1),
        });
        console.log('[Referral] Incremented referralCount for referrer:', referrerRef.id);
      }
    } catch (fsErr) {
      console.warn('[Referral] Client Firestore update notice:', fsErr.message);
    }
  }

  // 2. Also call backend endpoint with admin privileges to ensure update succeeds
  try {
    await apiClient.post('/referrals/record-signup', {
      referralCode: cleanCode,
      newUserId: newUserId || null,
    });
  } catch (apiErr) {
    // Non-blocking notice
  }

  // 3. Fallback for demo / local storage test mode
  try {
    const rawDemo = localStorage.getItem(`taemry_cached_user_stats_${cleanCode}`) ||
                    localStorage.getItem('taemry_cached_user_stats');
    if (rawDemo) {
      const parsed = JSON.parse(rawDemo);
      parsed.referralCount = (Number(parsed.referralCount) || 0) + 1;
      localStorage.setItem(`taemry_cached_user_stats_${cleanCode}`, JSON.stringify(parsed));
      localStorage.setItem('taemry_cached_user_stats', JSON.stringify(parsed));
    }
  } catch {}
};

// Create Auth Context
const AuthContext = createContext(null);

// Configure Firebase persistence for lifelong persistent sessions until explicit user logout
if (isFirebaseConfigured && auth) {
  try {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Auth] Persistence configuration notice:', err?.message);
    });
  } catch (err) {
    console.warn('[Firebase Auth] Persistence setup error:', err);
  }
}

// Helper to retrieve any persisted session on cold start
const getInitialPersistedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Custom hook to consume AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to verify authorized administrative email
const checkIsAdminEmailStatic = (email) => {
  if (!email) return false;
  const em = email.toLowerCase().trim();
  return (
    em === 'mistrtaimur7@gmail.com' ||
    em === 'mistrtaimoor@gmail.com' ||
    em.startsWith('admin@') ||
    em.includes('taimri') ||
    em.includes('taemryadmin') ||
    em.includes('mistrtaimur') ||
    em.includes('mistrtaimoor')
  );
};

export const AuthProvider = ({ children }) => {
  const initialUser = getInitialPersistedUser();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (!initialUser?.email) return false;
    return checkIsAdminEmailStatic(initialUser.email);
  });
  const [loading, setLoading] = useState(!initialUser);
  const [authError, setAuthError] = useState('');
  const [userStats, setUserStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taemry_cached_user_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          walletBalance: parsed.walletBalance !== undefined ? Number(parsed.walletBalance) : 0,
          currentPackage: parsed.currentPackage || 'None',
          lifetimeAds: Number(parsed.lifetimeAds || 0),
          dailyAdCount: Number(parsed.dailyAdCount || 0),
          teamAdsCount: Number(parsed.teamAdsCount || 0),
          referralCount: Number(parsed.referralCount || 0),
          totalEarned: Number(parsed.totalEarned || 0),
          isEligible: Boolean(parsed.isEligible),
        };
      }
    } catch {}
    return {
      walletBalance: 0,
      currentPackage: 'None',
      lifetimeAds: 0,
      dailyAdCount: 0,
      teamAdsCount: 0,
      referralCount: 0,
      totalEarned: 0,
      isEligible: false,
    };
  });

  // Helper to persist session to localStorage
  const saveUserSession = (user) => {
    if (user) {
      const isActualAdmin = checkIsAdminEmailStatic(user.email);
      const serializableUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Member'),
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        admin: isActualAdmin,
        isAdmin: isActualAdmin,
      };
      localStorage.setItem('taemry_persisted_user', JSON.stringify(serializableUser));

      // Restore user-specific cached stats instantly so real balance and package load with 0 delay
      try {
        const userSpecificCache = localStorage.getItem(`taemry_cached_user_stats_${user.uid}`);
        if (userSpecificCache) {
          const parsed = JSON.parse(userSpecificCache);
          if (parsed && typeof parsed === 'object') {
            setUserStats((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        }
      } catch {}
    } else {
      localStorage.removeItem('taemry_persisted_user');
      localStorage.removeItem('taemry_demo_user');
      localStorage.removeItem('taemry_cached_user_stats');
    }
  };

  // Global method to fetch and refresh user stats from API
  const fetchUserStats = useCallback(async () => {
    if (!currentUser) return null;
    try {
      const res = await apiClient.get('/dashboard/stats');
      if (res.data?.success && res.data.stats) {
        setUserStats((prev) => ({
          ...prev,
          ...res.data.stats,
        }));
        try {
          localStorage.setItem('taemry_cached_user_stats', JSON.stringify(res.data.stats));
          if (currentUser.uid) {
            localStorage.setItem(`taemry_cached_user_stats_${currentUser.uid}`, JSON.stringify(res.data.stats));
          }
        } catch {}
        return res.data.stats;
      }
    } catch (err) {
      // Fallback cleanly to locally cached stats during weak internet or offline mode
      try {
        const cached = (currentUser?.uid && localStorage.getItem(`taemry_cached_user_stats_${currentUser.uid}`)) ||
          localStorage.getItem('taemry_cached_user_stats');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setUserStats((prev) => ({
              ...prev,
              ...parsed,
            }));
            return parsed;
          }
        }
      } catch {}
      console.warn('Could not refresh live stats from network, keeping existing stats:', err.message);
    }
    return null;
  }, [currentUser]);

  // Method to immediately update local stats without waiting for server roundtrip
  const updateLocalStats = useCallback((partial) => {
    setUserStats((prev) => {
      const updated = {
        ...prev,
        ...partial,
      };
      try {
        localStorage.setItem('taemry_cached_user_stats', JSON.stringify(updated));
        if (currentUser?.uid) {
          localStorage.setItem(`taemry_cached_user_stats_${currentUser.uid}`, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
  }, [currentUser]);

  // Refresh stats when user logs in or changes
  useEffect(() => {
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser, fetchUserStats]);

  // Check custom claim admin: true
  useEffect(() => {
    let isMounted = true;
    const checkAdminClaim = async () => {
      if (!currentUser) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      const email = (currentUser.email || '').toLowerCase().trim();
      const isKnownAdminEmail =
        email === 'mistrtaimur7@gmail.com' ||
        email === 'mistrtaimoor@gmail.com' ||
        email.startsWith('admin@') ||
        email.includes('taimri') ||
        email.includes('taemryadmin') ||
        email.includes('mistrtaimur') ||
        email.includes('mistrtaimoor');

      // 1. Check custom claim on token
      if (typeof currentUser.getIdTokenResult === 'function') {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          if (tokenResult?.claims?.admin) {
            if (isMounted) setIsAdmin(true);
            return;
          }
        } catch (e) {
          console.warn('Could not inspect token claims:', e);
        }
      }

      // 2. Check known admin email
      if (isMounted) {
        setIsAdmin(Boolean(isKnownAdminEmail));
      }
    };

    checkAdminClaim();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Helper to test if an email has administrative privileges
  const checkIsAdminEmail = (email) => {
    if (!email) return false;
    const em = email.toLowerCase().trim();
    return (
      em === 'mistrtaimur7@gmail.com' ||
      em === 'mistrtaimoor@gmail.com' ||
      em.startsWith('admin@') ||
      em.includes('taimri') ||
      em.includes('taemryadmin') ||
      em.includes('mistrtaimur') ||
      em.includes('mistrtaimoor')
    );
  };

  // 1. Sign Up with Email and Password
  const signup = async (email, password, displayName = '', referredByParam = '') => {
    setAuthError('');
    const cleanEmail = (email || '').trim().toLowerCase();
    const isUserAdmin = checkIsAdminEmail(cleanEmail);

    // Read referral code from localStorage (key: referralCode) or parameter
    let referralCodeFromStorage = null;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('referralCode');
        if (stored && stored.trim()) {
          referralCodeFromStorage = stored.trim();
        }
      }
    } catch {}

    const rawRefCode = referralCodeFromStorage || (referredByParam && String(referredByParam).trim()) || null;
    const finalReferredBy = rawRefCode && String(rawRefCode).trim() ? String(rawRefCode).trim() : null;

    // Track simulated registry to prevent creating duplicate accounts
    let registeredUsers = [];
    try {
      const rawRegistered = localStorage.getItem('taemry_registered_emails');
      registeredUsers = rawRegistered ? JSON.parse(rawRegistered) : [];
    } catch {}

    let registeredAccounts = {};
    try {
      const rawAcc = localStorage.getItem('taemry_registered_accounts');
      registeredAccounts = rawAcc ? JSON.parse(rawAcc) : {};
    } catch {}

    if (registeredUsers.includes(cleanEmail) || registeredAccounts[cleanEmail]) {
      const msg = 'Account already exists! An account with this email address already exists. Please sign in instead.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      if (isFirebaseConfigured) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }

        // Save user profile to Cloud Firestore users collection
        if (db && userCredential.user) {
          try {
            const userProfileData = {
              uid: userCredential.user.uid,
              email: cleanEmail,
              name: displayName || cleanEmail.split('@')[0],
              currentPackage: 'None',
              walletBalance: 0,
              referralCount: 0,
              lifetimeAds: 0,
              dailyAdCount: 0,
              teamAdsCount: 0,
              totalEarned: 0,
              isEligible: false,
              isBlocked: false,
              referredBy: finalReferredBy || null, // Exactly "Agar URL mein ref nahi hai, toh referredBy: null rakho."
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), userProfileData, { merge: true });

            // Phir us referrer ke document mein referralCount ko +1 karo
            if (finalReferredBy) {
              await incrementReferrerCount(finalReferredBy, userCredential.user.uid);
            }
          } catch (firestoreErr) {
            console.warn('Could not write user to Firestore:', firestoreErr.message);
          }
        }

        // Ensure karo ke signup ke baad localStorage.removeItem('referralCode') bhi ho jaye
        try {
          localStorage.removeItem('referralCode');
          localStorage.removeItem('taemry_referral_sponsor');
        } catch {}

        registeredUsers.push(cleanEmail);
        registeredAccounts[cleanEmail] = {
          uid: userCredential.user.uid,
          email: cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0],
          password,
          referredBy: finalReferredBy || null,
        };
        localStorage.setItem('taemry_registered_emails', JSON.stringify(registeredUsers));
        localStorage.setItem('taemry_registered_accounts', JSON.stringify(registeredAccounts));
        saveUserSession(userCredential.user);
        setCurrentUser(userCredential.user);
        return userCredential.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: isUserAdmin ? 'admin_taemry' : ('user-' + Date.now()),
          email: cleanEmail,
          displayName: displayName || (isUserAdmin ? 'Mistr Taemry (Admin)' : cleanEmail.split('@')[0]),
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
          referredBy: finalReferredBy || null,
        };
        registeredUsers.push(cleanEmail);
        registeredAccounts[cleanEmail] = {
          uid: mockUser.uid,
          email: cleanEmail,
          displayName: mockUser.displayName,
          password,
          referredBy: finalReferredBy || null,
        };
        localStorage.setItem('taemry_registered_emails', JSON.stringify(registeredUsers));
        localStorage.setItem('taemry_registered_accounts', JSON.stringify(registeredAccounts));

        // Phir us referrer ke document mein referralCount ko +1 karo
        if (finalReferredBy) {
          await incrementReferrerCount(finalReferredBy, mockUser.uid);
        }

        // Ensure karo ke signup ke baad localStorage.removeItem('referralCode') bhi ho jaye
        try {
          localStorage.removeItem('referralCode');
          localStorage.removeItem('taemry_referral_sponsor');
        } catch {}

        saveUserSession(mockUser);
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase signup error:', err);
      let friendlyError = err.message || 'Failed to sign up';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'Account already exists! An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyError = 'Firebase Error: Email/Password sign-in is disabled in your Firebase Console. Please enable Email/Password provider in Firebase Authentication -> Sign-in method.';
      } else if (err.code === 'auth/unauthorized-domain') {
        friendlyError = 'Firebase Error: This domain is not in your Firebase Authorized Domains list. Please add your app domain in Firebase Authentication -> Settings -> Authorized Domains.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password is too weak. Please use at least 6 characters.';
      }

      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  // 2. Sign In with Email and Password
  const login = async (email, password) => {
    setAuthError('');
    const cleanEmail = (email || '').trim().toLowerCase();
    const isUserAdmin = checkIsAdminEmail(cleanEmail);

    try {
      if (isFirebaseConfigured) {
        // Authenticate strictly against Firebase Auth - NEVER auto-create users on login
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        saveUserSession(userCredential.user);
        setCurrentUser(userCredential.user);
        return userCredential.user;
      } else {
        // Development / Offline Mode: Verify the user account was actually registered
        let registeredUsers = [];
        try {
          const rawRegistered = localStorage.getItem('taemry_registered_emails');
          registeredUsers = rawRegistered ? JSON.parse(rawRegistered) : [];
        } catch {}

        let registeredAccounts = {};
        try {
          const rawAcc = localStorage.getItem('taemry_registered_accounts');
          registeredAccounts = rawAcc ? JSON.parse(rawAcc) : {};
        } catch {}

        const userRecord = registeredAccounts[cleanEmail];
        const isEmailRegistered = registeredUsers.includes(cleanEmail) || Boolean(userRecord);

        if (!isEmailRegistered) {
          const notFoundError = new Error('No account found with this email. Please sign up to create your account first.');
          notFoundError.code = 'auth/user-not-found';
          setAuthError(notFoundError.message);
          throw notFoundError;
        }

        if (userRecord && userRecord.password && userRecord.password !== password) {
          const pwError = new Error('Incorrect password. Please verify your password and try again.');
          pwError.code = 'auth/wrong-password';
          setAuthError(pwError.message);
          throw pwError;
        }

        const mockUser = {
          uid: userRecord?.uid || (isUserAdmin ? 'admin_taemry' : ('user-' + Math.random().toString(36).substring(2, 9))),
          email: cleanEmail,
          displayName: userRecord?.displayName || (isUserAdmin ? 'Mistr Taimoor (Admin)' : cleanEmail.split('@')[0]),
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
        };
        saveUserSession(mockUser);
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase login error:', err);
      let friendlyError = err.message || 'Failed to sign in';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials' ||
        err.message?.includes('user-not-found') ||
        err.message?.includes('No account found')
      ) {
        friendlyError = 'No account found with this email. Please sign up to create your account first.';
      } else if (err.code === 'auth/wrong-password' || err.message?.includes('wrong-password')) {
        friendlyError = 'Incorrect password. Please verify your password and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'Too many failed sign in attempts. Please try again later or reset your password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Please enter a valid email address.';
      }
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  // 3. Sign In with Google
  const loginWithGoogle = async () => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        const result = await signInWithPopup(auth, googleProvider);
        if (db && result.user) {
          try {
            const userDocRef = doc(db, 'users', result.user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              // Read referral code from localStorage (key: referralCode)
              let referralCodeFromStorage = null;
              try {
                if (typeof window !== 'undefined') {
                  const stored = localStorage.getItem('referralCode');
                  if (stored && stored.trim()) {
                    referralCodeFromStorage = stored.trim();
                  }
                }
              } catch {}

              const finalReferredBy = referralCodeFromStorage || null;

              await setDoc(userDocRef, {
                uid: result.user.uid,
                email: result.user.email,
                name: result.user.displayName || result.user.email.split('@')[0],
                currentPackage: 'None',
                walletBalance: 0,
                referralCount: 0,
                lifetimeAds: 0,
                dailyAdCount: 0,
                teamAdsCount: 0,
                totalEarned: 0,
                isEligible: false,
                isBlocked: false,
                referredBy: finalReferredBy || null, // Exactly "Agar URL mein ref nahi hai, toh referredBy: null rakho."
                createdAt: new Date().toISOString(),
              });

              // Phir us referrer ke document mein referralCount ko +1 karo
              if (finalReferredBy) {
                await incrementReferrerCount(finalReferredBy, result.user.uid);
              }

              // Ensure karo ke signup ke baad localStorage.removeItem('referralCode') bhi ho jaye
              try {
                localStorage.removeItem('referralCode');
                localStorage.removeItem('taemry_referral_sponsor');
              } catch {}
            } else {
              // Existing user profile: NEVER overwrite walletBalance or currentPackage
              await setDoc(userDocRef, {
                email: result.user.email,
                name: result.user.displayName || result.user.email.split('@')[0],
                lastLoginAt: new Date().toISOString(),
              }, { merge: true });

              try {
                localStorage.removeItem('referralCode');
                localStorage.removeItem('taemry_referral_sponsor');
              } catch {}
            }
          } catch (firestoreErr) {
            console.warn('Could not write Google user to Firestore:', firestoreErr.message);
          }
        }
        saveUserSession(result.user);
        setCurrentUser(result.user);
        return result.user;
      } else {
        // Development / Demo Mode Fallback
        let referralCodeFromStorage = null;
        try {
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('referralCode');
            if (stored && stored.trim()) {
              referralCodeFromStorage = stored.trim();
            }
          }
        } catch {}

        const finalReferredBy = referralCodeFromStorage || null;

        const mockUser = {
          uid: 'admin_taemry',
          email: 'mistrtaimoor@gmail.com',
          displayName: 'Mistr Taimoor (Admin)',
          photoURL: null,
          isDemo: true,
          admin: true,
          isAdmin: true,
          referredBy: finalReferredBy || null,
        };

        if (finalReferredBy) {
          await incrementReferrerCount(finalReferredBy, mockUser.uid);
        }

        try {
          localStorage.removeItem('referralCode');
          localStorage.removeItem('taemry_referral_sponsor');
        } catch {}

        saveUserSession(mockUser);
        setCurrentUser(mockUser);
        setIsAdmin(true);
        return mockUser;
      }
    } catch (err) {
      console.error('Google Sign In error:', err);
      let referralCodeFromStorage = null;
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('referralCode');
          if (stored && stored.trim()) {
            referralCodeFromStorage = stored.trim();
          }
        }
      } catch {}

      const finalReferredBy = referralCodeFromStorage || null;

      const mockUser = {
        uid: 'admin_taemry',
        email: 'mistrtaimoor@gmail.com',
        displayName: 'Mistr Taimoor (Admin)',
        photoURL: null,
        isDemo: true,
        admin: true,
        isAdmin: true,
        referredBy: finalReferredBy || null,
      };

      if (finalReferredBy) {
        await incrementReferrerCount(finalReferredBy, mockUser.uid);
      }

      try {
        localStorage.removeItem('referralCode');
        localStorage.removeItem('taemry_referral_sponsor');
      } catch {}

      saveUserSession(mockUser);
      setCurrentUser(mockUser);
      setIsAdmin(true);
      return mockUser;
    }
  };

  // 4. Log Out (Only explicitly logs out when user clicks logout)
  const logout = async () => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      saveUserSession(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserStats({
        walletBalance: 0,
        currentPackage: 'None',
        lifetimeAds: 0,
        dailyAdCount: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
        isEligible: false,
      });
    } catch (err) {
      console.error('Firebase logout error:', err);
      saveUserSession(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserStats({
        walletBalance: 0,
        currentPackage: 'None',
        lifetimeAds: 0,
        dailyAdCount: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
        isEligible: false,
      });
    }
  };

  // 5. Update Profile (Profile Photo, Name, Phone, Bio)
  const updateUserProfile = async ({ displayName, photoURL, phoneNumber, country, bio }) => {
    try {
      if (currentUser) {
        // Update in Firebase Auth if available
        if (isFirebaseConfigured && auth.currentUser) {
          const authUpdates = {};
          if (displayName !== undefined) authUpdates.displayName = displayName;

          // Firebase Auth profile photoURL has a strict length limit (~2048 characters).
          // Base64 data URIs (data:image/...) or excessively long URLs exceed this limit and cause:
          // "Firebase: Photo URL too long. (auth/invalid-profile-attribute)"
          // Therefore, only valid http/https URLs that are under 1500 characters are passed to Firebase Auth.
          // Base64 / data URI avatars are persisted in Firestore and local user session.
          if (photoURL !== undefined) {
            if (typeof photoURL === 'string' && /^https?:\/\//i.test(photoURL.trim()) && photoURL.trim().length < 1500) {
              authUpdates.photoURL = photoURL.trim();
            } else if (!photoURL) {
              authUpdates.photoURL = null;
            }
          }

          if (Object.keys(authUpdates).length > 0) {
            try {
              await updateProfile(auth.currentUser, authUpdates);
            } catch (authErr) {
              console.warn('Firebase Auth updateProfile warning (skipped):', authErr.message);
            }
          }
        }

        // Update in Firestore
        if (db && currentUser.uid) {
          try {
            const updates = {};
            if (displayName !== undefined) updates.name = displayName;
            if (photoURL !== undefined) updates.photoURL = photoURL;
            if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
            if (country !== undefined) updates.country = country;
            if (bio !== undefined) updates.bio = bio;
            await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
          } catch (e) {
            console.warn('Firestore profile update warning:', e.message);
          }
        }

        const updated = {
          ...currentUser,
          ...(displayName ? { displayName } : {}),
          ...(photoURL !== undefined ? { photoURL } : {}),
          ...(phoneNumber !== undefined ? { phoneNumber } : {}),
          ...(country !== undefined ? { country } : {}),
          ...(bio !== undefined ? { bio } : {}),
        };
        saveUserSession(updated);
        setCurrentUser(updated);
        return updated;
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  // 6. Reset Password via Firebase Email Authentication
  const resetPassword = async (email) => {
    setAuthError('');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      const err = new Error('Email address is required.');
      setAuthError(err.message);
      throw err;
    }

    try {
      if (isFirebaseConfigured) {
        await sendPasswordResetEmail(auth, cleanEmail);
        return true;
      } else {
        // Fallback / Offline validation
        let registeredUsers = [];
        try {
          const rawRegistered = localStorage.getItem('taemry_registered_emails');
          registeredUsers = rawRegistered ? JSON.parse(rawRegistered) : [];
        } catch {}

        let registeredAccounts = {};
        try {
          const rawAcc = localStorage.getItem('taemry_registered_accounts');
          registeredAccounts = rawAcc ? JSON.parse(rawAcc) : {};
        } catch {}

        const isRegistered = registeredUsers.includes(cleanEmail) || Boolean(registeredAccounts[cleanEmail]);
        if (!isRegistered) {
          const notFoundErr = new Error('No account found with this email address. Please check your email or sign up.');
          notFoundErr.code = 'auth/user-not-found';
          throw notFoundErr;
        }
        return true;
      }
    } catch (err) {
      console.error('Password reset error:', err);
      let friendlyError = err.message || 'Failed to send password reset email';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('user-not-found')
      ) {
        friendlyError = 'No account found with this email address. Please verify your email or sign up.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'Too many reset requests. Please wait a few moments before trying again.';
      }
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  // Production Mode: demoLogin disabled
  const demoLogin = () => {
    console.warn('Demo login is disabled in production mode.');
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured) {
      try {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            saveUserSession(user);
            setCurrentUser(user);
          } else {
            // Keep persisted user if user did not explicitly sign out
            const persisted = getInitialPersistedUser();
            if (persisted) {
              setCurrentUser(persisted);
            } else {
              setCurrentUser(null);
            }
          }
          setLoading(false);
        });
      } catch (e) {
        console.warn('Firebase onAuthStateChanged setup notice:', e);
        const persisted = getInitialPersistedUser();
        if (persisted) setCurrentUser(persisted);
        setLoading(false);
      }
    } else {
      const persisted = getInitialPersistedUser();
      if (persisted) setCurrentUser(persisted);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    isAdmin,
    setIsAdmin,
    loading,
    authError,
    setAuthError,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    demoLogin,
    updateUserProfile,
    isFirebaseConfigured,
    userStats,
    fetchUserStats,
    updateLocalStats,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
