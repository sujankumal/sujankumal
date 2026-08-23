"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ref, set, push, update, onValue, remove } from 'firebase/database';
import { ensureClientInitialized, database } from '@/lib/firebase.client';
import { useAuth } from '@/contexts/AuthContext';
import { BROWSER_ONLY_MAX_FILE_SIZE } from './_constants';
import { P2PContext } from './P2PContext';
import { sendFile, startFileTransfer } from './_sender';
import { setupWebRTCReceiver } from './_receiver';
import type {
  FileTransfer,
  PeerUser,
  ShareRequest,
  OverallProgress,
  P2PContextType,
} from './types';

// Re-export hook and types for convenience
export { useP2P } from './P2PContext';
export type { FileTransfer, PeerUser, ShareRequest, OverallProgress };

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

  // ── Session & Transfer Tracking Refs ───────────────────────────────────────
  const pausedTransfersRef = useRef<Set<string>>(new Set());
  const cancelledTransfersRef = useRef<Set<string>>(new Set());
  const transferFilesRef = useRef<Map<string, { file: File; requestId: string; dataChannel: RTCDataChannel }>>(
    new Map()
  );
  const e2eeEphemeralRef = useRef<Record<string, { priv?: CryptoKey; pubRaw?: string; salt?: string }>>({});
  const e2eeKeysRef = useRef<Record<string, CryptoKey>>({});
  const candidateQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const lastProgressUpdateRef = useRef<Record<string, number>>({});
  const sendFileRef = useRef<((dc: RTCDataChannel, file: File, transferId?: string, sessionId?: string) => Promise<void>) | null>(null);

  // Ensure Firebase client is ready
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureClientInitialized().catch(() => {});
  }, []);

  // ── Transfer State Helpers ────────────────────────────────────────────────
  const addFileTransfer = useCallback((transfer: Omit<FileTransfer, 'id'>) => {
    const newTransfer: FileTransfer = {
      ...transfer,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    setFileTransfers((prev) => [...prev, newTransfer]);
    return newTransfer.id;
  }, []);

  const addFileTransferWithId = useCallback((id: string, transfer: Omit<FileTransfer, 'id'>) => {
    setFileTransfers((previous) => [...previous, { ...transfer, id }]);
    return id;
  }, []);

  const updateFileTransfer = useCallback((id: string, updates: Partial<FileTransfer>) => {
    if (updates.progress !== undefined && updates.status === undefined) {
      const now = Date.now();
      const lastUpdate = lastProgressUpdateRef.current[id] || 0;
      if (now - lastUpdate < 150 && updates.progress < 100) {
        return;
      }
      lastProgressUpdateRef.current[id] = now;
    }
    setFileTransfers((prev) =>
      prev.map((transfer) => (transfer.id === id ? { ...transfer, ...updates } : transfer))
    );
  }, []);

  // ── Transfer Controls (Pause, Resume, Cancel, Retry, Clear) ───────────────
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
    pausedTransfersRef.current.delete(id);
    updateFileTransfer(id, { status: 'cancelled', completedAt: Date.now() });

    const entry = transferFilesRef.current.get(id);
    if (entry?.dataChannel && entry.dataChannel.readyState === 'open') {
      try {
        entry.dataChannel.send(JSON.stringify({ type: 'transfer-cancel', transferId: id }));
      } catch {}
    }
    transferFilesRef.current.delete(id);
  }, [updateFileTransfer]);

  const clearHistory = useCallback(() => {
    setFileTransfers((prev) =>
      prev.filter(
        (t) => t.status === 'transferring' || t.status === 'finalizing' || t.status === 'paused'
      )
    );
  }, []);

  // ── Firebase Presence Listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!database) {
      setAvailabilityLoaded(true);
      return;
    }

    const userStatusRef = ref(database, `users/${user.uid}/status`);
    const unsubscribe = onValue(
      userStatusRef,
      (snapshot) => {
        const statusData = snapshot.val();
        setIsAvailable(statusData && typeof statusData.available === 'boolean' ? statusData.available : false);
        setAvailabilityLoaded(true);
      },
      () => setAvailabilityLoaded(true)
    );

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [user]);

  const setAvailable = useCallback(async (available: boolean) => {
    if (!user) return;
    setIsAvailable(available);
    if (!database) return;
    const userRef = ref(database, `users/${user.uid}/status`);
    try {
      await set(userRef, { online: true, available, lastSeen: Date.now() });
    } catch {
      setIsAvailable(!available);
    }
  }, [user]);

  // Listen for online/available peers
  useEffect(() => {
    if (!user || !database) return;
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: PeerUser[] = [];
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
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
      try { unsubscribe(); } catch {}
    };
  }, [user]);

  // Listen for incoming share requests
  useEffect(() => {
    if (!user || !database) return;
    const requestsRef = ref(database, `shareRequests/${user.uid}`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests: ShareRequest[] = [];
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([id, requestData]: [string, any]) => {
          requests.push({ id, ...requestData });
        });
      }
      setShareRequests(requests.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [user]);

  // ── Share Request Actions ─────────────────────────────────────────────────
  const sendShareRequest = useCallback(
    async (toUserId: string, files: File[], requestId: string, message?: string) => {
      if (!user) return;
      const toUser = availableUsers.find((u) => u.uid === toUserId);
      if (!toUser) throw new Error('User not found');

      const requestData: Omit<ShareRequest, 'id'> = {
        requestId,
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Anonymous User',
        toUserId,
        toUserName: toUser.displayName,
        files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
        status: 'pending',
        timestamp: Date.now(),
        ...(message && { message }),
      };

      if (!database) throw new Error('Database not initialized');
      const requestsRef = ref(database, `shareRequests/${toUserId}`);
      await push(requestsRef, requestData);
    },
    [user, availableUsers]
  );

  const rejectShareRequest = useCallback(
    async (requestId: string) => {
      if (!user || !database) return;
      const requestRef = ref(database, `shareRequests/${user.uid}/${requestId}`);
      await remove(requestRef);
    },
    [user]
  );

  // ── Receiver Connection Orchestration ────────────────────────────────────
  const acceptShareRequest = useCallback(
    async (requestId: string) => {
      if (!user) return;
      const request = shareRequests.find((r) => r.id === requestId);
      if (!request) return;

      let destinationDirectory: any = null;
      const supportsDiskStreaming = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
      if (
        !supportsDiskStreaming &&
        request.files.some((file) => file.size > BROWSER_ONLY_MAX_FILE_SIZE)
      ) {
        alert(
          'This browser supports files up to 500 MB. Use Chrome or Edge on the receiving device for larger direct-to-folder transfers.'
        );
      }

      if (supportsDiskStreaming) {
        try {
          destinationDirectory = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        } catch {
          destinationDirectory = null;
        }
      }

      if (!database) return;
      const requestRef = ref(database, `shareRequests/${user.uid}/${requestId}`);
      await update(requestRef, { status: 'accepted', acceptedAt: Date.now() });

      await setupWebRTCReceiver(
        request.requestId,
        request.fromUserId,
        request.fromUserName,
        destinationDirectory,
        {
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
        }
      );
    },
    [user, shareRequests, addFileTransfer, addFileTransferWithId, updateFileTransfer]
  );

  // ── Sender Connection Orchestration ──────────────────────────────────────
  const senderDeps = useMemo(
    () => ({
      user,
      database,
      availableUsers,
      shareRequests,
      e2eeKeysRef,
      e2eeEphemeralRef,
      candidateQueueRef,
      processedCandidatesRef,
      pausedTransfersRef,
      cancelledTransfersRef,
      transferFilesRef,
      addFileTransfer,
      updateFileTransfer,
      setPeerConnection,
    }),
    [user, availableUsers, shareRequests, addFileTransfer, updateFileTransfer]
  );

  const startTransfer = useCallback(
    async (requestId: string, files: File[], receiverName?: string, receiverId?: string) => {
      await startFileTransfer(requestId, files, receiverName, receiverId, senderDeps);
    },
    [senderDeps]
  );

  // Keep forward ref updated for retries
  useEffect(() => {
    sendFileRef.current = (dc, file, transferId, sessionId) =>
      sendFile(dc, file, transferId, sessionId, senderDeps);
  }, [senderDeps]);

  const retryTransfer = useCallback(
    async (id: string) => {
      const entry = transferFilesRef.current.get(id);
      if (!entry) return;
      const { file, requestId, dataChannel } = entry;
      if (dataChannel.readyState !== 'open') return;

      cancelledTransfersRef.current.delete(id);
      pausedTransfersRef.current.delete(id);
      transferFilesRef.current.delete(id);
      setFileTransfers((prev) => prev.filter((t) => t.id !== id));

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

      transferFilesRef.current.set(newTransferId, { file, requestId, dataChannel });
      sendFileRef.current?.(dataChannel, file, newTransferId, requestId);
    },
    [addFileTransfer, user]
  );

  // ── Overall Progress (Derived) ────────────────────────────────────────────
  const overallProgress = useMemo((): OverallProgress => {
    const total = fileTransfers.length;
    const active = fileTransfers.filter(
      (t) => t.status === 'transferring' || t.status === 'preparing' || t.status === 'finalizing'
    ).length;
    const paused = fileTransfers.filter((t) => t.status === 'paused').length;
    const completed = fileTransfers.filter((t) => t.status === 'completed').length;
    const failed = fileTransfers.filter((t) => t.status === 'failed').length;
    const cancelled = fileTransfers.filter((t) => t.status === 'cancelled').length;
    const remaining = active + paused;
    const totalBytes = fileTransfers.reduce((a, t) => a + t.fileSize, 0);
    const transferredBytes = fileTransfers.reduce(
      (a, t) => a + (t.transferredBytes ?? (t.status === 'completed' ? t.fileSize : 0)),
      0
    );
    const overallPercent =
      totalBytes > 0 ? Math.min((transferredBytes / totalBytes) * 100, 100) : 0;
    return {
      total,
      active,
      paused,
      completed,
      failed,
      cancelled,
      remaining,
      totalBytes,
      transferredBytes,
      overallPercent,
    };
  }, [fileTransfers]);

  const value: P2PContextType = {
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
    startFileTransfer: startTransfer,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    retryTransfer,
    clearHistory,
    peerConnection,
  };

  return <P2PContext.Provider value={value}>{children}</P2PContext.Provider>;
}
