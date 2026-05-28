import { useState } from 'react';
import { useAuth } from '../AuthContext';
import AuthShell from '../components/AuthShell';

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
    schoolName: '', directorName: '', website: '',
    email: '', password: '',
    tosAccepted: false, minorConsentAttested: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isKa = lang === 'ka';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.tosAccepted) {
      setError(isKa
        ? 'უნდა დაეთანხმოთ მომსახურების პირობებსა და კონფიდენციალურობის პოლიტიკას.'
        : 'You must agree to the Terms and Privacy Policy.');
      return;
    }
    if (!form.minorConsentAttested) {
      setError(isKa
        ? 'უნდა დაადასტუროთ მშობლის თანხმობა 16 წელზე ნაკლები ასაკის მოსწავლეებისთვის.'
        : 'You must confirm parental consent for under-16 students.');
      return;
    }
    setLoading(true);
    try {
      const result = await signup(form.schoolName, form.email, form.password, '', {
        directorName: form.directorName,
        website: form.website,
        tos_accepted: true,
        minor_consent_attested: true,
      });
      if (result?.verification_required) {
        window.location.href = `/check-your-email?email=${encodeURIComponent(result.email)}`;
        return;
      }
      onSuccess();
    } catch (err) {
      if (err.recently_deleted && err.available_at) {
        const date = err.available_at.slice(0, 10);
        setError(isKa
          ? `ეს ელ-ფოსტა ცოტა ხნის წინ წაშლილ ანგარიშს ეკუთვნის. ხელახლა გამოყენებადი იქნება ${date}-დან.`
          : `This email belongs to a recently deleted account. It becomes available again on ${date}.`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <AuthShell>

        <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('sherlock_lang', e.target.value); }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', padding: '8px 12px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
          <option value="en" style={{ background: '#ffffff', color: '#111827' }}>EN</option>
          <option value="ka" style={{ background: '#ffffff', color: '#111827' }}>GEO</option>
        </select>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Arbutus Slab', serif", fontWeight: 400, fontSize: '32px', color: '#111827', margin: 0 }}>{isKa ? 'სკოლის რეგისტრაცია' : 'Register your school'}</h1>
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

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', color: '#374151', fontSize: '14px', lineHeight: 1.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.tosAccepted}
              onChange={e => setForm(f => ({ ...f, tosAccepted: e.target.checked }))}
              style={{ marginTop: '3px', flexShrink: 0, cursor: 'pointer' }}
            />
            <span>
              {isKa ? (
                <>ვეთანხმები <a href="/terms" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'underline' }}>მომსახურების პირობებს</a> და <a href="/privacy" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'underline' }}>კონფიდენციალურობის პოლიტიკას</a>.</>
              ) : (
                <>I agree to the <a href="/terms" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'underline' }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'underline' }}>Privacy Policy</a>.</>
              )}
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px', color: '#374151', fontSize: '14px', lineHeight: 1.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.minorConsentAttested}
              onChange={e => setForm(f => ({ ...f, minorConsentAttested: e.target.checked }))}
              style={{ marginTop: '3px', flexShrink: 0, cursor: 'pointer' }}
            />
            <span>
              {isKa
                ? 'ვადასტურებ, რომ ყველა 16 წელზე ნაკლები ასაკის მოსწავლისთვის, რომელსაც დავამატებ, მაქვს მშობლის ან მეურვის გადამოწმებადი თანხმობა მათი მონაცემების დამუშავებაზე.'
                : 'I confirm that for every student under 16 I add, I have obtained verifiable parental or guardian consent for processing their data.'}
            </span>
          </label>

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
    </AuthShell>
  );
}
