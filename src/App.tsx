import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Task, TabType } from './types';
import { INITIAL_TASKS, getTodayDateString } from './data/defaultTasks';
import { StatusBar } from './components/StatusBar';
import { BottomNav } from './components/BottomNav';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { InstallPwaModal } from './components/InstallPwaModal';

const STORAGE_KEY = 'mobile_task_manager_data_v1';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [isDeviceFrameMode, setIsDeviceFrameMode] = useState(true);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

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

  // Handlers
  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willBeCompleted = !t.completed;
          return {
            ...t,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            // Also mark all subtasks if completing the main task
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
    } else {
      // Create new
      const newTask: Task = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        subtasks: taskData.subtasks || [],
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
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
    setTasks(INITIAL_TASKS);
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  const todayStr = getTodayDateString();
  const todayPendingCount = tasks.filter(
    (t) => t.dueDate === todayStr && !t.completed
  ).length;

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center sm:p-4 md:p-6 select-none font-sans text-neutral-900">
      {/* Top Desktop Controls Bar */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-white/80 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone size={16} className="text-indigo-400" />
          <span>Aperçu Mobile</span>
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
        {/* Status Bar */}
        <StatusBar />

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
                onResetTasks={handleResetTasks}
                onClearCompleted={handleClearCompleted}
                onImportTasks={handleImportTasks}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
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
    </div>
  );
}
