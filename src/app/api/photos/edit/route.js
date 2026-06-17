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

    const { id, name, env, category, subfolder, location, date_taken, description } = await request.json();

    if (!id || !name || !env || !category || !location || !date_taken) {
      return NextResponse.json({ error: 'Vereiste velden ontbreken' }, { status: 400 });
    }

    // Update in database
    await query(
      `UPDATE car_photos 
       SET name = ?, env = ?, category = ?, subfolder = ?, location = ?, date_taken = ?, description = ?
       WHERE id = ?`,
      [name, env, category, subfolder && subfolder !== 'none' ? subfolder : null, location, date_taken, description || '', id]
    );

    console.log(`[DB] Updated photo id ${id} metadata successfully.`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Edit Photo API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
