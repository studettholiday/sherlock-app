import { useState } from 'react';

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(''); // '' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg('Passwords do not match'); return; }
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters'); return; }
    setErrorMsg('');
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong'); setStatus('error'); return; }
      setStatus('success');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: 'white'
          }}>S</div>
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>Reset your password</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>Enter your new password below.</p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#4ade80', fontSize: '14px', marginBottom: '12px' }}>Password reset successfully! Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!token && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
                Invalid or missing reset token. Please request a new password reset link.
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>New password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Confirm password</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
                {errorMsg}
              </div>
            )}
            <button type="submit" disabled={status === 'loading' || !token} style={{
              width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px',
              fontWeight: '600', cursor: (status === 'loading' || !token) ? 'not-allowed' : 'pointer', opacity: (status === 'loading' || !token) ? 0.7 : 1
            }}>
              {status === 'loading' ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          <a href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: '600' }}>Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
