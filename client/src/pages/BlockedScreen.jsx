import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { t, languages } from '../i18n';
import AuthShell from '../components/AuthShell';

// Shown when a member has been removed from their school by the owner. The
// central auth gate already blocks every school feature for this account — this
// screen is the only thing they can reach, and its single action routes into
// the existing 21-day account-deletion flow (self-delete). Logout is available
// implicitly via the Sherlock logo (returns to sign-in) in the shell.
export default function BlockedScreen() {
  const { selfDelete } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await selfDelete();
      // Mirrors the existing in-app delete flow — drop the user at fresh signup.
      window.location.replace('/?signup=1');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <select
        value={lang}
        onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
        style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
      >
        {languages.map(l => (
          <option key={l.code} value={l.code} style={{ background: '#ffffff', color: '#111827' }}>{l.label}</option>
        ))}
      </select>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '28px', color: '#111827', margin: 0, lineHeight: 1.25 }}>
          {t(lang, 'blockedTitle')}
        </h1>
        <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '15px', lineHeight: 1.5 }}>
          {t(lang, 'blockedBody')}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {confirming && (
        <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>
          {t(lang, 'blockedDeleteConfirm')}
        </p>
      )}

      <button
        onClick={() => (confirming ? onDelete() : setConfirming(true))}
        disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.background = '#b91c1c'; }}
        onMouseLeave={e => { e.target.style.background = '#dc2626'; }}
        style={{
          width: '100%', padding: '12px 14px', background: '#dc2626',
          border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
          fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, transition: 'background 0.15s ease',
        }}
      >
        {loading ? t(lang, 'removing') : t(lang, 'blockedDeleteAccount')}
      </button>

      {confirming && !loading && (
        <button
          onClick={() => setConfirming(false)}
          style={{
            width: '100%', padding: '12px 14px', background: '#ffffff',
            border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', marginTop: '12px',
          }}
        >
          {t(lang, 'cancel')}
        </button>
      )}
    </AuthShell>
  );
}
