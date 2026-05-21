import { useState } from 'react';
import { useAuth } from '../AuthContext';

const FIELD_STYLE = {
  width: '100%', padding: '10px 14px', background: '#ffffff',
  border: '1px solid #e5e7eb', borderRadius: '6px',
  color: '#111827', fontSize: '16px', boxSizing: 'border-box', outline: 'none',
  transition: 'border 0.15s ease, box-shadow 0.15s ease',
};

const LABEL_STYLE = {
  color: '#6b7280', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px'
};

const onFieldFocus = e => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; };
const onFieldBlur = e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; };

export default function Signup({ onSwitch, onSuccess }) {
  const { signup } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [form, setForm] = useState({
    schoolName: '', directorName: '', phone: '', website: '',
    email: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isKa = lang === 'ka';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.schoolName, form.email, form.password, '', {
        directorName: form.directorName,
        phone: form.phone,
        website: form.website,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '24px 16px' }}>
      <div style={{ position: 'relative', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '40px', width: '100%', maxWidth: '460px' }}>

        <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
          <option value="en" style={{ background: '#ffffff', color: '#111827' }}>EN</option>
          <option value="ka" style={{ background: '#ffffff', color: '#111827' }}>GEO</option>
        </select>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>S</div>
          <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, margin: 0 }}>{isKa ? 'სკოლის რეგისტრაცია' : 'Register your school'}</h1>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>{isKa ? 'დაიწყეთ Sherlock Is Smart-ის გამოყენება' : 'Start using Sherlock Is Smart'}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'სკოლა / ორგანიზაცია' : 'School / Organization name'} *</label>
            <input required type="text" value={form.schoolName} onChange={set('schoolName')} onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'დირექტორის სახელი' : 'Director full name'} *</label>
            <input required type="text" value={form.directorName} onChange={set('directorName')} onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'ტელეფონი' : 'Phone number'} *</label>
            <input required type="tel" value={form.phone} onChange={set('phone')} onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'ვებსაიტი (არასავალდებულო)' : 'Website (optional)'}</label>
            <input type="url" value={form.website} onChange={set('website')} placeholder="https://" onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '20px 0' }} />

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'მფლობელის ელ-ფოსტა' : 'Owner email'} *</label>
            <input required type="email" value={form.email} onChange={set('email')} onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'პაროლი' : 'Password'} *</label>
            <input required type="password" value={form.password} onChange={set('password')} onFocus={onFieldFocus} onBlur={onFieldBlur} style={FIELD_STYLE} />
          </div>

          <button type="submit" disabled={loading}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.target.style.background = '#2563eb'; }}
            style={{ width: '100%', padding: '10px 14px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.15s ease' }}>
            {loading ? '...' : (isKa ? 'ანგარიშის შექმნა' : 'Create account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
          {isKa ? 'უკვე რეგისტრირებული ხართ?' : 'Already registered?'}{' '}
          <span onClick={onSwitch} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>
            {isKa ? 'შესვლა' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
