import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ReactMarkdown from 'react-markdown';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';

// ── Themes ─────────────────────────────────────────────────────────────────────
const THEMES = {
  admin: {
    avatar:     'bg-gradient-to-br from-purple-500 to-purple-700',
    userBubble: 'bg-gradient-to-br from-purple-600 to-purple-800 text-white',
    sendBtn:    'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40',
    ring:       'focus:ring-2 focus:ring-purple-500/40',
    glow:       'rgba(147,51,234,0.20)',
    glowSoft:   'rgba(147,51,234,0.10)',
    send:       '#9333ea',
  },
  assistant: {
    avatar:     'bg-gradient-to-br from-orange-500 to-orange-700',
    userBubble: 'bg-gradient-to-br from-orange-600 to-orange-800 text-white',
    sendBtn:    'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/40',
    ring:       'focus:ring-2 focus:ring-orange-500/40',
    glow:       'rgba(234,88,12,0.20)',
    glowSoft:   'rgba(234,88,12,0.10)',
    send:       '#ea580c',
  },
  teacher: {
    avatar:     'bg-gradient-to-br from-blue-500 to-blue-700',
    userBubble: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white',
    sendBtn:    'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40',
    ring:       'focus:ring-2 focus:ring-blue-500/40',
    glow:       'rgba(37,99,235,0.20)',
    glowSoft:   'rgba(37,99,235,0.10)',
    send:       '#2563eb',
  },
  student: {
    avatar:     'bg-gradient-to-br from-emerald-500 to-emerald-700',
    userBubble: 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white',
    sendBtn:    'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40',
    ring:       'focus:ring-2 focus:ring-emerald-500/40',
    glow:       'rgba(5,150,105,0.20)',
    glowSoft:   'rgba(5,150,105,0.10)',
    send:       '#059669',
  },
};

// ── Greetings ──────────────────────────────────────────────────────────────────
const GREETINGS = {
  en: {
    admin:     (name, school) => `Hi ${name}! I'm Sherlock, your admin assistant at ${school}. How can I help you today?`,
    assistant: (name, school) => `Hi ${name}! I'm Sherlock, your assistant at ${school}. How can I help?`,
    teacher:   (name, school) => `Hi ${name}! I'm Sherlock, your teaching assistant at ${school}. How can I help?`,
    student:   (name, school) => `Hey ${name}! I'm Sherlock, your school assistant at ${school}. Ask me anything!`,
  },
  ka: {
    admin:     (name, school) => `გამარჯობა ${name}! მე ვარ შერლოკი, ${school}-ის ადმინ-ასისტენტი. როგორ შემიძლია დაგეხმაროთ?`,
    assistant: (name, school) => `გამარჯობა ${name}! მე ვარ შერლოკი, ${school}-ის ასისტენტი. რა გჭირდებათ?`,
    teacher:   (name, school) => `გამარჯობა ${name}! მე ვარ შერლოკი, ${school}-ის ასისტენტი. როგორ შემიძლია დაგეხმაროთ?`,
    student:   (name, school) => `გამარჯობა ${name}! მე ვარ შერლოკი, ${school}-ის ასისტენტი. მკითხე ნებისმიერი რამ!`,
  },
};

// ── Modes (admin only) ─────────────────────────────────────────────────────────
const MODES = [
  { id: 'focus', en: 'Focus', ka: 'ფოკუსი', desc: 'Library only' },
  { id: 'smart', en: 'Smart', ka: 'სმარტი', desc: 'Library + general' },
  { id: 'full',  en: 'Full',  ka: 'სრული',  desc: 'Unrestricted' },
];

// ── Role switcher ──────────────────────────────────────────────────────────────
const ROLE_SWITCHER = [
  { id: 'admin',     en: 'Admin',     ka: 'ადმინი',          activeCls: 'bg-purple-600 text-white' },
  { id: 'assistant', en: 'Assistant', ka: 'ასისტენტი',       activeCls: 'bg-orange-600 text-white' },
  { id: 'teacher',   en: 'Teacher',   ka: 'მასწავლებელი',    activeCls: 'bg-blue-600 text-white' },
  { id: 'student',   en: 'Student',   ka: 'სტუდენტი',        activeCls: 'bg-emerald-600 text-white' },
];

