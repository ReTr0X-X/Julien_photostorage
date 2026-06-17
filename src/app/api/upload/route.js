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

    const formData = await request.formData();
    const files = formData.getAll('files');
    const env = formData.get('env') || 'irl';
    const category = formData.get('category') || 'politie';
    const subfolder = formData.get('subfolder') || null;
    const name = formData.get('name') || 'Naamloos Voertuig';
    const description = formData.get('description') || '';
    const date_taken = formData.get('date_taken') || 'Vandaag';
    const location = formData.get('location') || 'Onbekend';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Geen bestanden geleverd' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedPhotos = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;
      
      const filename = file.name;
      const filetypeStr = file.type;
      const size = file.size;

      // Determine filetype Category
      let type = 'image';
      if (filetypeStr.startsWith('video/')) {
        type = 'video';
      } else if (filetypeStr.startsWith('application/pdf') || filename.endsWith('.pdf')) {
        type = 'document';
      } else if (filetypeStr.startsWith('image/')) {
        type = 'image';
      } else {
        const ext = path.extname(filename).toLowerCase();
        if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
          type = 'video';
        } else if (['.pdf', '.docx', '.txt', '.log'].includes(ext)) {
          type = 'document';
        } else {
          type = 'image';
        }
      }

      // Generate a unique filename on disk
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(filename);
      const cleanFilename = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const diskFilename = `${cleanFilename}-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadDir, diskFilename);

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filepath, buffer);

      const webPath = `/api/uploads/${diskFilename}`;

      // Save to database
      const result = await query(
        `INSERT INTO car_photos (env, category, subfolder, name, description, date_taken, location, filename, filepath, filetype, filesize) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [env, category, subfolder && subfolder !== 'none' ? subfolder : null, name, description, date_taken, location, filename, webPath, type, size]
      );

      uploadedPhotos.push({
        id: result.insertId,
        env,
        category,
        subfolder: subfolder && subfolder !== 'none' ? subfolder : null,
        name,
        description,
        date_taken,
        location,
        filename,
        filepath: webPath,
        filetype: type,
        filesize: size
      });
    }

    return NextResponse.json({ success: true, photos: uploadedPhotos });
  } catch (err) {
    console.error('Upload API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
