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
  exportEphemeralPublicRaw,
  generateOrEnsureLongtermKey,
  queueOrAddCandidate,
  signBytesWithLongterm,
  verifyEphemeralSignature,
} from './_signaling';
import type { FileTransfer } from './types';

export interface ReceiverContextDeps {
  user: UserAuthLike | null;
  database: Database | null;
  e2eeKeysRef: React.MutableRefObject<Record<string, CryptoKey>>;
  e2eeEphemeralRef: React.MutableRefObject<Record<string, { priv?: CryptoKey; pubRaw?: string; salt?: string }>>;
  candidateQueueRef: React.MutableRefObject<Record<string, RTCIceCandidateInit[]>>;
  processedCandidatesRef: React.MutableRefObject<Set<string>>;
  addFileTransfer: (transfer: Omit<FileTransfer, 'id'>) => string;
  addFileTransferWithId: (id: string, transfer: Omit<FileTransfer, 'id'>) => string;
  updateFileTransfer: (id: string, updates: Partial<FileTransfer>) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
}

interface ReceivedFileRecord {
  chunks: (ArrayBuffer | null)[];
  totalChunks: number;
  size: number;
  type: string;
  transferId?: string;
  startTime: number;
  receivedCount: number;
  fileHash?: string;
  writeableStream?: any;
  e2ee?: boolean;
  ivPrefix?: string;
}

/**
 * Sets up incoming WebRTC receiver connection, signaling listeners, and handles
 * the incoming binary DataChannel stream (memory check, disk write, decrypt, assemble, save).
 */
