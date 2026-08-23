import { ref, push, update, onValue, Database } from 'firebase/database';
import { ICE_SERVERS } from './_constants';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  sha256Hex,
} from './_crypto';
import {
  UserAuthLike,
  deriveSessionKey,
  drainCandidateQueue,
  ensurePeerRegistered,
  queueOrAddCandidate,
  verifyEphemeralSignature,
} from './_signaling';
import type { FileTransfer, PeerUser, ShareRequest } from './types';

export interface SenderContextDeps {
  user: UserAuthLike | null;
  database: Database | null;
  availableUsers: PeerUser[];
  shareRequests: ShareRequest[];
  e2eeKeysRef: React.MutableRefObject<Record<string, CryptoKey>>;
  e2eeEphemeralRef: React.MutableRefObject<Record<string, { priv?: CryptoKey; pubRaw?: string; salt?: string }>>;
  candidateQueueRef: React.MutableRefObject<Record<string, RTCIceCandidateInit[]>>;
  processedCandidatesRef: React.MutableRefObject<Set<string>>;
  pausedTransfersRef: React.MutableRefObject<Set<string>>;
  cancelledTransfersRef: React.MutableRefObject<Set<string>>;
  transferFilesRef: React.MutableRefObject<Map<string, { file: File; requestId: string; dataChannel: RTCDataChannel }>>;
  addFileTransfer: (transfer: Omit<FileTransfer, 'id'>) => string;
  updateFileTransfer: (id: string, updates: Partial<FileTransfer>) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
}

/**
 * Backpressure helper: waits until the RTCDataChannel buffered amount drains
 * below the given threshold before feeding more binary chunks.
 */
export function waitForBufferedAmountLow(
  dc: RTCDataChannel,
  threshold: number,
  timeout = 10000
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof dc.bufferedAmount === 'number' && dc.bufferedAmount <= threshold) {
      resolve();
      return;
    }
    let resolved = false;
    const onLow = () => {
      if (resolved) return;
      resolved = true;
      try {
        dc.removeEventListener('bufferedamountlow', onLow as any);
      } catch {}
      resolve();
    };

    try {
      // @ts-ignore
      if (typeof dc.bufferedAmountLowThreshold === 'number') {
        try {
          // @ts-ignore
          dc.bufferedAmountLowThreshold = threshold;
        } catch {}
      }
      dc.addEventListener('bufferedamountlow', onLow as any);
    } catch {
      const poll = setInterval(() => {
        if (dc.bufferedAmount <= threshold) {
          clearInterval(poll);
          if (resolved) return;
          resolved = true;
          resolve();
        }
      }, 150);
    }

    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      try {
        dc.removeEventListener('bufferedamountlow', onLow as any);
      } catch {}
      resolve();
    }, timeout);
  });
}

/**
 * Sends a single file sequentially over an established RTCDataChannel with:
 * - 64 KB chunking with sequence numbering
 * - AES-GCM chunk encryption when E2EE session key is present
 * - SHA-256 integrity digest for files under 15 MB
 * - Flow control & backpressure throttling (4 MB buffer cap)
 * - Pause and cancellation awareness
 */
