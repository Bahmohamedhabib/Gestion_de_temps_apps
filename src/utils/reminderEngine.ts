import { Task, User, AppNotification, ActiveAlarm, AlarmSoundType } from '../types';
import { soundManager } from './audio';
import { authStorage } from './authStorage';

let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize and register service worker on app start
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    swRegistration = reg;
    return reg;
  } catch (e) {
    console.warn('Service Worker registration skipped or failed', e);
    return null;
  }
}

// Request browser notification permission
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
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options?.tag || 'task-alarm',
      requireInteraction: true, // Stays on screen until user dismisses or acts
      renotify: true,
      vibrate: [600, 200, 600, 200, 600],
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

    // Try service worker registration first for background persistence
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

// Sync upcoming alarms with Service Worker for background triggering
export function syncAlarmsToServiceWorker(tasks: Task[], user: User) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;

  const now = Date.now();
  tasks.forEach((task) => {
    if (task.completed || !task.dueDate || !task.dueTime) return;

    const [hours, minutes] = task.dueTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const dueTimeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const dueTimestamp = dueTimeDate.getTime();

    const reminderLead =
      task.reminderMinutesBefore ?? user.settings?.defaultReminderMinutes ?? 15;
    const sound = task.alarmSound || user.settings?.defaultAlarmSound || 'digital';

    // 1. Approaching Reminder Alarm
    if (reminderLead > 0) {
      const reminderTimestamp = dueTimestamp - reminderLead * 60 * 1000;
      if (reminderTimestamp > now) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_ALARM',
          id: `alarm_${task.id}_reminder`,
          taskId: task.id,
          title: `⏰ ALARME : Dans ${reminderLead} min`,
          body: `« ${task.title} » est prévue pour ${task.dueTime} !`,
          triggerTimestamp: reminderTimestamp,
          alarmType: 'reminder',
          sound,
        });
      }
    }

    // 2. Exact Due Time Alarm
    if (dueTimestamp > now) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_ALARM',
        id: `alarm_${task.id}_due`,
        taskId: task.id,
        title: `🚨 ALARME : C'est l'heure !`,
        body: `« ${task.title} » commence maintenant (${task.dueTime}).`,
        triggerTimestamp: dueTimestamp,
        alarmType: 'due',
        sound,
      });
    }
  });
}

// High-precision Alarm Checker with Mobile Phone Wakeup & Catch-up Window
export function checkTaskReminders(
  tasks: Task[],
  user: User,
  onAlertTriggered?: (alert: AppNotification) => void,
  onAlarmRinging?: (alarm: ActiveAlarm) => void
) {
  if (!tasks || tasks.length === 0 || !user) return;

  const now = Date.now();
  // 120 minutes (2 hours) catch-up window so phones waking from sleep never miss due alarms
  const CATCH_UP_WINDOW_MS = 120 * 60 * 1000;

  tasks.forEach((task) => {
    if (task.completed) return;

    // Check snoozed alarms
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

    const reminderLead =
      task.reminderMinutesBefore ?? user.settings?.defaultReminderMinutes ?? 15;
    const sound = task.alarmSound || user.settings?.defaultAlarmSound || 'digital';

    // 1. Approaching Reminder Alarm (e.g. 15 minutes before)
    // Trigger if we are at or past the reminder time AND not yet past the due time
    if (reminderLead > 0) {
      const reminderTimestamp = dueTimestamp - reminderLead * 60 * 1000;
      if (now >= reminderTimestamp && now < dueTimestamp) {
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

    // 2. Exact Due Time Alarm
    // Generous catch-up window of up to 2 hours so that if the phone was locked/sleeping,
    // the user is immediately alerted the moment they unlock or open the screen!
    if (now >= dueTimestamp && now < dueTimestamp + CATCH_UP_WINDOW_MS) {
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

