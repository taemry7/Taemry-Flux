/**
 * TAEMRY FLUX - Firebase Admin SDK Initialization
 * Connects to Firebase Firestore and Auth using service account credentials.
 */

import * as firebaseAdminModule from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const admin = firebaseAdminModule.default || firebaseAdminModule;

let dbInstance = null;
let isConfigured = false;

// Format private key correctly (replaces literal '\n' if stored as single-line string)
const getFormattedPrivateKey = () => {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!rawKey) return null;
  return rawKey.replace(/\\n/g, '\n');
};

/**
 * Initialize Firebase Admin SDK (lazy initialization pattern)
 */
export const initFirebaseAdmin = () => {
  if (admin && admin.apps && admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getFormattedPrivateKey();

  if (projectId && clientEmail && privateKey && !privateKey.includes('your_private_key') && admin && admin.credential) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isConfigured = true;
      console.log('Firebase Admin SDK initialized successfully with service account.');
      return admin.app();
    } catch (error) {
      console.warn('Firebase Admin credential initialization warning:', error.message);
      return null;
    }
  } else {
    return null;
  }
};

/**
 * In-memory mock Firestore store for development/preview testing
 * when real service account credentials are not configured yet.
 */
class MockFirestore {
  constructor() {
    this.data = new Map();
    // Pre-populate systemSettings with packages
    this.data.set('systemSettings/packages', {
      bronze: { id: 'bronze', name: 'Bronze', price: 25.00, rewardRate: '1.8%', dailyLimit: 20 },
      silver: { id: 'silver', name: 'Silver', price: 75.00, rewardRate: '2.6%', dailyLimit: 40 },
      gold: { id: 'gold', name: 'Gold', price: 150.00, rewardRate: '3.4%', dailyLimit: 60 },
      platinum: { id: 'platinum', name: 'Platinum', price: 300.00, rewardRate: '4.2%', dailyLimit: 80 },
      diamond: { id: 'diamond', name: 'Diamond', price: 500.00, rewardRate: '5.0%', dailyLimit: 100 },
      master: { id: 'master', name: 'Master', price: 1000.00, rewardRate: '6.0%', dailyLimit: 120 },
      apex: { id: 'apex', name: 'Apex', price: 2500.00, rewardRate: '7.5%', dailyLimit: 150 },
    });
  }

  collection(name) {
    const self = this;
    return {
      doc(id) {
        const path = `${name}/${id}`;
        return {
          async get() {
            const docData = self.data.get(path);
            return {
              exists: Boolean(docData),
              data: () => docData,
              id,
            };
          },
          async set(data, options = {}) {
            if (options.merge && self.data.has(path)) {
              self.data.set(path, { ...self.data.get(path), ...data });
            } else {
              self.data.set(path, data);
            }
            return { writeTime: new Date() };
          },
          async update(data) {
            const existing = self.data.get(path) || {};
            self.data.set(path, { ...existing, ...data });
            return { writeTime: new Date() };
          },
          collection(subName) {
            return self.collection(`${path}/${subName}`);
          }
        };
      },
      async add(data) {
        const generatedId = 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const path = `${name}/${generatedId}`;
        const record = { ...data, id: generatedId, timestamp: new Date().toISOString() };
        self.data.set(path, record);
        return { id: generatedId, get: async () => ({ data: () => record }) };
      }
    };
  }
}

const mockDb = new MockFirestore();

/**
 * Get Firestore database instance (real or dev fallback)
 */
export const getDb = () => {
  if (dbInstance) return dbInstance;

  initFirebaseAdmin();

  if (admin && admin.apps && admin.apps.length > 0 && isConfigured) {
    try {
      dbInstance = admin.firestore();
      return dbInstance;
    } catch (e) {
      console.warn('Firestore initialization fallback:', e.message);
      return mockDb;
    }
  }

  return mockDb;
};

export const isFirebaseAdminConfigured = () => isConfigured;
export { admin };
export default admin;
