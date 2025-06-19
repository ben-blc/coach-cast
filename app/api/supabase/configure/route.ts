import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { url, anonKey, serviceKey } = await request.json();

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'URL and Anonymous Key are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Supabase URL format' },
        { status: 400 }
      );
    }

    // Create environment variables content
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
${serviceKey ? `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}` : ''}

# Generated automatically by Coach Cast setup
SUPABASE_CONFIGURED=true
`;

    // Write to .env.local file
    const envPath = join(process.cwd(), '.env.local');
    await writeFile(envPath, envContent, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving Supabase configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}