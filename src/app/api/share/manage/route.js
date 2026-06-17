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

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Ontbrekende parameters' }, { status: 400 });
    }

    if (action === 'revoke') {
      await query('UPDATE share_tokens SET revoked = 1 WHERE id = ?', [id]);
    } else if (action === 'extend') {
      if (user.username !== 'dev') {
        return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 });
      }
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      const mysqlFormattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
      
      await query('UPDATE share_tokens SET expires_at = ?, revoked = 0 WHERE id = ?', [mysqlFormattedExpiresAt, id]);
    } else {
      return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Manage share token error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
