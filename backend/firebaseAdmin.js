/**
 * TAEMRY FLUX - Firebase Admin SDK Initialization
 * Connects to Firebase Firestore and Auth using service account credentials.
 */

import * as firebaseAdminModule from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const admin = firebaseAdminModule.default || firebaseAdminModule;

let dbInstance = null;
let isConfigured = false;

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
  if (admin && admin.apps && admin.apps.length > 0) {
    return admin.app();
  }

  // 1. Try loading from serviceAccountKey.json file if present
  const fileCredentials = findServiceAccountFile();
  if (fileCredentials && admin && admin.credential) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(fileCredentials),
      });
      isConfigured = true;
      console.log('Firebase Admin SDK initialized successfully from serviceAccountKey.json.');
      return admin.app();
    } catch (error) {
      console.warn('Firebase Admin file credential error:', error.message);
    }
  }

  // 2. Try raw JSON string in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT && admin && admin.credential) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      isConfigured = true;
      console.log('Firebase Admin SDK initialized successfully from FIREBASE_SERVICE_ACCOUNT env.');
      return admin.app();
    } catch (error) {
      console.warn('Firebase Admin JSON string credential error:', error.message);
    }
  }

  // 3. Try individual environment variables with project defaults
  const projectId = process.env.FIREBASE_PROJECT_ID || 'taemry-flux';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@taemry-flux.iam.gserviceaccount.com';
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

    // Seed realistic users
    this.data.set('users/admin_taemry', {
      uid: 'admin_taemry',
      email: 'mistrtaemry@gmail.com',
      name: 'Mistr Taemry (Admin)',
      currentPackage: 'Apex',
      walletBalance: 2500.00,
      referralCount: 42,
      isEligible: true,
      isBlocked: false,
      dailyAdCount: 0,
      lifetimeAds: 12000,
      role: 'admin',
      admin: true,
      isAdmin: true,
      createdAt: '2026-08-01T10:00:00.000Z',
    });
    this.data.set('users/demo-user-1', {
      uid: 'demo-user-1',
      email: 'member@taemryflux.com',
      name: 'TAEMRY Member',
      currentPackage: 'Gold',
      walletBalance: 45.50,
      referralCount: 3,
      isEligible: true,
      isBlocked: false,
      dailyAdCount: 8,
      lifetimeAds: 1200,
      createdAt: '2026-08-15T10:00:00.000Z',
    });
    this.data.set('users/user_tariq', {
      uid: 'user_tariq',
      email: 'tariq.khan@gmail.com',
      name: 'Tariq Khan',
      currentPackage: 'Elite',
      walletBalance: 128.00,
      referralCount: 7,
      isEligible: true,
      isBlocked: false,
      dailyAdCount: 22,
      lifetimeAds: 3450,
      createdAt: '2026-08-20T14:30:00.000Z',
    });
    this.data.set('users/user_sara', {
      uid: 'user_sara',
      email: 'sara.ahmed@yahoo.com',
      name: 'Sara Ahmed',
      currentPackage: 'Silver',
      walletBalance: 14.20,
      referralCount: 2,
      isEligible: true,
      isBlocked: false,
      dailyAdCount: 15,
      lifetimeAds: 890,
      createdAt: '2026-08-28T09:15:00.000Z',
    });
    this.data.set('users/user_bilal', {
      uid: 'user_bilal',
      email: 'bilal.malik@outlook.com',
      name: 'Bilal Malik',
      currentPackage: 'Master',
      walletBalance: 612.50,
      referralCount: 14,
      isEligible: true,
      isBlocked: false,
      dailyAdCount: 45,
      lifetimeAds: 6800,
      createdAt: '2026-09-01T11:45:00.000Z',
    });
    this.data.set('users/user_hamza', {
      uid: 'user_hamza',
      email: 'hamza.dev@gmail.com',
      name: 'Hamza Dev',
      currentPackage: 'Bronze',
      walletBalance: 2.10,
      referralCount: 0,
      isEligible: true,
      isBlocked: true,
      dailyAdCount: 0,
      lifetimeAds: 40,
      createdAt: '2026-09-02T16:20:00.000Z',
    });

    // Seed realistic deposits
    this.data.set('deposits/dep_1001', {
      depositId: 'dep_1001',
      id: 'dep_1001',
      userId: 'demo-user-1',
      userEmail: 'member@taemryflux.com',
      method: 'jazzcash',
      amountUSD: 10,
      amountPKR: 3000,
      screenshotURL: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });
    this.data.set('deposits/dep_1002', {
      depositId: 'dep_1002',
      id: 'dep_1002',
      userId: 'user_tariq',
      userEmail: 'tariq.khan@gmail.com',
      method: 'bank_transfer',
      amountUSD: 100,
      amountPKR: 30000,
      screenshotURL: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    });
    this.data.set('deposits/dep_1003', {
      depositId: 'dep_1003',
      id: 'dep_1003',
      userId: 'user_sara',
      userEmail: 'sara.ahmed@yahoo.com',
      method: 'easypaisa',
      amountUSD: 5,
      amountPKR: 1500,
      screenshotURL: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });

    // Seed realistic withdrawals
    this.data.set('withdrawals/wd_2001', {
      withdrawalId: 'wd_2001',
      id: 'wd_2001',
      userId: 'demo-user-1',
      userEmail: 'member@taemryflux.com',
      method: 'easypaisa',
      accountName: 'TAEMRY Member',
      accountNumber: '03451122334',
      amountUSD: 20,
      amountPKR: 6000,
      status: 'pending',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    });
    this.data.set('withdrawals/wd_2002', {
      withdrawalId: 'wd_2002',
      id: 'wd_2002',
      userId: 'user_bilal',
      userEmail: 'bilal.malik@outlook.com',
      method: 'bank_transfer',
      accountName: 'Bilal Malik',
      accountNumber: 'PK44BAHL0001234567890123',
      amountUSD: 150,
      amountPKR: 45000,
      status: 'pending',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    });
    this.data.set('withdrawals/wd_2003', {
      withdrawalId: 'wd_2003',
      id: 'wd_2003',
      userId: 'user_tariq',
      userEmail: 'tariq.khan@gmail.com',
      method: 'crypto_usdt',
      accountName: 'Tariq Crypto',
      accountNumber: '0x33445566778899aabbccddeeff00112233445566',
      amountUSD: 50,
      amountPKR: 15000,
      status: 'paid',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    });

    // Seed audit logs
    this.data.set('auditLogs/log_1', {
      id: 'log_1',
      adminEmail: 'mistrtaemry@gmail.com',
      action: 'approved_deposit',
      targetUid: 'user_sara',
      targetEmail: 'sara.ahmed@yahoo.com',
      amountUSD: 5,
      details: 'Approved $5 deposit for Sara Ahmed',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    });
    this.data.set('auditLogs/log_2', {
      id: 'log_2',
      adminEmail: 'mistrtaemry@gmail.com',
      action: 'block_user',
      targetUid: 'user_hamza',
      targetEmail: 'hamza.dev@gmail.com',
      amountUSD: null,
      details: 'User flagged for multi-account abuse',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
    });

    // Seed support tickets (Phase 7)
    this.data.set('supportTickets/TKT-88A01', {
      ticketId: 'TKT-88A01',
      userId: 'demo-user-1',
      userEmail: 'member@taemryflux.com',
      subject: 'Inquiry regarding JazzCash deposit verification timeframe',
      message: 'Hello support team, I submitted a 10 USD deposit via JazzCash an hour ago. How long does verification usually take?',
      priority: 'normal',
      status: 'open',
      adminReply: null,
      repliedAt: null,
      repliedBy: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    });
    this.data.set('supportTickets/TKT-88A02', {
      ticketId: 'TKT-88A02',
      userId: 'user_tariq',
      userEmail: 'tariq.khan@gmail.com',
      subject: 'Assistance with Level 2 referral commission rate',
      message: 'Could you please confirm the exact percentage received for direct downline watching daily ads on Elite package?',
      priority: 'low',
      status: 'resolved',
      adminReply: 'Hi Tariq, direct Level 1 referrals award 50% commission on all ads viewed by your downline. Level 2 through Level 5 receive respective tiered team bonuses. Thank you!',
      repliedAt: new Date(Date.now() - 7200000).toISOString(),
      repliedBy: 'mistrtaemry@gmail.com',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    });

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
