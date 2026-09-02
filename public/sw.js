// Service Worker for Mobile Tasks App - Background Notifications & Offline
const CACHE_NAME = 'tasks-app-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from frontend to show native background notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    const notificationOptions = {
      body: options?.body || 'Rappel de tâche',
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag || 'task-reminder',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300, 100, 500],
      data: options?.data || {},
      actions: [
        { action: 'open', title: 'Ouvrir la tâche' },
        { action: 'dismiss', title: 'Fermer' }
      ],
      ...options,
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  // Focus existing window or open new
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (event.notification.data && event.notification.data.taskId) {
            client.postMessage({
              type: 'OPEN_TASK',
              taskId: event.notification.data.taskId,
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
