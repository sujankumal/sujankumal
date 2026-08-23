"use client";

/**
 * Re-export shell — all P2P context logic and helpers have been split into
 * modular files under `./p2p/`:
 *   - types.ts: Shared interfaces (FileTransfer, PeerUser, ShareRequest, etc.)
 *   - _idb.ts: IndexedDB helpers for crypto key storage
 *   - _crypto.ts: Pure Web Crypto utilities (encoding, hashing, ephemeral keys)
 *   - P2PProvider.tsx: React provider and useP2P hook
 *
 * This file preserves all existing imports of `@/contexts/P2PContext`.
 */

export * from "./p2p/types";
export { P2PProvider, useP2P } from "./p2p/P2PProvider";
