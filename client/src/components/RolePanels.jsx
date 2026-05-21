import { useState, useEffect, useRef } from 'react';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TH = {
  teacher: { border: 'border-[#e5e7eb]', hdr: 'bg-[#ffffff]', accent: 'text-[#2563eb]', btn: 'bg-[#2563eb] hover:bg-[#1d4ed8]', ring: 'focus:ring-[#3b82f6]/20', conf: 'text-[#10b981]' },
  student: { border: 'border-[#e5e7eb]', hdr: 'bg-[#ffffff]', accent: 'text-[#10b981]', btn: 'bg-[#2563eb] hover:bg-[#1d4ed8]', ring: 'focus:ring-[#3b82f6]/20', conf: 'text-[#10b981]' },
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const FIELD = 'w-full rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] px-[14px] py-[10px] text-[14px] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none transition-colors duration-150';

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
  'library':           'Files',
  'knowledge-library': 'Knowledge Library',
};

const GEO_PANEL_TITLES = {
  'invite':            'მოწვევა',
  'schedule':          'განრიგი',
  'schedule-editor':   'განრიგის რედაქტირება',
  'library':           'ფაილები',
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
        style={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '8px 12px', fontSize: '14px', borderRadius: '6px' }}
        className="w-full cursor-pointer focus:outline-none">
        {roleOptions.map(([val, label]) => <option key={val} value={val} style={{ backgroundColor: '#ffffff', color: '#111827' }}>{label}</option>)}
      </select>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={lang === 'GEO' ? 'ელ. ფოსტა' : 'Email address'} className={FIELD} />
      {sentEmail
        ? <p className={`text-[14px] ${th.conf}`}>{lang === 'GEO' ? `✅ მოწვევა გაიგზავნა: ${sentEmail}!` : `✅ Invitation sent to ${sentEmail}!`}</p>
        : errMsg
        ? <p className="text-[14px] text-[#dc2626]">{errMsg}</p>
        : null}
      <button onClick={send} disabled={!email.trim() || sending}
          className={`rounded-[6px] ${th.btn} disabled:opacity-40 px-4 py-2 text-[14px] text-white font-medium transition-colors duration-150`}>
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

  if (loading) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (error)   return <p className="text-[14px] text-[#dc2626] text-center py-4">{error}</p>;
  if (!rows.length) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>;

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
          <div key={key} className="rounded-[8px] border border-[#e5e7eb] overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e5e7eb] bg-[#fafafa]">
              <span className="text-[14px] text-[#111827] font-semibold">{day.label}</span>
            </div>
            <div className="px-3 py-2">
              {sorted.map((r, i) => (
                <div key={r.id ?? i} className="flex items-center gap-2 text-[13px] py-1 border-b border-[#e5e7eb] last:border-0 hover:bg-[#fafafa] transition-colors duration-150">
                  <span className="text-[#6b7280] font-mono w-14 flex-shrink-0">{(r.lesson_time || '').slice(0, 5)}</span>
                  <span className="text-[#111827] flex-1 min-w-0 truncate">{r.class_name}</span>
                  {r.room && <span className="text-[#6b7280] flex-shrink-0">📍 {r.room}</span>}
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

  if (loading) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (error)   return <p className="text-[14px] text-[#dc2626] text-center py-4">{error}</p>;

  const days = lang === 'GEO' ? DAYS_GEO : DAYS_EN;
  const sorted = [...rows].sort((a, b) => {
    const dk = daySortKey(a.day_of_week) - daySortKey(b.day_of_week);
    if (dk !== 0) return dk;
    return String(a.lesson_time || '').localeCompare(String(b.lesson_time || ''));
  });

  return (
    <div className="space-y-2">
      {sorted.length === 0 && (
        <p className="text-[14px] italic text-[#6b7280] text-center py-2">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>
      )}
      {sorted.map(r => (
        <div key={r.id} className="flex items-center gap-2 text-[13px] py-1.5 border-b border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-150">
          <span className="text-[#6b7280] w-20 flex-shrink-0 truncate">{dayLabel(r.day_of_week, lang)}</span>
          <span className="text-[#6b7280] font-mono w-12 flex-shrink-0">{(r.lesson_time || '').slice(0, 5)}</span>
          <span className="text-[#111827] flex-1 min-w-0 truncate">{r.class_name}</span>
          {r.room && <span className="text-[#6b7280] flex-shrink-0">📍 {r.room}</span>}
          <button onClick={() => del(r.id)} className="rounded-[6px] border border-[#fecaca] bg-[#ffffff] text-[#dc2626] hover:bg-[#fef2f2] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">✕</button>
        </div>
      ))}
      {showAdd ? (
        <div className="space-y-2 rounded-[8px] border border-[#e5e7eb] bg-[#fafafa] p-3">
          <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: parseInt(e.target.value, 10) }))}
            style={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '8px 12px', fontSize: '14px', borderRadius: '6px' }}
            className="w-full focus:outline-none">
            {days.map((d, i) => <option key={i} value={i} style={{ backgroundColor: '#ffffff', color: '#111827' }}>{d}</option>)}
          </select>
          <input value={form.lesson_time} onChange={e => setForm(f => ({ ...f, lesson_time: e.target.value }))}
            placeholder={lang === 'GEO' ? 'დრო (მაგ. 16:00)' : 'Time (e.g. 16:00)'} className={`${FIELD} py-1.5 text-[13px]`} />
          <input value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
            placeholder={lang === 'GEO' ? 'კლასი' : 'Class name'} className={`${FIELD} py-1.5 text-[13px]`} />
          <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
            placeholder={lang === 'GEO' ? 'ოთახი' : 'Room'} className={`${FIELD} py-1.5 text-[13px]`} />
          <div className="flex gap-2 items-center">
            <button onClick={addRow} disabled={saving || !form.lesson_time.trim() || !form.class_name.trim()}
              className="rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 px-3 py-1.5 text-[13px] text-white font-medium transition-colors duration-150">
              {lang === 'GEO' ? 'დამატება' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] transition-colors duration-150">
              {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] py-2 text-[13px] text-white font-medium transition-colors duration-150">
          {lang === 'GEO' ? '+ განრიგის დამატება' : '+ Add schedule row'}
        </button>
      )}
    </div>
  );
}

