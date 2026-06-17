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

    let sql = `
      SELECT st.*, cp.name AS photo_name 
      FROM share_tokens st
      LEFT JOIN car_photos cp ON st.photo_id = cp.id
    `;
    const params = [];

    if (user.username !== 'dev') {
      sql += ` WHERE st.revoked = 0 AND st.expires_at > CURRENT_TIMESTAMP()`;
    }

    sql += ` ORDER BY st.id DESC`;

    const tokens = await query(sql, params);
    
    return NextResponse.json({ success: true, tokens });
  } catch (err) {
    console.error('List share tokens error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
