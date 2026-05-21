import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';

const BASE_URL = 'https://sherlock-app-production.up.railway.app';

const COLORS = {
  bg: '#ffffff',
  card: '#ffffff',
  border: '#e5e7eb',
  purple: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
};

const roleColor  = { teacher: '#2563eb', student: '#10b981' };
const roleBg     = { teacher: '#eff6ff', student: '#ecfdf5' };
const roleBorder = { teacher: '#2563eb', student: '#10b981' };
const roleGlow   = { teacher: 'rgba(37,99,235,0.12)', student: 'rgba(16,185,129,0.12)' };

export default function Dashboard() {
  const { user, logout } = useAuth();
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
  const canManage = user?.role === 'teacher' && user?.is_owner;
  const canLibrary = user?.role === 'teacher' && user?.is_owner;

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchLibrary(); }, [user?.schoolId]);

  const fetchData = async () => {
    try {
      if (canManage) {
        const res = await fetch('/api/invites', { headers });
        const invData = await res.json();
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: COLORS.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .member-row { transition: background 0.15s ease; }
        .member-row:hover { background: #fafafa !important; }
        .dash-open-chat { transition: background 0.15s ease; }
        .dash-open-chat:hover { background: #1d4ed8 !important; }
        .dash-signout { transition: background 0.15s ease; }
        .dash-signout:hover { background: #fef2f2 !important; }
        .dash-generate { transition: background 0.15s ease; }
        .dash-generate:hover { background: #1d4ed8 !important; }
        .dash-copy { transition: background 0.15s ease; }
        .dash-copy:hover { background: #f9fafb !important; }
        .dash-revoke { transition: background 0.15s ease; }
        .dash-revoke:hover { background: #fef2f2 !important; }
        .dash-lib-upload { transition: background 0.15s ease; }
        .dash-lib-upload:hover:not(:disabled) { background: #1d4ed8 !important; }
        .dash-lib-delete { transition: background 0.15s ease; }
        .dash-lib-delete:hover { background: #fef2f2 !important; }
      `}</style>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{user?.schoolName}</div>
            <div style={{ color: COLORS.muted, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
              {user?.email} · <span style={{ color: roleColor[user?.role] || '#6b7280' }}>{user?.role}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => window.location.href = '/chat'} className="dash-open-chat"
            style={{ padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', letterSpacing: '0.01em' }}>
            Open Chat
          </button>
          <button onClick={logout} className="dash-signout"
            style={{ padding: '9px 16px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Invite Links */}
        {canManage && (
          <div style={{ marginBottom: '44px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>Invite Links</h2>
            <p style={{ color: COLORS.muted, fontSize: '13px', marginBottom: '20px', marginTop: 4 }}>Generate one-time invite links. Links expire in 7 days.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
                <option value="teacher" style={{ background: '#ffffff', color: '#111827' }}>Teacher</option>
                <option value="student" style={{ background: '#ffffff', color: '#111827' }}>Student</option>
              </select>
              <button onClick={generateInvite} className="dash-generate"
                style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Generate Invite Link
              </button>
            </div>

            {invites.length === 0 ? (
              <div style={{ color: COLORS.muted, fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No active invite links.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invites.map(inv => {
                  const url = `${BASE_URL}/join?code=${inv.code}`;
                  const expired = new Date(inv.expires_at) < new Date();
                  const used = !!inv.used_at;
                  const statusColor = used ? '#6b7280' : expired ? '#dc2626' : '#10b981';
                  const statusGlow  = used ? '#f3f4f6' : expired ? '#fef2f2' : '#ecfdf5';
                  return (
                    <div key={inv.id} style={{ background: COLORS.card, border: '1px solid #e5e7eb', borderLeft: `3px solid ${roleBorder[inv.target_role] || '#2563eb'}`, borderRadius: '8px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: roleBg[inv.target_role], color: roleColor[inv.target_role], border: `1px solid ${roleBorder[inv.target_role] || '#2563eb'}`, letterSpacing: '0.02em' }}>
                          {inv.target_role}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: COLORS.muted }}>{new Date(inv.expires_at).toLocaleDateString()}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor, padding: '3px 10px', borderRadius: 20, background: statusGlow, border: `1px solid ${statusColor}` }}>
                            {used ? 'Used' : expired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)} className="dash-copy"
                          style={{ flex: 1, minWidth: '120px', padding: '8px 14px', borderRadius: '6px', border: `1px solid ${copied === `inv-${inv.id}` ? '#3b82f6' : '#e5e7eb'}`, background: copied === `inv-${inv.id}` ? '#eff6ff' : '#ffffff', color: copied === `inv-${inv.id}` ? '#2563eb' : '#111827', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          {copied === `inv-${inv.id}` ? '✓ Copied' : '📋 Copy Link'}
                        </button>
                        <button onClick={() => revokeInvite(inv.id)} className="dash-revoke"
                          style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
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
        {user?.role !== 'student' && <div style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, letterSpacing: '-0.01em' }}>📚 Knowledge Library</h2>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', border: '1px solid #2563eb' }}>
                {libFiles.length} {libFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <p style={{ color: COLORS.muted, fontSize: '13px', marginBottom: 20, marginTop: 4 }}>Documents, schedules, rules — anything Sherlock should know about your school.</p>

            {canLibrary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: libError ? 10 : 20, flexWrap: 'wrap' }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={libUploading} className="dash-lib-upload"
                  style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: 6, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: libUploading ? 'not-allowed' : 'pointer', opacity: libUploading ? 0.6 : 1 }}>
                  {libUploading ? 'Uploading…' : '↑ Upload File'}
                </button>
              </div>
            )}
            {libError && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>{libError}</div>}

            {libLoading ? (
              <div style={{ color: COLORS.muted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Loading…</div>
            ) : libFiles.length === 0 ? (
              <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '28px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 14, fontStyle: 'italic', lineHeight: 1.7 }}>
                No files uploaded yet. Upload documents, schedules, rules — anything Sherlock should know about your school.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {libFiles.map(f => (
                  <div key={f.id} style={{ background: COLORS.card, border: '1px solid #e5e7eb', borderLeft: '3px solid #2563eb', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || f.filename || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>
                        {formatFileSize(f.file_size)} · {new Date(f.created_at || f.uploaded_at || f.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {canManage && (
                      <button onClick={() => deleteFile(f.id)} className="dash-lib-delete"
                        style={{ padding: '7px 14px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
}
