// Service Worker for Mobile Tasks App - Background Alarms, Notifications & Offline
const CACHE_NAME = 'tasks-app-v4';
const scheduledAlarms = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic background check for scheduled alarms in SW
setInterval(() => {
  const now = Date.now();
  for (const [id, alarm] of scheduledAlarms.entries()) {
    if (alarm.triggerTimestamp <= now) {
      // Fire alarm notification
      self.registration.showNotification(alarm.title, {
        body: alarm.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `alarm-${alarm.taskId}-${alarm.alarmType}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [800, 200, 800, 200, 800, 200, 1000],
        data: {
          taskId: alarm.taskId,
          alarmType: alarm.alarmType,
          sound: alarm.sound || 'digital',
          triggerAlarmScreen: true,
        },
        actions: [
          { action: 'open_alarm', title: '⏰ Arrêter / Ouvrir' },
          { action: 'snooze_5', title: '💤 Répéter 5 min' }
        ],
      });
      scheduledAlarms.delete(id);
    }
  }
}, 3000);

// Listen for messages from frontend
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    const notificationOptions = {
      body: options?.body || 'Rappel de tâche',
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag || 'task-reminder',
      renotify: true,
      requireInteraction: true,
      vibrate: [600, 200, 600, 200, 600],
      data: options?.data || {},
      actions: [
        { action: 'open_alarm', title: '⏰ Ouvrir / Arrêter' },
        { action: 'snooze_5', title: '💤 Répéter 5 min' }
      ],
      ...options,
    };

    self.registration.showNotification(title, notificationOptions);
  }

  if (event.data.type === 'SCHEDULE_ALARM') {
    const { id, taskId, title, body, triggerTimestamp, alarmType, sound } = event.data;
    if (triggerTimestamp > Date.now()) {
      scheduledAlarms.set(id, {
        taskId,
        title,
        body,
        triggerTimestamp,
        alarmType,
        sound,
      });
    }
  }

  if (event.data.type === 'CANCEL_ALARM') {
    const { id } = event.data;
    scheduledAlarms.delete(id);
  }

  if (event.data.type === 'CLEAR_ALL_ALARMS') {
    scheduledAlarms.clear();
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find open window
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: event.action === 'snooze_5' ? 'SNOOZE_TASK' : 'TRIGGER_ALARM_SCREEN',
            taskId: notifData.taskId,
            alarmType: notifData.alarmType,
            sound: notifData.sound,
          });
          return client.focus();
        }
      }
      // If no window is open, launch application
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

