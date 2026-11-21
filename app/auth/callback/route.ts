import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeInternalNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/workspace';
  try {
    const parsed = new URL(value, 'https://buildbridge.invalid');
    if (parsed.origin !== 'https://buildbridge.invalid') return '/workspace';
    const accountType = parsed.searchParams.get('accountType');
    if (accountType && accountType !== 'student' && accountType !== 'company_member') {
      parsed.searchParams.delete('accountType');
    }
    const screen = parsed.searchParams.get('screen');
    const allowedScreens = new Set(['Dashboard', 'Profile', 'Learn', 'My Path', 'Projects', 'My Projects', 'Opportunities', 'Achievements', 'AI Mentor', 'Settings']);
    if (screen && !allowedScreens.has(screen)) parsed.searchParams.delete('screen');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/workspace';
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const providerError = request.nextUrl.searchParams.get('error_description') || request.nextUrl.searchParams.get('error');
  const next = safeInternalNext(request.nextUrl.searchParams.get('next'));
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL('/auth/sign-in?error=not_configured', request.url));
  if (providerError) {
    const signIn = new URL('/auth/sign-in', request.url);
    signIn.searchParams.set('error', providerError.slice(0, 300));
    return NextResponse.redirect(signIn);
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const signIn = new URL('/auth/sign-in', request.url);
      signIn.searchParams.set('error', error.message.slice(0, 300));
      return NextResponse.redirect(signIn);
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/auth/sign-in?error=missing_auth_code', request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
