/**
 * IndexedDB helpers for persisting P2P long-term crypto keys.
 * Uses structured-clone to store CryptoKey objects where supported.
 */

const DB_NAME = 'p2p-keys';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

export async function idbGet(uid: string): Promise<any> {
  const db = await openKeyDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const rq = store.get(uid);
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

export async function idbPut(uid: string, value: any): Promise<void> {
  const db = await openKeyDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const rq = store.put(value, uid);
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
}
