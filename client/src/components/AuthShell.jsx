import { t } from '../i18n';

// Shared shell for every auth-flow page: warm off-white background, a faint
// hand-drawn decorative lines layer, the Sherlock logo centered above, and the
// clean white card. Each auth page passes its card content as `children`.
//
// The brand assets (sherlock-logo.png, lines.webp) have white backgrounds;
// `mix-blend-mode: multiply` drops the white so they sit cleanly on the page.
export default function AuthShell({ children }) {
  const lang = localStorage.getItem('sherlock_lang') || 'en';
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fdfcf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Decorative hand-drawn lines — faint, behind the card */}
        <img
          src="/brand/lines.webp"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 720,
            maxWidth: 'none',
            mixBlendMode: 'multiply',
            opacity: 0.7,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Sherlock logo — clickable, returns to sign-in */}
        <a
          href="/"
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          onFocus={e => { e.currentTarget.style.opacity = '0.85'; }}
          onBlur={e => { e.currentTarget.style.opacity = '1'; }}
          style={{
            position: 'relative',
            zIndex: 1,
            marginBottom: 24,
            display: 'block',
            cursor: 'pointer',
            outline: 'none',
            transition: 'opacity 0.15s ease',
          }}
        >
          <img
            src="/brand/sherlock-logo.png"
            alt="Sherlock"
            style={{
              height: 120,
              width: 'auto',
              display: 'block',
            }}
          />
        </a>

        {/* Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            boxSizing: 'border-box',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: 40,
          }}
        >
          {children}
        </div>

        {/* Legal links — visible on every public auth page */}
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 24,
            color: '#6b7280',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>{t(lang, 'privacy')}</a>
          {' · '}
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>{t(lang, 'terms')}</a>
        </p>
      </div>
    </div>
  );
}
