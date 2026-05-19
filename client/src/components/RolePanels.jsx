import { useState, useEffect, useRef } from 'react';

// ─── Fake data ────────────────────────────────────────────────────────────────

const INIT_GROUPS = [
  { id: 1, name: 'Guitar Beginners', count: 8 },
  { id: 2, name: 'Guitar Advanced',  count: 5 },
  { id: 3, name: 'Vocals A',         count: 6 },
  { id: 4, name: 'Vocals B',         count: 4 },
  { id: 5, name: 'Band Practice',    count: 5 },
];

const ALL_GROUP_NAMES = INIT_GROUPS.map(g => g.name);

const INIT_STUDENTS = [
  { id: 1, name: 'Ana Beridze',        group: 'Guitar Beginners', status: 'active'  },
  { id: 2, name: 'Giorgi Kasreli',     group: 'Vocals A',         status: 'active'  },
  { id: 3, name: 'Mariam Joria',       group: 'Band Practice',    status: 'active'  },
  { id: 4, name: 'Luka Tvauri',        group: 'Guitar Advanced',  status: 'pending' },
  { id: 5, name: 'Nino Kvaratskhelia', group: 'Vocals B',         status: 'active'  },
  { id: 6, name: 'David Elisashvili',  group: 'Guitar Beginners', status: 'pending' },
];

const INIT_TEACHERS = [
  { id: 1, name: 'Nino Beridze',          subject: 'Guitar' },
  { id: 2, name: 'Giorgi Kvaratskhelia',  subject: 'Vocals' },
  { id: 3, name: 'Lasha Mikhelidze',      subject: 'Band'   },
];

const INIT_SCHEDULE = [
  { id: 1, group: 'Guitar Beginners', day: 'Monday',    time: '16:00', subject: 'Guitar Basics'      },
  { id: 2, group: 'Guitar Beginners', day: 'Wednesday', time: '16:00', subject: 'Guitar Basics'      },
  { id: 3, group: 'Guitar Advanced',  day: 'Tuesday',   time: '17:00', subject: 'Fingerpicking'      },
  { id: 4, group: 'Guitar Advanced',  day: 'Thursday',  time: '17:00', subject: 'Improvisation'      },
  { id: 5, group: 'Vocals A',         day: 'Monday',    time: '18:00', subject: 'Breathing & Pitch'  },
  { id: 6, group: 'Vocals A',         day: 'Friday',    time: '18:00', subject: 'Song Rehearsal'     },
  { id: 7, group: 'Band Practice',    day: 'Saturday',  time: '12:00', subject: 'Full Ensemble'      },
];

const INIT_EVENTS = [
  { id: 1, name: 'End of Year Concert', date: '20 Jun 2025', time: '19:00', place: 'City Concert Hall' },
  { id: 2, name: 'Summer Workshop',     date: '15 Jul 2025', time: '11:00', place: 'Studio Main Hall'  },
  { id: 3, name: 'Open Mic Night',      date: '30 Aug 2025', time: '20:00', place: 'The Music Bar'     },
];

const TEACHER_SCHEDULE = [
  { day: 'Monday',    time: '16:00', group: 'Guitar Beginners' },
  { day: 'Tuesday',   time: '17:00', group: 'Guitar Advanced'  },
  { day: 'Wednesday', time: '16:00', group: 'Guitar Beginners' },
  { day: 'Thursday',  time: '17:00', group: 'Guitar Advanced'  },
  { day: 'Friday',    time: '18:00', group: 'Vocals A'         },
];

const TEACHER_GROUPS = [
  { name: 'Guitar Beginners', count: 8 },
  { name: 'Guitar Advanced',  count: 5 },
  { name: 'Vocals A',         count: 6 },
];

const STUDENT_SCHEDULE = [
  { day: 'Monday',    time: '16:00', subject: 'Guitar Basics' },
  { day: 'Wednesday', time: '16:00', subject: 'Guitar Basics' },
  { day: 'Thursday',  time: '17:00', subject: 'Music Theory'  },
  { day: 'Friday',    time: '18:00', subject: 'Vocals'        },
  { day: 'Saturday',  time: '12:00', subject: 'Band Practice' },
];

const STUDENT_GROUPS          = ALL_GROUP_NAMES.slice(0, 3);
const STUDENT_CURRENT_GROUP   = 'Guitar Beginners';
const STUDENT_ENROLLED        = ['Guitar Basics', 'Music Theory'];
const ALL_SUBJECTS             = ['Guitar Basics', 'Music Theory', 'Vocals', 'Band Practice'];

const INIT_REQUESTS = [
  { id: 1, student: 'Ana K.',    type: 'Change group',   desc: 'Guitar Beginners → Guitar Advanced', status: 'pending' },
  { id: 2, student: 'Giorgi M.', type: 'Add subject',    desc: 'Vocals',                             status: 'pending' },
  { id: 3, student: 'Nino T.',   type: 'Remove subject', desc: 'Band',                               status: 'pending' },
  { id: 4, student: 'Luka B.',   type: 'Change group',   desc: 'Vocals A → Band Practice',           status: 'pending' },
];

const LIBRARY_CATS = [
  { label: 'Beginner Chords', icon: '🎸', desc: 'Am, Em, G, C, D'   },
  { label: 'Advanced Chords', icon: '🎵', desc: 'Bm7, Cmaj7, Dm9…'  },
  { label: 'Beginner Scales', icon: '🎼', desc: 'Pentatonic, Major'  },
  { label: 'Advanced Scales', icon: '🎹', desc: 'Modes, Jazz scales' },
];

const MOODS = ['😤', '😐', '😊', '🔥'];

const GEO_DAYS = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'];

