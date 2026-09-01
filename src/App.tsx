import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Task, TabType, User, AppNotification, UserSettings } from './types';
import { getTodayDateString } from './data/defaultTasks';
import { authStorage } from './utils/authStorage';
import { soundManager } from './utils/audio';
import { checkTaskReminders, sendBrowserNotification } from './utils/reminderEngine';

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
import { AuthModal } from './components/AuthModal';
import { UserMenuModal } from './components/UserMenuModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NotificationBanner } from './components/NotificationBanner';

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User>(() => authStorage.getCurrentUser());

  // User-specific tasks state
  const [tasks, setTasks] = useState<Task[]>(() => authStorage.getUserTasks(currentUser.id));

  // User-specific notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    authStorage.getUserNotifications(currentUser.id)
  );

  // Active floating alert banner
  const [activeAlert, setActiveAlert] = useState<AppNotification | null>(null);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifsDrawerOpen, setIsNotifsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [isDeviceFrameMode, setIsDeviceFrameMode] = useState(true);

  // Save tasks to user storage whenever they change
  useEffect(() => {
    if (currentUser?.id) {
      authStorage.saveUserTasks(currentUser.id, tasks);
    }
  }, [tasks, currentUser?.id]);

  // Handle switching user
  const handleUserChanged = (newUser: User) => {
    setCurrentUser(newUser);
    const newTasks = authStorage.getUserTasks(newUser.id);
    const newNotifs = authStorage.getUserNotifications(newUser.id);
    setTasks(newTasks);
    setNotifications(newNotifs);
    setSelectedDetailTask(null);
    setEditingTask(null);
  };

  // Update user profile or settings
  const handleUpdateUserSettings = (newSettings: Partial<UserSettings>) => {
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

  // Deadline reminder checker interval (every 10 seconds)
  useEffect(() => {
    const runChecker = () => {
      checkTaskReminders(tasks, currentUser, (newAlert) => {
        setNotifications((prev) => [newAlert, ...prev]);
        setActiveAlert(newAlert);
      });
    };

    runChecker();
    const interval = setInterval(runChecker, 10000);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  // Handlers for tasks
  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willBeCompleted = !t.completed;
          if (willBeCompleted) {
            if (currentUser.settings.enableAudioAlerts) {
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
        title: 'Tâche mise à jour ✏️',
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
        subtasks: taskData.subtasks || [],
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);

      // Sound & In-App Alert
      if (currentUser.settings.enableAudioAlerts) {
        soundManager.playCreationChime();
      }

      const dueDetails = newTask.dueTime ? ` prévue pour aujourd'hui à ${newTask.dueTime}` : ` pour le ${newTask.dueDate}`;
      const notif = authStorage.addNotification(currentUser.id, {
        taskId: newTask.id,
        taskTitle: newTask.title,
        title: 'Tâche créée avec succès ! 🚀',
        message: `« ${newTask.title} »${dueDetails}. Rappel automatique configuré.`,
        type: 'created',
      });

      if (currentUser.settings.enableBrowserNotifications) {
        sendBrowserNotification('Nouvelle tâche créée', {
          body: `« ${newTask.title} » ajoutée à votre planning.`,
        });
      }

      setNotifications((prevN) => [notif, ...prevN]);
      setActiveAlert(notif);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
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
    setEditingTask({
      id: '',
      userId: currentUser.id,
      title: '',
      category: 'work',
      priority: 'medium',
      dueDate: dateStr,
      subtasks: [],
      completed: false,
      createdAt: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleResetTasks = () => {
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
    authStorage.markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifs = () => {
    authStorage.clearNotifications(currentUser.id);
    setNotifications([]);
  };

  const handleSelectTaskFromNotif = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setSelectedDetailTask(found);
    }
  };

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

        {/* Dynamic App Header with Profile & Notification Bell */}
        <AppHeader
          currentUser={currentUser}
          unreadNotifsCount={unreadNotifsCount}
          onOpenNotifications={() => setIsNotifsDrawerOpen(true)}
          onOpenUserMenu={() => setIsUserMenuOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onUpdateUserSettings={handleUpdateUserSettings}
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

      {/* Accounts & Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      {/* User Profile Menu Modal */}
      <UserMenuModal
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        currentUser={currentUser}
        tasks={tasks}
        onOpenSwitchAccount={() => {
          setIsUserMenuOpen(false);
          setIsAuthModalOpen(true);
        }}
        onUserUpdated={(updated) => setCurrentUser(updated)}
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
