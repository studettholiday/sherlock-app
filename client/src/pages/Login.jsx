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
      background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)'
    }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        fontFamily: cardFont,
      }}>
        <select
          value={lang}
          onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', padding: '4px 8px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
        >
          {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#1a0533' }}>{l.label}</option>)}
        </select>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: 'white'
          }}>S</div>
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>{t(lang, 'welcomeBack')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'signInSubtitle')}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {forgotMode ? (
          forgotStatus === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '8px' }}>Check your email for a reset link.</p>
              <span onClick={() => { setForgotMode(false); setForgotStatus(''); }} style={{ color: '#7c3aed', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Back to sign in</span>
            </div>
          ) : (
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Email</label>
                <input
                  type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              {forgotStatus === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#f87171', fontSize: '14px' }}>
                  Something went wrong. Please try again.
                </div>
              )}
              <button type="submit" disabled={forgotStatus === 'loading'} style={{
                width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px',
                fontWeight: '600', cursor: forgotStatus === 'loading' ? 'not-allowed' : 'pointer', opacity: forgotStatus === 'loading' ? 0.7 : 1, marginBottom: '16px'
              }}>
                {forgotStatus === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                <span onClick={() => setForgotMode(false)} style={{ color: '#7c3aed', cursor: 'pointer', fontWeight: '600' }}>Back to sign in</span>
              </p>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>{t(lang, 'email')}</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>{t(lang, 'password')}</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <span onClick={() => { setForgotMode(true); setForgotEmail(email); }} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px',
                fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}>
                {loading ? t(lang, 'signingIn') : t(lang, 'signIn')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              {t(lang, 'noAccount')}{' '}
              <span onClick={onSwitch} style={{ color: '#7c3aed', cursor: 'pointer', fontWeight: '600' }}>
                {t(lang, 'registerSchool')}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
