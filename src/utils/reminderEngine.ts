import { Task, User, AppNotification, ActiveAlarm, AlarmSoundType } from '../types';
import { soundManager } from './audio';
import { authStorage } from './authStorage';
import { savePersistentAlarms, PersistentAlarm } from './alarmDb';

let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize and register service worker on app start
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;

    // Check for service worker updates
    reg.update().catch(() => {});

    return reg;
  } catch (e) {
    console.warn('Service Worker registration skipped or failed', e);
    return null;
  }
}

// Request browser notification permission (like Facebook, Instagram, Snap)
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      if (!swRegistration) {
        swRegistration = await initServiceWorker();
      }
    }
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission', e);
    return 'denied';
  }
}

// Send system notification (works in background through Service Worker or native Web Notification API)
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions & { taskId?: string; sound?: AlarmSoundType }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const notifOptions: NotificationOptions & Record<string, unknown> = {
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: options?.tag || `alarm-${options?.taskId || Date.now()}`,
      requireInteraction: true, // Stays on screen until user dismisses or acts
      renotify: true,
      silent: false,
      vibrate: [1000, 300, 1000, 300, 1000, 300, 1500],
      data: {
        taskId: options?.taskId,
        sound: options?.sound || 'digital',
      },
      actions: [
        { action: 'open_alarm', title: '⏰ Arrêter / Ouvrir' },
        { action: 'snooze_5', title: '💤 Répéter 5 min' },
      ],
      ...options,
    };

    // Try service worker registration first for background persistence on mobile
    if (swRegistration && 'showNotification' in swRegistration) {
      try {
        swRegistration.showNotification(title, notifOptions);
        return;
      } catch (e) {
        console.warn('SW notification fallback to window Notification', e);
      }
    }

    // Direct Notification constructor fallback
    try {
      const notif = new Notification(title, notifOptions);
      if (options?.taskId) {
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    } catch (e) {
      console.warn('Failed to dispatch standard browser notification', e);
    }
  }
}

// Prevent immediate ring upon task creation if any reminder timestamp or due time was already in the past
export function bypassPastRemindersOnTaskCreation(task: Task, userId: string) {
  if (!task.dueDate || !task.dueTime) return;

  const [hours, minutes] = task.dueTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;

  const [year, month, day] = task.dueDate.split('-').map(Number);
  const dueTimeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const dueTimestamp = dueTimeDate.getTime();
  const now = Date.now();

  const reminderLead = task.reminderMinutesBefore ?? 0;

  // If the reminder lead time is in the past, mark it so it NEVER rings immediately
  if (reminderLead > 0) {
    const reminderTimestamp = dueTimestamp - reminderLead * 60 * 1000;
    if (reminderTimestamp <= now) {
      const reminderKey = `alarm_reminder_fired_${userId}_${task.id}_${task.dueDate}_${task.dueTime}_${reminderLead}`;
      localStorage.setItem(reminderKey, 'true');
    }
  }

  // If the due time itself is in the past when creating the task, mark it as already handled
  if (dueTimestamp <= now) {
    const dueKey = `alarm_due_fired_${userId}_${task.id}_${task.dueDate}_${task.dueTime}`;
    localStorage.setItem(dueKey, 'true');
  }
}

