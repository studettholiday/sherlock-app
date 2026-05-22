/* Sherlock service worker — Web Push notifications for schedule changes.
   Served at /service-worker.js (root scope). No caching/offline logic here —
   this worker exists purely to receive pushes and route notification clicks. */

const APP_URL = 'https://app.sherlock.school/chat';

// Activate immediately so the first push works without a reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
    icon: '/brand/sherlock-logo.png',
    badge: '/brand/sherlock-logo.png',
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
