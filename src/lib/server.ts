import admin from 'firebase-admin';

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
    // require the file path (server only)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const obj = require(svcPath);
    credential = admin.credential.cert(obj);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load FIREBASE_SERVICE_ACCOUNT_PATH', e);
  }
}

if (!credential) {
  throw new Error('Firebase service account not provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

export const adminAuth = admin.auth();
export const adminDatabase = admin.database();
export const adminStorage = admin.storage();
export default admin;