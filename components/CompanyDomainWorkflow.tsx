'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

type DomainRequest = {
  id: string;
  user_id?: string;
  email_domain: string;
  organization_name: string;
  dns_token?: string;
  status: string;
  dns_verified_at: string | null;
  review_note?: string | null;
  created_at: string;
  profile?: { email: string; full_name: string | null };
};

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  const result = await response.json().catch(() => ({ error: 'The server returned an unreadable response.' }));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

export function CompanyDomainRequest() {
  const [request, setRequest] = useState<DomainRequest | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await requestJson('/api/company-domain');
      setRequest(result.request || null);
      if (result.request) {
        setOrganizationName(result.request.organization_name);
        setDomain(result.request.email_domain);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company access request could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(action: 'request'|'verify_dns') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await requestJson('/api/company-domain', {
        method: 'POST',
        body: JSON.stringify(action === 'request'
          ? { action, organizationName, domain }
          : { action }),
      });
      if (result.request) setRequest(result.request);
      setMessage(action === 'request' ? 'Request saved. Add the provided TXT record, then verify domain ownership.' : 'Domain ownership verified. Your request is awaiting administrator review.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company access could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel company-domain-panel">
    <h2><Building2 size={19}/> Company account access</h2>
    <p className="muted">Company access requires a confirmed organization email, DNS proof and administrator approval. Domain approval does not verify the company or unlock project publishing.</p>
    {loading ? <p className="muted">Checking your request…</p> : error && !request ? <div className="notice" role="alert">{error}<button className="text-btn" onClick={()=>void load()}>Retry</button></div> : <>
      {request?.status === 'approved' ? <div className="company-domain-status"><CheckCircle2/><b>Company account access approved</b><span>Company verification and publishing permissions are separate admin-reviewed steps.</span></div> : <>
        <div className="company-domain-fields"><label>Organization name<input value={organizationName} maxLength={160} onChange={event=>setOrganizationName(event.target.value)} placeholder="Organization name"/></label><label>Confirmed organization domain<input value={domain} onChange={event=>setDomain(event.target.value)} placeholder="company.example"/></label></div>
        <button className="primary" disabled={busy||request?.status==='pending_admin'} onClick={()=>void submit('request')}>{busy?'Saving…':request?'Update access request':'Request company access'}</button>
      </>}
      {request?.dns_token && request.status !== 'approved' && <div className="dns-proof">
        <b>Prove domain ownership</b>
        <p>Add this TXT record at your DNS provider:</p>
        <code>Host: _buildbridge-verification.{request.email_domain}<br/>Value: buildbridge-verification={request.dns_token}</code>
        <p>Status: <strong>{request.status === 'pending_admin' ? 'DNS verified · waiting for administrator review' : 'DNS verification required'}</strong></p>
        {request.status !== 'pending_admin' && <button className="outline" disabled={busy} onClick={()=>void submit('verify_dns')}>{busy?'Checking DNS…':'Verify DNS record'}</button>}
      </div>}
      {request?.review_note && <p className="notice">{request.review_note}</p>}
      {(error||message)&&<p className={error?'auth-message error':'auth-message'} role={error?'alert':'status'}>{error||message}</p>}
    </>}
  </section>;
}

export function AdminCompanyDomainRequests() {
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await requestJson('/api/company-domain');
      setRequests(Array.isArray(result.requests) ? result.requests : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company domain requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(item: DomainRequest, decision: 'approved'|'rejected') {
    setBusyId(item.id);
    setError('');
    try {
      await requestJson('/api/company-domain', { method: 'POST', body: JSON.stringify({ action: 'review', requestId: item.id, decision }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Domain review could not be saved.');
    } finally {
      setBusyId('');
    }
  }

  return <section className="panel admin-domain-requests">
    <h2><ShieldCheck size={19}/> Company domain requests</h2>
    <p className="muted">DNS proof establishes domain control only. Review organization access separately from company verification.</p>
    {error&&<div className="notice" role="alert">{error}<button className="text-btn" onClick={()=>void load()}>Retry</button></div>}
    {loading?<p className="muted">Loading domain requests…</p>:requests.length===0?<p className="muted">No company domain requests have been submitted.</p>:requests.map(item=><article className="roadmap-row" key={item.id}>
      <div><b>{item.organization_name} · {item.email_domain}</b><small>{item.profile?.full_name||item.profile?.email||item.user_id} · {item.status}{item.dns_verified_at?' · DNS verified':''}</small>{item.review_note&&<small>Review note: {item.review_note}</small>}</div>
      {item.status==='pending_admin'&&<div className="inline-actions"><button className="small-primary" disabled={!!busyId} onClick={()=>void review(item,'approved')}>{busyId===item.id?'Saving…':'Approve access'}</button><button className="outline" disabled={!!busyId} onClick={()=>void review(item,'rejected')}>Reject</button></div>}
    </article>)}
  </section>;
}
