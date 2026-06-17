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
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is verplicht' }, { status: 400 });
    }

    const activeTokens = await query(
      'SELECT id, token, expires_at, created_by FROM share_tokens WHERE photo_id = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP() LIMIT 1',
      [photoId]
    );

    if (activeTokens && activeTokens.length > 0) {
      return NextResponse.json({ success: true, activeToken: activeTokens[0] });
    }

    return NextResponse.json({ success: true, activeToken: null });
  } catch (err) {
    console.error('Active share token error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
