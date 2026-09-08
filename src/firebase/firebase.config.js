/**
 * TAEMRY FLUX - Firebase Configuration (Phase 1)
 *
 * Modular Firebase v9+ initialization using environment variables.
 * Exports: app, auth, db (Firestore), googleProvider
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables from Vite (.env file)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForPreviewDemoTestingOnly123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'taemry-flux-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'taemry-flux-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'taemry-flux-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demo12345678',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO12345'
};

// Check if user has provided real Firebase keys
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('your_firebase_api_key')
);

// Initialize Firebase app singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Google Auth Provider for "Continue with Google"
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
