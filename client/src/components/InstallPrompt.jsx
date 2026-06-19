import { useState, useEffect } from 'react';
import { t } from '../i18n';

// Already installed / launched from the home screen? Then there's nothing to offer.
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari, when launched from home screen
  );
}

// iOS has no beforeinstallprompt API — install is always the manual Share →
// "Add to Home Screen" flow. iPadOS 13+ reports as "MacIntel" with touch points,
// so detect that too.
function isIos() {
  const ua = window.navigator.userAgent || '';
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  );
}

// Add-to-Home-Screen only works in real Safari on iOS. Chrome (CriOS), Firefox
// (FxiOS), Edge (EdgiOS), Opera (OPiOS) and in-app browsers (Instagram, Facebook,
// etc.) all run WebKit but can't install — those users must open the page in
// Safari first. In-app WKWebViews typically lack the "Safari" UA token, so anything
// that isn't a recognised non-Safari browser and is missing the token is treated
// as non-Safari.
function isIosSafari() {
  const ua = window.navigator.userAgent || '';
  if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|mercury/i.test(ua)) return false; // other browsers
  if (/FBAN|FBAV|FBIOS|Instagram|Line\/|Twitter|Snapchat|GSA\//i.test(ua)) return false; // in-app
  return /Safari/i.test(ua);
}

// The iOS system Share glyph: an up-arrow rising out of an open-topped box.
function ShareIcon({ size = 18 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0, verticalAlign: 'middle' }}
    >
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M8 9H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

// Shared "Install app" affordance for the public auth pages. Self-contained:
//   - Android/desktop Chrome & Edge: captures beforeinstallprompt and fires the
//     native prompt on tap.
//   - iOS Safari: no API exists, so it reveals the manual Add-to-Home-Screen steps.
//   - Renders nothing when already installed (standalone) or when there's no
//     install path to offer yet (e.g. a browser that never fired the event).
export default function InstallPrompt() {
  const lang = localStorage.getItem('sherlock_lang') || 'en';
  // Seed from the global captured in main.jsx in case the event fired before mount.
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__deferredInstallPrompt || null);
  const [installed, setInstalled] = useState(isStandalone());
  const [dismissed, setDismissed] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (installed) return;
    const onBeforeInstall = (e) => {
      e.preventDefault();          // keep Chrome from showing its own mini-infobar
      setDeferredPrompt(e);        // stash it so our button can trigger it on tap
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  if (installed || dismissed) return null;

  const ios = isIos();
  const iosSafari = ios && isIosSafari();
  const canPrompt = !!deferredPrompt;
  // Nothing to show: not iOS, and no native prompt captured (page isn't
  // installable here, or the event hasn't fired). Avoid a dead button.
  if (!ios && !canPrompt) return null;

  const handleClick = async () => {
    if (ios) {
      setShowIosSteps((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch { /* user dismissed */ }
    window.__deferredInstallPrompt = null; // a prompt can only be used once
    setDeferredPrompt(null);
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 440,
        boxSizing: 'border-box',
        marginTop: 16,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/brand/icon-192.png" alt="" aria-hidden="true"
             style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{t(lang, 'installApp')}</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{t(lang, 'installAppSubtitle')}</div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          style={{
            flexShrink: 0,
            background: '#1b2a4a',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t(lang, 'installApp')}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t(lang, 'installDismiss')}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            padding: '0 2px',
          }}
        >
          ×
        </button>
      </div>
      {ios && showIosSteps && (
        iosSafari ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
              {t(lang, 'iosGuideTitle')}
            </div>
            {[
              { n: 1, text: t(lang, 'iosStep1'), icon: true },
              { n: 2, text: t(lang, 'iosStep2'), icon: false },
              { n: 3, text: t(lang, 'iosStep3'), icon: false },
            ].map((step) => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: '#1b2a4a',
                    color: '#ffffff',
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {step.n}
                </span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                  {step.text}
                </span>
                {step.icon && <ShareIcon />}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            {t(lang, 'iosOpenInSafari')}
          </p>
        )
      )}
    </div>
  );
}
