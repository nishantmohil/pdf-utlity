import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'scanned-documents');

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admission = searchParams.get('admission');
    const file = searchParams.get('file');

    if (!admission || !file) {
      return NextResponse.json(
        { error: 'Missing admission or file parameter' },
        { status: 400 }
      );
    }

    // Sanitize to prevent path traversal
    const sanitizedAdmission = admission.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFile = path.basename(file);
    const filePath = path.join(BASE_DIR, sanitizedAdmission, sanitizedFile);

    // Verify the file exists and is within the base directory
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(BASE_DIR))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    try {
      await stat(resolvedPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(sanitizedFile).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Serve image error:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
