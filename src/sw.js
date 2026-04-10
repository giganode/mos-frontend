import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { message: event.data.text() };
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

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate('/notifications');
            return client.focus();
          }
        }
        return clients.openWindow('/notifications');
      }),
  );
});
