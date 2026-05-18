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
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [groups, setGroups] = useState({});
  const [schedules, setSchedules] = useState({});
  const [selectedGroups, setSelectedGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/school/subjects')
      .then(d => setSubjects(d.subjects || []))
      .catch(() => setError('Failed to load subjects'));
  }, []);

  const toggleSubject = (id) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleToStep2 = async () => {
    setLoading(true);
    setError('');
    try {
      const groupMap = {};
      const scheduleMap = {};
      for (const sid of selectedSubjects) {
        const d = await apiFetch(`/api/school/groups?subject_id=${sid}`);
        const grps = d.groups || [];
        groupMap[sid] = grps;
        for (const g of grps) {
          const sd = await apiFetch(`/api/school/schedule?group_id=${g.id}`);
          scheduleMap[g.id] = sd.schedule || [];
        }
      }
      setGroups(groupMap);
      setSchedules(scheduleMap);
      setStep(2);
    } catch {
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/school/web-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ group_ids: Object.values(selectedGroups) }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setStep(3);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => { window.location.href = '/pending'; }, 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const allGroupsSelected = selectedSubjects.length > 0 &&
    selectedSubjects.every(sid => selectedGroups[sid]);

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
    maxWidth: 640,
    width: '100%',
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: '0 0 8px',
  };

  const subtitleStyle = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    margin: '0 0 32px',
  };

  const primaryBtn = {
    padding: '12px 28px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  const secondaryBtn = {
    padding: '12px 28px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  };

  if (step === 1) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={titleStyle}>Select Your Subjects</h1>
          <p style={subtitleStyle}>Choose the subjects you want to enroll in</p>
          {error && <p style={{ color: '#f87171', marginBottom: 16, fontSize: '0.875rem' }}>{error}</p>}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}>
            {subjects.map(s => {
              const selected = selectedSubjects.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  style={{
                    padding: '24px 16px',
                    borderRadius: 14,
                    border: selected ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                    background: selected ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.emoji || '📚'}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                </button>
              );
            })}
            {subjects.length === 0 && !error && (
              <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1' }}>No subjects available</p>
            )}
          </div>
          {selectedSubjects.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleToStep2} disabled={loading} style={primaryBtn}>
                {loading ? '…' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={titleStyle}>Choose Your Groups</h1>
          <p style={subtitleStyle}>Pick one group per subject</p>
          {error && <p style={{ color: '#f87171', marginBottom: 16, fontSize: '0.875rem' }}>{error}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 32 }}>
            {selectedSubjects.map(sid => {
              const subject = subjects.find(s => s.id === sid);
              const subjectGroups = groups[sid] || [];
              return (
                <div key={sid}>
                  <h3 style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    margin: '0 0 10px',
                  }}>
                    {subject?.emoji} {subject?.name}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subjectGroups.map(g => {
                      const slots = schedules[g.id] || [];
                      const selected = selectedGroups[sid] === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGroups(prev => ({ ...prev, [sid]: g.id }))}
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
                    })}
                    {subjectGroups.length === 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>No groups available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={secondaryBtn}>← Back</button>
            {allGroupsSelected && (
              <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
                {loading ? '…' : 'Submit →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
        <h1 style={titleStyle}>Request Sent!</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
          Your request has been sent! You will be notified when approved.
        </p>
      </div>
    </div>
  );
}
