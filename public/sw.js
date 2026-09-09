// Service Worker for Mobile Tasks App - Background Alarms, Lockscreen Notifications & Offline Support
const CACHE_NAME = 'tasks-app-v5';
const DB_NAME = 'task_mobile_alarms_db';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled_alarms';

// Helper to open IndexedDB in Service Worker
function openSWAlarmDB() {
  return new Promise((resolve, reject) => {
    if (!self.indexedDB) {
      return reject(new Error('IndexedDB not supported in SW'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('triggerTimestamp', 'triggerTimestamp', { unique: false });
        store.createIndex('fired', 'fired', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingAlarmsFromDB() {
  try {
    const db = await openSWAlarmDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter((a) => !a.fired));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return [];
  }
}

async function markAlarmAsFiredInDB(id) {
  try {
    const db = await openSWAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        store.put({ ...req.result, fired: true });
      }
    };
  } catch (e) {
    // Silently ignore
  }
}

// Check and fire due alarms from IndexedDB
async function checkAndTriggerDueAlarms() {
  const now = Date.now();
  const alarms = await getPendingAlarmsFromDB();

  let nextAlarmDelay = null;

  for (const alarm of alarms) {
    // If due or overdue within 60 minutes
    if (alarm.triggerTimestamp <= now && now < alarm.triggerTimestamp + 60 * 60 * 1000) {
      // Fire alarm notification with phone vibration and high priority
      try {
        await self.registration.showNotification(alarm.title, {
          body: alarm.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: alarm.id,
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [1000, 300, 1000, 300, 1000, 300, 1500],
          data: {
            taskId: alarm.taskId,
            alarmType: alarm.alarmType,
            sound: alarm.sound || 'digital',
            triggerAlarmScreen: true,
          },
          actions: [
            { action: 'open_alarm', title: '⏰ Arrêter / Ouvrir' },
            { action: 'snooze_5', title: '💤 Répéter 5 min' },
          ],
        });
        await markAlarmAsFiredInDB(alarm.id);
      } catch (err) {
        console.warn('Failed to display SW notification:', err);
      }
    } else if (alarm.triggerTimestamp > now) {
      const delay = alarm.triggerTimestamp - now;
      if (nextAlarmDelay === null || delay < nextAlarmDelay) {
        nextAlarmDelay = delay;
      }
    }
  }

  // If there is an upcoming alarm within 2 hours, schedule a timeout
  if (nextAlarmDelay !== null && nextAlarmDelay < 2 * 60 * 60 * 1000) {
    setTimeout(() => {
      checkAndTriggerDueAlarms();
    }, Math.min(nextAlarmDelay + 500, 60000));
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return checkAndTriggerDueAlarms();
    })
  );
});

// Periodic background sync if supported by browser
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-task-alarms') {
    event.waitUntil(checkAndTriggerDueAlarms());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-task-alarms') {
    event.waitUntil(checkAndTriggerDueAlarms());
  }
});

// Periodic watchdog ticker (active while SW process lives)
setInterval(() => {
  checkAndTriggerDueAlarms();
}, 10000);

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      body: options?.body || 'Rappel de tâche',
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag || 'task-reminder',
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [800, 200, 800, 200, 800],
      data: options?.data || {},
      actions: [
        { action: 'open_alarm', title: '⏰ Ouvrir / Arrêter' },
        { action: 'snooze_5', title: '💤 Répéter 5 min' },
      ],
      ...options,
    });
  }

  if (event.data.type === 'SYNC_ALARMS' || event.data.type === 'SCHEDULE_ALARM') {
    // If browser supports Notification Triggers (Chrome Android native AlarmManager triggers)
    if (event.data.alarm && 'showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
      try {
        const a = event.data.alarm;
        if (a.triggerTimestamp > Date.now()) {
          self.registration.showNotification(a.title, {
            body: a.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: a.id,
            showTrigger: new TimestampTrigger(a.triggerTimestamp),
            requireInteraction: true,
            renotify: true,
            vibrate: [1000, 300, 1000, 300, 1000, 300, 1500],
            data: {
              taskId: a.taskId,
              alarmType: a.alarmType,
              sound: a.sound || 'digital',
            },
            actions: [
              { action: 'open_alarm', title: '⏰ Arrêter / Ouvrir' },
              { action: 'snooze_5', title: '💤 Répéter 5 min' },
            ],
          });
        }
      } catch (err) {
        console.warn('Notification Trigger scheduling error:', err);
      }
    }
    checkAndTriggerDueAlarms();
  }
});

// Handle notification click on phone lockscreen or notification center
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const isSnooze = event.action === 'snooze_5';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing window is open, focus it and trigger alarm
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: isSnooze ? 'SNOOZE_TASK' : 'TRIGGER_ALARM_SCREEN',
            taskId: notifData.taskId,
            alarmType: notifData.alarmType,
            sound: notifData.sound,
          });
          return client.focus();
        }
      }

      // 2. If app is closed, launch window with query param to immediately sound the alarm
      if (self.clients.openWindow) {
        const ringParam = isSnooze ? `snoozeTaskId=${notifData.taskId}` : `ringTaskId=${notifData.taskId}&sound=${notifData.sound || 'digital'}`;
        return self.clients.openWindow(`/?${ringParam}`);
      }
    })
  );
});