// ── Handler button groups ──────────────────────────────────────────────────────
const BUTTON_GROUPS = {
  admin: [
    { id: 'people',    label: '👥 People',    children: [{ id: 'students', label: 'Students' }, { id: 'assistants', label: 'Assistants' }, { id: 'teachers', label: 'Teachers' }, { id: 'invite', label: 'Invite' }] },
    { id: 'manage',    label: '📋 Manage',    children: [{ id: 'groups', label: 'Groups' }, { id: 'admin-schedule', label: 'Schedule' }, { id: 'subjects', label: 'Subjects' }] },
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
    { id: 'announce',    label: '📢 Announce' },
    { id: 'share-files', label: '📁 Share Files' },
  ],
  student: [
    { id: 'schedule',  label: 'Schedule'  },
    { id: 'events',    label: 'Events'    },
    { id: 'plan',      label: '📋 Plan',     children: [{ id: 'change-group', label: 'Change Group' }, { id: 'add-subject', label: 'Add Subject' }, { id: 'remove-subject', label: 'Remove Subject' }] },
    { id: 'my-notes',  label: '📓 My Notes', children: [{ id: 'notes', label: 'Notes' }, { id: 'practice-diary', label: 'Practice Diary' }, { id: 'notes-box', label: '📝 Notes Box' }, { id: 'search', label: '🔍 Search' }] },
    { id: 'report',    label: '⚠️ Report',   children: [{ id: 'report-absence', label: 'Lesson Absence' }, { id: 'report-event-absence', label: 'Report Event Absence' }, { id: 'report-exam-absence', label: 'Report Exam Absence' }] },
  ],
};

