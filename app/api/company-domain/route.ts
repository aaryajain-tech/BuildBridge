import { randomUUID } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfileRole } from '@/lib/api-auth';

export const runtime = 'nodejs';

const freeEmailDomains = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'live.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com',
]);

async function getIdentity() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Supabase is not configured.', status: 503 as const };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Authentication required.', status: 401 as const };
  const role = await getProfileRole(supabase, user.id, user.email);
  return { supabase, user, role };
}

export async function GET() {
  try {
    const identity = await getIdentity();
    if ('error' in identity) return NextResponse.json({ error: identity.error }, { status: identity.status });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Company domain verification is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.' }, { status: 503 });

    if (identity.role === 'admin') {
      const { data, error } = await admin.from('company_domain_requests')
        .select('id,user_id,email_domain,organization_name,status,dns_verified_at,reviewed_at,review_note,created_at,profile:profiles(email,full_name)')
        .order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: `Domain requests could not be loaded: ${error.message}` }, { status: 400 });
      return NextResponse.json({ requests: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const { data, error } = await identity.supabase.from('company_domain_requests')
      .select('id,email_domain,organization_name,dns_token,status,dns_verified_at,review_note,created_at')
      .eq('user_id', identity.user.id).maybeSingle();
    if (error) return NextResponse.json({ error: `Your company request could not be loaded: ${error.message}` }, { status: 400 });
    return NextResponse.json({ request: data || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Company access request failed.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getIdentity();
    if ('error' in identity) return NextResponse.json({ error: identity.error }, { status: identity.status });
    const body = await request.json() as { action?: string; domain?: string; organizationName?: string; requestId?: string; decision?: string; note?: string };
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Company domain verification is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.' }, { status: 503 });

    if (body.action === 'request') {
      if (identity.role !== 'student') return NextResponse.json({ error: 'Only student accounts can request company access.' }, { status: 403 });
      if (!identity.user.email || !identity.user.email_confirmed_at) return NextResponse.json({ error: 'Confirm your email address before requesting company access.' }, { status: 403 });
      const domain = String(body.domain || '').trim().toLowerCase().replace(/^@/, '');
      const emailDomain = identity.user.email.split('@').pop()?.toLowerCase();
      const organizationName = String(body.organizationName || '').trim();
      if (!organizationName || organizationName.length > 160) return NextResponse.json({ error: 'Enter an organization name (up to 160 characters).' }, { status: 400 });
      if (!domain || domain !== emailDomain || freeEmailDomains.has(domain) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
        return NextResponse.json({ error: 'Use your confirmed organization email domain. Public email providers are not accepted.' }, { status: 400 });
      }

      const { data: existing, error: existingError } = await admin.from('company_domain_requests')
        .select('id,status,dns_token,email_domain,dns_verified_at').eq('user_id', identity.user.id).maybeSingle();
      if (existingError) return NextResponse.json({ error: `Existing request could not be checked: ${existingError.message}` }, { status: 400 });
      if (existing?.status === 'approved') return NextResponse.json({ error: 'Your company access has already been approved.' }, { status: 409 });
      const domainUnchanged = existing?.email_domain === domain;
      const token = domainUnchanged ? existing.dns_token : randomUUID().replaceAll('-', '');
      const { data, error } = await admin.from('company_domain_requests').upsert({
        user_id: identity.user.id,
        email_domain: domain,
        organization_name: organizationName,
        dns_token: token,
        status: domainUnchanged && existing?.status === 'pending_admin' ? 'pending_admin' : 'pending_dns',
        dns_verified_at: domainUnchanged && existing?.status === 'pending_admin' ? existing.dns_verified_at : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).select('id,email_domain,organization_name,dns_token,status,dns_verified_at,review_note,created_at').single();
      if (error) return NextResponse.json({ error: `Company access request could not be saved: ${error.message}` }, { status: 400 });
      return NextResponse.json({ request: data }, { status: 201 });
    }

    if (body.action === 'verify_dns') {
      const { data: domainRequest, error } = await admin.from('company_domain_requests')
        .select('id,email_domain,dns_token,status').eq('user_id', identity.user.id).maybeSingle();
      if (error) return NextResponse.json({ error: `Domain request could not be loaded: ${error.message}` }, { status: 400 });
      if (!domainRequest) return NextResponse.json({ error: 'Submit a company access request first.' }, { status: 404 });
      const recordName = `_buildbridge-verification.${domainRequest.email_domain}`;
      let values: string[] = [];
      try {
        values = (await resolveTxt(recordName)).map(parts => parts.join(''));
      } catch (cause) {
        const code = (cause as NodeJS.ErrnoException).code;
        if (code !== 'ENODATA' && code !== 'ENOTFOUND' && code !== 'ETIMEOUT') throw cause;
      }
      if (!values.includes(`buildbridge-verification=${domainRequest.dns_token}`)) {
        return NextResponse.json({ error: `DNS verification record was not found. Add TXT ${recordName} with value buildbridge-verification=${domainRequest.dns_token}, wait for DNS propagation, then retry.` }, { status: 409 });
      }
      const { data, error: updateError } = await admin.from('company_domain_requests')
        .update({ status: 'pending_admin', dns_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', domainRequest.id).select('id,email_domain,organization_name,dns_token,status,dns_verified_at,review_note,created_at').single();
      if (updateError) return NextResponse.json({ error: `DNS proof was found but the request could not be updated: ${updateError.message}` }, { status: 400 });
      return NextResponse.json({ request: data });
    }

    if (body.action === 'review') {
      if (identity.role !== 'admin') return NextResponse.json({ error: 'Only the configured platform administrator can review domain requests.' }, { status: 403 });
      if (!body.requestId || !['approved', 'rejected'].includes(body.decision || '')) return NextResponse.json({ error: 'Choose a request and approve or reject it.' }, { status: 400 });
      const { data: domainRequest, error } = await admin.from('company_domain_requests')
        .select('id,user_id,email_domain,organization_name,dns_verified_at').eq('id', body.requestId).maybeSingle();
      if (error) return NextResponse.json({ error: `Request could not be loaded: ${error.message}` }, { status: 400 });
      if (!domainRequest) return NextResponse.json({ error: 'Company domain request not found.' }, { status: 404 });
      if (body.decision === 'approved' && !domainRequest.dns_verified_at) return NextResponse.json({ error: 'The organization must prove domain ownership before approval.' }, { status: 409 });

      const { error: reviewError } = await admin.rpc('review_company_domain_request', {
        request_id: domainRequest.id,
        admin_user_id: identity.user.id,
        decision: body.decision,
        note: String(body.note || '').trim().slice(0, 1000),
      });
      if (reviewError) return NextResponse.json({ error: `Review decision could not be saved: ${reviewError.message}` }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported company domain action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Company domain action failed.' }, { status: 500 });
  }
}
