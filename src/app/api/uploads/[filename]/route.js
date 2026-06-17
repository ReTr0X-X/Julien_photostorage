import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    const fileBuffer = await fs.promises.readFile(filePath);

    // Determine content type based on extension
    let contentType = 'image/jpeg';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.mp4' || ext === '.mov' || ext === '.webm') {
      contentType = 'video/mp4';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
    });
  } catch (e) {
    return new NextResponse('Bestand niet gevonden', { status: 404 });
  }
}
