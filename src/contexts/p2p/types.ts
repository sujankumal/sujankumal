/**
 * Shared types for the P2P file-transfer system.
 * Kept in their own file so UI components can import types without pulling in
 * the heavy provider logic.
 */

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

export interface P2PContextType {
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
