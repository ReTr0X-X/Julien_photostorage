import { NextResponse } from 'next/server';
import { query, initDB, hashPassword } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

function isAdmin(username) {
  return username === 'dev';
}

export async function GET(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    if (isAdmin(user.username)) {
      const users = await query('SELECT id, username, name, email, avatar_path, created_at FROM users ORDER BY username ASC');
      return NextResponse.json({ users });
    } else {
      const users = await query('SELECT id, username, name, email, avatar_path, created_at FROM users WHERE username = ?', [user.username]);
      return NextResponse.json({ users });
    }
  } catch (err) {
    console.error('Fetch users API error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (!isAdmin(user.username)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await initDB();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return NextResponse.json({ error: 'Gebruikersnaam mag niet leeg zijn' }, { status: 400 });
    }

    const pwhash = hashPassword(password);

    await query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [cleanUsername, pwhash]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Create user API error:', err);
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Gebruikersnaam bestaat al' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const contentType = request.headers.get('content-type') || '';
    let id, username, name, email, oldPassword, newPassword, avatarFile;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      id = formData.get('id');
      username = formData.get('username');
      name = formData.get('name');
      email = formData.get('email');
      oldPassword = formData.get('oldPassword');
      newPassword = formData.get('newPassword');
      avatarFile = formData.get('avatar');
    } else {
      const data = await request.json();
      id = data.id;
      username = data.username;
      name = data.name;
      email = data.email;
      oldPassword = data.oldPassword;
      newPassword = data.newPassword;
    }

    // Resolve target user
    let targetUsername = username;
    let targetId = id;

    if (targetId) {
      const dbUsers = await query('SELECT username FROM users WHERE id = ?', [targetId]);
      if (dbUsers && dbUsers.length > 0) {
        targetUsername = dbUsers[0].username;
      }
    } else if (targetUsername) {
      const dbUsers = await query('SELECT id FROM users WHERE username = ?', [targetUsername]);
      if (dbUsers && dbUsers.length > 0) {
        targetId = dbUsers[0].id;
      }
    } else {
      targetUsername = user.username;
      const dbUsers = await query('SELECT id FROM users WHERE username = ?', [targetUsername]);
      if (dbUsers && dbUsers.length > 0) {
        targetId = dbUsers[0].id;
      }
    }

    if (!targetId || !targetUsername) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const isSelf = targetUsername === user.username;

    // Handle avatar file upload if present
    let avatarPath = null;
    if (avatarFile && typeof avatarFile.arrayBuffer === 'function' && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const originalName = avatarFile.name || 'avatar.png';
      const fileExt = originalName.split('.').pop() || 'png';
      const cleanUsername = targetUsername.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `avatar_${cleanUsername}_${Date.now()}.${fileExt}`;
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      avatarPath = `/uploads/${fileName}`;
    }

    // Case 1: Self-update
    if (isSelf) {
      // Validate old password if changing password
      if (newPassword && newPassword.trim()) {
        if (!oldPassword) {
          return NextResponse.json({ error: 'Huidig wachtwoord is verplicht om het wachtwoord te wijzigen' }, { status: 400 });
        }
        const dbUsers = await query('SELECT password_hash FROM users WHERE id = ?', [targetId]);
        const expectedOldHash = hashPassword(oldPassword);
        if (dbUsers[0].password_hash !== expectedOldHash) {
          return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 400 });
        }
        const newHash = hashPassword(newPassword);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, targetId]);
      }

      // Update name & email & avatar
      if (name !== undefined) {
        await query('UPDATE users SET name = ? WHERE id = ?', [name ? name.trim() : null, targetId]);
      }
      if (email !== undefined) {
        await query('UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, targetId]);
      }
      if (avatarPath) {
        await query('UPDATE users SET avatar_path = ? WHERE id = ?', [avatarPath, targetId]);
      }

      return NextResponse.json({ success: true, avatar_path: avatarPath });
    }

    // Case 2: Admin reset/override
    if (!isAdmin(user.username)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    if (newPassword && newPassword.trim()) {
      const newHash = hashPassword(newPassword);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, targetId]);
    }
    if (name !== undefined) {
      await query('UPDATE users SET name = ? WHERE id = ?', [name ? name.trim() : null, targetId]);
    }
    if (email !== undefined) {
      await query('UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, targetId]);
    }
    if (avatarPath) {
      await query('UPDATE users SET avatar_path = ? WHERE id = ?', [avatarPath, targetId]);
    }

    return NextResponse.json({ success: true, avatar_path: avatarPath });
  } catch (err) {
    console.error('Update user profile API error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (!isAdmin(user.username)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await initDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Gebruiker-ID is verplicht' }, { status: 400 });
    }

    const targetUsers = await query('SELECT username FROM users WHERE id = ?', [id]);
    if (!targetUsers || targetUsers.length === 0) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const targetUsername = targetUsers[0].username;

    // Prevent deleting oneself
    if (targetUsername === user.username) {
      return NextResponse.json({ error: 'Je kunt je eigen account niet verwijderen' }, { status: 400 });
    }

    // Prevent deleting the main admin 'dev'
    if (targetUsername === 'dev') {
      return NextResponse.json({ error: 'Kan de administrator dev niet verwijderen' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    console.log(`[DB] Admin deleted user ${targetUsername} (ID ${id}).`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete user API error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
