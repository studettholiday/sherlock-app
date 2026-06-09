/* Sherlock service worker — Web Push notifications + PWA installability.
   Served at /service-worker.js (root scope). No caching/offline logic here —
   the fetch handler is a pass-through so browsers see a controlled page and
   surface the install prompt. */

const APP_URL = 'https://app.sherlock.school/chat';

// Activate immediately so the first push works without a reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Pass-through fetch handler — required by some browsers to consider the page
// a installable PWA. Does NOT cache; every request hits the network as usual.
self.addEventListener('fetch', () => {});

// A push arrived — show a system notification.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {};
  }
  const title = data.title || 'Sherlock';
  const options = {
    body: data.body || '',
    icon: '/brand/icon-192.png',
    badge: '/brand/badge-96.png',
    data: { url: data.url || APP_URL },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification clicked — focus an existing chat tab or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
