import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const result: {
    app: string;
    supabaseConfigured: boolean;
    supabaseReachable: boolean | null;
    supabaseHttpStatus: number | null;
    geminiConfigured: boolean;
    youtubeConfigured: boolean;
  } = {
    app: 'BuildBridge',
    supabaseConfigured: Boolean(url && key),
    supabaseReachable: null,
    supabaseHttpStatus: null,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
  };

  if (url && key) {
    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: { apikey: key },
        cache: 'no-store',
      });
      result.supabaseHttpStatus = response.status;
      result.supabaseReachable = response.ok;
    } catch {
      result.supabaseReachable = false;
    }
  }

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
