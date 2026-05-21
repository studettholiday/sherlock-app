import { useState, useEffect } from 'react';
import { t, languages } from '../i18n';

export default function JoinWithCode() {
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get('code') || '';
  const [code, setCode] = useState(urlCode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null); // { valid, target_role, school_name, reason }
  const [validating, setValidating] = useState(!!urlCode);

  // Validate invite code from URL on load
  useEffect(() => {
    if (!urlCode) return;
    fetch(`/api/invites/validate/${urlCode}`)
      .then(r => r.json())
      .then(data => setInviteInfo(data))
      .catch(() => setInviteInfo({ valid: false, reason: 'Could not validate invite' }))
      .finally(() => setValidating(false));
  }, [urlCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Use new invite-based signup if we have a UUID invite code
      const isUUID = /^[0-9a-f-]{36}$/.test(code);
      const endpoint = isUUID ? '/api/auth/signup' : '/api/auth/join';
      const body = isUUID
        ? { invite_code: code, ...form }
        : { code, ...form };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');
      localStorage.setItem('sherlock_token', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardFont = (lang === 'ka' || lang === 'ja') ? 'sans-serif' : undefined;

  if (validating) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Validating invite...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div style={{ position: 'relative', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '40px', width: '100%', maxWidth: '400px', fontFamily: cardFont }}>
        <select
          value={lang}
          onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
        >
          {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#ffffff', color: '#111827' }}>{l.label}</option>)}
        </select>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>S</div>
          <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, margin: 0 }}>{t(lang, 'invited')}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'invitedSubtitle')}</p>
        </div>

        {/* Invite banner */}
        {inviteInfo?.valid && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#2563eb', textAlign: 'center' }}>
            You've been invited to join <strong>{inviteInfo.school_name}</strong> as a <strong>{inviteInfo.target_role}</strong>.
          </div>
        )}
        {inviteInfo && !inviteInfo.valid && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>
            This invite link is invalid or has expired.
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Only show code input if no URL code was provided */}
          {!urlCode && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Access Code</label>
              <input
                type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required
                onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '2px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
              />
            </div>
          )}
          {[
            { key: 'name',     labelKey: 'yourName', type: 'text' },
            { key: 'email',    labelKey: 'email',    type: 'email' },
            { key: 'password', labelKey: 'password', type: 'password' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, field.labelKey)}</label>
              <input
                type={field.type} value={form[field.key]} required
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
              />
            </div>
          ))}
          <button type="submit" disabled={loading || (inviteInfo && !inviteInfo.valid)}
            onMouseEnter={e => { if (!(loading || (inviteInfo && !inviteInfo.valid))) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
            style={{ width: '100%', padding: '10px 14px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: (loading || (inviteInfo && !inviteInfo.valid)) ? 'not-allowed' : 'pointer', opacity: (loading || (inviteInfo && !inviteInfo.valid)) ? 0.5 : 1, marginTop: '8px', transition: 'background 0.15s ease' }}>
            {loading ? t(lang, 'creatingAccount') : t(lang, 'createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
}
