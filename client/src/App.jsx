import { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import InviteAccept from './pages/InviteAccept';
import Dashboard from './pages/Dashboard';
import JoinWithCode from './pages/JoinWithCode';
import Chat from './pages/Chat';

const T = {
  EN: {
    sub1: 'AI-powered school management.',
    sub2: 'No code required.',
    getStarted: 'Get Started',
    tryDemo: 'Try Demo',
    featuresTitle: 'Everything your school needs',
    joinWaitlist: 'Join Waitlist',
    emailLabel: 'Email address',
    schoolLabel: 'Organization name',
    typeLabel: 'Industry',
    eventsTitle: 'Upcoming Events',
    scheduleTitle: 'Schedule',
    roleAdmin: 'Admin', roleTeacher: 'Teacher', roleStudent: 'Student',
    chatTitle: 'Try Sherlock',
    chatSubtitle: 'Ask anything. See how it works.',
    thankYou: "You're on the list! We'll be in touch soon.",
  },
  GEO: {
    sub1: 'სასკოლო/სასწავლო ოპერატიული სისტემა ჩაშენებული ხელოვნური ინტელექტით.',
    sub2: '',
    getStarted: 'დაწყება',
    tryDemo: 'სცადე დემო',
    featuresTitle: 'ყველაფერი რაც თქვენს სკოლას სჭირდება',
    joinWaitlist: 'სიაში ჩაწერა',
    emailLabel: 'ელ-ფოსტა',
    schoolLabel: 'ორგანიზაციის სახელი',
    typeLabel: 'ინდუსტრია',
    eventsTitle: 'მომავალი ღონისძიებები',
    scheduleTitle: 'განრიგი',
    roleAdmin: 'ადმინი', roleTeacher: 'მასწავლებელი', roleStudent: 'მოსწავლე',
    chatTitle: 'სცადე შერლოკი',
    chatSubtitle: 'ნებისმიერი კითხვა. ნახეთ როგორ მუშაობს.',
    thankYou: 'თქვენ ჩაეწერეთ! მალე დაგიკავშირდებით.',
  },
};

const DAY_NAMES = {
  EN:  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  GEO: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'],
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function groupSchedule(rows) {
  const map = {};
  const nameKaMap = {};
  for (const row of rows) {
    if (!map[row.group_name]) map[row.group_name] = new Map();
    const key = `${row.day_of_week}-${row.lesson_time}`;
    map[row.group_name].set(key, { day: row.day_of_week, time: row.lesson_time });
    if (row.group_name_ka) nameKaMap[row.group_name] = row.group_name_ka;
  }
  return Object.entries(map).map(([name, slots]) => ({
    name,
    name_ka: nameKaMap[name] || name,
    slots: Array.from(slots.values()).sort((a, b) => a.day - b.day),
  }));
}

const FEATURES = [
  { id: 'chat',     icon: '🤖', EN: { title: 'AI Chat',           desc: 'Ask anything, get instant answers' }, GEO: { title: 'შერლოკის ჩატი',         desc: 'AI-ინტეგრირებული'          } },
  { id: 'schedule', icon: '📅', EN: { title: 'Schedule',          desc: 'Weekly timetable for every group'  }, GEO: { title: 'ცხრილი',                 desc: 'მართე მარტივად'             } },
  { id: 'events',   icon: '🎪', EN: { title: 'Events',            desc: 'Upcoming group and school activities'  }, GEO: { title: 'ღონისძიებები',           desc: 'დაგეგმე/გააზიარე'           } },
  { id: 'notes',    icon: '📒', EN: { title: 'Notes',             desc: 'Lesson notes and practice diary'   }, GEO: { title: 'ჩანაწერები',             desc: 'ჩაინიშნე საგასაღებო სიტყვები'} },
  { id: 'library',  icon: '📚', EN: { title: 'Library',           desc: 'Chords, scales, diagrams'          }, GEO: { title: 'ბიბლიოთეკა',            desc: 'ესაუბრე წიგნებს'            } },
  { id: 'reminders',icon: '🔔', EN: { title: 'Reminders',         desc: 'Automatic lesson reminders'        }, GEO: { title: 'შეხსენებები',            desc: 'არ გამოგრჩეს გაკვეთილი'     } },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function FeatureCarousel({ lang }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridAutoRows: '1fr',
        alignItems: 'stretch',
        gap: 12,
        padding: '4px 4px 12px',
      }}>
        {FEATURES.map(f => (
          <div key={f.id} style={{ height: '100%' }}>
            <div style={{
              background: 'rgba(5, 5, 20, 0.76)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 16,
              padding: '28px 16px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }}>{f.icon}</div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', margin: '8px 0 0' }}>
                {f[lang].title}
              </p>
              <p style={{ color: 'rgb(156,163,175)', fontSize: '0.72rem', margin: '4px 0 0', lineHeight: 1.45 }}>
                {f[lang].desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <FeatureCarousel3D lang={lang} />;
}

function FeatureCarousel3D({ lang }) {
  const progressRef = useRef(0);
  const lastTRef    = useRef(null);
  const pausedRef   = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf;
    function animate(t) {
      if (lastTRef.current !== null && !pausedRef.current) {
        progressRef.current = (progressRef.current + (t - lastTRef.current) / 12000) % 1;
        setTick(progressRef.current);
      }
      lastTRef.current = t;
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const N  = FEATURES.length;
  const RX = 340;
  const RY = 48;

  const items = FEATURES.map((f, i) => {
    const theta   = tick * 2 * Math.PI + (i / N) * 2 * Math.PI;
    const x       = Math.sin(theta) * RX;
    const z       = Math.cos(theta);
    const y       = -z * RY;
    const depth   = (z + 1) / 2;
    const scale   = 0.55 + 0.45 * depth;
    const opacity = 0.35 + 0.65 * depth;
    return { ...f, x, y, scale, opacity, depth };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <div
      style={{ position: 'relative', height: 440, overflow: 'visible' }}
      onMouseEnter={() => { pausedRef.current = true;  }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {items.map(item => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 150,
            transform: `translate(calc(-50% + ${item.x.toFixed(1)}px), calc(-50% + ${item.y.toFixed(1)}px)) scale(${item.scale.toFixed(4)}) translateZ(0)`,
            opacity: item.opacity,
            zIndex: Math.round(item.depth * 20) + 1,
            transition: 'none',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <div style={{
            background:           'rgba(5, 5, 20, 0.76)',
            backdropFilter:       'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border:      `1px solid rgba(99,102,241,${(0.2 + 0.3 * item.depth).toFixed(2)})`,
            borderRadius: 16,
            padding:     '20px 16px',
            textAlign:   'center',
            boxShadow:   `0 8px 28px rgba(0,0,0,0.5), 0 0 ${Math.round(6 + item.depth * 22)}px rgba(99,102,241,${(0.06 + 0.2 * item.depth).toFixed(2)})`,
          }}>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>{item.icon}</div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', margin: '8px 0 0' }}>
              {item[lang].title}
            </p>
            <p style={{ color: 'rgb(156,163,175)', fontSize: '0.72rem', margin: '4px 0 0', lineHeight: 1.45 }}>
              {item[lang].desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const FIELD_CLS =
  'w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors';

function SignupModal({ lang, onClose }) {
  const t = T[lang];
  const [form, setForm] = useState({ email: '', school: '', type: '' });
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'duplicate' | 'error'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, schoolName: form.school, schoolType: form.type }),
      });
      if (res.status === 409) {
        setStatus('duplicate');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setStatus(null);
      setDone(true);
      setTimeout(onClose, 2000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0f0f1a] p-8 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-3xl mb-4">🎉</p>
            <p className="text-white font-medium">{t.thankYou}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <h2 className="text-lg font-bold text-white mb-1">{t.getStarted}</h2>

            <input
              required
              type="email"
              placeholder={t.emailLabel}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={FIELD_CLS}
            />
            <input
              required
              type="text"
              placeholder={t.schoolLabel}
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              className={FIELD_CLS}
            />
            <select
              required
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{ colorScheme: 'dark', backgroundColor: '#1e1e2e', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              className={FIELD_CLS + ' cursor-pointer'}
            >
              <option value="" disabled style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{t.typeLabel}</option>
              <option value="education" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'განათლება / აკადემიური' : 'Education / Academic'}</option>
              <option value="music_arts" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'მუსიკა და ხელოვნება' : 'Music & Arts'}</option>
              <option value="sports_fitness" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'სპორტი და ფიტნესი' : 'Sports & Fitness'}</option>
              <option value="dance_performing" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'ცეკვა და სასცენო ხელოვნება' : 'Dance & Performing Arts'}</option>
              <option value="language" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'ენების სკოლა' : 'Language School'}</option>
              <option value="therapy_wellness" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'თერაპია და ჯანმრთელობა' : 'Therapy & Wellness'}</option>
              <option value="tutoring_coaching" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'რეპეტიტორი ან ქოუჩი' : 'Tutoring & Coaching'}</option>
              <option value="other" style={{ backgroundColor: '#1e1e2e', color: 'white' }}>{lang === 'GEO' ? 'სხვა' : 'Other'}</option>
            </select>

            {status === 'duplicate' && (
              <p className="text-sm text-red-400">
                {lang === 'GEO' ? 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.' : 'This email is already registered.'}
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-400">
                {lang === 'GEO' ? 'შეცდომა. სცადეთ თავიდან.' : 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-1 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              {status === 'loading' ? '…' : t.joinWaitlist}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


function AppInner() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  const [lang, setLang] = useState(() => localStorage.getItem('sherlock_lang') || 'EN');
  const [modalOpen, setModalOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const isMobile = useIsMobile();
  const [viewportHeight, setViewportHeight] = useState(() => window.visualViewport?.height || window.innerHeight);

  useEffect(() => {
    const handler = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };
    window.visualViewport?.addEventListener('resize', handler);
    window.visualViewport?.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
    handler();
    return () => {
      window.visualViewport?.removeEventListener('resize', handler);
      window.visualViewport?.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);
  const t = T[lang];

  const events = [
    { name: 'Year-End Concert',  name_ka: 'წლის შემაჯამებელი კონცერტი', event_date: '2025-06-20T00:00:00.000Z', event_time: '19:00', date_ka: '20 ივნ · 19:00', place: 'Tbilisi Art Hall',  place_ka: 'თბილისი არტ-ჰოლი' },
    { name: 'Summer Workshop',   name_ka: 'საზაფხულო ვორქშოფი',         event_date: '2025-07-15T00:00:00.000Z', event_time: '11:00', date_ka: '15 ივლ · 11:00', place: 'State University', place_ka: 'სახელმწიფო უნივერსიტეტი' },
  ];

  const schedule = groupSchedule([
    { group_name: 'Guitar Beginners', group_name_ka: 'გიტარა დამწყებთათვის', day_of_week: 0, lesson_time: '16:00' },
    { group_name: 'Guitar Beginners', group_name_ka: 'გიტარა დამწყებთათვის', day_of_week: 2, lesson_time: '16:00' },
    { group_name: 'Guitar Advanced',  group_name_ka: 'გიტარა ადვანს დონე',   day_of_week: 1, lesson_time: '17:00' },
    { group_name: 'Guitar Advanced',  group_name_ka: 'გიტარა ადვანს დონე',   day_of_week: 3, lesson_time: '17:00' },
    { group_name: 'Vocals Group I',   group_name_ka: 'ვოკალის ჯგუფი I',      day_of_week: 0, lesson_time: '18:00' },
    { group_name: 'Vocals Group I',   group_name_ka: 'ვოკალის ჯგუფი I',      day_of_week: 4, lesson_time: '18:00' },
    { group_name: 'Band Practice',    group_name_ka: 'ბენდის რეპეტიცია',     day_of_week: 5, lesson_time: '12:00' },
  ]);

  useEffect(() => {
    document.documentElement.lang = lang === 'GEO' ? 'ka' : 'en';
  }, [lang]);

  useEffect(() => {
    if (modalOpen || chatExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [modalOpen, chatExpanded]);
  const inviteToken = window.location.pathname.startsWith("/invite/") ? window.location.pathname.split("/invite/")[1] : null;
  if (loading) return <div style={{ minHeight: "100vh", background: "#0d0d1a" }} />;

  if (inviteToken) return (
    <InviteAccept token={inviteToken} onSuccess={() => window.location.href = '/dashboard'} />
  );

  if (window.location.pathname === '/join') return <JoinWithCode />;

  if (window.location.pathname === '/chat') {
    if (!user) return <Login onSwitch={() => setAuthPage('signup')} onSuccess={() => window.location.href = '/chat'} />;
    return <Chat />;
  }

  if (window.location.pathname === '/dashboard' || window.location.pathname === '/app') {
    if (!user) return null;
    return <Dashboard />;
  }

  if (user && (window.location.pathname === "/" || window.location.pathname === "")) { window.location.href = "/dashboard"; return null; }

  if (!user) return (
    authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('signup')} onSuccess={() => window.location.href = '/dashboard'} />
      : <Signup onSwitch={() => setAuthPage('login')} onSuccess={() => window.location.href = '/dashboard'} />
  );

  return (
    <div
      className="min-h-screen text-white"
      style={{
        overflowX: 'hidden',
        maxWidth: '100vw',
        position: 'relative',
      }}
    >
      {/* Dark overlay for readability */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

      {modalOpen && (
        <SignupModal lang={lang} onClose={closeModal} />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08080f]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <span className="text-base font-bold tracking-tight">
            Sherlock Is Smart
          </span>
          <button
            onClick={() => setLang((l) => { const next = l === 'EN' ? 'GEO' : 'EN'; localStorage.setItem('sherlock_lang', next); return next; })}
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-gray-400 hover:border-white/40 hover:text-white transition-colors duration-200"
          >
            {lang === 'EN' ? 'GEO' : 'EN'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-28 pb-32 text-center">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />

        <div className="relative w-full text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-white via-gray-100 to-gray-500 bg-clip-text text-transparent leading-tight">
            Sherlock Is Smart
          </h1>

          <p className="mt-5 max-w-xl mx-auto text-lg text-gray-400 leading-relaxed">
            {t.sub1}{' '}
            <span className="text-gray-300">{t.sub2}</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl border border-white/15 px-7 py-3 text-sm font-semibold text-gray-300 hover:border-white/30 hover:text-white active:scale-95 transition-all duration-150"
            >
              {t.getStarted}
            </button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all duration-150 shadow-lg shadow-indigo-900/40"
            >
              {t.tryDemo}
            </button>
          </div>
        </div>
      </section>

      {/* Features — 3D carousel */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-4">
        <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Noto Sans Georgian', sans-serif" }}>
          {t.featuresTitle}
        </h2>
        <FeatureCarousel lang={lang} />
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-10">
            {t.eventsTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 flex flex-col gap-3">
                <p className="font-semibold text-white">{lang === 'GEO' ? ev.name_ka : ev.name}</p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>📅 {lang === 'GEO' ? ev.date_ka : `${formatDate(ev.event_date)} · ${ev.event_time}`}</p>
                  <p>📍 {lang === 'GEO' ? ev.place_ka : ev.place}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      {schedule.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-10">
            {t.scheduleTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((group) => (
              <div key={group.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
                <p className="font-semibold text-white text-sm mb-4">
                  {lang === 'GEO' ? group.name_ka : group.name.replace(/_/g, ' ')}
                </p>
                <div className="space-y-2">
                  {group.slots.map((slot, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-400">{DAY_NAMES[lang][slot.day]}</span>
                      <span className="text-gray-300 font-medium tabular-nums">{slot.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Demo / Chat */}
      <section id="demo" className="pb-8">
        {isMobile ? (
          <>
            {/* Mobile compact preview card */}
            {!chatExpanded && (
              <div style={{ padding: '16px' }}>
                <div style={{
                  background: 'rgba(5,5,20,0.82)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  borderRadius: 20,
                  padding: '28px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: 12 }}>🕵️</div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 6px' }}>
                    {t.chatTitle}
                  </p>
                  <p style={{ color: 'rgb(156,163,175)', fontSize: '0.85rem', margin: '0 0 20px' }}>
                    {t.chatSubtitle}
                  </p>
                  <button
                    onClick={() => setChatExpanded(true)}
                    style={{
                      background: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 28px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            )}

            {/* Mobile fullscreen overlay */}
            {chatExpanded && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: `${viewportHeight}px`,
                maxHeight: `${viewportHeight}px`,
                transition: 'height 0.1s ease',
                zIndex: 9999,
                background: '#0d0d18',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}>
                <div style={{
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0',
                }}>
                  <ChatWindow lang={lang} mobile={true} onClose={() => setChatExpanded(false)} />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto max-w-6xl px-6 pt-4 pb-6 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t.chatTitle}
              </h2>
              <p className="mt-3 text-gray-400">{t.chatSubtitle}</p>
            </div>
            <div className="mx-auto max-w-2xl px-4">
              <ChatWindow lang={lang} />
            </div>
          </>
        )}
      </section>

      {/* Quote */}
      <section className="border-t border-white/[0.06] pt-14 pb-16">
        <div className="mx-auto max-w-[700px] px-8 text-center">
          <div className="text-7xl leading-none text-purple-500/30 font-serif mb-6 select-none">&ldquo;</div>
          <p className="italic text-lg leading-loose text-gray-400">
            {lang === 'GEO'
              ? 'ჩემი წარმოდგენით, ადამიანის ტვინი პატარა ცარიელ სხვენს ჰგავს, რომელიც თქვენი შეხედულებისამებრ შეგიძლიათ მოაწყოთ. ბრიყვი იქ, რაც ხელში მოხვდება, ყველანაირ ხარახურას შეზიდავს, და ბოლოს, სასარგებლო ნივთებისთვის ადგილი აღარ დარჩება ან, უკეთეს შემთხვევაში, ვეღარაფრით მიაგნებს. აი, გონიერი კაცი კი საფუძვლიანად არჩევს იმას, რაც მის ტვინის სხვენში ადგილს იმსახურებს.'
              : <>I consider that a man&rsquo;s brain originally is like a little empty attic, and you have to stock it with such furniture as you choose. A fool takes in all the lumber of every sort that he comes across, so that the knowledge which might be useful to him gets crowded out, or at best is jumbled up with a lot of other things, so that he has a difficulty in laying his hands upon it. Now the skilful workman is very careful indeed as to what he takes into his brain-attic.</>}
          </p>
          <p className="mt-6 text-sm text-gray-600 not-italic tracking-wide">
            {lang === 'GEO'
              ? <>— ართურ კონან დოილი, <em className="text-gray-500">ალისფერი კვალი</em> (1887) &middot; შერლოკ ჰოლმსი</>
              : <>&mdash; Arthur Conan Doyle, <em className="text-gray-500">A Study in Scarlet</em> (1887) &middot; Sherlock Holmes</>}
          </p>
        </div>
      </section>

      </div>{/* end relative z-index:1 wrapper */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
