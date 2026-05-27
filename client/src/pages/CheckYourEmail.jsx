import { useState } from 'react';
import { t, languages } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function CheckYourEmail() {
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const email = new URLSearchParams(window.location.search).get('email') || '';
  const [resendStatus, setResendStatus] = useState(''); // '' | 'loading' | 'sent'

  const handleResend = async () => {
    if (!email) return;
    setResendStatus('loading');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
        <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{t(lang, 'checkYourEmailTitle')}</h1>
        <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '14px', lineHeight: 1.5 }}>
          {t(lang, 'checkYourEmailBody')} <strong style={{ color: '#111827' }}>{email}</strong>
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>{t(lang, 'didntGetEmail')}</p>
        {resendStatus === 'sent' ? (
          <p style={{ color: '#10b981', fontSize: '14px' }}>{t(lang, 'verifyResendSent')}</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendStatus === 'loading' || !email}
            onMouseEnter={e => { if (resendStatus !== 'loading' && email) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
            style={{ padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: (resendStatus === 'loading' || !email) ? 'not-allowed' : 'pointer', opacity: (resendStatus === 'loading' || !email) ? 0.7 : 1, transition: 'background 0.15s ease' }}
          >
            {resendStatus === 'loading' ? t(lang, 'sending') : t(lang, 'resendVerification')}
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: '32px', color: '#6b7280', fontSize: '14px' }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>{t(lang, 'backToSignIn')}</a>
      </p>
    </AuthShell>
  );
}
