// This service worker handles incoming push notifications when the browser is closed
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    data = { title: 'Incoming Call', body: event.data?.text() || 'Hamid is calling you!' };
  }

  const options = {
    body: data.body || 'Hamid is calling you!',
    icon: data.icon || '/vibe-icon-192.png',
    badge: data.badge || '/vibe-icon-192.png',
    data: data.data || {},
    requireInteraction: true,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [
      { action: 'join', title: '✅ Join' },
      { action: 'decline', title: '❌ Decline' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hamid is calling 📞', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/vibe';

  if (event.action !== 'decline') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // If an existing window is open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/vibe') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
