import { ref, set, get, Database } from 'firebase/database';
import { idbGet, idbPut } from './_idb';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  importEphemeralPublicRaw,
} from './_crypto';
import { LONGTERM_PUB_DB_PATH } from './_constants';

export interface UserAuthLike {
  uid: string;
  displayName?: string | null;
}

/**
 * Ensures or generates a long-term ECDSA P-256 signing keypair stored in IndexedDB.
 * The public key JWK is published to Firebase RTDB so other peers can verify signatures.
 */
export async function generateOrEnsureLongtermKey(
  user: UserAuthLike | null,
  database: Database | null
): Promise<CryptoKey | null> {
  if (!user || !database) return null;

  try {
    const existing = await idbGet(user.uid);
    if (existing && existing.privKey) {
      return existing.privKey as CryptoKey;
    }
  } catch {
    // proceed to generate
  }

  const kp = (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
  const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);

  const privKeyNonExportable = await crypto.subtle.importKey(
    'jwk',
    privJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  try {
    await idbPut(user.uid, { privKey: privKeyNonExportable, pubJwk });
  } catch {
    try {
      await idbPut(user.uid, { privKey: null, pubJwk, volatilePrivJwk: privJwk });
    } catch {
      // ignore
    }
  }

  try {
    const dbRef = ref(database, LONGTERM_PUB_DB_PATH(user.uid));
    await set(dbRef, pubJwk);
  } catch {
    // ignore write errors
  }

  return privKeyNonExportable;
}

export async function getLongtermPrivateKey(
  user: UserAuthLike | null,
  database: Database | null
): Promise<CryptoKey | null> {
  if (!user || !database) return null;
  try {
    const rec = await idbGet(user.uid);
    if (rec) {
      if (rec.privKey) return rec.privKey as CryptoKey;
      if (rec.volatilePrivJwk) {
        try {
          const priv = await crypto.subtle.importKey(
            'jwk',
            rec.volatilePrivJwk,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['sign']
          );
          try {
            await idbPut(user.uid, { privKey: priv, pubJwk: rec.pubJwk });
          } catch {}
          return priv;
        } catch {
          // generate new on fail
        }
      }
    }
  } catch {
    // ignore
  }
  return await generateOrEnsureLongtermKey(user, database);
}

export async function signBytesWithLongterm(
  user: UserAuthLike | null,
  database: Database | null,
  data: ArrayBuffer
): Promise<string> {
  const priv = await getLongtermPrivateKey(user, database);
  if (!priv) throw new Error('No long-term key');
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, data);
  return arrayBufferToBase64(sig);
}

export async function exportEphemeralPublicRaw(pub: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', pub);
  return arrayBufferToBase64(raw);
}

export async function deriveSessionKey(
  ownPriv: CryptoKey,
  otherPubB64: string,
  saltB64: string
): Promise<CryptoKey> {
  const otherPub = await importEphemeralPublicRaw(otherPubB64);
  const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
  const derived = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherPub },
    ownPriv,
    { name: 'HKDF', hash: 'SHA-256', salt: salt.buffer, info: new Uint8Array([]) },
    false,
    ['encrypt', 'decrypt']
  );
  return derived as CryptoKey;
}

export async function verifyEphemeralSignature(
  database: Database | null,
  peerUid: string,
  pubB64: string,
  sigB64: string
): Promise<boolean> {
  if (!database) return false;
  try {
    const pubRef = ref(database, LONGTERM_PUB_DB_PATH(peerUid));
    const snap = await get(pubRef);
    const pubJwk = snap.val();
    if (!pubJwk) return false;
    const pubKey = await crypto.subtle.importKey(
      'jwk',
      pubJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
    const sig = base64ToArrayBuffer(sigB64);
    const data = base64ToArrayBuffer(pubB64);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pubKey,
      sig,
      data
    );
    return !!ok;
  } catch {
    return false;
  }
}

/**
 * Registers the current user in signaling/<sessionId>/peers/<uid> so RTDB security
 * rules permit subsequent session reads/writes.
 */
export async function ensurePeerRegistered(
  user: UserAuthLike | null,
  database: Database | null,
  sessionId: string
): Promise<void> {
  if (!database || !user) return;
  const peerRef = ref(database, `signaling/${sessionId}/peers/${user.uid}`);
  await set(peerRef, true);
  const metaRef = ref(database, `signaling/${sessionId}/meta/lastSeen/${user.uid}`);
  await set(metaRef, Date.now());
}

export async function drainCandidateQueue(
  candidateQueue: Record<string, RTCIceCandidateInit[]>,
  sessionId: string,
  pc: RTCPeerConnection
): Promise<void> {
  const queue = candidateQueue[sessionId];
  if (!queue || !pc) return;
  for (const candInit of queue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candInit));
    } catch {}
  }
  delete candidateQueue[sessionId];
}

export async function queueOrAddCandidate(
  candidateQueue: Record<string, RTCIceCandidateInit[]>,
  sessionId: string,
  pc: RTCPeerConnection,
  candInit: RTCIceCandidateInit
): Promise<void> {
  try {
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(new RTCIceCandidate(candInit));
    } else {
      candidateQueue[sessionId] = candidateQueue[sessionId] || [];
      candidateQueue[sessionId].push(candInit);
    }
  } catch {
    candidateQueue[sessionId] = candidateQueue[sessionId] || [];
    candidateQueue[sessionId].push(candInit);
  }
}
