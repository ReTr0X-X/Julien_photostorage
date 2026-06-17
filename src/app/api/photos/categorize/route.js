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

    const { id, category } = await request.json();
    if (!id || !category) {
      return NextResponse.json({ error: 'Id en categorie zijn verplicht' }, { status: 400 });
    }

    await query(
      'UPDATE car_photos SET category = ?, subfolder = NULL WHERE id = ?',
      [category, id]
    );

    console.log(`[DB] Reassigned photo id ${id} to category: ${category}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Categorize API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
