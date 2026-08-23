export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

/**
 * Safari and Firefox do not reliably expose a user-selected writable directory.
 * Their fallback receives into browser memory, so keep that mode intentionally capped.
 */
export const BROWSER_ONLY_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const LONGTERM_PUB_DB_PATH = (uid: string) => `users/${uid}/publicKey/jwk`;
