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
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Task, CategoryId, Priority, SubTask, AlarmSoundType } from '../types';
import { CATEGORIES, getTodayDateString, getRelativeDateString } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';
import { soundManager } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'> & { id?: string }) => void;
  initialTask?: Task | null;
  defaultReminderMinutes?: number;
  defaultAlarmSound?: AlarmSoundType;
}

const QUICK_TIMES = [
  { label: '09:00', value: '09:00' },
  { label: '12:00', value: '12:00' },
  { label: '14:30', value: '14:30' },
  { label: '18:00', value: '18:00' },
  { label: '20:00', value: '20:00' },
];

const REMINDER_OPTIONS = [
  { label: 'À l\'heure et minute exacte de la tâche (0 min - Recommandé)', value: 0 },
  { label: '5 minutes avant', value: 5 },
  { label: '10 minutes avant', value: 10 },
  { label: '15 minutes avant', value: 15 },
  { label: '30 minutes avant', value: 30 },
  { label: '1 heure avant', value: 60 },
];

const ALARM_SOUND_OPTIONS: { id: AlarmSoundType; label: string; desc: string }[] = [
  { id: 'digital', label: '⏰ Alarme Digitale', desc: 'Bip-Bip classique et percutant' },
  { id: 'melodic', label: '🎵 Réveil Harmonique', desc: 'Mélodie ascendante énergique' },
  { id: 'siren', label: '🚨 Sirène d\'Urgence', desc: 'Alerte haute intensité' },
  { id: 'gentle', label: '🔔 Carillon Zen', desc: 'Cloches douces et claires' },
];

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultReminderMinutes = 15,
  defaultAlarmSound = 'digital',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [dueTime, setDueTime] = useState('');
  const [reminder, setReminder] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(defaultReminderMinutes);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundType>(defaultAlarmSound);
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
      setReminderMinutesBefore(initialTask.reminderMinutesBefore ?? (defaultReminderMinutes ?? 0));
      setAlarmSound(initialTask.alarmSound || defaultAlarmSound);
      setSubtasks(initialTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('work');
      setPriority('medium');
      setDueDate(getTodayDateString());
      setDueTime('');
      setReminder(true);
      setReminderMinutesBefore(defaultReminderMinutes ?? 0);
      setAlarmSound(defaultAlarmSound);
      setSubtasks([]);
    }
    setError('');
  }, [initialTask, isOpen, defaultReminderMinutes, defaultAlarmSound]);

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

  // Calculate the exact time the alarm will sound
  const calculateAlarmTime = () => {
    if (!dueTime) return null;
    const [h, m] = dueTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;

    let targetTotalMin = h * 60 + m - reminderMinutesBefore;
    if (targetTotalMin < 0) targetTotalMin += 24 * 60;
    const targetH = Math.floor(targetTotalMin / 60) % 24;
    const targetM = targetTotalMin % 60;
    return `${targetH.toString().padStart(2, '0')}:${targetM.toString().padStart(2, '0')}`;
  };

  const calculatedAlarmTime = calculateAlarmTime();

  // Check if chosen time is already past today
  const isPastTimeToday = (() => {
    if (!dueDate || !dueTime) return false;
    const today = getTodayDateString();
    if (dueDate !== today) return false;
    const [h, m] = dueTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const taskMin = h * 60 + m;
    return taskMin < currentMin;
  })();

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
      alarmSound,
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
                  ? 'Mettez à jour les détails et la sonnerie d\'alarme'
                  : 'Définissez l\'échéance, la sonnerie et les rappels sonores'}
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
                  <span>Heure précise</span>
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

            {/* Enhanced Smart Alarm & Reminder System */}
            {dueTime && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-indigo-50/40 to-purple-50/50 border border-indigo-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <BellRing size={16} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <span>Système d'Alarme & Sonnerie</span>
                        <span className="px-1.5 py-0.2 bg-indigo-200/70 text-indigo-900 rounded text-[9px] font-black uppercase">
                          Réveil
                        </span>
                      </h4>
                      <p className="text-[10px] text-indigo-700">
                        Sonne en continu avec vibrations comme un vrai réveil
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
                  <div className="space-y-3 pt-1">
                    {/* Timing Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                        Moment du déclenchement de l'alarme
                      </label>
                      <select
                        value={reminderMinutesBefore}
                        onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-indigo-950 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      >
                        {REMINDER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Calculated Time Live Preview Banner */}
                    {calculatedAlarmTime && (
                      <div className="p-2.5 bg-indigo-600/10 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-indigo-800">
                          {reminderMinutesBefore === 0
                            ? `⚡ L'alarme sonnera exactement à l'heure et minute de la tâche (${dueTime})`
                            : `⚡ L'alarme sonnera à ${calculatedAlarmTime} (${reminderMinutesBefore} min avant ${dueTime})`}
                        </span>
                        <span className="text-[11px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                          {reminderMinutesBefore === 0 ? dueTime : calculatedAlarmTime}
                        </span>
                      </div>
                    )}

                    {/* Past Time Warning */}
                    {isPastTimeToday && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-sm">⚠️</span>
                        <div className="text-[11px] leading-relaxed">
                          <strong className="font-bold">Heure passée aujourd'hui :</strong> L'heure indiquée ({dueTime}) est déjà passée. L'alarme ne sonnera pas immédiatement pour éviter toute sonnerie intempestive.
                        </div>
                      </div>
                    )}

                    {/* Alarm Ringtone Choice & Test */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          <Volume2 size={12} className="text-indigo-600" />
                          <span>Choix de la sonnerie d'alarme</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => soundManager.testAlarmSound(alarmSound)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-indigo-200 cursor-pointer active:scale-95"
                        >
                          <Volume2 size={11} />
                          <span>Écouter un extrait</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {ALARM_SOUND_OPTIONS.map((snd) => {
                          const isSelected = alarmSound === snd.id;
                          return (
                            <button
                              key={snd.id}
                              type="button"
                              onClick={() => {
                                setAlarmSound(snd.id);
                                soundManager.testAlarmSound(snd.id);
                              }}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-neutral-800 border-indigo-100 hover:border-indigo-200'
                              }`}
                            >
                              <div className="text-[11px] font-bold truncate">
                                {snd.label}
                              </div>
                              <div
                                className={`text-[9px] truncate ${
                                  isSelected ? 'text-indigo-100' : 'text-neutral-500'
                                }`}
                              >
                                {snd.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
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

