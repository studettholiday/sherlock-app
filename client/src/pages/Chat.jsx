import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';

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

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional. You have the wit and dry humor of Sherlock Holmes from Arthur Conan Doyle\'s stories. Use occasional clever quips, deadpan observations, and self-aware humor — especially when you cannot find information, when asked something obvious, or when completing a task successfully. In Georgian, use the same wit naturally. Use this quote when it fits naturally: \'ელემენტარულია, ვატსონ.\' — use this when answering something logical or complex that you solved easily. Use it exactly as written, do not modify or translate it. In Georgian keep the same Holmesian personality but sound natural, not translated. You are never rude or dismissive — the humor is always warm and helpful. Never overdo it — use humor sparingly, only when it fits naturally. Be direct and precise. Never ask the user to clarify whether you have access to documents — you either have context or you don\'t, and you know which. If no library documents are provided in context, simply say you don\'t have that information, with Holmesian wit. Never say things like \'do you have access to...\' or \'please upload documents\' — that is not your concern. Your Georgian must be grammatically perfect — never use awkward phrasing or overly formal bureaucratic language. Speak naturally, like an intelligent Georgian speaker would. When uncertain, admit it directly and briefly, with dry humor if appropriate.';

const NO_INFO_INSTRUCTION = `When you cannot find information in the school library or context, respond with one of these naturally, matching the user's language: English: 'Sorry, I couldn\'t find anything on that.' or 'My deductive methods failed me on this one, haha. No information found.' Georgian: 'სამწუხაროდ, ინფორმაცია ვერ მოიძებნა.' or 'ინფორმაცია ვერ ვიპოვე ამ თემაზე.' or 'ჩემი დედუქციის მეთოდი უსარგებლო აღმოჩნდა, ჰაჰაჰა. ინფორმაცია ვერ ვიპოვე.' Vary the response naturally, don't always use the same one.`;

const SYSTEM_PROMPTS = {
  admin:     `${BASE_IDENTITY} You are assisting a school admin. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  assistant: `${BASE_IDENTITY} You are assisting a school office assistant. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  teacher:   `${BASE_IDENTITY} You are assisting a teacher. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
  student:   `${BASE_IDENTITY} You are assisting a student. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
};

const GREETINGS = {
  admin:     "Hello! I'm Sherlock, your admin assistant. I can help you manage students, approve registrations, generate invite codes, set schedules, broadcast messages, and view audit logs. What would you like to do?",
  assistant: "Hi! I'm Sherlock, your office assistant. I can help with student management, groups, announcements, and sending invitations. What do you need?",
  teacher:   "Hi! I'm Sherlock, your teaching assistant. I can help with group schedules, student attendance, lesson notes, and group announcements. How can I help today?",
  student:   "Hey! I'm Sherlock, your school assistant. Ask me about your schedule, upcoming events, notes, or anything in the school library!",
};

