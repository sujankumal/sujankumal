import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose a minimal, safe subset needed to initialize the client SDK.
  // This lets the app avoid bundling sensitive server env vars at build time.
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || null,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    databaseURL: process.env.FIREBASE_DATABASE_URL || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
    appId: process.env.FIREBASE_APP_ID || null,
  };

  return NextResponse.json(config);
}
