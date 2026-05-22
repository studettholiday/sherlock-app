import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';
import Dashboard from './Dashboard';

/* ── Dashboard palette ─────────────────────────────────────────────────────── */
const BASE_URL   = 'https://sherlock-app-production.up.railway.app';
const COLORS     = { card: '#ffffff', border: '#e5e7eb', muted: '#6b7280' };
const roleColor  = { student: '#10b981' };
const roleBg     = { student: '#eff6ff' };
const roleBorder = { student: '#10b981' };

/* ── Chat constants ────────────────────────────────────────────────────────── */
const THEME = {
  avatar:  'bg-[#eff6ff] text-[#2563eb]',
  ring:    'focus:border-[#3b82f6]',
};

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional. You have the wit and dry humor of Sherlock Holmes from Arthur Conan Doyle\'s stories. Use occasional clever quips, deadpan observations, and self-aware humor — especially when you cannot find information, when asked something obvious, or when completing a task successfully. In Georgian, use the same wit naturally. Use this quote when it fits naturally: \'ელემენტარულია, ვატსონ.\' — use this when answering something logical or complex that you solved easily. Use it exactly as written, do not modify or translate it. In Georgian keep the same Holmesian personality but sound natural, not translated. You are never rude or dismissive — the humor is always warm and helpful. Never overdo it — use humor sparingly, only when it fits naturally. Be direct and precise. Never ask the user to clarify whether you have access to documents — you either have context or you don\'t, and you know which. If no library documents are provided in context, simply say you don\'t have that information, with Holmesian wit. Never say things like \'do you have access to...\' or \'please upload documents\' — that is not your concern. Your Georgian must be grammatically perfect — never use awkward phrasing or overly formal bureaucratic language. Speak naturally, like an intelligent Georgian speaker would. When uncertain, admit it directly and briefly, with dry humor if appropriate.';

const NO_INFO_INSTRUCTION = `When you cannot find information in the school library or context, respond with one of these naturally, matching the user's language: English: 'Sorry, I couldn\'t find anything on that.' or 'My deductive methods failed me on this one, haha. No information found.' Georgian: 'სამწუხაროდ, ინფორმაცია ვერ მოიძებნა.' or 'ინფორმაცია ვერ ვიპოვე ამ თემაზე.' or 'ჩემი დედუქციის მეთოდი უსარგებლო აღმოჩნდა, ჰაჰაჰა. ინფორმაცია ვერ ვიპოვე.' Vary the response naturally, don't always use the same one.`;

