import { NextResponse } from 'next/server';
import { getSupabaseConfiguration } from '@/lib/supabase-config';

export async function GET() {
  const configuration = getSupabaseConfiguration();
  let supabaseStatus = configuration.error || 'not_checked';
  let supabaseHttpStatus: number | null = null;
  let supabaseReachable: boolean | null = null;
  if (!configuration.error) {
    try {
      const response = await fetch(`${configuration.url}/auth/v1/settings`, {
        headers: { apikey: configuration.key },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      supabaseHttpStatus = response.status;
      supabaseReachable = response.ok;
      supabaseStatus = response.ok
        ? 'ready'
        : response.status === 401 || response.status === 403
          ? 'invalid_api_key'
          : response.status === 404
            ? 'invalid_project_url'
            : response.status >= 500
            ? 'project_unavailable'
            : 'supabase_rejected_request';
    } catch {
      supabaseReachable = false;
      supabaseStatus = 'network_connectivity_failure';
    }
  }
  const result: {
    app: string;
    supabaseConfigured: boolean;
    supabaseReachable: boolean | null;
    supabaseHttpStatus: number | null;
    supabaseStatus: string;
    geminiConfigured: boolean;
    youtubeConfigured: boolean;
  } = {
    app: 'BuildBridge',
    supabaseConfigured: !configuration.error,
    supabaseReachable,
    supabaseHttpStatus,
    supabaseStatus,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
  };
  return NextResponse.json(result, {
    status: supabaseStatus === 'ready' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
