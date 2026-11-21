import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  const sessionOnly = cookieStore.get('buildbridge-remember')?.value === 'session';
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const safeOptions = { ...options };
            if (sessionOnly && value) {
              delete safeOptions.maxAge;
              delete safeOptions.expires;
            }
            cookieStore.set(name, value, safeOptions);
          });
        } catch {
          // Server components cannot mutate cookies; middleware refreshes them.
        }
      },
    },
  });
}
