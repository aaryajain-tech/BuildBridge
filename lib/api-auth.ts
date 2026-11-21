import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

type AuthenticatedRequest = {
  supabase: SupabaseClient;
  user: User;
};

type AuthenticationError = {
  error: string;
  status: number;
};

export async function authenticateRequest(req: Request): Promise<AuthenticatedRequest | AuthenticationError> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Authentication required.', status: 401 };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: 'Supabase environment variables are missing on the server.', status: 503 };

  const supabase = createClient(url, key, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Your session is invalid or expired. Sign in again.', status: 401 };
  return { supabase, user };
}

export async function getProfileRole(supabase: SupabaseClient, userId: string, authenticatedEmail?: string | null): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('role,email').eq('id', userId).maybeSingle();
  if (error) throw new Error(`Could not verify your BuildBridge role: ${error.message}`);
  if (data?.role === 'admin') {
    const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
    if (!ownerEmail || !data.email || !authenticatedEmail
      || data.email.toLowerCase() !== ownerEmail
      || authenticatedEmail.toLowerCase() !== ownerEmail) return null;
  }
  return data?.role || null;
}
