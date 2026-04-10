import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'MOS';
  const options = {
    body: data.message || data.body || '',
    icon: '/icons/icon_light_small.png',
    badge: '/icons/icon_light_small.png',
    tag: 'mos-notification',
    renotify: true,
    data: data,
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log('[SW] showNotification called successfully');
      })
      .catch((err) => {
        console.error('[SW] showNotification failed:', err);
      }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate('/notifications');
          return;
        }
      }
      return clients.openWindow('/notifications');
    }),
  );
});
