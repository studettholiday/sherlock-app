import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import AuthShell from '../components/AuthShell';

export default function PendingApproval() {
  const { user, logout, updateUser } = useAuth();

  const isStudentRegistrationPending = user?.role === 'student' && user?.schoolStatus === 'approved';

  useEffect(() => {
    const checkApproval = async () => {
      const token = localStorage.getItem('sherlock_token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        updateUser(data);
        if (data.role === 'student' && data.schoolStatus === 'approved') {
          if (data.registrationStatus === 'approved') {
            window.location.replace('/dashboard');
          }
        } else if (data.schoolStatus === 'approved') {
          window.location.replace('/dashboard');
        }
      } catch {
        // ignore network errors
      }
    };

    checkApproval();
    const interval = setInterval(checkApproval, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthShell>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: '0 0 12px' }}>
          {isStudentRegistrationPending ? 'Request Sent' : 'Pending Approval'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, margin: '0 0 32px' }}>
          {isStudentRegistrationPending
            ? 'Your class selection is being reviewed. You will receive access once approved.'
            : 'Your registration is awaiting approval. You will receive access once your account has been reviewed.'
          }
        </p>
        <button
          onClick={logout}
          onMouseEnter={e => { e.target.style.background = '#fafafa'; }}
          onMouseLeave={e => { e.target.style.background = '#ffffff'; }}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            color: '#6b7280',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          Sign out
        </button>
    </AuthShell>
  );
}
