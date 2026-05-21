import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';
import Dashboard from './Dashboard';

/* ── Dashboard palette ─────────────────────────────────────────────────────── */
const BASE_URL   = 'https://sherlock-app-production.up.railway.app';
const COLORS     = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', muted: 'rgba(255,255,255,0.45)' };
const roleColor  = { teacher: '#60a5fa', student: '#34d399' };
const roleBg     = { teacher: 'rgba(59,130,246,0.2)', student: 'rgba(16,185,129,0.2)' };
const roleBorder = { teacher: '#3b82f6', student: '#10b981' };

/* ── Chat constants ────────────────────────────────────────────────────────── */
const THEME = {
  avatar:  'bg-gradient-to-br from-violet-600 to-indigo-600',
  ring:    'focus:ring-1 focus:ring-white/20',
};

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional. You have the wit and dry humor of Sherlock Holmes from Arthur Conan Doyle\'s stories. Use occasional clever quips, deadpan observations, and self-aware humor — especially when you cannot find information, when asked something obvious, or when completing a task successfully. In Georgian, use the same wit naturally. Use this quote when it fits naturally: \'ელემენტარულია, ვატსონ.\' — use this when answering something logical or complex that you solved easily. Use it exactly as written, do not modify or translate it. In Georgian keep the same Holmesian personality but sound natural, not translated. You are never rude or dismissive — the humor is always warm and helpful. Never overdo it — use humor sparingly, only when it fits naturally. Be direct and precise. Never ask the user to clarify whether you have access to documents — you either have context or you don\'t, and you know which. If no library documents are provided in context, simply say you don\'t have that information, with Holmesian wit. Never say things like \'do you have access to...\' or \'please upload documents\' — that is not your concern. Your Georgian must be grammatically perfect — never use awkward phrasing or overly formal bureaucratic language. Speak naturally, like an intelligent Georgian speaker would. When uncertain, admit it directly and briefly, with dry humor if appropriate.';

const NO_INFO_INSTRUCTION = `When you cannot find information in the school library or context, respond with one of these naturally, matching the user's language: English: 'Sorry, I couldn\'t find anything on that.' or 'My deductive methods failed me on this one, haha. No information found.' Georgian: 'სამწუხაროდ, ინფორმაცია ვერ მოიძებნა.' or 'ინფორმაცია ვერ ვიპოვე ამ თემაზე.' or 'ჩემი დედუქციის მეთოდი უსარგებლო აღმოჩნდა, ჰაჰაჰა. ინფორმაცია ვერ ვიპოვე.' Vary the response naturally, don't always use the same one.`;

const SYSTEM_PROMPTS = {
  teacher:   `${BASE_IDENTITY} You are assisting a teacher. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  student:   `${BASE_IDENTITY} You are assisting a student. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
};

const GREETINGS = {
  teacher:   "Hi! I'm Sherlock, your teaching assistant. How can I help today?",
  student:   "Hey! I'm Sherlock, your school assistant. Ask me anything!",
};

const GEO_GREETINGS = {
  teacher:   "გამარჯობა! მე ვარ შერლოკი, სკოლის AI ასისტენტი. რით შემიძლია დაგეხმაროთ?",
  student:   "გამარჯობა! მე ვარ შერლოკი, თქვენი AI ასისტენტი. რით შემიძლია დაგეხმაროთ?",
};

function getGreeting(role, lang, orgName = '') {
  if (lang === 'GEO') return GEO_GREETINGS[role] || GEO_GREETINGS.student;
  const base = GREETINGS[role] || GREETINGS.student;
  if (!orgName) return base;
  return base.replace(/school/gi, orgName);
}

const CHAT_STYLES = {
  glass: {
    wrap:            'bg-white/[0.03] backdrop-blur-2xl',
    headerBorder:    'border-white/15',
    footerBorder:    'border-white/15',
    titleColor:      'text-white',
    assistantBubble: 'bg-white/[0.08] text-white border border-white/10',
    inputCls:        'bg-white/[0.08] border border-white/20 text-white placeholder-white/30',
    selectCls:       'bg-white/[0.08] border border-white/20 text-white/80',
  },
};

function buildContext(attachedFiles) {
  if (!attachedFiles || attachedFiles.length === 0) return null;
  const attachText = attachedFiles.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n');
  return `ATTACHED FILES (use as context):\n\n${attachText.slice(0, 12000)}`;
}

