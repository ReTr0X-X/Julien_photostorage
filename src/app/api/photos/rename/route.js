import { NextResponse } from 'next/server';
import { query, initDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { id, name } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: 'Id en naam zijn verplicht' }, { status: 400 });
    }

    await query(
      'UPDATE car_photos SET name = ? WHERE id = ?',
      [name.trim(), id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Rename Photo API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
