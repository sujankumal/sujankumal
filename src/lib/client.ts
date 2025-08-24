import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Minimal config for client-side (can be empty or use public info)
const firebaseConfig = {
  // Only include non-sensitive fields if necessary
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Other fields can be omitted or fetched dynamically via API
};

// Initialize Firebase app on the client
let app: FirebaseApp;
if (getApps().length === 0 && typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth = getAuth(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');

// Initialize Analytics only on client side
let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export analytics
export { analytics };

// Helper function to safely use analytics
export const getAnalyticsInstance = () => {
  if (typeof window !== 'undefined' && analytics) {
    return analytics;
  }
  return null;
};

export default app;