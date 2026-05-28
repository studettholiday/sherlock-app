import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { t, languages } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function Login({ onSwitch, onSuccess }) {
  const { login } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(''); // '' | 'loading' | 'sent' | 'error'
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(''); // '' | 'loading' | 'sent'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      if (err.email_verified === false) {
        setUnverifiedEmail(err.email || email);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('loading');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResendStatus('sent');
    } catch {
      setResendStatus('');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) throw new Error();
      setForgotStatus('sent');
    } catch {
      setForgotStatus('error');
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
          <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{t(lang, 'welcomeBack')}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'signInSubtitle')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {unverifiedEmail && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#92400e', fontSize: '14px' }}>
            <p style={{ margin: 0, marginBottom: '8px' }}>{t(lang, 'emailNotVerified')}</p>
            {resendStatus === 'sent' ? (
              <p style={{ margin: 0, color: '#10b981' }}>{t(lang, 'verifyResendSent')}</p>
            ) : (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendStatus === 'loading'}
                style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: resendStatus === 'loading' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', textDecoration: 'underline' }}
              >
                {resendStatus === 'loading' ? t(lang, 'sending') : t(lang, 'resendVerification')}
              </button>
            )}
          </div>
        )}

        {forgotMode ? (
          forgotStatus === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{t(lang, 'checkEmailForResetLink')}</p>
              <span onClick={() => { setForgotMode(false); setForgotStatus(''); }} style={{ color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>{t(lang, 'backToSignIn')}</span>
            </div>
          ) : (
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'email')}</label>
                <input
                  type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                  onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              {forgotStatus === 'error' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                  {t(lang, 'somethingWentWrong')}
                </div>
              )}
              <button type="submit" disabled={forgotStatus === 'loading'}
                onMouseEnter={e => { if (forgotStatus !== 'loading') e.target.style.background = '#1d4ed8'; }}
                onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
                style={{
                width: '100%', padding: '10px 14px', background: '#2563eb',
                border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
                fontWeight: '500', cursor: forgotStatus === 'loading' ? 'not-allowed' : 'pointer', opacity: forgotStatus === 'loading' ? 0.7 : 1, marginBottom: '16px', transition: 'background 0.15s ease'
              }}>
                {forgotStatus === 'loading' ? t(lang, 'sending') : t(lang, 'send')}
              </button>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                <span onClick={() => setForgotMode(false)} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>{t(lang, 'backToSignIn')}</span>
              </p>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'email')}</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, 'password')}</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <span onClick={() => { setForgotMode(true); setForgotEmail(email); }} style={{ color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
                  {t(lang, 'forgotPassword')}
                </span>
              </div>
              <button type="submit" disabled={loading}
                onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
                onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
                style={{
                width: '100%', padding: '10px 14px', background: '#2563eb',
                border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
                fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.15s ease'
              }}>
                {loading ? t(lang, 'signingIn') : t(lang, 'signIn')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
              {t(lang, 'noAccount')}{' '}
              <span onClick={onSwitch} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>
                {t(lang, 'registerSchool')}
              </span>
            </p>
          </>
        )}
    </AuthShell>
  );
}
