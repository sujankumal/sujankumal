"use client";

import { createContext, useContext } from 'react';
import type { P2PContextType } from './types';

export const P2PContext = createContext<P2PContextType | undefined>(undefined);

export function useP2P(): P2PContextType {
  const context = useContext(P2PContext);
  if (context === undefined) {
    throw new Error('useP2P must be used within a P2PProvider');
  }
  return context;
}
