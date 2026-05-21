import { useState } from 'react';
import { useAuth } from '../AuthContext';

const FIELD_STYLE = {
  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
  color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
};

const LABEL_STYLE = {
  color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '6px'
};

export default function Signup({ onSwitch, onSuccess }) {
  const { signup } = useAuth();
  const [lang, setLang] = useState(localStorage.getItem('sherlock_lang') || 'en');
  const [form, setForm] = useState({
    schoolName: '', directorName: '', phone: '', website: '',
    email: '', password: '', apiKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isKa = lang === 'ka';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.schoolName, form.email, form.password, form.apiKey, {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 100%)', padding: '24px 16px' }}>
      <div style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '460px' }}>

        <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', padding: '4px 8px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
          <option value="en" style={{ background: '#1a0533' }}>EN</option>
          <option value="ka" style={{ background: '#1a0533' }}>GEO</option>
        </select>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>S</div>
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>{isKa ? 'სკოლის რეგისტრაცია' : 'Register your school'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>{isKa ? 'დაიწყეთ Sherlock Is Smart-ის გამოყენება' : 'Start using Sherlock Is Smart'}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'სკოლა / ორგანიზაცია' : 'School / Organization name'} *</label>
            <input required type="text" value={form.schoolName} onChange={set('schoolName')} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'დირექტორის სახელი' : 'Director full name'} *</label>
            <input required type="text" value={form.directorName} onChange={set('directorName')} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'ტელეფონი' : 'Phone number'} *</label>
            <input required type="tel" value={form.phone} onChange={set('phone')} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'ვებსაიტი (არასავალდებულო)' : 'Website (optional)'}</label>
            <input type="url" value={form.website} onChange={set('website')} placeholder="https://" style={FIELD_STYLE} />
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'მფლობელის ელ-ფოსტა' : 'Owner email'} *</label>
            <input required type="email" value={form.email} onChange={set('email')} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'პაროლი' : 'Password'} *</label>
            <input required type="password" value={form.password} onChange={set('password')} style={FIELD_STYLE} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={LABEL_STYLE}>{isKa ? 'Anthropic API გასაღები (არასავალდებულო)' : 'Anthropic API key (optional — can add later)'}</label>
            <input type="text" value={form.apiKey} onChange={set('apiKey')} style={FIELD_STYLE} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '24px' }}>
            {isKa ? 'თქვენ პირდაპირ იხდით AI-სთვის. ჩვენ არასდროს ვეხებით თქვენს ბიუჯეტს.' : 'You pay for AI directly using your own key. We never touch your budget.'}
          </p>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : (isKa ? 'ანგარიშის შექმნა' : 'Create account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          {isKa ? 'უკვე რეგისტრირებული ხართ?' : 'Already registered?'}{' '}
          <span onClick={onSwitch} style={{ color: '#7c3aed', cursor: 'pointer', fontWeight: '600' }}>
            {isKa ? 'შესვლა' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
