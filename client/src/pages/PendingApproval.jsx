import { useAuth } from '../AuthContext';

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '48px 40px',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 12px' }}>
          Pending Approval
        </h1>
        <p style={{ color: 'rgb(156,163,175)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 32px' }}>
          Your registration is awaiting approval. You will receive access once your account has been reviewed.
        </p>
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            color: 'rgb(156,163,175)',
            padding: '10px 24px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
