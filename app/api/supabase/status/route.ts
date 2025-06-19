import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const configured = process.env.SUPABASE_CONFIGURED;

    const isConfigured = !!(
      supabaseUrl && 
      supabaseAnonKey && 
      configured === 'true' &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseAnonKey.includes('placeholder')
    );

    return NextResponse.json({
      configured: isConfigured,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
  } catch (error) {
    return NextResponse.json(
      { configured: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}