import { useState } from 'react';
import { t, languages } from '../i18n';

export default function JoinWithCode() {
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const params = new URLSearchParams(window.location.search);
  const [code, setCode] = useState(params.get('code') || '');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ...form })
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)'
    }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '400px',
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
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>{t(lang, 'invited')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'invitedSubtitle')}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Access Code</label>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '2px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          {[
            { key: 'name',     labelKey: 'yourName', type: 'text' },
            { key: 'email',    labelKey: 'email',    type: 'email' },
            { key: 'password', labelKey: 'password', type: 'password' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>{t(lang, field.labelKey)}</label>
              <input
                type={field.type} value={form[field.key]} required
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '8px'
          }}>
            {loading ? t(lang, 'creatingAccount') : t(lang, 'createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
}
