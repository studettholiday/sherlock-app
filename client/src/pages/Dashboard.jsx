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

const BASE_URL = 'https://sherlock-app-production.up.railway.app';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [codes, setCodes] = useState({ teacher_code: null, student_code: null, assistant_code: null });
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteRole, setInviteRole] = useState('teacher');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const token = localStorage.getItem('sherlock_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const requests = [
        fetch('/api/school/codes', { headers }),
        fetch('/api/school/members', { headers }),
      ];
      const canManage = user?.role === 'admin' || user?.role === 'assistant';
      if (canManage) requests.push(fetch('/api/invites', { headers }));
      const results = await Promise.all(requests);
      const [codesData, membersData] = await Promise.all([results[0].json(), results[1].json()]);
      setCodes(codesData);
      setMembers(membersData.members || []);
      if (canManage && results[2]) {
        const invData = await results[2].json();
        setInvites(invData.invites || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async (role) => {
    const res = await fetch('/api/school/codes/generate', { method: 'POST', headers, body: JSON.stringify({ role }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    setCodes(prev => ({ ...prev, [`${role}_code`]: data.code }));
  };

  const generateInvite = async () => {
    const res = await fetch('/api/invites/generate', { method: 'POST', headers, body: JSON.stringify({ target_role: inviteRole }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    setInvites(prev => [{ id: Date.now(), code: data.code, target_role: data.target_role, expires_at: data.expires_at, used_at: null, created_at: new Date().toISOString() }, ...prev]);
  };

  const revokeInvite = async (id) => {
    await fetch(`/api/invites/${id}`, { method: 'DELETE', headers });
    setInvites(prev => prev.filter(i => i.id !== id));
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

  const roleColor = { admin: '#a78bfa', teacher: '#60a5fa', assistant: '#fbbf24', student: '#34d399' };
  const roleBg = { admin: 'rgba(124,58,237,0.2)', teacher: 'rgba(59,130,246,0.2)', assistant: 'rgba(245,158,11,0.2)', student: 'rgba(16,185,129,0.2)' };

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
                const joinUrl = `${BASE_URL}/join?code=${code}&role=${role}`;
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

        {/* Invite Links */}
        {canManage && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Invite Links</h2>
            <p style={{ color: COLORS.muted, fontSize: '14px', marginBottom: '16px', marginTop: 0 }}>Generate one-time invite links for specific roles. Links expire in 7 days.</p>

            {/* Generator */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer', outline: 'none', colorScheme: 'dark' }}
              >
                {user?.role === 'admin' && <option value="assistant" style={{ background: '#1a0533' }}>Assistant</option>}
                <option value="teacher" style={{ background: '#1a0533' }}>Teacher</option>
                <option value="student" style={{ background: '#1a0533' }}>Student</option>
              </select>
              <button onClick={generateInvite} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Generate Invite Link
              </button>
            </div>

            {/* Invite table */}
            {invites.length > 0 && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 80px 80px', gap: '0', borderBottom: `1px solid ${COLORS.border}`, padding: '10px 16px' }}>
                  {['Role', 'Link', 'Expires', 'Status', ''].map(h => (
                    <span key={h} style={{ fontSize: '12px', color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                  ))}
                </div>
                {invites.map(inv => {
                  const url = `${BASE_URL}/join?code=${inv.code}`;
                  const expired = new Date(inv.expires_at) < new Date();
                  const used = !!inv.used_at;
                  return (
                    <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 80px 80px', gap: '0', padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '12px', background: roleBg[inv.target_role], color: roleColor[inv.target_role], display: 'inline-block', textAlign: 'center' }}>
                        {inv.target_role}
                      </span>
                      <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)} style={{ background: 'none', border: 'none', color: copied === `inv-${inv.id}` ? '#34d399' : '#818cf8', cursor: 'pointer', fontSize: '13px', textAlign: 'left', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {copied === `inv-${inv.id}` ? '✓ Copied!' : url}
                      </button>
                      <span style={{ fontSize: '12px', color: COLORS.muted }}>{new Date(inv.expires_at).toLocaleDateString()}</span>
                      <span style={{ fontSize: '12px', color: used ? '#34d399' : expired ? '#f87171' : '#fbbf24' }}>
                        {used ? 'Used' : expired ? 'Expired' : 'Active'}
                      </span>
                      <button onClick={() => revokeInvite(inv.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}>
                        Revoke
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {invites.length === 0 && (
              <div style={{ color: COLORS.muted, fontSize: '14px', padding: '16px 0' }}>No active invite links.</div>
            )}
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
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: roleBg[m.role] || 'rgba(255,255,255,0.1)', color: roleColor[m.role] || 'white' }}>
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
