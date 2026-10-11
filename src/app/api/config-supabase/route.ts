import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { url, key } = await req.json();
    if (!url || !key) {
      return NextResponse.json({ error: 'URL and Key are required' }, { status: 400 });
    }

    // Write to .env.local on the local machine
    const envPath = path.join(process.cwd(), '.env.local');
    const content = `# Supabase Cloud Database Configuration\nNEXT_PUBLIC_SUPABASE_URL=${url.trim()}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key.trim()}\n`;
    fs.writeFileSync(envPath, content, 'utf-8');

    return NextResponse.json({ success: true, message: 'Saved to .env.local' });
  } catch {
    return NextResponse.json({ success: false, message: 'Serverless environment, skipped file write' });
  }
}