// Sync upcoming alarms to IndexedDB and Service Worker for background triggering
export async function syncAlarmsToServiceWorker(tasks: Task[], user: User) {
  if (!tasks || tasks.length === 0 || !user) return;

  const now = Date.now();
  const persistentAlarms: PersistentAlarm[] = [];

  tasks.forEach((task) => {
    if (task.completed || !task.dueDate || !task.dueTime) return;

    const [hours, minutes] = task.dueTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const dueTimeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const dueTimestamp = dueTimeDate.getTime();

    // Default to 0 minutes (exact task hour and minute) as requested
    const reminderLead = task.reminderMinutesBefore ?? user.settings?.defaultReminderMinutes ?? 0;
    const sound = task.alarmSound || user.settings?.defaultAlarmSound || 'digital';
    const createdTimestamp = task.createdAt ? Date.parse(task.createdAt) : 0;

    // 1. Approaching Reminder Alarm (only if scheduled for a future moment AFTER creation)
    if (reminderLead > 0) {
      const reminderTimestamp = dueTimestamp - reminderLead * 60 * 1000;
      if (reminderTimestamp > now && (createdTimestamp === 0 || reminderTimestamp > createdTimestamp)) {
        persistentAlarms.push({
          id: `alarm_${task.id}_reminder_${reminderLead}`,
          taskId: task.id,
          taskTitle: task.title,
          title: `⏰ ALARME : Dans ${reminderLead} min !`,
          body: `« ${task.title} » est prévue à ${task.dueTime}. Préparez-vous !`,
          triggerTimestamp: reminderTimestamp,
          alarmType: 'reminder',
          sound,
          fired: false,
          createdAt: now,
        });
      }
    }

    // 2. Exact Due Time Alarm (at the exact hour and minute of the task)
    if (dueTimestamp > now && (createdTimestamp === 0 || dueTimestamp > createdTimestamp)) {
      persistentAlarms.push({
        id: `alarm_${task.id}_due`,
        taskId: task.id,
        taskTitle: task.title,
        title: `🚨 ALARME : C'est l'heure !`,
        body: `« ${task.title} » commence maintenant (${task.dueTime}).`,
        triggerTimestamp: dueTimestamp,
        alarmType: 'due',
        sound,
        fired: false,
        createdAt: now,
      });
    }

    // 3. Snooze Alarm if active
    if (task.snoozedUntil && task.snoozedUntil > now) {
      persistentAlarms.push({
        id: `alarm_${task.id}_snooze_${task.snoozedUntil}`,
        taskId: task.id,
        taskTitle: task.title,
        title: `⏰ RAPPEL RÉPÉTÉ (SNOOZE)`,
        body: `C'est le moment d'effectuer : « ${task.title} » !`,
        triggerTimestamp: task.snoozedUntil,
        alarmType: 'snooze',
        sound,
        fired: false,
        createdAt: now,
      });
    }
  });

  // Save to persistent IndexedDB shared with Service Worker
  await savePersistentAlarms(persistentAlarms);

  // Notify Service Worker to schedule notifications
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SYNC_ALARMS',
          alarmsCount: persistentAlarms.length,
        });
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_ALARMS',
          alarmsCount: persistentAlarms.length,
        });
      }
    } catch (e) {
      console.warn('Could not postMessage to Service Worker', e);
    }
  }
}

