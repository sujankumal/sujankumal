/**
 * Pure Web Crypto utility functions used by the P2P E2EE layer.
 * These have no React dependencies and can be tested independently.
 */

// ── Binary / Base64 encoding ──────────────────────────────────────────────────

/**
 * Converts an ArrayBuffer to a base64 string without overflowing the call
 * stack (uses 32 KB chunks for very large buffers).
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, len))));
  }
  return btoa(binary);
}

/** Converts a base64 string back to an ArrayBuffer. */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Key import helpers ────────────────────────────────────────────────────────

/**
 * Imports a raw ECDH P-256 public key from a base64 string.
 * Used when deriving a shared session key from a peer's ephemeral public key.
 */
export async function importEphemeralPublicRaw(b64: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

// ── Hashing ───────────────────────────────────────────────────────────────────

/** Returns a lowercase hex SHA-256 digest of the given buffer. */
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
