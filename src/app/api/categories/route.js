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

    const categories = await query('SELECT * FROM categories ORDER BY id ASC');
    return NextResponse.json({ categories });
  } catch (err) {
    console.error('Failed to fetch categories:', err);
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

    const { name, emoji } = await request.json();
    if (!name || !emoji) {
      return NextResponse.json({ error: 'Naam en emoji zijn verplicht' }, { status: 400 });
    }

    // Insert into DB
    await query(
      'INSERT INTO categories (name, emoji) VALUES (?, ?)',
      [name.toLowerCase().trim(), emoji.trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to create category:', err);
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Categorie bestaat al' }, { status: 400 });
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

    const { oldName, newName, emoji } = await request.json();
    if (!oldName || !newName) {
      return NextResponse.json({ error: 'Oude en nieuwe naam zijn verplicht' }, { status: 400 });
    }

    const cleanOld = oldName.toLowerCase().trim();
    const cleanNew = newName.toLowerCase().trim();

    // Update category table
    await query(
      'UPDATE categories SET name = ?, emoji = ? WHERE name = ?',
      [cleanNew, emoji || '📁', cleanOld]
    );

    // Update photos belonging to this category
    await query(
      'UPDATE car_photos SET category = ? WHERE category = ?',
      [cleanNew, cleanOld]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to rename category:', err);
    if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Nieuwe categorienaam bestaat al' }, { status: 400 });
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
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
    }

    const cleanName = name.toLowerCase().trim();

    // Safety check: Don't allow deleting the last category
    const categoryCount = await query('SELECT COUNT(*) as cnt FROM categories');
    if (categoryCount[0].cnt <= 1) {
      return NextResponse.json({ error: 'Kan de laatste map/categorie niet verwijderen' }, { status: 400 });
    }

    // Get the first available category to move photos to
    const fallbackCategories = await query('SELECT name FROM categories WHERE name != ? LIMIT 1', [cleanName]);
    const fallbackName = fallbackCategories[0]?.name || 'politie';

    // Delete category
    await query('DELETE FROM categories WHERE name = ?', [cleanName]);

    // Move photos in deleted category to fallback
    await query(
      'UPDATE car_photos SET category = ? WHERE category = ?',
      [fallbackName, cleanName]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete category:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
