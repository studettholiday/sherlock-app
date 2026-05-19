import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { RolePanel, PANEL_ACTIVE_CLS, NotificationBell } from './RolePanels';

const API_URL = '/api/chat';

const THEMES = {
  admin: {
    avatar:     'bg-gradient-to-br from-purple-500 to-purple-700',
    userBubble: 'bg-gradient-to-br from-purple-600 to-purple-800 text-white',
    sendBtn:    'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40',
    ring:       'focus:ring-2 focus:ring-purple-500/40',
    glow:       'rgba(147,51,234,0.10)',
  },
  assistant: {
    avatar:     'bg-gradient-to-br from-orange-500 to-orange-700',
    userBubble: 'bg-gradient-to-br from-orange-600 to-orange-800 text-white',
    sendBtn:    'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/40',
    ring:       'focus:ring-2 focus:ring-orange-500/40',
    glow:       'rgba(234,88,12,0.10)',
  },
  teacher: {
    avatar:     'bg-gradient-to-br from-blue-500 to-blue-700',
    userBubble: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white',
    sendBtn:    'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40',
    ring:       'focus:ring-2 focus:ring-blue-500/40',
    glow:       'rgba(37,99,235,0.10)',
  },
  student: {
    avatar:     'bg-gradient-to-br from-emerald-500 to-emerald-700',
    userBubble: 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white',
    sendBtn:    'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40',
    ring:       'focus:ring-2 focus:ring-emerald-500/40',
    glow:       'rgba(5,150,105,0.10)',
  },
};

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional.';

const SYSTEM_PROMPTS = {
  admin:     `${BASE_IDENTITY} You are assisting a school admin. You help manage students, schedules, groups, events, invite codes, and broadcasts. Show what an admin can do: approve students, generate invite codes, set schedules, ban users, view audit logs, broadcast messages.`,
  assistant: `${BASE_IDENTITY} You are assisting a school office assistant. You help with student management, group oversight, announcements, and sending invitations. Show what an assistant can do.`,
  teacher:   `${BASE_IDENTITY} You are assisting a teacher. You help with schedules, group announcements, student attendance, lesson notes, and broadcasting to groups. Show what a teacher can do.`,
  student:   `${BASE_IDENTITY} You are assisting a student. You help with schedules, upcoming events, notes, and any information available in the school library. Show what a student can do.`,
};

const GREETINGS = {
  admin:     "Hello! I'm Sherlock, your admin assistant. I can help you manage students, approve registrations, generate invite codes, set schedules, broadcast messages, and view audit logs. What would you like to do?",
  assistant: "Hi! I'm Sherlock, your office assistant. I can help with student management, groups, announcements, and sending invitations. What do you need?",
  teacher:   "Hi! I'm Sherlock, your teaching assistant. I can help with group schedules, student attendance, lesson notes, and group announcements. How can I help today?",
  student:   "Hey! I'm Sherlock, your school assistant. Ask me about your schedule, upcoming events, notes, or anything in the school library!",
};

const GEO_GREETINGS = {
  admin:     "გამარჯობა! მე ვარ შერლოკი, თქვენი ადმინ-ასისტენტი. შემიძლია დაგეხმაროთ სტუდენტების მართვაში, რეგისტრაციების დამტკიცებაში, მოწვევის კოდების გენერირებაში, განრიგის დაყენებაში და აუდიტის ჟურნალის ნახვაში. რით შემიძლია დაგეხმაროთ?",
  assistant: "გამარჯობა! მე ვარ შერლოკი, თქვენი ოფისის ასისტენტი. შემიძლია დაგეხმაროთ სტუდენტების მართვაში, ჯგუფებში, განცხადებებში და მოწვევების გაგზავნაში. რა გჭირდებათ?",
  teacher:   "გამარჯობა! მე ვარ შერლოკი, თქვენი ასისტენტი. შემიძლია გაჩვენოთ ცხრილი, გაკვეთილს თუ აცდენს სტუდენტი შეგატყობინოთ, და სასწავლო მასალის გაგზავნაში, ან განცხადების გაკეთება თუ მოგინდათ კონკრეტული რომელიმე ჯგუფისთვის. როგორ შემიძლია დაგეხმაროთ?",
  student:   "გამარჯობა! მე ვარ შერლოკი, თქვენი სკოლის ასისტენტი. მკითხეთ თქვენი განრიგის, მოახლოებული ღონისძიებების, შენიშვნების ან სკოლის ბიბლიოთეკაში არსებული ნებისმიერი ინფორმაციის შესახებ!",
};

