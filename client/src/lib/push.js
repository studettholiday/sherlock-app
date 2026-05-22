// Web Push helpers — service worker registration + VAPID subscription.
//
// All functions are best-effort and self-contained: if push is unsupported,
// permission is denied, or the server has no VAPID key, they log and return
// quietly rather than throwing. The caller never needs a try/catch.

// True if the browser can do service-worker-based push at all.
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Register the service worker. Returns the registration, or null on failure.
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (err) {
    console.warn('[push] service worker registration failed:', err);
    return null;
  }
}

// VAPID public keys are base64url strings; pushManager.subscribe() needs a
// Uint8Array as applicationServerKey.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

// Ask for notification permission and, if granted, subscribe to push and
// register the subscription with the backend. Silent no-op on any failure.
export async function requestPermissionAndSubscribe(authToken) {
  if (!isPushSupported()) {
    console.log('[push] not supported in this browser');
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[push] permission not granted:', permission);
      return;
    }

    const reg = await navigator.serviceWorker.ready;

    // Fetch the server's VAPID public key.
    const keyRes = await fetch('/api/push/vapid-public-key');
    const { key } = await keyRes.json();
    if (!key) {
      console.warn('[push] server has no VAPID public key — skipping subscribe');
      return;
    }

    // Reuse an existing subscription if there is one.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const json = sub.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    console.log('[push] subscribed');
  } catch (err) {
    console.warn('[push] subscribe failed:', err);
  }
}

// Unsubscribe locally and tell the backend to drop the row. Silent no-op on
// any failure.
export async function unsubscribePush(authToken) {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const { endpoint } = sub;
    await sub.unsubscribe();
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });
    console.log('[push] unsubscribed');
  } catch (err) {
    console.warn('[push] unsubscribe failed:', err);
  }
}
