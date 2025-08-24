import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(_req: Request, context: any) {
  const { params } = context || {};
  const { action } = params || {};

  if (action === 'getData') {
    try {
      const dbRef = ref(database, 'path/to/data');
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return NextResponse.json(snapshot.val());
      } else {
        return NextResponse.json({ error: 'Data not found' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}