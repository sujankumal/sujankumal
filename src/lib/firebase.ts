// Server-side (default) export: use server initialization in `server.ts`.
// Client-only APIs live in `firebase.client.ts` and must be imported from client code.

// Re-export the Admin SDK default and named helpers from server.ts. server.ts
// exposes `admin` as default and `adminAuth`, `adminDatabase`, `adminStorage`.
// Provide compatibility aliases (`auth`, `database`, `storage`) so existing
// imports continue to work.
export { default } from './server';
export { adminAuth as auth, adminDatabase as database, adminStorage as storage } from './server';

