// IndexedDB persistent storage for scheduled alarms
// Shared across both main window thread and ServiceWorkerGlobalScope

export interface PersistentAlarm {
  id: string; // e.g. alarm_${taskId}_due
  taskId: string;
  taskTitle: string;
  title: string;
  body: string;
  triggerTimestamp: number; // exact epoch ms
  alarmType: 'due' | 'reminder' | 'snooze';
  sound: string;
  fired: boolean;
  createdAt: number;
}

const DB_NAME = 'task_mobile_alarms_db';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled_alarms';

function openAlarmDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
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

export async function savePersistentAlarms(alarms: PersistentAlarm[]): Promise<void> {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const alarm of alarms) {
      store.put(alarm);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save alarms to IndexedDB', err);
  }
}

export async function getPendingPersistentAlarms(): Promise<PersistentAlarm[]> {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all: PersistentAlarm[] = request.result || [];
        // Return unfired alarms
        resolve(all.filter((a) => !a.fired));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to read alarms from IndexedDB', err);
    return [];
  }
}

export async function markPersistentAlarmFired(id: string): Promise<void> {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      if (req.result) {
        const updated = { ...req.result, fired: true };
        store.put(updated);
      }
    };
  } catch (err) {
    console.warn('Failed to mark alarm fired in IndexedDB', err);
  }
}

export async function clearAllPersistentAlarms(): Promise<void> {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Failed to clear alarms in IndexedDB', err);
  }
}
