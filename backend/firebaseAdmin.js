/**
 * TAEMRY FLUX - Firebase Admin SDK Initialization
 * Connects to Firebase Firestore and Auth using service account credentials.
 */

import * as firebaseAdminModule from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const admin = firebaseAdminModule.default || firebaseAdminModule;

let dbInstance = null;
let isConfigured = false;

// Helper to obtain cert credential in both legacy and modern firebase-admin (v14+)
const getCertCredential = (creds) => {
  if (typeof admin.cert === 'function') {
    return admin.cert(creds);
  }
  if (typeof firebaseAdminModule.cert === 'function') {
    return firebaseAdminModule.cert(creds);
  }
  return null;
};

const getExistingApps = () => {
  if (typeof admin.getApps === 'function') {
    return admin.getApps();
  }
  if (typeof firebaseAdminModule.getApps === 'function') {
    return firebaseAdminModule.getApps();
  }
  return admin.apps || [];
};

// Ensure backwards-compatible admin.firestore() and admin.auth() bindings
const ensureAdminMethods = (app) => {
  const existingApps = getExistingApps();
  const currentApp = app || (existingApps.length > 0 ? existingApps[0] : null);
  if (currentApp) {
    if (!admin.firestore || typeof admin.firestore !== 'function') {
      admin.firestore = () => getFirestore(currentApp);
    }
    if (!admin.auth || typeof admin.auth !== 'function') {
      admin.auth = () => getAuth(currentApp);
    }
    admin.credential = {
      cert: (c) => {
        const fn = admin.cert || firebaseAdminModule.cert;
        return fn ? fn(c) : null;
      },
    };
  }
};

// Look for service account key file in common locations
const findServiceAccountFile = () => {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'backend', 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Could not parse serviceAccountKey file at:', p, e.message);
      }
    }
  }
  return null;
};

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
  const existingApps = getExistingApps();
  if (existingApps && existingApps.length > 0) {
    const currentApp = existingApps[0];
    ensureAdminMethods(currentApp);
    return currentApp;
  }

  // 1. Try loading from serviceAccountKey.json file if present
  const fileCredentials = findServiceAccountFile();
  if (fileCredentials) {
    const cred = getCertCredential(fileCredentials);
    if (cred) {
      try {
        const app = admin.initializeApp({
          credential: cred,
        });
        isConfigured = true;
        ensureAdminMethods(app);
        console.log('Firebase Admin SDK initialized successfully from serviceAccountKey.json.');
        return app;
      } catch (error) {
        console.warn('Firebase Admin file credential error:', error.message);
      }
    }
  }

  // 2. Try raw JSON string in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      const cred = getCertCredential(parsed);
      if (cred) {
        const app = admin.initializeApp({
          credential: cred,
        });
        isConfigured = true;
        ensureAdminMethods(app);
        console.log('Firebase Admin SDK initialized successfully from FIREBASE_SERVICE_ACCOUNT env.');
        return app;
      }
    } catch (error) {
      console.warn('Firebase Admin JSON string credential error:', error.message);
    }
  }

  // 3. Try individual environment variables with project defaults
  const projectId = process.env.FIREBASE_PROJECT_ID || 'taemry-flux';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@taemry-flux.iam.gserviceaccount.com';
  const privateKey = getFormattedPrivateKey();

  if (projectId && clientEmail && privateKey && !privateKey.includes('your_private_key')) {
    const cred = getCertCredential({
      projectId,
      clientEmail,
      privateKey,
    });
    if (cred) {
      try {
        const app = admin.initializeApp({
          credential: cred,
        });
        isConfigured = true;
        ensureAdminMethods(app);
        console.log('Firebase Admin SDK initialized successfully with service account.');
        return app;
      } catch (error) {
        console.warn('Firebase Admin credential initialization warning:', error.message);
        return null;
      }
    }
  }

  return null;
};

/**
 * In-memory mock Firestore store for development/preview testing
 * when real service account credentials are not configured yet.
 */
class MockFirestore {
  constructor() {
    this.data = new Map();
    this.cacheFile = path.resolve(process.cwd(), '.mock_firestore_cache.json');
    this._initData();
  }

  _persist() {
    try {
      const entries = Array.from(this.data.entries());
      fs.writeFileSync(this.cacheFile, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (e) {
      // Ignore cache write error in read-only environments
    }
  }

  _initData() {
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

    // Production Mode: No dummy users, deposits, or withdrawals seeded
    // Real data is populated exclusively through user signups, genuine deposits, and Firebase.

    // Merge cached data if exists
    if (fs.existsSync(this.cacheFile)) {
      try {
        const raw = fs.readFileSync(this.cacheFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const [k, v] of parsed) {
            this.data.set(k, v);
          }
        }
      } catch (e) {
        console.warn('Could not read mock cache file:', e.message);
      }
    }
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
            let docData = self.data.get(path);
            let resolvedId = id;
            if (!docData) {
              // Search collection entries for matching id, depositId, withdrawalId, or ticketId
              const prefix = `${name}/`;
              for (const [key, value] of self.data.entries()) {
                if (key.startsWith(prefix)) {
                  if (
                    value.id === id ||
                    value.depositId === id ||
                    value.withdrawalId === id ||
                    value.ticketId === id ||
                    value.transactionId === id ||
                    value.uid === id
                  ) {
                    docData = value;
                    resolvedId = value.id || value.depositId || id;
                    break;
                  }
                }
              }
            }
            return {
              exists: Boolean(docData),
              data: () => (docData ? { ...docData } : undefined),
              id: resolvedId,
            };
          },
          async set(data, options = {}) {
            if (options.merge && self.data.has(path)) {
              self.data.set(path, { ...self.data.get(path), ...data });
            } else {
              self.data.set(path, data);
            }
            self._persist();
            return { writeTime: new Date() };
          },
          async update(data) {
            let targetPath = path;
            if (!self.data.has(targetPath)) {
              const prefix = `${name}/`;
              for (const [key, value] of self.data.entries()) {
                if (key.startsWith(prefix)) {
                  if (
                    value.id === id ||
                    value.depositId === id ||
                    value.withdrawalId === id ||
                    value.ticketId === id ||
                    value.transactionId === id ||
                    value.uid === id
                  ) {
                    targetPath = key;
                    break;
                  }
                }
              }
            }
            const existing = self.data.get(targetPath) || {};
            self.data.set(targetPath, { ...existing, ...data });
            self._persist();
            return { writeTime: new Date() };
          },
          collection(subName) {
            return self.collection(`${path}/${subName}`);
          }
        };
      },
      async add(data) {
        const generatedId = data.id || data.depositId || ('tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        const path = `${name}/${generatedId}`;
        const record = { ...data, id: generatedId, depositId: generatedId, timestamp: new Date().toISOString() };
        self.data.set(path, record);
        self._persist();
        return { id: generatedId, get: async () => ({ exists: true, data: () => ({ ...record }), id: generatedId }) };
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

  const existingApps = getExistingApps();
  if (existingApps && existingApps.length > 0 && isConfigured) {
    try {
      dbInstance = getFirestore(existingApps[0]);
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
