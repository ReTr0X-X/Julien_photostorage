import { NextResponse } from 'next/server';
import { query, initDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { searchParams } = new URL(request.url);
    const env = searchParams.get('env');
    const category = searchParams.get('category');

    if (!env || !category) {
      return NextResponse.json({ error: 'Parameters "env" en "category" zijn verplicht' }, { status: 400 });
    }

    let photosList;
    if (category === 'all') {
      photosList = await query(
        'SELECT * FROM car_photos WHERE env = ? ORDER BY id DESC',
        [env]
      );
    } else if (category === 'photos') {
      photosList = await query(
        'SELECT * FROM car_photos WHERE env = ? AND filetype = ? ORDER BY id DESC',
        [env, 'image']
      );
    } else if (category === 'videos') {
      photosList = await query(
        'SELECT * FROM car_photos WHERE env = ? AND filetype = ? ORDER BY id DESC',
        [env, 'video']
      );
    } else {
      photosList = await query(
        'SELECT * FROM car_photos WHERE env = ? AND category = ? ORDER BY id DESC',
        [env, category]
      );
    }

    return NextResponse.json({ photos: photosList });
  } catch (err) {
    console.error('Failed to fetch photos:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