const GEO_BUTTON_GROUPS = {
  admin: [
    { id: 'people',    label: '👥 ხალხი',        children: [{ id: 'students', label: 'სტუდენტები' }, { id: 'assistants', label: 'ასისტენტები' }, { id: 'teachers', label: 'მასწავლებლები' }, { id: 'invite', label: 'მოწვევა' }] },
    { id: 'manage',    label: '📋 მართვა',        children: [{ id: 'groups', label: 'ჯგუფები' }, { id: 'admin-schedule', label: 'განრიგი' }, { id: 'subjects', label: 'საგნები' }] },
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

const GROUP_OPEN_CLS = {
  admin:     'bg-purple-600/20 text-purple-300 border border-purple-500/40',
  assistant: 'bg-orange-600/20 text-orange-300 border border-orange-500/40',
  teacher:   'bg-blue-600/20 text-blue-300 border border-blue-500/40',
  student:   'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40',
};

function getButtonGroups(lang) {
  return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS;
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ message, theme }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 msg-appear`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mr-2 self-end`}>
          S
        </div>
      )}
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
        isUser
          ? `${theme.userBubble} rounded-br-sm`
          : 'bg-white/[0.06] text-white border border-white/10 backdrop-blur-xl rounded-bl-sm'
      }`}>
        {isUser ? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const token       = localStorage.getItem('sherlock_token');
  const storedLang  = localStorage.getItem('sherlock_lang') || 'en';
  const lang        = storedLang === 'ka' ? 'GEO' : 'EN';  // for button groups / RolePanels
  const langKey     = storedLang === 'ka' ? 'ka' : 'en';   // for greetings

  const defaultRole = user?.role || 'student';
  const [role, setRole] = useState(defaultRole);
  const theme = THEMES[role] || THEMES.student;

  function makeGreeting(r) {
    return GREETINGS[langKey][r]?.(user?.name || '', user?.schoolName || '') || '';
  }

  const [messages, setMessages]     = useState([{ role: 'assistant', content: makeGreeting(role) }]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [mode, setMode]             = useState('smart');
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup]   = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [libraryFiles, setLibraryFiles]   = useState([]);

  const messagesRef  = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Reset chat when role changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: makeGreeting(role) }]);
    setInput('');
    setLoading(false);
    setError('');
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
  }, [role, lang]);

  function clearChat() {
    setMessages([{ role: 'assistant', content: makeGreeting(role) }]);
    setInput('');
    setLoading(false);
    setError('');
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
    setLibraryFiles([]);
  }

  function addLibraryFile(filename, content) {
    setLibraryFiles(prev => [...prev, { id: Date.now(), filename, content }]);
  }

  function removeLibraryFile(id) {
    setLibraryFiles(prev => prev.filter(f => f.id !== id));
  }

  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'მაქსიმუმ 3 ფაილი შეგიძლიათ მიამაგროთ.' : 'Maximum 3 files per session.' }]);
      return;
    }
    let text = '';
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjs = await loadPdfJs();
        const buf   = await file.arrayBuffer();
        const pdf   = await pdfjs.getDocument({ data: buf }).promise;
        for (let p = 1; p <= pdf.numPages; p++) {
          const page    = await pdf.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
      } else {
        text = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload  = ev => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsText(file);
        });
      }
      setAttachedFiles(prev => [...prev, { id: Date.now(), name: file.name, content: text }]);
      setMessages(prev => [...prev, { role: 'assistant', content: `📄 "${file.name}" ${lang === 'GEO' ? 'წაკითხულია. შეგიძლიათ კითხვები დასვათ.' : 'loaded. Ask me anything about it!'}` }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'ფაილი ვერ წავიკითხე.' : 'Sorry, I could not read that file.' }]);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg    = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ messages: newMessages, mode, language: langKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inactiveBtnCls   = 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
  const openGroupDef     = openGroup ? getButtonGroups(lang)[role]?.find(g => g.id === openGroup) : null;

  return (
    <div className="min-h-screen flex flex-col text-white font-sans"
      style={{ background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)' }}>

      <style>{`
        @keyframes rainbowBar {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${theme.glow}, 0 0 14px ${theme.glowSoft}; }
          50%       { box-shadow: 0 0 0 9px transparent, 0 0 22px ${theme.glowSoft}; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes msgAppear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-appear { animation: msgAppear 200ms ease forwards; }
      `}</style>

      {/* Rainbow top bar */}
      <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#0891b2,#06b6d4,#7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-0"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${theme.glowSoft}, transparent)` }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.08] flex-shrink-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.78)' }}>

        <div className={`w-10 h-10 rounded-full ${theme.avatar} flex items-center justify-center text-white font-extrabold text-base flex-shrink-0`}
          style={{ animation: 'avatarPulse 3s ease-in-out infinite' }}>
          S
        </div>

        <div>
          <div className="font-bold text-[15px] tracking-tight">Sherlock</div>
          <div className="text-[11px] text-white/35 mt-0.5">{user?.schoolName}</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {role === 'admin' && MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
              style={{
                background:   mode === m.id ? theme.send : 'rgba(255,255,255,0.04)',
                borderColor:  mode === m.id ? theme.send : 'rgba(255,255,255,0.12)',
                color:        mode === m.id ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow:    mode === m.id ? `0 0 14px ${theme.glowSoft}` : 'none',
              }}>
              {lang === 'GEO' ? m.ka : m.en}
            </button>
          ))}

          <a href="/dashboard"
            className="text-xs text-white/40 no-underline px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors hover:bg-white/[0.08] hover:text-white/70"
            style={{ backdropFilter: 'blur(8px)' }}>
            {lang === 'GEO' ? '← დაფა' : '← Dashboard'}
          </a>
        </div>
      </header>

      {/* ── Role switcher ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center gap-1 px-6 py-2 border-b border-white/[0.08] flex-shrink-0 overflow-x-auto"
        style={{ scrollbarWidth: 'none', backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.60)' }}>
        {ROLE_SWITCHER.map(r => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
              role === r.id ? r.activeCls : 'text-gray-400 hover:text-white'
            }`}>
            {lang === 'GEO' ? r.ka : r.en}
          </button>
        ))}
        <button onClick={clearChat} title="Start a new conversation"
          className="ml-auto text-xs px-2 py-1 rounded-lg text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
          {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
        </button>
      </div>

      {/* ── Handler buttons ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col border-b border-white/[0.08] flex-shrink-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.50)' }}>
        <div className="flex items-center gap-1.5 px-6 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {getButtonGroups(lang)[role]?.map(item => {
            const isMulti = item.children && item.children.length >= 2;
            if (isMulti) {
              return (
                <button key={item.id}
                  onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                    openGroup === item.id ? GROUP_OPEN_CLS[role] : inactiveBtnCls
                  }`}>
                  {item.label} {openGroup === item.id ? '▲' : '▼'}
                </button>
              );
            }
            const panelId = item.children?.length === 1 ? item.children[0].id : item.id;
            return (
              <button key={item.id}
                onClick={() => setActivePanel(activePanel === panelId ? null : panelId)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                  activePanel === panelId ? PANEL_ACTIVE_CLS[role] : inactiveBtnCls
                }`}>
                {item.label}
              </button>
            );
          })}
        </div>

        {openGroupDef?.children?.length >= 2 && (
          <div className="flex items-center gap-1.5 px-8 py-1.5 border-t border-white/[0.06] flex-wrap">
            {openGroupDef.children.map(child => (
              <button key={child.id}
                onClick={() => setActivePanel(activePanel === child.id ? null : child.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                  activePanel === child.id ? PANEL_ACTIVE_CLS[role] : inactiveBtnCls
                }`}>
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div ref={messagesRef} className="relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-0">

        {activePanel && (
          <div className="mb-4">
            <RolePanel role={role} panel={activePanel} onClose={() => setActivePanel(null)}
              libraryProps={{ libraryFiles, onAddFile: addLibraryFile, onRemoveFile: removeLibraryFile, orgName: user?.schoolName || '', orgNameGenitive: '' }}
              lang={lang} />
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} theme={theme} />
        ))}

        {loading && (
          <div className="flex items-end gap-2.5 mb-3">
            <div className={`w-7 h-7 rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>S</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 backdrop-blur-xl flex items-center gap-1.5">
              {[0, 1, 2].map(d => (
                <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: `dotBounce 1.2s ease-in-out ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 text-[13px] px-4 py-2 bg-red-400/[0.08] rounded-xl border border-red-400/20 my-1">
            {error}
          </div>
        )}
      </div>

      {/* ── Attached file pills ───────────────────────────────────────────────── */}
      {attachedFiles.length > 0 && (
        <div className="relative z-10 flex items-center gap-2 px-6 py-2 border-t border-white/[0.08] flex-shrink-0 flex-wrap"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.60)' }}>
          {attachedFiles.map(f => (
            <span key={f.id} className="text-xs rounded-full px-3 py-1.5 flex items-center gap-2 bg-white/[0.08] text-gray-300">
              <span className="truncate max-w-[120px]">📄 {f.name}</span>
              <button type="button"
                onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                className="text-gray-500 hover:text-white flex-shrink-0 leading-none transition-colors">✕</button>
            </span>
          ))}
          <span className="text-xs text-gray-600">{attachedFiles.length}/3</span>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <form onSubmit={sendMessage}
        className="relative z-10 flex items-end gap-2.5 px-6 py-4 border-t border-white/[0.08] flex-shrink-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.78)' }}>

        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} className="hidden" />

        <button type="button" title="Attach document (.pdf, .txt, .md)"
          onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${
            attachedFiles.length > 0 ? PANEL_ACTIVE_CLS[role] : inactiveBtnCls
          }`}>
          📎
        </button>

        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onInput={e => {
            e.target.style.height = 'auto';
            const h = Math.min(e.target.scrollHeight, 160);
            e.target.style.height = h + 'px';
            e.target.style.overflowY = e.target.scrollHeight > 160 ? 'auto' : 'hidden';
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          placeholder={lang === 'GEO' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          className={`flex-1 resize-none rounded-xl px-4 py-2.5 text-sm bg-white/[0.06] border border-white/15 text-white placeholder-white/30 focus:outline-none ${theme.ring} transition-all duration-200`}
          style={{ maxHeight: 160, lineHeight: 1.55, overflowY: 'hidden', fontFamily: 'inherit' }}
        />

        {role !== 'student' && (
          <button type="button" title="Knowledge Library"
            onClick={() => setActivePanel(activePanel === 'knowledge-library' ? null : 'knowledge-library')}
            style={{ minHeight: 44, minWidth: 44 }}
            className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${
              activePanel === 'knowledge-library' ? PANEL_ACTIVE_CLS[role] : inactiveBtnCls
            }`}>
            📚
          </button>
        )}

        <button type="submit" disabled={loading || !input.trim()}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all duration-150 flex-shrink-0 ${theme.sendBtn}`}>
          {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>
    </div>
  );
}