export async function setupWebRTCReceiver(
  requestId: string,
  senderUserId: string,
  senderName: string | undefined,
  destinationDirectory: any | undefined,
  deps: ReceiverContextDeps
): Promise<void> {
  const {
    user,
    database,
    e2eeKeysRef,
    e2eeEphemeralRef,
    candidateQueueRef,
    processedCandidatesRef,
    addFileTransfer,
    addFileTransferWithId,
    updateFileTransfer,
    setPeerConnection,
  } = deps;

  if (!user || !database) return;
  const db = database;

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  setPeerConnection(pc);

  // Generate ephemeral E2EE keys and publish before offer
  try {
    await generateOrEnsureLongtermKey(user, database);
    const eph = (await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    )) as CryptoKeyPair;
    const pubB64 = await exportEphemeralPublicRaw(eph.publicKey);
    const sig = await signBytesWithLongterm(user, database, base64ToArrayBuffer(pubB64));
    const saltArr = crypto.getRandomValues(new Uint8Array(16));
    const saltB64 = arrayBufferToBase64(saltArr.buffer);
    e2eeEphemeralRef.current[requestId] = { priv: eph.privateKey, pubRaw: pubB64, salt: saltB64 };
    const sigPath: Record<string, any> = {};
    sigPath[`e2ee/${user.uid}`] = { pub: pubB64, sig, salt: saltB64 };
    await update(ref(db, `signaling/${requestId}`), sigPath);
  } catch {
    // proceed without E2EE if setup fails
  }

  pc.ondatachannel = (event) => {
    const dataChannel = event.channel;
    dataChannel.binaryType = 'arraybuffer';

    const receivedFiles: Record<string, ReceivedFileRecord> = {};
    let activeTransferId: string | null = null;

    dataChannel.onclose = () => {
      Object.values(receivedFiles).forEach((fileRecord) => {
        if (fileRecord.receivedCount < fileRecord.totalChunks && fileRecord.transferId) {
          updateFileTransfer(fileRecord.transferId, {
            status: 'failed',
            errorMessage: 'Connection closed before Chrome could finish saving the file.',
            completedAt: Date.now(),
          });
          if (fileRecord.writeableStream) {
            fileRecord.writeableStream.abort().catch(() => {});
          }
        }
      });
    };

    dataChannel.onmessage = async (msgEvent) => {
      const isArrayBuffer = msgEvent.data instanceof ArrayBuffer;
      const isString = typeof msgEvent.data === 'string';

      if (isString) {
        let message: any;
        try {
          message = JSON.parse(msgEvent.data);
        } catch {
          return;
        }

        if (message.type === 'transfer-pause') {
          if (message.transferId) updateFileTransfer(message.transferId, { status: 'paused' });
          return;
        }
        if (message.type === 'transfer-resume') {
          if (message.transferId) updateFileTransfer(message.transferId, { status: 'transferring' });
          return;
        }
        if (message.type === 'transfer-cancel') {
          if (message.transferId) {
            updateFileTransfer(message.transferId, { status: 'cancelled', completedAt: Date.now() });
          }
          return;
        }

        if (message.type === 'fileStart') {
          const { fileName, fileSize, fileType, totalChunks, fileHash, e2ee, ivPrefix, transferId } = message;

          // E2EE Downgrade Attack Protection
          const isSessionE2ee = !!e2eeKeysRef.current[requestId];
          if (isSessionE2ee && !e2ee) return;

          // Filename Sanitization
          const safeFileName = fileName.replace(/[\/\\]/g, '_');

          // Memory protection for browsers without directory picker
          const MAX_RAM_FILE_SIZE = 1.5 * 1024 * 1024 * 1024; // 1.5 GB
          let writeableStream: any = null;
          if (destinationDirectory) {
            try {
              const destinationFile = await destinationDirectory.getFileHandle(safeFileName, { create: true });
              writeableStream = await destinationFile.createWritable();
            } catch {
              writeableStream = null;
            }
          }

          if (!writeableStream && fileSize > MAX_RAM_FILE_SIZE) {
            const errorMessage =
              'Receiver cannot safely store this file in memory. Choose a save location in a supported browser, or send a smaller file.';
            const failedTransferId =
              transferId ||
              addFileTransfer({
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
              dataChannel.send(
                JSON.stringify({
                  type: 'transfer-rejected',
                  transferId: failedTransferId,
                  errorMessage,
                })
              );
            } catch {}
            return;
          }

          const localTransferId =
            transferId ||
            addFileTransfer({
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
            ...(e2ee ? { e2ee: true, ivPrefix } : {}),
          };
        }
      } else if (isArrayBuffer) {
        const buffer = msgEvent.data as ArrayBuffer;
        if (buffer.byteLength < 4) return;

        const view = new DataView(buffer);
        const seq = view.getUint32(0, false);
        const chunkData = buffer.slice(4);

        const activeFileName =
          activeTransferId ||
          Object.keys(receivedFiles).find((name) => {
            const fileData = receivedFiles[name];
            return fileData.receivedCount < fileData.totalChunks;
          });

        if (activeFileName) {
          const fileRecord = receivedFiles[activeFileName];
          if (seq >= 0 && seq < fileRecord.totalChunks) {
            let plainChunk: ArrayBuffer;
            try {
              if (fileRecord.e2ee) {
                const sessionKey = e2eeKeysRef.current[requestId];
                if (!sessionKey) throw new Error('No session key');
                const ivPrefixBytes = new Uint8Array(base64ToArrayBuffer(fileRecord.ivPrefix!));
                const iv = new Uint8Array(12);
                iv.set(ivPrefixBytes, 0);
                iv[8] = (seq >>> 24) & 0xff;
                iv[9] = (seq >>> 16) & 0xff;
                iv[10] = (seq >>> 8) & 0xff;
                iv[11] = seq & 0xff;
                plainChunk = await crypto.subtle.decrypt(
                  { name: 'AES-GCM', iv: iv.buffer },
                  sessionKey,
                  chunkData
                );
              } else {
                plainChunk = chunkData;
              }
            } catch {
              if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
              if (fileRecord.writeableStream) {
                try {
                  await fileRecord.writeableStream.abort();
                } catch {}
              }
              delete receivedFiles[activeFileName];
              return;
            }

            if (fileRecord.writeableStream) {
              try {
                await fileRecord.writeableStream.write(plainChunk);
                fileRecord.receivedCount += 1;
              } catch {
                if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                try {
                  await fileRecord.writeableStream.abort();
                } catch {}
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
              ? Math.min(fileRecord.receivedCount * (64 * 1024), fileRecord.size)
              : fileRecord.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
            const progress = Math.min((receivedBytes / fileRecord.size) * 100, 100);

            if (fileRecord.transferId) {
              const elapsed = (Date.now() - fileRecord.startTime) / 1000;
              const speed = elapsed > 0 ? receivedBytes / elapsed : 0;
              const eta = speed > 0 ? (fileRecord.size - receivedBytes) / speed : 0;
              updateFileTransfer(fileRecord.transferId, { progress, speed, eta, transferredBytes: receivedBytes });
            }

            if (fileRecord.receivedCount === fileRecord.totalChunks) {
              try {
                if (fileRecord.writeableStream) {
                  updateFileTransfer(fileRecord.transferId!, { status: 'finalizing', progress: 100 });
                  await fileRecord.writeableStream.close();
                  if (fileRecord.transferId) {
                    updateFileTransfer(fileRecord.transferId, {
                      progress: 100,
                      status: 'completed',
                      transferredBytes: fileRecord.size,
                      completedAt: Date.now(),
                    });
                  }
                  delete receivedFiles[activeFileName];
                  try {
                    dataChannel.send(
                      JSON.stringify({ type: 'transfer-complete', transferId: fileRecord.transferId })
                    );
                  } catch {}
                } else {
                  const totalSize = fileRecord.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
                  if (totalSize === 0 || totalSize !== fileRecord.size) {
                    throw new Error(`File assembly failed: size mismatch (expected ${fileRecord.size}, got ${totalSize})`);
                  }
                  const combined = new Uint8Array(totalSize);
                  let off = 0;
                  for (const chunk of fileRecord.chunks) {
                    if (chunk === null) throw new Error('Cannot assemble file: one or more chunks are missing');
                    const uint8Chunk = new Uint8Array(chunk);
                    combined.set(uint8Chunk, off);
                    off += uint8Chunk.byteLength;
                  }

                  if (fileRecord.fileHash) {
                    try {
                      await sha256Hex(combined.buffer);
                    } catch {}
                  }

                  updateFileTransfer(fileRecord.transferId!, { status: 'finalizing', progress: 100 });
                  const blob = new Blob([combined], { type: fileRecord.type });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = activeFileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  if (fileRecord.transferId) {
                    updateFileTransfer(fileRecord.transferId, {
                      progress: 100,
                      status: 'completed',
                      completedAt: Date.now(),
                      transferredBytes: fileRecord.size,
                    });
                  }
                  try {
                    dataChannel.send(
                      JSON.stringify({ type: 'transfer-complete', transferId: fileRecord.transferId })
                    );
                  } catch {}
                  delete receivedFiles[activeFileName];
                }
              } catch {
                if (fileRecord.transferId) updateFileTransfer(fileRecord.transferId, { status: 'failed' });
                if (fileRecord.writeableStream) {
                  try {
                    await fileRecord.writeableStream.abort();
                  } catch {}
                }
                delete receivedFiles[activeFileName];
              }
            }
          }
        }
      }
    };
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

  const signalingRef = ref(db, `signaling/${requestId}`);
  try {
    await ensurePeerRegistered(user, database, requestId);
  } catch {}

  onValue(signalingRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.type === 'offer' && data.from === senderUserId && data.from !== user.uid) {
      try {
        if (pc.signalingState === 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
          await drainCandidateQueue(candidateQueueRef.current, requestId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          try {
            await generateOrEnsureLongtermKey(user, database);
            const eph = (await crypto.subtle.generateKey(
              { name: 'ECDH', namedCurve: 'P-256' },
              true,
              ['deriveKey', 'deriveBits']
            )) as CryptoKeyPair;
            const pubB64 = await exportEphemeralPublicRaw(eph.publicKey);
            const sig = await signBytesWithLongterm(user, database, base64ToArrayBuffer(pubB64));
            e2eeEphemeralRef.current[requestId] = { priv: eph.privateKey, pubRaw: pubB64 };
            try {
              await ensurePeerRegistered(user, database, requestId);
            } catch {}
            try {
              await update(signalingRef, {
                type: 'answer',
                sdp: answer.sdp,
                from: user.uid,
                answeredAt: Date.now(),
                [`e2ee/${user.uid}`]: { pub: pubB64, sig },
              });
            } catch {}
          } catch {
            try {
              await ensurePeerRegistered(user, database, requestId);
            } catch {}
            try {
              await update(signalingRef, {
                type: 'answer',
                sdp: answer.sdp,
                from: user.uid,
                answeredAt: Date.now(),
              });
            } catch {}
          }
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

    try {
      if (
        data.e2ee &&
        data.e2ee[senderUserId] &&
        data.e2ee[user.uid] &&
        !e2eeKeysRef.current[requestId] &&
        e2eeEphemeralRef.current[requestId]?.priv
      ) {
        const offererEntry = data.e2ee[senderUserId];
        const verified = await verifyEphemeralSignature(database, senderUserId, offererEntry.pub, offererEntry.sig);
        if (!verified) return;
        const key = await deriveSessionKey(
          e2eeEphemeralRef.current[requestId].priv!,
          offererEntry.pub,
          offererEntry.salt
        );
        e2eeKeysRef.current[requestId] = key;
      }
    } catch {}
  });
}