// High-precision Alarm Checker for Active & Wake-up Sessions
export function checkTaskReminders(
  tasks: Task[],
  user: User,
  onAlertTriggered?: (alert: AppNotification) => void,
  onAlarmRinging?: (alarm: ActiveAlarm) => void
) {
  if (!tasks || tasks.length === 0 || !user) return;

  const now = Date.now();
  // 45 minutes catch-up window for phones waking from sleep/veille
  const CATCH_UP_WINDOW_MS = 45 * 60 * 1000;

  tasks.forEach((task) => {
    if (task.completed) return;

    // 1. Check snoozed alarms
    if (task.snoozedUntil && task.snoozedUntil <= now && now < task.snoozedUntil + CATCH_UP_WINDOW_MS) {
      const snoozeKey = `alarm_snooze_fired_${task.id}_${task.snoozedUntil}`;
      if (!localStorage.getItem(snoozeKey)) {
        localStorage.setItem(snoozeKey, 'true');

        const sound = task.alarmSound || user.settings?.defaultAlarmSound || 'digital';
        const title = `⏰ RAPPEL RÉPÉTÉ (SNOOZE)`;
        const message = `C'est le moment d'effectuer : « ${task.title} » !`;

        if (user.settings?.enableAudioAlerts) {
          soundManager.startAlarm(sound, user.settings?.enableVibration ?? true);
        }

        if (user.settings?.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `snooze-${task.id}`,
            taskId: task.id,
            sound,
          });
        }

        const notif = authStorage.addNotification(user.id, {
          taskId: task.id,
          taskTitle: task.title,
          title,
          message,
          type: 'reminder',
        });

        if (onAlertTriggered) onAlertTriggered(notif);
        if (onAlarmRinging) {
          onAlarmRinging({
            task,
            type: 'snooze',
            title,
            message,
            sound,
            startedAt: now,
          });
        }
      }
      return;
    }

    if (!task.dueDate || !task.dueTime) return;

    const [hours, minutes] = task.dueTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const dueTimeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const dueTimestamp = dueTimeDate.getTime();

    // Default to 0 (ring at the exact hour and minute of the task)
    const reminderLead = task.reminderMinutesBefore ?? user.settings?.defaultReminderMinutes ?? 0;
    const sound = task.alarmSound || user.settings?.defaultAlarmSound || 'digital';
    const createdTimestamp = task.createdAt ? Date.parse(task.createdAt) : 0;

    // RULE 1: If task was created for a time that was ALREADY past at the moment of creation,
    // NEVER ring an alarm! (e.g. user logs a past task or yesterday's task)
    if (createdTimestamp > 0 && dueTimestamp < createdTimestamp - 30000) {
      return;
    }

    // RULE 2: Approaching Reminder Alarm (e.g. 5, 10, 15 min before)
    // ONLY ring if:
    // a) reminderLead > 0
    // b) now >= reminderTimestamp && now < dueTimestamp
    // c) The reminder timestamp was NOT already in the past when the task was created!
    if (reminderLead > 0) {
      const reminderTimestamp = dueTimestamp - reminderLead * 60 * 1000;
      const isReminderAfterCreation = createdTimestamp === 0 || reminderTimestamp >= createdTimestamp - 15000;

      if (isReminderAfterCreation && now >= reminderTimestamp && now < dueTimestamp) {
        const reminderKey = `alarm_reminder_fired_${user.id}_${task.id}_${task.dueDate}_${task.dueTime}_${reminderLead}`;
        if (!localStorage.getItem(reminderKey)) {
          localStorage.setItem(reminderKey, 'true');

          const title = `⏰ ALARME : Dans ${reminderLead} min !`;
          const message = `« ${task.title} » est prévue pour ${task.dueTime}. Préparez-vous !`;

          if (user.settings?.enableAudioAlerts) {
            soundManager.startAlarm(sound, user.settings?.enableVibration ?? true);
          }

          if (user.settings?.enableBrowserNotifications) {
            sendBrowserNotification(title, {
              body: message,
              tag: `reminder-${task.id}`,
              taskId: task.id,
              sound,
            });
          }

          const notif = authStorage.addNotification(user.id, {
            taskId: task.id,
            taskTitle: task.title,
            title,
            message,
            type: 'reminder',
          });

          if (onAlertTriggered) onAlertTriggered(notif);
          if (onAlarmRinging) {
            onAlarmRinging({
              task,
              type: 'reminder',
              title,
              message,
              minutesBefore: reminderLead,
              sound,
              startedAt: now,
            });
          }
        }
      }
    }

    // RULE 3: Exact Due Time Alarm (at the exact hour and minute of the task)
    // Ring when now >= dueTimestamp
    // Only applies if the task was created before or at its due time!
    const isDueAfterCreation = createdTimestamp === 0 || dueTimestamp >= createdTimestamp - 30000;
    if (isDueAfterCreation && now >= dueTimestamp && now < dueTimestamp + CATCH_UP_WINDOW_MS) {
      const dueKey = `alarm_due_fired_${user.id}_${task.id}_${task.dueDate}_${task.dueTime}`;
      if (!localStorage.getItem(dueKey)) {
        localStorage.setItem(dueKey, 'true');

        const delayMinutes = Math.floor((now - dueTimestamp) / 60000);
        const isLate = delayMinutes >= 2;

        const title = isLate
          ? `🚨 ALARME (En retard de ${delayMinutes} min)`
          : `🚨 C'EST L'HEURE DE VOTRE TÂCHE !`;
        const message = isLate
          ? `« ${task.title} » était prévue à ${task.dueTime} !`
          : `« ${task.title} » commence maintenant (${task.dueTime}).`;

        if (user.settings?.enableAudioAlerts) {
          soundManager.startAlarm(sound, user.settings?.enableVibration ?? true);
        }

        if (user.settings?.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `due-${task.id}`,
            taskId: task.id,
            sound,
          });
        }

        const notif = authStorage.addNotification(user.id, {
          taskId: task.id,
          taskTitle: task.title,
          title,
          message,
          type: 'due',
        });

        if (onAlertTriggered) onAlertTriggered(notif);
        if (onAlarmRinging) {
          onAlarmRinging({
            task,
            type: 'due',
            title,
            message,
            sound,
            startedAt: now,
          });
        }
      }
    }
  });
}

