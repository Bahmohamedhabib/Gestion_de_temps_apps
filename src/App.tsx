import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Task, TabType, User, AppNotification, UserSettings, ActiveAlarm, AlarmSoundType } from './types';
import { getTodayDateString } from './data/defaultTasks';
import { authStorage } from './utils/authStorage';
import { soundManager } from './utils/audio';
import {
  checkTaskReminders,
  sendBrowserNotification,
  initServiceWorker,
  syncAlarmsToServiceWorker,
  triggerTestAlarm,
} from './utils/reminderEngine';

// Components
import { StatusBar } from './components/StatusBar';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { UserMenuModal } from './components/UserMenuModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NotificationBanner } from './components/NotificationBanner';
import { AuthScreen } from './components/AuthScreen';
import { AlarmRingingModal } from './components/AlarmRingingModal';

export default function App() {
  // Current user state (strictly private account)
  const [currentUser, setCurrentUser] = useState<User | null>(() => authStorage.getCurrentUser());

  // User-specific tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const user = authStorage.getCurrentUser();
    return user ? authStorage.getUserTasks(user.id) : [];
  });

  // User-specific notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const user = authStorage.getCurrentUser();
    return user ? authStorage.getUserNotifications(user.id) : [];
  });

  // Active continuous ringing alarm (Modal overlay)
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  // Active floating alert banner
  const [activeAlert, setActiveAlert] = useState<AppNotification | null>(null);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifsDrawerOpen, setIsNotifsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [isDeviceFrameMode, setIsDeviceFrameMode] = useState(true);

  // Initialize service worker for background notifications
  useEffect(() => {
    initServiceWorker();
  }, []);

  // Listen for messages from background Service Worker (e.g. notifications clicked or background alarms)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, taskId, sound } = event.data || {};
      if (type === 'TRIGGER_ALARM_SCREEN' && taskId) {
        const foundTask = tasks.find((t) => t.id === taskId);
        if (foundTask) {
          const alarmSound: AlarmSoundType = sound || foundTask.alarmSound || currentUser?.settings?.defaultAlarmSound || 'digital';
          setActiveAlarm({
            taskId: foundTask.id,
            task: foundTask,
            type: 'due',
            title: `⏰ ALARME : ${foundTask.title}`,
            message: `C'est l'heure de votre tâche : « ${foundTask.title} »`,
            timestamp: Date.now(),
            sound: alarmSound,
          });
          if (currentUser?.settings?.enableAudioAlerts ?? true) {
            soundManager.startContinuousAlarm(alarmSound, currentUser?.settings?.enableVibration ?? true);
          }
        }
      } else if (type === 'STOP_ALARM') {
        soundManager.stopAlarm();
        setActiveAlarm(null);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [tasks, currentUser]);

  // Sync scheduled alarms to Service Worker for background wakeups whenever tasks change
  useEffect(() => {
    if (currentUser) {
      syncAlarmsToServiceWorker(tasks, currentUser);
    }
  }, [tasks, currentUser]);

  // Save tasks to user storage whenever they change
  useEffect(() => {
    if (currentUser?.id) {
      authStorage.saveUserTasks(currentUser.id, tasks);
    }
  }, [tasks, currentUser?.id]);

  // Handle user authentication (Login or Register)
  const handleUserAuthenticated = (user: User) => {
    setCurrentUser(user);
    const userTasks = authStorage.getUserTasks(user.id);
    const userNotifs = authStorage.getUserNotifications(user.id);
    setTasks(userTasks);
    setNotifications(userNotifs);
    setActiveTab('tasks');
  };

  // Handle user logout
  const handleLogout = () => {
    soundManager.stopAlarm();
    setActiveAlarm(null);
    authStorage.logout();
    setCurrentUser(null);
    setTasks([]);
    setNotifications([]);
    setIsUserMenuOpen(false);
    setIsNotifsDrawerOpen(false);
  };

  // Update user profile or settings
  const handleUpdateUserSettings = (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    const updated = authStorage.updateUserProfile(currentUser.id, {
      settings: {
        ...currentUser.settings,
        ...newSettings,
      },
    });
    if (updated) {
      setCurrentUser(updated);
    }
  };

  // Keep selected detail task in sync with main state
  useEffect(() => {
    if (selectedDetailTask) {
      const updated = tasks.find((t) => t.id === selectedDetailTask.id);
      if (updated) {
        setSelectedDetailTask(updated);
      } else {
        setSelectedDetailTask(null);
      }
    }
  }, [tasks]);

  // High-precision deadline & alarm checker (runs every 1.5 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const runChecker = () => {
      checkTaskReminders(
        tasks,
        currentUser,
        (newAlert) => {
          setNotifications((prev) => [newAlert, ...prev]);
          setActiveAlert(newAlert);
        },
        (ringingAlarm) => {
          setActiveAlarm(ringingAlarm);
        }
      );
    };

    runChecker();
    const interval = setInterval(runChecker, 1500);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  // Handlers for Stopping and Snoozing Continuous Alarms
  const handleStopAlarm = () => {
    soundManager.stopAlarm();
    setActiveAlarm(null);
  };

  const handleSnoozeAlarm = (minutes: number) => {
    soundManager.stopAlarm();
    if (activeAlarm?.task && currentUser) {
      const snoozeUntil = Date.now() + minutes * 60 * 1000;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeAlarm.task.id ? { ...t, snoozedUntil: snoozeUntil } : t
        )
      );

      const snoozeNotif = authStorage.addNotification(currentUser.id, {
        taskId: activeAlarm.task.id,
        taskTitle: activeAlarm.task.title,
        title: `Répétition programmée ⏳ (+${minutes} min)`,
        message: `L'alarme pour « ${activeAlarm.task.title} » sonnera à nouveau dans ${minutes} minute(s).`,
        type: 'reminder',
      });
      setNotifications((prev) => [snoozeNotif, ...prev]);
      setActiveAlert(snoozeNotif);
    }
    setActiveAlarm(null);
  };

  const handleTriggerTestAlarm = (sound: AlarmSoundType) => {
    if (!currentUser) return;
    triggerTestAlarm(currentUser, sound, (testAlarm) => {
      setActiveAlarm(testAlarm);
    });
  };

  // Handlers for tasks
  const handleToggleComplete = (taskId: string) => {
    if (!currentUser) return;

    // If task was ringing, silence it
    if (activeAlarm?.taskId === taskId) {
      handleStopAlarm();
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willBeCompleted = !t.completed;
          if (willBeCompleted) {
            if (currentUser.settings?.enableAudioAlerts) {
              soundManager.playCompletionChime();
            }
            // Add notification
            const notif = authStorage.addNotification(currentUser.id, {
              taskId: t.id,
              taskTitle: t.title,
              title: 'Tâche terminée ! 🎉',
              message: `Félicitations pour avoir accompli : « ${t.title} »`,
              type: 'completed',
            });
            setNotifications((prevN) => [notif, ...prevN]);
            setActiveAlert(notif);
          }

          return {
            ...t,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            subtasks: t.subtasks.map((s) => ({
              ...s,
              completed: willBeCompleted ? true : s.completed,
            })),
          };
        }
        return t;
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          const allCompleted =
            updatedSubtasks.length > 0 &&
            updatedSubtasks.every((s) => s.completed);

          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: allCompleted ? true : t.completed,
          };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'completed'> & { id?: string }
  ) => {
    if (!currentUser) return;

    if (taskData.id) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
              }
            : t
        )
      );

      const notif = authStorage.addNotification(currentUser.id, {
        taskId: taskData.id,
        taskTitle: taskData.title,
        title: 'Tâche modifiée ✏️',
        message: `Les modifications de « ${taskData.title} » ont été enregistrées.`,
        type: 'info',
      });
      setNotifications((prevN) => [notif, ...prevN]);
    } else {
      // Create new
      const newTask: Task = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        userId: currentUser.id,
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        reminder: taskData.reminder,
        reminderMinutesBefore: taskData.reminderMinutesBefore,
        alarmSound: taskData.alarmSound || currentUser.settings?.defaultAlarmSound || 'digital',
        subtasks: taskData.subtasks || [],
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);

      // Audio feedback
      if (currentUser.settings?.enableAudioAlerts) {
        soundManager.playCreationChime();
      }

      const reminderInfo = newTask.reminder
        ? ` Sonnera ${newTask.reminderMinutesBefore || 15} min avant.`
        : '';
      const dueDetails = newTask.dueTime ? ` prévue à ${newTask.dueTime}` : ` pour le ${newTask.dueDate}`;
      const notif = authStorage.addNotification(currentUser.id, {
        taskId: newTask.id,
        taskTitle: newTask.title,
        title: 'Tâche créée ! 🚀',
        message: `« ${newTask.title} »${dueDetails}.${reminderInfo}`,
        type: 'created',
      });

      if (currentUser.settings?.enableBrowserNotifications) {
        sendBrowserNotification('Nouvelle tâche créée 🚀', {
          body: `« ${newTask.title} » ajoutée avec succès.${reminderInfo}`,
          taskId: newTask.id,
        });
      }

      setNotifications((prevN) => [notif, ...prevN]);
      setActiveAlert(notif);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (activeAlarm?.taskId === taskId) {
      handleStopAlarm();
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedDetailTask?.id === taskId) {
      setSelectedDetailTask(null);
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateWithDate = (dateStr: string) => {
    if (!currentUser) return;
    setEditingTask({
      id: '',
      userId: currentUser.id,
      title: '',
      category: 'work',
      priority: 'medium',
      dueDate: dateStr,
      alarmSound: currentUser.settings?.defaultAlarmSound || 'digital',
      reminderMinutesBefore: currentUser.settings?.defaultReminderMinutes ?? 15,
      reminder: true,
      subtasks: [],
      completed: false,
      createdAt: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleResetTasks = () => {
    if (!currentUser) return;
    const defaultForUser = authStorage.getUserTasks(currentUser.id);
    setTasks(defaultForUser);
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  const handleMarkAllNotifsRead = () => {
    if (!currentUser) return;
    authStorage.markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifs = () => {
    if (!currentUser) return;
    authStorage.clearNotifications(currentUser.id);
    setNotifications([]);
  };

  const handleSelectTaskFromNotif = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setSelectedDetailTask(found);
    }
  };

  // If no user is logged in, show the clean AuthScreen
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleUserAuthenticated} />;
  }

  const todayStr = getTodayDateString();
  const todayPendingCount = tasks.filter(
    (t) => t.dueDate === todayStr && !t.completed
  ).length;

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center sm:p-4 md:p-6 select-none font-sans text-neutral-900">
      {/* Top Desktop Controls Bar */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-white/80 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone size={16} className="text-indigo-400" />
          <span>Gestionnaire de Tâches Mobile</span>
        </div>
        <button
          onClick={() => setIsDeviceFrameMode(!isDeviceFrameMode)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer border border-neutral-700"
        >
          {isDeviceFrameMode ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          <span>{isDeviceFrameMode ? 'Plein écran' : 'Cadre mobile'}</span>
        </button>
      </header>

      {/* Main Container / Mobile Phone Mockup */}
      <main
        className={`w-full bg-neutral-100 flex flex-col overflow-hidden relative transition-all duration-300 ${
          isDeviceFrameMode
            ? 'sm:max-w-[430px] sm:h-[880px] sm:max-h-[94vh] sm:rounded-[48px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] sm:border-[10px] sm:border-neutral-800 sm:ring-1 sm:ring-white/10'
            : 'max-w-xl min-h-screen sm:rounded-3xl shadow-xl'
        }`}
      >
        {/* Hardware Status Bar */}
        <StatusBar />

        {/* App Header with Profile & Notification Bell */}
        <AppHeader
          currentUser={currentUser}
          unreadNotifsCount={unreadNotifsCount}
          onOpenNotifications={() => setIsNotifsDrawerOpen(true)}
          onOpenUserMenu={() => setIsUserMenuOpen(true)}
        />

        {/* Floating Notification Banner Alert */}
        <NotificationBanner
          alert={activeAlert}
          onClose={() => setActiveAlert(null)}
          onOpenTask={handleSelectTaskFromNotif}
        />

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-4 scroll-smooth">
          {activeTab === 'tasks' && (
            <motion.div
              key="tab-tasks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <TasksView
                tasks={tasks}
                currentUser={currentUser}
                onToggleComplete={handleToggleComplete}
                onOpenTaskDetail={(task) => setSelectedDetailTask(task)}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onOpenCreateModal={() => {
                  setEditingTask(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <CalendarView
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onOpenTaskDetail={(task) => setSelectedDetailTask(task)}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onOpenCreateModalWithDate={handleOpenCreateWithDate}
              />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="tab-stats"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatsView tasks={tasks} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsView
                tasks={tasks}
                currentUser={currentUser}
                onResetTasks={handleResetTasks}
                onClearCompleted={handleClearCompleted}
                onImportTasks={handleImportTasks}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
                onUpdateUserSettings={handleUpdateUserSettings}
                onLogout={handleLogout}
                onTriggerTestAlarm={handleTriggerTestAlarm}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenCreateModal={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}
          todayPendingCount={todayPendingCount}
        />
      </main>

      {/* Real-time Continuous Ringing Alarm Modal Screen */}
      <AlarmRingingModal
        activeAlarm={activeAlarm}
        onStopAlarm={handleStopAlarm}
        onSnooze={handleSnoozeAlarm}
      />

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultReminderMinutes={currentUser.settings?.defaultReminderMinutes ?? 15}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedDetailTask}
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        onToggleComplete={handleToggleComplete}
        onToggleSubtask={handleToggleSubtask}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTask}
      />

      {/* PWA Mobile Installation Guide Modal */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* User Profile Menu Modal */}
      <UserMenuModal
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        currentUser={currentUser}
        tasks={tasks}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifsDrawerOpen}
        onClose={() => setIsNotifsDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        onSelectTask={handleSelectTaskFromNotif}
      />
    </div>
  );
}

