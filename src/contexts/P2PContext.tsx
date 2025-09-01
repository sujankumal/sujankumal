"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ref, push, onValue, set, update, remove } from 'firebase/database';
import { database, ensureClientInitialized } from '@/lib/firebase.client';
import { useAuth } from './AuthContext';

// console.log('P2PContext loading...');

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: 'pending' | 'accepted' | 'rejected' | 'transferring' | 'completed' | 'failed';
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

export function P2PProvider({ children }: P2PProviderProps) {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<PeerUser[]>([]);
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  // Try to initialize client firebase at runtime (if server-side provided config exists)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureClientInitialized().catch(() => { });
  }, []);

  // Helper functions for file transfer progress
  const addFileTransfer = (transfer: Omit<FileTransfer, 'id'>) => {
    const newTransfer: FileTransfer = {
      ...transfer,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    setFileTransfers(prev => [...prev, newTransfer]);
    return newTransfer.id;
  };

  const updateFileTransfer = (id: string, updates: Partial<FileTransfer>) => {
    setFileTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, ...updates } : transfer
      )
    );
  };



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

      // Handle incoming data channel
      pc.ondatachannel = (event) => {
        const dataChannel = event.channel;

        // Configure data channel for binary data
        dataChannel.binaryType = 'arraybuffer';

        let receivedFiles: { [fileName: string]: { data: ArrayBuffer[], size: number, type: string, transferId?: string, startTime: number } } = {};

        dataChannel.onmessage = (event) => {
          const isArrayBuffer = event.data instanceof ArrayBuffer;
          const isString = typeof event.data === 'string';

          // Handle string data (JSON metadata)
          if (isString) {
            try {
              const message = JSON.parse(event.data);

              if (message.type === 'fileStart') {
                // Create file transfer record for receiving
                const transferId = addFileTransfer({
                  fileName: message.fileName,
                  fileSize: message.fileSize,
                  fileType: message.fileType,
                  progress: 0,
                  status: 'transferring',
                  senderId: senderUserId,
                  senderName: senderName || 'Unknown User',
                  receiverId: user?.uid || 'unknown',
                  receiverName: user?.displayName || 'Unknown User',
                  timestamp: Date.now(),
                  direction: 'receiving',
                });

                receivedFiles[message.fileName] = {
                  data: [],
                  size: message.fileSize,
                  type: message.fileType,
                  transferId,
                  startTime: Date.now(),
                };
              } else if (message.type === 'fileComplete') {
                const fileData = receivedFiles[message.fileName];
                if (fileData && fileData.data.length > 0) {
                  // Calculate total size
                  const totalSize = fileData.data.reduce((acc, chunk) => acc + chunk.byteLength, 0);

                  // Combine all chunks and create blob
                  const combinedData = new Uint8Array(totalSize);
                  let offset = 0;
                  fileData.data.forEach((chunk) => {
                    combinedData.set(new Uint8Array(chunk), offset);
                    offset += chunk.byteLength;
                  });

                  // Create blob and download
                  const blob = new Blob([combinedData], { type: fileData.type });

                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = message.fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  // Update progress to 100% and mark as completed
                  if (fileData.transferId) {
                    updateFileTransfer(fileData.transferId, {
                      progress: 100,
                      status: 'completed',
                    });
                  }

                  // Clean up
                  delete receivedFiles[message.fileName];
                }
              }
            } catch (e) {
              // Failed to parse JSON, ignore
            }
          }
          // Handle binary data (ArrayBuffer)
          else if (isArrayBuffer) {
            // Find the file that's currently being received (most recent one without completion)
            const activeFileName = Object.keys(receivedFiles).find(name => {
              const fileData = receivedFiles[name];
              const receivedSize = fileData.data.reduce((acc, chunk) => acc + chunk.byteLength, 0);
              return receivedSize < fileData.size;
            });

            if (activeFileName) {
              const fileData = receivedFiles[activeFileName];
              fileData.data.push(event.data);
              const currentSize = fileData.data.reduce((acc, chunk) => acc + chunk.byteLength, 0);
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

            } else {
              // No active file found, ignore data
            }
          }
          // Handle other data types (convert to ArrayBuffer if possible)
          else {
            // Try to convert to ArrayBuffer if it's a Blob or other binary data
            if (event.data && typeof event.data.arrayBuffer === 'function') {
              event.data.arrayBuffer().then((arrayBuffer: ArrayBuffer) => {
                // Find active file and add the converted data
                const activeFileName = Object.keys(receivedFiles).find(name => {
                  const fileData = receivedFiles[name];
                  const receivedSize = fileData.data.reduce((acc, chunk) => acc + chunk.byteLength, 0);
                  return receivedSize < fileData.size;
                });

                if (activeFileName) {
                  receivedFiles[activeFileName].data.push(arrayBuffer);
                  const currentSize = receivedFiles[activeFileName].data.reduce((acc, chunk) => acc + chunk.byteLength, 0);
                  const progress = (currentSize / receivedFiles[activeFileName].size) * 100;

                  // Update progress in UI
                  const fileData = receivedFiles[activeFileName];
                  if (fileData.transferId) {
                    updateFileTransfer(fileData.transferId, { progress });
                  }
                }
              }).catch(() => {
                // Failed to convert, ignore
              });
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
          });
        }
      };

      // Listen for signaling data
      const signalingRef = ref(db, `signaling/${requestId}`);
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

              // Send answer (use update to avoid overwriting candidate subnodes)
              await update(signalingRef, {
                type: 'answer',
                sdp: answer.sdp,
                from: user.uid,
              });
            }
          } catch (error) {
            // Ignore WebRTC errors
          }
        }

        // Handle ICE candidates
        if (data.candidates) {
          Object.entries(data.candidates).forEach(([userId, candidates]: [string, any]) => {
            if (userId !== user.uid) {
              Object.values(candidates).forEach((candidateData: any) => {
                const candidate = new RTCIceCandidate({
                  candidate: candidateData.candidate,
                  sdpMLineIndex: candidateData.sdpMLineIndex,
                  sdpMid: candidateData.sdpMid,
                });
                pc.addIceCandidate(candidate);
              });
            }
          });
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
      }, 5 * 60 * 1000);

      // Also return a small cleanup function in case caller wants to close earlier (not used now)
      // Not returning from useCallback; we rely on timer above
    }, [user]);

      // Accept share request
    const acceptShareRequest = useCallback(async (requestId: string) => {
      if (!user) return;

      const request = shareRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status
      if (!database) return;
      const db = database;
      const requestRef = ref(db, `shareRequests/${user.uid}/${requestId}`);
      await set(requestRef, {
        ...request,
        status: 'accepted',
      });

      // Start WebRTC connection as receiver using the requestId from the request
      await setupWebRTCReceiver(request.requestId, request.fromUserId, request.fromUserName);
    }, [user, shareRequests, setupWebRTCReceiver]);

    // Helper function to send file through data channel
    // Helper: wait for data channel buffer to drain below threshold.
    const waitForBufferedAmountLow = (dc: RTCDataChannel, threshold: number, timeout = 10000) => {
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
    };

    // sendFile: chunk file and await backpressure/low-buffer events between chunks
    const sendFile = async (dataChannel: RTCDataChannel, file: File, transferId?: string) => {
      const chunkSize = 64 * 1024; // 64KB chunks - larger for fewer calls but reasonable for browsers
      let offset = 0;
      const startTime = Date.now();

      // Send file metadata first
      try {
        dataChannel.send(JSON.stringify({
          type: 'fileStart',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }));
      } catch (e) {
        // if send fails immediately, mark as failed
        if (transferId) updateFileTransfer(transferId, { status: 'failed' });
        return;
      }

      while (offset < file.size) {
        // Read next slice
        const slice = file.slice(offset, offset + chunkSize);
        const arrayBuffer = await slice.arrayBuffer();

        // Ensure data channel open
        if (dataChannel.readyState !== 'open') {
          if (transferId) updateFileTransfer(transferId, { status: 'failed' });
          return;
        }

        try {
          dataChannel.send(arrayBuffer);
        } catch (e) {
          // send failed; try once more after short wait
          await new Promise(r => setTimeout(r, 200));
          try { dataChannel.send(arrayBuffer); } catch (e2) {
            if (transferId) updateFileTransfer(transferId, { status: 'failed' });
            return;
          }
        }

        offset += chunkSize;

        // Update progress
        if (transferId) {
          const progress = Math.min((offset / file.size) * 100, 100);
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const speed = elapsed > 0 ? offset / elapsed : 0; // bytes per second
          const eta = speed > 0 ? (file.size - offset) / speed : 0; // seconds remaining
          updateFileTransfer(transferId, { progress, speed, eta });
        }

        // Wait for buffer to drain a bit before continuing
        const MAX_BUFFERED = 2 * 1024 * 1024; // 2MB
        if (typeof dataChannel.bufferedAmount === 'number' && dataChannel.bufferedAmount > MAX_BUFFERED) {
          await waitForBufferedAmountLow(dataChannel, Math.floor(MAX_BUFFERED / 2));
        }
      }

      // Finalize transfer
      try {
        dataChannel.send(JSON.stringify({ type: 'fileComplete', fileName: file.name }));
      } catch (e) {
        // ignore
      }

      if (transferId) {
        updateFileTransfer(transferId, { progress: 100, status: 'completed' });
      }
    };
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

            sendFile(dataChannel, file, transferId);
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
          });
        }
      };

      // Create offer and set up signaling
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through Firebase signaling (use update to avoid stomping candidates)
      const signalingRef = ref(db, `signaling/${requestId}`);
      await update(signalingRef, {
        type: 'offer',
        sdp: offer.sdp,
        from: user.uid,
      });

      // Listen for answer
      const unsubscribe = onValue(signalingRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

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

        // Handle ICE candidates
        if (data.candidates) {
          Object.entries(data.candidates).forEach(([userId, candidates]: [string, any]) => {
            if (userId !== user.uid) {
              Object.values(candidates).forEach((candidateData: any) => {
                const candidate = new RTCIceCandidate({
                  candidate: candidateData.candidate,
                  sdpMLineIndex: candidateData.sdpMLineIndex,
                  sdpMid: candidateData.sdpMid,
                });
                pc.addIceCandidate(candidate);
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
      }, 5 * 60 * 1000);
    }, [user]);


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
