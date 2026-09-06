import { NextResponse } from 'next/server';
import { database as adminDatabase } from '@/lib/firebase';
import { requireVerifiedUser } from '@/services/authorization';

export async function GET(_req: Request, context: any) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  const { params } = context || {};
  const { action } = params || {};

  if (action === 'getData') {
    try {
      if (!adminDatabase) {
        // Admin SDK not initialized in this environment
        return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
      }
      const snap = await adminDatabase.ref('path/to/data').once('value');
      if (!snap.exists()) {
        return NextResponse.json(
          { error: 'Data not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(snap.val());
    } catch (error) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}