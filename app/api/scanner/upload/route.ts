import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'scanned-documents');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const admissionNumber = formData.get('admissionNumber') as string | null;
    const documentType = formData.get('documentType') as string | null;

    if (!image || !admissionNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: image and admissionNumber' },
        { status: 400 }
      );
    }

    // Sanitize admission number for folder name
    const sanitizedAdmission = admissionNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const studentDir = path.join(BASE_DIR, sanitizedAdmission);

    // Create directory if it doesn't exist
    await mkdir(studentDir, { recursive: true });

    // Build filename
    const timestamp = Date.now();
    const ext = image.name?.split('.').pop() || 'jpg';
    const typeLabel = documentType
      ? documentType.replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'document';
    const filename = `${typeLabel}_${timestamp}.${ext}`;
    const filePath = path.join(studentDir, filename);

    // Write the file
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      admissionNumber: sanitizedAdmission,
      message: `Document saved successfully`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
