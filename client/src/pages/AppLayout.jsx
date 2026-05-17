import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';
import Dashboard from './Dashboard';

/* ── Dashboard palette ─────────────────────────────────────────────────────── */
const BASE_URL   = 'https://sherlock-app-production.up.railway.app';
const COLORS     = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', muted: 'rgba(255,255,255,0.45)' };
const roleColor  = { admin: '#a78bfa', teacher: '#60a5fa', assistant: '#fbbf24', student: '#34d399' };
const roleBg     = { admin: 'rgba(124,58,237,0.2)', teacher: 'rgba(59,130,246,0.2)', assistant: 'rgba(245,158,11,0.2)', student: 'rgba(16,185,129,0.2)' };
const roleBorder = { admin: '#7c3aed', teacher: '#3b82f6', assistant: '#f59e0b', student: '#10b981' };

/* ── Chat constants ────────────────────────────────────────────────────────── */
const THEMES = {
  admin:     { avatar: 'bg-gradient-to-br from-purple-500 to-purple-700', userBubble: 'bg-gradient-to-br from-purple-600 to-purple-800 text-white', sendBtn: 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40', ring: 'focus:ring-2 focus:ring-purple-500/40' },
  assistant: { avatar: 'bg-gradient-to-br from-orange-500 to-orange-700',  userBubble: 'bg-gradient-to-br from-orange-600 to-orange-800 text-white',  sendBtn: 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/40',  ring: 'focus:ring-2 focus:ring-orange-500/40'  },
  teacher:   { avatar: 'bg-gradient-to-br from-blue-500 to-blue-700',      userBubble: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white',      sendBtn: 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40',        ring: 'focus:ring-2 focus:ring-blue-500/40'    },
  student:   { avatar: 'bg-gradient-to-br from-emerald-500 to-emerald-700',userBubble: 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white', sendBtn: 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40',ring: 'focus:ring-2 focus:ring-emerald-500/40' },
};

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional. You have the wit and dry humor of Sherlock Holmes from Arthur Conan Doyle\'s stories. Use occasional clever quips, deadpan observations, and self-aware humor — especially when you cannot find information, when asked something obvious, or when completing a task successfully. In Georgian, use the same wit naturally. Use this quote when it fits naturally: \'ელემენტარულია, ვატსონ.\' — use this when answering something logical or complex that you solved easily. Use it exactly as written, do not modify or translate it. In Georgian keep the same Holmesian personality but sound natural, not translated. You are never rude or dismissive — the humor is always warm and helpful. Never overdo it — use humor sparingly, only when it fits naturally. Be direct and precise. Never ask the user to clarify whether you have access to documents — you either have context or you don\'t, and you know which. If no library documents are provided in context, simply say you don\'t have that information, with Holmesian wit. Never say things like \'do you have access to...\' or \'please upload documents\' — that is not your concern. Your Georgian must be grammatically perfect — never use awkward phrasing or overly formal bureaucratic language. Speak naturally, like an intelligent Georgian speaker would. When uncertain, admit it directly and briefly, with dry humor if appropriate.';

const NO_INFO_INSTRUCTION = `When you cannot find information in the school library or context, respond with one of these naturally, matching the user's language: English: 'Sorry, I couldn\'t find anything on that.' or 'My deductive methods failed me on this one, haha. No information found.' Georgian: 'სამწუხაროდ, ინფორმაცია ვერ მოიძებნა.' or 'ინფორმაცია ვერ ვიპოვე ამ თემაზე.' or 'ჩემი დედუქციის მეთოდი უსარგებლო აღმოჩნდა, ჰაჰაჰა. ინფორმაცია ვერ ვიპოვე.' Vary the response naturally, don't always use the same one.`;

const SYSTEM_PROMPTS = {
  admin:     `${BASE_IDENTITY} You are assisting a school admin. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  assistant: `${BASE_IDENTITY} You are assisting a school office assistant. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  teacher:   `${BASE_IDENTITY} You are assisting a teacher. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  student:   `${BASE_IDENTITY} You are assisting a student. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
};

const GREETINGS = {
  admin:     "Hello! I'm Sherlock, your admin assistant. How can I help you today?",
  assistant: "Hi! I'm Sherlock, your office assistant. What do you need?",
  teacher:   "Hi! I'm Sherlock, your teaching assistant. How can I help today?",
  student:   "Hey! I'm Sherlock, your school assistant. Ask me anything!",
};

const GEO_GREETINGS = {
  admin:     "გამარჯობა! მე ვარ შერლოკ არის ჭკვიანი, ასისტენტი სკოლის მართვისთვის. რით შემიძლია დაგეხმაროთ?",
  assistant: "გამარჯობა! მე ვარ შერლოკი, ოფისის ასისტენტი. რა გჭირდებათ?",
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

function buildContext(libraryFiles, attachedFiles) {
  const parts = [];
  if (libraryFiles.length > 0) {
    const libText = libraryFiles.map(f => `=== ${f.filename} ===\n${f.content}`).join('\n\n');
    parts.push(`SCHOOL KNOWLEDGE LIBRARY:\n\n${libText.slice(0, 10000)}`);
  }
  if (attachedFiles.length > 0) {
    const attachText = attachedFiles.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n');
    parts.push(`ATTACHED FILES (use as context):\n\n${attachText.slice(0, 12000)}`);
  }
  return parts.length > 0 ? parts.join('\n\n---\n\n') : null;
}

function MessageBubble({ message, theme, accentColor }) {
  const s = CHAT_STYLES.glass;
  const isUser = message.role === 'user';
  if (message.type === 'searching') {
    return <div className="flex justify-start mb-3"><div className="px-4 py-2 text-sm text-gray-500 animate-pulse">{message.text}</div></div>;
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${isUser ? 'text-white rounded-br-sm' : `${s.assistantBubble} rounded-bl-sm`}`}
        style={isUser ? { background: accentColor, boxShadow: `0 2px 12px ${accentColor}55` } : undefined}
      >
        {isUser ? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </div>
    </div>
  );
}

const ROLE_SWITCHER = [
  { id: 'admin',     label: 'Admin',     activeCls: 'bg-purple-600 text-white'  },
  { id: 'assistant', label: 'Assistant', activeCls: 'bg-orange-600 text-white'  },
  { id: 'teacher',   label: 'Teacher',   activeCls: 'bg-blue-600 text-white'    },
  { id: 'student',   label: 'Student',   activeCls: 'bg-emerald-600 text-white' },
];

const BUTTON_GROUPS = {
  admin: [
    { id: 'people',    label: '👥 People',    children: [{ id: 'students', label: 'Students' }, { id: 'assistants', label: 'Assistants' }, { id: 'teachers', label: 'Teachers' }, { id: 'invite', label: 'Invite' }] },
    { id: 'manage',    label: '📋 Manage',    children: [{ id: 'groups', label: 'Groups' }, { id: 'admin-schedule', label: 'Schedule' }, { id: 'subjects', label: 'Subjects' }, { id: 'ai-use', label: 'Use' }] },
    { id: 'broadcast', label: '📢 Notify',    children: [{ id: 'broadcast', label: 'Broadcast' }, { id: 'admin-announce', label: 'Announce' }] },
    { id: 'events',    label: '🎪 Events',    children: [{ id: 'view-events', label: 'View Events' }, { id: 'add-event', label: 'Add Event' }, { id: 'delete-event', label: 'Delete Event' }] },
  ],
  assistant: [
    { id: 'people',   label: '👥 People',   children: [{ id: 'students', label: 'Students' }, { id: 'teachers', label: 'Teachers' }, { id: 'invite', label: 'Invite' }] },
    { id: 'manage',   label: '📋 Manage',   children: [{ id: 'groups', label: 'Groups' }, { id: 'subjects', label: 'Subjects' }] },
    { id: 'events',   label: '🎪 Events',   children: [{ id: 'view-events', label: 'View Events' }, { id: 'add-event', label: 'Add Event' }, { id: 'delete-event', label: 'Delete Event' }] },
    { id: 'requests', label: '📬 Requests', children: [{ id: 'requests', label: 'Pending Requests' }] },
    { id: 'announce', label: '📢 Announce', children: [{ id: 'announce', label: 'Announce' }] },
  ],
  teacher: [
    { id: 'my-work',     label: '📅 My Work',     children: [{ id: 'my-schedule', label: 'My Schedule' }, { id: 'my-groups', label: 'My Groups' }] },
    { id: 'announce',    label: '📢 Announce'    },
    { id: 'share-files', label: '📁 Share Files' },
  ],
  student: [
    { id: 'schedule', label: 'Schedule' },
    { id: 'events',   label: 'Events'   },
    { id: 'plan',     label: '📋 Plan',     children: [{ id: 'change-group', label: 'Change Group' }, { id: 'add-subject', label: 'Add Subject' }, { id: 'remove-subject', label: 'Remove Subject' }] },
    { id: 'my-notes', label: '📓 My Notes', children: [{ id: 'notes', label: 'Notes' }, { id: 'practice-diary', label: 'Practice Diary' }, { id: 'notes-box', label: '📝 Notes Box' }, { id: 'search', label: '🔍 Search' }] },
    { id: 'report',   label: '⚠️ Report',   children: [{ id: 'report-absence', label: 'Lesson Absence' }, { id: 'report-event-absence', label: 'Report Event Absence' }, { id: 'report-exam-absence', label: 'Report Exam Absence' }] },
  ],
};

const GEO_BUTTON_GROUPS = {
  admin: [
    { id: 'people',    label: '👥 ხალხი',        children: [{ id: 'students', label: 'სტუდენტები' }, { id: 'assistants', label: 'ასისტენტები' }, { id: 'teachers', label: 'მასწავლებლები' }, { id: 'invite', label: 'მოწვევა' }] },
    { id: 'manage',    label: '📋 მართვა',        children: [{ id: 'groups', label: 'ჯგუფები' }, { id: 'admin-schedule', label: 'განრიგი' }, { id: 'subjects', label: 'საგნები' }, { id: 'ai-use', label: 'გამოყენება' }] },
    { id: 'broadcast', label: '📢 შეტყობინება',   children: [{ id: 'broadcast', label: 'ყველას' }, { id: 'admin-announce', label: 'ჯგუფს' }] },
    { id: 'events',    label: '🎪 ღონისძიებები', children: [{ id: 'view-events', label: 'ნახვა' }, { id: 'add-event', label: 'დამატება' }, { id: 'delete-event', label: 'წაშლა' }] },
  ],
  assistant: [
    { id: 'people',   label: '👥 ხალხი',        children: [{ id: 'students', label: 'სტუდენტები' }, { id: 'teachers', label: 'მასწავლებლები' }, { id: 'invite', label: 'მოწვევა' }] },
    { id: 'manage',   label: '📋 მართვა',        children: [{ id: 'groups', label: 'ჯგუფები' }, { id: 'subjects', label: 'საგნები' }] },
    { id: 'events',   label: '🎪 ღონისძიებები', children: [{ id: 'view-events', label: 'ნახვა' }, { id: 'add-event', label: 'დამატება' }, { id: 'delete-event', label: 'წაშლა' }] },
    { id: 'requests', label: '📬 მოთხოვნები',   children: [{ id: 'requests', label: 'მოლოდინი' }] },
    { id: 'announce', label: '📢 გამოცხადება',   children: [{ id: 'announce', label: 'გამოცხადება' }] },
  ],
  teacher: [
    { id: 'my-work',     label: '📅 ჩემი სამუშაო',       children: [{ id: 'my-schedule', label: 'ჩემი განრიგი' }, { id: 'my-groups', label: 'ჩემი ჯგუფები' }] },
    { id: 'announce',    label: '📢 გამოცხადება' },
    { id: 'share-files', label: '📁 ფაილების გაზიარება' },
  ],
  student: [
    { id: 'schedule', label: 'განრიგი' },
    { id: 'events',   label: 'ღონისძიებები' },
    { id: 'plan',     label: '📋 გეგმა',           children: [{ id: 'change-group', label: 'ჯგუფის შეცვლა' }, { id: 'add-subject', label: 'საგნის დამატება' }, { id: 'remove-subject', label: 'საგნის წაშლა' }] },
    { id: 'my-notes', label: '📓 ჩემი ჩანაწერები', children: [{ id: 'notes', label: 'გაკვეთილის ჩანაწერები' }, { id: 'practice-diary', label: 'პრაქტიკის დღიური' }, { id: 'notes-box', label: '📝 ჩანაწერების ყუთი' }, { id: 'search', label: '🔍 ძებნა' }] },
    { id: 'report',   label: '⚠️ გაცდენა',          children: [{ id: 'report-absence', label: 'გაკვეთილის გაცდენა' }, { id: 'report-event-absence', label: 'ღონისძიების გაცდენა' }, { id: 'report-exam-absence', label: 'გამოცდის გაცდენა' }] },
  ],
};

function getButtonGroups(lang) { return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS; }

const GROUP_OPEN_CLS = {
  admin:     'bg-purple-600/20 text-purple-300 border border-purple-500/40',
  assistant: 'bg-orange-600/20 text-orange-300 border border-orange-500/40',
  teacher:   'bg-blue-600/20 text-blue-300 border border-blue-500/40',
  student:   'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40',
};

const ACCENT_COLORS = { admin: '#7c3aed', assistant: '#ea580c', teacher: '#2563eb', student: '#059669' };

/* ── Left Column ─────────────────────────────────────────────────────────────── */
function LeftColumn() {
  const { user, logout } = useAuth();
  const token      = localStorage.getItem('sherlock_token');
  const headers    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canManage  = user?.role === 'admin' || user?.role === 'assistant';
  const canLibrary = ['admin', 'assistant', 'teacher'].includes(user?.role);

  const [members, setMembers]         = useState([]);
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
      const reqs = [fetch('/api/school/members', { headers })];
      if (canManage) reqs.push(fetch('/api/invites', { headers }));
      const results = await Promise.all(reqs);
      const mData = await results[0].json();
      setMembers(mData.members || []);
      if (canManage && results[1]) {
        const iData = await results[1].json();
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
    <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sticky header */}
      <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.88)', display: 'flex', alignItems: 'center', gap: 12 }}>
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

      {/* Scrollable content */}
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
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Invite Links</h2>
                <p style={{ color: COLORS.muted, fontSize: 12, marginBottom: 16, marginTop: 3 }}>Generate one-time invite links. Expire in 7 days.</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', outline: 'none', colorScheme: 'dark', flex: 1 }}>
                    {user?.role === 'admin' && <option value="assistant" style={{ background: '#0d0d1a' }}>Assistant</option>}
                    <option value="teacher" style={{ background: '#0d0d1a' }}>Teacher</option>
                    <option value="student" style={{ background: '#0d0d1a' }}>Student</option>
                  </select>
                  <button onClick={generateInvite}
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
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
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>📚 Knowledge Library</h2>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  {libFiles.length}
                </span>
              </div>
              <p style={{ color: COLORS.muted, fontSize: 12, marginBottom: 14, marginTop: 3 }}>Documents Sherlock should know about.</p>
              {canLibrary && (
                <div style={{ marginBottom: libError ? 8 : 14 }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={libUploading}
                    style={{ padding: '8px 16px', background: libUploading ? 'rgba(99,102,241,0.25)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: libUploading ? 'not-allowed' : 'pointer', opacity: libUploading ? 0.7 : 1 }}>
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
                    <div key={f.id} style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #4f46e5', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || f.filename || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{formatFileSize(f.file_size)}</div>
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

            {/* Members */}
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                Members <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.muted }}>({members.length})</span>
              </h2>
              <div style={{ background: COLORS.card, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                {members.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>No members yet</div>
                ) : members.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: roleBg[m.role] || 'rgba(255,255,255,0.08)', border: `1px solid ${roleBorder[m.role] || 'rgba(255,255,255,0.1)'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: roleColor[m.role] || 'white', flexShrink: 0 }}>
                        {(m.name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: roleBg[m.role] || 'rgba(255,255,255,0.08)', color: roleColor[m.role] || 'white', border: `1px solid ${roleBorder[m.role] || 'rgba(255,255,255,0.1)'}44`, flexShrink: 0 }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Right Column (Chat Panel) ───────────────────────────────────────────────── */
function RightColumn() {
  const { user } = useAuth();
  const lang = localStorage.getItem('sherlock_lang') === 'ka' ? 'GEO' : 'EN';

  const defaultRole = user?.role || 'admin';
  const [role, setRole]         = useState(defaultRole);
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup]     = useState(null);
  const theme = THEMES[role] || THEMES.student;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[defaultRole] || '#7c3aed');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [libraryFiles, setLibraryFiles]   = useState([]);
  const [provider, setProvider] = useState(lang === 'GEO' ? 'gemini' : 'anthropic');
  const [styleOpen, setStyleOpen]         = useState(false);
  const [customLabels, setCustomLabels]   = useState({ admin: {}, assistant: {}, teacher: {}, student: {} });
  const [customRoleNames, setCustomRoleNames] = useState({ admin: '', assistant: '', teacher: '', student: '' });
  const [editSubmenuOpen, setEditSubmenuOpen] = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editDraft, setEditDraft]   = useState({});
  const [editRoleName, setEditRoleName] = useState('');

  const messagesRef   = useRef(null);
  const fileInputRef  = useRef(null);
  const stylePanelRef = useRef(null);
  const editBtnRef    = useRef(null);
  const s = CHAT_STYLES.glass;

  useEffect(() => { setAccentColor(ACCENT_COLORS[role] || '#7c3aed'); }, [role]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') }]);
    setInput(''); setLoading(false); setActivePanel(null); setOpenGroup(null); setAttachedFiles([]);
  }, [role]);

  useEffect(() => {
    if (!styleOpen) return;
    const h = e => { if (stylePanelRef.current && !stylePanelRef.current.contains(e.target)) setStyleOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [styleOpen]);

  useEffect(() => {
    if (!editSubmenuOpen) return;
    const h = e => { if (editBtnRef.current && !editBtnRef.current.contains(e.target)) setEditSubmenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [editSubmenuOpen]);

  function getEffLabel(btnRole, id, baseLabel) {
    return customLabels[btnRole]?.[id] ?? baseLabel;
  }

  function openEditor(targetRole) {
    const groups = getButtonGroups(lang)[targetRole];
    const draft = {};
    groups.forEach(g => {
      draft[g.id] = customLabels[targetRole]?.[g.id] ?? g.label;
      if (g.children) g.children.forEach(c => { draft[c.id] = customLabels[targetRole]?.[c.id] ?? c.label; });
    });
    setEditDraft(draft);
    setEditTarget(targetRole);
    setEditRoleName(customRoleNames[targetRole] ?? '');
    setEditOpen(true);
    setEditSubmenuOpen(false);
  }

  function saveLabels() {
    setCustomLabels(prev => ({ ...prev, [editTarget]: editDraft }));
    if (editRoleName.trim()) setCustomRoleNames(prev => ({ ...prev, [editTarget]: editRoleName.trim() }));
    setEditOpen(false); setEditTarget(null); setEditRoleName('');
  }

  function cancelEdit() {
    setEditOpen(false); setEditTarget(null); setEditDraft({}); setEditRoleName('');
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '') }]);
    setInput(''); setLoading(false); setActivePanel(null); setOpenGroup(null);
    setAttachedFiles([]); setLibraryFiles([]);
  }

  function addLibraryFile(filename, content) { setLibraryFiles(prev => [...prev, { id: Date.now(), filename, content }]); }
  function removeLibraryFile(id) { setLibraryFiles(prev => prev.filter(f => f.id !== id)); }

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
        body: JSON.stringify({ messages: apiMessages, provider, context: buildContext(libraryFiles, attachedFiles), language: lang === 'GEO' ? 'ka' : 'en' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message ?? 'No response.' }]);
      setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'შეცდომა: კავშირი ვერ მოხდა.' : 'Error: could not reach the server.' }]);
    } finally { setLoading(false); }
  }

  const inactiveCls  = 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
  const openGroupDef = openGroup ? getButtonGroups(lang)[role]?.find(g => g.id === openGroup) : null;

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${s.wrap}`} style={{ position: 'relative' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${accentColor}22, transparent)` }} />

      {/* Chat header */}
      <header className={`flex items-center gap-2 px-4 py-3 border-b ${s.headerBorder} flex-shrink-0`}>
        <div className={`w-8 h-8 rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>S</div>
        <h1 className={`text-base font-semibold ${s.titleColor}`}>Sherlock</h1>
        {user?.schoolName && <span className="text-xs text-white/35 ml-1">{user.schoolName}</span>}

        <div className="ml-auto flex items-center gap-2">
          {/* Edit button — visible when not on student tab */}
          {role !== 'student' && (
            <div className="relative flex-shrink-0" ref={editBtnRef}>
              <button
                onClick={() => setEditSubmenuOpen(o => !o)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 ${editSubmenuOpen ? 'border-white/30 text-white bg-white/10' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'}`}>
                {lang === 'GEO' ? '✏️ რედაქტირება' : '✏️ Edit'}
              </button>
              {editSubmenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-xl border border-white/15 bg-[#0f0f1a] shadow-2xl z-50 overflow-hidden">
                  <button onClick={() => openEditor(role)}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                    {lang === 'GEO' ? 'ჩემი პროფილი' : 'My Profile'}
                  </button>
                  {(role === 'admin' || role === 'assistant') && (
                    <button onClick={() => openEditor('student')}
                      className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors border-t border-white/[0.06]">
                      {lang === 'GEO' ? 'სტუდენტის პროფილი' : 'Student Profile'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Provider selector */}
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            disabled={loading}
            style={{ colorScheme: 'dark' }}
            className={`text-sm rounded-lg px-2 py-1 focus:outline-none ${theme.ring} disabled:opacity-40 ${s.selectCls}`}>
            <option value="anthropic">Claude</option>
            <option value="openai">GPT-4</option>
            <option value="gemini">Gemini</option>
          </select>

          {/* Style customizer */}
          <div className="relative flex-shrink-0" ref={stylePanelRef}>
            <button
              onClick={() => setStyleOpen(o => !o)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 ${styleOpen ? 'border-white/30 text-white bg-white/10' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'}`}
              style={{ borderColor: accentColor + '60' }}>
              <span className="flex items-center gap-2">
                <span style={{ background: accentColor, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }} />
                {lang === 'GEO' ? 'სტილი' : 'Stylize'}
              </span>
            </button>
            {styleOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-2xl border border-white/15 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl z-50 p-4 flex flex-col gap-3" style={{ width: 220 }}>
                <p className="text-xs text-gray-400 font-medium">{lang === 'GEO' ? 'ფერი' : 'Color'}</p>
                <input
                  type="range" min="0" max="359"
                  value={(() => {
                    const hex = accentColor.replace('#', '');
                    const r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
                    const max = Math.max(r,g,b), min = Math.min(r,g,b);
                    if (max === min) return 0;
                    let h = max === r ? (g-b)/(max-min) : max === g ? 2+(b-r)/(max-min) : 4+(r-g)/(max-min);
                    return Math.round(((h*60)+360)%360);
                  })()}
                  onChange={e => {
                    const h = Math.min(359, parseInt(e.target.value));
                    const f = n => { const k=(n+h/60)%6; return Math.round((1-Math.max(0,Math.min(k,4-k,1)))*200+55); };
                    setAccentColor('#'+f(5).toString(16).padStart(2,'0')+f(3).toString(16).padStart(2,'0')+f(1).toString(16).padStart(2,'0'));
                  }}
                  className="w-full cursor-pointer rainbow-slider"
                  style={{ height:20, borderRadius:10, border:'none', outline:'none', appearance:'none', WebkitAppearance:'none', background:'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff2200)' }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <div style={{ width:32, height:32, borderRadius:8, background:accentColor, boxShadow:`0 0 12px ${accentColor}88`, flexShrink:0 }} />
                  <span className="text-xs text-gray-400">{lang === 'GEO' ? 'არჩეული ფერი' : 'Selected color'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Role switcher */}
      <div className={`flex items-center gap-1 px-4 py-2 border-b ${s.headerBorder} flex-shrink-0 overflow-x-auto`} style={{ scrollbarWidth: 'none' }}>
        {ROLE_SWITCHER.map(r => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${role === r.id ? r.activeCls : 'text-gray-400 hover:text-white'}`}>
            {customRoleNames[r.id] || (lang === 'GEO' ? ({ admin: 'ადმინი', assistant: 'ასისტენტი', teacher: 'მასწავლებელი', student: 'სტუდენტი' })[r.id] : r.label)}
          </button>
        ))}
        <button onClick={clearChat} className="ml-auto text-xs px-2 py-1 rounded-lg text-gray-600 hover:text-gray-400 transition-colors">
          {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
        </button>
      </div>

      {/* Handler buttons */}
      <div className={`flex flex-col border-b ${s.headerBorder} flex-shrink-0`}>
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {getButtonGroups(lang)[role].map(item => {
            const isMulti = item.children && item.children.length >= 2;
            if (isMulti) {
              return (
                <button key={item.id}
                  onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${openGroup === item.id ? GROUP_OPEN_CLS[role] : inactiveCls}`}>
                  {getEffLabel(role, item.id, item.label)} {openGroup === item.id ? '▲' : '▼'}
                </button>
              );
            }
            const panelId = item.children?.length === 1 ? item.children[0].id : item.id;
            return (
              <button key={item.id}
                onClick={() => setActivePanel(activePanel === panelId ? null : panelId)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === panelId ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {getEffLabel(role, item.id, item.label)}
              </button>
            );
          })}
        </div>
        {openGroupDef?.children && openGroupDef.children.length >= 2 && (
          <div className={`flex items-center gap-1.5 px-6 py-1.5 border-t ${s.headerBorder} flex-wrap`}>
            {openGroupDef.children.map(child => (
              <button key={child.id}
                onClick={() => setActivePanel(activePanel === child.id ? null : child.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === child.id ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                {getEffLabel(role, child.id, child.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ fontSize: 'clamp(13px, 1.5vw, 15px)' }}>
        {activePanel && (
          <div className="mb-4">
            <RolePanel role={role} panel={activePanel} onClose={() => setActivePanel(null)}
              libraryProps={{ libraryFiles, onAddFile: addLibraryFile, onRemoveFile: removeLibraryFile, orgName: user?.schoolName || '', orgNameGenitive: '' }}
              lang={lang} />
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} theme={theme} accentColor={accentColor} />)}
      </div>

      {/* Thinking indicator */}
      <div style={{ display: loading ? 'flex' : 'none', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}
        className={`px-4 py-2 border-t ${s.footerBorder}`}>
        <div className={`w-8 h-8 text-sm rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>S</div>
        <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm ${s.assistantBubble} flex items-center gap-1.5`}>
          {[0, 1, 2].map(d => (
            <div key={d} className="dot-bounce w-2 h-2 rounded-full" style={{ background: accentColor, animationDelay: `${d * 0.15}s` }} />
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
      <form onSubmit={sendMessage} className={`flex items-end gap-2 px-4 py-3 border-t ${s.footerBorder} flex-shrink-0`}>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 40, minWidth: 40 }}
          className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${attachedFiles.length > 0 ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
          📎
        </button>
        <textarea
          rows={1}
          placeholder={lang === 'GEO' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          className={`flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none ${theme.ring} max-h-32 ${s.inputCls}`}
        />
        {role !== 'student' && (
          <button type="button" onClick={() => setActivePanel(activePanel === 'knowledge-library' ? null : 'knowledge-library')}
            style={{ minHeight: 40, minWidth: 40 }}
            className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${activePanel === 'knowledge-library' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
            📚
          </button>
        )}
        <button type="submit" disabled={loading || !input.trim()}
          style={{ minHeight: 40, minWidth: 40, background: accentColor, boxShadow: `0 4px 14px ${accentColor}55` }}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-all duration-150">
          {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>

      {/* Edit labels modal */}
      {editOpen && editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">
                {lang === 'GEO' ? `რედაქტირება — ${editTarget}` : `Edit — ${editTarget}`}
              </h3>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-white text-sm transition-colors">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{lang === 'GEO' ? 'როლის სახელი' : 'Role name'}</label>
                <input
                  value={editRoleName}
                  onChange={e => setEditRoleName(e.target.value)}
                  placeholder={editTarget}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 pt-1">{lang === 'GEO' ? 'ღილაკების სახელები' : 'Button labels'}</p>
              {Object.entries(editDraft).map(([id, val]) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{id}</span>
                  <input
                    value={val}
                    onChange={e => setEditDraft(d => ({ ...d, [id]: e.target.value }))}
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-white/10">
              <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl border border-white/15 text-xs text-gray-400 hover:text-white transition-colors">
                {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button onClick={saveLabels} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium transition-colors">
                {lang === 'GEO' ? 'შენახვა' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AppLayout ───────────────────────────────────────────────────────────────── */
export default function AppLayout() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  if (!isDesktop) return <Dashboard />;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)',
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
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 35% at 50% 0%, rgba(124,58,237,0.14), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Rainbow bar */}
      <div style={{ height: 2, flexShrink: 0, position: 'relative', zIndex: 1, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#0891b2,#06b6d4,#7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Two columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <LeftColumn />
        {/* Divider */}
        <div style={{ width: 1, flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />
        <RightColumn />
      </div>
    </div>
  );
}
