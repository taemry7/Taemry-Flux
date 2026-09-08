/**
 * TAEMRY FLUX - Firebase Configuration
 * Direct integration using the user's provided Firebase Project configuration.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDHehaUaazgx9t5e6M5LzRFghD-6h7Gh14",
  authDomain: "taemry-flux.firebaseapp.com",
  projectId: "taemry-flux",
  storageBucket: "taemry-flux.firebasestorage.app",
  messagingSenderId: "692537379762",
  appId: "1:692537379762:web:030e49001e88f1877cf2ab"
};

// Always configured with your project credentials
export const isFirebaseConfigured = true;

// Initialize Firebase
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
