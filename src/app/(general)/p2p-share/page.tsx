import { Suspense } from 'react';
import { P2PPageClient } from '../../../components/p2p/P2PPageClient';

export const instant = false;

export default function P2PSharePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <P2PPageClient />
        </Suspense>
      </div>
    </div>
  );
}