// Trigger a manual test alarm
export function triggerTestAlarm(
  user: User,
  sound: AlarmSoundType,
  onAlarmRinging: (alarm: ActiveAlarm) => void
) {
  const dummyTask: Task = {
    id: 'test-alarm-' + Date.now(),
    title: 'Test de Sonnerie d\'Alarme Réveil 🔔',
    description: 'Vérification du volume sonore, des pulsations et du système de rappel.',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: new Date().toTimeString().slice(0, 5),
    priority: 'high',
    category: 'work',
    subtasks: [],
    createdAt: new Date().toISOString(),
    alarmSound: sound,
  };

  soundManager.startAlarm(sound, user.settings?.enableVibration ?? true);

  if (user.settings?.enableBrowserNotifications) {
    sendBrowserNotification('⏰ Test de Sonnerie d\'Alarme', {
      body: 'La sonnerie d\'alarme et les vibrations fonctionnent à pleine puissance !',
      sound,
    });
  }

  onAlarmRinging({
    task: dummyTask,
    type: 'test',
    title: '🔔 Test d\'Alarme en cours',
    message: 'Le système sonore sonne en continu jusqu\'à ce que vous appuyiez sur "Arrêter".',
    sound,
    startedAt: Date.now(),
  });
}

/**
 * Creates an inline Web Worker ticker that resists mobile browser background throttling.
 * This ensures alarms are checked every second even when the phone screen is dimmed.
 */
export function startAlarmHeartbeat(onTick: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let worker: Worker | null = null;
  let fallbackInterval: number | null = null;

  try {
    const blob = new Blob([
      `let timer = null;
       self.onmessage = function(e) {
         if (e.data === 'start') {
           if (!timer) {
             timer = setInterval(function() {
               self.postMessage('tick');
             }, 1000);
           }
         } else if (e.data === 'stop') {
           if (timer) {
             clearInterval(timer);
             timer = null;
           }
         }
       };`
    ], { type: 'application/javascript' });

    const workerUrl = URL.createObjectURL(blob);
    worker = new Worker(workerUrl);
    worker.onmessage = () => {
      onTick();
    };
    worker.postMessage('start');
  } catch (e) {
    fallbackInterval = window.setInterval(onTick, 1200);
  }

  return () => {
    if (worker) {
      worker.postMessage('stop');
      worker.terminate();
    }
    if (fallbackInterval !== null) {
      clearInterval(fallbackInterval);
    }
  };
}

/**
 * Converts a base64 string to Uint8Array for PushManager subscription key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribes the current mobile device / browser to Web Push Notifications
 * (Enables lockscreen wakeups and alarms when the app is completely closed)
 */
export async function subscribeToWebPush(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push not supported on this browser/platform');
    return false;
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (!reg || !reg.pushManager) {
      console.warn('ServiceWorker pushManager not available');
      return false;
    }

    // 1. Fetch public VAPID key from server
    let vapidPublicKey = '';
    try {
      const keyRes = await fetch('/api/push/public-key');
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        vapidPublicKey = keyData.publicKey;
      }
    } catch (e) {
      console.warn('Failed to fetch VAPID key from server, using fallback', e);
    }

    if (!vapidPublicKey) {
      vapidPublicKey =
        'BP5uSV6Fq2hucys8KvfcUVh9UwunqNvW4ZEBcNK2-e0S7_gCtRTVB_xFGES7WcNeWJg2BbVtYAGywPPxfIt2QTg';
    }

    // 2. Check existing subscription or create new
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // 3. Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || 'current-user',
      }),
    });

    console.log('✅ Web Push registered successfully with server!');
    return true;
  } catch (err) {
    console.warn('Could not register Web Push subscription:', err);
    return false;
  }
}

/**
 * Synchronizes scheduled tasks with the fullstack backend server
 * so the server can push notifications when the app is closed.
 */
export async function syncTasksToPushServer(userId: string, tasks: Task[]): Promise<void> {
  if (typeof window === 'undefined' || !userId) return;

  try {
    await fetch('/api/push/sync-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tasks }),
    });
  } catch (err) {
    // Silently handle if offline or server temporarily unavailable
    console.warn('Could not sync tasks to push server:', err);
  }
}

/**
 * Triggers a real test Push notification from the server to test mobile lockscreen wake-up
 */
export async function triggerServerTestPush(userId?: string, sound?: AlarmSoundType): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId || 'current-user',
        sound: sound || 'digital',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || 'Notification de test envoyée au téléphone !' };
    }
    return { success: false, message: 'Échec de l\'envoi du test.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erreur réseau.' };
  }
}

