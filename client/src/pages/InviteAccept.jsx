import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { t, languages } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function InviteAccept({ token, onSuccess }) {
  const { } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept invite');
      localStorage.setItem('sherlock_token', data.token);
      onSuccess(data.user?.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name',     labelKey: 'yourName', type: 'text',     required: true },
    { key: 'email',    labelKey: 'email',    type: 'email',    required: true },
    { key: 'password', labelKey: 'password', type: 'password', required: true },
  ];

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
          <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{t(lang, 'invited')}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{t(lang, 'invitedSubtitle')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{t(lang, field.labelKey)}</label>
              <input
                type={field.type} value={form[field.key]} required={field.required}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                onFocus={e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s ease, box-shadow 0.15s ease' }}
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
            style={{
            width: '100%', padding: '10px 14px', background: '#2563eb',
            border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
            fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.15s ease'
          }}>
            {loading ? t(lang, 'creatingAccount') : t(lang, 'createAccount')}
          </button>
        </form>
    </AuthShell>
  );
}
