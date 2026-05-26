import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import InviteAccept from './pages/InviteAccept';
import JoinWithCode from './pages/JoinWithCode';
import Chat from './pages/Chat';
import PendingApproval from './pages/PendingApproval';
import ResetPassword from './pages/ResetPassword';
import RecoveryScreen from './pages/RecoveryScreen';

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
    scheduleTitle: 'Schedule',
    roleStudent: 'Student',
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
    scheduleTitle: 'განრიგი',
    roleStudent: 'მოსწავლე',
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
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '8px 0 0' }}>
                {f[lang].title}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: '4px 0 0', lineHeight: 1.45 }}>
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
            background:   '#ffffff',
            border:       '1px solid #e5e7eb',
            borderRadius: 8,
            padding:      '20px 16px',
            textAlign:    'center',
            boxShadow:    '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>{item.icon}</div>
            <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '8px 0 0' }}>
              {item[lang].title}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: '4px 0 0', lineHeight: 1.45 }}>
              {item[lang].desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const FIELD_CLS =
  'w-full rounded-md border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 transition-colors';

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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-[#9ca3af] hover:text-[#111827] transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-3xl mb-4">🎉</p>
            <p className="text-[#111827] font-medium">{t.thankYou}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <h2 className="text-lg font-bold text-[#111827] mb-1">{t.getStarted}</h2>

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
              style={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '8px 12px', fontSize: '14px', borderRadius: '6px' }}
              className="w-full cursor-pointer focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 transition-colors"
            >
              <option value="" disabled style={{ backgroundColor: '#ffffff', color: '#111827' }}>{t.typeLabel}</option>
              <option value="education" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'განათლება / აკადემიური' : 'Education / Academic'}</option>
              <option value="music_arts" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'მუსიკა და ხელოვნება' : 'Music & Arts'}</option>
              <option value="sports_fitness" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'სპორტი და ფიტნესი' : 'Sports & Fitness'}</option>
              <option value="dance_performing" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'ცეკვა და სასცენო ხელოვნება' : 'Dance & Performing Arts'}</option>
              <option value="language" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'ენების სკოლა' : 'Language School'}</option>
              <option value="therapy_wellness" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'თერაპია და ჯანმრთელობა' : 'Therapy & Wellness'}</option>
              <option value="tutoring_coaching" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'რეპეტიტორი ან ქოუჩი' : 'Tutoring & Coaching'}</option>
              <option value="other" style={{ backgroundColor: '#ffffff', color: '#111827' }}>{lang === 'GEO' ? 'სხვა' : 'Other'}</option>
            </select>

            {status === 'duplicate' && (
              <p className="text-sm text-[#dc2626]">
                {lang === 'GEO' ? 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.' : 'This email is already registered.'}
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-[#dc2626]">
                {lang === 'GEO' ? 'შეცდომა. სცადეთ თავიდან.' : 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-1 w-full rounded-md bg-[#2563eb] py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors duration-150 disabled:opacity-50"
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
  // `?signup=1` jumps directly into the signup form (used by RecoveryScreen's
  // "No, complete deletion" branch to send the user to fresh-account creation).
  const initialAuthPage = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signup') === '1'
    ? 'signup' : 'login';
  const [authPage, setAuthPage] = useState(initialAuthPage);
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
  if (loading) return <div style={{ minHeight: "100vh", background: "#ffffff" }} />;

  // Soft-delete recovery takes precedence over all other routing — including
  // invite tokens, /chat, /pending — until the user accepts or cancels.
  if (user?.recovery_required) return <RecoveryScreen />;

  const isPending = user && (
    user.schoolStatus === 'pending' ||
    user.status === 'pending' ||
    (user.role === 'student' && user.registrationStatus === 'pending')
  );

  if (inviteToken) return (
    <InviteAccept token={inviteToken} onSuccess={() => window.location.href = '/chat'} />
  );

  if (window.location.pathname === '/pending') {
    if (!user) return authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('signup')} onSuccess={() => window.location.href = '/chat'} />
      : <Signup onSwitch={() => setAuthPage('login')} onSuccess={() => window.location.href = '/chat'} />;
    return <PendingApproval />;
  }

  if (window.location.pathname === '/join') return <JoinWithCode />;

  if (window.location.pathname === '/reset-password') return <ResetPassword />;

  if (window.location.pathname === '/chat') {
    if (!user) return authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('signup')} onSuccess={() => window.location.href = '/chat'} />
      : <Signup onSwitch={() => setAuthPage('login')} onSuccess={() => window.location.href = '/chat'} />;
    if (isPending) { window.location.replace('/pending'); return <div style={{ minHeight: "100vh", background: "#ffffff" }} />; }
    return <Chat />;
  }

  if (window.location.pathname === '/dashboard' || window.location.pathname === '/app') {
    window.location.replace('/chat');
    return <div style={{ minHeight: "100vh", background: "#ffffff" }} />;
  }

  if (user && (window.location.pathname === "/" || window.location.pathname === "")) {
    if (typeof window !== "undefined") {
      if (isPending) window.location.replace('/pending');
      else window.location.replace('/chat');
    }
    return <div style={{ minHeight: "100vh", background: "#ffffff" }} />;
  }

  if (!user) return (
    authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('signup')} onSuccess={() => window.location.href = '/chat'} />
      : <Signup onSwitch={() => setAuthPage('login')} onSuccess={() => window.location.href = '/chat'} />
  );
  window.location.replace("/chat");
  return <div style={{ minHeight: "100vh", background: "#ffffff" }} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
