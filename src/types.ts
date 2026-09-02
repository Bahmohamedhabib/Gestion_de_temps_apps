export type Priority = 'low' | 'medium' | 'high';

export type CategoryId = 'work' | 'personal' | 'shopping' | 'health' | 'project' | 'study';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  color: string;
  bgLight: string;
  iconName: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type AlarmSoundType = 'digital' | 'melodic' | 'siren' | 'gentle';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: string; // Format: YYYY-MM-DD
  dueTime?: string; // Format: HH:mm
  priority: Priority;
  category: CategoryId;
  subtasks: SubTask[];
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
  reminderMinutesBefore?: number; // e.g. 0, 5, 10, 15, 30, 60
  alarmSound?: AlarmSoundType;
  snoozedUntil?: number; // Timestamp in ms
}

export type TabType = 'tasks' | 'calendar' | 'stats' | 'settings';

export type FilterStatus = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';

export type SortOption = 'dueDate' | 'priority' | 'title' | 'createdAt';

export interface UserSettings {
  enableAudioAlerts: boolean;
  enableBrowserNotifications: boolean;
  enableVibration?: boolean;
  defaultReminderMinutes: number; // 0 (exact time), 5, 10, 15, 30, 60
  defaultAlarmSound: AlarmSoundType;
  soundTheme?: 'gentle' | 'chime' | 'digital';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarColor: string;
  role?: string;
  createdAt: string;
  settings: UserSettings;
}

export type NotificationType = 'created' | 'reminder' | 'due' | 'completed' | 'info';

export interface AppNotification {
  id: string;
  userId: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export interface ActiveAlarm {
  task: Task;
  type: 'reminder' | 'due' | 'snooze' | 'test';
  title: string;
  message: string;
  minutesBefore?: number;
  sound: AlarmSoundType;
  startedAt: number;
}
