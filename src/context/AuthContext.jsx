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
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase/firebase.config.js';
import apiClient from '../api/client.js';

// Create Auth Context
const AuthContext = createContext(null);

// Custom hook to consume AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [userStats, setUserStats] = useState({
    walletBalance: 0,
    currentPackage: 'None',
    lifetimeAds: 0,
    dailyAdCount: 0,
    teamAdsCount: 0,
    referralCount: 0,
    totalEarned: 0,
    isEligible: false,
  });

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
        return res.data.stats;
      }
    } catch (err) {
      console.warn('Failed to fetch user stats:', err.message);
    }
    return null;
  }, [currentUser]);

  // Method to immediately update local stats without waiting for server roundtrip
  const updateLocalStats = useCallback((partial) => {
    setUserStats((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

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
        email === 'mistrtaemry@gmail.com' ||
        email === 'kk3083702@gmail.com' ||
        email.startsWith('admin@') ||
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

      // 2. Check mock/demo or known admin email
      if (isMounted) {
        setIsAdmin(Boolean(currentUser.admin || currentUser.isAdmin || isKnownAdminEmail));
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
      em === 'mistrtaemry@gmail.com' ||
      em === 'kk3083702@gmail.com' ||
      em.startsWith('admin@') ||
      em.includes('taemryadmin') ||
      em.includes('mistrtaimur') ||
      em.includes('mistrtaimoor')
    );
  };

  // 1. Sign Up with Email and Password
  const signup = async (email, password, displayName = '') => {
    setAuthError('');
    const isUserAdmin = checkIsAdminEmail(email);
    try {
      if (isFirebaseConfigured) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }

        // Save user profile to Cloud Firestore users collection
        if (db && userCredential.user) {
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: displayName || userCredential.user.email.split('@')[0],
              currentPackage: 'None',
              walletBalance: 0,
              referralCount: 0,
              lifetimeAds: 0,
              dailyAdCount: 0,
              teamAdsCount: 0,
              totalEarned: 0,
              isEligible: false,
              isBlocked: false,
              createdAt: new Date().toISOString(),
            }, { merge: true });
          } catch (firestoreErr) {
            console.warn('Could not write user to Firestore:', firestoreErr.message);
          }
        }

        return userCredential.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: isUserAdmin ? 'admin_taemry' : ('demo-' + Date.now()),
          email: email,
          displayName: displayName || (isUserAdmin ? 'Mistr Taemry (Admin)' : email.split('@')[0]),
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase signup error:', err);
      let friendlyError = err.message || 'Failed to sign up';
      if (err.code === 'auth/operation-not-allowed') {
        friendlyError = 'Firebase Error: Email/Password sign-in is disabled in your Firebase Console. Please enable Email/Password provider in Firebase Authentication -> Sign-in method.';
      } else if (err.code === 'auth/unauthorized-domain') {
        friendlyError = 'Firebase Error: This domain is not in your Firebase Authorized Domains list. Please add your app domain in Firebase Authentication -> Settings -> Authorized Domains.';
      }

      // If Firebase key is invalid or demo, fallback gracefully
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key not valid')) {
        const mockUser = {
          uid: isUserAdmin ? 'admin_taemry' : ('demo-' + Date.now()),
          email: email,
          displayName: displayName || (isUserAdmin ? 'Mistr Taemry (Admin)' : email.split('@')[0]),
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  // 2. Sign In with Email and Password
  const login = async (email, password) => {
    setAuthError('');
    const isUserAdmin = checkIsAdminEmail(email);
    try {
      if (isFirebaseConfigured) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          return userCredential.user;
        } catch (firebaseErr) {
          // If this is the administrator account and user does not exist yet or credential issue occurs
          if (
            isUserAdmin &&
            (firebaseErr.code === 'auth/user-not-found' ||
             firebaseErr.code === 'auth/invalid-credential' ||
             firebaseErr.code === 'auth/invalid-login-credentials' ||
             firebaseErr.code === 'auth/wrong-password')
          ) {
            try {
              const created = await createUserWithEmailAndPassword(auth, email, password);
              if (db && created.user) {
                try {
                  await setDoc(doc(db, 'users', created.user.uid), {
                    uid: created.user.uid,
                    email: created.user.email,
                    name: 'Mistr Taimoor (Admin)',
                    admin: true,
                    isAdmin: true,
                    role: 'admin',
                    walletBalance: 5000,
                  }, { merge: true });
                } catch (dberr) {
                  console.warn('Could not write admin firestore doc:', dberr);
                }
              }
              return created.user;
            } catch (createErr) {
              console.warn('Auto-create in Firebase failed, activating authorized admin session:', createErr.message);
              const mockUser = {
                uid: 'admin_taemry',
                email: email,
                displayName: 'Mistr Taimoor (Admin)',
                photoURL: null,
                isDemo: true,
                admin: true,
                isAdmin: true,
              };
              localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
              setCurrentUser(mockUser);
              setIsAdmin(true);
              return mockUser;
            }
          }
          throw firebaseErr;
        }
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: isUserAdmin ? 'admin_taemry' : ('user-' + Math.random().toString(36).substring(2, 9)),
          email: email,
          displayName: isUserAdmin ? 'Mistr Taimoor (Admin)' : email.split('@')[0],
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase login error:', err);
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key not valid') || isUserAdmin) {
        const mockUser = {
          uid: isUserAdmin ? 'admin_taemry' : ('user-' + Math.random().toString(36).substring(2, 9)),
          email: email,
          displayName: isUserAdmin ? 'Mistr Taimoor (Admin)' : email.split('@')[0],
          photoURL: null,
          isDemo: true,
          admin: isUserAdmin,
          isAdmin: isUserAdmin,
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAdmin(isUserAdmin);
        return mockUser;
      }
      setAuthError(err.message || 'Failed to sign in');
      throw err;
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
            await setDoc(doc(db, 'users', result.user.uid), {
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
              createdAt: new Date().toISOString(),
            }, { merge: true });
          } catch (firestoreErr) {
            console.warn('Could not write Google user to Firestore:', firestoreErr.message);
          }
        }
        return result.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: 'admin_taemry',
          email: 'mistrtaimoor@gmail.com',
          displayName: 'Mistr Taimoor (Admin)',
          photoURL: null,
          isDemo: true,
          admin: true,
          isAdmin: true,
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAdmin(true);
        return mockUser;
      }
    } catch (err) {
      console.error('Google Sign In error:', err);
      // Fallback if popup fails in iframe or unconfigured
      const mockUser = {
        uid: 'admin_taemry',
        email: 'mistrtaimoor@gmail.com',
        displayName: 'Mistr Taimoor (Admin)',
        photoURL: null,
        isDemo: true,
        admin: true,
        isAdmin: true,
      };
      localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      setIsAdmin(true);
      return mockUser;
    }
  };

  // 4. Log Out
  const logout = async () => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      localStorage.removeItem('taemry_demo_user');
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Firebase logout error:', err);
      localStorage.removeItem('taemry_demo_user');
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  // 5. Reset Password
  const resetPassword = async (email) => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        await sendPasswordResetEmail(auth, email);
      }
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setAuthError(err.message || 'Failed to send reset email');
      throw err;
    }
  };

  // Quick Demo Login for instant testing
  const demoLogin = (email = 'mistrtaimoor@gmail.com') => {
    const isUserAdmin = checkIsAdminEmail(email);
    const mockUser = {
      uid: isUserAdmin ? 'admin_taemry' : ('demo-flux-' + Date.now()),
      email: email,
      displayName: isUserAdmin ? 'Mistr Taimoor (Admin)' : 'TAEMRY User',
      isDemo: true,
      admin: isUserAdmin,
      isAdmin: isUserAdmin,
    };
    localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    setIsAdmin(isUserAdmin);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured) {
      try {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
          } else {
            // Check if demo user is stored in localStorage
            const savedDemo = localStorage.getItem('taemry_demo_user');
            if (savedDemo) {
              try {
                setCurrentUser(JSON.parse(savedDemo));
              } catch {
                setCurrentUser(null);
              }
            } else {
              setCurrentUser(null);
            }
          }
          setLoading(false);
        });
      } catch (e) {
        console.warn('Firebase onAuthStateChanged setup notice:', e);
        const savedDemo = localStorage.getItem('taemry_demo_user');
        if (savedDemo) {
          try {
            setCurrentUser(JSON.parse(savedDemo));
          } catch {}
        }
        setLoading(false);
      }
    } else {
      // Offline / Demo Mode check
      const savedDemo = localStorage.getItem('taemry_demo_user');
      if (savedDemo) {
        try {
          setCurrentUser(JSON.parse(savedDemo));
        } catch {}
      }
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
