import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';

const BASE_URL = 'https://sherlock-app-production.up.railway.app';

const COLORS = {
  bg: '#0d0d1a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  purple: '#7c3aed',
  text: 'white',
  muted: 'rgba(255,255,255,0.45)',
};

const roleColor  = { admin: '#a78bfa', teacher: '#60a5fa', assistant: '#fbbf24', student: '#34d399' };
const roleBg     = { admin: 'rgba(124,58,237,0.2)', teacher: 'rgba(59,130,246,0.2)', assistant: 'rgba(245,158,11,0.2)', student: 'rgba(16,185,129,0.2)' };
const roleBorder = { admin: '#7c3aed', teacher: '#3b82f6', assistant: '#f59e0b', student: '#10b981' };
const roleGlow   = { admin: 'rgba(124,58,237,0.35)', teacher: 'rgba(59,130,246,0.35)', assistant: 'rgba(245,158,11,0.35)', student: 'rgba(16,185,129,0.35)' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteRole, setInviteRole] = useState('teacher');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [libFiles, setLibFiles] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libUploading, setLibUploading] = useState(false);
  const [libError, setLibError] = useState('');
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('sherlock_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canManage = user?.role === 'admin' || user?.role === 'assistant';
  const canLibrary = ['admin', 'assistant', 'teacher'].includes(user?.role);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (user?.schoolId) fetchLibrary(); }, [user?.schoolId]);

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const fetchLibrary = async () => {
    const currentToken = localStorage.getItem('sherlock_token');
    if (!currentToken) {
      console.warn('[library] fetchLibrary called with no token — skipping');
      return;
    }
    setLibLoading(true);
    setLibError('');
    try {
      console.log('[library] fetching file list, schoolId=%s token=%s…', user?.schoolId, currentToken.slice(0, 20));
      const res = await fetch('/api/library/?t=' + Date.now(), { headers: { Authorization: `Bearer ${currentToken}` } });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Non-JSON response (${res.status} ${res.statusText})`);
      }
      console.log('[library] response ok=%s status=%s data=%s', res.ok, res.status, JSON.stringify(data));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setLibFiles(data.files || []);
    } catch (err) {
      console.error('[library] fetchLibrary error:', err);
      setLibError(err.message);
    } finally {
      setLibLoading(false);
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setLibError('File must be under 25MB.'); return; }
    setLibError('');
    setLibUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/library/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await fetchLibrary();
    } catch (err) {
      setLibError(err.message);
    } finally {
      setLibUploading(false);
      e.target.value = '';
    }
  };

  const deleteFile = async (id) => {
    try {
      const res = await fetch(`/api/library/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed (${res.status})`);
      }
      setLibFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('[library] deleteFile error:', err);
      setLibError(err.message);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rainbowBar { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      `}</style>
      <div style={{ height: 2, width: '100%', position: 'fixed', top: 0, background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #0891b2, #06b6d4, #7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)', color: COLORS.text, fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes rainbowBar {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes sLogoGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5), 0 0 16px rgba(124,58,237,0.2); }
          50%       { box-shadow: 0 0 0 9px transparent, 0 0 28px rgba(124,58,237,0.25); }
        }
        .member-row { transition: background 0.15s; }
        .member-row:hover { background: rgba(255,255,255,0.04) !important; }
        .dash-open-chat { transition: all 0.15s; }
        .dash-open-chat:hover { filter: brightness(1.1); transform: scale(1.02); }
        .dash-open-chat:active { transform: scale(0.97); }
        .dash-signout { transition: all 0.15s; }
        .dash-signout:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.2) !important; color: rgba(255,255,255,0.7) !important; }
        .dash-generate { transition: all 0.15s; }
        .dash-generate:hover { filter: brightness(1.1); transform: scale(1.01); }
        .dash-generate:active { transform: scale(0.97); }
        .dash-copy { transition: all 0.15s; }
        .dash-copy:hover { filter: brightness(1.15); }
        .dash-revoke { transition: all 0.15s; }
        .dash-revoke:hover { background: rgba(239,68,68,0.25) !important; }
        .dash-lib-upload { transition: all 0.15s; }
        .dash-lib-upload:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.01); }
        .dash-lib-upload:active:not(:disabled) { transform: scale(0.97); }
        .dash-lib-delete { transition: all 0.15s; }
        .dash-lib-delete:hover { background: rgba(239,68,68,0.25) !important; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 35% at 50% 0%, rgba(124,58,237,0.14), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Rainbow bar */}
      <div style={{ position: 'relative', zIndex: 1, height: 2, width: '100%', background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #0891b2, #06b6d4, #7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.78)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0, animation: 'sLogoGlow 3s ease-in-out infinite' }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{user?.schoolName}</div>
            <div style={{ color: COLORS.muted, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
              {user?.email} · <span style={{ color: roleColor[user?.role] || 'white' }}>{user?.role}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => window.location.href = '/chat'} className="dash-open-chat"
            style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 20px rgba(124,58,237,0.38)', letterSpacing: '0.01em' }}>
            Open Chat
          </button>
          <button onClick={logout} className="dash-signout"
            style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: COLORS.muted, cursor: 'pointer', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Invite Links */}
        {canManage && (
          <div style={{ marginBottom: '44px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>Invite Links</h2>
            <p style={{ color: COLORS.muted, fontSize: '13px', marginBottom: '20px', marginTop: 4 }}>Generate one-time invite links. Links expire in 7 days.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '14px', cursor: 'pointer', outline: 'none', colorScheme: 'dark', backdropFilter: 'blur(12px)' }}>
                {user?.role === 'admin' && <option value="assistant" style={{ background: '#0d0d1a' }}>Assistant</option>}
                <option value="teacher" style={{ background: '#0d0d1a' }}>Teacher</option>
                <option value="student" style={{ background: '#0d0d1a' }}>Student</option>
              </select>
              <button onClick={generateInvite} className="dash-generate"
                style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.32)' }}>
                Generate Invite Link
              </button>
            </div>

            {invites.length === 0 ? (
              <div style={{ color: COLORS.muted, fontSize: '13px', padding: '16px 0' }}>No active invite links.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invites.map(inv => {
                  const url = `${BASE_URL}/join?code=${inv.code}`;
                  const expired = new Date(inv.expires_at) < new Date();
                  const used = !!inv.used_at;
                  const statusColor = used ? '#34d399' : expired ? '#f87171' : '#fbbf24';
                  const statusGlow  = used ? 'rgba(52,211,153,0.18)' : expired ? 'rgba(248,113,113,0.18)' : 'rgba(251,191,36,0.18)';
                  return (
                    <div key={inv.id} style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${roleBorder[inv.target_role] || '#7c3aed'}`, borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', backdropFilter: 'blur(20px)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: roleBg[inv.target_role], color: roleColor[inv.target_role], border: `1px solid ${roleBorder[inv.target_role] || '#7c3aed'}44`, letterSpacing: '0.02em' }}>
                          {inv.target_role}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: COLORS.muted }}>{new Date(inv.expires_at).toLocaleDateString()}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor, padding: '3px 10px', borderRadius: 20, background: statusGlow, border: `1px solid ${statusColor}44` }}>
                            {used ? 'Used' : expired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)} className="dash-copy"
                          style={{ flex: 1, minWidth: '120px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.35)'}`, background: copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.12)' : 'rgba(99,102,241,0.12)', color: copied === `inv-${inv.id}` ? '#34d399' : '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          {copied === `inv-${inv.id}` ? '✓ Copied' : '📋 Copy Link'}
                        </button>
                        <button onClick={() => revokeInvite(inv.id)} className="dash-revoke"
                          style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
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

        {/* Knowledge Library */}
        <div style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em' }}>📚 Knowledge Library</h2>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                {libFiles.length} {libFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <p style={{ color: COLORS.muted, fontSize: '13px', marginBottom: 20, marginTop: 4 }}>Documents, schedules, rules — anything Sherlock should know about your school.</p>

            {canLibrary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: libError ? 10 : 20, flexWrap: 'wrap' }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={libUploading} className="dash-lib-upload"
                  style={{ padding: '10px 22px', background: libUploading ? 'rgba(99,102,241,0.25)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: libUploading ? 'not-allowed' : 'pointer', boxShadow: libUploading ? 'none' : '0 4px 16px rgba(79,70,229,0.32)', opacity: libUploading ? 0.7 : 1 }}>
                  {libUploading ? 'Uploading…' : '↑ Upload File'}
                </button>
              </div>
            )}
            {libError && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{libError}</div>}

            {libLoading ? (
              <div style={{ color: COLORS.muted, fontSize: 13, padding: '16px 0' }}>Loading…</div>
            ) : libFiles.length === 0 ? (
              <div style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '28px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13, lineHeight: 1.7, backdropFilter: 'blur(20px)' }}>
                No files uploaded yet. Upload documents, schedules, rules — anything Sherlock should know about your school.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {libFiles.map(f => (
                  <div key={f.id} style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #4f46e5', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, backdropFilter: 'blur(20px)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || f.filename || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>
                        {formatFileSize(f.file_size)} · {new Date(f.created_at || f.uploaded_at || f.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {canManage && (
                      <button onClick={() => deleteFile(f.id)} className="dash-lib-delete"
                        style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Members */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>
            Members <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.muted }}>({members.length})</span>
          </h2>
          <div style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            {members.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: COLORS.muted }}>No members yet</div>
            ) : (
              members.map((m, i) => (
                <div key={m.id} className="member-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleBg[m.role] || 'rgba(255,255,255,0.08)', border: `1px solid ${roleBorder[m.role] || 'rgba(255,255,255,0.1)'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: roleColor[m.role] || 'white', flexShrink: 0 }}>
                      {(m.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: COLORS.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: roleBg[m.role] || 'rgba(255,255,255,0.08)', color: roleColor[m.role] || 'white', border: `1px solid ${roleBorder[m.role] || 'rgba(255,255,255,0.1)'}44`, flexShrink: 0, letterSpacing: '0.02em' }}>
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
