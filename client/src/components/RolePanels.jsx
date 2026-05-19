import { useState, useEffect } from 'react';

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
  'remove-subject':  'Remove Subject',
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
  'remove-subject':  'საგნის წაშლა',
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

  async function load() {
    setLoading(true);
    const token = localStorage.getItem('sherlock_token');
    try {
      const res = await fetch('/api/school/web-registrations?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRegs(data.registrations || []);
    } catch {}
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
  if (!regs.length) return (
    <p className="text-xs text-gray-500 text-center py-4">
      {lang === 'GEO' ? 'მოლოდინი მოთხოვნები არ არის.' : 'No pending requests.'}
    </p>
  );

  return (
    <div className="space-y-2">
      {regs.map(r => (
        <div key={r.id} className="rounded-xl border border-white/[0.08] p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{r.user_name || r.user_email}</p>
              <p className="text-xs text-gray-400 truncate">
                {r.subject_name && <span className="text-violet-400">{r.subject_name} — </span>}
                {r.group_name}
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

function StudentNotesPanel({ lang }) {
  const [notes, setNotes] = useState([
    'Practice the G major scale daily',
    'Bring a pick on Tuesday',
  ]);
  const [draft, setDraft] = useState('');

  function add() { if (draft.trim()) { setNotes(ns => [...ns, draft.trim()]); setDraft(''); } }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-white/10 px-3 py-2">
            <p className="flex-1 text-xs text-gray-300">{n}</p>
            <button onClick={() => setNotes(ns => ns.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder={lang === 'GEO' ? 'ჩანაწერის დამატება...' : 'Add a note…'}
          className={`${FIELD} py-1.5`}
        />
        <button onClick={add} className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-sm text-white transition-colors">+</button>
      </div>
    </div>
  );
}

function StudentPracticeDiaryPanel({ lang }) {
  const [mood, setMood] = useState('😊');
  const [what, setWhat] = useState('');
  const [goal, setGoal] = useState('');
  const [saved, setSaved] = useState(false);

  function save() { if (what.trim()) { setSaved(true); setTimeout(() => setSaved(false), 3000); } }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'დღევანდელი განწყობა' : "Today's mood"}</p>
        <div className="flex gap-2">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`text-xl p-1.5 rounded-lg transition-colors ${mood === m ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/[0.05]'}`}
            >{m}</button>
          ))}
        </div>
      </div>
      <textarea rows={2} value={what} onChange={e => setWhat(e.target.value)}
        placeholder={lang === 'GEO' ? 'რას ვარჯიშობდი დღეს?' : 'What did you practice today?'} className={FIELD} />
      <textarea rows={2} value={goal} onChange={e => setGoal(e.target.value)}
        placeholder={lang === 'GEO' ? 'ხვალინდელი მიზანი...' : "Tomorrow's goal…"} className={FIELD} />
      {saved
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ ჩანაწერი შენახულია!' : '✅ Entry saved!'}</p>
        : <button onClick={save} disabled={!what.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'ჩანაწერის შენახვა' : 'Save Entry'}
          </button>
      }
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
  const [currentGroups, setCurrentGroups] = useState([]);
  const [fromGroup, setFromGroup] = useState(null);
  const [toGroup, setToGroup] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    Promise.all([
      fetch('/api/school/groups', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([gd, sd]) => {
      const groups = gd.groups || [];
      const myGroups = sd.schedule || [];
      setAllGroups(groups);
      setCurrentGroups(myGroups);
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
    if (!toGroup) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/web-registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: toGroup })
    });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
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
      </div>
      {sent
        ? <p className="text-emerald-400 text-sm">✅ {lang === 'GEO' ? 'მოთხოვნა გაიგზავნა' : 'Request sent'}</p>
        : <button onClick={submit} disabled={!toGroup || availableTo.length === 0}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
          </button>
      }
    </div>
  );
}

function StudentAddSubjectPanel({ lang }) {
  const [subjects, setSubjects] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [subject, setSubject] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    Promise.all([
      fetch('/api/school/subjects', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([sd, sc]) => {
      const allSubjects = sd.subjects || [];
      const mySubjectNames = (sc.schedule || []).map(s => s.subject_name);
      setEnrolled(mySubjectNames);
      const available = allSubjects.filter(s => !mySubjectNames.includes(s.name));
      setSubjects(available);
      if (available.length) setSubject(available[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function submit() {
    if (!subject) return;
    const token = localStorage.getItem('sherlock_token');
    await fetch('/api/school/web-registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: subject })
    });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">{lang === 'GEO' ? 'ამჟამად ჩარიცხული' : 'Currently enrolled'}</p>
        <div className="flex flex-wrap gap-1.5">
          {enrolled.map(s => <span key={s} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>)}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'დასამატებელი საგანი' : 'Subject to add'}</p>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={{ colorScheme: 'dark', background: '#1a1a2e', color: 'white' }} className={`${FIELD} cursor-pointer`}>
          {subjects.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e', color: 'white' }}>{s.name}</option>)}
        </select>
      </div>
      {sent
        ? <p className="text-emerald-400 text-sm">✅ {lang === 'GEO' ? 'მოთხოვნა გაიგზავნა' : 'Request sent'}</p>
        : <button onClick={submit} disabled={!subject} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
          </button>
      }
    </div>
  );
}

function StudentRemoveSubjectPanel({ lang }) {
  const [enrolled, setEnrolled] = useState([]);
  const [checked, setChecked] = useState([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    fetch('/api/school/my-schedule', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setEnrolled(d.schedule || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  function toggle(id) { setChecked(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]); }

  async function submit() {
    if (!checked.length) return;
    const token = localStorage.getItem('sherlock_token');
    await Promise.all(checked.map(group_id =>
      fetch(`/api/school/web-registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id, action: 'remove' })
      })
    ));
    setSent(true);
    setChecked([]);
    setTimeout(() => setSent(false), 3000);
  }

  if (loading) return <p className="text-xs text-gray-500">Loading…</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{lang === 'GEO' ? 'აირჩიეთ წასაშლელი საგნები' : 'Select subjects to remove'}</p>
      <div className="space-y-2">
        {enrolled.map(s => (
          <label key={s.id} className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/10 px-3 py-2 hover:bg-white/[0.03] transition-colors">
            <input type="checkbox" checked={checked.includes(s.group_id)} onChange={() => toggle(s.group_id)} className="accent-emerald-500 w-4 h-4 flex-shrink-0" />
            <span className="text-sm text-white">{s.subject_name} — {s.group_name}</span>
          </label>
        ))}
      </div>
      {sent
        ? <p className="text-emerald-400 text-sm">✅ {lang === 'GEO' ? 'მოთხოვნა გაიგზავნა' : 'Request sent'}</p>
        : <button onClick={submit} disabled={!checked.length} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
          </button>
      }
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
    case 'notes-box':       return <StudentNotesBoxPanel />;
    case 'search':          return <StudentSearchPanel lang={lang} />;
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
    { id: 'remove-subject',  label: 'Remove Subject'  },
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
      <div className="p-4 overflow-y-auto flex-1">
        {panelContent(role, panel, libraryProps, lang, allMembers, onMembersRefresh)}
      </div>
    </div>
  );
}
