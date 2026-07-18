import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

let app: App | undefined;

const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

if (!getApps().length) {
  try {
    let credential;

    if (svcJson) {
      credential = cert(JSON.parse(svcJson));
    } else if (svcPath) {
      const raw = fs.readFileSync(svcPath, 'utf8');
      credential = cert(JSON.parse(raw));
    }

    if (credential) {
      app = initializeApp({
        credential,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

    }
  } catch (error) {

  }
} else {
  app = getApp();
}

export const adminApp = app;
export const adminAuth = app ? getAuth(app) : undefined;
export const adminDatabase = app ? getDatabase(app) : undefined;
export const adminStorage = app ? getStorage(app) : undefined;

export default app;