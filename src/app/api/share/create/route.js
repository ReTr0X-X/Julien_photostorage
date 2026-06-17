import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, initDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { photoId, durationDays } = await request.json();

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is verplicht' }, { status: 400 });
    }

    // Check if the photo actually exists
    const photo = await query('SELECT id FROM car_photos WHERE id = ?', [photoId]);
    if (!photo || photo.length === 0) {
      return NextResponse.json({ error: 'Voertuig niet gevonden' }, { status: 404 });
    }

    // 1. Check if there is already an active, non-expired, non-revoked token for this photoId
    const existingTokens = await query(
      'SELECT token, expires_at FROM share_tokens WHERE photo_id = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP() LIMIT 1',
      [photoId]
    );
    if (existingTokens && existingTokens.length > 0) {
      return NextResponse.json({
        success: true,
        token: existingTokens[0].token,
        expires_at: existingTokens[0].expires_at,
        existing: true
      });
    }

    // 2. Limit check: Max 4 active share links globally.
    // If we have 4 or more active, deactivate/revoke the oldest active one.
    const activeTokens = await query(
      'SELECT id FROM share_tokens WHERE revoked = 0 AND expires_at > CURRENT_TIMESTAMP() ORDER BY id ASC'
    );
    if (activeTokens.length >= 4) {
      const oldestTokenId = activeTokens[0].id;
      await query('UPDATE share_tokens SET revoked = 1 WHERE id = ?', [oldestTokenId]);
    }

    // 3. Create a new token with custom/default duration
    const token = crypto.randomBytes(16).toString('hex');
    const days = durationDays ? parseInt(durationDays, 10) : 3;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // MySQL datetime format: YYYY-MM-DD HH:MM:SS
    const mysqlFormattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    await query(
      'INSERT INTO share_tokens (token, photo_id, created_by, expires_at) VALUES (?, ?, ?, ?)',
      [token, photoId, user.username, mysqlFormattedExpiresAt]
    );

    return NextResponse.json({ success: true, token, expires_at: mysqlFormattedExpiresAt });
  } catch (err) {
    console.error('Create share token error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
