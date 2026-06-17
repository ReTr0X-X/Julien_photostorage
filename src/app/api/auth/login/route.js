import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, verifyPassword, initDB } from '@/lib/db';

export async function POST(request) {
  try {
    // Make sure database and tables exist
    await initDB();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE username = ?', [username]);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Ongeldige gebruikersnaam of wachtwoord' }, { status: 401 });
    }

    const user = users[0];
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Ongeldige gebruikersnaam of wachtwoord' }, { status: 401 });
    }

    // Generate custom secure session token
    const hmac = crypto.createHmac('sha256', 'ems_vault_jwt_secret_2026').update(user.username).digest('hex');
    const token = `${user.username}:${hmac}`;

    const response = NextResponse.json({ success: true, username: user.username });
    
    // Set HTTP-only cookie
    response.cookies.set('ems_vault_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax'
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
