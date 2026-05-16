import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ReactMarkdown from 'react-markdown';

const THEMES = {
  admin:     { avatar: 'linear-gradient(135deg,#7c3aed,#4f46e5)', userBubble: 'linear-gradient(135deg,#6d28d9,#4338ca)', send: '#7c3aed', ring: '0 0 0 2px rgba(124,58,237,0.4)', glow: 'rgba(124,58,237,0.5)', glowSoft: 'rgba(124,58,237,0.15)' },
  assistant: { avatar: 'linear-gradient(135deg,#ea580c,#c2410c)', userBubble: 'linear-gradient(135deg,#ea580c,#9a3412)', send: '#ea580c', ring: '0 0 0 2px rgba(234,88,12,0.4)',  glow: 'rgba(234,88,12,0.5)',  glowSoft: 'rgba(234,88,12,0.15)'  },
  teacher:   { avatar: 'linear-gradient(135deg,#2563eb,#1d4ed8)', userBubble: 'linear-gradient(135deg,#2563eb,#1e40af)', send: '#2563eb', ring: '0 0 0 2px rgba(37,99,235,0.4)',   glow: 'rgba(37,99,235,0.5)',   glowSoft: 'rgba(37,99,235,0.15)'   },
  student:   { avatar: 'linear-gradient(135deg,#059669,#047857)', userBubble: 'linear-gradient(135deg,#059669,#065f46)', send: '#059669', ring: '0 0 0 2px rgba(5,150,105,0.4)',   glow: 'rgba(5,150,105,0.5)',   glowSoft: 'rgba(5,150,105,0.15)'   },
};

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

const MODES = [
  { id: 'focus', labelEn: 'Focus', labelKa: 'ფოკუსი', desc: 'Library only' },
  { id: 'smart', labelEn: 'Smart', labelKa: 'სმარტი', desc: 'Library + general' },
  { id: 'full',  labelEn: 'Full',  labelKa: 'სრული',  desc: 'Unrestricted' },
];

export default function Chat() {
  const { user, logout } = useAuth();
  const token = localStorage.getItem('sherlock_token');
  const lang = localStorage.getItem('sherlock_lang') === 'ka' ? 'ka' : 'en';
  const role = user?.role || 'student';
  const theme = THEMES[role] || THEMES.student;

  const greeting = GREETINGS[lang][role]?.(user?.name || '', user?.schoolName || '') || '';
  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('smart');
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages, mode, language: lang }),
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0015 0%, #0d0d1a 50%, #050510 100%)', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'inherit' }}>
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
        .chat-send-btn { transition: all 0.15s; }
        .chat-send-btn:hover:not(:disabled) { filter: brightness(1.12); transform: scale(1.02); }
        .chat-send-btn:active:not(:disabled) { transform: scale(0.97); }
        .chat-mode-pill { transition: all 0.15s; }
        .chat-mode-pill:hover { opacity: 0.88; }
        .chat-dash-link { transition: all 0.15s; }
        .chat-dash-link:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.7) !important; }
        .chat-textarea:focus {
          border-color: ${theme.send}99 !important;
          box-shadow: 0 0 0 3px ${theme.glowSoft} !important;
        }
      `}</style>

      {/* Rainbow bar */}
      <div style={{ height: 2, width: '100%', flexShrink: 0, background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #0891b2, #06b6d4, #7c3aed)', backgroundSize: '200% 100%', animation: 'rainbowBar 4s linear infinite' }} />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${theme.glowSoft}, transparent)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.78)', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0, animation: 'avatarPulse 3s ease-in-out infinite' }}>S</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Sherlock</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{user?.schoolName}</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {role === 'admin' && MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc} className="chat-mode-pill"
              style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: mode === m.id ? theme.send : 'rgba(255,255,255,0.04)',
                borderColor: mode === m.id ? theme.send : 'rgba(255,255,255,0.12)',
                color: mode === m.id ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow: mode === m.id ? `0 0 14px ${theme.glowSoft}` : 'none',
              }}>
              {lang === 'ka' ? m.labelKa : m.labelEn}
            </button>
          ))}
          <a href="/dashboard" className="chat-dash-link"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', padding: '5px 13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
            {lang === 'ka' ? '← დაფა' : '← Dashboard'}
          </a>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} className="msg-appear" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>S</div>
            )}
            <div style={{
              maxWidth: '70%', padding: '12px 16px', fontSize: 14, lineHeight: 1.65,
              borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
              background: msg.role === 'user' ? theme.userBubble : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              backdropFilter: msg.role === 'assistant' ? 'blur(20px)' : 'none',
              boxShadow: msg.role === 'user'
                ? `0 4px 20px ${theme.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.15)`
                : '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>S</div>
            <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: `dotBounce 1.2s ease-in-out ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, padding: '8px 16px', background: 'rgba(248,113,113,0.08)', borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)' }}>{error}</div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ position: 'relative', zIndex: 1, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', background: 'rgba(8,8,20,0.78)', display: 'flex', gap: '12px', alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
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
          placeholder={lang === 'ka' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          style={{ flex: 1, padding: '12px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, color: 'white', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 160, lineHeight: 1.55, overflowY: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
        />
        <button type="submit" disabled={loading || !input.trim()} className="chat-send-btn"
          style={{ padding: '12px 26px', background: theme.avatar, border: 'none', borderRadius: 16, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.42 : 1, flexShrink: 0, minHeight: 48, boxShadow: loading || !input.trim() ? 'none' : `0 4px 22px ${theme.glowSoft}` }}>
          {lang === 'ka' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>
    </div>
  );
}
