 "use client";

 import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { ref, set, push, update, onValue, get, remove } from 'firebase/database';
import { ensureClientInitialized, database } from '@/lib/firebase.client';
import { useAuth } from '@/contexts/AuthContext';

 export interface FileTransfer {
   id: string;
   fileName: string;
   fileSize: number;
   fileType: string;
   progress: number;
   status: 'pending' | 'transferring' | 'completed' | 'failed';
   senderId: string;
   senderName: string;
   receiverId: string;
   receiverName: string;
   timestamp: number;
   direction: 'sending' | 'receiving';
   speed?: number; // bytes per second
   eta?: number; // estimated time remaining in seconds
 }

export interface PeerUser {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  online: boolean;
  lastSeen: number;
  available: boolean;
}

export interface ShareRequest {
  id: string;
  requestId: string; // WebRTC connection ID
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

interface P2PContextType {
  availableUsers: PeerUser[];
  fileTransfers: FileTransfer[];
  shareRequests: ShareRequest[];
  isAvailable: boolean;
  availabilityLoaded: boolean;
  setAvailable: (available: boolean) => void;
  sendShareRequest: (toUserId: string, files: File[], requestId: string, message?: string) => Promise<void>;
  acceptShareRequest: (requestId: string) => Promise<void>;
  rejectShareRequest: (requestId: string) => Promise<void>;
  startFileTransfer: (requestId: string, files: File[]) => Promise<void>;
  peerConnection: RTCPeerConnection | null;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

export function useP2P() {
  const context = useContext(P2PContext);
  if (context === undefined) {
    throw new Error('useP2P must be used within a P2PProvider');
  }
  return context;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface P2PProviderProps {
  children: React.ReactNode;
}

const LONGTERM_PUB_DB_PATH = (uid: string) => `users/${uid}/publicKey/jwk`;

// Simple IndexedDB helper for storing CryptoKey (uses structured clone to store CryptoKey objects when supported)
const openKeyDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const rq = indexedDB.open('p2p-keys', 1);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys');
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
};

const idbGet = async (uid: string) => {
  const db = await openKeyDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const store = tx.objectStore('keys');
    const rq = store.get(uid);
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
};

const idbPut = async (uid: string, value: any) => {
  const db = await openKeyDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    const rq = store.put(value, uid);
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let binary = '';
  const chunk = 0x8000; // convert in chunks to avoid call stack issues
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, len))));
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (b64: string) => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importEphemeralPublicRaw = async (b64: string) => {
  const raw = base64ToArrayBuffer(b64);
  return await crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
};

// sha256 hex digest helper
const sha256Hex = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex;
};