const DEMO_NOTES = [
  { id: 1, text: 'გიტარის აკორდები — C, Am, F, G', date: '12 მაი' },
  { id: 2, text: 'პრაქტიკა: 30 წუთი სკალები',      date: '11 მაი' },
  { id: 3, text: 'დავალება: ბარე აკორდები',          date: '10 მაი' },
  { id: 4, text: 'გაკვეთილი: რიტმი და ტემპი',       date:  '9 მაი' },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TH = {
  admin:     { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
  assistant: { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
  teacher:   { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
  student:   { border: 'border-white/[0.08]', hdr: 'bg-transparent', accent: 'text-white/80', btn: 'bg-violet-600 hover:bg-violet-500', ring: 'focus:ring-violet-500/30', conf: 'text-emerald-400' },
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const FIELD = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 resize-none';
const CELL  = 'w-full bg-transparent text-white text-xs outline-none border-b border-transparent focus:border-white/30 py-0.5';

// ─── Panel titles ─────────────────────────────────────────────────────────────

const PANEL_TITLES = {
  'groups':          'Groups',
  'admin-schedule':  'Schedule',
  'students':        'Students',
  'assistants':      'Assistants',
  'admin-events':    'Events',
  'broadcast':       'Notify',
  'admin-announce':  'Announce',
  'announce':        'Announce',
  'invite':          'Invite',
  'my-schedule':     'My Schedule',
  'my-groups':       'My Groups',
  'schedule':        'My Schedule',
  'events':          'Upcoming Events',
  'library':         'Library',
  'notes':           'Notes',
  'practice-diary':  'Practice Diary',
  'report-absence':  'Report Absence',
  'change-group':    'Change Group',
  'add-subject':     'Add Subject',
  'remove-subject':  'Remove Group',
  'requests':        'Requests',
  'teachers':        'Teachers',
  'subjects':              'Subjects',
  'view-events':           'View Events',
  'add-event':             'Add Event',
  'delete-event':          'Delete Event',
  'report-event-absence':  'Report Event Absence',
  'report-exam-absence':   'Report Exam Absence',
  'share-files':           'Share Files',
  'knowledge-library':     'Knowledge Library',
  'notes-box':             'Notes Box',
  'search':                'Search',
  'labels':                'Labels',
  'ai-use':                'AI Power Settings',
};

const GEO_PANEL_TITLES = {
  'groups':          'ჯგუფები',
  'admin-schedule':  'განრიგი',
  'students':        'სტუდენტები',
  'assistants':      'ასისტენტები',
  'admin-events':    'ღონისძიებები',
  'broadcast':       'განცხადება',
  'admin-announce':  'გამოცხადება',
  'announce':        'გამოცხადება',
  'invite':          'მოწვევა',
  'my-schedule':     'ჩემი განრიგი',
  'my-groups':       'ჩემი ჯგუფები',
  'schedule':        'ჩემი განრიგი',
  'events':          'ახლოს მოახლოებული ღონისძიებები',
  'library':         'ბიბლიოთეკა',
  'notes':           'ჩანაწერები',
  'practice-diary':  'სავარჯიშო დღიური',
  'report-absence':  'გამოუცხადებლობის გაცდენა',
  'change-group':    'ჯგუფის შეცვლა',
  'add-subject':     'საგნის დამატება',
  'remove-subject':  'ჯგუფის წაშლა',
  'requests':        'მოთხოვნები',
  'teachers':        'მასწავლებლები',
  'subjects':              'საგნები',
  'view-events':           'ღონისძიებების ნახვა',
  'add-event':             'ღონისძიების დამატება',
  'delete-event':          'ღონისძიების წაშლა',
  'report-event-absence':  'ღონისძიებაზე გამოუცხადებლობა',
  'report-exam-absence':   'გამოცდაზე გამოუცხადებლობა',
  'share-files':           'ფაილების გაზიარება',
  'knowledge-library':     'ცოდნის ბიბლიოთეკა',
  'notes-box':             'ჩანაწერების ყუთი',
  'search':                'ძებნა',
  'labels':                'ლეიბლები',
  'ai-use':                'AI სიმძლავრის პარამეტრები',
};

function getPanelTitle(panel, lang) {
  if (lang === 'GEO') return GEO_PANEL_TITLES[panel] ?? panel;
  return PANEL_TITLES[panel] ?? panel;
}

// ─── Admin / Assistant panels ─────────────────────────────────────────────────

function GroupsPanel({ role, lang }) {
  const th = TH[role];
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/groups', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setGroups(data.groups || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/groups/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function addGroup() {
    if (!newName.trim()) return;
    setAdding(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/groups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), instrument: '' }),
    });
    setNewName('');
    setShowAdd(false);
    setAdding(false);
    load();
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {groups.map(g => (
          <div key={g.id} className={`rounded-xl border ${th.border} p-3 flex items-center gap-2 min-w-0`}>
            <span className="flex-1 min-w-0 text-xs text-white truncate">{g.name}</span>
            <button
              onClick={() => del(g.id)}
              className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0"
            >✕</button>
          </div>
        ))}
      </div>
      {showAdd ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGroup(); if (e.key === 'Escape') setShowAdd(false); }}
            placeholder={lang === 'GEO' ? 'ჯგუფის სახელი...' : 'Group name…'}
            className={`${FIELD} py-1.5 flex-1`}
          />
          <button onClick={addGroup} disabled={adding || !newName.trim()}
            className={`rounded-xl ${th.btn} disabled:opacity-40 px-3 py-1.5 text-xs text-white`}>
            {lang === 'GEO' ? 'დამატება' : 'Add'}
          </button>
          <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white text-xs px-2">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className={`w-full rounded-xl border border-dashed ${th.border} py-2 text-xs text-gray-500 hover:text-white transition-colors`}
        >{lang === 'GEO' ? '+ ჯგუფის დამატება' : '+ Add Group'}</button>
      )}
    </div>
  );
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function AdminSchedulePanel({ lang }) {
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [form, setForm] = useState({ day: 'Monday', time: '', subject: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    const [schedRes, grpRes] = await Promise.all([
      fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/school/groups',   { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [schedData, grpData] = await Promise.all([schedRes.json(), grpRes.json()]);
    setRows(schedData.schedule || []);
    setGroups(grpData.groups || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/schedule/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function addRow(groupName) {
    if (!form.time.trim() || !form.subject.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/schedule', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groupName, day: form.day, time: form.time, subject: form.subject }),
    });
    setForm({ day: 'Monday', time: '', subject: '' });
    setAddingFor(null);
    setSaving(false);
    load();
  }

  function toggleGroup(gName) {
    setExpanded(prev => prev === gName ? null : gName);
    setAddingFor(null);
    setForm({ day: 'Monday', time: '', subject: '' });
  }

  function openAdd(gName) {
    setAddingFor(gName);
    setForm({ day: 'Monday', time: '', subject: '' });
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-1.5">
      {groups.map(g => {
        const gRows = rows.filter(r => r.group === g.name);
        const isOpen = expanded === g.name;
        return (
          <div key={g.id} className="rounded-xl border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => toggleGroup(g.name)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm text-white font-medium">{g.name}</span>
              <span className="text-xs text-gray-500">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-white/[0.06] px-3 pb-3 pt-2 space-y-1">
                {gRows.length === 0 && (
                  <p className="text-xs text-gray-600 py-1">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>
                )}
                {gRows.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs py-1 border-b border-white/[0.04]">
                    <span className="text-gray-400 w-20 flex-shrink-0">{r.day}</span>
                    <span className="text-gray-300 font-mono w-12 flex-shrink-0">{r.time}</span>
                    <span className="text-white/80 flex-1 min-w-0 truncate">{r.subject}</span>
                    <button onClick={() => del(r.id)} className="text-gray-600 hover:text-red-400 flex-shrink-0">✕</button>
                  </div>
                ))}
                {addingFor === g.name ? (
                  <div className="pt-2 space-y-2">
                    <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                      style={{ colorScheme: 'dark' }} className={`${FIELD} py-1.5 text-xs`}>
                      {WEEK_DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      placeholder={lang === 'GEO' ? 'დრო (მაგ. 16:00)' : 'Time (e.g. 16:00)'} className={`${FIELD} py-1.5 text-xs`} />
                    <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder={lang === 'GEO' ? 'საგანი' : 'Subject'} className={`${FIELD} py-1.5 text-xs`} />
                    <div className="flex gap-2">
                      <button onClick={() => addRow(g.name)} disabled={saving || !form.time.trim() || !form.subject.trim()}
                        className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-1.5 text-xs text-white">
                        {lang === 'GEO' ? 'დამატება' : 'Add'}
                      </button>
                      <button onClick={() => setAddingFor(null)} className="text-xs text-gray-500 hover:text-white">
                        {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => openAdd(g.name)} className="mt-1 text-xs text-gray-500 hover:text-white transition-colors">
                    {lang === 'GEO' ? '+ დროის დამატება' : '+ Add time'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {groups.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'ჯგუფები არ არის.' : 'No groups found.'}</p>
      )}
    </div>
  );
}

function MembersPanel({ role, lang, roleFilter, allMembers, onMembersRefresh }) {
  const th = TH[role];
  const usingProp = allMembers != null;
  const [localMembers, setLocalMembers] = useState([]);
  const [loading, setLoading] = useState(!usingProp);
  const [error, setError]     = useState('');

  const members = usingProp
    ? allMembers.filter(m => m.role === roleFilter)
    : localMembers;

  useEffect(() => {
    if (usingProp) return;
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/members', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setLocalMembers((data.members || []).filter(m => m.role === roleFilter)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [usingProp]);

  async function remove(id, name) {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    const token = localStorage.getItem('sherlock_token');
    const res = await fetch(`/api/school/members/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      if (usingProp) {
        onMembersRefresh?.();
      } else {
        setLocalMembers(prev => prev.filter(m => m.id !== id));
      }
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Delete failed');
    }
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (error)   return <p className="text-xs text-red-400 text-center py-4">{error}</p>;
  if (!members.length) return (
    <p className="text-xs text-gray-500 text-center py-4">
      {lang === 'GEO' ? 'წევრები არ მოიძებნა.' : `No ${roleFilter}s found.`}
    </p>
  );

  return (
    <div className="space-y-1">
      {members.map(m => (
        <div key={m.id} className={`flex items-center gap-2 py-2 border-b ${th.border}`}>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{m.name || '—'}</p>
            <p className="text-xs text-gray-500 truncate">{m.email}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-500/20 text-emerald-400">
            {lang === 'GEO' ? 'აქტიური' : 'active'}
          </span>
          {role === 'admin' && (
            <button
              onClick={() => remove(m.id, m.name || m.email)}
              className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0"
            >✕</button>
          )}
        </div>
      ))}
    </div>
  );
}

const GEO_SCHED_DAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];
const DAYS_GEO = {0:'ორშაბათი',1:'სამშაბათი',2:'ოთხშაბათი',3:'ხუთშაბათი',4:'პარასკევი',5:'შაბათი',6:'კვირა'};

function formatScheduleTimes(times) {
  if (!times || times.length === 0) return '';
  return times.map(t => {
    const [day, ...rest] = t.split(' ');
    const dayIdx = parseInt(day);
    const dayName = !isNaN(dayIdx) ? (GEO_SCHED_DAYS[dayIdx] || day) : day;
    return `${dayName} ${rest.join(' ')}`;
  }).join(' · ');
}

function PendingRegistrationsPanel({ lang }) {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/web-registrations?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || `HTTP ${res.status}`); setLoading(false); return; }
      setRegs(data.registrations || []);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id, status) {
    setActing(id);
    const token = localStorage.getItem('sherlock_token');
    try {
      await fetch(`/api/school/web-registrations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setRegs(prev => prev.filter(r => r.id !== id));
    } catch {}
    setActing(null);
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (err) return (
    <div className="text-center py-4 space-y-2">
      <p className="text-xs text-red-400">Error: {err}</p>
      <button onClick={load} className="text-xs text-violet-400 hover:text-violet-300">Retry</button>
    </div>
  );
  if (!regs.length) return (
    <div className="text-center py-4 space-y-2">
      <p className="text-xs text-gray-500">{lang === 'GEO' ? 'მოლოდინი მოთხოვნები არ არის.' : 'No pending requests.'}</p>
      <button onClick={load} className="text-xs text-violet-400 hover:text-violet-300">↻ {lang === 'GEO' ? 'განახლება' : 'Refresh'}</button>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button onClick={load} className="text-xs text-violet-400 hover:text-violet-300">↻ {lang === 'GEO' ? 'განახლება' : 'Refresh'}</button>
      </div>
      {regs.map(r => (
        <div key={r.id} className="rounded-xl border border-white/[0.08] p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{r.user_name || r.user_email}</p>
              <p className="text-xs text-gray-400 truncate flex items-center gap-1.5 flex-wrap">
                {r.subject_name && <span className="text-violet-400">{r.subject_name} — </span>}
                {r.group_name}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  r.request_type === 'remove' ? 'bg-red-500/20 text-red-400' :
                  r.request_type === 'change' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {r.request_type === 'remove' ? (lang === 'GEO' ? 'წაშლა სურს' : 'Wants to remove') :
                   r.request_type === 'change' ? (lang === 'GEO' ? 'შეცვლა სურს' : 'Wants to change') :
                   (lang === 'GEO' ? 'დამატება სურს' : 'Wants to add')}
                </span>
              </p>
              {r.schedule_times?.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{formatScheduleTimes(r.schedule_times)}</p>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                disabled={acting === r.id}
                onClick={() => act(r.id, 'approved')}
                className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs px-2 py-1 disabled:opacity-40 transition-colors"
              >✅</button>
              <button
                disabled={acting === r.id}
                onClick={() => act(r.id, 'rejected')}
                className="rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-2 py-1 disabled:opacity-40 transition-colors"
              >❌</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentsPanel({ role, lang, allMembers, onMembersRefresh }) {
  const [tab, setTab] = useState('members');
  return (
    <div>
      <div className="flex gap-1 mb-3">
        {['members', 'pending'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-white/[0.1] text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {t === 'members'
              ? (lang === 'GEO' ? 'წევრები' : 'Members')
              : (lang === 'GEO' ? 'მოლოდინი' : 'Pending')}
          </button>
        ))}
      </div>
      {tab === 'members'
        ? <MembersPanel role={role} lang={lang} roleFilter="student" allMembers={allMembers} onMembersRefresh={onMembersRefresh} />
        : <PendingRegistrationsPanel lang={lang} />
      }
    </div>
  );
}

function AssistantsPanel({ role, lang, allMembers, onMembersRefresh }) { return <MembersPanel role={role} lang={lang} roleFilter="assistant" allMembers={allMembers} onMembersRefresh={onMembersRefresh} />; }

function AdminEventsPanel({ lang }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', time: '', place: '' });
  const [adding, setAdding] = useState(false);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/events', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEvents(data.events || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function add() {
    if (!form.name.trim()) return;
    setAdding(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', date: '', time: '', place: '' });
    setShowAdd(false);
    setAdding(false);
    load();
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-white font-medium">{ev.name}</p>
            <button onClick={() => del(ev.id)} className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0">✕</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">📅 {ev.date} · {ev.time}&nbsp;&nbsp;📍 {ev.place}</p>
        </div>
      ))}
      {showAdd ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {[
            ['name',  lang === 'GEO' ? 'ღონისძიების სახელი' : 'Event name'],
            ['date',  lang === 'GEO' ? 'თარიღი'            : 'Date'],
            ['time',  lang === 'GEO' ? 'დრო'               : 'Time'],
            ['place', lang === 'GEO' ? 'ადგილი'            : 'Place'],
          ].map(([field, placeholder]) => (
            <input key={field} value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={placeholder} className={`${FIELD} py-1.5`} />
          ))}
          <div className="flex gap-2">
            <button onClick={add} disabled={adding || !form.name.trim()}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-1.5 text-xs text-white">
              {lang === 'GEO' ? 'დამატება' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:text-white">
              {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="text-xs text-gray-500 hover:text-white transition-colors">
          {lang === 'GEO' ? '+ ღონისძიების დამატება' : '+ Add event'}
        </button>
      )}
    </div>
  );
}

function BroadcastPanel({ lang }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  function send() { if (msg.trim()) { setSent(true); setMsg(''); setTimeout(() => setSent(false), 3000); } }

  return (
    <div className="space-y-3">
      <textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)}
        placeholder={lang === 'GEO' ? 'დაწერეთ შეტყობინება...' : 'Write your notification message…'} className={FIELD} />
      {sent
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ შეტყობინება გაიგზავნა!' : '✅ Notification sent to everyone!'}</p>
        : <button onClick={send} disabled={!msg.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'ყველასთვის გაგზავნა' : 'Send to Everyone'}
          </button>
      }
    </div>
  );
}

function AnnouncePanel({ role, lang }) {
  const th = TH[role];
  const [group, setGroup] = useState(ALL_GROUP_NAMES[0]);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState('');

  function send() { if (msg.trim()) { setSent(group); setMsg(''); setTimeout(() => setSent(''), 3000); } }

  return (
    <div className="space-y-3">
      <select value={group} onChange={e => setGroup(e.target.value)} style={{ colorScheme: 'dark' }}
        className={`${FIELD} cursor-pointer`}>
        {ALL_GROUP_NAMES.map(g => <option key={g}>{g}</option>)}
      </select>
      <textarea rows={3} value={msg} onChange={e => setMsg(e.target.value)}
        placeholder={lang === 'GEO' ? 'თქვენი შეტყობინება...' : 'Your message…'} className={FIELD} />
      {sent
        ? <p className={`text-sm ${th.conf}`}>{lang === 'GEO' ? `✅ გამოცხადდა: ${sent}!` : `✅ Announced to ${sent}!`}</p>
        : <button onClick={send} disabled={!msg.trim()}
            className={`rounded-xl ${th.btn} disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors`}>
            {lang === 'GEO' ? 'გამოცხადების გაგზავნა' : 'Send Announcement'}
          </button>
      }
    </div>
  );
}

function InvitePanel({ role, lang }) {
  const th = TH[role];
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
    ? [['student', 'სტუდენტი'], ['teacher', 'მასწავლებელი'], ['assistant', 'ასისტენტი']]
    : [['student', 'Student'], ['teacher', 'Teacher'], ['assistant', 'Assistant']];

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

function SubjectsTabPanel({ role, lang }) {
  const th = TH[role];
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [subjectGroups, setSubjectGroups] = useState({});
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newEmoji, setNewEmoji] = useState('📚');
  const [newName, setNewName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [addingGroupFor, setAddingGroupFor] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupSchedules, setGroupSchedules] = useState({});
  const [addingTimeFor, setAddingTimeFor] = useState(null);
  const [newDay, setNewDay] = useState(0);
  const [newTime, setNewTime] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [editScheduleDay, setEditScheduleDay] = useState(0);
  const [editScheduleTime, setEditScheduleTime] = useState('');

  async function loadSubjects() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/subjects', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch {}
    setLoading(false);
  }

  async function loadGroupsFor(subjectId) {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/school/groups?subject_id=${subjectId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSubjectGroups(prev => ({ ...prev, [subjectId]: data.groups || [] }));
    } catch {}
  }

  useEffect(() => { loadSubjects(); }, []);

  async function delSubject(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/subjects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (expandedSubject === id) setExpandedSubject(null);
    loadSubjects();
  }

  async function addSubject() {
    if (!newName.trim()) return;
    setAddingSubject(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/subjects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji.trim() || '📚' }),
    });
    setNewName('');
    setNewEmoji('📚');
    setShowAddSubject(false);
    setAddingSubject(false);
    loadSubjects();
  }

  async function delGroup(groupId, subjectId) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/groups/${groupId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadGroupsFor(subjectId);
  }

  async function addGroup(subjectId) {
    if (!newGroupName.trim()) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/groups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim(), subject_id: subjectId }),
    });
    setNewGroupName('');
    setAddingGroupFor(null);
    loadGroupsFor(subjectId);
  }

  async function loadScheduleFor(groupId) {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch(`/api/school/schedule?group_id=${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setGroupSchedules(prev => ({ ...prev, [groupId]: data.schedule || [] }));
    } catch {}
  }

  async function delScheduleRow(rowId, groupId) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/schedule/${rowId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadScheduleFor(groupId);
  }

  async function addTime(groupId) {
    if (!newTime) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/schedule', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, day_of_week: parseInt(newDay), lesson_time: newTime }),
    });
    setNewTime('');
    setAddingTimeFor(null);
    loadScheduleFor(groupId);
  }

  function toggleGroup(groupId) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      if (!groupSchedules[groupId]) loadScheduleFor(groupId);
    }
    setAddingTimeFor(null);
    setNewTime('');
  }

  function toggleSubject(id) {
    if (expandedSubject === id) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(id);
      if (!subjectGroups[id]) loadGroupsFor(id);
    }
    setAddingGroupFor(null);
    setNewGroupName('');
    setExpandedGroup(null);
    setAddingTimeFor(null);
  }

  async function saveSubjectName(id) {
    if (!editSubjectName.trim()) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/subjects/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editSubjectName.trim() }),
    });
    setEditingSubjectId(null);
    loadSubjects();
  }

  async function saveGroupName(id, subjectId) {
    if (!editGroupName.trim()) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/groups/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editGroupName.trim() }),
    });
    setEditingGroupId(null);
    loadGroupsFor(subjectId);
  }

  async function saveScheduleRow(id, groupId) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/schedule/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: parseInt(editScheduleDay), lesson_time: editScheduleTime }),
    });
    setEditingScheduleId(null);
    loadScheduleFor(groupId);
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-2">
      {subjects.map(s => (
        <div key={s.id} className="rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            {editingSubjectId === s.id ? (
              <>
                <span className="text-base flex-shrink-0">{s.emoji}</span>
                <input autoFocus value={editSubjectName} onChange={e => setEditSubjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveSubjectName(s.id); if (e.key === 'Escape') setEditingSubjectId(null); }}
                  className="flex-1 min-w-0 rounded-md border border-white/20 bg-white/[0.06] px-2 py-0.5 text-sm text-white focus:outline-none" />
                <button onClick={() => saveSubjectName(s.id)} className="text-emerald-400 hover:text-emerald-300 text-xs flex-shrink-0">✓</button>
                <button onClick={() => setEditingSubjectId(null)} className="text-gray-500 hover:text-white text-xs flex-shrink-0">✕</button>
              </>
            ) : (
              <>
                <button onClick={() => toggleSubject(s.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                  <span className="text-base flex-shrink-0">{s.emoji}</span>
                  <span className="text-sm text-white font-medium truncate">{s.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{expandedSubject === s.id ? '▲' : '▼'}</span>
                </button>
                <button onClick={() => { setEditingSubjectId(s.id); setEditSubjectName(s.name); }}
                  className="text-gray-600 hover:text-gray-300 text-xs flex-shrink-0 transition-colors">✏️</button>
                <button onClick={() => delSubject(s.id)} className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>
              </>
            )}
          </div>
          {expandedSubject === s.id && (
            <div className="border-t border-white/[0.06] px-3 pb-3 pt-2 space-y-1.5">
              {(subjectGroups[s.id] || []).map(g => (
                <div key={g.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    {editingGroupId === g.id ? (
                      <>
                        <input autoFocus value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveGroupName(g.id, s.id); if (e.key === 'Escape') setEditingGroupId(null); }}
                          className="flex-1 min-w-0 rounded-md border border-white/20 bg-white/[0.06] px-2 py-0.5 text-xs text-white focus:outline-none" />
                        <button onClick={() => saveGroupName(g.id, s.id)} className="text-emerald-400 hover:text-emerald-300 text-[10px] ml-1.5">✓</button>
                        <button onClick={() => setEditingGroupId(null)} className="text-gray-500 hover:text-white text-[10px] ml-1">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggleGroup(g.id)} className="flex items-center gap-1.5 flex-1 text-left hover:opacity-80 transition-opacity">
                          <span className="text-xs text-white/80">{g.name}</span>
                          <span className="text-[10px] text-gray-500">{expandedGroup === g.id ? '▲' : '▼'}</span>
                        </button>
                        <button onClick={() => { setEditingGroupId(g.id); setEditGroupName(g.name); }}
                          className="text-gray-600 hover:text-gray-300 text-[10px] transition-colors">✏️</button>
                        <button onClick={() => delGroup(g.id, s.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors ml-1.5">✕</button>
                      </>
                    )}
                  </div>
                  {expandedGroup === g.id && (
                    <div className="border-t border-white/[0.04] px-3 pb-2 pt-1.5 space-y-1">
                      {(groupSchedules[g.id] || []).map(row => (
                        <div key={row.id}>
                          {editingScheduleId === row.id ? (
                            <div className="py-1 space-y-1">
                              <div className="flex gap-0.5">
                                {['ორშ','სამშ','ოთხ','ხუთ','პარ','შაბ','კვი'].map((d, i) => (
                                  <button key={i} onClick={() => setEditScheduleDay(i)}
                                    className={`flex-1 rounded-md py-0.5 text-[10px] font-medium transition-colors ${parseInt(editScheduleDay) === i ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white'}`}>
                                    {d}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-1 items-center">
                                <input value={editScheduleTime} onChange={e => setEditScheduleTime(e.target.value)}
                                  placeholder="16:00"
                                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/80 focus:outline-none flex-1" />
                                <button onClick={() => saveScheduleRow(row.id, g.id)}
                                  className="rounded-lg bg-violet-600 hover:bg-violet-500 px-2 py-0.5 text-[10px] text-white">✓</button>
                                <button onClick={() => setEditingScheduleId(null)} className="text-gray-500 hover:text-white text-[10px]">✕</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-gray-300">{GEO_DAYS[row.day_of_week]} — {(row.lesson_time || '').slice(0, 5)}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingScheduleId(row.id); setEditScheduleDay(row.day_of_week); setEditScheduleTime((row.lesson_time || '').slice(0, 5)); }}
                                  className="text-gray-600 hover:text-gray-300 text-[10px] transition-colors">✏️</button>
                                <button onClick={() => delScheduleRow(row.id, g.id)} className="text-gray-600 hover:text-red-400 text-[10px] transition-colors">✕</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {(groupSchedules[g.id] || []).length === 0 && addingTimeFor !== g.id && (
                        <p className="text-[10px] text-gray-600 py-0.5">{lang === 'GEO' ? 'დრო არ არის.' : 'No times yet.'}</p>
                      )}
                      {addingTimeFor === g.id ? (
                        <div className="pt-1.5 space-y-1.5">
                          <div className="flex gap-1">
                            {['ორშ','სამშ','ოთხ','ხუთ','პარ','შაბ','კვი'].map((d, i) => (
                              <button key={i} onClick={() => setNewDay(i)}
                                className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${parseInt(newDay) === i ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white'}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <input value={newTime} onChange={e => setNewTime(e.target.value)}
                              placeholder="16:00"
                              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-white/80 focus:outline-none flex-1" />
                            <button onClick={() => addTime(g.id)} disabled={!newTime.trim()}
                              className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-2.5 py-1 text-[11px] text-white transition-colors">
                              {lang === 'GEO' ? 'დამატება' : 'Add'}
                            </button>
                            <button onClick={() => setAddingTimeFor(null)} className="text-gray-500 hover:text-white text-[11px] px-1">✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingTimeFor(g.id); setNewDay(0); setNewTime(''); }}
                          className="text-[11px] text-gray-500 hover:text-white transition-colors mt-0.5">
                          {lang === 'GEO' ? '+ დროის დამატება' : '+ Add time'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(subjectGroups[s.id] || []).length === 0 && !addingGroupFor && (
                <p className="text-xs text-gray-600 py-1">{lang === 'GEO' ? 'ჯგუფები არ არის.' : 'No groups yet.'}</p>
              )}
              {addingGroupFor === s.id ? (
                <div className="flex gap-2 pt-1">
                  <input autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addGroup(s.id); if (e.key === 'Escape') setAddingGroupFor(null); }}
                    placeholder={lang === 'GEO' ? 'ჯგუფის სახელი...' : 'Group name…'}
                    className={`${FIELD} py-1 text-xs flex-1`} />
                  <button onClick={() => addGroup(s.id)} disabled={!newGroupName.trim()}
                    className={`rounded-lg ${th.btn} disabled:opacity-40 px-2.5 py-1 text-xs text-white`}>
                    {lang === 'GEO' ? 'დამატება' : 'Add'}
                  </button>
                  <button onClick={() => setAddingGroupFor(null)} className="text-gray-500 hover:text-white text-xs px-1.5">✕</button>
                </div>
              ) : (
                <button onClick={() => { setAddingGroupFor(s.id); setNewGroupName(''); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors mt-0.5">
                  {lang === 'GEO' ? '+ ჯგუფის დამატება' : '+ Add Group'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {subjects.length === 0 && !showAddSubject && (
        <p className="text-xs text-gray-500 text-center py-2">{lang === 'GEO' ? 'საგნები არ არის.' : 'No subjects yet.'}</p>
      )}
      {showAddSubject ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
          <div className="flex gap-2">
            <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
              placeholder="📚" className={`${FIELD} py-1.5 text-xs w-16 text-center`} />
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubject(); if (e.key === 'Escape') setShowAddSubject(false); }}
              placeholder={lang === 'GEO' ? 'საგნის სახელი...' : 'Subject name…'}
              className={`${FIELD} py-1.5 text-xs flex-1`} />
          </div>
          <div className="flex gap-2">
            <button onClick={addSubject} disabled={addingSubject || !newName.trim()}
              className={`rounded-xl ${th.btn} disabled:opacity-40 px-3 py-1.5 text-xs text-white`}>
              {lang === 'GEO' ? 'დამატება' : 'Add'}
            </button>
            <button onClick={() => setShowAddSubject(false)} className="text-xs text-gray-500 hover:text-white">
              {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddSubject(true)}
          className={`w-full rounded-xl border border-dashed border-white/[0.08] py-2 text-xs text-gray-500 hover:text-white transition-colors`}>
          {lang === 'GEO' ? '+ საგნის დამატება' : '+ Add Subject'}
        </button>
      )}
    </div>
  );
}

function ScheduleTabPanel({ lang }) {
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [form, setForm] = useState({ day: 'ორშაბათი', time: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const [subjRes, grpRes, schedRes] = await Promise.all([
        fetch('/api/school/subjects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/school/groups',   { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [subjData, grpData, schedData] = await Promise.all([subjRes.json(), grpRes.json(), schedRes.json()]);
      setSubjects(subjData.subjects || []);
      setGroups(grpData.groups || []);
      setScheduleRows(schedData.schedule || []);
    } catch {}
    setLoading(false);
  }

  async function reloadSchedule() {
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setScheduleRows(data.schedule || []);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  async function delRow(id) {
    const token = localStorage.getItem('sherlock_token');
    await fetch(`/api/school/schedule/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    reloadSchedule();
  }

  async function addRow(groupId) {
    if (!form.time.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/schedule', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, day_of_week: form.day, lesson_time: form.time }),
    });
    setForm({ day: 'ორშაბათი', time: '' });
    setAddingFor(null);
    setSaving(false);
    reloadSchedule();
  }

  function toggleSubject(id) {
    setExpandedSubject(prev => prev === id ? null : id);
    setExpandedGroup(null);
    setAddingFor(null);
  }

  function toggleGroup(id) {
    setExpandedGroup(prev => prev === id ? null : id);
    setAddingFor(null);
    setForm({ day: 'ორშაბათი', time: '' });
  }

  if (loading) return <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;

  return (
    <div className="space-y-1.5">
      {subjects.map(s => {
        const sGroups = groups.filter(g => g.subject_id === s.id);
        const isSubOpen = expandedSubject === s.id;
        return (
          <div key={s.id} className="rounded-xl border border-white/[0.08] overflow-hidden">
            <button onClick={() => toggleSubject(s.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors">
              <span className="text-base flex-shrink-0">{s.emoji}</span>
              <span className="text-sm text-white font-medium flex-1">{s.name}</span>
              <span className="text-xs text-gray-500">{isSubOpen ? '▲' : '▼'}</span>
            </button>
            {isSubOpen && (
              <div className="border-t border-white/[0.06] px-3 pb-3 pt-2 space-y-1.5">
                {sGroups.length === 0 && (
                  <p className="text-xs text-gray-600 py-1">{lang === 'GEO' ? 'ჯგუფები არ არის.' : 'No groups.'}</p>
                )}
                {sGroups.map(g => {
                  const gRows = scheduleRows.filter(r => r.group_id === g.id);
                  const isGrpOpen = expandedGroup === g.id;
                  return (
                    <div key={g.id} className="rounded-lg border border-white/[0.06] overflow-hidden">
                      <button onClick={() => toggleGroup(g.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.03] transition-colors">
                        <span className="text-xs text-white/80 font-medium">{g.name}</span>
                        <span className="text-xs text-gray-500">{isGrpOpen ? '▲' : '▼'}</span>
                      </button>
                      {isGrpOpen && (
                        <div className="border-t border-white/[0.05] px-3 pb-2 pt-1.5 space-y-1">
                          {gRows.length === 0 && (
                            <p className="text-xs text-gray-600 py-1">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>
                          )}
                          {gRows.map(r => (
                            <div key={r.id} className="flex items-center gap-2 text-xs py-1 border-b border-white/[0.04]">
                              <span className="text-gray-400 flex-1">{r.day_of_week}</span>
                              <span className="text-gray-300 font-mono w-12 flex-shrink-0">{r.lesson_time}</span>
                              <button onClick={() => delRow(r.id)} className="text-gray-600 hover:text-red-400 flex-shrink-0">✕</button>
                            </div>
                          ))}
                          {addingFor === g.id ? (
                            <div className="pt-1.5 space-y-1.5">
                              <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                                style={{ colorScheme: 'dark' }} className={`${FIELD} py-1 text-xs`}>
                                {GEO_DAYS.map(d => <option key={d}>{d}</option>)}
                              </select>
                              <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                placeholder="HH:MM" className={`${FIELD} py-1 text-xs`} />
                              <div className="flex gap-2">
                                <button onClick={() => addRow(g.id)} disabled={saving || !form.time.trim()}
                                  className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-2.5 py-1 text-xs text-white">
                                  {lang === 'GEO' ? 'დამატება' : 'Add'}
                                </button>
                                <button onClick={() => setAddingFor(null)} className="text-xs text-gray-500 hover:text-white">
                                  {lang === 'GEO' ? 'გაუქმება' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setAddingFor(g.id); setForm({ day: 'ორშაბათი', time: '' }); }}
                              className="text-xs text-gray-500 hover:text-white transition-colors mt-0.5">
                              {lang === 'GEO' ? '+ დროის დამატება' : '+ Add time'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {subjects.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'საგნები არ არის.' : 'No subjects found.'}</p>
      )}
    </div>
  );
}

function SubjectsPanel({ role, lang }) {
  const th = TH[role];
  const geo = lang === 'GEO';
  const [tab, setTab] = useState('subjects');

  const tabs = geo
    ? [['subjects', 'საგნები'], ['use', 'გამოყენება']]
    : [['subjects', 'Subjects'], ['use', 'Use']];

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
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
      {tab === 'subjects' && <SubjectsTabPanel role={role} lang={lang} />}
      {tab === 'use' && <AiUsePanel role={role} lang={lang} />}
    </div>
  );
}

function AdminViewEventsPanel() {
  return (
    <div className="space-y-2">
      {INIT_EVENTS.map(ev => (
        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-white font-medium">{ev.name}</p>
          <p className="text-xs text-gray-500 mt-1">📅 {ev.date} · {ev.time}&nbsp;&nbsp;📍 {ev.place}</p>
        </div>
      ))}
    </div>
  );
}

function AdminAddEventPanel({ role, lang }) {
  const th = TH[role];
  const [form, setForm] = useState({ name: '', date: '', time: '', place: '' });
  const [added, setAdded] = useState(false);

  const placeholders = lang === 'GEO'
    ? [['name','ღონისძიების სახელი'],['date','თარიღი'],['time','დრო'],['place','ადგილი']]
    : [['name','Event name'],['date','Date (e.g. 1 Jan 2026)'],['time','Time (e.g. 18:00)'],['place','Place']];

  function add() {
    if (form.name.trim()) {
      setAdded(true);
      setForm({ name: '', date: '', time: '', place: '' });
      setTimeout(() => setAdded(false), 3000);
    }
  }

  return (
    <div className="space-y-3">
      {placeholders.map(([field, placeholder]) => (
        <input key={field} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder} className={FIELD} />
      ))}
      {added
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ ღონისძიება დამატებულია!' : '✅ Event added!'}</p>
        : <button onClick={add} disabled={!form.name.trim()}
            className={`rounded-xl ${th.btn} disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors`}>
            {lang === 'GEO' ? 'ღონისძიების დამატება' : 'Add Event'}
          </button>
      }
    </div>
  );
}

function AdminDeleteEventPanel({ lang }) {
  const [events, setEvents] = useState(INIT_EVENTS);

  return (
    <div className="space-y-2">
      {events.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          {lang === 'GEO' ? 'ღონისძიებები არ არის.' : 'No events.'}
        </p>
      )}
      {events.map(ev => (
        <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{ev.name}</p>
            <p className="text-xs text-gray-500">{ev.date} · {ev.time}</p>
          </div>
          <button onClick={() => setEvents(es => es.filter(e => e.id !== ev.id))}
            className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>
        </div>
      ))}
    </div>
  );
}

function AssistantRequestsPanel({ lang }) {
  const [requests, setRequests] = useState(INIT_REQUESTS);

  function resolve(id, status) {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  }

  return (
    <div className="space-y-2">
      {requests.map(r => (
        <div key={r.id} className={`rounded-xl border p-3 transition-colors ${
          r.status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/[0.07]' :
          r.status === 'rejected' ? 'border-red-500/30 bg-red-500/[0.07]' :
          'border-white/10 bg-white/[0.02]'
        }`}>
          <p className="text-xs text-white">
            <span className="font-medium">{r.student}</span>
            <span className="text-gray-400"> · {r.type}: </span>
            <span>{r.desc}</span>
          </p>
          {r.status === 'pending' ? (
            <div className="flex gap-2 mt-2">
              <button onClick={() => resolve(r.id, 'approved')}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors">
                {lang === 'GEO' ? '✅ დამტკიცება' : '✅ Approve'}
              </button>
              <button onClick={() => resolve(r.id, 'rejected')}
                className="text-xs px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors">
                {lang === 'GEO' ? '❌ უარყოფა' : '❌ Reject'}
              </button>
            </div>
          ) : (
            <p className={`text-xs mt-1 font-medium ${r.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
              {r.status === 'approved'
                ? (lang === 'GEO' ? '✅ დამტკიცებული' : '✅ Approved')
                : (lang === 'GEO' ? '❌ უარყოფილი' : '❌ Rejected')}
            </p>
          )}
        </div>
      ))}
      {requests.every(r => r.status !== 'pending') && (
        <p className="text-xs text-gray-500 text-center py-2">
          {lang === 'GEO' ? 'ყველა მოთხოვნა განხილულია.' : 'All requests resolved.'}
        </p>
      )}
    </div>
  );
}

function TeachersPanel({ role, lang, allMembers, onMembersRefresh }) { return <MembersPanel role={role} lang={lang} roleFilter="teacher" allMembers={allMembers} onMembersRefresh={onMembersRefresh} />; }

// ─── Teacher panels ───────────────────────────────────────────────────────────

function MySchedulePanel({ lang }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const DAYS_GEO = {0:'ორშაბათი',1:'სამშაბათი',2:'ოთხშაბათი',3:'ხუთშაბათი',4:'პარასკევი',5:'შაბათი',6:'კვირა'};
  const DAYS_EN = {0:'Monday',1:'Tuesday',2:'Wednesday',3:'Thursday',4:'Friday',5:'Saturday',6:'Sunday'};

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    if (!token) { setLoading(false); return; }
    fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRows(d.schedule || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-gray-500">იტვირთება...</p>;
  if (!rows.length) return <p className="text-xs text-gray-500">{lang === 'GEO' ? 'განრიგი ცარიელია' : 'No schedule yet.'}</p>;

  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-500">
        <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დღე' : 'Day'}</th>
        <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დრო' : 'Time'}</th>
        <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'საგანი' : 'Subject'}</th>
        <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'ჯგუფი' : 'Group'}</th>
      </tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={i} className="border-t border-white/[0.05]">
          <td className="py-1.5 text-gray-400">{lang === 'GEO' ? DAYS_GEO[r.day_of_week] : DAYS_EN[r.day_of_week]}</td>
          <td className="py-1.5 text-gray-300 font-mono">{r.lesson_time}</td>
          <td className="py-1.5 text-gray-400">{r.subject_name}</td>
          <td className="py-1.5 text-white">{r.group_name}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function MyGroupsPanel({ lang }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TEACHER_GROUPS.map(g => (
        <div key={g.name} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-xs text-white font-medium">{g.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{g.count} {lang === 'GEO' ? 'სტუდენტი' : 'students'}</p>
        </div>
      ))}
    </div>
  );
}

function TeacherShareFilesPanel({ lang }) {
  const [group, setGroup] = useState(TEACHER_GROUPS[0].name);
  const [fileName, setFileName] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState('');

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function send() {
    setSent(group);
    setFileName('');
    setNote('');
    setTimeout(() => setSent(''), 3000);
  }

  return (
    <div className="space-y-3">
      <select value={group} onChange={e => setGroup(e.target.value)} style={{ colorScheme: 'dark' }}
        className={`${FIELD} cursor-pointer`}>
        {TEACHER_GROUPS.map(g => <option key={g.name}>{g.name}</option>)}
      </select>
      <label className="flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 cursor-pointer hover:border-white/40 transition-colors">
        <span className="text-lg">📎</span>
        <div className="flex-1 min-w-0">
          {fileName
            ? <p className="text-xs text-white truncate">{fileName}</p>
            : <p className="text-xs text-gray-500">{lang === 'GEO' ? 'ფაილის არჩევა (.pdf, .jpg, .png, .mp4)' : 'Choose file (.pdf, .jpg, .png, .mp4)'}</p>
          }
        </div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4" onChange={handleFile} className="hidden" />
      </label>
      <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
        placeholder={lang === 'GEO' ? 'სურვილისამებრ შეტყობინება...' : 'Optional message…'} className={FIELD} />
      {sent
        ? <p className="text-blue-400 text-sm">{lang === 'GEO' ? `✅ ფაილები გაიზიარა: ${sent}!` : `✅ Files shared with ${sent}!`}</p>
        : <button onClick={send} disabled={!fileName}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'ფაილების გაზიარება' : 'Share Files'}
          </button>
      }
    </div>
  );
}

function KnowledgeLibraryPanel({ role, lang, orgName, orgNameGenitive, libraryFiles = [], onAddFile, onRemoveFile }) {
  const th = TH[role];
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

// ─── Student panels ───────────────────────────────────────────────────────────

function StudentSchedulePanel({ lang }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRows(d.schedule || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-gray-500">{lang === 'GEO' ? 'იტვირთება...' : 'Loading…'}</p>;
  if (!rows.length) return <p className="text-xs text-gray-500">{lang === 'GEO' ? 'განრიგი ცარიელია.' : 'No schedule yet.'}</p>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500">
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დღე' : 'Day'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დრო' : 'Time'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'საგანი' : 'Subject'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'ჯგუფი' : 'Group'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} className="border-t border-white/[0.05]">
            <td className="py-1.5 text-gray-400">{GEO_DAYS[r.day_of_week] ?? r.day_of_week}</td>
            <td className="py-1.5 text-gray-300 font-mono">{(r.lesson_time || '').slice(0, 5)}</td>
            <td className="py-1.5 text-violet-400">{r.subject_name}</td>
            <td className="py-1.5 text-white">{r.group_name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StudentEventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/events', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  if (!events.length) return <p className="text-xs text-gray-500">No events yet.</p>;
  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-white font-medium">{ev.name}</p>
          <p className="text-xs text-gray-500 mt-1">📅 {ev.event_date} · {ev.event_time}  📍 {ev.place}</p>
        </div>
      ))}
    </div>
  );
}

function StudentLibraryPanel() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LIBRARY_CATS.map(c => (
        <div key={c.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-lg mb-1">{c.icon}</p>
          <p className="text-xs text-white font-medium">{c.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

const LABEL_COLORS = ['#7C3AED','#2563EB','#059669','#DC2626','#D97706','#DB2777','#0891B2','#65A30D'];
const INPUT_SM = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25';

const SELECT_DARK = { colorScheme: 'dark', background: '#1a1a2e', color: 'white' };
const OPTION_DARK = { background: '#1a1a2e', color: 'white' };

function parseImages(raw) {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; }
  catch { return [raw]; }
}

function StudentNotesPanel({ lang }) {
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [contentDraft, setContentDraft] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [images, setImages] = useState([]);
  const [checklist, setChecklist] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [histState, setHistState] = useState({ canUndo: false, canRedo: false });
  const imgInputRef = useRef(null);
  const origRef = useRef({ title: '', content: '', images: [] });
  const histRef = useRef({ stack: [], idx: -1 });
  const debounceRef = useRef(null);

  const tk = () => localStorage.getItem('sherlock_token');

  async function reload() {
    const [nd, ld] = await Promise.all([
      fetch('/api/school/notes', { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
      fetch('/api/school/notes/labels', { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
    ]);
    setNotes(nd.notes || []);
    setLabels(ld.labels || []);
  }

  useEffect(() => { reload().then(() => setLoading(false)).catch(() => setLoading(false)); }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (view !== 'new' && view !== 'edit') return;
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const h = histRef.current;
        if (h.idx <= 0) return;
        h.idx--;
        setContentDraft(h.stack[h.idx]);
        setHistState({ canUndo: h.idx > 0, canRedo: h.idx < h.stack.length - 1 });
      }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        const h = histRef.current;
        if (h.idx >= h.stack.length - 1) return;
        h.idx++;
        setContentDraft(h.stack[h.idx]);
        setHistState({ canUndo: h.idx > 0, canRedo: h.idx < h.stack.length - 1 });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [view]);

  const filtered = notes.filter(n => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || (n.title || '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchL = !labelFilter || String(n.label_id) === labelFilter;
    return matchQ && matchL;
  });

  function openNew() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setView('new'); setEditing(null);
    setTitleDraft(''); setContentDraft(''); setLabelDraft('');
    setImages([]); setChecklist(false); setNewItem('');
    origRef.current = { title: '', content: '', images: [] };
    histRef.current = { stack: [], idx: -1 };
    setHistState({ canUndo: false, canRedo: false });
  }
  function openEdit(n) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setView('edit'); setEditing(n);
    setTitleDraft(n.title || ''); setContentDraft(n.content || '');
    setLabelDraft(n.label_id ? String(n.label_id) : '');
    const imgs = parseImages(n.image_url);
    setImages(imgs);
    const isChecklist = (n.content || '').split('\n').some(l => l.startsWith('[ ] ') || l.startsWith('[x] '));
    setChecklist(isChecklist); setNewItem('');
    origRef.current = { title: n.title || '', content: n.content || '', images: imgs };
    histRef.current = { stack: [n.content || ''], idx: 0 };
    setHistState({ canUndo: false, canRedo: false });
  }
  function backToList() { setView('list'); setEditing(null); setImages([]); setChecklist(false); setPreviewImg(null); setSavedFlash(false); }

  function hasChanges() {
    const orig = origRef.current;
    return titleDraft !== orig.title || contentDraft !== orig.content || JSON.stringify(images) !== JSON.stringify(orig.images);
  }

  function handleContentChange(val) {
    setContentDraft(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const h = histRef.current;
      const newStack = [...h.stack.slice(0, h.idx + 1), val].slice(-50);
      h.stack = newStack;
      h.idx = newStack.length - 1;
      setHistState({ canUndo: h.idx > 0, canRedo: false });
    }, 500);
  }

  function undo() {
    const h = histRef.current;
    if (h.idx <= 0) return;
    h.idx--;
    setContentDraft(h.stack[h.idx]);
    setHistState({ canUndo: h.idx > 0, canRedo: h.idx < h.stack.length - 1 });
  }

  function redo() {
    const h = histRef.current;
    if (h.idx >= h.stack.length - 1) return;
    h.idx++;
    setContentDraft(h.stack[h.idx]);
    setHistState({ canUndo: h.idx > 0, canRedo: h.idx < h.stack.length - 1 });
  }

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => setImages(prev => [...prev, ev.target.result]);
    reader.readAsDataURL(file);
  }

  function toggleChecklist() {
    if (!checklist) {
      const lines = contentDraft.split('\n');
      const converted = lines.map(l => {
        if (!l.trim()) return l;
        if (l.startsWith('[ ] ') || l.startsWith('[x] ')) return l;
        return '[ ] ' + l;
      });
      setContentDraft(converted.join('\n'));
    }
    setChecklist(c => !c);
  }

  function toggleItem(idx) {
    const lines = contentDraft.split('\n');
    const l = lines[idx];
    lines[idx] = l.startsWith('[x] ') ? '[ ] ' + l.slice(4) : l.startsWith('[ ] ') ? '[x] ' + l.slice(4) : l;
    setContentDraft(lines.join('\n'));
  }

  function deleteItem(idx) {
    const lines = contentDraft.split('\n');
    lines.splice(idx, 1);
    setContentDraft(lines.join('\n'));
  }

  function addItem() {
    if (!newItem.trim()) return;
    setContentDraft(prev => (prev && !prev.endsWith('\n') ? prev + '\n' : prev) + '[ ] ' + newItem.trim());
    setNewItem('');
  }

  async function saveNote() {
    if (!contentDraft.trim()) return;
    setSaving(true);
    const body = { title: titleDraft.trim() || null, content: contentDraft, label_id: labelDraft ? parseInt(labelDraft) : null, image_url: images.length ? JSON.stringify(images) : null };
    if (view === 'new') {
      await fetch('/api/school/notes', { method: 'POST', headers: { Authorization: `Bearer ${tk()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/school/notes/${editing.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${tk()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false);
    await reload();
  }

  async function save() {
    await saveNote();
    backToList();
  }

  async function handleBack() {
    if (hasChanges() && contentDraft.trim()) {
      await saveNote();
      setSavedFlash(true);
      await new Promise(r => setTimeout(r, 700));
    }
    backToList();
  }

  async function del(id) {
    await fetch(`/api/school/notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tk()}` } });
    await reload();
    backToList();
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;

  if (view === 'new' || view === 'edit') {
    const checklistLines = contentDraft.split('\n').filter(l => l.trim());
    return (
      <div className="space-y-3">
        {previewImg && (
          <div onClick={() => setPreviewImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
            <img src={previewImg} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'8px',objectFit:'contain'}} onClick={e=>e.stopPropagation()} />
            <button onClick={() => setPreviewImg(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:24,cursor:'pointer',borderRadius:'50%',width:40,height:40}}>✕</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">← {lang === 'GEO' ? 'უკან' : 'Back'}</button>
          {savedFlash && <span className="text-xs text-green-400">✓ {lang === 'GEO' ? 'შენახულია' : 'Saved'}</span>}
        </div>
        <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
          placeholder={lang === 'GEO' ? 'სათაური...' : 'Title…'} className={INPUT_SM} />

        {/* Images above content */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="max-h-[120px] rounded-xl border border-white/10 object-cover cursor-zoom-in" onClick={() => setPreviewImg(src)} />
                <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black/90">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Content area */}
        {checklist ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 min-h-[120px] space-y-1.5">
            {checklistLines.map((line, idx) => {
              const checked = line.startsWith('[x] ');
              const text = (checked || line.startsWith('[ ] ')) ? line.slice(4) : line;
              return (
                <div key={idx} className="flex items-center gap-2 group">
                  <input type="checkbox" checked={checked} onChange={() => toggleItem(idx)}
                    className="accent-violet-500 flex-shrink-0 cursor-pointer" />
                  <span className={`flex-1 text-xs ${checked ? 'line-through text-gray-600' : 'text-white/80'}`}>{text}</span>
                  <button onClick={() => deleteItem(idx)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-opacity">✕</button>
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <input value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                placeholder={lang === 'GEO' ? '+ დამატება...' : '+ Add item…'}
                className="flex-1 bg-transparent text-xs text-white/60 placeholder-white/20 focus:outline-none focus:text-white/80" />
              {newItem.trim() && (
                <button onClick={addItem} className="text-xs text-violet-400 hover:text-violet-300">+</button>
              )}
            </div>
          </div>
        ) : (
          <textarea rows={7} value={contentDraft} onChange={e => handleContentChange(e.target.value)}
            placeholder={lang === 'GEO' ? 'შინაარსი...' : 'Content…'}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 resize-none" />
        )}

        {/* Label selector */}
        {labels.length > 0 && (
          <select value={labelDraft} onChange={e => setLabelDraft(e.target.value)}
            style={SELECT_DARK} className={INPUT_SM}>
            <option value="" style={OPTION_DARK}>{lang === 'GEO' ? 'ლეიბლი (სურვილისამებრ)' : 'Label (optional)'}</option>
            {labels.map(l => <option key={l.id} value={l.id} style={OPTION_DARK}>{l.name}</option>)}
          </select>
        )}

        {/* Bottom toolbar */}
        <input ref={imgInputRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
          <button onClick={() => imgInputRef.current?.click()}
            className="rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 text-sm transition-colors"
            title={lang === 'GEO' ? 'სურათის დამატება' : 'Add image'}>📷</button>
          <button onClick={toggleChecklist}
            className={`rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${checklist ? 'border-violet-500/50 bg-violet-500/10 text-violet-400' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'}`}
            title={lang === 'GEO' ? 'სია' : 'Checklist'}>☑️</button>
          <button onClick={undo} disabled={!histState.canUndo}
            className="rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 px-2.5 py-1.5 text-sm transition-colors"
            title="Undo (Ctrl+Z)">↩</button>
          <button onClick={redo} disabled={!histState.canRedo}
            className="rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 px-2.5 py-1.5 text-sm transition-colors"
            title="Redo (Ctrl+Y)">↪</button>
          <div className="flex-1" />
          <button onClick={save} disabled={!contentDraft.trim() || saving}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-1.5 text-xs text-white font-medium transition-colors">
            {saving ? '…' : (lang === 'GEO' ? 'შენახვა' : 'Save')}
          </button>
          {view === 'edit' && (
            <button onClick={() => del(editing.id)}
              className="rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 text-xs transition-colors">
              {lang === 'GEO' ? 'წაშლა' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <img src={previewImg} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'8px',objectFit:'contain'}} onClick={e=>e.stopPropagation()} />
          <button onClick={() => setPreviewImg(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:24,cursor:'pointer',borderRadius:'50%',width:40,height:40}}>✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder={lang === 'GEO' ? 'ძებნა...' : 'Search…'} className={`${INPUT_SM} flex-1`} />
        <button onClick={openNew}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs text-white font-medium transition-colors flex-shrink-0">
          + {lang === 'GEO' ? 'ახალი' : 'New'}
        </button>
      </div>
      {labels.length > 0 && (
        <select value={labelFilter} onChange={e => setLabelFilter(e.target.value)}
          style={SELECT_DARK} className={INPUT_SM}>
          <option value="" style={OPTION_DARK}>{lang === 'GEO' ? 'ყველა ლეიბლი' : 'All labels'}</option>
          {labels.map(l => <option key={l.id} value={l.id} style={OPTION_DARK}>{l.name}</option>)}
        </select>
      )}
      {filtered.length === 0
        ? <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'ჩანაწერები არ არის.' : 'No notes yet.'}</p>
        : (
          <div className="space-y-2">
            {filtered.map(n => {
              const imgs = parseImages(n.image_url);
              const hasChecklist = (n.content || '').split('\n').some(l => l.startsWith('[ ] ') || l.startsWith('[x] '));
              return (
                <div key={n.id} onClick={() => openEdit(n)}
                  className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-start gap-2">
                    {imgs[0] && <img src={imgs[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10 cursor-zoom-in" onClick={e => { e.stopPropagation(); setPreviewImg(imgs[0]); }} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {n.label_color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: n.label_color }} />}
                        {hasChecklist && <span className="text-[10px] text-gray-500">☑</span>}
                        {imgs.length > 1 && <span className="text-[10px] text-gray-500">🖼 ×{imgs.length}</span>}
                        <p className="text-xs font-semibold text-white truncate">{n.title || (lang === 'GEO' ? 'სათაური არ არის' : 'Untitled')}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.content.replace(/\[.\] /g, '').slice(0, 80)}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 flex-shrink-0">{new Date(n.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

function StudentPracticeDiaryPanel({ lang }) {
  const [entries, setEntries] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [mood, setMood] = useState('😊');
  const [practiced, setPracticed] = useState('');
  const [goal, setGoal] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const imgInputRef = useRef(null);

  const tk = () => localStorage.getItem('sherlock_token');

  function parseImages(raw) {
    if (!raw) return [];
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; }
    catch { return [raw]; }
  }

  async function reload() {
    const [dd, ld] = await Promise.all([
      fetch('/api/school/notes/diary', { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
      fetch('/api/school/notes/labels', { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
    ]);
    setEntries(dd.entries || []);
    setLabels(ld.labels || []);
  }

  useEffect(() => {
    reload().then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || e.practiced.toLowerCase().includes(q) || (e.goal || '').toLowerCase().includes(q);
    const matchL = !labelFilter || String(e.label_id) === labelFilter;
    return matchQ && matchL;
  });

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => setImages(prev => [...prev, ev.target.result]);
    reader.readAsDataURL(file);
  }

  function resetForm() { setPracticed(''); setGoal(''); setMood('😊'); setLabelDraft(''); setImages([]); }

  async function saveEntry() {
    if (!practiced.trim()) return;
    setSaving(true);
    await fetch('/api/school/notes/diary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tk()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, practiced, goal: goal.trim() || null, label_id: labelDraft ? parseInt(labelDraft) : null, image_url: images.length ? JSON.stringify(images) : null }),
    });
    setSaving(false);
    await reload();
  }

  async function save() {
    await saveEntry();
    setShowCreate(false);
    resetForm();
  }

  async function handleBack() {
    if (practiced.trim()) {
      await saveEntry();
      setSavedFlash(true);
      await new Promise(r => setTimeout(r, 700));
    }
    setShowCreate(false);
    resetForm();
    setSavedFlash(false);
  }

  async function del(id) {
    await fetch(`/api/school/notes/diary/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tk()}` } });
    setExpanded(null);
    await reload();
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;

  return (
    <div className="space-y-3">
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <img src={previewImg} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'8px',objectFit:'contain'}} onClick={e=>e.stopPropagation()} />
          <button onClick={() => setPreviewImg(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:24,cursor:'pointer',borderRadius:'50%',width:40,height:40}}>✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder={lang === 'GEO' ? 'ძებნა...' : 'Search…'} className={`${INPUT_SM} flex-1`} />
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs text-white font-medium transition-colors flex-shrink-0">
            + {lang === 'GEO' ? 'ახალი' : 'New'}
          </button>
        )}
      </div>
      {labels.length > 0 && (
        <select value={labelFilter} onChange={e => setLabelFilter(e.target.value)}
          style={SELECT_DARK} className={INPUT_SM}>
          <option value="" style={OPTION_DARK}>{lang === 'GEO' ? 'ყველა ლეიბლი' : 'All labels'}</option>
          {labels.map(l => <option key={l.id} value={l.id} style={OPTION_DARK}>{l.name}</option>)}
        </select>
      )}
      {showCreate && (
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">← {lang === 'GEO' ? 'უკან' : 'Back'}</button>
            {savedFlash && <span className="text-xs text-green-400">✓ {lang === 'GEO' ? 'შენახულია' : 'Saved'}</span>}
          </div>
          <div className="flex gap-1.5">
            {MOODS.map(m => (
              <button key={m} onClick={() => setMood(m)}
                className={`text-xl p-1 rounded-lg transition-colors ${mood === m ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/[0.05]'}`}>{m}</button>
            ))}
          </div>
          <textarea rows={2} value={practiced} onChange={e => setPracticed(e.target.value)}
            placeholder={lang === 'GEO' ? 'რას ვარჯიშობდი?' : 'What did you practice?'}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none resize-none" />
          <textarea rows={2} value={goal} onChange={e => setGoal(e.target.value)}
            placeholder={lang === 'GEO' ? 'ხვალინდელი მიზანი...' : "Tomorrow's goal…"}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none resize-none" />
          {labels.length > 0 && (
            <select value={labelDraft} onChange={e => setLabelDraft(e.target.value)}
              style={SELECT_DARK} className={INPUT_SM}>
              <option value="" style={OPTION_DARK}>{lang === 'GEO' ? 'ლეიბლი (სურვილისამებრ)' : 'Label (optional)'}</option>
              {labels.map(l => <option key={l.id} value={l.id} style={OPTION_DARK}>{l.name}</option>)}
            </select>
          )}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative inline-block">
                  <img src={src} alt="" className="h-20 w-20 rounded-xl border border-white/10 object-cover cursor-zoom-in" onClick={() => setPreviewImg(src)} />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black/80">✕</button>
                </div>
              ))}
            </div>
          )}
          <input ref={imgInputRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
          <div className="flex gap-2 border-t border-white/[0.06] pt-2">
            <button onClick={() => imgInputRef.current?.click()}
              className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-sm transition-colors"
              title={lang === 'GEO' ? 'სურათის დამატება' : 'Add image'}>📷</button>
            <button onClick={save} disabled={!practiced.trim() || saving}
              className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
              {saving ? '…' : (lang === 'GEO' ? 'შენახვა' : 'Save Entry')}
            </button>
          </div>
        </div>
      )}
      {filtered.length === 0
        ? <p className="text-xs text-gray-500 text-center py-4">{lang === 'GEO' ? 'ჩანაწერები არ არის.' : 'No entries yet.'}</p>
        : (
          <div className="space-y-2">
            {filtered.map(e => {
              const imgs = parseImages(e.image_url);
              return (
                <div key={e.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <div onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    className="cursor-pointer px-3 py-2.5 flex items-start gap-2 hover:bg-white/[0.03] transition-colors">
                    <span className="text-lg flex-shrink-0">{e.mood || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {e.label_color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.label_color }} />}
                        <p className="text-xs text-gray-300 truncate">{e.practiced.slice(0, 70)}</p>
                      </div>
                      {e.goal && <p className="text-xs text-gray-600 mt-0.5 truncate">→ {e.goal.slice(0, 60)}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {imgs.length > 0 && <span className="text-[10px] text-gray-500">🖼{imgs.length > 1 ? ` ×${imgs.length}` : ''}</span>}
                      <p className="text-[10px] text-gray-600">{new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {expanded === e.id && (
                    <div className="px-3 pb-2.5 border-t border-white/[0.06] space-y-2 pt-2">
                      <p className="text-xs text-gray-300">{e.practiced}</p>
                      {e.goal && <p className="text-xs text-gray-500">→ {e.goal}</p>}
                      {imgs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {imgs.map((src, i) => (
                            <img key={i} src={src} alt="" className="max-h-40 rounded-xl border border-white/10 object-cover cursor-zoom-in" onClick={e => { e.stopPropagation(); setPreviewImg(src); }} />
                          ))}
                        </div>
                      )}
                      <button onClick={() => del(e.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        {lang === 'GEO' ? '🗑 წაშლა' : '🗑 Delete'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

function StudentLabelsPanel({ lang }) {
  const [labels, setLabels] = useState([]);
  const [notes, setNotes] = useState([]);
  const [diary, setDiary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#7C3AED');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const tk = () => localStorage.getItem('sherlock_token');

  async function reloadLabels() {
    const d = await fetch('/api/school/notes/labels', { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json());
    setLabels(d.labels || []);
  }

  useEffect(() => {
    reloadLabels().then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch('/api/school/notes/labels', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tk()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName('');
    setCreating(false);
    await reloadLabels();
  }

  async function del(id) {
    await fetch(`/api/school/notes/labels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tk()}` } });
    if (selected === id) { setSelected(null); setNotes([]); setDiary([]); }
    await reloadLabels();
  }

  async function selectLabel(id) {
    if (selected === id) { setSelected(null); setNotes([]); setDiary([]); return; }
    setSelected(id);
    const [nd, dd] = await Promise.all([
      fetch(`/api/school/notes?label_id=${id}`, { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
      fetch(`/api/school/notes/diary?label_id=${id}`, { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
    ]);
    setNotes(nd.notes || []);
    setDiary(dd.entries || []);
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;

  const selectedLabel = labels.find(l => l.id === selected);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 p-3 space-y-2.5">
        <p className="text-xs text-gray-400 font-medium">+ {lang === 'GEO' ? 'ახალი ლეიბლი' : 'New Label'}</p>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') create(); }}
          placeholder={lang === 'GEO' ? 'ლეიბლის სახელი...' : 'Label name…'} className={INPUT_SM} />
        <div className="flex items-center gap-1.5 flex-wrap">
          {LABEL_COLORS.map(c => (
            <button key={c} onClick={() => setNewColor(c)}
              className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'ring-2 ring-white/60 scale-110' : 'hover:scale-105'}`}
              style={{ background: c }} />
          ))}
        </div>
        <button onClick={create} disabled={!newName.trim() || creating}
          className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-1.5 text-xs text-white font-medium transition-colors">
          {creating ? '…' : (lang === 'GEO' ? 'შექმნა' : 'Create')}
        </button>
      </div>
      {labels.length === 0
        ? <p className="text-xs text-gray-500 text-center py-2">{lang === 'GEO' ? 'ლეიბლები არ არის.' : 'No labels yet.'}</p>
        : (
          <div className="space-y-1.5">
            {labels.map(l => (
              <div key={l.id}
                className={`rounded-xl border px-3 py-2 flex items-center gap-2.5 cursor-pointer transition-colors ${selected === l.id ? 'border-white/20 bg-white/[0.05]' : 'border-white/[0.08] hover:bg-white/[0.03]'}`}
                onClick={() => selectLabel(l.id)}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="flex-1 text-xs text-white">{l.name}</span>
                <button onClick={e => { e.stopPropagation(); del(l.id); }}
                  className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>
              </div>
            ))}
          </div>
        )
      }
      {selected && selectedLabel && (
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <p className="text-xs text-gray-500 font-medium pt-1">
            {lang === 'GEO' ? `„${selectedLabel.name}" ჩანაწერები` : `"${selectedLabel.name}" entries`}
          </p>
          {notes.length === 0 && diary.length === 0
            ? <p className="text-xs text-gray-600 text-center py-2">{lang === 'GEO' ? 'ჩანაწერები არ არის.' : 'No entries with this label.'}</p>
            : (
              <>
                {notes.map(n => (
                  <div key={`n-${n.id}`} className="rounded-xl border border-white/[0.08] px-3 py-2">
                    <p className="text-xs font-medium text-white">{n.title || (lang === 'GEO' ? 'სათაური არ არის' : 'Untitled')}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{n.content.slice(0, 80)}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{new Date(n.updated_at).toLocaleDateString()}</p>
                  </div>
                ))}
                {diary.map(e => (
                  <div key={`d-${e.id}`} className="rounded-xl border border-white/[0.08] px-3 py-2 flex gap-2 items-start">
                    <span className="text-base flex-shrink-0">{e.mood || '📝'}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 truncate">{e.practiced.slice(0, 70)}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </>
            )
          }
        </div>
      )}
    </div>
  );
}

function StudentReportAbsencePanel({ lang }) {
  const [group, setGroup] = useState(STUDENT_GROUPS[0]);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() { if (reason.trim()) { setSubmitted(true); setReason(''); setTimeout(() => setSubmitted(false), 3000); } }

  return (
    <div className="space-y-3">
      <select value={group} onChange={e => setGroup(e.target.value)} style={{ colorScheme: 'dark' }}
        className={`${FIELD} cursor-pointer`}>
        {STUDENT_GROUPS.map(g => <option key={g}>{g}</option>)}
      </select>
      <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
        placeholder={lang === 'GEO' ? 'გაცდენის მიზეზი...' : 'Reason for absence…'} className={FIELD} />
      {submitted
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ მასწავლებელს გაეგზავნა' : '✅ Sent to your teacher'}</p>
        : <button onClick={submit} disabled={!reason.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'გაცდენის შეტყობინება' : 'Report Absence'}
          </button>
      }
    </div>
  );
}

function StudentReportEventAbsencePanel({ lang }) {
  const [event, setEvent] = useState(INIT_EVENTS[0]?.name ?? '');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() { if (reason.trim()) { setSubmitted(true); setReason(''); setTimeout(() => setSubmitted(false), 3000); } }

  return (
    <div className="space-y-3">
      <select value={event} onChange={e => setEvent(e.target.value)} style={{ colorScheme: 'dark' }}
        className={`${FIELD} cursor-pointer`}>
        {INIT_EVENTS.map(ev => <option key={ev.id}>{ev.name}</option>)}
      </select>
      <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
        placeholder={lang === 'GEO' ? 'გაცდენის მიზეზი...' : 'Reason for absence…'} className={FIELD} />
      {submitted
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ ასისტენტს გაეგზავნა' : '✅ Sent to assistant'}</p>
        : <button onClick={submit} disabled={!reason.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოხსენების გაგზავნა' : 'Submit Report'}
          </button>
      }
    </div>
  );
}

function StudentReportExamAbsencePanel({ lang }) {
  const [subject, setSubject] = useState(STUDENT_ENROLLED[0]);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() { if (reason.trim()) { setSubmitted(true); setReason(''); setTimeout(() => setSubmitted(false), 3000); } }

  return (
    <div className="space-y-3">
      <select value={subject} onChange={e => setSubject(e.target.value)} style={{ colorScheme: 'dark' }}
        className={`${FIELD} cursor-pointer`}>
        {STUDENT_ENROLLED.map(s => <option key={s}>{s}</option>)}
      </select>
      <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
        placeholder={lang === 'GEO' ? 'გაცდენის მიზეზი...' : 'Reason for absence…'} className={FIELD} />
      {submitted
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ ასისტენტს გაეგზავნა' : '✅ Sent to assistant'}</p>
        : <button onClick={submit} disabled={!reason.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოხსენების გაგზავნა' : 'Submit Report'}
          </button>
      }
    </div>
  );
}

function StudentChangeGroupPanel({ lang }) {
  const [allGroups, setAllGroups] = useState([]);
  const [allSchedule, setAllSchedule] = useState([]);
  const [currentGroups, setCurrentGroups] = useState([]);
  const [fromGroup, setFromGroup] = useState(null);
  const [toGroup, setToGroup] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    Promise.all([
      fetch('/api/school/groups',   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([gd, sd, sched]) => {
      const groups = gd.groups || [];
      const myGroups = sd.schedule || [];
      setAllGroups(groups);
      const uniqueGroups = [];
      const seenIds = new Set();
      myGroups.forEach(g => {
        if (!seenIds.has(g.group_id)) {
          seenIds.add(g.group_id);
          uniqueGroups.push(g);
        }
      });
      setCurrentGroups(uniqueGroups);
      setAllSchedule(sched.schedule || []);
      if (myGroups.length) {
        const first = myGroups[0];
        setFromGroup(first);
        const sameSubject = groups.filter(g => g.subject_id === first.subject_id && g.id !== first.group_id);
        if (sameSubject.length) setToGroup(sameSubject[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function onFromChange(groupId) {
    const selected = currentGroups.find(g => String(g.group_id) === String(groupId));
    setFromGroup(selected);
    const sameSubject = allGroups.filter(g => g.subject_id === selected.subject_id && g.id !== selected.group_id);
    setToGroup(sameSubject.length ? sameSubject[0].id : '');
  }

  const availableTo = fromGroup ? allGroups.filter(g => g.subject_id === fromGroup.subject_id && g.id !== fromGroup.group_id) : [];

  async function submit() {
    console.log('submit clicked');
    if (pendingRequests.length >= 3) return;
    if (!toGroup) return;
    setErr('');
    const token = localStorage.getItem('sherlock_token');
    console.log('before fetch /api/school/web-registrations', { group_id: toGroup, token: token ? 'present' : 'missing' });
    const res = await fetch('/api/school/web-registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: toGroup, request_type: 'change' })
    });
    console.log('after fetch status:', res.status);
    if (!res.ok) {
      const data = await res.json();
      setErr(data.error || `Error ${res.status}`);
      return;
    }
    const group = availableTo.find(g => String(g.id) === String(toGroup));
    setPendingRequests(prev => [...prev, group ? group.name : toGroup]);

    const newCurrentGroups = currentGroups.filter(g => g.group_id !== fromGroup.group_id);
    const newAllGroups = allGroups.filter(g => g.id !== parseInt(toGroup));
    setCurrentGroups(newCurrentGroups);
    setAllGroups(newAllGroups);

    if (newCurrentGroups.length) {
      const nextFrom = newCurrentGroups[0];
      setFromGroup(nextFrom);
      const nextAvailable = newAllGroups.filter(g => g.subject_id === nextFrom.subject_id && g.id !== nextFrom.group_id);
      setToGroup(nextAvailable.length ? nextAvailable[0].id : '');
    } else {
      setFromGroup(null);
      setToGroup('');
    }
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'გადასვლა ამ ჯგუფიდან' : 'Transfer from'}</p>
        <select value={fromGroup?.group_id || ''} onChange={e => onFromChange(e.target.value)}
          style={{ colorScheme: 'dark', background: '#1a1a2e', color: 'white' }}
          className={`${FIELD} cursor-pointer`}>
          {currentGroups.map(g => <option key={g.group_id} value={g.group_id} style={{ background: '#1a1a2e', color: 'white' }}>{g.group_name} ({g.subject_name})</option>)}
        </select>
        {allSchedule.filter(s => s.group_id === fromGroup?.group_id).map((s, i) => (
          <p key={i} className="text-xs text-gray-500 ml-1">{DAYS_GEO[s.day_of_week]} · {s.lesson_time}</p>
        ))}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'გადასვლა ამ ჯგუფში' : 'Transfer to'}</p>
        {availableTo.length === 0
          ? <p className="text-xs text-gray-500">{lang === 'GEO' ? 'სხვა ჯგუფი არ არის ამ საგანში' : 'No other groups in this subject'}</p>
          : <select value={toGroup} onChange={e => setToGroup(e.target.value)}
              style={{ colorScheme: 'dark', background: '#1a1a2e', color: 'white' }}
              className={`${FIELD} cursor-pointer`}>
              {availableTo.map(g => <option key={g.id} value={g.id} style={{ background: '#1a1a2e', color: 'white' }}>{g.name}</option>)}
            </select>
        }
        {toGroup && allSchedule.filter(s => s.group_id === parseInt(toGroup)).map((s, i) => (
          <p key={i} className="text-xs text-gray-500 ml-1">{DAYS_GEO[s.day_of_week]} · {s.lesson_time}</p>
        ))}
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {pendingRequests.map((name, i) => (
        <p key={i} className="text-yellow-400 text-xs">⏳ {lang === 'GEO' ? `განხილვაშია: ${name}` : `Pending: ${name}`}</p>
      ))}
      {pendingRequests.length >= 3 && <p className="text-xs text-gray-500">{lang === 'GEO' ? 'მაქსიმუმ 3 მოთხოვნა სესიაში.' : 'Maximum 3 requests per session.'}</p>}
      <button onClick={submit} disabled={pendingRequests.length >= 3 || !toGroup || availableTo.length === 0}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
        {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
      </button>
    </div>
  );
}

function StudentAddSubjectPanel({ lang }) {
  const [subjects, setSubjects] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [allSchedule, setAllSchedule] = useState([]);
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [subject, setSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    Promise.all([
      fetch('/api/school/subjects',    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/groups',      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/schedule',    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([sd, gd, sc, sched]) => {
      const available = sd.subjects || [];
      const groups = gd.groups || [];
      const enrolledGroupIds = (sc.schedule || []).map(s => s.group_id);
      const mySubjectNames = [...new Set((sc.schedule || []).map(s => s.subject_name))];
      setMyGroupIds(enrolledGroupIds);
      setEnrolled(mySubjectNames);
      setSubjects(available);
      setAllGroups(groups);
      setAllSchedule(sched.schedule || []);
      if (available.length) {
        const firstSubjectId = available[0].id;
        setSubject(firstSubjectId);
        const firstGroups = groups.filter(g => g.subject_id === firstSubjectId && !enrolledGroupIds.includes(g.id));
        if (firstGroups.length) setSelectedGroup(firstGroups[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function onSubjectChange(subjectId) {
    setSubject(subjectId);
    const available = allGroups.filter(g => String(g.subject_id) === String(subjectId) && !myGroupIds.includes(g.id));
    setSelectedGroup(available.length ? available[0].id : '');
  }

  const groupsForSubject = allGroups.filter(g => String(g.subject_id) === String(subject) && !myGroupIds.includes(g.id));

  async function submit() {
    if (pendingRequests.length >= 3) return;
    if (!selectedGroup) return;
    const token = localStorage.getItem('sherlock_token');
    const res = await fetch('/api/school/web-registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: selectedGroup, request_type: 'add' })
    });
    if (!res.ok) return;
    const group = allGroups.find(g => String(g.id) === String(selectedGroup));
    setPendingRequests(prev => [...prev, group ? group.name : selectedGroup]);
    setMyGroupIds(prev => [...prev, parseInt(selectedGroup)]);
    const available = groupsForSubject.filter(g => String(g.id) !== String(selectedGroup));
    setSelectedGroup(available.length ? available[0].id : '');
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  return (
    <div className="space-y-3">
      {enrolled.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="text-xs text-gray-500 mb-1">{lang === 'GEO' ? 'ამჟამად ჩარიცხული' : 'Currently enrolled'}</p>
          <div className="flex flex-wrap gap-1.5">
            {enrolled.map(s => <span key={s} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>)}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'საგანი' : 'Subject'}</p>
        <select value={subject} onChange={e => onSubjectChange(e.target.value)} style={{ colorScheme: 'dark', background: '#1a1a2e', color: 'white' }} className={`${FIELD} cursor-pointer`}>
          {subjects.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e', color: 'white' }}>{s.name}</option>)}
        </select>
      </div>
      {groupsForSubject.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'ჯგუფი' : 'Group'}</p>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ colorScheme: 'dark', background: '#1a1a2e', color: 'white' }} className={`${FIELD} cursor-pointer`}>
            {groupsForSubject.map(g => <option key={g.id} value={g.id} style={{ background: '#1a1a2e', color: 'white' }}>{g.name}</option>)}
          </select>
          {selectedGroup && allSchedule.filter(s => String(s.group_id) === String(selectedGroup)).map((s, i) => (
            <p key={i} className="text-xs text-gray-400 mt-1">{DAYS_GEO[s.day_of_week]} · {s.lesson_time}</p>
          ))}
        </div>
      )}
      {pendingRequests.map((name, i) => (
        <p key={i} className="text-yellow-400 text-xs">⏳ {lang === 'GEO' ? `განხილვაშია: ${name}` : `Pending: ${name}`}</p>
      ))}
      {pendingRequests.length >= 3 && <p className="text-xs text-gray-500">{lang === 'GEO' ? 'მაქსიმუმ 3 მოთხოვნა სესიაში.' : 'Maximum 3 requests per session.'}</p>}
      <button onClick={submit} disabled={pendingRequests.length >= 3 || !selectedGroup} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
        {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
      </button>
    </div>
  );
}

function StudentRemoveSubjectPanel({ lang }) {
  const [enrolled, setEnrolled] = useState([]);
  const [checked, setChecked] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const groups = {};
        (d.schedule || []).forEach(s => {
          if (!groups[s.group_id]) {
            groups[s.group_id] = { group_id: s.group_id, group_name: s.group_name, subject_name: s.subject_name, times: [] };
          }
          groups[s.group_id].times.push({ day: s.day_of_week, time: s.lesson_time });
        });
        setEnrolled(Object.values(groups));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  function toggle(id) { setChecked(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]); }

  async function submit() {
    if (pendingRequests.length >= 3) return;
    if (!checked.length) return;
    const token = localStorage.getItem('sherlock_token');
    for (const groupId of checked) {
      if (pendingRequests.length >= 3) break;
      await fetch('/api/school/web-registrations/remove-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId })
      });
    }
    const names = enrolled.filter(s => checked.includes(s.group_id)).map(s => `${s.subject_name} — ${s.group_name}`);
    setPendingRequests(prev => [...prev, ...names]);
    setChecked([]);
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{lang === 'GEO' ? 'აირჩიეთ წასაშლელი ჯგუფები' : 'Select groups to remove'}</p>
      <div className="space-y-2">
        {enrolled.map(s => (
          <label key={s.group_id} className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 px-3 py-2 hover:bg-white/[0.03] transition-colors">
            <input type="checkbox" checked={checked.includes(s.group_id)} onChange={() => toggle(s.group_id)} className="accent-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-sm text-white">{s.subject_name} — {s.group_name}</span>
              {s.times.map((t, i) => (
                <p key={i} className="text-xs text-gray-500 ml-1">{DAYS_GEO[t.day]} · {t.time}</p>
              ))}
            </div>
          </label>
        ))}
      </div>
      {pendingRequests.map((name, i) => (
        <p key={i} className="text-yellow-400 text-xs">⏳ {lang === 'GEO' ? `განხილვაშია: ${name}` : `Pending: ${name}`}</p>
      ))}
      {pendingRequests.length >= 3 && <p className="text-xs text-gray-500">{lang === 'GEO' ? 'მაქსიმუმ 3 მოთხოვნა სესიაში.' : 'Maximum 3 requests per session.'}</p>}
      <button onClick={submit} disabled={pendingRequests.length >= 3 || !checked.length} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
        {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
      </button>
    </div>
  );
}

function StudentNotesBoxPanel() {
  return (
    <div className="space-y-2">
      {DEMO_NOTES.map(n => (
        <div key={n.id} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 gap-3">
          <p className="text-xs text-gray-200 leading-relaxed">{n.text}</p>
          <span className="text-xs text-gray-500 flex-shrink-0">{n.date}</span>
        </div>
      ))}
    </div>
  );
}

function StudentSearchPanel({ lang }) {
  const [query, setQuery] = useState('');
  const results = query.trim()
    ? DEMO_NOTES.filter(n => n.text.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={lang === 'GEO' ? 'ჩაწერეთ საძებო სიტყვა...' : 'Search notes...'}
        className={FIELD}
      />
      {query.trim() && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">
              {lang === 'GEO' ? 'ვერაფერი მოიძებნა.' : 'No results found.'}
            </p>
          ) : (
            results.map(n => (
              <div key={n.id} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 gap-3">
                <p className="text-xs text-gray-200 leading-relaxed">{n.text}</p>
                <span className="text-xs text-gray-500 flex-shrink-0">{n.date}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Use panel ─────────────────────────────────────────────────────────────

const AI_MODES = [
  { id: 'focus', label: 'FOCUS', desc: 'Library only. Sherlock answers only from documents you upload. Zero hallucination, maximum control. Cheapest option.', descGeo: 'მხოლოდ ბიბლიოთეკა. შერლოკი პასუხობს მხოლოდ ატვირთული დოკუმენტებიდან. ნულოვანი ჰალუცინაცია, მაქსიმალური კონტროლი. ყველაზე იაფი.' },
  { id: 'smart', label: 'SMART', desc: 'Library + general knowledge. Sherlock uses your documents first, then its own knowledge. Balanced cost.',             descGeo: 'ბიბლიოთეკა + ზოგადი ცოდნა. შერლოკი პირველ რიგში იყენებს თქვენს დოკუმენტებს, შემდეგ საკუთარ ცოდნას. დაბალანსებული ხარჯი.' },
  { id: 'full',  label: 'FULL',  desc: 'Unrestricted. Sherlock can search the web, generate content, answer anything. Most powerful, highest cost.',          descGeo: 'შეუზღუდავი. შერლოკს შეუძლია ინტერნეტ-ძიება, კონტენტის გენერირება, ნებისმიერ კითხვაზე პასუხი. ყველაზე მძლავრი, ყველაზე მაღალი ხარჯი.' },
];

const BORDER_SEL = 'border-violet-500';
const GLOW_COLOR = 'rgba(124,58,237,0.20)';

function AiUsePanel({ role, lang }) {
  const th = TH[role];
  const geo = lang === 'GEO';
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.chat_mode_ceiling) setSelected(d.chat_mode_ceiling); })
      .catch(() => {});
  }, []);

  async function choose(modeId) {
    setSaving(true);
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/settings', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_mode_ceiling: modeId }),
      });
      if (res.ok) { setSelected(modeId); setConfirmed(modeId); }
    } catch {}
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 leading-relaxed">
        {geo
          ? 'როგორც ადმინი, თქვენ აკონტროლებთ რამხელა AI სიმძლავრეს იყენებს თქვენი სკოლა. ეს პირდაპირ გავლენას ახდენს თქვენს API ხარჯებზე.'
          : 'As admin, you control how much AI power your school uses. This directly affects your API costs.'}
      </p>
      <div className="space-y-2">
        {AI_MODES.map(mode => (
          <div
            key={mode.id}
            onClick={() => !saving && choose(mode.id)}
            className={`rounded-xl border p-3 transition-all duration-150 cursor-pointer ${
              selected === mode.id
                ? `${BORDER_SEL} bg-white/[0.06]`
                : `${th.border} bg-white/[0.02] hover:bg-white/[0.04]`
            }`}
            style={selected === mode.id ? { boxShadow: `0 0 18px ${GLOW_COLOR}` } : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold mb-1 ${selected === mode.id ? 'text-violet-300' : 'text-white/80'}`}>{mode.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{geo ? mode.descGeo : mode.desc}</p>
              </div>
              {selected === mode.id && (
                <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border border-violet-500 bg-violet-500/10 text-violet-300">
                  {geo ? 'აქტიური' : 'Active'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {confirmed && (
        <p className="text-xs font-medium text-emerald-400">
          ✓ {geo ? `დაყენებულია: ${confirmed.toUpperCase()}` : `Set to ${confirmed.toUpperCase()}`}
        </p>
      )}
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

export function NotificationBell({ lang }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    if (!token) return;
    fetch('/api/school/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open || !notifications.length) return;
    const token = localStorage.getItem('sherlock_token');
    const timer = setTimeout(() => {
      notifications.forEach(n => {
        fetch(`/api/school/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      });
      setNotifications([]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative text-xs px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors">
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-72 rounded-xl border border-white/15 bg-[#0f0f1a] shadow-2xl z-50 overflow-hidden">
          <p className="text-xs font-semibold text-white/60 px-3 py-2 border-b border-white/[0.06]">
            {lang === 'GEO' ? 'შეტყობინებები' : 'Notifications'}
          </p>
          {notifications.length === 0
            ? <p className="text-xs text-gray-500 px-3 py-3">{lang === 'GEO' ? 'ახალი შეტყობინება არ არის.' : 'No new notifications.'}</p>
            : notifications.map(n => (
              <div key={n.id} className="px-3 py-2.5 border-b border-white/[0.04] last:border-0">
                <p className="text-xs text-white/80 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Panel router ─────────────────────────────────────────────────────────────

function panelContent(role, panel, libraryProps, lang, allMembers, onMembersRefresh) {
  switch (panel) {
    case 'groups':          return <GroupsPanel role={role} lang={lang} />;
    case 'admin-schedule':  return <AdminSchedulePanel lang={lang} />;
    case 'students':        return <StudentsPanel role={role} lang={lang} allMembers={allMembers} onMembersRefresh={onMembersRefresh} />;
    case 'assistants':      return <AssistantsPanel role={role} lang={lang} allMembers={allMembers} onMembersRefresh={onMembersRefresh} />;
    case 'admin-events':    return <AdminEventsPanel lang={lang} />;
    case 'broadcast':       return <BroadcastPanel lang={lang} />;
    case 'admin-announce':
    case 'announce':        return <AnnouncePanel role={role} lang={lang} />;
    case 'invite':          return <InvitePanel role={role} lang={lang} />;
    case 'my-schedule':     return <MySchedulePanel lang={lang} token={localStorage.getItem('sherlock_token')} />;
    case 'my-groups':       return <MyGroupsPanel lang={lang} />;
    case 'share-files':       return <TeacherShareFilesPanel lang={lang} />;
    case 'knowledge-library': return <KnowledgeLibraryPanel role={role} lang={lang} {...(libraryProps ?? {})} />;
    case 'schedule':        return <StudentSchedulePanel lang={lang} />;
    case 'events':          return <StudentEventsPanel />;
    case 'library':         return <StudentLibraryPanel />;
    case 'notes':           return <StudentNotesPanel lang={lang} />;
    case 'practice-diary':  return <StudentPracticeDiaryPanel lang={lang} />;
    case 'labels':          return <StudentLabelsPanel lang={lang} />;
    case 'report-absence':        return <StudentReportAbsencePanel lang={lang} />;
    case 'report-event-absence':  return <StudentReportEventAbsencePanel lang={lang} />;
    case 'report-exam-absence':   return <StudentReportExamAbsencePanel lang={lang} />;
    case 'change-group':    return <StudentChangeGroupPanel lang={lang} />;
    case 'add-subject':     return <StudentAddSubjectPanel lang={lang} />;
    case 'remove-subject':  return <StudentRemoveSubjectPanel lang={lang} />;
    case 'requests':        return <AssistantRequestsPanel lang={lang} />;
    case 'teachers':        return <TeachersPanel role={role} lang={lang} allMembers={allMembers} onMembersRefresh={onMembersRefresh} />;
    case 'subjects':        return <SubjectsPanel role={role} lang={lang} />;
    case 'view-events':     return <AdminViewEventsPanel />;
    case 'add-event':       return <AdminAddEventPanel role={role} lang={lang} />;
    case 'delete-event':    return <AdminDeleteEventPanel lang={lang} />;
    case 'ai-use':          return <AiUsePanel role={role} lang={lang} />;
    default:                return null;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const ROLE_BUTTONS = {
  admin: [
    { id: 'groups',         label: 'Groups'    },
    { id: 'admin-schedule', label: 'Schedule'  },
    { id: 'students',       label: 'Students'  },
    { id: 'admin-events',   label: 'Events'    },
    { id: 'broadcast',      label: 'Broadcast' },
    { id: 'admin-announce', label: 'Announce'  },
    { id: 'invite',         label: 'Invite'    },
  ],
  assistant: [
    { id: 'groups',   label: 'Groups'   },
    { id: 'students', label: 'Students' },
    { id: 'announce', label: 'Announce' },
    { id: 'invite',   label: 'Invite'   },
    { id: 'requests', label: 'Requests' },
  ],
  teacher: [
    { id: 'my-schedule', label: 'My Schedule' },
    { id: 'my-groups',   label: 'My Groups'   },
    { id: 'announce',    label: 'Announce'    },
  ],
  student: [
    { id: 'schedule',       label: 'Schedule'       },
    { id: 'events',         label: 'Events'         },
    { id: 'library',        label: 'Library'        },
    { id: 'notes',          label: 'Notes'          },
    { id: 'practice-diary',  label: 'Practice Diary'  },
    { id: 'report-absence',  label: 'Report Absence'  },
    { id: 'change-group',    label: 'Change Group'    },
    { id: 'add-subject',     label: 'Add Subject'     },
    { id: 'remove-subject',  label: 'Remove Group'  },
  ],
};

export const PANEL_ACTIVE_CLS = {
  admin:     'bg-white/[0.08] text-white border border-white/20',
  assistant: 'bg-white/[0.08] text-white border border-white/20',
  teacher:   'bg-white/[0.08] text-white border border-white/20',
  student:   'bg-white/[0.08] text-white border border-white/20',
};

export function RolePanel({ role, panel, onClose, libraryProps, lang = 'EN', allMembers, onMembersRefresh }) {
  const th = TH[role];
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
        {panelContent(role, panel, libraryProps, lang, allMembers, onMembersRefresh)}
      </div>
    </div>
  );
}
