import { useState, useEffect } from 'react';

const GEO_DAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

function getToken() {
  return localStorage.getItem('sherlock_token');
}

async function apiFetch(path) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${getToken()}` } });
  return res.json();
}

export default function ChooseClasses() {
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState({});
  const [schedules, setSchedules] = useState({});
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [selectedGroups, setSelectedGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const subData = await apiFetch('/api/school/subjects');
        const subs = subData.subjects || [];
        setSubjects(subs);
        const groupMap = {};
        const schedMap = {};
        for (const s of subs) {
          const gd = await apiFetch(`/api/school/groups?subject_id=${s.id}`);
          const grps = gd.groups || [];
          groupMap[s.id] = grps;
          for (const g of grps) {
            const sd = await apiFetch(`/api/school/schedule?group_id=${g.id}`);
            schedMap[g.id] = sd.schedule || [];
          }
        }
        setGroups(groupMap);
        setSchedules(schedMap);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => { window.location.href = '/pending'; }, 3000);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  const advance = async (groupId) => {
    const subject = subjects[subjectIdx];
    const updated = groupId
      ? { ...selectedGroups, [subject.id]: groupId }
      : selectedGroups;

    const isLast = subjectIdx === subjects.length - 1;
    if (isLast) {
      const groupIds = Object.values(updated).filter(Boolean);
      if (groupIds.length === 0) {
        window.location.href = '/dashboard';
        return;
      }
      setSubmitting(true);
      setError('');
      try {
        const res = await fetch('/api/school/web-registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ group_ids: groupIds }),
        });
        if (!res.ok) throw new Error('Submit failed');
        setSubmitted(true);
      } catch {
        setError('Failed to submit. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (groupId) setSelectedGroups(updated);
      setSubjectIdx(prev => prev + 1);
    }
  };

  const wrap = {
    minHeight: '100vh',
    background: '#0d0d1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const card = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '40px',
    maxWidth: 560,
    width: '100%',
  };

  const primaryBtn = {
    padding: '12px 28px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
  };

  const skipBtn = {
    padding: '12px 28px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>Loading…</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 12px' }}>Request Sent!</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            Your class selection is being reviewed. You will receive access once approved.
          </p>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>No subjects available at this time.</p>
        </div>
      </div>
    );
  }

  const subject = subjects[subjectIdx];
  const currentGroups = groups[subject.id] || [];
  const selectedGroupId = selectedGroups[subject.id];
  const isLast = subjectIdx === subjects.length - 1;

  return (
    <div style={wrap}>
      <div style={card}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {subjects.map((_, i) => (
              <div key={i} style={{
                width: i === subjectIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i < subjectIdx
                  ? 'rgba(124,58,237,0.6)'
                  : i === subjectIdx
                    ? '#7c3aed'
                    : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
            {subjectIdx + 1} / {subjects.length}
          </span>
        </div>

        {/* Subject header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{subject.emoji || '📚'}</div>
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px' }}>
            {subject.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>
            Choose a group
          </p>
        </div>

        {error && (
          <p style={{ color: '#f87171', marginBottom: 16, fontSize: '0.875rem' }}>{error}</p>
        )}

        {/* Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {currentGroups.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', margin: 0 }}>
              No groups available for this subject
            </p>
          ) : (
            currentGroups.map(g => {
              const slots = schedules[g.id] || [];
              const selected = selectedGroupId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => advance(g.id)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: selected ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                    background: selected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'border-color 0.15s, background 0.15s',
                    width: '100%',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{g.name}</div>
                    {slots.length > 0 && (
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 4 }}>
                        {slots.map(sl => {
                          const dayIdx = parseInt(sl.day_of_week);
                          const dayName = !isNaN(dayIdx) ? (GEO_DAYS[dayIdx] || sl.day_of_week) : sl.day_of_week;
                          return `${dayName} ${sl.lesson_time}`;
                        }).join('  ·  ')}
                      </div>
                    )}
                  </div>
                  {selected && <div style={{ color: '#7c3aed', fontSize: '1.1rem', flexShrink: 0 }}>✓</div>}
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => advance(null)} style={skipBtn}>
            Skip
          </button>
          {currentGroups.length > 0 && selectedGroupId && (
            <button onClick={() => advance(selectedGroupId)} disabled={submitting} style={primaryBtn}>
              {submitting ? '…' : isLast ? 'Submit →' : 'Next →'}
            </button>
          )}
          {currentGroups.length === 0 && (
            <button onClick={() => advance(null)} style={primaryBtn}>
              {isLast ? 'Submit →' : 'Continue →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
