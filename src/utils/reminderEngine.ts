import { Task, User, AppNotification } from '../types';
import { soundManager } from './audio';
import { authStorage } from './authStorage';

// Request browser notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission', e);
    return 'denied';
  }
}

// Send system notification
export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.warn('Failed to dispatch browser notification', e);
    }
  }
}

// Check deadline reminders
export function checkTaskReminders(
  tasks: Task[],
  user: User,
  onAlertTriggered?: (alert: AppNotification) => void
) {
  if (!tasks || tasks.length === 0) return;

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

    const reminderLead = task.reminderMinutesBefore ?? user.settings.defaultReminderMinutes ?? 15;

    // 1. Approaching Reminder (e.g., exactly at reminderLead minutes, between [reminderLead - 2, reminderLead + 1])
    if (reminderLead > 0 && diffMinutes > 0 && diffMinutes <= reminderLead) {
      const alertedKey = `alerted_${user.id}_${task.id}_approaching_${task.dueDate}_${task.dueTime}`;
      if (!sessionStorage.getItem(alertedKey)) {
        sessionStorage.setItem(alertedKey, 'true');

        const title = `⏰ Rappel dans ${diffMinutes} min`;
        const message = `« ${task.title} » arrive à échéance à ${task.dueTime} !`;

        if (user.settings.enableAudioAlerts) {
          soundManager.playReminderChime();
        }

        if (user.settings.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `reminder-${task.id}`,
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

        if (user.settings.enableAudioAlerts) {
          soundManager.playDueChime();
        }

        if (user.settings.enableBrowserNotifications) {
          sendBrowserNotification(title, {
            body: message,
            tag: `due-${task.id}`,
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