// ─── Library manager panel ────────────────────────────────────────────────────

// Owner-only. Self-contained: lists, uploads and deletes school library files.
function LibraryManagerPanel({ lang }) {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res  = await fetch('/api/library?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setFiles(data.files || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError(lang === 'GEO' ? 'ფაილი უნდა იყოს 25MB-ზე ნაკლები.' : 'File must be under 25MB.');
      return;
    }
    setError('');
    setUploading(true);
    const token = localStorage.getItem('sherlock_token');
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/library/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await load();
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
  }

  async function del(id) {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/library/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Delete failed (${res.status})`); }
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  if (loading) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-2">
      {error && <p className="text-[14px] text-[#dc2626]">{error}</p>}
      {files.length === 0 && !error && (
        <p className="text-[14px] italic text-[#6b7280] text-center py-2">{lang === 'GEO' ? 'ფაილები ჯერ არ არის ატვირთული.' : 'No files uploaded yet.'}</p>
      )}
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-2 text-[13px] py-1.5 border-b border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-150">
          <span className="text-[#111827] flex-1 min-w-0 truncate">{f.name || f.filename || 'Untitled'}</span>
          <span className="text-[#6b7280] font-mono flex-shrink-0">{formatSize(f.file_size)}</span>
          <button onClick={() => del(f.id)} className="rounded-[6px] border border-[#fecaca] bg-[#ffffff] text-[#dc2626] hover:bg-[#fef2f2] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">✕</button>
        </div>
      ))}
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={uploadFile} className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
        className="w-full rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] py-2 text-[13px] text-white font-medium transition-colors duration-150 disabled:opacity-40">
        {uploading ? (lang === 'GEO' ? 'იტვირთება…' : 'Uploading…') : (lang === 'GEO' ? '+ ფაილის ატვირთვა' : '+ Upload File')}
      </button>
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
            className={`px-3 py-1 rounded-full text-[13px] font-medium transition-colors duration-150 ${
              tab === id
                ? 'bg-[#eff6ff] border border-[#3b82f6] text-[#2563eb]'
                : 'border border-[#e5e7eb] bg-[#ffffff] text-[#111827] hover:bg-[#f9fafb]'
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
            className={`flex flex-col items-center justify-center rounded-[8px] border-2 border-dashed px-4 py-5 cursor-pointer transition-colors duration-150 ${
              dragOver ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-[#fafafa] hover:border-[#3b82f6]'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-2xl mb-1.5">{uploading ? '⏳' : '📄'}</span>
            <p className="text-[14px] text-[#111827] font-semibold">
              {uploading
                ? (lang === 'GEO' ? 'დამუშავება...' : 'Processing…')
                : (lang === 'GEO' ? 'ატვირთე ბიბლიოთეკაში' : 'Upload to demo library')}
            </p>
            <p className="text-[13px] text-[#6b7280] mt-1 text-center leading-relaxed">
              {lang === 'GEO'
                ? `აქ შეგიძლია ატვირთო სასწავლო მასალა შენი სკოლისთვის · ხელმისაწვდომია "${orgNameGenitive || 'დაწესებულების'}" ყველა წევრისთვის`
                : 'Upload study materials for your school · accessible to everyone in your Sherlock environment'}
            </p>
            <p className="text-[13px] text-[#9ca3af] mt-2">
              {lang === 'GEO' ? 'ჩააგდე ან დააჭირე · .pdf .txt .md' : 'Drop here or click · .pdf .txt .md'}
            </p>
            <input type="file" accept=".pdf,.txt,.md"
              onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }}
              className="hidden" disabled={uploading} />
          </label>
          {status && (
            <p className={`text-[13px] ${status.startsWith('✅') ? 'text-[#10b981]' : 'text-[#dc2626]'}`}>{status}</p>
          )}
          <div className="space-y-1.5">
            {libraryFiles.length === 0 && !uploading && (
              <p className="text-[14px] italic text-[#6b7280] text-center py-2">
                {lang === 'GEO' ? 'ფაილები არ არის ატვირთული.' : 'No files loaded yet.'}
              </p>
            )}
            {libraryFiles.map(f => (
              <div key={f.id} className="flex items-center gap-2 rounded-[8px] border border-[#e5e7eb] bg-[#ffffff] px-3 py-2 hover:bg-[#fafafa] transition-colors duration-150">
                <span className="text-sm flex-shrink-0">📄</span>
                <p className="text-[13px] text-[#111827] truncate flex-1 min-w-0">{f.filename}</p>
                <button onClick={() => onRemoveFile?.(f.id)}
                  className="rounded-[6px] border border-[#fecaca] bg-[#ffffff] text-[#dc2626] hover:bg-[#fef2f2] text-sm flex-shrink-0 transition-colors duration-150 leading-none px-1.5 py-0.5">🗑</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[13px] text-[#6b7280] font-medium">
            {lang === 'GEO' ? 'შეამოწმე ბიბლიოთეკა' : 'Test your library'}
          </p>
          <div className="h-32 overflow-y-auto rounded-[8px] border border-[#e5e7eb] bg-[#fafafa] p-2 space-y-1.5">
            {previewMsgs.length === 0 && (
              <p className="text-[14px] italic text-[#6b7280] text-center mt-8">
                {lang === 'GEO' ? 'დასვი კითხვა ატვირთული კონტენტის შესახებ' : 'Ask a question about your uploaded content'}
              </p>
            )}
            {previewMsgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-2.5 py-1.5 rounded-[8px] text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#2563eb] text-white rounded-br-sm'
                    : 'bg-[#ffffff] border border-[#e5e7eb] text-[#111827] rounded-bl-sm'
                }`}>{m.content}</div>
              </div>
            ))}
            {previewLoading && (
              <div className="flex justify-start">
                <div className="px-2.5 py-1.5 rounded-[8px] text-[13px] bg-[#ffffff] border border-[#e5e7eb] text-[#6b7280] animate-pulse">
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
              className={`${FIELD} py-1.5 flex-1 text-[13px]`}
            />
            <button type="submit" disabled={!previewInput.trim() || previewLoading}
              className={`rounded-[6px] ${th.btn} disabled:opacity-40 px-3 py-1.5 text-[13px] text-white font-medium transition-colors duration-150 flex-shrink-0`}>
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
    case 'library':           return <LibraryManagerPanel lang={lang} />;
    case 'knowledge-library': return <KnowledgeLibraryPanel role={role} lang={lang} {...(libraryProps ?? {})} />;
    default:                  return null;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const PANEL_ACTIVE_CLS = {
  teacher: 'bg-[#eff6ff] text-[#2563eb] border border-[#3b82f6]',
  student: 'bg-[#eff6ff] text-[#2563eb] border border-[#3b82f6]',
};

export function RolePanel({ role, panel, onClose, libraryProps, lang = 'EN' }) {
  const orgName = libraryProps?.orgName ?? '';
  const panelTitle = (panel === 'knowledge-library' && lang === 'GEO' && orgName)
    ? `${orgName} ბიბლიოთეკა`
    : getPanelTitle(panel, lang);
  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-[#ffffff] shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e7eb] flex-shrink-0">
        <span className="text-[14px] font-semibold text-[#111827]">{panelTitle}</span>
        <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] transition-colors duration-150 text-sm leading-none">✕</button>
      </div>
      <div key={panel} className="p-4 overflow-y-auto flex-1">
        {panelContent(role, panel, libraryProps, lang)}
      </div>
    </div>
  );
}