export async function sendFile(
  dataChannel: RTCDataChannel,
  file: File,
  transferId: string | undefined,
  sessionId: string | undefined,
  deps: Pick<SenderContextDeps, 'e2eeKeysRef' | 'pausedTransfersRef' | 'cancelledTransfersRef' | 'updateFileTransfer'>
): Promise<void> {
  const { e2eeKeysRef, pausedTransfersRef, cancelledTransfersRef, updateFileTransfer } = deps;
  const chunkSize = 64 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const startTime = Date.now();
  let pausedMs = 0;

  if (transferId) updateFileTransfer(transferId, { status: 'preparing' });

  let fileHash = '';
  try {
    if (file.size <= 15 * 1024 * 1024) {
      const whole = await file.arrayBuffer();
      fileHash = await sha256Hex(whole);
    }
  } catch {
    fileHash = '';
  }

  if (transferId) updateFileTransfer(transferId, { status: 'transferring' });
  if (transferId && cancelledTransfersRef.current.has(transferId)) return;

  let sessionKey: CryptoKey | undefined;
  try {
    if (sessionId && e2eeKeysRef.current[sessionId]) sessionKey = e2eeKeysRef.current[sessionId];
  } catch {}

  const e2eeEnabled = !!sessionKey;
  let ivPrefixB64: string | undefined;
  if (e2eeEnabled) {
    const ivPrefix = crypto.getRandomValues(new Uint8Array(8));
    ivPrefixB64 = arrayBufferToBase64(ivPrefix.buffer);
  }

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
  } catch {
    if (transferId) {
      updateFileTransfer(transferId, {
        status: 'failed',
        errorMessage: 'Failed to initiate file transfer',
        completedAt: Date.now(),
      });
    }
    return;
  }

  for (let seq = 0; seq < totalChunks; seq++) {
    // Pause handling
    if (transferId && pausedTransfersRef.current.has(transferId)) {
      try {
        dataChannel.send(JSON.stringify({ type: 'transfer-pause', transferId }));
      } catch {}
      const pauseStart = Date.now();
      await new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (transferId && !pausedTransfersRef.current.has(transferId)) {
            clearInterval(poll);
            resolve();
          }
        }, 200);
      });
      pausedMs += Date.now() - pauseStart;
      try {
        dataChannel.send(JSON.stringify({ type: 'transfer-resume', transferId }));
      } catch {}
    }

    // Cancel check
    if (transferId && cancelledTransfersRef.current.has(transferId)) break;

    const start = seq * chunkSize;
    const slice = file.slice(start, Math.min(start + chunkSize, file.size));
    const arrayBuffer = await slice.arrayBuffer();

    let chunkBuffer: ArrayBuffer;
    if (e2eeEnabled && sessionKey) {
      const ivPrefix = ivPrefixB64
        ? new Uint8Array(base64ToArrayBuffer(ivPrefixB64))
        : crypto.getRandomValues(new Uint8Array(8));
      const iv = new Uint8Array(12);
      iv.set(ivPrefix, 0);
      iv[8] = (seq >>> 24) & 0xff;
      iv[9] = (seq >>> 16) & 0xff;
      iv[10] = (seq >>> 8) & 0xff;
      iv[11] = seq & 0xff;
      try {
        chunkBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv.buffer },
          sessionKey,
          arrayBuffer
        );
      } catch {
        if (transferId) {
          updateFileTransfer(transferId, {
            status: 'failed',
            errorMessage: 'Encryption failed',
            completedAt: Date.now(),
          });
        }
        return;
      }
    } else {
      chunkBuffer = arrayBuffer;
    }

    if (dataChannel.readyState !== 'open') {
      if (transferId) {
        updateFileTransfer(transferId, {
          status: 'failed',
          errorMessage: 'Connection closed unexpectedly',
          completedAt: Date.now(),
        });
      }
      break;
    }

    const packet = new Uint8Array(4 + chunkBuffer.byteLength);
    const dv = new DataView(packet.buffer);
    dv.setUint32(0, seq, false);
    packet.set(new Uint8Array(chunkBuffer), 4);

    try {
      dataChannel.send(packet.buffer);
    } catch {
      if (transferId) {
        updateFileTransfer(transferId, {
          status: 'failed',
          errorMessage: 'Network error while sending data',
          completedAt: Date.now(),
        });
      }
      break;
    }

    const MAX_BUFFERED = 4 * 1024 * 1024;
    if (typeof dataChannel.bufferedAmount === 'number' && dataChannel.bufferedAmount > MAX_BUFFERED) {
      await waitForBufferedAmountLow(dataChannel, Math.floor(MAX_BUFFERED / 2));
    }

    if (transferId) {
      const bytesSent = Math.min((seq + 1) * chunkSize, file.size);
      const progress = Math.min((bytesSent / file.size) * 100, 100);
      const activeMs = Date.now() - startTime - pausedMs;
      const elapsed = activeMs / 1000;
      const speed = elapsed > 0 ? bytesSent / elapsed : 0;
      const eta = speed > 0 ? (file.size - bytesSent) / speed : 0;
      updateFileTransfer(transferId, { progress, speed, eta, transferredBytes: bytesSent });
    }
  }

  if (transferId && cancelledTransfersRef.current.has(transferId)) {
    cancelledTransfersRef.current.delete(transferId);
    return;
  }

  try {
    dataChannel.send(JSON.stringify({ type: 'fileComplete', fileName: file.name }));
  } catch {}

  if (transferId) {
    updateFileTransfer(transferId, { progress: 100, status: 'finalizing', transferredBytes: file.size });
  }
}

