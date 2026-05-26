import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { languages } from '../i18n';
import AuthShell from '../components/AuthShell';

export default function RecoveryScreen() {
  const { user, recover, recoverCancel } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isKa = lang === 'ka';
  const deletedAt = new Date(user.deleted_at);
  const expiresAt = new Date(deletedAt.getTime() + 21 * 24 * 3600 * 1000);
  const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 3600 * 1000)));

  const onYes = async () => {
    setLoading(true);
    setError('');
    try {
      await recover();
      window.location.replace('/chat');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const onNo = async () => {
    setLoading(true);
    await recoverCancel();
    window.location.replace('/?signup=1');
  };

  const title = isKa
    ? 'ანგარიში წაშლის გზაზეა'
    : 'Your account is scheduled for deletion';
  const body = isKa
    ? `ანგარიში საბოლოოდ წაიშლება ${daysLeft} დღეში. გსურთ აღდგენა?`
    : `Your account will be permanently deleted in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Recover it?`;
  const yes = isKa ? 'დიახ, აღვადგინო ანგარიში' : 'Yes, recover my account';
  const no  = isKa ? 'არა, საბოლოოდ წავშალო და გავიდე' : 'No, complete deletion and sign out';

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
          {title}
        </h1>
        <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '15px', lineHeight: 1.5 }}>
          {body}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <button
        onClick={onYes}
        disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
        onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
        style={{
          width: '100%', padding: '12px 14px', background: '#2563eb',
          border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px',
          fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, marginBottom: '12px', transition: 'background 0.15s ease',
        }}
      >
        {yes}
      </button>

      <button
        onClick={onNo}
        disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.background = '#fef2f2'; }}
        onMouseLeave={e => { e.target.style.background = '#ffffff'; }}
        style={{
          width: '100%', padding: '12px 14px', background: '#ffffff',
          border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '14px',
          fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, transition: 'background 0.15s ease',
        }}
      >
        {no}
      </button>
    </AuthShell>
  );
}
