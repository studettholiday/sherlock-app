import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { RolePanel, PANEL_ACTIVE_CLS } from '../components/RolePanels';
import { registerServiceWorker, requestPermissionAndSubscribe, isPushSupported } from '../lib/push';

// Chat is constrained to a centered column of this width (px).
const CHAT_COLUMN_MAX_WIDTH = 760;

const THEMES = {
  student: {
    avatar:     'bg-[#eff6ff] text-[#2563eb]',
    userBubble: 'bg-[#eff6ff] text-[#111827]',
    sendBtn:    'bg-[#2563eb] hover:bg-[#1d4ed8]',
    ring:       'focus:border-[#3b82f6]',
    glow:       'transparent',
  },
};

const BASE_IDENTITY = 'You are Sherlock Is Smart, an AI assistant for school management. You help staff and students with schedules, events, notes, and any information uploaded to the school library. You do not assume what type of school you are — that is defined by the admin through uploaded documents and context. Be concise, helpful, and professional. You have the wit and dry humor of Sherlock Holmes from Arthur Conan Doyle\'s stories. Use occasional clever quips, deadpan observations, and self-aware humor — especially when you cannot find information, when asked something obvious, or when completing a task successfully. In Georgian, use the same wit naturally. Use this quote when it fits naturally: \'ელემენტარულია, ვატსონ.\' — use this when answering something logical or complex that you solved easily. Use it exactly as written, do not modify or translate it. In Georgian keep the same Holmesian personality but sound natural, not translated. You are never rude or dismissive — the humor is always warm and helpful. Never overdo it — use humor sparingly, only when it fits naturally. Be direct and precise. Never ask the user to clarify whether you have access to documents — you either have context or you don\'t, and you know which. If no library documents are provided in context, simply say you don\'t have that information, with Holmesian wit. Never say things like \'do you have access to...\' or \'please upload documents\' — that is not your concern. Your Georgian must be grammatically perfect — never use awkward phrasing or overly formal bureaucratic language. Speak naturally, like an intelligent Georgian speaker would. When uncertain, admit it directly and briefly, with dry humor if appropriate.';

const NO_INFO_INSTRUCTION = `When you cannot find information in the school library or context, respond with one of these naturally, matching the user's language: English: 'Sorry, I couldn\'t find anything on that.' or 'My deductive methods failed me on this one, haha. No information found.' Georgian: 'სამწუხაროდ, ინფორმაცია ვერ მოიძებნა.' or 'ინფორმაცია ვერ ვიპოვე ამ თემაზე.' or 'ჩემი დედუქციის მეთოდი უსარგებლო აღმოჩნდა, ჰაჰაჰა. ინფორმაცია ვერ ვიპოვე.' Vary the response naturally, don't always use the same one.`;

const SYSTEM_PROMPTS = {
  student:   `${BASE_IDENTITY} You are assisting a student. Answer questions directly and helpfully. When responding to a greeting or first message, do not list your capabilities. Simply ask how you can help, using variations like: 'How can I help you?', 'How may I assist you?', 'რით შემიძლია დაგეხმაროთ?', 'დღეს რით შემიძლია გემსახუროთ?' — match the language of the user's message. ${NO_INFO_INSTRUCTION}`,
};

// Unified greeting — no role variants. Interpolates the school name when present.
function getGreeting(role, lang, orgName = '', orgNameGenitive = '') {
  if (lang === 'GEO') {
    return orgName
      ? `გამარჯობა! მე ვარ შერლოკი, ${orgName}-ის ასისტენტი. რით შემიძლია დაგეხმაროთ?`
      : 'გამარჯობა! მე ვარ შერლოკი, თქვენი სკოლის ასისტენტი. რით შემიძლია დაგეხმაროთ?';
  }
  return orgName
    ? `Hi! I'm Sherlock, your ${orgName} assistant. How can I help today?`
    : "Hi! I'm Sherlock, your school assistant. How can I help today?";
}

