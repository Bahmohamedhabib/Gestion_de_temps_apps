import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Bell,
  BellRing,
} from 'lucide-react';
import { Task, CategoryId, Priority, SubTask } from '../types';
import { CATEGORIES, getTodayDateString, getRelativeDateString } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'> & { id?: string }) => void;
  initialTask?: Task | null;
  defaultReminderMinutes?: number;
}

const QUICK_TIMES = [
  { label: '09:00', value: '09:00' },
  { label: '12:00', value: '12:00' },
  { label: '14:30', value: '14:30' },
  { label: '18:00', value: '18:00' },
  { label: '20:00', value: '20:00' },
];

const REMINDER_OPTIONS = [
  { label: 'À l\'heure exacte', value: 0 },
  { label: '5 min avant', value: 5 },
  { label: '15 min avant', value: 15 },
  { label: '30 min avant', value: 30 },
  { label: '1h avant', value: 60 },
  { label: '1 jour avant', value: 1440 },
];

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultReminderMinutes = 15,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [dueTime, setDueTime] = useState('');
  const [reminder, setReminder] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(defaultReminderMinutes);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || getTodayDateString());
      setDueTime(initialTask.dueTime || '');
      setReminder(initialTask.reminder ?? true);
      setReminderMinutesBefore(initialTask.reminderMinutesBefore ?? defaultReminderMinutes);
      setSubtasks(initialTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('work');
      setPriority('medium');
      setDueDate(getTodayDateString());
      setDueTime('');
      setReminder(true);
      setReminderMinutesBefore(defaultReminderMinutes);
      setSubtasks([]);
    }
    setError('');
  }, [initialTask, isOpen, defaultReminderMinutes]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez entrer un titre pour la tâche.');
      return;
    }

    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate,
      dueTime: dueTime || undefined,
      reminder: reminder && !!dueTime,
      reminderMinutesBefore: reminder && !!dueTime ? reminderMinutesBefore : undefined,
      subtasks,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                {initialTask?.id ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h3>
              <p className="text-xs text-neutral-500">
                {initialTask?.id
                  ? 'Mettez à jour les détails et vos rappels'
                  : 'Définissez l\'échéance, la priorité et les alertes'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Titre de la tâche *
              </label>
              <input
                id="input-task-title"
                type="text"
                required
                placeholder="Ex: Rédiger le rapport d'analyse..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-2xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Description / Notes (optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ajouter des notes, objectifs ou liens..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-2xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-neutral-400 resize-none"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-neutral-500" />
                <span>Catégorie</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(CATEGORIES).map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs font-bold'
                          : 'border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <CategoryIcon
                        name={cat.iconName}
                        color={cat.color}
                        size={15}
                      />
                      <span className="truncate text-[11px]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-neutral-500" />
                <span>Priorité</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Basse', color: 'text-neutral-700 bg-neutral-100 border-neutral-200', active: 'border-neutral-800 bg-neutral-900 text-white' },
                  { id: 'medium', label: 'Moyenne', color: 'text-amber-700 bg-amber-50 border-amber-200', active: 'border-amber-500 bg-amber-500 text-white' },
                  { id: 'high', label: 'Haute', color: 'text-red-700 bg-red-50 border-red-200', active: 'border-red-500 bg-red-500 text-white' },
                ].map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as Priority)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelected ? p.active : p.color
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-neutral-500" />
                  <span>Date d'échéance</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-2xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-neutral-500" />
                  <span>Heure précise (optionnel)</span>
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-2xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick time suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-500 mr-1">Heure rapide :</span>
              {QUICK_TIMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDueTime(t.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    dueTime === t.value
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {dueTime && (
                <button
                  type="button"
                  onClick={() => setDueTime('')}
                  className="text-[10px] text-red-500 hover:underline ml-1"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Smart Reminder & Notification Setting */}
            {dueTime && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <BellRing size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">
                        Rappel sonore & Alerte
                      </h4>
                      <p className="text-[10px] text-indigo-700">
                        Notification automatique à l'approche de l'heure
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminder}
                      onChange={(e) => setReminder(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>

                {reminder && (
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      Quand vous avertir ?
                    </label>
                    <select
                      value={reminderMinutesBefore}
                      onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs text-indigo-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Subtasks Builder */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-neutral-500" />
                  <span>Sous-tâches ({subtasks.length})</span>
                </span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  Optionnel
                </span>
              </label>

              {subtasks.length > 0 && (
                <div className="space-y-1.5 mb-2.5">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2 px-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-800"
                    >
                      <span className="truncate">{sub.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subtask input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: Étape 1..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="btn-submit-save-task"
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>{initialTask?.id ? 'Enregistrer les modifications' : 'Créer la tâche'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
