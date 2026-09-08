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
    // Pre-populate systemSettings with packages and general configuration
    this.data.set('systemSettings/general', {
      exchangeRate: 300,
      bankAccountName: 'TAEMRY FLUX HOLDINGS LTD',
      bankAccountNumber: 'PK76MEZN0000123456789012',
      bankName: 'Meezan Bank Ltd',
      easypaisaNumber: '03451234567',
      easypaisaName: 'TAEMRY OFFICIAL',
      jazzcashNumber: '03009876543',
      jazzcashName: 'TAEMRY OFFICIAL',
      cryptoAddresses: {
        USDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d',
        BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      },
      minWithdrawal: 1,
      maxWithdrawal: 1000,
      withdrawalCooldownMinutes: 5,
      referralRequired: true,
      updatedAt: new Date().toISOString(),
    });

    this.data.set('systemSettings/packages', {
      bronze: { id: 'bronze', name: 'Bronze', price: 1.00, minWallet: 0.10, rewardRate: '2.0%', dailyLimit: 20, description: 'Starter tier to begin daily earnings.' },
      silver: { id: 'silver', name: 'Silver', price: 5.00, minWallet: 0.50, rewardRate: '2.5%', dailyLimit: 40, description: 'Higher daily capacity and rewards.' },
      gold: { id: 'gold', name: 'Gold', price: 10.00, minWallet: 1.00, rewardRate: '3.0%', dailyLimit: 60, description: 'Accelerated views and earning potential.' },
      elite: { id: 'elite', name: 'Elite', price: 100.00, minWallet: 10.00, rewardRate: '4.5%', dailyLimit: 100, description: 'High-velocity tier with premium returns.' },
      master: { id: 'master', name: 'Master', price: 500.00, minWallet: 50.00, rewardRate: '6.0%', dailyLimit: 150, description: 'Elite volume multiplier with maximum tier returns.' },
      apex: { id: 'apex', name: 'Apex', price: 1000.00, minWallet: 100.00, rewardRate: '7.5%', dailyLimit: 200, description: 'Top tier package with unbounded reward scale.' },
    });
  }

  collection(name) {
    const self = this;

    const createQuery = (filters = [], orderBys = [], limitCount = null) => ({
      where(field, op, val) {
        return createQuery([...filters, { field, op, val }], orderBys, limitCount);
      },
      orderBy(field, dir = 'asc') {
        return createQuery(filters, [...orderBys, { field, dir: dir.toLowerCase() }], limitCount);
      },
      limit(n) {
        return createQuery(filters, orderBys, n);
      },
      async get() {
        let matchingDocs = [];
        const prefix = `${name}/`;
        for (const [key, value] of self.data.entries()) {
          if (key.startsWith(prefix) && key.indexOf('/', prefix.length) === -1) {
            const docId = key.substring(prefix.length);
            let matches = true;
            for (const f of filters) {
              if (f.op === '==' && value[f.field] !== f.val) matches = false;
              if (f.op === 'in' && Array.isArray(f.val) && !f.val.includes(value[f.field])) matches = false;
              if (f.op === '>' && !(value[f.field] > f.val)) matches = false;
              if (f.op === '>=' && !(value[f.field] >= f.val)) matches = false;
              if (f.op === '<' && !(value[f.field] < f.val)) matches = false;
              if (f.op === '<=' && !(value[f.field] <= f.val)) matches = false;
            }
            if (matches) {
              matchingDocs.push({
                id: docId,
                exists: true,
                data: () => ({ ...value }),
              });
            }
          }
        }

        // Apply orderBys
        if (orderBys.length > 0) {
          matchingDocs.sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            for (const ob of orderBys) {
              const aVal = aData[ob.field];
              const bVal = bData[ob.field];
              if (aVal < bVal) return ob.dir === 'desc' ? 1 : -1;
              if (aVal > bVal) return ob.dir === 'desc' ? -1 : 1;
            }
            return 0;
          });
        }

        // Apply limit
        if (limitCount && limitCount > 0) {
          matchingDocs = matchingDocs.slice(0, limitCount);
        }

        return {
          empty: matchingDocs.length === 0,
          size: matchingDocs.length,
          docs: matchingDocs,
        };
      },
    });

    return {
      ...createQuery([]),
      doc(id) {
        const path = `${name}/${id}`;
        return {
          async get() {
            const docData = self.data.get(path);
            return {
              exists: Boolean(docData),
              data: () => (docData ? { ...docData } : undefined),
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
