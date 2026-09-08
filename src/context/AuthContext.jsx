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

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/firebase.config.js';

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
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Sign Up with Email and Password
  const signup = async (email, password, displayName = '') => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
        return userCredential.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: 'demo-' + Date.now(),
          email: email,
          displayName: displayName || email.split('@')[0],
          photoURL: null,
          isDemo: true
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase signup error:', err);
      // If Firebase key is invalid or demo, fallback gracefully
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key not valid')) {
        const mockUser = {
          uid: 'demo-' + Date.now(),
          email: email,
          displayName: displayName || email.split('@')[0],
          photoURL: null,
          isDemo: true
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }
      setAuthError(err.message || 'Failed to sign up');
      throw err;
    }
  };

  // 2. Sign In with Email and Password
  const login = async (email, password) => {
    setAuthError('');
    try {
      if (isFirebaseConfigured) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: 'demo-user-1',
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
          isDemo: true
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }
    } catch (err) {
      console.error('Firebase login error:', err);
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key not valid')) {
        const mockUser = {
          uid: 'demo-user-1',
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
          isDemo: true
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
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
        return result.user;
      } else {
        // Development / Demo Mode Fallback
        const mockUser = {
          uid: 'google-demo-user',
          email: 'mistrtaemry@gmail.com',
          displayName: 'Mistr Taemry',
          photoURL: null,
          isDemo: true
        };
        localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }
    } catch (err) {
      console.error('Google Sign In error:', err);
      // Fallback if popup fails in iframe or unconfigured
      const mockUser = {
        uid: 'google-demo-user',
        email: 'mistrtaemry@gmail.com',
        displayName: 'Mistr Taemry',
        photoURL: null,
        isDemo: true
      };
      localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
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
    } catch (err) {
      console.error('Firebase logout error:', err);
      localStorage.removeItem('taemry_demo_user');
      setCurrentUser(null);
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
  const demoLogin = (email = 'mistrtaemry@gmail.com') => {
    const mockUser = {
      uid: 'demo-flux-' + Date.now(),
      email: email,
      displayName: 'TAEMRY User',
      isDemo: true
    };
    localStorage.setItem('taemry_demo_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
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
    loading,
    authError,
    setAuthError,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    demoLogin,
    isFirebaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
