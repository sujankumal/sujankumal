"use client";

import { useState, useEffect } from 'react';
import { P2PProvider } from '../../../contexts/P2PContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { P2PFileShare } from '../../../components/p2p/P2PFileShare';
import { AuthGuard } from '../../../components/p2p/AuthGuard';
import { P2PHeader } from '../../../components/p2p/P2PHeader';

// console.log('📄 P2P Share page loading...');

export default function P2PSharePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Main P2P Application */}
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
      </div>
    </div>
  );
}