const CHAT_STYLES = {
  glass: {
    wrap:            'bg-[#fdfcf8]',
    headerBorder:    'border-[#e5e7eb]',
    footerBorder:    'border-[#e5e7eb]',
    titleColor:      'text-[#111827]',
    assistantBubble: 'bg-[#ffffff] text-[#111827] border border-[#e5e7eb]',
    inputCls:        'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] placeholder-[#9ca3af]',
    selectCls:       'bg-[#ffffff] border border-[#e5e7eb] text-[#111827]',
    thinkingColor:   'text-[#6b7280]',
    colorScheme:     'light',
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
      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words ${
        isUser
          ? `${theme.userBubble} rounded-br-sm`
          : `${s.assistantBubble} rounded-bl-sm`
      }`}>
        {isUser ? message.content : (
          <ReactMarkdown components={{
            a: ({ href, children }) => href?.startsWith('/api/library/download/')
              ? <a href={href} download style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>{children}</a>
              : <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{children}</a>
          }}>{message.content}</ReactMarkdown>
        )}
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

function getButtonGroups(lang) {
  return lang === 'GEO' ? GEO_BUTTON_GROUPS : BUTTON_GROUPS;
}

const GROUP_OPEN_CLS = {
  student:   'bg-[#eff6ff] text-[#2563eb] border border-[#3b82f6]',
};

const ACCENT_COLORS = {
  student: '#2563eb',
};

export default function Chat() {
  const { user, logout } = useAuth();
  const lang = localStorage.getItem('sherlock_lang') === 'ka' ? 'GEO' : 'EN';

  const role = user?.role || 'student';
  const [activePanel, setActivePanel] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const theme = THEMES[role] || THEMES.student;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '', '') },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[role] || '#2563eb');

  const messagesRef  = useRef(null);
  const fileInputRef = useRef(null);
  const pushInitRef  = useRef(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [libraryFiles, setLibraryFiles]   = useState([]);
  const s = CHAT_STYLES['glass'];

  // Track visual viewport height so the layout never extends behind mobile keyboard/chrome
  const [vph, setVph] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );
  useEffect(() => {
    const onResize = () => {
      setVph(window.visualViewport?.height ?? window.innerHeight);
      setTimeout(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
      }, 150);
    };
    window.visualViewport?.addEventListener('resize', onResize);
    return () => window.visualViewport?.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setAccentColor(ACCENT_COLORS[role] || '#2563eb');
  }, [role]);

  // Web push: on first sign-in, silently register the service worker and
  // request notification permission. No banner — the native prompt is enough.
  // If push is unsupported or permission is denied, it just logs and moves on.
  useEffect(() => {
    if (pushInitRef.current || !user || !isPushSupported()) return;
    pushInitRef.current = true;
    const token = localStorage.getItem('sherlock_token');
    if (!token) return;
    registerServiceWorker().then(() => requestPermissionAndSubscribe(token));
  }, [user]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getGreeting(role, lang, user?.schoolName || '', '') }]);
    setInput('');
    setLoading(false);
    setActivePanel(null);
    setOpenGroup(null);
    setAttachedFiles([]);
  }, [role, lang]);

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
        body: JSON.stringify({ messages: apiMessages, context: buildContext(libraryFiles, attachedFiles), language: lang === 'GEO' ? 'ka' : 'en' }),
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
    <div className="flex flex-col font-sans overflow-hidden"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '100dvh',
        background: '#fdfcf8',
        color: '#111827',
      }}>

      <style>{`
        @keyframes dotBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .dot-bounce { animation: dotBounce 0.6s ease-in-out infinite; }
      `}</style>

      {/* Brand accent line — 3px decorative bar, full viewport width, above all content */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '3px', background: '#2563eb', zIndex: 50,
      }} />

      {/* Chat card fills remaining height */}
      <div className={`relative flex flex-col flex-1 overflow-hidden w-full mx-auto ${s.wrap}`} style={{ maxWidth: CHAT_COLUMN_MAX_WIDTH }}>

        {/* Header */}
        <header className={`flex items-center gap-2 px-4 py-2 sm:py-3 border-b ${s.headerBorder} flex-shrink-0 bg-[#ffffff]`}>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${theme.avatar} flex items-center justify-center font-bold flex-shrink-0 text-sm`}>
            S
          </div>
          <h1 className="text-[18px] font-semibold text-[#111827]">Sherlock</h1>
          {user?.schoolName && (
            <span className="hidden sm:inline text-[14px] font-normal text-[#6b7280] ml-0.5">{user.schoolName}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={logout} className="text-[13px] font-medium text-[#dc2626] px-3 py-1.5 sm:px-3.5 rounded-md border border-[#fecaca] transition-colors duration-150 hover:bg-[#fef2f2] whitespace-nowrap bg-[#ffffff] cursor-pointer">
              {lang === 'GEO' ? 'გასვლა' : 'Sign out'}
            </button>
          </div>
        </header>

        {/* Handler buttons */}
        {(() => {
          const inactiveCls = 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb]';
          const inactiveGroupCls = 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb]';
          const openGroupDef = openGroup ? getButtonGroups(lang)[role].find(g => g.id === openGroup) : null;
          return (
            <div className={`flex flex-col border-b ${s.headerBorder} flex-shrink-0`}>
              <div className={`flex items-center gap-1.5 px-4 py-1.5 sm:py-2 overflow-x-auto`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {getButtonGroups(lang)[role].map(item => {
                  const isMulti = item.children && item.children.length >= 2;
                  if (isMulti) {
                    return (
                      <button key={item.id}
                        onClick={() => setOpenGroup(g => g === item.id ? null : item.id)}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${openGroup === item.id ? GROUP_OPEN_CLS[role] : inactiveGroupCls}`}>
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
                    <button
                      onClick={() => setActivePanel(activePanel === 'students' ? null : 'students')}
                      className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === 'students' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                      {lang === 'GEO' ? '👥 მოსწავლეები' : '👥 Students'}
                    </button>
                  </>
                )}
                {/* Files — accessible to every signed-in user; panel content branches on role. */}
                <button
                  onClick={() => setActivePanel(activePanel === 'library' ? null : 'library')}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${activePanel === 'library' ? PANEL_ACTIVE_CLS[role] : inactiveCls}`}>
                  {lang === 'GEO' ? '📁 ფაილები' : '📁 Files'}
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
          );
        })()}

        {/* Messages + active panel */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', minHeight: 0 }}>
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
          <div className={`w-8 h-8 text-sm rounded-full ${theme.avatar} flex items-center justify-center font-bold flex-shrink-0`}>
            S
          </div>
          <div className={`px-3.5 py-2.5 rounded-xl rounded-bl-sm ${s.assistantBubble} flex items-center gap-1.5`}>
            {[0, 1, 2].map(d => (
              <div key={d} className="dot-bounce w-2 h-2 rounded-full"
                style={{ background: '#9ca3af', animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        </div>

        {/* Attached file pills */}
        {attachedFiles.length > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 border-t ${s.footerBorder} flex-shrink-0 flex-wrap`}>
            {attachedFiles.map(f => (
              <span key={f.id} className="text-[13px] rounded-md px-3 py-1.5 flex items-center gap-2 bg-[#fafafa] border border-[#e5e7eb] text-[#111827]">
                <span className="truncate max-w-[120px]">📄 {f.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                  className="text-[#9ca3af] hover:text-[#111827] flex-shrink-0 leading-none transition-colors duration-150"
                >✕</button>
              </span>
            ))}
            <span className="text-[13px] text-[#9ca3af]">{attachedFiles.length}/3</span>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className={`flex items-end gap-2 px-4 py-2 sm:py-3 border-t ${s.footerBorder} flex-shrink-0`}
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
            className={`px-3 py-2 rounded-md text-sm flex-shrink-0 transition-colors duration-150 ${
              attachedFiles.length > 0
                ? PANEL_ACTIVE_CLS[role]
                : 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] hover:bg-[#f9fafb]'
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
            onFocus={() => setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }), 300)}
            className={`flex-1 resize-none rounded-md text-[16px] focus:outline-none ${theme.ring} focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] max-h-32 ${s.inputCls}`}
            style={{ padding: '10px 14px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{ minHeight: 44, minWidth: 44 }}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium disabled:opacity-40 transition-colors duration-150 ${theme.sendBtn}`}
          >
            {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
