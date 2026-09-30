import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// VAPID keys for Web Push Notifications (Standard for Android Chrome, iOS Safari PWA, etc.)
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BP5uSV6Fq2hucys8KvfcUVh9UwunqNvW4ZEBcNK2-e0S7_gCtRTVB_xFGES7WcNeWJg2BbVtYAGywPPxfIt2QTg';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || '7KzqkGIBKddExDESsb5K1xjexgAUeAZqB3wkW4DlBak';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@tasks-mobile.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push VAPID configured successfully');
} catch (err) {
  console.error('Failed to configure Web Push VAPID:', err);
}

// In-memory registry of Push Subscriptions per user
interface StoredSubscription {
  subscription: webpush.PushSubscription;
  userId: string;
  updatedAt: number;
}

const subscriptions = new Map<string, StoredSubscription>();

// In-memory scheduled alarms per user
interface ScheduledAlarm {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  body: string;
  sound: string;
  triggerTimestamp: number;
  fired: boolean;
}

const scheduledAlarms: ScheduledAlarm[] = [];

// Helper to calculate timestamp for dueDate (YYYY-MM-DD) and dueTime (HH:mm)
function calculateAlarmTimestamp(dueDate: string, dueTime?: string, minutesBefore: number = 0): number | null {
  if (!dueDate) return null;
  const time = dueTime && dueTime.trim() ? dueTime : '09:00';
  const [yearStr, monthStr, dayStr] = dueDate.split('-');
  const [hourStr, minuteStr] = time.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return null;
  }

  const targetDate = new Date(year, month, day, hour, minute, 0, 0);
  return targetDate.getTime() - minutesBefore * 60 * 1000;
}

// Helper to send Web Push to a user's registered devices
async function sendPushToUser(userId: string, payload: object): Promise<number> {
  let sentCount = 0;
  const payloadString = JSON.stringify(payload);

  for (const [endpoint, record] of subscriptions.entries()) {
    if (record.userId === userId || userId === 'all') {
      try {
        await webpush.sendNotification(record.subscription, payloadString, {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        });
        sentCount++;
      } catch (err: any) {
        console.warn(`Push delivery error to ${endpoint.substring(0, 30)}...:`, err.statusCode || err.message);
        // If subscription has expired or is invalid (HTTP 410 or 404), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          subscriptions.delete(endpoint);
        }
      }
    }
  }
  return sentCount;
}

// Background scheduler running in Node.js server process
// Checks every 5 seconds for due tasks to send Push notifications
setInterval(async () => {
  const now = Date.now();

  for (const alarm of scheduledAlarms) {
    if (!alarm.fired && alarm.triggerTimestamp <= now) {
      // Check if within reasonable window (last 30 minutes)
      if (now - alarm.triggerTimestamp < 30 * 60 * 1000) {
        console.log(`⏰ [SERVER SCHEDULER] Triggering alarm push for task "${alarm.title}" (${alarm.taskId})`);

        alarm.fired = true;

        await sendPushToUser(alarm.userId, {
          type: 'ALARM_DUE',
          title: `⏰ C'EST L'HEURE : ${alarm.title}`,
          body: alarm.body,
          taskId: alarm.taskId,
          taskTitle: alarm.title,
          sound: alarm.sound,
          timestamp: now,
        });
      } else {
        // Stale alarm (>30m ago), just mark fired
        alarm.fired = true;
      }
    }
  }
}, 5000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      subscriptionsCount: subscriptions.size,
      scheduledAlarmsCount: scheduledAlarms.filter((a) => !a.fired).length,
    });
  });

  // 2. Return public VAPID key to browser
  app.get('/api/push/public-key', (req: Request, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // 3. Register or update a browser push subscription
  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const { subscription, userId } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid push subscription' });
    }

    subscriptions.set(subscription.endpoint, {
      subscription,
      userId: userId || 'anonymous',
      updatedAt: Date.now(),
    });

    console.log(`📱 Push subscription saved for user: ${userId || 'anonymous'} (Total: ${subscriptions.size})`);
    res.json({ success: true, registered: subscriptions.size });
  });

  // 4. Sync scheduled tasks from client to server-side scheduler
  app.post('/api/push/sync-tasks', (req: Request, res: Response) => {
    const { userId, tasks } = req.body;
    if (!userId || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Missing userId or tasks array' });
    }

    const now = Date.now();

    // Remove existing future alarms for this user to avoid duplicates
    for (let i = scheduledAlarms.length - 1; i >= 0; i--) {
      if (scheduledAlarms[i].userId === userId) {
        scheduledAlarms.splice(i, 1);
      }
    }

    let addedCount = 0;
    for (const t of tasks) {
      if (t.completed || t.reminder === false) continue;
      const minutesBefore = typeof t.reminderMinutesBefore === 'number' ? t.reminderMinutesBefore : 0;
      const triggerTimestamp = calculateAlarmTimestamp(t.dueDate, t.dueTime, minutesBefore);

      if (triggerTimestamp && triggerTimestamp > now - 60000) {
        const isExact = minutesBefore === 0;
        const timeInfo = t.dueTime ? `prévue à ${t.dueTime}` : `du jour`;
        const body = isExact
          ? `Votre tâche ${timeInfo} sonne maintenant ! Appuyez pour ouvrir ou arrêter.`
          : `Rappel : votre tâche commence dans ${minutesBefore} minute(s) !`;

        scheduledAlarms.push({
          id: `${t.id}-${triggerTimestamp}`,
          taskId: t.id,
          userId: userId,
          title: t.title,
          body: body,
          sound: t.alarmSound || 'digital',
          triggerTimestamp: triggerTimestamp,
          fired: false,
        });
        addedCount++;
      }
    }

    console.log(`🔄 Synced ${addedCount} future task alarms for user ${userId}`);
    res.json({ success: true, syncedCount: addedCount });
  });

  // 5. Test push notification trigger
  app.post('/api/push/test', async (req: Request, res: Response) => {
    const { userId, sound } = req.body;
    const targetUser = userId || 'all';

    console.log(`🔔 Sending test push notification to user "${targetUser}"`);

    const sent = await sendPushToUser(targetUser, {
      type: 'ALARM_TEST',
      title: '⏰ TEST RÉUSSI : Alarme Téléphone Active !',
      body: 'Cette notification arrive depuis le serveur. Vos tâches sonneront même application fermée et téléphone en veille !',
      taskId: 'test-alarm',
      taskTitle: 'Test de Sonnerie',
      sound: sound || 'digital',
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      deliveredTo: sent,
      message:
        sent > 0
          ? `Notification envoyée à ${sent} appareil(s) !`
          : 'Aucun appareil inscrit. Activez les notifications sur votre téléphone.',
    });
  });

  // Vite middleware setup (SPA fallback)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Task Manager Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
