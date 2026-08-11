"use client";

import { useState, useEffect } from 'react';
import { P2PProvider } from '../../contexts/P2PContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { P2PFileShare } from './P2PFileShare';
import { AuthGuard } from './AuthGuard';
import { P2PHeader } from './P2PHeader';

export function P2PPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <P2PProvider>
        <P2PHeader />
        <main className="py-8">
          <AuthGuard>
            <P2PFileShare />
          </AuthGuard>
        </main>
      </P2PProvider>
    </AuthProvider>
  );
}
