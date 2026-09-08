// public/sw.js
// Handles incoming Web Push messages and shows a system notification.
// Brooklyn's Edge Function sends the push payload as JSON in this shape:
// { title, body, url, incidentId }

self.addEventListener('push', (event) => {
  let payload = { title: 'CrimeWatch ZA', body: 'New incident reported nearby.', url: '/' };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url || '/' },
      tag: payload.incidentId || undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
        return;
      }
      self.clients.openWindow(targetUrl);
    })
  );
});
