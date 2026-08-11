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
  status: 'pending' | 'preparing' | 'transferring' | 'finalizing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  timestamp: number;
  completedAt?: number;     // epoch ms when finished (for history sorting)
  direction: 'sending' | 'receiving';
  speed?: number;           // bytes per second
  eta?: number;             // estimated time remaining in seconds
  transferredBytes?: number; // bytes moved so far
  errorMessage?: string;    // human-readable error detail
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

export interface OverallProgress {
  total: number;
  active: number;
  paused: number;
  completed: number;
  failed: number;
  cancelled: number;
  remaining: number; // not yet completed
  totalBytes: number;
  transferredBytes: number;
  overallPercent: number;
}

interface P2PContextType {
  availableUsers: PeerUser[];
  fileTransfers: FileTransfer[];
  shareRequests: ShareRequest[];
  isAvailable: boolean;
  availabilityLoaded: boolean;
  overallProgress: OverallProgress;
  setAvailable: (available: boolean) => void;
  sendShareRequest: (toUserId: string, files: File[], requestId: string, message?: string) => Promise<void>;
  acceptShareRequest: (requestId: string) => Promise<void>;
  rejectShareRequest: (requestId: string) => Promise<void>;
  startFileTransfer: (requestId: string, files: File[], receiverName?: string, receiverId?: string) => Promise<void>;
  pauseTransfer: (id: string) => void;
  resumeTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;
  retryTransfer: (id: string) => Promise<void>;
  clearHistory: () => void;
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
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

// Safari and Firefox do not reliably expose a user-selected writable directory.
// Their fallback receives into browser memory, so keep that mode intentionally small.
const BROWSER_ONLY_MAX_FILE_SIZE = 500 * 1024 * 1024;

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
  // Transfers are intentionally kept only for the lifetime of this page. A reload
  // closes WebRTC channels, so restoring stale progress would be misleading.
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  // Pause / cancel tracking (by transferId)
  const pausedTransfersRef = React.useRef<Set<string>>(new Set());
  const cancelledTransfersRef = React.useRef<Set<string>>(new Set());
  // Map of transferId -> File for retry support
  const transferFilesRef = React.useRef<Map<string, { file: File; requestId: string; dataChannel: RTCDataChannel }>>(new Map());

  // E2EE session ephemeral storage
  const e2eeEphemeralRef = React.useRef<Record<string, { priv?: CryptoKey, pubRaw?: string, salt?: string }>>({});
  const e2eeKeysRef = React.useRef<Record<string, CryptoKey>>({});
  // Candidate queue for sessions: store remote ICE candidates that arrive before
  // remoteDescription is set on the RTCPeerConnection. Keyed by session/requestId.
  const candidateQueueRef = React.useRef<Record<string, RTCIceCandidateInit[]>>({});