const SYSTEM_PROMPTS = {
  student:   `${BASE_IDENTITY} You are assisting a student. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
};

const GREETINGS = {
  student:   "Hey! I'm Sherlock, your school assistant. Ask me anything!",
};

const GEO_GREETINGS = {
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
    wrap:            'bg-[#ffffff]',
    headerBorder:    'border-[#e5e7eb]',
    footerBorder:    'border-[#e5e7eb]',
    titleColor:      'text-[#111827]',
    assistantBubble: 'bg-[#ffffff] text-[#111827] border border-[#e5e7eb]',
    inputCls:        'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] placeholder-[#9ca3af]',
    selectCls:       'bg-[#ffffff] border border-[#e5e7eb] text-[#111827]',
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
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>📚 Knowledge Library</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: '12px 16px', maxHeight: 280, overflowY: 'auto' }}>
        {loading && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Loading…</p>}
        {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
        {!loading && !error && files.length === 0 && (
          <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', margin: 0 }}>
            No library files yet. Upload from the dashboard.
          </p>
        )}
        {files.map(f => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || f.filename || 'Unknown'}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{formatFileSize(f.file_size)}</div>
            </div>
            <span style={{ fontSize: 11, color: '#2563eb', padding: '2px 8px', background: '#eff6ff', borderRadius: 6, border: '1px solid #e5e7eb', flexShrink: 0, marginLeft: 10 }}>
              📄
            </span>
          </div>
        ))}
        {!loading && files.length > 0 && (
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10, textAlign: 'center' }}>
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
      <div className={`max-w-[70%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words ${
        isUser
          ? 'bg-[#eff6ff] text-[#111827] rounded-br-sm'
          : 'bg-[#ffffff] text-[#111827] border border-[#e5e7eb] rounded-bl-sm'
      }`}>
        {isUser ? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </div>
    </div>
  );
}

const BUTTON_GROUPS = {
  student: [
    { id: 'schedule', label: '📅 Schedule' },
  ],
};

const GEO_BUTTON_GROUPS = {
  student: [
    { id: 'schedule', label: '📅 განრიგი' },
  ],
};

function getButtonGroups(lang) { return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS; }

const GROUP_OPEN_CLS = 'bg-[#eff6ff] text-[#2563eb] border border-[#3b82f6]';

const ACCENT_COLORS = { student: '#2563eb' };

/* ── Left Column ─────────────────────────────────────────────────────────────── */
function LeftColumn() {
  const { user, logout } = useAuth();
  const token      = localStorage.getItem('sherlock_token');
  const headers    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canManage  = user?.is_owner;
  const canLibrary = user?.is_owner;

  const [invites, setInvites]         = useState([]);
  const [inviteRole, setInviteRole]   = useState('student');
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
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fafafa', borderRight: '1px solid #e5e7eb' }}>
      {/* Sticky header */}
      <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>S</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.schoolName}</div>
          <div style={{ color: COLORS.muted, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {user?.email} · <span style={{ color: roleColor[user?.role] }}>{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
          Sign out
        </button>
      </div>

      {/* Scrollable content — hidden entirely for students */}
      {user?.role !== 'student' && (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {dataLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Invite Links */}
            {canManage && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>Invite Links</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, color: '#111827', fontSize: 14, cursor: 'pointer', outline: 'none', colorScheme: 'light', flex: 1 }}>
                    <option value="student" style={{ background: '#ffffff', color: '#111827' }}>Student</option>
                  </select>
                  <button onClick={generateInvite}
                    style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: 6, color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                    Generate
                  </button>
                </div>
                {invites.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: 14, fontStyle: 'italic' }}>No active invite links.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invites.map(inv => {
                      const url      = `${BASE_URL}/join?code=${inv.code}`;
                      const expired  = new Date(inv.expires_at) < new Date();
                      const used     = !!inv.used_at;
                      const statusColor = used ? '#10b981' : expired ? '#dc2626' : '#6b7280';
                      const statusGlow  = used ? '#eff6ff' : expired ? '#fef2f2' : '#fafafa';
                      return (
                        <div key={inv.id} style={{ background: COLORS.card, border: '1px solid #e5e7eb', borderLeft: `3px solid ${roleBorder[inv.target_role] || '#2563eb'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 6, background: roleBg[inv.target_role], color: roleColor[inv.target_role], border: `1px solid #e5e7eb` }}>
                              {inv.target_role}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: statusColor, padding: '2px 8px', borderRadius: 6, background: statusGlow, border: `1px solid #e5e7eb` }}>
                              {used ? 'Used' : expired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => copyToClipboard(url, `inv-${inv.id}`)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${copied === `inv-${inv.id}` ? '#3b82f6' : '#e5e7eb'}`, background: copied === `inv-${inv.id}` ? '#eff6ff' : '#ffffff', color: copied === `inv-${inv.id}` ? '#2563eb' : '#111827', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                              {copied === `inv-${inv.id}` ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button onClick={() => revokeInvite(inv.id)}
                              style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
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
                <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>Knowledge Library</h2>
              </div>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 14, marginTop: 3 }}>Documents Sherlock reads when answering.</p>
              {canLibrary && (
                <div style={{ marginBottom: libError ? 8 : 14 }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={libUploading}
                    style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, color: '#111827', fontSize: 14, fontWeight: 500, cursor: libUploading ? 'not-allowed' : 'pointer', opacity: libUploading ? 0.6 : 1 }}>
                    {libUploading ? 'Uploading…' : '↑ Upload File'}
                  </button>
                </div>
              )}
              {libError && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>{libError}</div>}
              {libLoading ? (
                <div style={{ color: COLORS.muted, fontSize: 14, fontStyle: 'italic' }}>Loading…</div>
              ) : libFiles.length === 0 ? (
                <div style={{ background: COLORS.card, border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 16px', textAlign: 'center', color: COLORS.muted, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6 }}>
                  No files uploaded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {libFiles.map(f => (
                    <div key={f.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111827' }}>{f.name || f.filename || 'Unknown'}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{formatFileSize(f.file_size)}</div>
                      </div>
                      {canManage && (
                        <button onClick={() => deleteFile(f.id)}
                          style={{ padding: '5px 10px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
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

  const role = user?.role || 'student';
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup]     = useState(null);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [accentColor] = useState(ACCENT_COLORS[role] || '#2563eb');
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

  const inactiveCls = 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb] transition-colors duration-150';
  const openGroupDef = openGroup ? getButtonGroups(lang)[role]?.find(g => g.id === openGroup) : null;

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${s.wrap}`} style={{ position: 'relative' }}>
      {/* Chat header */}
      <header className={`flex items-center gap-2 px-4 py-3 border-b ${s.headerBorder} flex-shrink-0 bg-[#ffffff]`}>
        <div className={`w-8 h-8 rounded-full ${THEME.avatar} flex items-center justify-center font-bold flex-shrink-0`}>S</div>
        <h1 className="text-[18px] font-semibold text-[#111827]">Sherlock</h1>
        {user?.schoolName && <span className="text-[14px] font-normal ml-1" style={{ color: '#6b7280' }}>{user.schoolName}</span>}

        <div className="ml-auto flex items-center gap-2">
          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-[13px] font-medium px-3 py-1.5 rounded-md border border-[#fecaca] text-[#dc2626] bg-[#ffffff] hover:bg-[#fef2f2] transition-colors duration-150 flex-shrink-0">
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
                  className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${openGroup === item.id ? GROUP_OPEN_CLS : inactiveCls}`}>
                  {item.label} {openGroup === item.id ? '▲' : '▼'}
                </button>
              );
            }
            const panelId = item.children?.length === 1 ? item.children[0].id : item.id;
            return (
              <button key={item.id}
                onClick={() => setActivePanel(activePanel === panelId ? null : panelId)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === panelId ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {item.label}
              </button>
            );
          })}
          {user?.is_owner && (
            <>
              <button
                onClick={() => setActivePanel(activePanel === 'invite' ? null : 'invite')}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === 'invite' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {lang === 'GEO' ? '⚙️ მოწვევა' : '⚙️ Invite'}
              </button>
              <button
                onClick={() => setActivePanel(activePanel === 'schedule-editor' ? null : 'schedule-editor')}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === 'schedule-editor' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {lang === 'GEO' ? '📅 განრიგის რედაქტირება' : '📅 Edit Schedule'}
              </button>
            </>
          )}
          <button onClick={clearChat} className="ml-auto text-[13px] font-medium px-2.5 py-1.5 rounded-md text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors duration-150 flex-shrink-0">
            {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
          </button>
        </div>
        {openGroupDef?.children && openGroupDef.children.length >= 2 && (
          <div className={`flex items-center gap-1.5 px-6 py-1.5 border-t ${s.headerBorder} flex-wrap`}>
            {openGroupDef.children.map(child => (
              <button key={child.id}
                onClick={() => setActivePanel(activePanel === child.id ? null : child.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === child.id ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
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
        <div className={`w-8 h-8 text-sm rounded-full ${THEME.avatar} flex items-center justify-center font-bold flex-shrink-0`}>S</div>
        <div className={`px-3.5 py-2.5 rounded-xl rounded-bl-sm ${s.assistantBubble} flex items-center gap-1.5`}>
          {[0, 1, 2].map(d => (
            <div key={d} className="dot-bounce w-2 h-2 rounded-full" style={{ background: '#9ca3af', animationDelay: `${d * 0.15}s` }} />
          ))}
        </div>
      </div>

      {/* Attached file pills */}
      {attachedFiles.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 border-t ${s.footerBorder} flex-shrink-0 flex-wrap`}>
          {attachedFiles.map(f => (
            <span key={f.id} className="text-[13px] rounded-md px-3 py-1.5 flex items-center gap-2 bg-[#fafafa] border border-[#e5e7eb] text-[#111827]">
              <span className="truncate max-w-[120px]">📄 {f.name}</span>
              <button type="button" onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                className="text-[#9ca3af] hover:text-[#111827] flex-shrink-0 leading-none transition-colors duration-150">✕</button>
            </span>
          ))}
          <span className="text-[13px] text-[#9ca3af]">{attachedFiles.length}/3</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-end gap-2 px-4 py-3 border-t border-[#e5e7eb] flex-shrink-0">
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 40, minWidth: 40 }}
          className={`px-3 py-2 rounded-md text-sm flex-shrink-0 transition-colors duration-150 ${attachedFiles.length > 0 ? 'bg-[#eff6ff] border border-[#3b82f6] text-[#2563eb]' : 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb]'}`}>
          📎
        </button>
        <textarea
          rows={1}
          placeholder={lang === 'GEO' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          className={`flex-1 resize-none rounded-md text-[16px] focus:outline-none ${s.inputCls} ${THEME.ring} focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] max-h-32`}
          style={{ padding: '10px 14px' }}
        />
        {user?.role !== 'student' && (
          <button type="button" onClick={() => setActivePanel(activePanel === 'real-library' ? null : 'real-library')}
            style={{ minHeight: 40, minWidth: 40 }}
            className={`px-3 py-2 rounded-md text-sm flex-shrink-0 transition-colors duration-150 ${activePanel === 'real-library' ? 'bg-[#eff6ff] border border-[#3b82f6] text-[#2563eb]' : 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb]'}`}>
            📚
          </button>
        )}
        <button type="submit" disabled={loading || !input.trim()}
          style={{ minHeight: 40, minWidth: 40 }}
          className="px-4 py-2 rounded-md text-white text-sm font-medium disabled:opacity-40 transition-colors duration-150 bg-[#2563eb] hover:bg-[#1d4ed8]">
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
      background: '#ffffff',
      color: '#111827',
    }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes dotBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .dot-bounce { animation: dotBounce 0.6s ease-in-out infinite; }
        input[type=range].rainbow-slider { height: 20px; border-radius: 10px; border: none; outline: none; appearance: none; -webkit-appearance: none; }
        input[type=range].rainbow-slider::-webkit-slider-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); box-shadow: 0 1px 4px rgba(0,0,0,0.4); appearance: none; -webkit-appearance: none; cursor: pointer; }
        input[type=range].rainbow-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); cursor: pointer; }
      `}</style>

      {/* Two columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {user?.role !== 'student' && (
          <>
            <LeftColumn />
            {/* Divider */}
            <div style={{ width: 1, flexShrink: 0, background: '#e5e7eb' }} />
          </>
        )}
        <RightColumn />
      </div>
    </div>
  );
}