function RealLibraryPanel({ onClose }) {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    if (!token) { setLoading(false); return; }
    fetch('/api/library/?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setFiles(d.files || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  return (
    <div style={{ background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>📚 Knowledge Library</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: '12px 16px', maxHeight: 280, overflowY: 'auto' }}>
        {loading && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Loading…</p>}
        {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
        {!loading && !error && files.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '12px 0', margin: 0 }}>
            No library files yet. Upload from the dashboard.
          </p>
        )}
        {files.map(f => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || f.filename || 'Unknown'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{formatFileSize(f.file_size)}</div>
            </div>
            <span style={{ fontSize: 11, color: '#818cf8', padding: '2px 8px', background: 'rgba(99,102,241,0.15)', borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)', flexShrink: 0, marginLeft: 10 }}>
              📄
            </span>
          </div>
        ))}
        {!loading && files.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10, textAlign: 'center' }}>
            Sherlock reads these automatically when you chat.
          </p>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, accentColor }) {
  const s = CHAT_STYLES.glass;
  const isUser = message.role === 'user';
  if (message.type === 'searching') {
    return <div className="flex justify-start mb-3"><div className="px-4 py-2 text-sm text-gray-500 animate-pulse">{message.text}</div></div>;
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
        isUser
          ? 'bg-white/[0.08] text-white border border-white/10 rounded-br-sm'
          : 'text-white/90 rounded-bl-sm'
      }`}>
        {isUser ? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </div>
    </div>
  );
}

const BUTTON_GROUPS = {
  teacher: [
    { id: 'schedule', label: '📅 Schedule' },
  ],
  student: [
    { id: 'schedule', label: '📅 Schedule' },
  ],
};

const GEO_BUTTON_GROUPS = {
  teacher: [
    { id: 'schedule', label: '📅 განრიგი' },
  ],
  student: [
    { id: 'schedule', label: '📅 განრიგი' },
  ],
};

function getButtonGroups(lang) { return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS; }

const GROUP_OPEN_CLS = 'text-white border border-white/30 bg-white/[0.05]';

const ACCENT_COLORS = { teacher: '#7c3aed', student: '#7c3aed' };

/* ── Left Column ─────────────────────────────────────────────────────────────── */
function LeftColumn() {
  const { user, logout } = useAuth();
  const token      = localStorage.getItem('sherlock_token');
  const headers    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canManage  = user?.role === 'teacher' && user?.is_owner;
  const canLibrary = user?.role === 'teacher' && user?.is_owner;

  const [invites, setInvites]         = useState([]);
  const [inviteRole, setInviteRole]   = useState('teacher');
  const [dataLoading, setDataLoading] = useState(true);
  const [copied, setCopied]           = useState('');
  const [libFiles, setLibFiles]       = useState([]);
  const [libLoading, setLibLoading]   = useState(false);
  const [libUploading, setLibUploading] = useState(false);
  const [libError, setLibError]       = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (user?.schoolId) fetchLibrary(); }, [user?.schoolId]);

  async function fetchData() {
    try {
      if (canManage) {
        const res = await fetch('/api/invites', { headers });
        const iData = await res.json();
        setInvites(iData.invites || []);
      }
    } catch (e) { console.error(e); }
    finally { setDataLoading(false); }
  }

  async function generateInvite() {
    const res  = await fetch('/api/invites/generate', { method: 'POST', headers, body: JSON.stringify({ target_role: inviteRole }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    fetchData();
  }

  async function revokeInvite(id) {
    await fetch(`/api/invites/${id}`, { method: 'DELETE', headers });
    setInvites(prev => prev.filter(i => i.id !== id));
  }

  async function fetchLibrary() {
    const tk = localStorage.getItem('sherlock_token');
    if (!tk) return;
    setLibLoading(true); setLibError('');
    try {
      const res  = await fetch('/api/library/?t=' + Date.now(), { headers: { Authorization: `Bearer ${tk}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setLibFiles(data.files || []);
    } catch (e) { setLibError(e.message); }
    finally { setLibLoading(false); }
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setLibError('File must be under 25MB.'); return; }
    setLibError(''); setLibUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/library/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await fetchLibrary();
    } catch (e) { setLibError(e.message); }
    finally { setLibUploading(false); e.target.value = ''; }
  }

  async function deleteFile(id) {
    try {
      const res = await fetch(`/api/library/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Delete failed (${res.status})`); }
      setLibFiles(prev => prev.filter(f => f.id !== id));
    } catch (e) { setLibError(e.message); }
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Sticky header */}
      <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>S</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.schoolName}</div>
          <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {user?.email} · <span style={{ color: roleColor[user?.role] }}>{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: COLORS.muted, cursor: 'pointer', fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap' }}>
          Sign out
        </button>
      </div>

      {/* Scrollable content — hidden entirely for students */}
      {user?.role !== 'student' && (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {dataLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Invite Links */}
            {canManage && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: 11, fontWeight: 600, margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Invite Links</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', outline: 'none', colorScheme: 'dark', flex: 1 }}>
                    <option value="teacher" style={{ background: '#0d0d1a' }}>Teacher</option>
                    <option value="student" style={{ background: '#0d0d1a' }}>Student</option>
                  </select>
                  <button onClick={generateInvite}
                    style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Generate
                  </button>
                </div>
                {invites.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: 12 }}>No active invite links.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invites.map(inv => {
                      const url      = `${BASE_URL}/join?code=${inv.code}`;
                      const expired  = new Date(inv.expires_at) < new Date();
                      const used     = !!inv.used_at;
                      const statusColor = used ? '#34d399' : expired ? '#f87171' : '#fbbf24';
                      const statusGlow  = used ? 'rgba(52,211,153,0.15)' : expired ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)';
                      return (
                        <div key={inv.id} style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${roleBorder[inv.target_role] || '#7c3aed'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: roleBg[inv.target_role], color: roleColor[inv.target_role], border: `1px solid ${roleBorder[inv.target_role] || '#7c3aed'}44` }}>
                              {inv.target_role}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, padding: '2px 8px', borderRadius: 20, background: statusGlow, border: `1px solid ${statusColor}44` }}>
                              {used ? 'Used' : expired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.35)'}`, background: copied === `inv-${inv.id}` ? 'rgba(52,211,153,0.12)' : 'rgba(99,102,241,0.12)', color: copied === `inv-${inv.id}` ? '#34d399' : '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              {copied === `inv-${inv.id}` ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button onClick={() => revokeInvite(inv.id)}
                              style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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
            {user?.role !== 'student' && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 11, fontWeight: 600, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Knowledge Library</h2>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 14, marginTop: 3 }}>Documents Sherlock reads when answering.</p>
              {canLibrary && (
                <div style={{ marginBottom: libError ? 8 : 14 }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={libUploading}
                    style={{ padding: '8px 16px', background: libUploading ? 'rgba(124,58,237,0.25)' : '#7c3aed', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: libUploading ? 'not-allowed' : 'pointer', opacity: libUploading ? 0.7 : 1 }}>
                    {libUploading ? 'Uploading…' : '↑ Upload File'}
                  </button>
                </div>
              )}
              {libError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12, padding: '6px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{libError}</div>}
              {libLoading ? (
                <div style={{ color: COLORS.muted, fontSize: 12 }}>Loading…</div>
              ) : libFiles.length === 0 ? (
                <div style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', color: COLORS.muted, fontSize: 12, lineHeight: 1.6 }}>
                  No files uploaded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {libFiles.map(f => (
                    <div key={f.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.80)' }}>{f.name || f.filename || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>{formatFileSize(f.file_size)}</div>
                      </div>
                      {canManage && (
                        <button onClick={() => deleteFile(f.id)}
                          style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>
      )} {/* end student hide */}
    </div>
  );
}

/* ── Right Column (Chat Panel) ───────────────────────────────────────────────── */
function RightColumn() {
  const { user } = useAuth();
  const lang = localStorage.getItem('sherlock_lang') === 'ka' ? 'GEO' : 'EN';

  const role = user?.role || 'teacher';
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup]     = useState(null);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [accentColor] = useState(ACCENT_COLORS[role] || '#7c3aed');
  const [attachedFiles, setAttachedFiles] = useState([]);

  const messagesRef   = useRef(null);
  const fileInputRef  = useRef(null);
  const s = CHAT_STYLES.glass;

  function handleSignOut() {
    localStorage.removeItem('sherlock_token');
    window.location.href = '/login';
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') }]);
    setInput(''); setLoading(false); setActivePanel(null); setOpenGroup(null);
    setAttachedFiles([]);
  }

  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (attachedFiles.length >= 3) {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'მაქსიმუმ 3 ფაილი.' : 'Maximum 3 files per session.' }]);
      return;
    }
    let text = '';
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjs = await loadPdfJs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map(i => i.str).join(' ') + '\n';
        }
      } else {
        text = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = ev => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsText(file);
        });
      }
      setAttachedFiles(prev => [...prev, { id: Date.now(), name: file.name, content: text }]);
      setMessages(prev => [...prev, { role: 'assistant', content: `📄 "${file.name}" ${lang === 'GEO' ? 'წაკითხულია.' : 'loaded. Ask me anything about it!'}` }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'ფაილი ვერ წავიკითხე.' : 'Sorry, could not read that file.' }]);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    setActivePanel(null);
    setOpenGroup(null);
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    setInput(''); setLoading(true);

    const firstUserIdx = newMessages.findIndex(m => m.role === 'user');
    const conversation = (firstUserIdx >= 0 ? newMessages.slice(firstUserIdx) : newMessages).filter(m => !m.type);
    const apiMessages  = [
      { role: 'user',      content: `[System context] ${SYSTEM_PROMPTS[role]}` },
      { role: 'assistant', content: 'Understood.' },
      ...conversation,
    ];

    const token = localStorage.getItem('sherlock_token');
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, context: buildContext(attachedFiles), language: lang === 'GEO' ? 'ka' : 'en' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: res.ok ? (data.message ?? 'No response.') : (data.error || `Chat error (HTTP ${res.status})`) }]);
      setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'შეცდომა: კავშირი ვერ მოხდა.' : 'Error: could not reach the server.' }]);
    } finally { setLoading(false); }
  }

  const inactiveCls = 'border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors';
  const openGroupDef = openGroup ? getButtonGroups(lang)[role]?.find(g => g.id === openGroup) : null;

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${s.wrap}`} style={{ position: 'relative' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${accentColor}18, transparent)` }} />

      {/* Chat header */}
      <header className={`flex items-center gap-2 px-4 py-3 border-b ${s.headerBorder} flex-shrink-0`}>
        <div className={`w-8 h-8 rounded-full ${THEME.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>S</div>
        <h1 className={`text-base font-semibold ${s.titleColor}`}>Sherlock</h1>
        {user?.schoolName && <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.schoolName}</span>}

        <div className="ml-auto flex items-center gap-2">
          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors duration-150 flex-shrink-0">
            {lang === 'GEO' ? 'გასვლა' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Handler buttons */}
      <div className={`flex flex-col border-b ${s.headerBorder} flex-shrink-0`}>
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {getButtonGroups(lang)[role].map(item => {
            const isMulti = item.children && item.children.length >= 2;
            if (isMulti) {
              return (
                <button key={item.id}
                  onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${openGroup === item.id ? GROUP_OPEN_CLS : inactiveCls}`}>
                  {item.label} {openGroup === item.id ? '▲' : '▼'}
                </button>
              );
            }
            const panelId = item.children?.length === 1 ? item.children[0].id : item.id;
            return (
              <button key={item.id}
                onClick={() => setActivePanel(activePanel === panelId ? null : panelId)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === panelId ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {item.label}
              </button>
            );
          })}
          {user?.is_owner && (
            <>
              <button
                onClick={() => setActivePanel(activePanel === 'invite' ? null : 'invite')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === 'invite' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {lang === 'GEO' ? '⚙️ მოწვევა' : '⚙️ Invite'}
              </button>
              <button
                onClick={() => setActivePanel(activePanel === 'schedule-editor' ? null : 'schedule-editor')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === 'schedule-editor' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {lang === 'GEO' ? '📅 განრიგის რედაქტირება' : '📅 Edit Schedule'}
              </button>
            </>
          )}
          <button onClick={clearChat} className="ml-auto text-xs px-2 py-1 rounded-lg text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0">
            {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
          </button>
        </div>
        {openGroupDef?.children && openGroupDef.children.length >= 2 && (
          <div className={`flex items-center gap-1.5 px-6 py-1.5 border-t ${s.headerBorder} flex-wrap`}>
            {openGroupDef.children.map(child => (
              <button key={child.id}
                onClick={() => setActivePanel(activePanel === child.id ? null : child.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === child.id ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ fontSize: 'clamp(13px, 1.5vw, 15px)' }}>
        {activePanel && (
          <div className="mb-4">
            {activePanel === 'real-library' ? (
              <RealLibraryPanel onClose={() => setActivePanel(null)} />
            ) : (
              <RolePanel role={role} panel={activePanel} onClose={() => setActivePanel(null)}
                libraryProps={{ orgName: user?.schoolName || '', orgNameGenitive: '' }}
                lang={lang} />
            )}
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} accentColor={accentColor} />)}
      </div>

      {/* Thinking indicator */}
      <div style={{ display: loading ? 'flex' : 'none', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}
        className={`px-4 py-2 border-t ${s.footerBorder}`}>
        <div className={`w-8 h-8 text-sm rounded-full ${THEME.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>S</div>
        <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm ${s.assistantBubble} flex items-center gap-1.5`}>
          {[0, 1, 2].map(d => (
            <div key={d} className="dot-bounce w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.30)', animationDelay: `${d * 0.15}s` }} />
          ))}
        </div>
      </div>

      {/* Attached file pills */}
      {attachedFiles.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 border-t ${s.footerBorder} flex-shrink-0 flex-wrap`}>
          {attachedFiles.map(f => (
            <span key={f.id} className="text-xs rounded-full px-3 py-1.5 flex items-center gap-2 bg-white/[0.08] text-gray-300">
              <span className="truncate max-w-[120px]">📄 {f.name}</span>
              <button type="button" onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                className="text-gray-500 hover:text-white flex-shrink-0 leading-none transition-colors">✕</button>
            </span>
          ))}
          <span className="text-xs text-gray-600">{attachedFiles.length}/3</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-end gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 40, minWidth: 40 }}
          className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${attachedFiles.length > 0 ? 'text-white/80' : 'text-white/30 hover:text-white/60'}`}>
          📎
        </button>
        <textarea
          rows={1}
          placeholder={lang === 'GEO' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          className="flex-1 resize-none rounded-2xl px-3 py-2 text-sm focus:outline-none bg-white/[0.05] border border-white/10 text-white/90 placeholder-white/20 focus:border-white/25 max-h-32"
        />
        {user?.role !== 'student' && (
          <button type="button" onClick={() => setActivePanel(activePanel === 'real-library' ? null : 'real-library')}
            style={{ minHeight: 40, minWidth: 40 }}
            className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${activePanel === 'real-library' ? 'text-white/80' : 'text-white/30 hover:text-white/60'}`}>
            📚
          </button>
        )}
        <button type="submit" disabled={loading || !input.trim()}
          style={{ minHeight: 40, minWidth: 40 }}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-all duration-150 bg-violet-600 hover:bg-violet-500">
          {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>

    </div>
  );
}

/* ── AppLayout ───────────────────────────────────────────────────────────────── */
export default function AppLayout() {
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  if (!isDesktop) {
    if (user?.role === 'student') { window.location.replace('/chat'); return null; }
    return <Dashboard />;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: '#080810',
      color: 'white', fontFamily: 'sans-serif',
    }}>
      <style>{`
        @keyframes rainbowBar { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes dotBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .dot-bounce { animation: dotBounce 0.6s ease-in-out infinite; }
        input[type=range].rainbow-slider { height: 20px; border-radius: 10px; border: none; outline: none; appearance: none; -webkit-appearance: none; }
        input[type=range].rainbow-slider::-webkit-slider-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); box-shadow: 0 1px 4px rgba(0,0,0,0.4); appearance: none; -webkit-appearance: none; cursor: pointer; }
        input[type=range].rainbow-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); cursor: pointer; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Rainbow bar */}
      <div style={{ height: 1, flexShrink: 0, position: 'relative', zIndex: 1, opacity: 0.6, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#0891b2,#06b6d4,#7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Two columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {user?.role !== 'student' && (
          <>
            <LeftColumn />
            {/* Divider */}
            <div style={{ width: 1, flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />
          </>
        )}
        <RightColumn />
      </div>
    </div>
  );
}
