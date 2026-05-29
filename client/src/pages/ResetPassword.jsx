import { useState } from 'react';
import { t } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [lang] = useState(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('sherlock_lang')
      || 'en'
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(''); // '' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg(t(lang, 'passwordsDontMatch')); return; }
    if (password.length < 8) { setErrorMsg(t(lang, 'passwordTooShort')); return; }
    setErrorMsg('');
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || t(lang, 'somethingWentWrong')); setStatus('error'); return; }
      setStatus('success');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch {
      setErrorMsg(t(lang, 'somethingWentWrong'));
      setStatus('error');
    }
  };

  return (
    <AuthShell>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{t(lang, 'resetPasswordTitle')}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'resetPasswordSubtitle')}</p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '14px', marginBottom: '12px' }}>{t(lang, 'passwordResetSuccess')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!token && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
                {t(lang, 'resetTokenInvalid')}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'newPassword')}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'confirmPassword')}</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
              />
            </div>
            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
                {errorMsg}
              </div>
            )}
            <button type="submit" disabled={status === 'loading' || !token}
              onMouseEnter={e => { if (!(status === 'loading' || !token)) e.target.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
              style={{
              width: '100%', padding: '10px 14px', background: '#2563eb',
              border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
              fontWeight: '500', cursor: (status === 'loading' || !token) ? 'not-allowed' : 'pointer', opacity: (status === 'loading' || !token) ? 0.7 : 1, transition: 'background 0.15s ease'
            }}>
              {status === 'loading' ? t(lang, 'loading') : t(lang, 'resetPassword')}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>{t(lang, 'backToSignIn')}</a>
        </p>
    </AuthShell>
  );
}
