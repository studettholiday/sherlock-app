import { useState, useEffect } from 'react';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TH = {
  teacher: { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
  student: { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const FIELD = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 resize-none';

// ─── Day labels ───────────────────────────────────────────────────────────────

const DAYS_EN  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_GEO = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'];

// Resolve a day_of_week value (int 0-6 or a string) to a display label.
function dayLabel(value, lang) {
  const days = lang === 'GEO' ? DAYS_GEO : DAYS_EN;
  if (value == null) return '';
  const idx = typeof value === 'number' ? value : parseInt(value, 10);
  if (!isNaN(idx) && String(value).trim() !== '' && idx >= 0 && idx <= 6) {
    return days[idx];
  }
  // Already a string day name — return as-is.
  return String(value);
}

// Sort key for a day_of_week value (int or string).
function daySortKey(value) {
  if (value == null) return 99;
  const idx = typeof value === 'number' ? value : parseInt(value, 10);
  if (!isNaN(idx) && String(value).trim() !== '') return idx;
  const enIdx = DAYS_EN.findIndex(d => d.toLowerCase() === String(value).toLowerCase());
  if (enIdx !== -1) return enIdx;
  const geoIdx = DAYS_GEO.findIndex(d => d === String(value));
  if (geoIdx !== -1) return geoIdx;
  return 99;
}

// ─── Panel titles ─────────────────────────────────────────────────────────────

const PANEL_TITLES = {
  'invite':            'Invite',
  'schedule':          'Schedule',
  'schedule-editor':   'Edit Schedule',
  'knowledge-library': 'Knowledge Library',
};

const GEO_PANEL_TITLES = {
  'invite':            'მოწვევა',
  'schedule':          'განრიგი',
  'schedule-editor':   'განრიგის რედაქტირება',
  'knowledge-library': 'ცოდნის ბიბლიოთეკა',
};

function getPanelTitle(panel, lang) {
  if (lang === 'GEO') return GEO_PANEL_TITLES[panel] ?? panel;
  return PANEL_TITLES[panel] ?? panel;
}

// ─── Invite panel ─────────────────────────────────────────────────────────────

function InvitePanel({ role, lang }) {
  const th = TH[role] ?? TH.teacher;
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('student');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setSending(true);
    setStatus('');
    try {
      const token = localStorage.getItem('sherlock_token');
      const res = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: targetRole, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('ok:' + email.trim());
      setEmail('');
    } catch (err) {
      setStatus('err:' + err.message);
    } finally {
      setSending(false);
    }
  }

  const sentEmail = status.startsWith('ok:') ? status.slice(3) : '';
  const errMsg    = status.startsWith('err:') ? status.slice(4) : '';

  const roleOptions = lang === 'GEO'
    ? [['student', 'სტუდენტი'], ['teacher', 'მასწავლებელი']]
    : [['student', 'Student'], ['teacher', 'Teacher']];

  return (
    <div className="space-y-3">
      <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
        style={{ colorScheme: 'dark' }} className={`${FIELD} cursor-pointer`}>
        {roleOptions.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={lang === 'GEO' ? 'ელ. ფოსტა' : 'Email address'} className={FIELD} />
      {sentEmail
        ? <p className={`text-sm ${th.conf}`}>{lang === 'GEO' ? `✅ მოწვევა გაიგზავნა: ${sentEmail}!` : `✅ Invitation sent to ${sentEmail}!`}</p>
        : errMsg
        ? <p className="text-sm text-red-400">{errMsg}</p>
        : null}
      <button onClick={send} disabled={!email.trim() || sending}
          className={`rounded-xl ${th.btn} disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors`}>
          {sending
            ? (lang === 'GEO' ? 'იგზავნება...' : 'Sending…')
            : (lang === 'GEO' ? 'მოწვევის გაგზავნა' : 'Send Invitation')}
      </button>
    </div>
  );
}

// ─── Schedule panels ──────────────────────────────────────────────────────────

// Read-only school schedule viewer.
function SchedulePanel({ lang }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRows(d.schedule || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (error)   return <p className="text-xs text-red-400 text-center py-4">{error}</p>;
  if (!rows.length) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>;

  // Group rows by day, sorted Monday → Sunday.
  const byDay = {};
  rows.forEach(r => {
    const key = daySortKey(r.day_of_week);
    if (!byDay[key]) byDay[key] = { label: dayLabel(r.day_of_week, lang), rows: [] };
    byDay[key].rows.push(r);
  });
  const dayKeys = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      {dayKeys.map(key => {
        const day = byDay[key];
        const sorted = [...day.rows].sort((a, b) =>
          String(a.lesson_time || '').localeCompare(String(b.lesson_time || '')));
        return (
          <div key={key} className="rounded-xl border border-white/[0.08] overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-sm text-white font-medium">{day.label}</span>
            </div>
            <div className="px-3 py-2 space-y-1">
              {sorted.map((r, i) => (
                <div key={r.id ?? i} className="flex items-center gap-2 text-xs py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-gray-300 font-mono w-14 flex-shrink-0">{(r.lesson_time || '').slice(0, 5)}</span>
                  <span className="text-white/80 flex-1 min-w-0 truncate">{r.class_name}</span>
                  {r.room && <span className="text-gray-500 flex-shrink-0">📍 {r.room}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Owner-only schedule editor.
function ScheduleEditorPanel({ lang }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ day_of_week: 0, lesson_time: '', class_name: '', room: '' });

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRows(data.schedule || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/schedule/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function addRow() {
    if (!form.lesson_time.trim() || !form.class_name.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/schedule', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: form.day_of_week,
        lesson_time: form.lesson_time.trim(),
        class_name: form.class_name.trim(),
        room: form.room.trim(),
      }),
    });
    setForm({ day_of_week: 0, lesson_time: '', class_name: '', room: '' });
    setShowAdd(false);
    setSaving(false);
    load();
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (error)   return <p className="text-xs text-red-400 text-center py-4">{error}</p>;

  const days = lang === 'GEO' ? DAYS_GEO : DAYS_EN;
  const sorted = [...rows].sort((a, b) => {
    const dk = daySortKey(a.day_of_week) - daySortKey(b.day_of_week);
    if (dk !== 0) return dk;
    return String(a.lesson_time || '').localeCompare(String(b.lesson_time || ''));
  });

  return (
    <div className="space-y-2">
      {sorted.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>
      )}
      {sorted.map(r => (
        <div key={r.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-white/[0.04]">
          <span className="text-gray-400 w-20 flex-shrink-0 truncate">{dayLabel(r.day_of_week, lang)}</span>
          <span className="text-gray-300 font-mono w-12 flex-shrink-0">{(r.lesson_time || '').slice(0, 5)}</span>
          <span className="text-white/80 flex-1 min-w-0 truncate">{r.class_name}</span>
          {r.room && <span className="text-gray-500 flex-shrink-0">📍 {r.room}</span>}
          <button onClick={() => del(r.id)} className="text-gray-600 hover:text-red-400 flex-shrink-0">✕</button>
        </div>
      ))}
      {showAdd ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: parseInt(e.target.value, 10) }))}
            style={{ colorScheme: 'dark' }} className={`${FIELD} py-1.5 text-xs`}>
            {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input value={form.lesson_time} onChange={e => setForm(f => ({ ...f, lesson_time: e.target.value }))}
            placeholder={lang === 'GEO' ? 'დრო (მაგ. 16:00)' : 'Time (e.g. 16:00)'} className={`${FIELD} py-1.5 text-xs`} />
          <input value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
            placeholder={lang === 'GEO' ? 'კლასი' : 'Class name'} className={`${FIELD} py-1.5 text-xs`} />
          <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
            placeholder={lang === 'GEO' ? 'ოთახი' : 'Room'} className={`${FIELD} py-1.5 text-xs`} />
          <div className="flex gap-2">
            <button onClick={addRow} disabled={saving || !form.lesson_time.trim() || !form.class_name.trim()}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-1.5 text-xs text-white">
              {lang === 'GEO' ? 'დამატება' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:text-white">
              {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full rounded-xl border border-dashed border-white/[0.08] py-2 text-xs text-gray-500 hover:text-white transition-colors">
          {lang === 'GEO' ? '+ განრიგის დამატება' : '+ Add schedule row'}
        </button>
      )}
    </div>
  );
}

// ─── Knowledge Library panel ──────────────────────────────────────────────────

function KnowledgeLibraryPanel({ role, lang, orgName, orgNameGenitive, libraryFiles = [], onAddFile, onRemoveFile }) {
  const th = TH[role] ?? TH.teacher;
  const [tab, setTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('');

  const [previewMsgs,    setPreviewMsgs]    = useState([]);
  const [previewInput,   setPreviewInput]   = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

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

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setStatus('');
    try {
      let text = '';
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
          reader.onload = ev => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsText(file);
        });
      }
      if (!text.trim()) {
        throw new Error('No text could be extracted. For PDFs, make sure the file contains selectable text.');
      }
      onAddFile?.(file.name, text);
      setStatus(`✅ "${file.name}" added to library`);
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      setStatus('❌ ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files?.[0]);
  }

  async function sendPreview(e) {
    e?.preventDefault();
    const text = previewInput.trim();
    if (!text || previewLoading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...previewMsgs, userMsg];
    setPreviewMsgs(history);
    setPreviewInput('');
    setPreviewLoading(true);

    const libContext = libraryFiles.length > 0
      ? `SCHOOL KNOWLEDGE LIBRARY:\n\n${libraryFiles.map(f => `=== ${f.filename} ===\n${f.content}`).join('\n\n').slice(0, 10000)}`
      : null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user',      content: '[System context] You are a school knowledge assistant. Answer questions based on the school knowledge library.' },
            { role: 'assistant', content: 'Understood.' },
            ...history,
          ],
          provider: 'anthropic',
          context: libContext,
        }),
      });
      const data = await res.json();
      setPreviewMsgs(prev => [...prev, { role: 'assistant', content: data.message ?? 'No response.' }]);
    } catch {
      setPreviewMsgs(prev => [...prev, { role: 'assistant', content: 'Error: could not reach the server.' }]);
    } finally {
      setPreviewLoading(false);
    }
  }

  const tabs = lang === 'GEO'
    ? [['upload', '⬆️ ატვირთვა'], ['preview', '🔍 გადახედვა']]
    : [['upload', '⬆️ Upload'],    ['preview', '🔍 Preview']];

  return (
    <div className="space-y-3">
      {/* Tab row */}
      <div className="flex gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              tab === id
                ? `${th.btn} text-white`
                : 'border border-white/15 text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <div className="space-y-3">
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors ${
              dragOver ? 'border-white/50 bg-white/[0.07]' : 'border-white/20 hover:border-white/40'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-2xl mb-1.5">{uploading ? '⏳' : '📄'}</span>
            <p className="text-sm text-white font-medium">
              {uploading
                ? (lang === 'GEO' ? 'დამუშავება...' : 'Processing…')
                : (lang === 'GEO' ? 'ატვირთე ბიბლიოთეკაში' : 'Upload to demo library')}
            </p>
            <p className="text-xs text-gray-500 mt-1 text-center leading-relaxed">
              {lang === 'GEO'
                ? `აქ შეგიძლია ატვირთო სასწავლო მასალა შენი სკოლისთვის · ხელმისაწვდომია "${orgNameGenitive || 'დაწესებულების'}" ყველა წევრისთვის`
                : 'Upload study materials for your school · accessible to everyone in your Sherlock environment'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {lang === 'GEO' ? 'ჩააგდე ან დააჭირე · .pdf .txt .md' : 'Drop here or click · .pdf .txt .md'}
            </p>
            <input type="file" accept=".pdf,.txt,.md"
              onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }}
              className="hidden" disabled={uploading} />
          </label>
          {status && (
            <p className={`text-xs ${status.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{status}</p>
          )}
          <div className="space-y-1.5">
            {libraryFiles.length === 0 && !uploading && (
              <p className="text-xs text-gray-600 text-center py-2">
                {lang === 'GEO' ? 'ფაილები არ არის ატვირთული.' : 'No files loaded yet.'}
              </p>
            )}
            {libraryFiles.map(f => (
              <div key={f.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="text-sm flex-shrink-0">📄</span>
                <p className="text-xs text-white truncate flex-1 min-w-0">{f.filename}</p>
                <button onClick={() => onRemoveFile?.(f.id)}
                  className="text-gray-600 hover:text-red-400 text-sm flex-shrink-0 transition-colors leading-none">🗑</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            {lang === 'GEO' ? 'შეამოწმე ბიბლიოთეკა' : 'Test your library'}
          </p>
          <div className="h-32 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2 space-y-1.5">
            {previewMsgs.length === 0 && (
              <p className="text-xs text-gray-600 text-center mt-8">
                {lang === 'GEO' ? 'დასვი კითხვა ატვირთული კონტენტის შესახებ' : 'Ask a question about your uploaded content'}
              </p>
            )}
            {previewMsgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? `${th.btn} text-white rounded-br-sm`
                    : 'bg-white/[0.10] text-gray-200 rounded-bl-sm'
                }`}>{m.content}</div>
              </div>
            ))}
            {previewLoading && (
              <div className="flex justify-start">
                <div className="px-2.5 py-1.5 rounded-xl text-xs bg-white/[0.10] text-gray-500 animate-pulse">
                  {lang === 'GEO' ? 'ფიქრობს...' : 'Thinking…'}
                </div>
              </div>
            )}
          </div>
          <form onSubmit={sendPreview} className="flex gap-2">
            <input
              value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendPreview(e); }}
              placeholder={lang === 'GEO' ? 'კითხვა ბიბლიოთეკიდან...' : 'Ask something from your library...'}
              disabled={previewLoading}
              className={`${FIELD} py-1.5 flex-1 text-xs`}
            />
            <button type="submit" disabled={!previewInput.trim() || previewLoading}
              className={`rounded-xl ${th.btn} disabled:opacity-40 px-3 py-1.5 text-xs text-white font-medium transition-colors flex-shrink-0`}>
              {lang === 'GEO' ? 'გაგზავნა' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Panel router ─────────────────────────────────────────────────────────────

function panelContent(role, panel, libraryProps, lang) {
  switch (panel) {
    case 'invite':            return <InvitePanel role={role} lang={lang} />;
    case 'schedule':          return <SchedulePanel lang={lang} />;
    case 'schedule-editor':   return <ScheduleEditorPanel lang={lang} />;
    case 'knowledge-library': return <KnowledgeLibraryPanel role={role} lang={lang} {...(libraryProps ?? {})} />;
    default:                  return null;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const PANEL_ACTIVE_CLS = {
  teacher: 'bg-white/[0.08] text-white border border-white/20',
  student: 'bg-white/[0.08] text-white border border-white/20',
};

export function RolePanel({ role, panel, onClose, libraryProps, lang = 'EN' }) {
  const orgName = libraryProps?.orgName ?? '';
  const panelTitle = (panel === 'knowledge-library' && lang === 'GEO' && orgName)
    ? `${orgName} ბიბლიოთეკა`
    : getPanelTitle(panel, lang);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a14] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-sm font-medium text-white/80">{panelTitle}</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors text-sm leading-none">✕</button>
      </div>
      <div key={panel} className="p-4 overflow-y-auto flex-1">
        {panelContent(role, panel, libraryProps, lang)}
      </div>
    </div>
  );
}
