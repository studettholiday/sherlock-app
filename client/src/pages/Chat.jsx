import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ReactMarkdown from 'react-markdown';

const MODES = [
  { id: 'focus', label: 'Focus', desc: 'Library only' },
  { id: 'smart', label: 'Smart', desc: 'Library + general knowledge' },
  { id: 'full',  label: 'Full',  desc: 'Unrestricted' },
];

const ROLE_COLORS = {
  admin:     { bubble: '#7c3aed', send: '#7c3aed' },
  assistant: { bubble: '#ea580c', send: '#ea580c' },
  teacher:   { bubble: '#2563eb', send: '#2563eb' },
  student:   { bubble: '#059669', send: '#059669' },
};

export default function Chat() {
  const { user } = useAuth();
  const token = localStorage.getItem('sherlock_token');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('smart');
  const [error, setError] = useState('');
  const messagesRef = useRef(null);
  const colors = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  useEffect(() => {
    if (user) {
      setMessages([{
        role: 'assistant',
        content: `Hi${user.name ? ' ' + user.name : ''}! I'm Sherlock, your assistant at ${user.schoolName}. How can I help you today?`
      }]);
    }
  }, [user]);

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          mode,
          language: localStorage.getItem('sherlock_lang') === 'ka' ? 'ka' : 'en',
        }),
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
              style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m.id ? colors.bubble : 'transparent',
                borderColor: mode === m.id ? colors.bubble : 'rgba(255,255,255,0.2)',
                color: mode === m.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '10px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? colors.bubble : 'rgba(255,255,255,0.08)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: 'white', fontSize: '14px', lineHeight: '1.5',
            }}>
              {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Thinking…
            </div>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: '#f87171', fontSize: '13px', padding: '8px' }}>{error}</div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          placeholder="Type a message…"
          style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="submit" disabled={loading || !input.trim()}
          style={{ padding: '10px 20px', background: colors.send, border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          Send
        </button>
      </form>
    </div>
  );
}
