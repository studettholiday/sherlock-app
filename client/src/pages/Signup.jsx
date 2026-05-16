import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Signup({ onSwitch, onSuccess }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({ schoolName: '', email: '', password: '', apiKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.schoolName, form.email, form.password, form.apiKey);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: 'white'
          }}>S</div>
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>Register your school</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>Start using Sherlock Is Smart</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { key: 'schoolName', label: 'School / Organization name', type: 'text', required: true },
            { key: 'email', label: 'Admin email', type: 'email', required: true },
            { key: 'password', label: 'Password', type: 'password', required: true },
            { key: 'apiKey', label: 'Anthropic API key (optional — can add later)', type: 'text', required: false }
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>{field.label}</label>
              <input
                type={field.type} value={form[field.key]} required={field.required}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          ))}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '20px' }}>
            You pay for AI directly using your own key. We never touch your budget.
          </p>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Already registered?{' '}
          <span onClick={onSwitch} style={{ color: '#7c3aed', cursor: 'pointer', fontWeight: '600' }}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
