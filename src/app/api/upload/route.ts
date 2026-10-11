import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, angleKey, caseId } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Strip header if data URL
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Attempt to write to local disk if filesystem is writable
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${caseId || 'case'}_${Date.now()}_${angleKey || 'photo'}.jpg`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/photos/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
        sizeBytes: buffer.length,
      });
    } catch (fsError) {
      // In serverless environments like Netlify/Vercel where public/ is read-only,
      // return the data URL directly so client-side testing works seamlessly
      console.warn('Filesystem write not allowed (serverless detected), using direct data URL:', fsError);
      return NextResponse.json({
        success: true,
        url: imageBase64,
        filename: `${caseId || 'case'}_${Date.now()}_${angleKey || 'photo'}.jpg`,
        sizeBytes: buffer.length,
        isServerlessFallback: true,
      });
    }
  } catch (error) {
    console.error('Error saving uploaded photo:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