/**
 * Initiates an outgoing WebRTC peer connection + data channel and sends the requested files.
 */
export async function startFileTransfer(
  requestId: string,
  files: File[],
  receiverName: string | undefined,
  receiverId: string | undefined,
  deps: SenderContextDeps
): Promise<void> {
  const {
    user,
    database,
    availableUsers,
    shareRequests,
    e2eeKeysRef,
    e2eeEphemeralRef,
    candidateQueueRef,
    processedCandidatesRef,
    cancelledTransfersRef,
    transferFilesRef,
    addFileTransfer,
    updateFileTransfer,
    setPeerConnection,
  } = deps;

  if (!user || !database) return;
  const db = database;

  let targetName = receiverName;
  let targetUid = receiverId;

  if (!targetName || !targetUid) {
    const req = shareRequests.find((r) => r.requestId === requestId || r.id === requestId);
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
    const peer = availableUsers.find((u) => u.uid === targetUid);
    if (peer) targetName = peer.displayName;
  }

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  setPeerConnection(pc);

  const dataChannel = pc.createDataChannel('fileTransfer', { ordered: true });
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
    } catch {}
  };

  dataChannel.onopen = () => {
    setTimeout(async () => {
      for (const file of files) {
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
        transferFilesRef.current.set(transferId, { file, requestId, dataChannel });
        await sendFile(dataChannel, file, transferId, requestId, deps);
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

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const signalingRef = ref(db, `signaling/${requestId}`);
  try {
    await ensurePeerRegistered(user, database, requestId);
  } catch {}
  await update(signalingRef, {
    type: 'offer',
    sdp: offer.sdp,
    from: user.uid,
    createdAt: Date.now(),
  });

  onValue(signalingRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    try {
      if (data.e2ee && data.e2ee[user.uid]) {
        const otherUid = Object.keys(data.e2ee).find((u) => u !== user.uid);
        if (
          otherUid &&
          !e2eeKeysRef.current[requestId] &&
          e2eeEphemeralRef.current[requestId]?.priv
        ) {
          const mySalt = data.e2ee[user.uid].salt;
          const otherPub = data.e2ee[otherUid].pub;
          const otherSig = data.e2ee[otherUid].sig;
          const verified = await verifyEphemeralSignature(database, otherUid, otherPub, otherSig);
          if (!verified) return;
          const key = await deriveSessionKey(
            e2eeEphemeralRef.current[requestId].priv!,
            otherPub,
            mySalt
          );
          e2eeKeysRef.current[requestId] = key;
        }
      }
    } catch {}

    if (data.type === 'answer' && data.from !== user.uid) {
      try {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
          await drainCandidateQueue(candidateQueueRef.current, requestId, pc);
        }
      } catch {}
    }

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
            queueOrAddCandidate(candidateQueueRef.current, requestId, pc, candInit).catch(() => {});
          });
        }
      });
    }
  });
}
