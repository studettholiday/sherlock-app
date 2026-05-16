import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ReactMarkdown from 'react-markdown';

const THEMES = {
  admin:     { avatar: 'linear-gradient(135deg,#7c3aed,#4f46e5)', userBubble: 'linear-gradient(135deg,#6d28d9,#4338ca)', send: '#7c3aed', ring: '0 0 0 2px rgba(124,58,237,0.4)' },
  assistant: { avatar: 'linear-gradient(135deg,#ea580c,#c2410c)', userBubble: 'linear-gradient(135deg,#ea580c,#9a3412)', send: '#ea580c', ring: '0 0 0 2px rgba(234,88,12,0.4)' },
  teacher:   { avatar: 'linear-gradient(135deg,#2563eb,#1d4ed8)', userBubble: 'linear-gradient(135deg,#2563eb,#1e40af)', send: '#2563eb', ring: '0 0 0 2px rgba(37,99,235,0.4)' },
  student:   { avatar: 'linear-gradient(135deg,#059669,#047857)', userBubble: 'linear-gradient(135deg,#059669,#065f46)', send: '#059669', ring: '0 0 0 2px rgba(5,150,105,0.4)' },
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)', display: 'flex', flexDirection: 'column', color: 'white' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${theme.send}22, transparent)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,15,0.6)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, flexShrink: 0 }}>S</div>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Sherlock</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>{user?.schoolName}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {role === 'admin' && MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
              style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m.id ? theme.send : 'transparent',
                borderColor: mode === m.id ? theme.send : 'rgba(255,255,255,0.2)',
                color: mode === m.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              {lang === 'ka' ? m.labelKa : m.labelEn}
            </button>
          ))}
          <a href="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            {lang === 'ka' ? '← დაფა' : '← Dashboard'}
          </a>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' }}>S</div>
            )}
            <div style={{
              maxWidth: '72%', padding: '10px 14px', fontSize: 14, lineHeight: 1.6, borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? theme.userBubble : 'rgba(255,255,255,0.07)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              backdropFilter: msg.role === 'assistant' ? 'blur(10px)' : 'none',
            }}>
              {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, flexShrink: 0 }}>S</div>
            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              {lang === 'ka' ? 'ფიქრობს...' : 'Thinking…'}
            </div>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, padding: 8 }}>{error}</div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ position: 'relative', zIndex: 1, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,15,0.6)', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          placeholder={lang === 'ka' ? 'შეიყვანეთ შეტყობინება...' : 'Type a message…'}
          style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, color: 'white', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 120 }}
        />
        <button type="submit" disabled={loading || !input.trim()}
          style={{ padding: '10px 22px', background: theme.send, border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0, minHeight: 44 }}>
          {lang === 'ka' ? 'გაგზავნა' : 'Send'}
        </button>
      </form>
    </div>
  );
}
