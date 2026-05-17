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

const DEMO_NOTES = [
  { id: 1, text: 'გიტარის აკორდები — C, Am, F, G', date: '12 მაი' },
  { id: 2, text: 'პრაქტიკა: 30 წუთი სკალები',      date: '11 მაი' },
  { id: 3, text: 'დავალება: ბარე აკორდები',          date: '10 მაი' },
  { id: 4, text: 'გაკვეთილი: რიტმი და ტემპი',       date:  '9 მაი' },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TH = {
  admin:     { border: 'border-purple-500/20', hdr: 'bg-purple-500/10', accent: 'text-purple-400',  btn: 'bg-purple-600 hover:bg-purple-500',   ring: 'focus:ring-purple-500/40',  conf: 'text-purple-400'  },
  assistant: { border: 'border-orange-500/20', hdr: 'bg-orange-500/10', accent: 'text-orange-400',  btn: 'bg-orange-600 hover:bg-orange-500',   ring: 'focus:ring-orange-500/40',  conf: 'text-orange-400'  },
  teacher:   { border: 'border-blue-500/20',   hdr: 'bg-blue-500/10',   accent: 'text-blue-400',    btn: 'bg-blue-600 hover:bg-blue-500',       ring: 'focus:ring-blue-500/40',    conf: 'text-blue-400'    },
  student:   { border: 'border-emerald-500/20',hdr: 'bg-emerald-500/10',accent: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500', ring: 'focus:ring-emerald-500/40', conf: 'text-emerald-400' },
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const FIELD = 'w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none';
const CELL  = 'w-full bg-transparent text-white text-xs outline-none border-b border-transparent focus:border-white/30 py-0.5';

// ─── Panel titles ─────────────────────────────────────────────────────────────

const PANEL_TITLES = {
  'groups':          'Groups',
  'admin-schedule':  'Schedule',
  'students':        'Students',
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
  const [groups, setGroups] = useState(INIT_GROUPS);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  function startEdit(g) { setEditingId(g.id); setDraft(g.name); }
  function saveEdit() {
    if (draft.trim()) setGroups(gs => gs.map(g => g.id === editingId ? { ...g, name: draft.trim() } : g));
    setEditingId(null);
  }
  function addGroup() {
    const id = Date.now();
    setGroups(gs => [...gs, { id, name: 'New Group', count: 0 }]);
    setEditingId(id);
    setDraft('New Group');
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {groups.map(g => (
          <div key={g.id} className={`rounded-xl border ${th.border} p-3 flex items-center gap-2 min-w-0`}>
            {editingId === g.id ? (
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                onBlur={saveEdit}
                className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none border-b border-white/40"
              />
            ) : (
              <span
                className="flex-1 min-w-0 text-xs text-white cursor-pointer hover:opacity-70 truncate"
                onClick={() => startEdit(g)}
                title="Click to edit"
              >{g.name}</span>
            )}
            <span className="text-xs text-gray-600 flex-shrink-0">{g.count}</span>
            <button
              onClick={() => setGroups(gs => gs.filter(x => x.id !== g.id))}
              className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0"
            >✕</button>
          </div>
        ))}
      </div>
      <button
        onClick={addGroup}
        className={`w-full rounded-xl border border-dashed ${th.border} py-2 text-xs text-gray-500 hover:text-white transition-colors`}
      >{lang === 'GEO' ? '+ ჯგუფის დამატება' : '+ Add Group'}</button>
    </div>
  );
}

function AdminSchedulePanel({ lang }) {
  const [rows, setRows] = useState(INIT_SCHEDULE);

  function update(id, col, val) { setRows(rs => rs.map(r => r.id === id ? { ...r, [col]: val } : r)); }
  function addRow() {
    setRows(rs => [...rs, { id: Date.now(), group: 'New Group', day: 'Monday', time: '09:00', subject: 'Subject' }]);
  }

  return (
    <div className="space-y-2">
      <table className="w-full text-xs border-separate border-spacing-y-0.5">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left pb-1.5 font-medium pr-2">{lang === 'GEO' ? 'ჯგუფი' : 'Group'}</th>
            <th className="text-left pb-1.5 font-medium pr-2">{lang === 'GEO' ? 'დღე' : 'Day'}</th>
            <th className="text-left pb-1.5 font-medium pr-2">{lang === 'GEO' ? 'დრო' : 'Time'}</th>
            <th className="text-left pb-1.5 font-medium pr-2">{lang === 'GEO' ? 'საგანი' : 'Subject'}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-white/[0.05]">
              {['group', 'day', 'time', 'subject'].map(col => (
                <td key={col} className="py-1 pr-2">
                  <input value={r[col]} onChange={e => update(r.id, col, e.target.value)} className={CELL} />
                </td>
              ))}
              <td>
                <button onClick={() => setRows(rs => rs.filter(x => x.id !== r.id))} className="text-gray-600 hover:text-red-400">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="text-xs text-gray-500 hover:text-white transition-colors">
        {lang === 'GEO' ? '+ სტრიქონის დამატება' : '+ Add row'}
      </button>
    </div>
  );
}

function StudentsPanel({ role, lang }) {
  const th = TH[role];
  const [students, setStudents] = useState(INIT_STUDENTS);

  function toggle(id) {
    setStudents(ss => ss.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'pending' : 'active' } : s));
  }
  function add() {
    setStudents(ss => [...ss, { id: Date.now(), name: 'New Student', group: ALL_GROUP_NAMES[0], status: 'pending' }]);
  }

  return (
    <div className="space-y-1">
      {students.map(s => (
        <div key={s.id} className={`flex items-center gap-2 py-2 border-b ${th.border}`}>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{s.name}</p>
            <p className="text-xs text-gray-500 truncate">{s.group}</p>
          </div>
          <button
            onClick={() => toggle(s.id)}
            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >{s.status}</button>
          <button
            onClick={() => setStudents(ss => ss.filter(x => x.id !== s.id))}
            className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0"
          >✕</button>
        </div>
      ))}
      <button onClick={add} className="text-xs text-gray-500 hover:text-white transition-colors pt-1">
        {lang === 'GEO' ? '+ სტუდენტის დამატება' : '+ Add student'}
      </button>
    </div>
  );
}

function AdminEventsPanel() {
  const [events, setEvents] = useState(INIT_EVENTS);

  function update(id, field, val) { setEvents(es => es.map(e => e.id === id ? { ...e, [field]: val } : e)); }
  function add() {
    setEvents(es => [...es, { id: Date.now(), name: 'New Event', date: '1 Jan 2026', time: '10:00', place: 'TBD' }]);
  }

  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              value={ev.name}
              onChange={e => update(ev.id, 'name', e.target.value)}
              className="flex-1 bg-transparent text-white text-xs font-medium outline-none border-b border-transparent focus:border-white/30"
            />
            <button onClick={() => setEvents(es => es.filter(e => e.id !== ev.id))} className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0">✕</button>
          </div>
          <div className="flex gap-2">
            <input value={ev.date}  onChange={e => update(ev.id, 'date',  e.target.value)} className="bg-transparent text-gray-400 text-xs outline-none border-b border-transparent focus:border-white/30 w-28" />
            <input value={ev.time}  onChange={e => update(ev.id, 'time',  e.target.value)} className="bg-transparent text-gray-400 text-xs outline-none border-b border-transparent focus:border-white/30 w-14" />
            <input value={ev.place} onChange={e => update(ev.id, 'place', e.target.value)} className="bg-transparent text-gray-400 text-xs outline-none border-b border-transparent focus:border-white/30 flex-1" />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-xs text-gray-500 hover:text-white transition-colors">+ Add event</button>
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
            className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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
  const [sent, setSent] = useState('');

  function send() { if (email.trim()) { setSent(email.trim()); setEmail(''); setTimeout(() => setSent(''), 3000); } }

  return (
    <div className="space-y-3">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={lang === 'GEO' ? 'ელ. ფოსტა' : 'Email address'} className={FIELD} />
      {sent
        ? <p className={`text-sm ${th.conf}`}>{lang === 'GEO' ? `✅ მოწვევა გაიგზავნა: ${sent}!` : `✅ Invitation sent to ${sent}!`}</p>
        : <button onClick={send} disabled={!email.trim()}
            className={`rounded-xl ${th.btn} disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors`}>
            {lang === 'GEO' ? 'მოწვევის გაგზავნა' : 'Send Invitation'}
          </button>
      }
    </div>
  );
}

function SubjectsPanel({ role, lang }) {
  const th = TH[role];
  const [subjects, setSubjects] = useState(['Guitar Basics', 'Music Theory', 'Vocals', 'Band Practice', 'Ear Training']);
  const [draft, setDraft] = useState('');

  function add() { if (draft.trim()) { setSubjects(ss => [...ss, draft.trim()]); setDraft(''); } }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {subjects.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
            <span className="text-sm text-white">{s}</span>
            <button onClick={() => setSubjects(ss => ss.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder={lang === 'GEO' ? 'საგნის დამატება...' : 'Add subject…'} className={`${FIELD} py-1.5`} />
        <button onClick={add} className={`rounded-xl ${th.btn} px-3 py-1.5 text-sm text-white transition-colors`}>+</button>
      </div>
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

function TeachersPanel({ role, lang }) {
  const th = TH[role];
  const [teachers, setTeachers] = useState(INIT_TEACHERS);
  const [name,    setName]    = useState('');
  const [subject, setSubject] = useState('');
  const [added,   setAdded]   = useState(false);

  function add() {
    if (!name.trim() || !subject.trim()) return;
    setTeachers(ts => [...ts, { id: Date.now(), name: name.trim(), subject: subject.trim() }]);
    setName(''); setSubject('');
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  return (
    <div className="space-y-2">
      {teachers.map(t => (
        <div key={t.id} className={`flex items-center justify-between rounded-xl border ${th.border} px-3 py-2`}>
          <div>
            <p className="text-xs text-white font-medium">{t.name}</p>
            <p className="text-xs text-gray-500">{t.subject}</p>
          </div>
          <button onClick={() => setTeachers(ts => ts.filter(x => x.id !== t.id))}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors">
            {lang === 'GEO' ? 'წაშლა' : 'Remove'}
          </button>
        </div>
      ))}
      <div className="pt-1 space-y-2 border-t border-white/[0.06]">
        <div className="flex gap-2 pt-1">
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder={lang === 'GEO' ? 'სახელი' : 'Name'} className={`${FIELD} py-1.5`} />
          <input value={subject} onChange={e => setSubject(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder={lang === 'GEO' ? 'საგანი' : 'Subject'} className={`${FIELD} py-1.5`} />
        </div>
        {added
          ? <p className={`text-sm ${th.conf}`}>{lang === 'GEO' ? '✅ მასწავლებელი დამატებულია!' : '✅ Teacher added!'}</p>
          : <button onClick={add} disabled={!name.trim() || !subject.trim()}
              className={`rounded-xl ${th.btn} disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors`}>
              {lang === 'GEO' ? 'მასწავლებლის დამატება' : 'Add Teacher'}
            </button>
        }
      </div>
    </div>
  );
}

// ─── Teacher panels ───────────────────────────────────────────────────────────

function MySchedulePanel({ lang }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500">
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დღე' : 'Day'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დრო' : 'Time'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'ჯგუფი' : 'Group'}</th>
        </tr>
      </thead>
      <tbody>
        {TEACHER_SCHEDULE.map((r, i) => (
          <tr key={i} className="border-t border-white/[0.05]">
            <td className="py-1.5 text-gray-400">{r.day}</td>
            <td className="py-1.5 text-gray-300 font-mono">{r.time}</td>
            <td className="py-1.5 text-white">{r.group}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MyGroupsPanel({ lang }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TEACHER_GROUPS.map(g => (
        <div key={g.name} className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3">
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
            className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500">
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დღე' : 'Day'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'დრო' : 'Time'}</th>
          <th className="text-left pb-2 font-medium">{lang === 'GEO' ? 'საგანი' : 'Subject'}</th>
        </tr>
      </thead>
      <tbody>
        {STUDENT_SCHEDULE.map((r, i) => (
          <tr key={i} className="border-t border-white/[0.05]">
            <td className="py-1.5 text-gray-400">{r.day}</td>
            <td className="py-1.5 text-gray-300 font-mono">{r.time}</td>
            <td className="py-1.5 text-white">{r.subject}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StudentEventsPanel() {
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

function StudentLibraryPanel() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LIBRARY_CATS.map(c => (
        <div key={c.label} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
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
        <button onClick={add} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-sm text-white transition-colors">+</button>
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
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოხსენების გაგზავნა' : 'Submit Report'}
          </button>
      }
    </div>
  );
}

function StudentChangeGroupPanel({ lang }) {
  const available = ALL_GROUP_NAMES.filter(g => g !== STUDENT_CURRENT_GROUP);
  const [newGroup, setNewGroup] = useState(available[0]);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  function submit() { if (newGroup) { setSent(true); setReason(''); setTimeout(() => setSent(false), 3000); } }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="text-xs text-gray-500">{lang === 'GEO' ? 'მიმდინარე ჯგუფი' : 'Current group'}</p>
        <p className="text-sm text-white font-medium mt-0.5">{STUDENT_CURRENT_GROUP}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'გადასვლის მოთხოვნა' : 'Request transfer to'}</p>
        <select value={newGroup} onChange={e => setNewGroup(e.target.value)} style={{ colorScheme: 'dark' }}
          className={`${FIELD} cursor-pointer`}>
          {available.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
      <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
        placeholder={lang === 'GEO' ? 'გადასვლის მიზეზი (სურვილისამებრ)...' : 'Reason for transfer (optional)…'} className={FIELD} />
      {sent
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ მოთხოვნა გაიგზავნა' : '✅ Request sent to assistant'}</p>
        : <button onClick={submit}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
          </button>
      }
    </div>
  );
}

function StudentAddSubjectPanel({ lang }) {
  const available = ALL_SUBJECTS.filter(s => !STUDENT_ENROLLED.includes(s));
  const [subject, setSubject] = useState(available[0] ?? '');
  const [sent, setSent] = useState(false);

  function submit() { if (subject) { setSent(true); setTimeout(() => setSent(false), 3000); } }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">{lang === 'GEO' ? 'ამჟამად ჩარიცხული' : 'Currently enrolled'}</p>
        <div className="flex flex-wrap gap-1.5">
          {STUDENT_ENROLLED.map(s => (
            <span key={s} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{lang === 'GEO' ? 'დასამატებელი საგანი' : 'Subject to add'}</p>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={{ colorScheme: 'dark' }}
          className={`${FIELD} cursor-pointer`}>
          {available.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {sent
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ მოთხოვნა გაიგზავნა' : '✅ Request sent to assistant'}</p>
        : <button onClick={submit} disabled={!subject}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
            {lang === 'GEO' ? 'მოთხოვნის გაგზავნა' : 'Submit Request'}
          </button>
      }
    </div>
  );
}

function StudentRemoveSubjectPanel({ lang }) {
  const [checked, setChecked] = useState([]);
  const [sent, setSent] = useState(false);

  function toggle(s) { setChecked(cs => cs.includes(s) ? cs.filter(x => x !== s) : [...cs, s]); }
  function submit() { if (checked.length) { setSent(true); setChecked([]); setTimeout(() => setSent(false), 3000); } }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{lang === 'GEO' ? 'აირჩიეთ წასაშლელი საგნები' : 'Select subjects to remove'}</p>
      <div className="space-y-2">
        {STUDENT_ENROLLED.map(s => (
          <label key={s} className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/10 px-3 py-2 hover:bg-white/[0.03] transition-colors">
            <input
              type="checkbox"
              checked={checked.includes(s)}
              onChange={() => toggle(s)}
              className="accent-emerald-500 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-white">{s}</span>
          </label>
        ))}
      </div>
      {sent
        ? <p className="text-emerald-400 text-sm">{lang === 'GEO' ? '✅ მოთხოვნა გაიგზავნა' : '✅ Request sent to assistant'}</p>
        : <button onClick={submit} disabled={!checked.length}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white font-medium transition-colors">
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

const BORDER_SEL = {
  admin:     'border-purple-500',
  assistant: 'border-orange-500',
  teacher:   'border-blue-500',
  student:   'border-emerald-500',
};

const GLOW = {
  admin:     'rgba(168,85,247,0.25)',
  assistant: 'rgba(249,115,22,0.25)',
  teacher:   'rgba(59,130,246,0.25)',
  student:   'rgba(52,211,153,0.25)',
};

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
                ? `${BORDER_SEL[role]} bg-white/[0.06]`
                : `${th.border} bg-white/[0.02] hover:bg-white/[0.04]`
            }`}
            style={selected === mode.id ? { boxShadow: `0 0 18px ${GLOW[role]}` } : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold mb-1 ${selected === mode.id ? th.accent : 'text-white'}`}>{mode.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{geo ? mode.descGeo : mode.desc}</p>
              </div>
              {selected === mode.id && (
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${BORDER_SEL[role]} ${th.hdr} ${th.accent}`}>
                  {geo ? 'აქტიური' : 'Active'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {confirmed && (
        <p className={`text-xs font-medium ${th.conf}`}>
          ✓ {geo ? `დაყენებულია: ${confirmed.toUpperCase()}` : `Set to ${confirmed.toUpperCase()}`}
        </p>
      )}
    </div>
  );
}

// ─── Panel router ─────────────────────────────────────────────────────────────

function panelContent(role, panel, libraryProps, lang) {
  switch (panel) {
    case 'groups':          return <GroupsPanel role={role} lang={lang} />;
    case 'admin-schedule':  return <AdminSchedulePanel lang={lang} />;
    case 'students':        return <StudentsPanel role={role} lang={lang} />;
    case 'admin-events':    return <AdminEventsPanel />;
    case 'broadcast':       return <BroadcastPanel lang={lang} />;
    case 'admin-announce':
    case 'announce':        return <AnnouncePanel role={role} lang={lang} />;
    case 'invite':          return <InvitePanel role={role} lang={lang} />;
    case 'my-schedule':     return <MySchedulePanel lang={lang} />;
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
    case 'teachers':        return <TeachersPanel role={role} lang={lang} />;
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
  admin:     'bg-purple-600 text-white shadow-sm shadow-purple-900/60',
  assistant: 'bg-orange-600 text-white shadow-sm shadow-orange-900/60',
  teacher:   'bg-blue-600 text-white shadow-sm shadow-blue-900/60',
  student:   'bg-emerald-600 text-white shadow-sm shadow-emerald-900/60',
};

export function RolePanel({ role, panel, onClose, libraryProps, lang = 'EN' }) {
  const th = TH[role];
  const orgName = libraryProps?.orgName ?? '';
  const panelTitle = (panel === 'knowledge-library' && lang === 'GEO' && orgName)
    ? `${orgName} ბიბლიოთეკა`
    : getPanelTitle(panel, lang);
  return (
    <div className={`rounded-2xl border ${th.border} bg-[#0d0d18] overflow-hidden flex flex-col max-h-[350px]`}>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${th.border} ${th.hdr} flex-shrink-0`}>
        <span className={`text-sm font-semibold ${th.accent}`}>{panelTitle}</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm leading-none">✕</button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {panelContent(role, panel, libraryProps, lang)}
      </div>
    </div>
  );
}
