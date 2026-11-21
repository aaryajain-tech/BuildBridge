'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, setRememberPreference } from '@/lib/supabase';
import { SocialAuthButtons, type SocialProvider } from '@/components/SocialAuthButtons';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot' | 'reset';
type AccountIntent = 'student' | 'company_member';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/workspace';
  try {
    const parsed = new URL(value, 'https://buildbridge.invalid');
    if (parsed.origin !== 'https://buildbridge.invalid') return '/workspace';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/workspace';
  }
}

function signupDestination(intent: AccountIntent) {
  const query = new URLSearchParams({ screen: intent === 'company_member' ? 'Profile' : 'Dashboard' });
  if (intent === 'company_member') query.set('accountType', 'company_member');
  return `/workspace?${query.toString()}`;
}

function callbackUrl(origin: string, next: string) {
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('next', next);
  return callback.toString();
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AccountIntent>('student');
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error_description') || params.get('error');
    if (callbackError) setError(callbackError.replaceAll('+', ' '));
    const requestedType = params.get('accountType');
    if (requestedType === 'company_member') setRole('company_member');
  }, []);

  function normalizedPhone() {
    const digits = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
    if (!digits) return '';
    const complete = `${countryCode}${digits}`;
    const completeDigits = complete.replace(/\D/g, '');
    if (completeDigits.length < 8 || completeDigits.length > 15) {
      throw new Error('Enter a valid phone number with its country code. Phone number is optional.');
    }
    return complete;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    let phone = '';
    if (mode === 'sign-up') {
      try {
        phone = normalizedPhone();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Enter a valid phone number.');
        return;
      }
      if (!name.trim() || name.trim().length > 120) {
        setError('Enter your full name (up to 120 characters).');
        return;
      }
    }

    const keepSession = mode === 'sign-in' ? rememberMe : true;
    setRememberPreference(keepSession);
    const supabase = createClient({ rememberMe: keepSession });
    if (!supabase) {
      setError('Sign-in is not configured. Contact the BuildBridge administrator.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        const next = safeNext(new URLSearchParams(window.location.search).get('next'));
        router.replace(next);
        router.refresh();
      } else if (mode === 'sign-up') {
        const destination = signupDestination(role);
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: callbackUrl(window.location.origin, destination),
            data: {
              full_name: name.trim(),
              phone_number: phone || null,
              requested_role: role,
              account_type_request: role,
            },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace(destination);
          router.refresh();
        } else {
          setMessage(role === 'company_member'
            ? 'Check your email to confirm your account. Company access is not granted by a signup choice: open Profile after confirmation, verify your organization domain and wait for administrator approval.'
            : 'Check your email to confirm your account. You can complete your profile and start your learning journey after sign-in.');
        }
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl(window.location.origin, '/auth/reset-password'),
        });
        if (authError) throw authError;
        setMessage('If an account exists for that address, a password reset link is on its way.');
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage('Your password has been updated. You can now sign in.');
        setPassword('');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: SocialProvider) {
    setError('');
    setMessage('');
    const keepSession = mode === 'sign-in' ? rememberMe : true;
    setRememberPreference(keepSession);
    const supabase = createClient({ rememberMe: keepSession });
    if (!supabase) {
      setError('Sign-in is not configured. Contact the BuildBridge administrator.');
      return;
    }
    const destination = mode === 'sign-up'
      ? signupDestination(role)
      : safeNext(new URLSearchParams(window.location.search).get('next'));
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(window.location.origin, destination),
        ...(provider === 'azure' ? { scopes: 'email' } : {}),
      },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  const title = mode === 'sign-up' ? 'Create your account'
    : mode === 'forgot' ? 'Reset your password'
    : mode === 'reset' ? 'Choose a new password' : 'Welcome back';

  return <section className="auth-panel auth-form-panel">
    <Link href="/" className="auth-back">← Back to BuildBridge</Link>
    <p className="eyebrow">YOUR NEXT STEP STARTS HERE</p>
    <h1>{title}</h1>
    <p className="muted">{mode === 'sign-up' ? 'Create an account to start building career-ready skills.'
      : mode === 'forgot' ? 'Enter your email and we will send a secure reset link.'
      : mode === 'reset' ? 'Use a strong password you have not used elsewhere.'
      : 'Sign in to continue your learning and project journey.'}</p>
    <form onSubmit={submit}>
      {mode === 'sign-up' && <>
        <label>Full name<input required autoComplete="name" maxLength={120} value={name} onChange={event=>setName(event.target.value)} placeholder="Your full name"/></label>
        <label>Account type<select value={role} onChange={event=>setRole(event.target.value as AccountIntent)}><option value="student">Student</option><option value="company_member">Company representative (verification required)</option></select></label>
        <label>Phone number <span className="optional-label">Optional</span><div className="phone-input"><select aria-label="Phone country code" value={countryCode} onChange={event=>setCountryCode(event.target.value)}><option value="+91">India (+91)</option><option value="+1">United States (+1)</option><option value="+44">United Kingdom (+44)</option><option value="+61">Australia (+61)</option><option value="+65">Singapore (+65)</option><option value="+971">UAE (+971)</option><option value="+81">Japan (+81)</option></select><input type="tel" autoComplete="tel-national" inputMode="tel" value={phoneNumber} onChange={event=>setPhoneNumber(event.target.value)} placeholder="98765 43210"/></div></label>
      </>}
      {(mode === 'sign-in' || mode === 'sign-up' || mode === 'forgot') && <label>Email address<input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label>}
      {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset') && <label>{mode === 'reset' ? 'New password' : 'Password'}<input required type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={mode === 'sign-in' ? undefined : 8} value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode === 'sign-in' ? 'Your password' : 'At least 8 characters'}/></label>}
      {mode === 'sign-in' && <label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={event=>setRememberMe(event.target.checked)}/> Remember me on this device</label>}
      <button className="primary full" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}</button>
    </form>
    {(mode === 'sign-in' || mode === 'sign-up') && <>
      <div className="auth-divider"><span>or continue with</span></div>
      <SocialAuthButtons busy={busy} onSelect={oauth}/>
    </>}
    {mode === 'sign-in' && <>
      <button className="text-btn auth-forgot" type="button" onClick={()=>router.push('/auth/forgot-password')}>Forgot password?</button>
      <p className="auth-switch">New to BuildBridge? <Link href="/auth/sign-up">Create account</Link></p>
    </>}
    {mode === 'sign-up' && <p className="auth-switch">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>}
    {mode === 'forgot' && <p className="auth-switch"><Link href="/auth/sign-in">Return to sign in</Link></p>}
    {(error || message) && <p className={error ? 'auth-message error' : 'auth-message'} role={error ? 'alert' : 'status'}>{error || message}</p>}
  </section>;
}
