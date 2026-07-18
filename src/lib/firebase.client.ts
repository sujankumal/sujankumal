import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Build a client config from NEXT_PUBLIC_* env vars. Do NOT initialize
// Firebase on the client unless a PUBLIC API key is present. This prevents
// the Firebase SDK from throwing `auth/invalid-api-key` when the key is
// not provided to the browser.
const publicApiKey = process.env.FIREBASE_API_KEY;
const publicAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: publicApiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  appId: publicAppId,
};

// Module-level instances (may be null until initialization completes)
let app: FirebaseApp | undefined;
let auth: ReturnType<typeof getAuth> | null = null;
let database: ReturnType<typeof getDatabase> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let analytics: Analytics | null = null;

// Auth providers (safe to create even on server)
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
try { googleProvider.addScope('profile'); googleProvider.addScope('email'); githubProvider.addScope('user:email'); } catch (e) { }

// Internal initializer used from ensureClientInitialized
async function initAppFromConfig(config: any) {
  if (typeof window === 'undefined') return;
  if (!config || !config.apiKey) {
    // nothing to do
    return;
  }

  const cfg = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    databaseURL: config.databaseURL,
    storageBucket: config.storageBucket,
    appId: config.appId,
  };

  try {
    if (getApps().length === 0) {
      app = initializeApp(cfg as any);
    } else {
      app = getApps()[0];
    }

    try { auth = getAuth(app); } catch (e) { auth = null; }
    try { database = getDatabase(app); } catch (e) { database = null; }
    try { storage = getStorage(app); } catch (e) { storage = null; }
    try { analytics = getAnalytics(app); } catch (e) { analytics = null; }
  } catch (e) {
    // initialization failed; keep instances null and warn
  }
}

let initializingPromise: Promise<void> | null = null;

/**
 * Ensure client Firebase is initialized. If NEXT_PUBLIC_FIREBASE_API_KEY
 * is present at build-time we initialize immediately. Otherwise we fetch
 * runtime config from /api/firebase/config and initialize from that.
 */
export async function ensureClientInitialized() {
  if (typeof window === 'undefined') return;
  if (app) return;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    // First, try build-time public key
    if (publicApiKey) {
      await initAppFromConfig(firebaseConfig as any);
      return;
    }

    // Otherwise fetch runtime config from server route (does not embed in bundle)
    try {
      const resp = await fetch('/api/firebase/config');
      if (!resp.ok) return;
      const cfg = await resp.json();
      await initAppFromConfig(cfg);
    } catch (e) {
      // ignore - client will operate without Firebase
    }
  })();

  return initializingPromise;
}

export { auth, database, storage, analytics };

export const getAnalyticsInstance = () => analytics;

export default app;
