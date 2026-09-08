/**
 * TAEMRY FLUX - Standalone Firestore Backup Script (Phase 7)
 * Exports primary collections (users, deposits, withdrawals, auditLogs, supportTickets, systemSettings)
 * to a structured JSON backup. In production, this can also be synced to Google Cloud Storage.
 */

import fs from 'fs';
import path from 'path';
import { getDb, initFirebaseAdmin } from '../firebaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

export async function exportFirestoreBackup() {
  initFirebaseAdmin();
  const db = getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const collectionsToBackup = [
    'users',
    'deposits',
    'withdrawals',
    'supportTickets',
    'auditLogs',
    'systemSettings',
    'notifications',
  ];

  console.log(`[BackupService] Starting automated backup at ${timestamp}...`);
  const backupData = {
    metadata: {
      platform: 'TAEMRY FLUX',
      version: '1.0.0',
      phase: 'Phase 7: Maintenance & Scaling',
      timestamp: new Date().toISOString(),
      collections: collectionsToBackup,
    },
    collections: {},
  };

  for (const collName of collectionsToBackup) {
    try {
      const snap = await db.collection(collName).get();
      backupData.collections[collName] = snap.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));
      console.log(`[BackupService] Exported ${backupData.collections[collName].length} documents from "${collName}".`);
    } catch (err) {
      console.warn(`[BackupService] Warning: Could not read collection ${collName}:`, err.message);
      backupData.collections[collName] = [];
    }
  }

  // Ensure backups directory exists
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const filename = `backup-taemry-${timestamp}.json`;
  const filePath = path.join(backupsDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`[BackupService] Backup successfully created at: ${filePath}`);

  // Enforce 30-day / 30-file retention: delete backups older than 30 days
  try {
    const files = fs.readdirSync(backupsDir);
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('backup-taemry-') && file.endsWith('.json')) {
        const fullPath = path.join(backupsDir, file);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > thirtyDaysMs) {
          fs.unlinkSync(fullPath);
          console.log(`[BackupService] Deleted aged backup file (>30 days): ${file}`);
        }
      }
    }
  } catch (cleanErr) {
    console.warn('[BackupService] Retention pruning warning:', cleanErr.message);
  }

  return {
    filename,
    filePath,
    timestamp: backupData.metadata.timestamp,
    stats: Object.fromEntries(
      Object.entries(backupData.collections).map(([k, v]) => [k, v.length])
    ),
  };
}

// Allow direct CLI execution: node backend/scripts/backupFirestore.js
if (process.argv[1] && process.argv[1].endsWith('backupFirestore.js')) {
  exportFirestoreBackup()
    .then((res) => {
      console.log('[BackupService] CLI run finished:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[BackupService] CLI run failed:', err);
      process.exit(1);
    });
}
