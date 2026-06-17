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

    if (!env) {
      return NextResponse.json({ error: 'Parameter "env" is verplicht' }, { status: 400 });
    }

    let subfolders;
    if (category === 'all' || !category) {
      subfolders = await query(
        'SELECT * FROM subfolders WHERE env = ? ORDER BY name ASC',
        [env]
      );
    } else {
      subfolders = await query(
        'SELECT * FROM subfolders WHERE env = ? AND category = ? ORDER BY name ASC',
        [env, category]
      );
    }

    return NextResponse.json({ subfolders });
  } catch (err) {
    console.error('Failed to fetch subfolders:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { category, name, env } = await request.json();
    if (!category || !name || !env) {
      return NextResponse.json({ error: 'Categorie, naam en omgeving zijn verplicht' }, { status: 400 });
    }

    const cleanName = name.trim();
    if (!cleanName) {
      return NextResponse.json({ error: 'Naam mag niet leeg zijn' }, { status: 400 });
    }

    // Insert into DB
    await query(
      'INSERT INTO subfolders (category, name, env) VALUES (?, ?, ?)',
      [category.toLowerCase().trim(), cleanName, env]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to create subfolder:', err);
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Map bestaat al' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const name = searchParams.get('name');
    const env = searchParams.get('env');

    if (!category || !name || !env) {
      return NextResponse.json({ error: 'Categorie, naam en omgeving zijn verplicht' }, { status: 400 });
    }

    const cleanCategory = category.toLowerCase().trim();
    const cleanName = name.trim();

    // Delete folder entry
    await query(
      'DELETE FROM subfolders WHERE category = ? AND name = ? AND env = ?',
      [cleanCategory, cleanName, env]
    );

    // Revert all photos in that folder to the root category (subfolder = NULL)
    await query(
      'UPDATE car_photos SET subfolder = NULL WHERE category = ? AND subfolder = ? AND env = ?',
      [cleanCategory, cleanName, env]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete subfolder:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
