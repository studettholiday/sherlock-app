import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const COLORS = {
  bg: '#0d0d1a',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)',
  purple: '#7c3aed',
  text: 'white',
  muted: 'rgba(255,255,255,0.5)',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [codes, setCodes] = useState({ teacher_code: null, student_code: null, assistant_code: null });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const token = localStorage.getItem('sherlock_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [codesRes, membersRes] = await Promise.all([
        fetch('/api/school/codes', { headers }),
        fetch('/api/school/members', { headers })
      ]);
      const codesData = await codesRes.json();
      const membersData = await membersRes.json();
      setCodes(codesData);
      setMembers(membersData.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async (role) => {
    const res = await fetch('/api/school/codes/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    setCodes(prev => ({ ...prev, [`${role}_code`]: data.code }));
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const canManage = user?.role === 'admin' || user?.role === 'assistant';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <div style={{ color: 'white' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'sans-serif' }}>
      {codes.status === 'pending' && (
        <div style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', padding: '14px 24px', textAlign: 'center', color: '#fbbf24', fontSize: '14px' }}>
          ⏳ Your school is pending approval. You will receive an email once approved. Contact us at support@sherlock.school if you have questions.
        </div>
      )}
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>S</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>{user?.schoolName}</div>
            <div style={{ color: COLORS.muted, fontSize: '12px' }}>{user?.email} · {user?.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.location.href = '/chat'} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Open Chat
          </button>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.muted, cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Access Codes */}
        {canManage && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Access Codes</h2>
            <p style={{ color: COLORS.muted, fontSize: '14px', marginBottom: '20px', marginTop: 0 }}>Share these codes with your staff and students.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {[
                { role: 'teacher', label: 'Teacher Code', color: '#3b82f6' },
                { role: 'student', label: 'Student Code', color: '#10b981' },
                ...(user?.role === 'admin' ? [{ role: 'assistant', label: 'Assistant Code', color: '#f59e0b' }] : [])
              ].map(({ role, label, color }) => {
                const code = codes[`${role}_code`];
                const joinUrl = `${window.location.origin}/join?code=${code}&role=${role}`;
                return (
                  <div key={role} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{label}</span>
                    </div>
                    {code ? (
                      <>
                        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', letterSpacing: '4px', textAlign: 'center', marginBottom: '12px', color }}>
                          {code}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => copyToClipboard(code, `code-${role}`)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                            {copied === `code-${role}` ? '✓ Copied' : 'Copy Code'}
                          </button>
                          <button onClick={() => copyToClipboard(joinUrl, `url-${role}`)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                            {copied === `url-${role}` ? '✓ Copied' : 'Copy Link'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => generateCode(role)} style={{ width: '100%', padding: '10px', background: `rgba(${color === '#3b82f6' ? '59,130,246' : color === '#10b981' ? '16,185,129' : '245,158,11'},0.15)`, border: `1px dashed ${color}`, borderRadius: '8px', color, cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        Generate Code
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Members ({members.length})</h2>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            {members.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: COLORS.muted }}>No members yet</div>
            ) : (
              members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < members.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: m.role === 'admin' ? 'rgba(124,58,237,0.2)' : m.role === 'teacher' ? 'rgba(59,130,246,0.2)' : m.role === 'assistant' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: m.role === 'admin' ? '#a78bfa' : m.role === 'teacher' ? '#60a5fa' : m.role === 'assistant' ? '#fbbf24' : '#34d399' }}>
                    {m.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
