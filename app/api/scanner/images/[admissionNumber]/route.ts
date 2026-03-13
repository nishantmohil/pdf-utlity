import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'scanned-documents');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ admissionNumber: string }> }
) {
  try {
    const { admissionNumber } = await params;
    const sanitizedAdmission = admissionNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const studentDir = path.join(BASE_DIR, sanitizedAdmission);

    // Check if directory exists
    try {
      await stat(studentDir);
    } catch {
      return NextResponse.json({ images: [], count: 0 });
    }

    const files = await readdir(studentDir);
    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(f)
    );

    const images = imageFiles.map((filename) => ({
      filename,
      url: `/api/scanner/images/serve?admission=${encodeURIComponent(sanitizedAdmission)}&file=${encodeURIComponent(filename)}`,
      documentType: filename.split('_').slice(0, -1).join('_').replace(/_/g, ' '),
      uploadedAt: parseInt(filename.split('_').pop()?.split('.')[0] || '0'),
    }));

    // Sort by most recent first
    images.sort((a, b) => b.uploadedAt - a.uploadedAt);

    return NextResponse.json({ images, count: images.length });
  } catch (error) {
    console.error('List images error:', error);
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
}
