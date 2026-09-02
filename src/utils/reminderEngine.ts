import { Task, User, AppNotification } from '../types';
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
export function sendBrowserNotification(title: string, options?: NotificationOptions & { taskId?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    // Vibrate device if supported (haptic feedback)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch (e) {
        // ignore
      }
    }

    const notifOptions: NotificationOptions & Record<string, unknown> = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options?.tag || 'task-alert',
      requireInteraction: true, // Remains on screen until dismissed
      renotify: true,
      data: {
        taskId: options?.taskId,
      },
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

// Check deadline reminders
export function checkTaskReminders(
  tasks: Task[],
  user: User,
  onAlertTriggered?: (alert: AppNotification) => void
) {
  if (!tasks || tasks.length === 0 || !user) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMs = now.getTime();

  tasks.forEach((task) => {
    // Only check incomplete tasks with a due time on today's date
    if (task.completed || !task.dueDate || !task.dueTime) return;

    // Check if task is today
    if (task.dueDate !== todayStr) return;

    const [hours, minutes] = task.dueTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    const taskMs = taskTime.getTime();

    // Difference in minutes
    const diffMinutes = Math.round((taskMs - nowMs) / (1000 * 60));

    const reminderLead = task.reminderMinutesBefore ?? user.settings?.defaultReminderMinutes ?? 15;

    // 1. Approaching Reminder (e.g., exactly at reminderLead minutes, between [reminderLead - 2, reminderLead + 1])
    if (reminderLead > 0 && diffMinutes > 0 && diffMinutes <= reminderLead) {
      const alertedKey = `alerted_${user.id}_${task.id}_approaching_${task.dueDate}_${task.dueTime}`;
      if (!sessionStorage.getItem(alertedKey)) {
        sessionStorage.setItem(alertedKey, 'true');

        const title = `⏰ Rappel : Dans ${diffMinutes} min`;
        const message = `« ${task.title} » arrive à échéance à ${task.dueTime} !`;

        if (user.settings?.enableAudioAlerts) {
          soundManager.playReminderChime();
        }

        if (user.settings?.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `reminder-${task.id}`,
            taskId: task.id,
          });
        }

        const notif = authStorage.addNotification(user.id, {
          taskId: task.id,
          taskTitle: task.title,
          title,
          message,
          type: 'reminder',
        });

        if (onAlertTriggered) {
          onAlertTriggered(notif);
        }
      }
    }

    // 2. Due Right Now (between -1 min and +2 min)
    if (diffMinutes <= 1 && diffMinutes >= -2) {
      const alertedDueKey = `alerted_${user.id}_${task.id}_due_${task.dueDate}_${task.dueTime}`;
      if (!sessionStorage.getItem(alertedDueKey)) {
        sessionStorage.setItem(alertedDueKey, 'true');

        const title = `🚨 C'est l'heure de votre tâche !`;
        const message = `« ${task.title} » est programmée pour maintenant (${task.dueTime}).`;

        if (user.settings?.enableAudioAlerts) {
          soundManager.playDueChime();
        }

        if (user.settings?.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `due-${task.id}`,
            taskId: task.id,
          });
        }

        const notif = authStorage.addNotification(user.id, {
          taskId: task.id,
          taskTitle: task.title,
          title,
          message,
          type: 'due',
        });

        if (onAlertTriggered) {
          onAlertTriggered(notif);
        }
      }
    }
  });
}
