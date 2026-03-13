import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'scanned-documents');

export async function GET() {
  try {
    // Ensure base dir exists
    try {
      await stat(BASE_DIR);
    } catch {
      return NextResponse.json({ students: [], count: 0 });
    }

    const entries = await readdir(BASE_DIR, { withFileTypes: true });
    const students = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const studentDir = path.join(BASE_DIR, entry.name);
      const files = await readdir(studentDir);
      const imageFiles = files.filter((f) =>
        /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(f)
      );

      if (imageFiles.length > 0) {
        // Get most recent timestamp from filenames
        let latestTimestamp = 0;
        for (const file of imageFiles) {
          const ts = parseInt(file.split('_').pop()?.split('.')[0] || '0');
          if (ts > latestTimestamp) latestTimestamp = ts;
        }

        students.push({
          admissionNumber: entry.name,
          documentCount: imageFiles.length,
          lastUpdated: latestTimestamp,
        });
      }
    }

    // Sort by most recently updated
    students.sort((a, b) => b.lastUpdated - a.lastUpdated);

    return NextResponse.json({ students, count: students.length });
  } catch (error) {
    console.error('List students error:', error);
    return NextResponse.json(
      { error: 'Failed to list students' },
      { status: 500 }
    );
  }
}