function getGreeting(role, lang, orgName = '', orgNameGenitive = '') {
  if (lang === 'GEO') {
    const base = GEO_GREETINGS[role];
    if (!orgName) return base;
    const gen = orgNameGenitive || (orgName + 'ს');
    return base.replace(/სკოლის/g, gen);
  }
  const base = GREETINGS[role];
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
    thinkingColor:   'text-white/40',
    colorScheme:     'dark',
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

function MessageBubble({ message, theme, styleName }) {
  const s = CHAT_STYLES['glass'];
  const isUser = message.role === 'user';

  if (message.type === 'searching') {
    return (
      <div className="flex justify-start mb-3">
        <div className="px-4 py-2 text-sm text-gray-500 animate-pulse">{message.text}</div>
      </div>
    );
  }

  if (message.type === 'youtube_results') {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[90%] w-full space-y-2">
          <p className="text-xs text-gray-500 px-1">YouTube results for &ldquo;{message.query}&rdquo;</p>
          {message.results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="block bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 rounded-xl px-4 py-3 transition-colors">
              <p className="text-sm font-semibold text-white leading-snug">{r.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.channel}</p>
              <p className="text-xs text-purple-400 mt-1 truncate">{r.url}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (message.type === 'web_results') {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[90%] w-full space-y-2">
          <p className="text-xs text-gray-500 px-1">Web results for &ldquo;{message.query}&rdquo;</p>
          {message.results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="block bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 rounded-xl px-4 py-3 transition-colors">
              <p className="text-sm font-semibold text-white leading-snug">{r.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{r.snippet}</p>
              <p className="text-xs text-purple-400 mt-1 truncate">{r.url}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
        isUser
          ? `${theme.userBubble} rounded-br-sm`
          : `${s.assistantBubble} rounded-bl-sm`
      }`}>
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
    { id: 'manage',    label: '📋 Manage',    children: [{ id: 'subjects', label: 'Manage' }] },
    { id: 'broadcast', label: '📢 Notify',    children: [{ id: 'broadcast', label: 'Broadcast' }, { id: 'admin-announce', label: 'Announce' }] },
    { id: 'events',    label: '🎪 Events',    children: [{ id: 'view-events', label: 'View Events' }, { id: 'add-event', label: 'Add Event' }, { id: 'delete-event', label: 'Delete Event' }] },
  ],
  assistant: [
    { id: 'people',   label: '👥 People',   children: [{ id: 'students', label: 'Students' }, { id: 'teachers', label: 'Teachers' }, { id: 'invite', label: 'Invite' }] },
    { id: 'manage',   label: '📋 Manage',   children: [{ id: 'subjects', label: 'Subjects' }] },
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
    { id: 'schedule',  label: 'Schedule'   },
    { id: 'events',    label: 'Events'     },
    { id: 'plan',      label: '📋 Plan',      children: [{ id: 'change-group', label: 'Change Group' }, { id: 'add-subject', label: 'Add Subject' }, { id: 'remove-subject', label: 'Remove Group' }] },
    { id: 'my-notes',  label: '📓 My Notes',  children: [{ id: 'notes', label: 'Notes' }, { id: 'practice-diary', label: 'Practice Diary' }, { id: 'notes-box', label: '📝 Notes Box' }, { id: 'search', label: '🔍 Search' }] },
    { id: 'report',    label: '⚠️ Report',    children: [{ id: 'report-absence', label: 'Lesson Absence' }, { id: 'report-event-absence', label: 'Report Event Absence' }, { id: 'report-exam-absence', label: 'Report Exam Absence' }] },
  ],
};

const GEO_BUTTON_GROUPS = {
  admin: [
    { id: 'people',    label: '👥 ხალხი',        children: [{ id: 'students', label: 'სტუდენტები' }, { id: 'assistants', label: 'ასისტენტები' }, { id: 'teachers', label: 'მასწავლებლები' }, { id: 'invite', label: 'მოწვევა' }] },
    { id: 'manage',    label: '📋 მართვა',        children: [{ id: 'subjects', label: 'მართვა' }] },
    { id: 'broadcast', label: '📢 შეტყობინება',   children: [{ id: 'broadcast', label: 'ყველას' }, { id: 'admin-announce', label: 'ჯგუფს' }] },
    { id: 'events',    label: '🎪 ღონისძიებები', children: [{ id: 'view-events', label: 'ნახვა' }, { id: 'add-event', label: 'დამატება' }, { id: 'delete-event', label: 'წაშლა' }] },
  ],
  assistant: [
    { id: 'people',   label: '👥 ხალხი',        children: [{ id: 'students', label: 'სტუდენტები' }, { id: 'teachers', label: 'მასწავლებლები' }, { id: 'invite', label: 'მოწვევა' }] },
    { id: 'manage',   label: '📋 მართვა',        children: [{ id: 'subjects', label: 'საგნები' }] },
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
    { id: 'plan',     label: '📋 გეგმა',            children: [{ id: 'change-group', label: 'ჯგუფის შეცვლა' }, { id: 'add-subject', label: 'საგნის დამატება' }, { id: 'remove-subject', label: 'ჯგუფის წაშლა' }] },
    { id: 'my-notes', label: '📓 ჩემი ჩანაწერები',  children: [{ id: 'notes', label: 'გაკვეთილის ჩანაწერები' }, { id: 'practice-diary', label: 'პრაქტიკის დღიური' }, { id: 'notes-box', label: '📝 ჩანაწერების ყუთი' }, { id: 'search', label: '🔍 ძებნა' }] },
    { id: 'report',    label: '⚠️ გაცდენა',           children: [{ id: 'report-absence', label: 'გაკვეთილის გაცდენა' }, { id: 'report-event-absence', label: 'ღონისძიების გაცდენა' }, { id: 'report-exam-absence', label: 'გამოცდის გაცდენა' }] },
  ],
};

function getButtonGroups(lang) {
  return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS;
}

const GROUP_OPEN_CLS = {
  admin:     'bg-purple-600/20 text-purple-300 border border-purple-500/40',
  assistant: 'bg-orange-600/20 text-orange-300 border border-orange-500/40',
  teacher:   'bg-blue-600/20 text-blue-300 border border-blue-500/40',
  student:   'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40',
};

export default function ChatWindow({ lang, mobile = false, onClose = null }) {
  const [role, setRole] = useState('admin');
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [customLabels, setCustomLabels] = useState({ admin: {}, assistant: {}, teacher: {}, student: {} });
  const [customRoleNames, setCustomRoleNames] = useState({ admin: '', assistant: '', teacher: '', student: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [editRoleName, setEditRoleName] = useState('');
  const [editSubmenuOpen, setEditSubmenuOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgNameGenitive, setOrgNameGenitive] = useState('');
  const [orgNameOpen, setOrgNameOpen] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState('');
  const [orgNameGenitiveDraft, setOrgNameGenitiveDraft] = useState('');
  const theme = THEMES[role];
  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, orgName, orgNameGenitive) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(lang === 'GEO' ? 'gemini' : 'anthropic');

  useEffect(() => {
    setProvider(lang === 'GEO' ? 'gemini' : 'anthropic');
  }, [lang]);
  const [accentColor, setAccentColor] = useState('#7c3aed');
  const [styleOpen, setStyleOpen] = useState(false);
  const stylePanelRef   = useRef(null);
  const fileInputRef    = useRef(null);
  const editBtnRef      = useRef(null);
  const messagesRef     = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  // In-memory library: [{id, filename, content}] — cleared on role switch / new chat
  const [libraryFiles, setLibraryFiles] = useState([]);
  const s = CHAT_STYLES['glass'];
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (!mobile) return;
    const handler = () => {
      if (messagesRef.current) {
        setTimeout(() => {
          messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
        }, 150);
      }
    };
    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, [mobile]);

  useEffect(() => {
    if (!mobile) return;
    const handler = () => setIsLandscape(window.innerWidth > window.innerHeight);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [mobile]);

  useEffect(() => {
    if (!mobile) return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'GEO' ? '⚠️ ნელი კავშირი აღმოჩენილია. პასუხი შეიძლება დაგვიანდეს.' : '⚠️ Slow connection detected. Responses may take longer.'
      }]);
    }
  }, [mobile]);

  function addLibraryFile(filename, content) {
    setLibraryFiles(prev => [...prev, { id: Date.now(), filename, content }]);
  }

  function removeLibraryFile(id) {
    setLibraryFiles(prev => prev.filter(f => f.id !== id));
  }

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, orgName, orgNameGenitive) }]);
    setInput('');
    setLoading(false);
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
  }, [role, lang]);

  useEffect(() => {
    if (!styleOpen) return;
    const handler = (e) => {
      if (stylePanelRef.current && !stylePanelRef.current.contains(e.target)) {
        setStyleOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [styleOpen]);

  // Close edit submenu on outside click
  useEffect(() => {
    if (!editSubmenuOpen) return;
    const handler = (e) => {
      if (editBtnRef.current && !editBtnRef.current.contains(e.target)) {
        setEditSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    if (editRoleName.trim()) {
      setCustomRoleNames(prev => ({ ...prev, [editTarget]: editRoleName.trim() }));
    }
    setEditOpen(false);
    setEditTarget(null);
    setEditRoleName('');
  }

  function cancelEdit() {
    setEditOpen(false);
    setEditTarget(null);
    setEditDraft({});
    setEditRoleName('');
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, orgName, orgNameGenitive) }]);
    setInput('');
    setLoading(false);
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
    setLibraryFiles([]);
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
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
      } else {
        text = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = ev => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsText(file);
        });
      }
      const newFile = { id: Date.now(), name: file.name, content: text };
      setAttachedFiles(prev => [...prev, newFile]);
      setMessages(prev => [...prev, { role: 'assistant', content: `📄 "${file.name}" ${lang === 'GEO' ? 'წაკითხულია. შეგიძლიათ კითხვები დასვათ.' : 'loaded. Ask me anything about it!'}` }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'GEO' ? 'ფაილი ვერ წავიკითხე.' : 'Sorry, I could not read that file.' }]);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    setInput('');
    setLoading(true);

    // Strip the leading assistant greeting so the API payload starts user→assistant→user→…
    // Also exclude special result/searching messages — they are display-only.
    const firstUserIdx = newMessages.findIndex((m) => m.role === 'user');
    const conversation = (firstUserIdx >= 0 ? newMessages.slice(firstUserIdx) : newMessages)
      .filter((m) => !m.type);

    const apiMessages = [
      { role: 'user',      content: `[System context] ${SYSTEM_PROMPTS[role]}` },
      { role: 'assistant', content: 'Understood.' },
      ...conversation,
    ];

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, provider, context: buildContext(libraryFiles, attachedFiles), language: lang === 'GEO' ? 'ka' : 'en' }),
      });
      const data = await res.json();
      const aiText = data.message ?? 'No response.';

      if (aiText.startsWith('YOUTUBE_SEARCH:')) {
        const query = aiText.replace('YOUTUBE_SEARCH:', '').trim();
        setMessages((prev) => [...prev, { role: 'assistant', type: 'searching', text: lang === 'GEO' ? `YouTube-ზე ძიება: "${query}"…` : `Searching YouTube for "${query}"…` }]);
        setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        try {
          const ytRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
          const ytData = await ytRes.json();
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'searching'),
            { role: 'assistant', type: 'youtube_results', query, results: ytData.results ?? [] },
          ]);
          setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        } catch {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'searching'),
            { role: 'assistant', content: lang === 'GEO' ? 'YouTube ძიება ვერ მოხდა.' : 'Sorry, YouTube search failed.' },
          ]);
          setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        }
      } else if (aiText.startsWith('WEB_SEARCH:')) {
        const query = aiText.replace('WEB_SEARCH:', '').trim();
        setMessages((prev) => [...prev, { role: 'assistant', type: 'searching', text: lang === 'GEO' ? `ვებ-ძიება: "${query}"…` : `Searching the web for "${query}"…` }]);
        setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        try {
          const webRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const webData = await webRes.json();
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'searching'),
            { role: 'assistant', type: 'web_results', query, results: webData.results ?? [] },
          ]);
          setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        } catch {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'searching'),
            { role: 'assistant', content: lang === 'GEO' ? 'ვებ ძიება ვერ მოხდა.' : 'Sorry, web search failed.' },
          ]);
          setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: aiText }]);
        setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: lang === 'GEO' ? 'შეცდომა: სერვერთან კავშირი ვერ მოხდა.' : 'Error: could not reach the server.' },
      ]);
      setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <style>{`
      input[type=range].rainbow-slider::-webkit-slider-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); box-shadow: 0 1px 4px rgba(0,0,0,0.4); appearance: none; cursor: pointer; }
      input[type=range].rainbow-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.3); cursor: pointer; }
    `}</style>
    <div className={`relative flex flex-col ${mobile ? 'w-full h-full rounded-none border-0' : 'max-w-2xl mx-auto border rounded-2xl'} overflow-hidden ${s.wrap}`} style={{ ...(mobile ? {} : { borderColor: accentColor + '40' }), ...(mobile && keyboardOpen ? { height: `${window.visualViewport?.height || window.innerHeight}px` } : {}) }}>

      {/* Per-role ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${accentColor}22, transparent)` }}
      />

      {/* Header */}
      <header className={`flex items-center gap-2 ${mobile ? 'px-2 py-1.5' : 'px-4 py-3'} border-b ${s.headerBorder} flex-shrink-0`}>
        <div className={`${mobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
          S
        </div>
        <h1 className={`${mobile ? 'text-sm' : 'text-base'} font-semibold ${s.titleColor}`}>Sherlock</h1>
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', marginLeft: '4px' }}
          >
            ✕
          </button>
        )}
        {libraryFiles.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            {lang === 'GEO' ? '📚 დემო ბიბლიოთეკა — ტოვებისას იშლება' : '📚 Demo library — clears when you leave'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {role === 'student' && <NotificationBell lang={lang} />}
          {role !== 'student' && (
            <div className="relative flex-shrink-0" ref={editBtnRef}>
              <button
                onClick={() => setEditSubmenuOpen(o => !o)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 ${
                  editSubmenuOpen
                    ? 'border-white/30 text-white bg-white/10'
                    : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                }`}>
                {mobile ? '✏️' : (lang === 'GEO' ? '✏️ რედაქტირება' : '✏️ Edit')}
              </button>
              {editSubmenuOpen && (
                <div className={`${mobile ? 'fixed left-0 right-0 mx-4' : 'absolute right-0 w-56'} top-auto mt-1 rounded-xl border border-white/15 bg-[#0f0f1a] shadow-2xl z-50 overflow-hidden`}
                  style={mobile ? { top: '56px' } : {}}>
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
                  {role === 'admin' && (
                    <button onClick={() => { setOrgNameDraft(orgName); setOrgNameGenitiveDraft(orgNameGenitive); setOrgNameOpen(true); setEditSubmenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors border-t border-white/[0.06]">
                      {lang === 'GEO' ? 'დაწესებულების სახელი' : 'Organization Name / School Name'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading}
            style={{ colorScheme: s.colorScheme }}
            className={`text-sm rounded-lg px-2 py-1 focus:outline-none ${theme.ring} disabled:opacity-40 ${s.selectCls}`}
          >
            <option value="anthropic">Claude</option>
            <option value="openai">GPT-4</option>
            <option value="gemini">Gemini</option>
          </select>

          {/* show on all devices */}
          <div className="relative flex-shrink-0" ref={stylePanelRef}>
              <button
                onClick={() => setStyleOpen(o => !o)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 ${
                  styleOpen
                    ? 'border-white/30 text-white bg-white/10'
                    : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                }`}
                style={{ borderColor: accentColor + '60' }}
              >
                <span className="flex items-center gap-2">
                  <span style={{ background: accentColor, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }} />
                  {lang === 'GEO' ? 'სტილი' : 'Stylize'}
                </span>
              </button>
              {styleOpen && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl border border-white/15 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl z-50 p-4 flex flex-col gap-3" style={{ width: 220 }}>
                  <p className="text-xs text-gray-400 font-medium">
                    {lang === 'GEO' ? 'ფერი' : 'Color'}
                  </p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={(() => {
                        const hex = accentColor.replace('#','');
                        const r = parseInt(hex.slice(0,2),16)/255;
                        const g = parseInt(hex.slice(2,4),16)/255;
                        const b = parseInt(hex.slice(4,6),16)/255;
                        const max = Math.max(r,g,b), min = Math.min(r,g,b);
                        if (max === min) return 0;
                        let h = max === r ? (g-b)/(max-min) : max === g ? 2+(b-r)/(max-min) : 4+(r-g)/(max-min);
                        h = ((h*60)+360)%360;
                        return Math.round(h);
                      })()}
                      onChange={e => {
                        const h = Math.min(359, parseInt(e.target.value));
                        const f = (n) => {
                          const k = (n + h/60) % 6;
                          return Math.round((1 - Math.max(0, Math.min(k, 4-k, 1))) * 200 + 55);
                        };
                        const r = f(5).toString(16).padStart(2,'0');
                        const g = f(3).toString(16).padStart(2,'0');
                        const b = f(1).toString(16).padStart(2,'0');
                        setAccentColor('#'+r+g+b);
                      }}
                      className="w-full cursor-pointer rainbow-slider"
                      style={{
                        height: 20,
                        borderRadius: 10,
                        border: 'none',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff2200)',
                      }}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor, boxShadow: `0 0 12px ${accentColor}88`, flexShrink: 0 }} />
                      <span className="text-xs text-gray-400">{lang === 'GEO' ? 'არჩეული ფერი' : 'Selected color'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {loading && (
            <span className={`text-xs animate-pulse ${s.thinkingColor}`}>{lang === 'GEO' ? 'ფიქრობს...' : 'Thinking…'}</span>
          )}
        </div>
      </header>

      {/* Role switcher */}
      <div className={`flex items-center gap-1 ${mobile ? 'px-2 py-1 overflow-x-auto' : 'px-4 py-2'} border-b ${s.headerBorder} flex-shrink-0`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {ROLE_SWITCHER.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
              role === r.id
                ? r.activeCls
                : s.colorScheme === 'light'
                  ? 'text-gray-500 hover:text-gray-900'
                  : 'text-gray-400 hover:text-white'
            }`}
          >
            {customRoleNames[r.id] || (lang === 'GEO' ? ({ admin: 'ადმინი', assistant: 'ასისტენტი', teacher: 'მასწავლებელი', student: 'სტუდენტი' })[r.id] : r.label)}
          </button>
        ))}
        <button
          onClick={clearChat}
          title="Start a new conversation"
          className={`ml-auto text-xs px-2 py-1 rounded-lg transition-colors ${
            s.colorScheme === 'light'
              ? 'text-gray-400 hover:text-gray-700'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
        </button>
      </div>

      {/* Handler buttons */}
      {(() => {
        const inactiveCls = s.colorScheme === 'light'
          ? 'border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400'
          : 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
        const inactiveGroupCls = s.colorScheme === 'light'
          ? 'border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
          : 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
        const openGroupDef = openGroup ? getButtonGroups(lang)[role].find(g => g.id === openGroup) : null;
        return (
          <div className={`flex flex-col border-b ${s.headerBorder} flex-shrink-0`}>
            <div className={`flex items-center gap-1.5 ${mobile ? 'px-2 py-1' : 'px-4 py-2'} overflow-x-auto`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {getButtonGroups(lang)[role].map(item => {
                const isMulti = item.children && item.children.length >= 2;
                if (isMulti) {
                  return (
                    <button key={item.id}
                      onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${openGroup === item.id ? GROUP_OPEN_CLS[role] : inactiveGroupCls}`}>
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
                {openGroupDef.children.map(child => {
                  return (
                    <button key={child.id}
                      onClick={() => setActivePanel(activePanel === child.id ? null : child.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activePanel === child.id ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                      {getEffLabel(role, child.id, child.label)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Org name modal */}
      {orgNameOpen && (
        <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-white/15 rounded-2xl p-4 w-full max-w-sm flex flex-col gap-4">
            <div className="flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">
                {lang === 'GEO' ? 'დაწესებულების სახელი' : 'Organization Name / School Name'}
              </h3>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  სახელი (მაგ: კაკაო)
                </label>
                <input
                  autoFocus
                  value={orgNameDraft}
                  onChange={e => setOrgNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setOrgNameOpen(false); }}
                  placeholder="კაკაო"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  სახელი წინადადებაში (მაგ: კაკაოს)
                </label>
                <input
                  value={orgNameGenitiveDraft}
                  onChange={e => setOrgNameGenitiveDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setOrgNameOpen(false); }}
                  placeholder="კაკაოს"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setOrgName(orgNameDraft.trim()); setOrgNameGenitive(orgNameGenitiveDraft.trim()); setOrgNameOpen(false); }}
                className={`flex-1 rounded-xl ${THEMES.admin.sendBtn} px-3 py-2 text-xs text-white font-medium transition-colors`}>
                {lang === 'GEO' ? 'შენახვა' : 'Save'}
              </button>
              <button onClick={() => setOrgNameOpen(false)}
                className="flex-1 rounded-xl border border-white/15 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Label editor modal */}
      {editOpen && editTarget && (
        <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-white/15 rounded-2xl p-4 w-full max-w-sm max-h-[85%] flex flex-col gap-4 overflow-hidden">

            {/* Title */}
            <div className="flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">
                {lang === 'GEO' ? 'პანელის რედაქტირება' : 'Customize panel'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {editTarget === 'student'
                  ? (lang === 'GEO' ? 'სტუდენტის ხედი' : 'Student view')
                  : (lang === 'GEO' ? 'ჩემი ხედი' : 'My view')}
              </p>
            </div>

            {/* Role name */}
            <div className="flex-shrink-0 bg-white/[0.04] rounded-xl p-3 border border-white/[0.08]">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {lang === 'GEO' ? '🏷️ როლის სახელი' : '🏷️ Role name'}
              </label>
              <input
                value={editRoleName}
                onChange={e => setEditRoleName(e.target.value)}
                placeholder={editTarget}
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Buttons list */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {lang === 'GEO' ? '🔘 ღილაკები' : '🔘 Buttons'}
              </p>
              {getButtonGroups(lang)[editTarget]?.map(item => (
                <div key={item.id} className="bg-white/[0.03] rounded-xl border border-white/[0.07] overflow-hidden">
                  {/* Top-level button */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04]">
                    <span className="text-xs text-gray-500 w-4">▶</span>
                    <input
                      value={editDraft[item.id] ?? item.label}
                      onChange={e => setEditDraft(d => ({ ...d, [item.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  {/* Sub-buttons */}
                  {item.children?.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.05]">
                      <span className="text-xs text-gray-600 w-4 text-right">↳</span>
                      <input
                        value={editDraft[c.id] ?? c.label}
                        onChange={e => setEditDraft(d => ({ ...d, [c.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-white/20"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={saveLabels}
                className={`flex-1 rounded-xl ${THEMES[editTarget === 'student' ? (role === 'student' ? 'admin' : role) : role]?.sendBtn ?? 'bg-purple-600 hover:bg-purple-500'} px-3 py-2 text-xs text-white font-medium transition-colors`}>
                {lang === 'GEO' ? 'შენახვა' : 'Save'}
              </button>
              <button onClick={cancelEdit}
                className="flex-1 rounded-xl border border-white/15 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages + active panel */}
      <div ref={messagesRef} className={`${mobile ? 'flex-1' : 'h-[400px]'} overflow-y-auto px-4 py-4`} style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', ...(mobile && isLandscape ? { maxHeight: '40vh' } : {}) }}>
        {activePanel && (
          <div className="mb-4">
            <RolePanel role={role} panel={activePanel} onClose={() => setActivePanel(null)}
              libraryProps={{ libraryFiles, onAddFile: addLibraryFile, onRemoveFile: removeLibraryFile, orgName, orgNameGenitive }} lang={lang} />
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} theme={theme} styleName="glass" />
        ))}
      </div>

      {/* Attached file pills */}
      {attachedFiles.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 border-t ${s.footerBorder} flex-shrink-0 flex-wrap`}>
          {attachedFiles.map(f => (
            <span key={f.id} className={`text-xs rounded-full px-3 py-1.5 flex items-center gap-2 ${
              s.colorScheme === 'light' ? 'bg-gray-100 text-gray-700' : 'bg-white/[0.08] text-gray-300'
            }`}>
              <span className="truncate max-w-[120px]">📄 {f.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                className="text-gray-500 hover:text-white flex-shrink-0 leading-none transition-colors"
              >✕</button>
            </span>
          ))}
          <span className="text-xs text-gray-600">{attachedFiles.length}/3</span>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className={`flex items-end gap-2 ${mobile ? 'px-2 py-2' : 'px-4 py-3'} border-t ${s.footerBorder} flex-shrink-0`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          title="Attach document for this conversation only (.pdf, .txt, .md) — not saved to Library"
          onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`px-3 py-2 rounded-xl text-sm flex-shrink-0 transition-all duration-150 active:scale-95 ${
            attachedFiles.length > 0
              ? PANEL_ACTIVE_CLS[role]
              : s.colorScheme === 'light'
                ? 'border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400'
                : 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30'
          }`}
        >
          📎
        </button>
        <textarea
          rows={1}
          placeholder={lang === 'GEO' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          className={`flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none ${theme.ring} max-h-32 ${s.inputCls}`}
        />
        {role !== 'student' && (
          <button
            type="button"
            title="Knowledge Library"
            onClick={() => setActivePanel(activePanel === 'knowledge-library' ? null : 'knowledge-library')}
            style={{ minHeight: 44, minWidth: 44 }}
            className={`px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all duration-150 active:scale-95 ${
              activePanel === 'knowledge-library'
                ? PANEL_ACTIVE_CLS[role]
                : s.colorScheme === 'light'
                  ? 'border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400'
                  : 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30'
            }`}
          >
            📚
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-all duration-150 ${theme.sendBtn}`}
        >
          {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>
    </div>
    </>
  );
}
