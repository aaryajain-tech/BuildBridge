import WorkspaceApp from '@/components/WorkspaceApp';
import { getDemoProfile, type DemoRole } from '@/lib/demo-data';

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const roleParam = params.role;
  const role: DemoRole = roleParam === 'company' || roleParam === 'company_member'
    ? 'company_member'
    : roleParam === 'admin'
      ? 'admin'
      : 'student';

  return <WorkspaceApp initialProfile={getDemoProfile(role)} demoMode />;
}