const GEO_GREETINGS = {
  admin:     "გამარჯობა! მე ვარ შერლოკ არის ჭკვიანი, ხელოვნური ინტელექტი, ასისტენტი სკოლის მართვისთვის. რით შემიძლია დაგეხმაროთ დღეს, როგორც სკოლის ადმინისტრატორს? შემიძლია დაგეხმაროთ სტუდენტების დამტკიცებაში, მოსაწვევი კოდების გენერირებაში, განრიგის დადგენაში, მომხმარებლების დაბლოკვაში, აუდიტის ჟურნალების ნახვაში და შეტყობინებების გავრცელებაში.",
  assistant: "გამარჯობა! მე ვარ შერლოკი, თქვენი ოფისის ასისტენტი. შემიძლია დაგეხმაროთ სტუდენტების მართვაში, ჯგუფებში, განცხადებებში და მოწვევების გაგზავნაში. რა გჭირდებათ?",
  teacher:   "გამარჯობა! მე ვარ შერლოკი, სკოლის მართვის AI ასისტენტი. რით შემიძლია დაგეხმაროთ დღეს? შემიძლია დაგეხმაროთ განრიგების, ჯგუფური განცხადებების, მოსწავლეთა დასწრების, გაკვეთილის ჩანაწერების მართვაში და ჯგუფებისთვის ინფორმაციის გაგზავნაში.",
  student:   "გამარჯობა! მე ვარ შერლოკი, თქვენი AI ასისტენტი. რით შემიძლია დაგეხმაროთ დღეს? შემიძლია მოგაწოდოთ ინფორმაცია განრიგის, მომავალი ღონისძიებების, ჩანაწერების შესახებ ან ნებისმიერი სხვა ინფორმაცია სასკოლო ბიბლიოთეკიდან.",
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

function MessageBubble({ message, theme }) {
  const s = CHAT_STYLES['glass'];
  const isUser = message.role === 'user';

  if (message.type === 'searching') {
    return (
      <div className="flex justify-start mb-3">
        <div className="px-4 py-2 text-sm text-gray-500 animate-pulse">{message.text}</div>
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
    { id: 'announce',    label: '📢 Announce'    },
    { id: 'share-files', label: '📁 Share Files' },
  ],
  student: [
    { id: 'schedule',  label: 'Schedule'   },
    { id: 'events',    label: 'Events'     },
    { id: 'plan',      label: '📋 Plan',      children: [{ id: 'change-group', label: 'Change Group' }, { id: 'add-subject', label: 'Add Subject' }, { id: 'remove-subject', label: 'Remove Subject' }] },
    { id: 'my-notes',  label: '📓 My Notes',  children: [{ id: 'notes', label: 'Notes' }, { id: 'practice-diary', label: 'Practice Diary' }, { id: 'notes-box', label: '📝 Notes Box' }, { id: 'search', label: '🔍 Search' }] },
    { id: 'report',    label: '⚠️ Report',    children: [{ id: 'report-absence', label: 'Lesson Absence' }, { id: 'report-event-absence', label: 'Report Event Absence' }, { id: 'report-exam-absence', label: 'Report Exam Absence' }] },
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
    { id: 'plan',     label: '📋 გეგმა',            children: [{ id: 'change-group', label: 'ჯგუფის შეცვლა' }, { id: 'add-subject', label: 'საგნის დამატება' }, { id: 'remove-subject', label: 'საგნის წაშლა' }] },
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

const ACCENT_COLORS = {
  admin: '#7c3aed', assistant: '#ea580c', teacher: '#2563eb', student: '#059669',
};

export default function Chat() {
  const { user } = useAuth();
  const storedLang = localStorage.getItem('sherlock_lang') || 'en';
  const lang       = storedLang === 'ka' ? 'GEO' : 'EN';
  const langKey    = storedLang === 'ka' ? 'ka' : 'en';

  const defaultRole = user?.role || 'admin';
  const [role, setRole]           = useState(defaultRole);
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const theme = THEMES[role] || THEMES.student;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '', '') },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[defaultRole] || '#7c3aed');

  const messagesRef  = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [libraryFiles, setLibraryFiles]   = useState([]);
  const s = CHAT_STYLES['glass'];

  useEffect(() => {
    setAccentColor(ACCENT_COLORS[role] || '#7c3aed');
  }, [role]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '', '') }]);
    setInput('');
    setLoading(false);
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
  }, [role, lang]);

  function clearChat() {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '', '') }]);
    setInput('');
    setLoading(false);
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

    const firstUserIdx = newMessages.findIndex((m) => m.role === 'user');
    const conversation = (firstUserIdx >= 0 ? newMessages.slice(firstUserIdx) : newMessages)
      .filter((m) => !m.type);

    const apiMessages = [
      { role: 'user',      content: `[System context] ${SYSTEM_PROMPTS[role]}` },
      { role: 'assistant', content: 'Understood.' },
      ...conversation,
    ];

    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, context: buildContext(libraryFiles, attachedFiles), language: langKey }),
      });
      const data = await res.json();
      const aiText = data.message ?? 'No response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiText }]);
      setTimeout(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
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
    <div className="min-h-screen flex flex-col text-white font-sans"
      style={{ background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)' }}>

      <style>{`
        @keyframes rainbowBar {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes dotBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .dot-bounce { animation: dotBounce 0.6s ease-in-out infinite; }
      `}</style>

      {/* Rainbow top bar */}
      <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#0891b2,#06b6d4,#7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Full-page ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${accentColor}22, transparent)` }} />

      {/* Chat card fills remaining height */}
      <div className={`relative flex flex-col flex-1 ${s.wrap}`}>

        {/* Per-role ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${accentColor}22, transparent)` }}
        />

        {/* Header */}
        <header className={`flex items-center gap-2 px-4 py-3 border-b ${s.headerBorder} flex-shrink-0`}>
          <div className={`w-8 h-8 rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
            S
          </div>
          <h1 className={`text-base font-semibold ${s.titleColor}`}>Sherlock</h1>
          {user?.schoolName && (
            <span className="text-xs text-white/35 ml-0.5">{user.schoolName}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <a href="/dashboard"
              className="text-xs text-white/40 no-underline px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors hover:bg-white/[0.08] hover:text-white/70">
              {lang === 'GEO' ? '← დაფა' : '← Dashboard'}
            </a>
          </div>
        </header>

        {/* Role switcher */}
        <div className={`flex items-center gap-1 px-4 py-2 border-b ${s.headerBorder} flex-shrink-0`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ROLE_SWITCHER.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                role === r.id
                  ? r.activeCls
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'GEO' ? ({ admin: 'ადმინი', assistant: 'ასისტენტი', teacher: 'მასწავლებელი', student: 'სტუდენტი' })[r.id] : r.label}
            </button>
          ))}
          <button
            onClick={clearChat}
            title="Start a new conversation"
            className="ml-auto text-xs px-2 py-1 rounded-lg text-gray-600 hover:text-gray-400 transition-colors"
          >
            {lang === 'GEO' ? '↺ ახალი' : '↺ New'}
          </button>
        </div>

        {/* Handler buttons */}
        {(() => {
          const inactiveCls = 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
          const inactiveGroupCls = 'border border-white/15 text-gray-400 hover:text-white hover:border-white/30';
          const openGroupDef = openGroup ? getButtonGroups(lang)[role].find(g => g.id === openGroup) : null;
          return (
            <div className={`flex flex-col border-b ${s.headerBorder} flex-shrink-0`}>
              <div className={`flex items-center gap-1.5 px-4 py-2 overflow-x-auto`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {getButtonGroups(lang)[role].map(item => {
                  const isMulti = item.children && item.children.length >= 2;
                  if (isMulti) {
                    return (
                      <button key={item.id}
                        onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${openGroup === item.id ? GROUP_OPEN_CLS[role] : inactiveGroupCls}`}>
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
          );
        })()}

        {/* Messages + active panel */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}>
          {activePanel && (
            <div className="mb-4">
              <RolePanel role={role} panel={activePanel} onClose={() => setActivePanel(null)}
                libraryProps={{ libraryFiles, onAddFile: addLibraryFile, onRemoveFile: removeLibraryFile, orgName: user?.schoolName || '', orgNameGenitive: '' }} lang={lang} />
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} theme={theme} />
          ))}
        </div>

        {/* Thinking indicator — fixed below messages, never scrolls away */}
        <div style={{ display: loading ? 'flex' : 'none', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}
          className={`px-4 py-2 border-t ${s.footerBorder}`}>
          <div className={`w-8 h-8 text-sm rounded-full ${theme.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>
            S
          </div>
          <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm ${s.assistantBubble} flex items-center gap-1.5`}>
            {[0, 1, 2].map(d => (
              <div key={d} className="dot-bounce w-2 h-2 rounded-full"
                style={{ background: accentColor, animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        </div>

        {/* Attached file pills */}
        {attachedFiles.length > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 border-t ${s.footerBorder} flex-shrink-0 flex-wrap`}>
            {attachedFiles.map(f => (
              <span key={f.id} className="text-xs rounded-full px-3 py-1.5 flex items-center gap-2 bg-white/[0.08] text-gray-300">
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
          className={`flex items-end gap-2 px-4 py-3 border-t ${s.footerBorder} flex-shrink-0`}
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
    </div>
  );
}