export function P2PProvider({ children }: P2PProviderProps) {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<PeerUser[]>([]);
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  // E2EE session ephemeral storage
  const e2eeEphemeralRef = React.useRef<Record<string, { priv?: CryptoKey, pubRaw?: string, salt?: string }>>({});
  const e2eeKeysRef = React.useRef<Record<string, CryptoKey>>({});
  // Candidate queue for sessions: store remote ICE candidates that arrive before
  // remoteDescription is set on the RTCPeerConnection. Keyed by session/requestId.
  const candidateQueueRef = React.useRef<Record<string, RTCIceCandidateInit[]>>({});

  // Try to initialize client firebase at runtime (if server-side provided config exists)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureClientInitialized().catch(() => { });
  }, []);

  // E2EE helpers: generate long-term signing key (ECDSA P-256) stored locally.
  // Generate and persist a non-exportable private key stored in IndexedDB using structured clone.
  const generateOrEnsureLongtermKey = useCallback(async () => {
    if (!user || !database) return null;

    try {
      const existing = await idbGet(user.uid);
      if (existing && existing.privKey) {
        return existing.privKey as CryptoKey;
      }
    } catch (e) {
      // ignore and proceed to generate
    }

    // Generate extractable keys first, so we can export public JWK and then re-import private as non-exportable
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
    const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);

    // Import private key as non-exportable
    const privKeyNonExportable = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

    // Persist into IndexedDB using structured cloning of the CryptoKey object when supported
    try {
      await idbPut(user.uid, { privKey: privKeyNonExportable, pubJwk });
    } catch (e) {
      // If IndexedDB can't store CryptoKey (older browsers), fall back to storing public JWK only and keep private key in-memory (volatile)
      try {
        await idbPut(user.uid, { privKey: null, pubJwk, volatilePrivJwk: privJwk });
      } catch (e2) {
        // ignore
      }
    }

    // publish public key to DB (so others can verify ephemeral signatures)
    try {
      const dbRef = ref(database, LONGTERM_PUB_DB_PATH(user.uid));
      await set(dbRef, pubJwk);
    } catch (e) {
      // ignore write errors
    }

    return privKeyNonExportable;
  }, [user]);

  const getLongtermPrivateKey = useCallback(async (): Promise<CryptoKey | null> => {
    if (!user || !database) return null;
    try {
      const rec = await idbGet(user.uid);
      if (rec) {
        if (rec.privKey) return rec.privKey as CryptoKey;
        // fallback: if private JWK was stored as volatile, import it as non-exportable and persist
        if (rec.volatilePrivJwk) {
          try {
            const priv = await crypto.subtle.importKey('jwk', rec.volatilePrivJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
            try { await idbPut(user.uid, { privKey: priv, pubJwk: rec.pubJwk }); } catch (e) { }
            return priv;
          } catch (e) {
            // failed to import, generate new
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return await generateOrEnsureLongtermKey();
  }, [generateOrEnsureLongtermKey, user]);

  const signBytesWithLongterm = useCallback(async (data: ArrayBuffer) => {
    const priv = await getLongtermPrivateKey();
    if (!priv) throw new Error('No long-term key');
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, data);
    return arrayBufferToBase64(sig);
  }, [getLongtermPrivateKey]);

  const exportEphemeralPublicRaw = useCallback(async (pub: CryptoKey) => {
    const raw = await crypto.subtle.exportKey('raw', pub);
    return arrayBufferToBase64(raw);
  }, []);

  const deriveSessionKey = useCallback(async (ownPriv: CryptoKey, otherPubB64: string, saltB64: string) => {
    const otherPub = await importEphemeralPublicRaw(otherPubB64);
    const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
    // Derive AES-GCM 256 via ECDH -> HKDF
    const derived = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: otherPub },
      ownPriv,
      { name: 'HKDF', hash: 'SHA-256', salt: salt.buffer, info: new Uint8Array([]) },
      false,
      ['encrypt', 'decrypt']
    );
    return derived as CryptoKey;
  }, []);

  // Verify ephemeral pub signature using peer's long-term public JWK from DB
  const verifyEphemeralSignature = useCallback(async (peerUid: string, pubB64: string, sigB64: string) => {
    if (!database) return false;
    try {
      const pubRef = ref(database, LONGTERM_PUB_DB_PATH(peerUid));
      const snap = await get(pubRef);
      const pubJwk = snap.val();
      if (!pubJwk) return false;
      const pubKey = await crypto.subtle.importKey('jwk', pubJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
      const sig = base64ToArrayBuffer(sigB64);
      const data = base64ToArrayBuffer(pubB64);
      const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, sig, data);
      return !!ok;
    } catch (e) {
      return false;
    }
  }, []);

  // Ensure the current user is registered under signaling/<sessionId>/peers/<uid>
  // This must be performed as a separate write because our rules allow the peer
  // to write that specific path even when the top-level session node does not
  // yet exist. Many operations (offer/answer) should call this first and await it.
  const ensurePeerRegistered = useCallback(async (sessionId: string) => {
    if (!database || !user) return;
    const peerRef = ref(database, `signaling/${sessionId}/peers/${user.uid}`);
    try {
      await set(peerRef, true);
      const metaRef = ref(database, `signaling/${sessionId}/meta/lastSeen/${user.uid}`);
      await set(metaRef, Date.now());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('ensurePeerRegistered failed for', sessionId, user?.uid, err);
      throw err;
    }
  }, [user]);

  const drainCandidateQueue = async (sessionId: string, pc: RTCPeerConnection) => {
    const queue = candidateQueueRef.current[sessionId];
    if (!queue || !pc) return;
    for (const candInit of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candInit));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to add queued ICE candidate', sessionId, err);
      }
    }
    delete candidateQueueRef.current[sessionId];
  };

  const queueOrAddCandidate = async (sessionId: string, pc: RTCPeerConnection, candInit: RTCIceCandidateInit) => {
    try {
      // If remoteDescription is set, add immediately
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candInit));
      } else {
        // queue for later
        candidateQueueRef.current[sessionId] = candidateQueueRef.current[sessionId] || [];
        candidateQueueRef.current[sessionId].push(candInit);
      }
    } catch (err) {
      // If addIceCandidate fails due to state, queue it
      candidateQueueRef.current[sessionId] = candidateQueueRef.current[sessionId] || [];
      candidateQueueRef.current[sessionId].push(candInit);
    }
  };

  // Helper functions for file transfer progress
  const addFileTransfer = useCallback((transfer: Omit<FileTransfer, 'id'>) => {
    const newTransfer: FileTransfer = {
      ...transfer,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    setFileTransfers(prev => [...prev, newTransfer]);
    return newTransfer.id;
  }, []);

  const updateFileTransfer = useCallback((id: string, updates: Partial<FileTransfer>) => {
    setFileTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, ...updates } : transfer
      )
    );
  }, []);



  // Listen for current user's availability status from Firebase
  useEffect(() => {
    if (!user) return;
    if (!database) {
      setAvailabilityLoaded(true);
      return;
    }

    const db = database;
    const userStatusRef = ref(db, `users/${user.uid}/status`);

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const statusData = snapshot.val();

      if (statusData && typeof statusData.available === 'boolean') {
        setIsAvailable(statusData.available);
        setAvailabilityLoaded(true);
      } else {
        setIsAvailable(false);
        setAvailabilityLoaded(true);
      }
    }, () => {
      setAvailabilityLoaded(true);
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [user]);

  // Set user availability
  const setAvailable = useCallback(async (available: boolean) => {
    if (!user) return;

    // Update local state immediately for responsive UI
    setIsAvailable(available);

    if (!database) return;
    const userRef = ref(database, `users/${user.uid}/status`);
    const statusUpdate = {
      online: true,
      available,
      lastSeen: Date.now(),
    };

    try {
      await set(userRef, statusUpdate);
    } catch (error: any) {
      // Revert local state if Firebase update fails
      setIsAvailable(!available);
    }
  }, [user]);

  // Listen for available users
  useEffect(() => {
    if (!user) return;
    if (!database) return;

    const db = database;
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: PeerUser[] = [];
      const data = snapshot.val();

      if (data) {
        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
          // Show users who are online and available for file sharing
          if (uid !== user.uid && userData.status?.online && userData.status?.available) {
            users.push({
              uid,
              displayName: userData.info?.displayName || 'Anonymous User',
              email: userData.info?.email,
              photoURL: userData.info?.photoURL,
              online: userData.status?.online || false,
              lastSeen: userData.status?.lastSeen || 0,
              available: userData.status?.available || false,
            });
          }
        });
      }

      setAvailableUsers(users);
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [user]);

  // Listen for share requests
  useEffect(() => {
    if (!user) return;
    if (!database) return;

    const db = database;
    const requestsRef = ref(db, `shareRequests/${user.uid}`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests: ShareRequest[] = [];
      const data = snapshot.val();

      if (data) {
        Object.entries(data).forEach(([id, requestData]: [string, any]) => {
          requests.push({
            id,
            ...requestData,
          });
        });
      }

      setShareRequests(requests.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [user]);



  // Send share request
  const sendShareRequest = useCallback(async (toUserId: string, files: File[], requestId: string, message?: string) => {
    if (!user) return;

    const toUser = availableUsers.find(u => u.uid === toUserId);
    if (!toUser) throw new Error('User not found');

    const requestData: Omit<ShareRequest, 'id'> = {
      requestId,
      fromUserId: user.uid,
      fromUserName: user.displayName || 'Anonymous User',
      toUserId,
      toUserName: toUser.displayName,
      files: files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
      status: 'pending',
      timestamp: Date.now(),
      ...(message && { message }), // Only include message if it exists
    };

    if (!database) throw new Error('Database not initialized');
    const db = database;
    const requestsRef = ref(db, `shareRequests/${toUserId}`);
    await push(requestsRef, requestData);
  }, [user, availableUsers]);

    // Reject share request
    const rejectShareRequest = useCallback(async (requestId: string) => {
      if (!user) return;
      if (!database) return;
      const db = database;
      const requestRef = ref(db, `shareRequests/${user.uid}/${requestId}`);
      await remove(requestRef);
  }, [user]);

    // Setup WebRTC as receiver (when accepting a request)
    const setupWebRTCReceiver = useCallback(async (requestId: string, senderUserId: string, senderName?: string) => {
      if (!user) return;

      if (!database) return;
      const db = database;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      setPeerConnection(pc);

      // generate ephemeral E2EE keys and publish our ephemeral pub+sig+salt to signaling before offer
      try {
        await generateOrEnsureLongtermKey();
        const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']) as CryptoKeyPair;
        const pubB64 = await exportEphemeralPublicRaw(eph.publicKey);
        const sig = await signBytesWithLongterm(base64ToArrayBuffer(pubB64));
        const saltArr = crypto.getRandomValues(new Uint8Array(16));
        const saltB64 = arrayBufferToBase64(saltArr.buffer);
        e2eeEphemeralRef.current[requestId] = { priv: eph.privateKey, pubRaw: pubB64, salt: saltB64 };
        const sigObj: any = { pub: pubB64, sig, salt: saltB64 };
        const sigPath: any = {};
        sigPath[`e2ee/${user.uid}`] = sigObj;
        await update(ref(db, `signaling/${requestId}`), sigPath);
      } catch (e) {
        // if E2EE setup fails, proceed without E2EE
      }

      // Handle incoming data channel
      pc.ondatachannel = (event) => {
        const dataChannel = event.channel;

        // Configure data channel for binary data
        dataChannel.binaryType = 'arraybuffer';

        // Received file storage by transfer id or file name
        let receivedFiles: { [fileName: string]: { chunks: ArrayBuffer[] | null[], totalChunks: number, size: number, type: string, transferId?: string, startTime: number, receivedCount: number, fileHash?: string } } = {};

        // ACK helper
        const sendAck = (seq: number) => {
          try {
            if (dataChannel.readyState === 'open') {
              dataChannel.send(JSON.stringify({ type: 'chunk-ack', seq }));
            }
          } catch (e) {
            // ignore
          }
        };

        dataChannel.onmessage = async (event) => {
          // Support both old arraybuffer-based protocol and new JSON-based chunk protocol
          const isArrayBuffer = event.data instanceof ArrayBuffer;
          const isString = typeof event.data === 'string';

          if (isString) {
            let message: any;
            try {
              message = JSON.parse(event.data);
            } catch (e) {
              return;
            }

            // New protocol messages: fileStart, chunk (base64), chunk-ack, fileComplete
            if (message.type === 'fileStart') {
              const { fileName, fileSize, fileType, totalChunks, fileHash, e2ee, ivPrefix } = message;
              const transferId = addFileTransfer({
                fileName,
                fileSize,
                fileType,
                progress: 0,
                status: 'transferring',
                senderId: senderUserId,
                senderName: senderName || 'Unknown User',
                receiverId: user?.uid || 'unknown',
                receiverName: user?.displayName || 'Unknown User',
                timestamp: Date.now(),
                direction: 'receiving',
              });
              receivedFiles[fileName] = {
                chunks: new Array(totalChunks).fill(null),
                totalChunks,
                size: fileSize,
                type: fileType,
                transferId,
                startTime: Date.now(),
                receivedCount: 0,
                fileHash,
                // store E2EE metadata if provided
                ...(e2ee ? { e2ee: true, ivPrefix } : {}),
              } as any;
            } else if (message.type === 'chunk') {
              const { fileName, seq, data: b64 } = message;
              const fileRecord = receivedFiles[fileName];
              if (!fileRecord) return;

              try {
                const buffer = base64ToArrayBuffer(b64);
                // store chunk at sequence index
                if (!fileRecord.chunks[seq]) {
                  fileRecord.chunks[seq] = buffer;
                  fileRecord.receivedCount += 1;
                }

                // update progress
                const receivedBytes = fileRecord.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
                const progress = Math.min((receivedBytes / fileRecord.size) * 100, 100);
                if (fileRecord.transferId) {
                  const elapsed = (Date.now() - fileRecord.startTime) / 1000;
                  const speed = elapsed > 0 ? receivedBytes / elapsed : 0;
                  const eta = speed > 0 ? (fileRecord.size - receivedBytes) / speed : 0;
                  updateFileTransfer(fileRecord.transferId, { progress, speed, eta });
                }

                // send ack
                sendAck(seq);

                // If we've received all chunks, assemble
                if (fileRecord.receivedCount === fileRecord.totalChunks) {
                  try {
                    let plaintextBuffers: ArrayBuffer[] = [];
                    // If E2EE, decrypt each chunk using derived session key
                    if ((fileRecord as any).e2ee) {
                      const ivPrefixB64 = (fileRecord as any).ivPrefix as string;
                      const ivPrefixBytes = new Uint8Array(base64ToArrayBuffer(ivPrefixB64));
                      const sessionKey = e2eeKeysRef.current[requestId];
                      if (!sessionKey) {
                        // cannot decrypt yet
                        if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                        delete receivedFiles[fileName];
                        return;
                      }

                      for (let seq = 0; seq < fileRecord.totalChunks; seq++) {
                        const ct = fileRecord.chunks[seq] as ArrayBuffer;
                        if (!ct) {
                          throw new Error('Missing chunk');
                        }
                        const iv = new Uint8Array(12);
                        iv.set(ivPrefixBytes, 0);
                        iv[8] = (seq >>> 24) & 0xff;
                        iv[9] = (seq >>> 16) & 0xff;
                        iv[10] = (seq >>> 8) & 0xff;
                        iv[11] = (seq & 0xff);
                        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer }, sessionKey, ct);
                        plaintextBuffers.push(plain);
                      }
                    } else {
                      // not encrypted - combine raw chunks
                      plaintextBuffers = fileRecord.chunks.map((c: any) => c as ArrayBuffer);
                    }

                    const totalSize = plaintextBuffers.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
                    const combined = new Uint8Array(totalSize);
                    let off = 0;
                    plaintextBuffers.forEach((chunk) => { combined.set(new Uint8Array(chunk), off); off += chunk.byteLength; });

                    // verify hash if provided
                    let verified = true;
                    if (fileRecord.fileHash) {
                      try {
                        const digest = await sha256Hex(combined.buffer);
                        verified = digest === fileRecord.fileHash;
                      } catch (e) {
                        verified = false;
                      }
                    }

                    if (!verified) {
                      if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                      delete receivedFiles[fileName];
                      return;
                    }

                    const blob = new Blob([combined], { type: fileRecord.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { progress: 100, status: 'completed' });
                    delete receivedFiles[fileName];
                  } catch (e) {
                    if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                    delete receivedFiles[fileName];
                  }
                }
              } catch (e) {
                // conversion failed
              }
            } else if (message.type === 'chunk-ack') {
              // Shouldn't receive ack as receiver; ignore or log
            } else if (message.type === 'fileComplete') {
              // old protocol support: finalize if sender used older flow
              const fileData = receivedFiles[message.fileName];
              if (fileData) {
                // assemble as fallback
                const totalSize = fileData.chunks.reduce((acc, chunk) => acc + (chunk ? chunk.byteLength : 0), 0);
                const combinedData = new Uint8Array(totalSize);
                let offset = 0;
                fileData.chunks.forEach((chunk) => {
                  if (chunk) {
                    combinedData.set(new Uint8Array(chunk), offset);
                    offset += chunk.byteLength;
                  }
                });

                const blob = new Blob([combinedData], { type: fileData.type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = message.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (fileData.transferId) updateFileTransfer(fileData.transferId, { progress: 100, status: 'completed' });
                delete receivedFiles[message.fileName];
              }
            }
          }
          // Legacy binary handling - keep for compatibility with older peers
          else if (isArrayBuffer) {
            // Find the file that's currently being received (most recent one without completion)
            const activeFileName = Object.keys(receivedFiles).find(name => {
              const fileData = receivedFiles[name];
              const receivedSize = fileData.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
              return receivedSize < fileData.size;
            });

            if (activeFileName) {
              const fileData = receivedFiles[activeFileName];
              // push into first null slot or at end
              const idx = fileData.chunks.findIndex(c => c === null);
              if (idx >= 0) {
                fileData.chunks[idx] = event.data;
              } else {
                (fileData.chunks as any).push(event.data);
              }
              fileData.receivedCount = fileData.chunks.filter(Boolean).length;
              const currentSize = fileData.chunks.reduce((acc, chunk) => acc + (chunk ? chunk.byteLength : 0), 0);
              const progress = (currentSize / fileData.size) * 100;

              // Calculate speed and ETA
              const elapsed = (Date.now() - fileData.startTime) / 1000; // seconds
              const speed = elapsed > 0 ? currentSize / elapsed : 0; // bytes per second
              const eta = speed > 0 ? (fileData.size - currentSize) / speed : 0; // seconds remaining

              // Update progress in UI
              if (fileData.transferId) {
                updateFileTransfer(fileData.transferId, {
                  progress,
                  speed,
                  eta,
                });
              }
            }
          }
        };
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // console.log('Sending ICE candidate');
          const candidateRef = ref(db, `signaling/${requestId}/candidates/${user.uid}`);
          push(candidateRef, {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            from: user.uid,
            ts: Date.now(),
          });
        }
      };

      // Listen for signaling data
      const signalingRef = ref(db, `signaling/${requestId}`);

      // Add ourselves to peers atomically so DB rules allow us to read/write this session
          // Ensure we're registered as a peer before doing other signaling writes. With the
          // current DB rules a multi-path update that includes top-level fields plus a
          // new peers/ entry may be rejected because the top-level write requires the
          // peer entry to already exist. Write the peer entry first, then proceed.
          try {
            await ensurePeerRegistered(requestId);
          } catch (e) {
            // ignore - permissions may block if misconfigured; higher-level code will fail later
          }
      const unsubscribe = onValue(signalingRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Handle offer from sender
        if (data.type === 'offer' && data.from === senderUserId && data.from !== user.uid) {
          try {
            // Only set remote description if we're in the right state
            if (pc.signalingState === 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));

              // Create answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              // Prepare E2EE ephemeral and publish our ephemeral pub+sig (no salt - offerer provided salt)
              try {
                await generateOrEnsureLongtermKey();
                const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']) as CryptoKeyPair;
                const pubB64 = await exportEphemeralPublicRaw(eph.publicKey);
                const sig = await signBytesWithLongterm(base64ToArrayBuffer(pubB64));
                e2eeEphemeralRef.current[requestId] = { priv: eph.privateKey, pubRaw: pubB64 };
                // Ensure we're registered as a peer, then send answer and e2ee metadata.
                try {
                  await ensurePeerRegistered(requestId);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('peer registration failed before answer; continuing', err);
                }
                try {
                  await update(signalingRef, {
                    type: 'answer',
                    sdp: answer.sdp,
                    from: user.uid,
                    answeredAt: Date.now(),
                    [`e2ee/${user.uid}`]: { pub: pubB64, sig },
                  });
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to write answer to signaling', signalingRef.toString(), err);
                }
              } catch (e) {
                // fallback: send answer without e2ee
                try {
                  await ensurePeerRegistered(requestId);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('peer registration failed before answer (fallback); continuing', err);
                }
                try {
                  await update(signalingRef, {
                    type: 'answer',
                    sdp: answer.sdp,
                    from: user.uid,
                    answeredAt: Date.now(),
                  });
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to write fallback answer to signaling', signalingRef.toString(), err);
                }
              }
            }
          } catch (error) {
            // Ignore WebRTC errors
          }
        }

        // Handle ICE candidates. Candidates may arrive before remoteDescription is set
        // (especially in flaky networks). Queue them and drain after remote is set.
        if (data.candidates) {
          Object.entries(data.candidates).forEach(([userId, candidates]: [string, any]) => {
            if (userId !== user.uid) {
              Object.values(candidates).forEach((candidateData: any) => {
                const candInit: RTCIceCandidateInit = {
                  candidate: candidateData.candidate,
                  sdpMLineIndex: candidateData.sdpMLineIndex,
                  sdpMid: candidateData.sdpMid,
                };
                // attempt to add or queue
                queueOrAddCandidate(requestId, pc, candInit).catch((err) => {
                  // eslint-disable-next-line no-console
                  console.warn('queueOrAddCandidate failed', requestId, err);
                });
              });
            }
          });
        }

        // Attempt to derive e2ee session key for receiver when both ephemeral entries exist
        try {
          if (data.e2ee && data.e2ee[senderUserId] && data.e2ee[user.uid] && !e2eeKeysRef.current[requestId] && e2eeEphemeralRef.current[requestId]?.priv) {
            const offererEntry = data.e2ee[senderUserId];
            const answererEntry = data.e2ee[user.uid];
            // verify offerer's ephemeral signature before deriving
            const verified = await verifyEphemeralSignature(senderUserId, offererEntry.pub, offererEntry.sig);
            if (!verified) {
              // signature failed - do not derive
              return;
            }
            const salt = offererEntry.salt; // offerer provided salt
            const otherPub = offererEntry.pub;
            const key = await deriveSessionKey(e2eeEphemeralRef.current[requestId].priv!, otherPub, salt);
            e2eeKeysRef.current[requestId] = key;
          }
        } catch (e) {
          // ignore
        }
      });

      // Cleanup after 5 minutes
      const cleanupTimer = setTimeout(() => {
        try {
          unsubscribe();
        } catch (e) {
          // ignore
        }
        try {
          pc.close();
        } catch (e) {
          // ignore
        }
        // Attempt to remove signaling session to avoid lingering data
        try {
          const sigRef = ref(db, `signaling/${requestId}`);
          remove(sigRef).catch(() => { /* ignore */ });
        } catch (e) {
          // ignore
        }
      }, 5 * 60 * 1000);

      // Also return a small cleanup function in case caller wants to close earlier (not used now)
      // Not returning from useCallback; we rely on timer above
  }, [addFileTransfer, deriveSessionKey, ensurePeerRegistered, exportEphemeralPublicRaw, generateOrEnsureLongtermKey, signBytesWithLongterm, updateFileTransfer, user, verifyEphemeralSignature]);

      // Accept share request
    const acceptShareRequest = useCallback(async (requestId: string) => {
      if (!user) return;

      const request = shareRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status (use update to avoid overwriting unexpected fields)
      if (!database) return;
      const db = database;
      const requestRef = ref(db, `shareRequests/${user.uid}/${requestId}`);
      await update(requestRef, { status: 'accepted', acceptedAt: Date.now() });

      // Start WebRTC connection as receiver using the requestId from the request
      await setupWebRTCReceiver(request.requestId, request.fromUserId, request.fromUserName);
    }, [user, shareRequests, setupWebRTCReceiver]);

    // Helper function to send file through data channel
    // Helper: wait for data channel buffer to drain below threshold.
    const waitForBufferedAmountLow = useCallback((dc: RTCDataChannel, threshold: number, timeout = 10000) => {
      return new Promise<void>((resolve) => {
        if (typeof dc.bufferedAmount === 'number' && dc.bufferedAmount <= threshold) {
          resolve();
          return;
        }

        let resolved = false;

        const onLow = () => {
          if (resolved) return;
          resolved = true;
          try { dc.removeEventListener('bufferedamountlow', onLow as any); } catch (e) { }
          resolve();
        };

        try {
          // Try to set threshold if supported
          // @ts-ignore
          if (typeof dc.bufferedAmountLowThreshold === 'number') {
            try { /* @ts-ignore */ dc.bufferedAmountLowThreshold = threshold; } catch (e) { }
          }
          dc.addEventListener('bufferedamountlow', onLow as any);
        } catch (e) {
          // event not supported, fallback to polling
          const poll = setInterval(() => {
            if (dc.bufferedAmount <= threshold) {
              clearInterval(poll);
              if (resolved) return;
              resolved = true;
              resolve();
            }
          }, 150);
        }

        // Fallback timeout to avoid hanging forever
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          try { dc.removeEventListener('bufferedamountlow', onLow as any); } catch (e) { }
          resolve();
        }, timeout);
      });
    }, []);
    // sendFile: chunk file, include sequence numbers, wait for per-chunk ACKs, and send file-level SHA-256 for verification
    const sendFile = useCallback(async (dataChannel: RTCDataChannel, file: File, transferId?: string, sessionId?: string) => {
      const chunkSize = 64 * 1024; // 64KB
      const totalChunks = Math.ceil(file.size / chunkSize);
      const startTime = Date.now();

      // Precompute file hash for verification
      let fileHash = '';
      try {
        const whole = await file.arrayBuffer();
        fileHash = await sha256Hex(whole);
      } catch (e) {
        // if hashing fails, proceed without hash (verification skipped)
        fileHash = '';
      }

      // Prepare E2EE if session key available
      let sessionKey: CryptoKey | undefined;
      try {
        if (sessionId && e2eeKeysRef.current[sessionId]) {
          sessionKey = e2eeKeysRef.current[sessionId];
        }
      } catch (e) { /* ignore */ }

      const e2eeEnabled = !!sessionKey;
      let ivPrefixB64: string | undefined;
      if (e2eeEnabled) {
        const ivPrefix = crypto.getRandomValues(new Uint8Array(8));
        ivPrefixB64 = arrayBufferToBase64(ivPrefix.buffer);
      }

      // Send fileStart with metadata
      try {
        const meta: any = {
          type: 'fileStart',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks,
          fileHash,
        };
        if (e2eeEnabled && ivPrefixB64) {
          meta.e2ee = true;
          meta.ivPrefix = ivPrefixB64;
        }
        dataChannel.send(JSON.stringify(meta));
      } catch (e) {
        if (transferId) updateFileTransfer(transferId, { status: 'failed' });
        return;
      }

      // Setup ACK waiter map
      const pendingAcks = new Map<number, { resolve: () => void, reject: (r: any) => void, timer: any, retries: number }>();

      const waitForAck = (seq: number, timeout = 5000) => {
        return new Promise<void>((resolve, reject) => {
          const record = { resolve, reject, timer: null as any } as any;
          record.timer = setTimeout(() => {
            pendingAcks.delete(seq);
            reject(new Error('ACK timeout'));
          }, timeout);
          pendingAcks.set(seq, record);
        });
      };

      // Listen for incoming ACK messages on this data channel
      const onMessage = (ev: MessageEvent) => {
        if (typeof ev.data !== 'string') return;
        try {
          const m = JSON.parse(ev.data);
          if (m && m.type === 'chunk-ack' && typeof m.seq === 'number') {
            const rec = pendingAcks.get(m.seq);
            if (rec) {
              clearTimeout(rec.timer);
              pendingAcks.delete(m.seq);
              try { rec.resolve(); } catch (e) { }
            }
          }
        } catch (e) {
          // ignore
        }
      };

      try {
        dataChannel.addEventListener('message', onMessage as any);
      } catch (e) {
        // fallback
        dataChannel.onmessage = onMessage as any;
      }

      // send chunks sequentially, wait for ACK for each
      for (let seq = 0; seq < totalChunks; seq++) {
        const start = seq * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const slice = file.slice(start, end);
        const arrayBuffer = await slice.arrayBuffer();
        let b64: string;
        if (e2eeEnabled && sessionKey) {
          // create IV = ivPrefix (8) + seq (4)
          const ivPrefix = ivPrefixB64 ? new Uint8Array(base64ToArrayBuffer(ivPrefixB64)) : crypto.getRandomValues(new Uint8Array(8));
          const iv = new Uint8Array(12);
          iv.set(ivPrefix, 0);
          // set seq big-endian
          iv[8] = (seq >>> 24) & 0xff;
          iv[9] = (seq >>> 16) & 0xff;
          iv[10] = (seq >>> 8) & 0xff;
          iv[11] = (seq & 0xff);
          try {
            const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, sessionKey, arrayBuffer);
            b64 = arrayBufferToBase64(cipher);
          } catch (e) {
            if (transferId) updateFileTransfer(transferId, { status: 'failed' });
            return;
          }
        } else {
          b64 = arrayBufferToBase64(arrayBuffer);
        }

        // Respect channel state
        if (dataChannel.readyState !== 'open') {
          if (transferId) updateFileTransfer(transferId, { status: 'failed' });
          break;
        }

        // Retry loop for this chunk
        let sent = false;
        let attempts = 0;
        while (!sent && attempts <= 5) {
          attempts += 1;
          try {
            dataChannel.send(JSON.stringify({ type: 'chunk', fileName: file.name, seq, data: b64 }));
          } catch (e) {
            // wait and retry
            await new Promise(r => setTimeout(r, 200));
            continue;
          }

          // backpressure check
          const MAX_BUFFERED = 2 * 1024 * 1024;
          if (typeof dataChannel.bufferedAmount === 'number' && dataChannel.bufferedAmount > MAX_BUFFERED) {
            await waitForBufferedAmountLow(dataChannel, Math.floor(MAX_BUFFERED / 2));
          }

          // wait for ack
          try {
            await waitForAck(seq);
            sent = true;
          } catch (e) {
            // ack timeout, retry chunk
            if (attempts > 5) {
              if (transferId) updateFileTransfer(transferId, { status: 'failed' });
              break;
            }
            // small backoff
            await new Promise(r => setTimeout(r, 300 * attempts));
          }
        }

        // Update progress
        if (transferId) {
          const bytesSent = Math.min((seq + 1) * chunkSize, file.size);
          const progress = Math.min((bytesSent / file.size) * 100, 100);
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? bytesSent / elapsed : 0;
          const eta = speed > 0 ? (file.size - bytesSent) / speed : 0;
          updateFileTransfer(transferId, { progress, speed, eta });
        }
      }

      // Cleanup ack listeners
      pendingAcks.forEach((rec) => { try { clearTimeout(rec.timer); rec.reject(new Error('cleanup')); } catch (e) { } });
      try {
        dataChannel.removeEventListener('message', onMessage as any);
      } catch (e) {
        try { dataChannel.onmessage = null as any; } catch (e) { }
      }

      // Finalize
      try {
        dataChannel.send(JSON.stringify({ type: 'fileComplete', fileName: file.name }));
      } catch (e) { }

      if (transferId) updateFileTransfer(transferId, { progress: 100, status: 'completed' });
    }, [updateFileTransfer, waitForBufferedAmountLow]);
    // Start file transfer (WebRTC) - called by sender
    const startFileTransfer = useCallback(async (requestId: string, files: File[]) => {
      if (!user) return;
      if (!database) return;
      const db = database;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      setPeerConnection(pc);

      // Create data channel for file transfer
      const dataChannel = pc.createDataChannel('fileTransfer', {
        ordered: true,
      });

      // Configure data channel for binary data
      dataChannel.binaryType = 'arraybuffer';

      // Handle data channel events
      dataChannel.onopen = () => {
        // Start sending files with a small delay to ensure connection is stable
        setTimeout(() => {
          files.forEach((file) => {
            // Create file transfer record
            const transferId = addFileTransfer({
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              progress: 0,
              status: 'transferring',
              senderId: user?.uid || 'unknown',
              senderName: user?.displayName || 'Unknown User',
              receiverId: 'unknown', // Will be updated when we know the receiver
              receiverName: 'Unknown User',
              timestamp: Date.now(),
              direction: 'sending',
            });

            sendFile(dataChannel, file, transferId, requestId);
          });
        }, 100);
      };

      dataChannel.onclose = () => {
        // Data channel closed
      };

      dataChannel.onerror = () => {
        // Data channel error
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = ref(db, `signaling/${requestId}/candidates/${user.uid}`);
          push(candidateRef, {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            from: user.uid,
            ts: Date.now(),
          });
        }
      };

      // Create offer and set up signaling
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through Firebase signaling. First ensure we're registered as a
      // peer so the DB rules allow subsequent writes to the session node.
      const signalingRef = ref(db, `signaling/${requestId}`);
      try {
        await ensurePeerRegistered(requestId);
      } catch (err) {
        // If registration fails we'll still attempt the offer write and log errors.
        // eslint-disable-next-line no-console
        console.warn('peer registration failed before offer; continuing to offer write', err);
      }

      try {
        await update(signalingRef, {
          type: 'offer',
          sdp: offer.sdp,
          from: user.uid,
          createdAt: Date.now(),
        });
      } catch (err) {
        // Log path and error for debugging permission issues
        // eslint-disable-next-line no-console
        console.error('Failed to write offer to signaling', signalingRef.toString(), err);
        throw err;
      }

      // Listen for answer
      const unsubscribe = onValue(signalingRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // derive e2ee session key when both ephemeral entries present
        try {
          if (data.e2ee && data.e2ee[user.uid]) {
            const otherUid = Object.keys(data.e2ee).find((u) => u !== user.uid);
            if (otherUid && !e2eeKeysRef.current[requestId] && e2eeEphemeralRef.current[requestId]?.priv) {
              const mySalt = data.e2ee[user.uid].salt;
              const otherPub = data.e2ee[otherUid].pub;
              const otherSig = data.e2ee[otherUid].sig;
              // verify other party's ephemeral signature before deriving
              const verified = await verifyEphemeralSignature(otherUid, otherPub, otherSig);
              if (!verified) {
                // do not derive session key if verification fails
                return;
              }
              const key = await deriveSessionKey(e2eeEphemeralRef.current[requestId].priv!, otherPub, mySalt);
              e2eeKeysRef.current[requestId] = key;
            }
          }
        } catch (e) {
          // ignore derivation errors
        }

        // Handle answer from receiver
        if (data.type === 'answer' && data.from !== user.uid) {
          try {
            // Only set remote description if we're in the right state
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
            }
          } catch (error) {
            // Ignore WebRTC state errors
          }
        }

        // Handle ICE candidates. Use queueOrAddCandidate to tolerate candidates arriving
        // before remoteDescription is set.
        if (data.candidates) {
          Object.entries(data.candidates).forEach(([userId, candidates]: [string, any]) => {
            if (userId !== user.uid) {
              Object.values(candidates).forEach((candidateData: any) => {
                const candInit: RTCIceCandidateInit = {
                  candidate: candidateData.candidate,
                  sdpMLineIndex: candidateData.sdpMLineIndex,
                  sdpMid: candidateData.sdpMid,
                };
                queueOrAddCandidate(requestId, pc, candInit).catch((err) => {
                  // eslint-disable-next-line no-console
                  console.warn('queueOrAddCandidate failed (sender)', requestId, err);
                });
              });
            }
          });
        }
      });

      const cleanupTimer = setTimeout(() => {
        try {
          unsubscribe();
        } catch (e) {
          // ignore
        }
        try {
          pc.close();
        } catch (e) {
          // ignore
        }
        // Attempt to remove signaling session to avoid lingering data
        try {
          const sigRef = ref(db, `signaling/${requestId}`);
          remove(sigRef).catch(() => { /* ignore */ });
        } catch (e) {
          // ignore
        }
      }, 5 * 60 * 1000);
  }, [addFileTransfer, deriveSessionKey, ensurePeerRegistered, sendFile, user, verifyEphemeralSignature]);


    const value = {
      availableUsers,
      fileTransfers,
      shareRequests,
      isAvailable,
      availabilityLoaded,
      setAvailable,
      sendShareRequest,
      acceptShareRequest,
      rejectShareRequest,
      startFileTransfer,
      peerConnection,
    };

    return (
      <P2PContext.Provider value={value}>
        {children}
      </P2PContext.Provider>
    );
  }
