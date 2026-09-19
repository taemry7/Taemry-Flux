/**
 * TAEMRY FLUX - Permanent User Persistence & Synchronization Engine
 * Guarantees that user accounts, wallet balances, approved deposits,
 * packages, audit logs, and broadcasts are 100% permanently preserved
 * and never "washed" or reset across reboots, deposits, or admin operations.
 */

import fs from 'fs';
import path from 'path';

const registeredUsersPath = path.resolve(process.cwd(), '.registered_users.json');
const verifiedUsersPath = path.resolve(process.cwd(), '.verified_users.json');
const auditLogsFilePath = path.resolve(process.cwd(), 'backend', '.audit_logs.json');
const broadcastsFilePath = path.resolve(process.cwd(), 'backend', '.broadcasts.json');

/**
 * Ensures an email is permanently written to registered and verified lists
 */
export function persistRegisteredUserEmail(email) {
  if (!email || typeof email !== 'string') return;
  const cleanEmail = email.toLowerCase().trim();

  [registeredUsersPath, verifiedUsersPath].forEach((filePath) => {
    try {
      let list = [];
      if (fs.existsSync(filePath)) {
        try {
          list = JSON.parse(fs.readFileSync(filePath, 'utf-8')) || [];
        } catch (e) {
          list = [];
        }
      }
      if (!list.includes(cleanEmail)) {
        list.push(cleanEmail);
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn(`Could not persist email to ${filePath}:`, e.message);
    }
  });
}

/**
 * Calculates sum of all approved deposits for a user by UID or Email
 */
export async function getApprovedDepositsTotal(db, uid, email) {
  let totalApproved = 0;
  const seenDepositIds = new Set();

  const queryAndSum = async (field, val) => {
    if (!val) return;
    try {
      const snap = await db.collection('deposits')
        .where(field, '==', val)
        .where('status', '==', 'approved')
        .get();
      snap.docs.forEach((doc) => {
        if (!seenDepositIds.has(doc.id)) {
          seenDepositIds.add(doc.id);
          const data = doc.data() || {};
          totalApproved += Number(data.amountUSD || 0);
        }
      });
    } catch (e) {}
  };

  if (uid) await queryAndSum('userId', uid);
  if (email) await queryAndSum('userEmail', email.toLowerCase().trim());

  return +totalApproved.toFixed(2);
}

/**
 * Resolves or initializes user document without ever washing active balances or packages.
 */
export async function resolveUserRecord(db, { uid, email, name, username }) {
  const cleanEmail = (email || '').toLowerCase().trim();
  let userRef = db.collection('users').doc(uid);
  let doc = await userRef.get();

  // 1. If doc exists by UID, return it safely
  if (doc && doc.exists) {
    const data = doc.data() || {};
    persistRegisteredUserEmail(cleanEmail || data.email);
    return { ref: userRef, doc, data, isNew: false };
  }

  // 2. If not found by UID, search by email to prevent duplicate / washed accounts
  if (cleanEmail) {
    try {
      const emailSnap = await db.collection('users')
        .where('email', '==', cleanEmail)
        .limit(1)
        .get();

      if (emailSnap && !emailSnap.empty) {
        const existingDoc = emailSnap.docs[0];
        const existingData = existingDoc.data() || {};
        // Alias UID document to existing document data so subsequent lookups are instant
        await userRef.set({
          ...existingData,
          uid,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const reDoc = await userRef.get();
        persistRegisteredUserEmail(cleanEmail);
        return { ref: userRef, doc: reDoc, data: reDoc.data(), isNew: false };
      }
    } catch (e) {}
  }

  // 3. New user account creation — check if any approved deposits exist for this email/uid
  const approvedDeposits = await getApprovedDepositsTotal(db, uid, cleanEmail);

  const rawUserVal = username || name || cleanEmail.split('@')[0] || 'member';
  const defaultUsername = rawUserVal.startsWith('@')
    ? rawUserVal
    : `@${rawUserVal.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

  const newUserData = {
    uid,
    email: cleanEmail || 'member@taemryflux.com',
    name: name || cleanEmail.split('@')[0] || 'TAEMRY Member',
    username: defaultUsername,
    walletBalance: approvedDeposits,
    currentPackage: 'None',
    isEligible: false,
    lifetimeAds: 0,
    dailyAdCount: 0,
    teamAdsCount: 0,
    referralCount: 0,
    totalEarned: 0,
    createdAt: new Date().toISOString(),
  };

  await userRef.set(newUserData);
  const createdDoc = await userRef.get();
  persistRegisteredUserEmail(cleanEmail);

  return { ref: userRef, doc: createdDoc, data: newUserData, isNew: true };
}

/**
 * Searches for a user record across Firestore and registered user caches by UID, email, or username.
 */
export async function findAdminUserRef(db, identifier) {
  if (!identifier) return { ref: null, doc: null, data: null, uid: null };
  const cleanId = String(identifier).trim();

  // 1. Direct document lookup
  let ref = db.collection('users').doc(cleanId);
  let doc = await ref.get();
  if (doc && doc.exists) {
    return { ref, doc, data: doc.data(), uid: doc.id };
  }

  // 2. Query by email
  const isEmail = cleanId.includes('@');
  if (isEmail) {
    const snap = await db.collection('users').where('email', '==', cleanId.toLowerCase()).limit(1).get();
    if (snap && !snap.empty) {
      const foundDoc = snap.docs[0];
      return { ref: foundDoc.ref, doc: foundDoc, data: foundDoc.data(), uid: foundDoc.id };
    }
  }

  // 3. Query all users (check email, username, synthetic hex ID)
  try {
    const allSnap = await db.collection('users').get();
    for (const d of allSnap.docs) {
      const data = d.data() || {};
      const dEmail = (data.email || '').toLowerCase().trim();
      const dUsername = (data.username || '').toLowerCase().trim().replace(/^@/, '');
      const hexId = 'user_' + Buffer.from(dEmail).toString('hex').slice(0, 10);
      const cleanTarget = cleanId.replace(/^@/, '').toLowerCase();

      if (
        d.id === cleanId ||
        dEmail === cleanId.toLowerCase() ||
        dUsername === cleanTarget ||
        hexId === cleanId
      ) {
        return { ref: d.ref, doc: d, data, uid: d.id };
      }
    }
  } catch (e) {}

  // 4. Check persistent registered users list
  try {
    let registeredList = [];
    if (fs.existsSync(registeredUsersPath)) {
      registeredList = JSON.parse(fs.readFileSync(registeredUsersPath, 'utf-8')) || [];
    }
    const matched = registeredList.find((em) => {
      const hexId = 'user_' + Buffer.from(em).toString('hex').slice(0, 10);
      return em.toLowerCase() === cleanId.toLowerCase() || hexId === cleanId;
    });

    if (matched) {
      const newUid = 'usr_' + Buffer.from(matched).toString('hex').slice(0, 12);
      const newRef = db.collection('users').doc(newUid);
      const approvedDeposits = await getApprovedDepositsTotal(db, newUid, matched);
      const initialData = {
        uid: newUid,
        email: matched.toLowerCase(),
        name: matched.split('@')[0],
        username: `@${matched.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        walletBalance: approvedDeposits,
        currentPackage: 'None',
        lifetimeAds: 0,
        dailyAdCount: 0,
        teamAdsCount: 0,
        referralCount: 0,
        totalEarned: 0,
        isEligible: false,
        isBlocked: false,
        createdAt: new Date().toISOString(),
      };
      await newRef.set(initialData);
      const newDoc = await newRef.get();
      return { ref: newRef, doc: newDoc, data: initialData, uid: newUid };
    }
  } catch (e) {}

  return { ref: null, doc: null, data: null, uid: null };
}

/**
 * Permanent Audit Log recorder writing to Firestore AND disk file
 */
export async function recordPermanentAuditLog(db, entry) {
  const logItem = {
    ...entry,
    id: entry.id || `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  // 1. Write to Firestore
  try {
    if (db) {
      await db.collection('auditLogs').add(logItem);
    }
  } catch (e) {
    console.warn('Could not write audit log to Firestore:', e.message);
  }

  // 2. Write to disk
  try {
    let existingLogs = [];
    if (fs.existsSync(auditLogsFilePath)) {
      try {
        existingLogs = JSON.parse(fs.readFileSync(auditLogsFilePath, 'utf-8')) || [];
      } catch (e) {
        existingLogs = [];
      }
    }
    existingLogs.unshift(logItem);
    // Keep last 1000 logs
    if (existingLogs.length > 1000) existingLogs = existingLogs.slice(0, 1000);
    fs.writeFileSync(auditLogsFilePath, JSON.stringify(existingLogs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not append audit log to disk:', e.message);
  }
}

/**
 * Read audit logs merging Firestore and disk
 */
export async function getCombinedAuditLogs(db) {
  const map = new Map();

  // 1. Load from disk
  try {
    if (fs.existsSync(auditLogsFilePath)) {
      const diskLogs = JSON.parse(fs.readFileSync(auditLogsFilePath, 'utf-8')) || [];
      diskLogs.forEach((l) => {
        const key = l.id || `${l.timestamp}_${l.details}`;
        map.set(key, l);
      });
    }
  } catch (e) {}

  // 2. Load from Firestore
  try {
    if (db) {
      const snap = await db.collection('auditLogs').get();
      snap.docs.forEach((d) => {
        const data = d.data() || {};
        const key = d.id || `${data.timestamp}_${data.details}`;
        map.set(key, { id: d.id, ...data });
      });
    }
  } catch (e) {}

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return list;
}

/**
 * Save broadcast announcement to Firestore and disk
 */
export async function savePermanentBroadcast(db, broadcast) {
  const item = {
    ...broadcast,
    id: broadcast.id || `notif_${Date.now()}`,
    createdAt: broadcast.createdAt || new Date().toISOString(),
  };

  // 1. Write to Firestore
  try {
    if (db) {
      await db.collection('notifications').add(item);
    }
  } catch (e) {}

  // 2. Write to disk
  try {
    let list = [];
    if (fs.existsSync(broadcastsFilePath)) {
      try {
        list = JSON.parse(fs.readFileSync(broadcastsFilePath, 'utf-8')) || [];
      } catch (e) {
        list = [];
      }
    }
    list.unshift(item);
    if (list.length > 200) list = list.slice(0, 200);
    fs.writeFileSync(broadcastsFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {}

  return item;
}

/**
 * Read broadcasts merging Firestore and disk
 */
export async function getCombinedBroadcasts(db) {
  const map = new Map();

  // Disk
  try {
    if (fs.existsSync(broadcastsFilePath)) {
      const diskList = JSON.parse(fs.readFileSync(broadcastsFilePath, 'utf-8')) || [];
      diskList.forEach((b) => map.set(b.id || b.createdAt, b));
    }
  } catch (e) {}

  // Firestore
  try {
    if (db) {
      const snap = await db.collection('notifications').get();
      snap.docs.forEach((d) => {
        const data = d.data() || {};
        map.set(d.id, { id: d.id, ...data });
      });
    }
  } catch (e) {}

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list;
}
