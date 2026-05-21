import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { t, languages } from '../i18n';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const cardFont = lang === 'ka' ? 'sans-serif' : undefined;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff'
    }}>
      <div style={{
        position: 'relative',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        fontFamily: cardFont,
      }}>
        <select
          value={lang}
          onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
        >
          {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#ffffff', color: '#111827' }}>{l.label}</option>)}
        </select>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: '#2563eb'
          }}>S</div>
          <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, margin: 0 }}>{t(lang, 'welcomeBack')}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'signInSubtitle')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {forgotMode ? (
          forgotStatus === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Check your email for a reset link.</p>
              <span onClick={() => { setForgotMode(false); setForgotStatus(''); }} style={{ color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Back to sign in</span>
            </div>
          ) : (
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Email</label>
                <input
                  type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                  onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              {forgotStatus === 'error' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                  Something went wrong. Please try again.
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
                {forgotStatus === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                <span onClick={() => setForgotMode(false)} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>Back to sign in</span>
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
                  Forgot password?
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
      </div>
    </div>
  );
}
