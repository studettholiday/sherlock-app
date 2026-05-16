import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const BASE_URL = 'https://sherlock-app-production.up.railway.app';

const COLORS = {
  bg: '#0d0d1a',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)',
  purple: '#7c3aed',
  text: 'white',
  muted: 'rgba(255,255,255,0.5)',
};

const roleColor = { admin: '#a78bfa', teacher: '#60a5fa', assistant: '#fbbf24', student: '#34d399' };
const roleBg = { admin: 'rgba(124,58,237,0.2)', teacher: 'rgba(59,130,246,0.2)', assistant: 'rgba(245,158,11,0.2)', student: 'rgba(16,185,129,0.2)' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteRole, setInviteRole] = useState('teacher');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const token = localStorage.getItem('sherlock_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canManage = user?.role === 'admin' || user?.role === 'assistant';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const requests = [fetch('/api/school/members', { headers })];
      if (canManage) requests.push(fetch('/api/invites', { headers }));
      const results = await Promise.all(requests);
      const membersData = await results[0].json();
      setMembers(membersData.members || []);
      if (canManage && results[1]) {
        const invData = await results[1].json();
        setInvites(invData.invites || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    const res = await fetch('/api/invites/generate', { method: 'POST', headers, body: JSON.stringify({ target_role: inviteRole }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    fetchData();
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <div style={{ color: 'white' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.schoolName}</div>
            <div style={{ color: COLORS.muted, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email} · {user?.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => window.location.href = '/chat'} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            Open Chat
          </button>
          <button onClick={logout} style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.muted, cursor: 'pointer', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Invite Links */}
        {canManage && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 6px 0' }}>Invite Links</h2>
            <p style={{ color: COLORS.muted, fontSize: '13px', marginBottom: '14px', marginTop: 0 }}>Generate one-time invite links. Links expire in 7 days.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer', outline: 'none', colorScheme: 'dark' }}>
                {user?.role === 'admin' && <option value="assistant" style={{ background: '#1a0533' }}>Assistant</option>}
                <option value="teacher" style={{ background: '#1a0533' }}>Teacher</option>
                <option value="student" style={{ background: '#1a0533' }}>Student</option>
              </select>
              <button onClick={generateInvite} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Generate Invite Link
              </button>
            </div>

            {invites.length === 0 ? (
              <div style={{ color: COLORS.muted, fontSize: '13px', padding: '12px 0' }}>No active invite links.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {invites.map(inv => {
                  const url = `${BASE_URL}/join?code=${inv.code}`;
                  const expired = new Date(inv.expires_at) < new Date();
                  const used = !!inv.used_at;
                  return (
                    <div key={inv.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: roleBg[inv.target_role], color: roleColor[inv.target_role] }}>
                          {inv.target_role}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: COLORS.muted }}>{new Date(inv.expires_at).toLocaleDateString()}</span>
                          <span style={{ fontSize: '12px', color: used ? '#34d399' : expired ? '#f87171' : '#fbbf24' }}>
                            {used ? 'Used' : expired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)}
                          style={{ flex: 1, minWidth: '120px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.4)'}`, background: copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)', color: copied === `inv-${inv.id}` ? '#34d399' : '#818cf8', cursor: 'pointer', fontSize: '13px' }}>
                          {copied === `inv-${inv.id}` ? '✓ Copied' : '📋 Copy Link'}
                        </button>
                        <button onClick={() => revokeInvite(inv.id)}
                          style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '13px' }}>
                          Revoke
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Members */}
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 14px 0' }}>Members ({members.length})</h2>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            {members.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: COLORS.muted }}>No members yet</div>
            ) : (
              members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < members.length - 1 ? `1px solid ${COLORS.border}` : 'none', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: roleBg[m.role] || 'rgba(255,255,255,0.1)', color: roleColor[m.role] || 'white', flexShrink: 0 }}>
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
