import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK using either a service account JSON blob
// or a path to a service account JSON file. Accepts either:
// - FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
// - FIREBASE_SERVICE_ACCOUNT_PATH (filesystem path)
// Ensure these are set in your deployment (never expose service account to clients).

let credential: admin.credential.Credential | undefined;
const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (svcJson) {
  try {
    const parsed = JSON.parse(svcJson);
    credential = admin.credential.cert(parsed as any);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
  }
}

if (!credential && svcPath) {
  try {
    // Read the service account JSON file from disk (server-only). Use fs to avoid
    // relying on require, which may be disallowed by some ESLint configs.
    const raw = fs.readFileSync(svcPath!, 'utf8');
    const obj = JSON.parse(raw);
    credential = admin.credential.cert(obj as any);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load FIREBASE_SERVICE_ACCOUNT_PATH', e);
  }
}

if (!credential) {
  // Do not throw at import time; allow server code to import this module in
  // environments where the service account is not available (local builds,
  // readonly linting, etc.). Consumers should check for the presence of the
  // exported admin* variables before using them.
  // eslint-disable-next-line no-console
  console.warn('Firebase service account not provided; Admin SDK not initialized.');
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
    });
  }
}

export const adminAuth: admin.auth.Auth | undefined = admin.apps.length ? admin.auth() : undefined;
export const adminDatabase: admin.database.Database | undefined = admin.apps.length ? admin.database() : undefined;
export const adminStorage: admin.storage.Storage | undefined = admin.apps.length ? admin.storage() : undefined;
export default admin;