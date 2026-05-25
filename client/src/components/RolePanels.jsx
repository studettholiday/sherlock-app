import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../AuthContext';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TH = {
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
  'students':          'Students',
  'library':           'Files',
  'knowledge-library': 'Knowledge Library',
};

const GEO_PANEL_TITLES = {
  'invite':            'მოწვევა',
  'schedule':          'განრიგი',
  'schedule-editor':   'განრიგის რედაქტირება',
  'students':          'მოსწავლეები',
  'library':           'ფაილები',
  'knowledge-library': 'ცოდნის ბიბლიოთეკა',
};

function getPanelTitle(panel, lang) {
  if (lang === 'GEO') return GEO_PANEL_TITLES[panel] ?? panel;
  return PANEL_TITLES[panel] ?? panel;
}

// ─── Invite panel ─────────────────────────────────────────────────────────────

// Base URL for shareable invite links — whatever domain the app is served from
// (app.sherlock.school in production, localhost in dev).
const INVITE_BASE_URL = window.location.origin;

function InvitePanel({ lang }) {
  const [invites, setInvites]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState('');

  function authHeaders() {
    const token = localStorage.getItem('sherlock_token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function load() {
    try {
      const res  = await fetch('/api/invites', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setInvites(data.invites || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generateInvite() {
    setGenerating(true);
    setError('');
    try {
      const res  = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ target_role: 'student' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate link');
      await load();
    } catch (e) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function revokeInvite(id) {
    try {
      const res = await fetch(`/api/invites/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Revoke failed (${res.status})`); }
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  function copyLink(url, key) {
    navigator.clipboard.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return <p className="text-[14px] text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-3">
      <button onClick={generateInvite} disabled={generating}
        className="w-full rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 px-4 py-2 text-[14px] text-white font-medium transition-colors duration-150">
        {generating
          ? (lang === 'GEO' ? 'იქმნება…' : 'Generating…')
          : (lang === 'GEO' ? 'მოწვევის ბმულის შექმნა' : 'Generate Invite Link')}
      </button>

      {error && <p className="text-[14px] text-[#dc2626]">{error}</p>}

      {invites.length === 0 ? (
        <p className="text-[14px] text-[#6b7280] italic text-center py-4">
          {lang === 'GEO' ? 'აქტიური მოწვევის ბმულები არ არის.' : 'No active invite links.'}
        </p>
      ) : (
        <div className="space-y-2">
          {invites.map(inv => {
            const url     = `${INVITE_BASE_URL}/join?code=${inv.code}`;
            const expired = new Date(inv.expires_at) < new Date();
            const used    = !!inv.used_at;
            const statusColor = used ? '#6b7280' : expired ? '#dc2626' : '#10b981';
            const statusBg    = used ? '#f3f4f6' : expired ? '#fef2f2' : '#ecfdf5';
            const statusText  = used
              ? (lang === 'GEO' ? 'გამოყენებული' : 'Used')
              : expired
              ? (lang === 'GEO' ? 'ვადაგასული' : 'Expired')
              : (lang === 'GEO' ? 'აქტიური' : 'Active');
            const copiedThis = copied === `inv-${inv.id}`;
            return (
              <div key={inv.id} className="rounded-[8px] border border-[#e5e7eb] p-3 space-y-2"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-end flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#6b7280]">{new Date(inv.expires_at).toLocaleDateString()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, padding: '3px 10px', borderRadius: 20, background: statusBg, border: `1px solid ${statusColor}` }}>
                      {statusText}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => copyLink(url, `inv-${inv.id}`)}
                    className="flex-1 min-w-[120px] rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150"
                    style={{
                      border: `1px solid ${copiedThis ? '#3b82f6' : '#e5e7eb'}`,
                      background: copiedThis ? '#eff6ff' : '#ffffff',
                      color: copiedThis ? '#2563eb' : '#111827',
                    }}>
                    {copiedThis
                      ? (lang === 'GEO' ? '✓ დაკოპირდა' : '✓ Copied')
                      : (lang === 'GEO' ? '📋 ბმულის კოპირება' : '📋 Copy Link')}
                  </button>
                  <button onClick={() => revokeInvite(inv.id)}
                    className="rounded-[6px] px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[#fef2f2]"
                    style={{ background: '#ffffff', border: '1px solid #fecaca', color: '#dc2626' }}>
                    {lang === 'GEO' ? 'გაუქმება' : 'Revoke'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  // Inline-edit state for existing rows. Only one row can be edited at a time;
  // clicking ✏️ on a different row implicitly cancels the current edit (single
  // editingId — assigning a new id discards any in-progress changes).
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({ day_of_week: 0, lesson_time: '', room: '' });
  const [editError, setEditError]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({
      day_of_week: parseInt(r.day_of_week, 10) || 0,
      lesson_time: (r.lesson_time || '').slice(0, 5),
      room: r.room || '',
    });
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  async function saveEdit(r) {
    setEditSaving(true);
    setEditError('');
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/school/schedule/${r.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: editForm.day_of_week,
          lesson_time: editForm.lesson_time.trim(),
          room: editForm.room.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setEditingId(null);
      await load();
    } catch (e) {
      setEditError(e.message);
    }
    setEditSaving(false);
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
        <Fragment key={r.id}>
          <div className="flex items-center gap-2 text-[13px] py-1.5 border-b border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-150">
            {editingId === r.id ? (
              <>
                <select value={editForm.day_of_week}
                  onChange={e => setEditForm(f => ({ ...f, day_of_week: parseInt(e.target.value, 10) }))}
                  style={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '4px 8px', fontSize: '13px', borderRadius: '6px' }}
                  className="w-24 flex-shrink-0 focus:outline-none">
                  {days.map((d, i) => <option key={i} value={i} style={{ backgroundColor: '#ffffff', color: '#111827' }}>{d}</option>)}
                </select>
                <input value={editForm.lesson_time}
                  onChange={e => setEditForm(f => ({ ...f, lesson_time: e.target.value }))}
                  placeholder="HH:MM"
                  className="w-16 flex-shrink-0 rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] text-[#111827] text-[13px] font-mono px-2 py-1 focus:outline-none focus:border-[#3b82f6]" />
                <span className="text-[#6b7280] flex-1 min-w-0 truncate">{r.class_name}</span>
                <input value={editForm.room}
                  onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))}
                  placeholder={lang === 'GEO' ? 'ოთახი' : 'Room'}
                  className="w-20 flex-shrink-0 rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] text-[#111827] text-[13px] px-2 py-1 focus:outline-none focus:border-[#3b82f6]" />
                <button onClick={() => saveEdit(r)} disabled={editSaving}
                  className="rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 px-2 py-1 text-[12px] text-white font-medium flex-shrink-0 transition-colors duration-150">
                  {editSaving ? (lang === 'GEO' ? 'ინახება…' : 'Saving…') : (lang === 'GEO' ? 'შენახვა' : 'Save')}
                </button>
                <button onClick={cancelEdit}
                  className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] px-2 py-1 text-[12px] text-[#111827] flex-shrink-0 transition-colors duration-150">
                  {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
                </button>
              </>
            ) : (
              <>
                <span className="text-[#6b7280] w-20 flex-shrink-0 truncate">{dayLabel(r.day_of_week, lang)}</span>
                <span className="text-[#6b7280] font-mono w-12 flex-shrink-0">{(r.lesson_time || '').slice(0, 5)}</span>
                <span className="text-[#111827] flex-1 min-w-0 truncate">{r.class_name}</span>
                {r.room && <span className="text-[#6b7280] flex-shrink-0">📍 {r.room}</span>}
                <button onClick={() => startEdit(r)}
                  title={lang === 'GEO' ? 'რედაქტირება' : 'Edit'}
                  className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] text-[#6b7280] hover:bg-[#f9fafb] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">✏️</button>
                <button onClick={() => del(r.id)} className="rounded-[6px] border border-[#fecaca] bg-[#ffffff] text-[#dc2626] hover:bg-[#fef2f2] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">✕</button>
              </>
            )}
          </div>
          {editingId === r.id && editError && (
            <p className="text-[#dc2626] text-[12px] pl-2 pb-1">{editError}</p>
          )}
        </Fragment>
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
function LibraryOwnerPanel({ lang }) {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const fileInputRef = useRef(null);

  // Per-class access tagging state. Only one file can be edited at a time.
  const [availableClasses, setAvailableClasses] = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [editPicked, setEditPicked] = useState([]);
  const [editError, setEditError]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const [fRes, cRes] = await Promise.all([
        fetch('/api/library?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/school/classes',          { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fData = await fRes.json();
      if (!fRes.ok) throw new Error(fData.error || `Request failed (${fRes.status})`);
      setFiles(fData.files || []);
      if (cRes.ok) {
        const cData = await cRes.json();
        setAvailableClasses(cData.classes || []);
      }
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

  async function downloadFile(f) {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/library/download/${f.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.filename || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  }

  function startEditAccess(f) {
    setEditingId(f.id);
    setEditPicked(f.classes || []);
    setEditError('');
  }

  function cancelEditAccess() {
    setEditingId(null);
    setEditError('');
  }

  function toggleClass(className) {
    setEditPicked(prev => prev.includes(className)
      ? prev.filter(c => c !== className)
      : [...prev, className]);
  }

  async function saveEditAccess(f) {
    setEditSaving(true);
    setEditError('');
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/library/${f.id}/classes`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: editPicked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setFiles(prev => prev.map(x => x.id === f.id ? { ...x, classes: data.classes || [] } : x));
      setEditingId(null);
    } catch (e) {
      setEditError(e.message);
    }
    setEditSaving(false);
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
        <Fragment key={f.id}>
          <div className="flex items-center gap-2 text-[13px] py-1.5 border-b border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-150">
            {f.mime_type === 'application/pdf' ? (
              <button onClick={() => setViewingFile(f)}
                title={lang === 'GEO' ? 'ნახვა' : 'View'}
                className="text-[#111827] hover:text-[#2563eb] hover:underline cursor-pointer flex-shrink-0 truncate max-w-[35%] text-left bg-transparent border-0 p-0 transition-colors duration-150">
                {f.name || f.filename || 'Untitled'}
              </button>
            ) : (
              <span className="text-[#111827] flex-shrink-0 truncate max-w-[35%]">{f.name || f.filename || 'Untitled'}</span>
            )}
            <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
              {(f.classes || []).length === 0 ? (
                <span className="text-[12px] italic text-[#9ca3af]">{lang === 'GEO' ? 'ხელმისაწვდომი ყველასთვის' : 'Visible to all'}</span>
              ) : (
                (f.classes || []).map(c => (
                  <span key={c} className="text-[12px] rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-2 py-0.5">{c}</span>
                ))
              )}
            </div>
            <span className="text-[#6b7280] font-mono flex-shrink-0">{formatSize(f.file_size)}</span>
            <button onClick={() => editingId === f.id ? cancelEditAccess() : startEditAccess(f)}
              title={lang === 'GEO' ? 'წვდომის რედაქტირება' : 'Edit access'}
              className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] text-[#6b7280] hover:bg-[#f9fafb] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">🏷️</button>
            <button onClick={() => downloadFile(f)}
              title={lang === 'GEO' ? 'ჩამოტვირთვა' : 'Download'}
              className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] text-[#6b7280] hover:bg-[#f9fafb] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">⬇️</button>
            <button onClick={() => del(f.id)} className="rounded-[6px] border border-[#fecaca] bg-[#ffffff] text-[#dc2626] hover:bg-[#fef2f2] flex-shrink-0 px-1.5 leading-none transition-colors duration-150">✕</button>
          </div>
          {editingId === f.id && (
            <div className="rounded-[8px] border border-[#e5e7eb] bg-[#fafafa] p-3 space-y-2">
              {availableClasses.length === 0 ? (
                <p className="text-[13px] italic text-[#6b7280] text-center py-1">
                  {lang === 'GEO'
                    ? 'განრიგში კლასები ჯერ არ არის — ჯერ დაამატე განრიგი, შემდეგ მონიშნე.'
                    : 'No classes in the schedule yet — add some, then tag files.'}
                </p>
              ) : (
                <div className="space-y-1">
                  {availableClasses.map(c => (
                    <label key={c} className="flex items-center gap-2 text-[13px] text-[#111827] py-0.5 cursor-pointer">
                      <input type="checkbox" checked={editPicked.includes(c)} onChange={() => toggleClass(c)}
                        className="w-4 h-4 accent-[#2563eb] flex-shrink-0" />
                      <span className="truncate">{c}</span>
                    </label>
                  ))}
                </div>
              )}
              {editError && <p className="text-[#dc2626] text-[12px]">{editError}</p>}
              <div className="flex gap-2 items-center">
                <button onClick={() => saveEditAccess(f)} disabled={editSaving}
                  className="rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 px-3 py-1.5 text-[13px] text-white font-medium transition-colors duration-150">
                  {editSaving ? (lang === 'GEO' ? 'ინახება…' : 'Saving…') : (lang === 'GEO' ? 'შენახვა' : 'Save')}
                </button>
                <button onClick={cancelEditAccess}
                  className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] transition-colors duration-150">
                  {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
                </button>
                {editPicked.length === 0 && (
                  <span className="text-[12px] italic text-[#6b7280] ml-auto">
                    {lang === 'GEO' ? '(ცარიელი = საჯარო)' : '(empty = public)'}
                  </span>
                )}
              </div>
            </div>
          )}
        </Fragment>
      ))}
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={uploadFile} className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
        className="w-full rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] py-2 text-[13px] text-white font-medium transition-colors duration-150 disabled:opacity-40">
        {uploading ? (lang === 'GEO' ? 'იტვირთება…' : 'Uploading…') : (lang === 'GEO' ? '+ ფაილის ატვირთვა' : '+ Upload File')}
      </button>
      {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}

// ─── File viewer (PDF + image, view-only with watermark) ─────────────────────

// Lazy-load PDF.js 4.x ESM from cdnjs on first PDF open. The /* @vite-ignore */
// pragma tells Vite to leave the runtime URL alone so the browser performs a
// native dynamic ESM import. Cached on window so subsequent opens reuse it.
async function loadPdfJsV4() {
  if (window.pdfjsLibV4) return window.pdfjsLibV4;
  const mod = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
  mod.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
  window.pdfjsLibV4 = mod;
  return mod;
}

// Bake a repeating diagonal watermark into a canvas context. Because the
// watermark is drawn into the pixel data, it survives DevTools `canvas.toDataURL()`
// exfiltration and browser print — the resulting bytes always carry the mark.
// Deterrent + provenance, not DRM.
function drawWatermark(ctx, w, h, text) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-30 * Math.PI / 180);
  const spanX = 280;
  const spanY = 80;
  const reach = Math.ceil(Math.max(w, h) / 2 / Math.min(spanX, spanY)) + 2;
  for (let y = -reach * spanY; y <= reach * spanY; y += spanY) {
    for (let x = -reach * spanX; x <= reach * spanX; x += spanX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

function FileViewerModal({ file, onClose }) {
  const { user } = useAuth();
  const watermarkText = `${user?.name || user?.email || 'viewer'} — ${user?.email || ''}`;
  const isPdf = file?.mime_type === 'application/pdf';

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [pdfDoc, setPdfDoc]   = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pdfScale, setPdfScale]   = useState(null);
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput]     = useState('');
  // Pinch-zoom: CSS scale applied to the canvas during a gesture for smooth
  // GPU-accelerated visual feedback. Resets to 1 on touchend after pdfScale
  // is committed and PDF.js re-renders at the new resolution.
  const [pinchTransform, setPinchTransform] = useState(1);
  const canvasRef = useRef(null);
  // Set by the Escape handler so the unmount-blur doesn't accidentally commit
  // the typed value. Checked-and-cleared in commitPageInput.
  const cancelPageEditRef = useRef(false);
  // Pinch tracking — refs (not state) because touchmove fires synchronously
  // up to ~60×/sec and React state would cause stale-closure bugs.
  const isPinchingRef   = useRef(false);
  const pinchInitialRef = useRef({ distance: 0, scale: 1 });
  const pinchTargetRef  = useRef(1);

  // ESC closes the modal, EXCEPT while the page-edit input is open — in that
  // case let the input's own onKeyDown handle the cancel. The dep on
  // editingPage ensures we always evaluate the latest value.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (editingPage) return;
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editingPage]);

  // Fetch the PDF bytes once with the bearer token and hand the arrayBuffer
  // to PDF.js. (Image support was removed — PDFs only.)
  useEffect(() => {
    if (!file?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('sherlock_token');
        const res = await fetch(`/api/library/${file.id}/view`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Couldn't load file (${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        if (isPdf) {
          const buf = await blob.arrayBuffer();
          if (cancelled) return;
          const pdfjsLib = await loadPdfJsV4();
          if (cancelled) return;
          const doc = await pdfjsLib.getDocument({ data: buf }).promise;
          if (cancelled) return;
          // Compute default fit-to-width scale from page 1 once. The user can
          // override via the slider, and the choice persists across pages.
          const firstPage = await doc.getPage(1);
          if (cancelled) return;
          const baseViewport = firstPage.getViewport({ scale: 1 });
          const maxWidth = Math.min(window.innerWidth - 80, 1100);
          const fitScale = Math.min(2, maxWidth / baseViewport.width);
          setPdfDoc(doc);
          setPageCount(doc.numPages);
          setPageNum(1);
          setPdfScale(fitScale);
          setLoading(false);
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Couldn't load viewer");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file?.id, isPdf]);

  // Render the current PDF page to canvas at the user-controlled scale, then
  // bake the watermark. Re-runs on page change or zoom change.
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !pdfScale) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        drawWatermark(ctx, canvas.width, canvas.height, watermarkText);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Render failed');
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, pdfScale, watermarkText]);

  // Pinch-to-zoom on the PDF canvas (touch devices only). React's synthetic
  // onTouchMove is passive — preventDefault is a no-op there. We use native
  // addEventListener with passive: false on touchmove so the browser's
  // default page-zoom gesture is suppressed for 2-finger pinches.
  //
  // During the gesture: apply CSS transform: scale to the canvas — smooth
  // GPU-accelerated visual feedback, no PDF.js re-render mid-pinch.
  // On touchend: commit the final scale to pdfScale (triggers a fresh PDF.js
  // render at the new resolution for sharp output) and reset the CSS scale.
  //
  // Single-finger touches are left alone so native scrolling still works.
  useEffect(() => {
    if (!isPdf) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function dist(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onStart(e) {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        pinchInitialRef.current = {
          distance: dist(e.touches),
          scale: pdfScale || 1,
        };
        pinchTargetRef.current = pdfScale || 1;
      }
    }

    function onMove(e) {
      if (!isPinchingRef.current || e.touches.length !== 2) return;
      e.preventDefault();
      const newDist = dist(e.touches);
      const ratio = newDist / pinchInitialRef.current.distance;
      const target = Math.max(0.5, Math.min(3, pinchInitialRef.current.scale * ratio));
      pinchTargetRef.current = target;
      setPinchTransform(target / pinchInitialRef.current.scale);
    }

    function onEnd(e) {
      if (!isPinchingRef.current) return;
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        const finalScale = pinchTargetRef.current;
        setPinchTransform(1);
        if (finalScale !== pdfScale) {
          setPdfScale(finalScale);
        }
      }
    }

    canvas.addEventListener('touchstart',  onStart, { passive: true });
    canvas.addEventListener('touchmove',   onMove,  { passive: false });
    canvas.addEventListener('touchend',    onEnd,   { passive: true });
    canvas.addEventListener('touchcancel', onEnd,   { passive: true });

    return () => {
      canvas.removeEventListener('touchstart',  onStart);
      canvas.removeEventListener('touchmove',   onMove);
      canvas.removeEventListener('touchend',    onEnd);
      canvas.removeEventListener('touchcancel', onEnd);
    };
  }, [isPdf, pdfScale]);

  function commitPageInput() {
    // Escape sets the cancel flag; consume it and bail without changing pageNum.
    if (cancelPageEditRef.current) {
      cancelPageEditRef.current = false;
      return;
    }
    const n = parseInt(pageInput, 10);
    if (Number.isFinite(n)) {
      const clamped = Math.max(1, Math.min(pageCount, n));
      setPageNum(clamped);
    }
    setEditingPage(false);
  }

  const blockContext = (e) => e.preventDefault();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
      onContextMenu={blockContext}
    >
      <div
        className="relative bg-[#ffffff] rounded-[12px] max-w-[100vw] max-h-[100vh] overflow-auto shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={blockContext}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 z-10 text-[#6b7280] hover:text-[#111827] text-xl leading-none px-2 py-0.5"
        >✕</button>

        <div className="p-4 pt-8">
          {loading && (
            <p className="text-[14px] italic text-[#6b7280] text-center py-8 min-w-[280px]">Loading…</p>
          )}
          {error && (
            <p className="text-[14px] text-[#dc2626] text-center py-8 min-w-[280px]">{error}</p>
          )}
          {!loading && !error && isPdf && pdfDoc && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-[13px] flex-wrap">
                <button onClick={() => setPageNum(n => Math.max(1, n - 1))} disabled={pageNum <= 1}
                  className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] disabled:opacity-40 px-2 py-1 text-[#111827] transition-colors duration-150">Prev</button>
                {editingPage ? (
                  <span className="text-[#6b7280] font-mono inline-flex items-center gap-1">
                    <span>Page</span>
                    <input type="number" min="1" max={pageCount}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitPageInput();
                        else if (e.key === 'Escape') {
                          cancelPageEditRef.current = true;
                          setEditingPage(false);
                        }
                      }}
                      onBlur={commitPageInput}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      className="w-14 text-center font-mono bg-[#ffffff] border border-[#e5e7eb] rounded-[6px] px-1 py-0.5 text-[13px] text-[#111827] focus:outline-none focus:border-[#3b82f6]" />
                    <span>of {pageCount}</span>
                  </span>
                ) : (
                  <button type="button"
                    onClick={() => { setPageInput(String(pageNum)); setEditingPage(true); }}
                    title="Jump to page"
                    className="text-[#6b7280] font-mono hover:text-[#2563eb] hover:underline cursor-pointer bg-transparent border-0 p-0 transition-colors duration-150">
                    Page {pageNum} of {pageCount}
                  </button>
                )}
                <button onClick={() => setPageNum(n => Math.min(pageCount, n + 1))} disabled={pageNum >= pageCount}
                  className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] disabled:opacity-40 px-2 py-1 text-[#111827] transition-colors duration-150">Next</button>
                <input type="range" min="0.5" max="3" step="0.1"
                  value={pdfScale || 1}
                  onChange={(e) => setPdfScale(parseFloat(e.target.value))}
                  className="accent-[#2563eb] w-32"
                  title="Zoom" />
                <span className="text-[#6b7280] font-mono w-12 text-right">{Math.round((pdfScale || 1) * 100)}%</span>
              </div>
              <canvas
                ref={canvasRef}
                onContextMenu={blockContext}
                className="block mx-auto"
                style={{
                  transform: `scale(${pinchTransform})`,
                  transformOrigin: 'center center',
                  transition: 'none',
                  touchAction: 'pan-x pan-y',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Library: student panel (view-only) ───────────────────────────────────────

function LibraryStudentPanel({ lang }) {
  const [files, setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [viewingFile, setViewingFile] = useState(null);

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

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  function formatDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(); } catch { return ''; }
  }

  const blockContext = (e) => e.preventDefault();

  if (loading) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-2" onContextMenu={blockContext}>
      {error && <p className="text-[14px] text-[#dc2626]">{error}</p>}
      {files.length === 0 && !error && (
        <p className="text-[14px] italic text-[#6b7280] text-center py-2">
          {lang === 'GEO' ? 'მასალები ჯერ არ არის ხელმისაწვდომი.' : 'No materials available yet.'}
        </p>
      )}
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-2 text-[13px] py-1.5 border-b border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-150"
          onContextMenu={blockContext}>
          <button onClick={() => setViewingFile(f)}
            title={lang === 'GEO' ? 'ნახვა' : 'View'}
            className="text-[#111827] hover:text-[#2563eb] hover:underline cursor-pointer flex-shrink-0 truncate max-w-[35%] text-left bg-transparent border-0 p-0 transition-colors duration-150">
            {f.filename || 'Untitled'}
          </button>
          <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
            {(f.classes || []).map(c => (
              <span key={c} className="text-[12px] rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-2 py-0.5">{c}</span>
            ))}
          </div>
          <span className="text-[#6b7280] font-mono flex-shrink-0">{formatSize(f.file_size)}</span>
          <span className="text-[#9ca3af] flex-shrink-0">{formatDate(f.created_at)}</span>
        </div>
      ))}
      {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}

// Library panel router — owner gets the manager, student gets the view-only.
function LibraryPanelDispatch({ lang }) {
  const { user } = useAuth();
  return user?.is_owner
    ? <LibraryOwnerPanel lang={lang} />
    : <LibraryStudentPanel lang={lang} />;
}

// ─── Knowledge Library panel ──────────────────────────────────────────────────

function KnowledgeLibraryPanel({ role, lang, orgName, orgNameGenitive, libraryFiles = [], onAddFile, onRemoveFile }) {
  const th = TH[role] ?? TH.student;
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

// ─── Students panel (owner only) ──────────────────────────────────────────────

// Owner-only. Lists every student in the school and lets the owner assign each
// one to classes that exist in the schedule (fetched from /api/school/classes).
function StudentsPanel({ lang }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editing, setEditing]   = useState(null);   // student under edit, or null
  const [picked, setPicked]     = useState([]);     // class_names checked in edit view
  const [saving, setSaving]     = useState(false);

  function authHeaders() {
    const token = localStorage.getItem('sherlock_token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function load() {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/school/students', { headers: authHeaders() }),
        fetch('/api/school/classes',  { headers: authHeaders() }),
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      if (!sRes.ok) throw new Error(sData.error || `Request failed (${sRes.status})`);
      if (!cRes.ok) throw new Error(cData.error || `Request failed (${cRes.status})`);
      setStudents(sData.students || []);
      setClasses(cData.classes || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(student) {
    setEditing(student);
    setPicked(student.classes || []);
    setError('');
  }

  function toggle(className) {
    setPicked(prev => prev.includes(className)
      ? prev.filter(c => c !== className)
      : [...prev, className]);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/school/students/${editing.id}/classes`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ classes: picked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setStudents(prev => prev.map(s =>
        s.id === editing.id ? { ...s, classes: data.classes || [] } : s));
      setEditing(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  const noClassesMsg = lang === 'GEO'
    ? 'ჯერ დაამატე კლასები განრიგში, შემდეგ დაბრუნდი აქ მოსწავლეების მისამაგრებლად.'
    : 'Add classes to the schedule first, then come back here to assign students.';

  if (loading) return <p className="text-[14px] italic text-[#6b7280] text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  // Edit view ────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-[14px] font-semibold text-[#111827] truncate">{editing.name || editing.email}</p>
          <p className="text-[13px] text-[#6b7280] truncate">{editing.email}</p>
        </div>
        {error && <p className="text-[14px] text-[#dc2626]">{error}</p>}
        {classes.length === 0 ? (
          <p className="text-[14px] italic text-[#6b7280] text-center py-2">{noClassesMsg}</p>
        ) : (
          <div className="space-y-1">
            {classes.map(c => (
              <label key={c} className="flex items-center gap-2 text-[14px] text-[#111827] py-1 cursor-pointer">
                <input type="checkbox" checked={picked.includes(c)} onChange={() => toggle(c)}
                  className="w-4 h-4 accent-[#2563eb] flex-shrink-0" />
                <span className="truncate">{c}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="rounded-[6px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 px-3 py-1.5 text-[13px] text-white font-medium transition-colors duration-150">
            {saving ? (lang === 'GEO' ? 'ინახება…' : 'Saving…') : (lang === 'GEO' ? 'შენახვა' : 'Save')}
          </button>
          <button onClick={() => { setEditing(null); setError(''); }}
            className="rounded-[6px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] px-3 py-1.5 text-[13px] text-[#111827] transition-colors duration-150">
            {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {error && <p className="text-[14px] text-[#dc2626]">{error}</p>}
      {classes.length === 0 && (
        <p className="text-[14px] italic text-[#6b7280] text-center py-2">{noClassesMsg}</p>
      )}
      {students.length === 0 ? (
        <p className="text-[14px] italic text-[#6b7280] text-center py-2">
          {lang === 'GEO' ? 'მოსწავლეები ჯერ არ არიან.' : 'No students yet.'}
        </p>
      ) : (
        students.map(s => (
          <button key={s.id} onClick={() => startEdit(s)}
            className="w-full text-left rounded-[8px] border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#fafafa] px-3 py-2 transition-colors duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-medium text-[#111827] truncate">{s.name || s.email}</span>
              <span className="text-[13px] text-[#9ca3af] flex-shrink-0">{lang === 'GEO' ? 'რედაქტირება' : 'Edit'}</span>
            </div>
            <p className="text-[13px] text-[#6b7280] truncate">{s.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(s.classes || []).length === 0 ? (
                <span className="text-[12px] italic text-[#9ca3af]">{lang === 'GEO' ? 'კლასები მიუმაგრებელია' : 'No classes assigned'}</span>
              ) : (
                s.classes.map(c => (
                  <span key={c} className="text-[12px] rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-2 py-0.5">{c}</span>
                ))
              )}
            </div>
          </button>
        ))
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
    case 'students':          return <StudentsPanel lang={lang} />;
    case 'library':           return <LibraryPanelDispatch lang={lang} />;
    case 'knowledge-library': return <KnowledgeLibraryPanel role={role} lang={lang} {...(libraryProps ?? {})} />;
    default:                  return null;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const PANEL_ACTIVE_CLS = {
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
