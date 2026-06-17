import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { query, initDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await initDB();

    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is verplicht' }, { status: 400 });
    }

    // Get media details
    const media = await query('SELECT * FROM car_photos WHERE id = ?', [mediaId]);
    if (media.length === 0) {
      return NextResponse.json({ error: 'Media niet gevonden' }, { status: 404 });
    }

    const fileRecord = media[0];

    // Safely delete file from disk if it's not a pre-seeded mock asset
    if (fileRecord.filepath && !fileRecord.filepath.includes('/mock/')) {
      const filename = path.basename(fileRecord.filepath);
      const fullDiskPath = path.join(process.cwd(), 'public', 'uploads', filename);
      try {
        await fs.unlink(fullDiskPath);
        console.log(`[Disk] Deleted file: ${fullDiskPath}`);
      } catch (err) {
        console.warn(`[Disk] File not found or could not delete: ${fullDiskPath}`);
      }
    }

    // Delete database record
    await query('DELETE FROM car_photos WHERE id = ?', [mediaId]);
    console.log(`[DB] Deleted media record id: ${mediaId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Media API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
