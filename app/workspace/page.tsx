import { redirect } from 'next/navigation';
import Link from 'next/link';
import WorkspaceApp from '@/components/WorkspaceApp';
import { createClient } from '@/lib/supabase/server';

export default async function WorkspacePage() {
  const supabase = await createClient();
  if (!supabase) {
    return <main className="auth-loading"><h1>BuildBridge is not configured</h1><p>Add Supabase public URL and anon/publishable key to the server environment.</p></main>;
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/auth/sign-in');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,full_name,role,career_goal,phone_number,avatar_path')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    return <main className="auth-loading"><h1>Could not load your workspace</h1><p>{profileError.message}</p><a href="/auth/sign-in">Return to sign in</a></main>;
  }
  if (!profile) {
    return <main className="auth-loading"><h1>Your profile is not ready</h1><p>Run the documented BuildBridge Supabase auth repair migration, then sign in again.</p><a href="/auth/sign-in">Return to sign in</a></main>;
  }

  const isSoleAdmin = Boolean(process.env.ADMIN_OWNER_EMAIL)
    && user.email?.toLowerCase() === process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  const role = profile.role === 'admin' && !isSoleAdmin ? 'student' : profile.role;
  if (profile.role === 'admin' && !isSoleAdmin) {
    return <main className="auth-loading"><h1>Administrator access is unavailable</h1><p>This account does not match the configured platform owner.</p><Link href="/">Return to BuildBridge</Link></main>;
  }

  return <WorkspaceApp initialProfile={{ ...profile, role }} />;
}
