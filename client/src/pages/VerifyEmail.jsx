import { useState, useEffect } from 'react';
import { t, languages } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function VerifyEmail() {
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(''); // '' | 'loading' | 'sent'

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setStatus('error'); return; }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(r => setStatus(r.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus('loading');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendStatus('sent');
    } catch {
      setResendStatus('');
    }
  };

  return (
    <AuthShell>
      <select
        value={lang}
        onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
        style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
      >
        {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#ffffff', color: '#111827' }}>{l.label}</option>)}
      </select>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{t(lang, 'verifyEmailTitle')}</h1>
      </div>

      {status === 'verifying' && (
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>{t(lang, 'verifyingEmail')}</p>
      )}

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#10b981', fontSize: '14px', marginBottom: '16px' }}>{t(lang, 'emailVerifiedSuccess')}</p>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
            {t(lang, 'goToSignIn')}
          </a>
        </div>
      )}

      {status === 'error' && (
        resendStatus === 'sent' ? (
          <p style={{ textAlign: 'center', color: '#10b981', fontSize: '14px' }}>{t(lang, 'verifyResendSent')}</p>
        ) : (
          <>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
              {t(lang, 'verifyLinkExpired')}
            </div>
            <form onSubmit={handleResend}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'email')}</label>
                <input
                  type="email" value={resendEmail} onChange={e => setResendEmail(e.target.value)} required
                  onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              <button type="submit" disabled={resendStatus === 'loading'}
                onMouseEnter={e => { if (resendStatus !== 'loading') e.target.style.background = '#1d4ed8'; }}
                onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: resendStatus === 'loading' ? 'not-allowed' : 'pointer', opacity: resendStatus === 'loading' ? 0.7 : 1, transition: 'background 0.15s ease' }}>
                {resendStatus === 'loading' ? t(lang, 'sending') : t(lang, 'resendVerification')}
              </button>
            </form>
          </>
        )
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>{t(lang, 'backToSignIn')}</a>
      </p>
    </AuthShell>
  );
}