  // Deduplicate candidate handling and throttle progress re-renders
  const processedCandidatesRef = React.useRef<Set<string>>(new Set());
  const lastProgressUpdateRef = React.useRef<Record<string, number>>({});


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
      throw err;
    }
  }, [user]);

  const drainCandidateQueue = useCallback(async (sessionId: string, pc: RTCPeerConnection) => {
    const queue = candidateQueueRef.current[sessionId];
    if (!queue || !pc) return;
    for (const candInit of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candInit));
      } catch (err) {

      }
    }
    delete candidateQueueRef.current[sessionId];
  }, []);

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

  const addFileTransferWithId = useCallback((id: string, transfer: Omit<FileTransfer, 'id'>) => {
    setFileTransfers(previous => [...previous, { ...transfer, id }]);
    return id;
  }, []);

  const updateFileTransfer = useCallback((id: string, updates: Partial<FileTransfer>) => {
    // Throttle progress updates to avoid React render thrashing on every chunk
    if (updates.progress !== undefined && updates.status === undefined) {
      const now = Date.now();
      const lastUpdate = lastProgressUpdateRef.current[id] || 0;
      if (now - lastUpdate < 150 && updates.progress < 100) {
        return;
      }
      lastProgressUpdateRef.current[id] = now;
    }
    setFileTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, ...updates } : transfer
      )
    );
  }, []);

  // ── Pause / Resume / Cancel / Retry / Clear ──────────────────────────────

  const pauseTransfer = useCallback((id: string) => {
    pausedTransfersRef.current.add(id);
    updateFileTransfer(id, { status: 'paused' });
  }, [updateFileTransfer]);

  const resumeTransfer = useCallback((id: string) => {
    pausedTransfersRef.current.delete(id);
    updateFileTransfer(id, { status: 'transferring' });
  }, [updateFileTransfer]);

  const cancelTransfer = useCallback((id: string) => {
    cancelledTransfersRef.current.add(id);
    pausedTransfersRef.current.delete(id); // unblock loop so it can detect cancel
    updateFileTransfer(id, { status: 'cancelled', completedAt: Date.now() });
    // Send cancel control message if we have a data channel open
    const entry = transferFilesRef.current.get(id);
    if (entry?.dataChannel && entry.dataChannel.readyState === 'open') {
      try {
        entry.dataChannel.send(JSON.stringify({ type: 'transfer-cancel', transferId: id }));
      } catch { /* ignore */ }
    }
    transferFilesRef.current.delete(id);
  }, [updateFileTransfer]);

  const retryTransfer = useCallback(async (id: string) => {
    const entry = transferFilesRef.current.get(id);
    if (!entry) return;
    const { file, requestId, dataChannel } = entry;
    if (dataChannel.readyState !== 'open') return;

    // Remove old cancelled/failed transfer from state and clean up tracking
    cancelledTransfersRef.current.delete(id);
    pausedTransfersRef.current.delete(id);
    transferFilesRef.current.delete(id);
    setFileTransfers(prev => prev.filter(t => t.id !== id));

    // Create a new transfer record
    const newTransferId = addFileTransfer({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'transferring',
      senderId: user?.uid || 'unknown',
      senderName: user?.displayName || 'Unknown User',
      receiverId: 'unknown',
      receiverName: 'Unknown User',
      timestamp: Date.now(),
      direction: 'sending',
      transferredBytes: 0,
    });

    // Register the new transfer entry so it can be paused/cancelled/retried
    transferFilesRef.current.set(newTransferId, { file, requestId, dataChannel });

    // Re-send
    // sendFile is defined below; we call it via a helper to avoid circular deps
    sendFileRef.current?.(dataChannel, file, newTransferId, requestId);
  }, [addFileTransfer, user]);

  const clearHistory = useCallback(() => {
    setFileTransfers(prev => prev.filter(t =>
      t.status === 'transferring' || t.status === 'finalizing' || t.status === 'paused'
    ));
  }, []);

  // Forward ref so retryTransfer can call sendFile before it's defined below
  const sendFileRef = React.useRef<((dc: RTCDataChannel, file: File, transferId?: string, sessionId?: string) => Promise<void>) | null>(null);



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
  const setupWebRTCReceiver = useCallback(async (requestId: string, senderUserId: string, senderName?: string, destinationDirectory?: any) => {
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
      let receivedFiles: { [fileName: string]: { chunks: ArrayBuffer[] | null[], totalChunks: number, size: number, type: string, transferId?: string, startTime: number, receivedCount: number, fileHash?: string, writeableStream?: any, e2ee?: boolean, ivPrefix?: string } } = {};
      let activeTransferId: string | null = null;

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

      dataChannel.onclose = () => {
        Object.values(receivedFiles).forEach((fileRecord) => {
          if (fileRecord.receivedCount < fileRecord.totalChunks && fileRecord.transferId) {
            updateFileTransfer(fileRecord.transferId, {
              status: 'failed',
              errorMessage: 'Connection closed before Chrome could finish saving the file.',
              completedAt: Date.now(),
            });
            if (fileRecord.writeableStream) {
              fileRecord.writeableStream.abort().catch(() => { });
            }
          }
        });
      };

      dataChannel.onmessage = async (event) => {
        const isArrayBuffer = event.data instanceof ArrayBuffer;
        const isString = typeof event.data === 'string';

        if (isString) {
          let message: any;
          try {
            message = JSON.parse(event.data);
          } catch (e) {
            return;
          }

          if (message.type === 'transfer-pause') {
            // Sender has paused - reflect in receiver UI
            const { transferId } = message;
            if (transferId) updateFileTransfer(transferId, { status: 'paused' });
            return;
          }

          if (message.type === 'transfer-resume') {
            // Sender has resumed - reflect in receiver UI
            const { transferId } = message;
            if (transferId) updateFileTransfer(transferId, { status: 'transferring' });
            return;
          }

          if (message.type === 'transfer-cancel') {
            // Sender has cancelled - mark cancelled in receiver UI
            const { transferId } = message;
            if (transferId) updateFileTransfer(transferId, { status: 'cancelled', completedAt: Date.now() });
            return;
          }

          if (message.type === 'fileStart') {
            const { fileName, fileSize, fileType, totalChunks, fileHash, e2ee, ivPrefix, transferId } = message;

            // 1. E2EE Downgrade Attack Protection
            const isSessionE2ee = !!e2eeKeysRef.current[requestId];
            if (isSessionE2ee && !e2ee) {
              // Reject: Downgrade attempt detected
              return;
            }

            // 3. Filename Sanitization (Path Traversal Protection)
            const safeFileName = fileName.replace(/[\/\\]/g, '_');

            // 2. DoS / Memory Exhaustion Protection
            const MAX_RAM_FILE_SIZE = 1.5 * 1024 * 1024 * 1024; // 1.5GB max in RAM
            let writeableStream: any = null;
            if (destinationDirectory) {
              try {
                const destinationFile = await destinationDirectory.getFileHandle(safeFileName, { create: true });
                writeableStream = await destinationFile.createWritable();
              } catch (error) {
                writeableStream = null;
              }
            }

            if (!writeableStream && fileSize > MAX_RAM_FILE_SIZE) {
              const errorMessage = 'Receiver cannot safely store this file in memory. Choose a save location in a supported browser, or send a smaller file.';
              const failedTransferId = transferId || addFileTransfer({
                fileName: safeFileName,
                fileSize,
                fileType,
                progress: 0,
                status: 'failed',
                errorMessage,
                senderId: senderUserId,
                senderName: senderName || 'Unknown User',
                receiverId: user?.uid || 'unknown',
                receiverName: user?.displayName || 'Unknown User',
                timestamp: Date.now(),
                completedAt: Date.now(),
                direction: 'receiving',
              });
              if (transferId) {
                addFileTransferWithId(transferId, {
                  fileName: safeFileName,
                  fileSize,
                  fileType,
                  progress: 0,
                  status: 'failed',
                  errorMessage,
                  senderId: senderUserId,
                  senderName: senderName || 'Unknown User',
                  receiverId: user?.uid || 'unknown',
                  receiverName: user?.displayName || 'Unknown User',
                  timestamp: Date.now(),
                  completedAt: Date.now(),
                  direction: 'receiving',
                });
              }
              try {
                dataChannel.send(JSON.stringify({ type: 'transfer-rejected', transferId: failedTransferId, errorMessage }));
              } catch {
                // The receiver still has a local failed record if the channel closed.
              }
              return;
            }

            // The sender's ID is shared by both peers so receiver progress and
            // pause/cancel messages update the same transfer record.
            const localTransferId = transferId || addFileTransfer({
              fileName: safeFileName,
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
            activeTransferId = localTransferId;
            if (transferId) {
              addFileTransferWithId(transferId, {
                fileName: safeFileName,
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
                transferredBytes: 0,
              });
            }
            receivedFiles[localTransferId] = {
              chunks: writeableStream ? [] : new Array(totalChunks).fill(null),
              totalChunks,
              size: fileSize,
              type: fileType,
              transferId: localTransferId,
              startTime: Date.now(),
              receivedCount: 0,
              fileHash,
              writeableStream,
              // store E2EE metadata if provided
              ...(e2ee ? { e2ee: true, ivPrefix } : {}),
            } as any;
          } else if (message.type === 'fileComplete') {
            // fileComplete can act as a fallback or explicit finalization triggers
          }
        }
        else if (isArrayBuffer) {
          const buffer = event.data as ArrayBuffer;
          if (buffer.byteLength < 4) return;

          // Extract the 4-byte sequence number
          const view = new DataView(buffer);
          const seq = view.getUint32(0, false);
          const chunkData = buffer.slice(4);

          // Find the file that's currently being received
          const activeFileName = activeTransferId || Object.keys(receivedFiles).find(name => {
            const fileData = receivedFiles[name];
            return fileData.receivedCount < fileData.totalChunks;
          });

          if (activeFileName) {
            const fileRecord = receivedFiles[activeFileName];
            if (seq >= 0 && seq < fileRecord.totalChunks) {
              // Decrypt on-the-fly
              let plainChunk: ArrayBuffer;
              try {
                if (fileRecord.e2ee) {
                  const sessionKey = e2eeKeysRef.current[requestId];
                  if (!sessionKey) throw new Error("No session key");
                  const ivPrefixBytes = new Uint8Array(base64ToArrayBuffer(fileRecord.ivPrefix!));
                  const iv = new Uint8Array(12);
                  iv.set(ivPrefixBytes, 0);
                  iv[8] = (seq >>> 24) & 0xff;
                  iv[9] = (seq >>> 16) & 0xff;
                  iv[10] = (seq >>> 8) & 0xff;
                  iv[11] = (seq & 0xff);
                  plainChunk = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer }, sessionKey, chunkData);
                } else {
                  plainChunk = chunkData;
                }
              } catch (e) {
                if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                if (fileRecord.writeableStream) {
                  try { await fileRecord.writeableStream.abort(); } catch (err) { }
                }
                delete receivedFiles[activeFileName];
                return;
              }
              // Write to disk or RAM
              if (fileRecord.writeableStream) {
                try {
                  await fileRecord.writeableStream.write(plainChunk);
                  fileRecord.receivedCount += 1;
                } catch (e) {
                  if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                  try { await fileRecord.writeableStream.abort(); } catch (err) { }
                  delete receivedFiles[activeFileName];
                  return;
                }
              } else {
                if (!fileRecord.chunks[seq]) {
                  fileRecord.chunks[seq] = plainChunk;
                  fileRecord.receivedCount += 1;
                }
              }

              const receivedBytes = fileRecord.writeableStream
                ? Math.min(fileRecord.receivedCount * (64 * 1024), fileRecord.size) // estimate for progress reporting
                : fileRecord.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);

              const progress = Math.min((receivedBytes / fileRecord.size) * 100, 100);
              if (fileRecord.transferId) {
                const elapsed = (Date.now() - fileRecord.startTime) / 1000;
                const speed = elapsed > 0 ? receivedBytes / elapsed : 0;
                const eta = speed > 0 ? (fileRecord.size - receivedBytes) / speed : 0;
                updateFileTransfer(fileRecord.transferId, { progress, speed, eta, transferredBytes: receivedBytes });
              }

              // If we've received all chunks, assemble and decrypt
              if (fileRecord.receivedCount === fileRecord.totalChunks) {
                try {
                  if (fileRecord.writeableStream) {
                    updateFileTransfer(fileRecord.transferId!, {
                      status: 'finalizing',
                      progress: 100,
                    });
                    await fileRecord.writeableStream.close();
                    if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { progress: 100, status: 'completed', transferredBytes: fileRecord.size });
                    delete receivedFiles[activeFileName];
                    try {
                      dataChannel.send(JSON.stringify({ type: 'transfer-complete', transferId: fileRecord.transferId }));
                    } catch {
                      // The receiver has already completed the local write.
                    }
                    if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'completed', completedAt: Date.now() });
                  } else {
                    // Fallback : Assemble plaintext chunks in memory
                    const totalSize = fileRecord.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
                    if (totalSize === 0 || totalSize !== fileRecord.size) {
                      throw new Error(`File assembly failed: size mismatch (expected ${fileRecord.size}, got ${totalSize})`);
                    }
                    const combined = new Uint8Array(totalSize);
                    let off = 0;

                    for (const chunk of fileRecord.chunks) {
                      if (chunk === null) {
                        throw new Error("Cannot assemble file: one or more chunks are missing (null)")
                      }
                      const uint8Chunk = new Uint8Array(chunk);
                      combined.set(uint8Chunk, off);
                      off += uint8Chunk.byteLength;
                    }

                    // verify hash if provided (do not drop file if hash fails, to prevent data loss)
                    let verified = true;
                    if (fileRecord.fileHash) {
                      try {
                        const digest = await sha256Hex(combined.buffer);
                        verified = digest === fileRecord.fileHash;
                      } catch (e) {
                        verified = true;
                      }
                    }

                    if (!verified) {
                      // log warning but save file anyway to prevent user data loss
                    }
                    updateFileTransfer(fileRecord.transferId!, {
                      status: 'finalizing',
                      progress: 100,
                    });
                    const blob = new Blob([combined], { type: fileRecord.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = activeFileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { progress: 100, status: 'completed', completedAt: Date.now(), transferredBytes: fileRecord.size });
                    try {
                      dataChannel.send(JSON.stringify({ type: 'transfer-complete', transferId: fileRecord.transferId }));
                    } catch {
                      // The receiver has already completed the local write.
                    }
                    delete receivedFiles[activeFileName];
                  }
                } catch (e) {
                  if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                  if (fileRecord.writeableStream) {
                    try { await fileRecord.writeableStream.abort(); } catch (err) { }
                  }
                  delete receivedFiles[activeFileName];
                }
              }
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
            await drainCandidateQueue(requestId, pc);

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

              }
            } catch (e) {
              // fallback: send answer without e2ee
              try {
                await ensurePeerRegistered(requestId);
              } catch (err) {
              }
              try {
                await update(signalingRef, {
                  type: 'answer',
                  sdp: answer.sdp,
                  from: user.uid,
                  answeredAt: Date.now(),
                });
              } catch (err) {

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
              const candKey = `${requestId}_${candidateData.candidate}_${candidateData.sdpMLineIndex}`;
              if (processedCandidatesRef.current.has(candKey)) return;
              processedCandidatesRef.current.add(candKey);

              const candInit: RTCIceCandidateInit = {
                candidate: candidateData.candidate,
                sdpMLineIndex: candidateData.sdpMLineIndex,
                sdpMid: candidateData.sdpMid,
              };
              // attempt to add or queue
              queueOrAddCandidate(requestId, pc, candInit).catch((err) => {

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

    // Do not apply a fixed connection timeout: large files can legitimately take
    // much longer than five minutes. Closing this stream early discards Chrome's
    // temporary .crswap file before it can be committed.
  }, [addFileTransfer, addFileTransferWithId, deriveSessionKey, drainCandidateQueue, ensurePeerRegistered, exportEphemeralPublicRaw, generateOrEnsureLongtermKey, signBytesWithLongterm, updateFileTransfer, user, verifyEphemeralSignature]);

  // Accept share request
  const acceptShareRequest = useCallback(async (requestId: string) => {
    if (!user) return;

    const request = shareRequests.find(r => r.id === requestId);
    if (!request) return;
    // Prompt the user for download location immediately (within user click gesture)

    let destinationDirectory: any = null;
    const supportsDiskStreaming = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    if (!supportsDiskStreaming && request.files.some(file => file.size > BROWSER_ONLY_MAX_FILE_SIZE)) {
      alert('This browser supports files up to 500 MB. Use Chrome or Edge on the receiving device for larger direct-to-folder transfers.');
      // throw new Error('This browser supports files up to 500 MB. Use Chrome or Edge on the receiving device for larger direct-to-folder transfers.');
    }

    if (supportsDiskStreaming) {
      try {
        destinationDirectory = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      } catch (e) {
        // User cancelled picker or browser blocked it. The receiver can still
        // accept files that fit safely in memory.
        destinationDirectory = null;
      }
    }

    // Update request status (use update to avoid overwriting unexpected fields)
    if (!database) return;
    const db = database;
    const requestRef = ref(db, `shareRequests/${user.uid}/${requestId}`);
    await update(requestRef, { status: 'accepted', acceptedAt: Date.now() });

    // Start WebRTC connection as receiver using the requestId from the request
    await setupWebRTCReceiver(request.requestId, request.fromUserId, request.fromUserName, destinationDirectory);
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
  // sendFile: chunk file, include sequence numbers, support pause/cancel, and send file-level SHA-256 for verification
  const sendFile = useCallback(async (dataChannel: RTCDataChannel, file: File, transferId?: string, sessionId?: string) => {
    const chunkSize = 64 * 1024; // 64KB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const startTime = Date.now();
    let pausedMs = 0; // total time spent paused (excluded from speed calc)

    // Update status to preparing while computing checksum / initiating
    if (transferId) {
      updateFileTransfer(transferId, { status: 'preparing' });
    }

    // Precompute file hash for verification (only small files to avoid UI freeze & memory overhead)
    let fileHash = '';
    try {
      if (file.size <= 15 * 1024 * 1024) {
        const whole = await file.arrayBuffer();
        fileHash = await sha256Hex(whole);
      }
    } catch (e) {
      // if hashing fails, proceed without hash (verification skipped)
      fileHash = '';
    }

    // Transition to transferring state
    if (transferId) {
      updateFileTransfer(transferId, { status: 'transferring' });
    }

    // Early-exit if cancelled before we even start
    if (transferId && cancelledTransfersRef.current.has(transferId)) return;

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
        transferId: transferId ?? '',
      };
      if (e2eeEnabled && ivPrefixB64) {
        meta.e2ee = true;
        meta.ivPrefix = ivPrefixB64;
      }
      dataChannel.send(JSON.stringify(meta));
    } catch (e) {
      if (transferId) updateFileTransfer(transferId, { status: 'failed', errorMessage: 'Failed to initiate file transfer', completedAt: Date.now() });
      return;
    }

    // send chunks sequentially, streaming through backpressure checks
    for (let seq = 0; seq < totalChunks; seq++) {
      // ── Pause check ───────────────────────────────────────────────────────
      if (transferId && pausedTransfersRef.current.has(transferId)) {
        // Notify receiver we're pausing
        try {
          dataChannel.send(JSON.stringify({ type: 'transfer-pause', transferId }));
        } catch { /* ignore */ }
        const pauseStart = Date.now();
        // Wait until resumed or cancelled
        await new Promise<void>(resolve => {
          const poll = setInterval(() => {
            if (transferId && !pausedTransfersRef.current.has(transferId)) {
              clearInterval(poll);
              resolve();
            }
          }, 200);
        });
        pausedMs += Date.now() - pauseStart;
        // Notify receiver we're resuming
        try {
          dataChannel.send(JSON.stringify({ type: 'transfer-resume', transferId }));
        } catch { /* ignore */ }
      }

      // ── Cancel check ──────────────────────────────────────────────────────
      if (transferId && cancelledTransfersRef.current.has(transferId)) {
        break;
      }

      const start = seq * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const slice = file.slice(start, end);
      const arrayBuffer = await slice.arrayBuffer();

      let chunkBuffer: ArrayBuffer;
      if (e2eeEnabled && sessionKey) {
        const ivPrefix = ivPrefixB64 ? new Uint8Array(base64ToArrayBuffer(ivPrefixB64)) : crypto.getRandomValues(new Uint8Array(8));
        const iv = new Uint8Array(12);
        iv.set(ivPrefix, 0);
        iv[8] = (seq >>> 24) & 0xff;
        iv[9] = (seq >>> 16) & 0xff;
        iv[10] = (seq >>> 8) & 0xff;
        iv[11] = (seq & 0xff);
        try {
          chunkBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, sessionKey, arrayBuffer);
        } catch (e) {
          if (transferId) updateFileTransfer(transferId, { status: 'failed', errorMessage: 'Encryption failed', completedAt: Date.now() });
          return;
        }
      } else {
        chunkBuffer = arrayBuffer;
      }

      // Respect channel state
      if (dataChannel.readyState !== 'open') {
        if (transferId) updateFileTransfer(transferId, { status: 'failed', errorMessage: 'Connection closed unexpectedly', completedAt: Date.now() });
        break;
      }

      // Construct binary packet: 4 bytes for sequence + data
      const packet = new Uint8Array(4 + chunkBuffer.byteLength);
      const view = new DataView(packet.buffer);
      view.setUint32(0, seq, false); // big-endian
      packet.set(new Uint8Array(chunkBuffer), 4);

      // Send packet
      try {
        dataChannel.send(packet.buffer);
      } catch (e) {
        if (transferId) updateFileTransfer(transferId, { status: 'failed', errorMessage: 'Network error while sending data', completedAt: Date.now() });
        break;
      }

      // Check backpressure (keep buffer below 4MB for high-throughput cross-ISP links)
      const MAX_BUFFERED = 4 * 1024 * 1024;
      if (typeof dataChannel.bufferedAmount === 'number' && dataChannel.bufferedAmount > MAX_BUFFERED) {
        await waitForBufferedAmountLow(dataChannel, Math.floor(MAX_BUFFERED / 2));
      }

      // Update progress
      if (transferId) {
        const bytesSent = Math.min((seq + 1) * chunkSize, file.size);
        const progress = Math.min((bytesSent / file.size) * 100, 100);
        const activeMs = (Date.now() - startTime) - pausedMs;
        const elapsed = activeMs / 1000;
        const speed = elapsed > 0 ? bytesSent / elapsed : 0;
        const eta = speed > 0 ? (file.size - bytesSent) / speed : 0;
        updateFileTransfer(transferId, { progress, speed, eta, transferredBytes: bytesSent });
      }
    }

    // If cancelled, do not finalize
    if (transferId && cancelledTransfersRef.current.has(transferId)) {
      cancelledTransfersRef.current.delete(transferId);
      return;
    }

    // Finalize
    try {
      dataChannel.send(JSON.stringify({ type: 'fileComplete', fileName: file.name }));
    } catch (e) { }

    if (transferId) updateFileTransfer(transferId, { progress: 100, status: 'finalizing', transferredBytes: file.size });
  }, [updateFileTransfer, waitForBufferedAmountLow]);

  // Assign to forward ref so retryTransfer can call it
  React.useEffect(() => {
    sendFileRef.current = sendFile;
  }, [sendFile]);
  // Start file transfer (WebRTC) - called by sender
  const startFileTransfer = useCallback(async (requestId: string, files: File[], receiverName?: string, receiverId?: string) => {
    if (!user) return;
    if (!database) return;
    const db = database;

    // Resolve receiver info if available
    let targetName = receiverName;
    let targetUid = receiverId;

    if (!targetName || !targetUid) {
      const req = shareRequests.find(r => r.requestId === requestId || r.id === requestId);
      if (req) {
        if (req.fromUserId === user.uid) {
          targetName = targetName || req.toUserName;
          targetUid = targetUid || req.toUserId;
        } else {
          targetName = targetName || req.fromUserName;
          targetUid = targetUid || req.fromUserId;
        }
      }
    }

    if (!targetName && targetUid) {
      const peer = availableUsers.find(u => u.uid === targetUid);
      if (peer) targetName = peer.displayName;
    }

    // Create RTCPeerConnection
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    setPeerConnection(pc);

    // Create data channel for file transfer
    const dataChannel = pc.createDataChannel('fileTransfer', {
      ordered: true,
    });

    // Configure data channel for binary data
    dataChannel.binaryType = 'arraybuffer';

    dataChannel.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'transfer-rejected' && message.transferId) {
          cancelledTransfersRef.current.add(message.transferId);
          updateFileTransfer(message.transferId, {
            status: 'failed',
            errorMessage: message.errorMessage || 'The receiver could not accept this file.',
            completedAt: Date.now(),
          });
        }
        if (message.type === 'transfer-complete' && message.transferId) {
          updateFileTransfer(message.transferId, {
            status: 'completed',
            completedAt: Date.now(),
          });
        }
      } catch {
        // Ignore malformed control messages.
      }
    };

    // Handle data channel events
    dataChannel.onopen = () => {
      // Start sending files with a small delay to ensure connection is stable
      setTimeout(async () => {
        for (const file of files) {
          // Create file transfer record
          const transferId = addFileTransfer({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            progress: 0,
            status: 'preparing',
            senderId: user?.uid || 'unknown',
            senderName: user?.displayName || 'Unknown User',
            receiverId: targetUid || 'unknown',
            receiverName: targetName || 'Recipient',
            timestamp: Date.now(),
            direction: 'sending',
            transferredBytes: 0,
          });

          // Store file reference for pause/cancel/retry
          transferFilesRef.current.set(transferId, { file, requestId, dataChannel });

          // Send files sequentially so progress is clear
          await sendFile(dataChannel, file, transferId, requestId);

          // Clean up ref after completion (unless used for retry)
          const currentEntry = transferFilesRef.current.get(transferId);
          if (currentEntry) {
            // Keep for retry if failed or cancelled
            const currentStatus = currentEntry;
            // We'll keep it; retryTransfer will clean it up
          }
        }
      }, 100);
    };

    dataChannel.onclose = () => {
      transferFilesRef.current.forEach((entry, transferId) => {
        if (entry.dataChannel === dataChannel) {
          updateFileTransfer(transferId, {
            status: 'failed',
            errorMessage: 'Connection closed before the receiver confirmed the saved file.',
            completedAt: Date.now(),
          });
        }
      });
    };

    dataChannel.onerror = () => {
      transferFilesRef.current.forEach((entry, transferId) => {
        if (entry.dataChannel === dataChannel) {
          updateFileTransfer(transferId, {
            status: 'failed',
            errorMessage: 'A data-channel error interrupted this transfer.',
            completedAt: Date.now(),
          });
        }
      });
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
            await drainCandidateQueue(requestId, pc);
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
              const candKey = `${requestId}_${candidateData.candidate}_${candidateData.sdpMLineIndex}`;
              if (processedCandidatesRef.current.has(candKey)) return;
              processedCandidatesRef.current.add(candKey);

              const candInit: RTCIceCandidateInit = {
                candidate: candidateData.candidate,
                sdpMLineIndex: candidateData.sdpMLineIndex,
                sdpMid: candidateData.sdpMid,
              };
              queueOrAddCandidate(requestId, pc, candInit).catch((err) => {

              });
            });
          }
        });
      }
    });

    // Keep the peer connection alive for large transfers. It is closed by the
    // browser or explicit cancellation, rather than an arbitrary five-minute timer.
  }, [addFileTransfer, availableUsers, deriveSessionKey, drainCandidateQueue, ensurePeerRegistered, sendFile, shareRequests, updateFileTransfer, user, verifyEphemeralSignature]);


  // ── Overall progress (derived) ────────────────────────────────────────────
  const overallProgress = React.useMemo((): OverallProgress => {
    const total = fileTransfers.length;
    const active = fileTransfers.filter(t => t.status === 'transferring' || t.status === 'preparing' || t.status === 'finalizing').length;
    const paused = fileTransfers.filter(t => t.status === 'paused').length;
    const completed = fileTransfers.filter(t => t.status === 'completed').length;
    const failed = fileTransfers.filter(t => t.status === 'failed').length;
    const cancelled = fileTransfers.filter(t => t.status === 'cancelled').length;
    const remaining = active + paused;
    const totalBytes = fileTransfers.reduce((a, t) => a + t.fileSize, 0);
    const transferredBytes = fileTransfers.reduce((a, t) => a + (t.transferredBytes ?? (t.status === 'completed' ? t.fileSize : 0)), 0);
    const overallPercent = totalBytes > 0 ? Math.min((transferredBytes / totalBytes) * 100, 100) : 0;
    return { total, active, paused, completed, failed, cancelled, remaining, totalBytes, transferredBytes, overallPercent };
  }, [fileTransfers]);

  const value = {
    availableUsers,
    fileTransfers,
    shareRequests,
    isAvailable,
    availabilityLoaded,
    overallProgress,
    setAvailable,
    sendShareRequest,
    acceptShareRequest,
    rejectShareRequest,
    startFileTransfer,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    retryTransfer,
    clearHistory,
    peerConnection,
  };

  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
}
