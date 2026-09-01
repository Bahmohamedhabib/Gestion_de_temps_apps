import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Share2,
  Tag,
  Check,
} from 'lucide-react';
import { Task } from '../types';
import { CATEGORIES } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';
import { formatFrenchDate, getRelativeDateBadge } from '../utils/dateUtils';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<Props> = ({
  task,
  isOpen,
  onClose,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !task) return null;

  const category = CATEGORIES[task.category] || CATEGORIES.work;
  const dateBadge = getRelativeDateBadge(task.dueDate, task.completed);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  const priorityLabels = {
    high: { text: 'Haute', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    medium: { text: 'Moyenne', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    low: { text: 'Basse', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  }[task.priority];

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
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
        >
          {/* Top Bar */}
          <div className="px-6 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                backgroundColor: category.bgLight,
                color: category.color,
                borderColor: `${category.color}30`,
              }}
            >
              <CategoryIcon category={task.category} size={14} />
              <span>{category.label}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                id="btn-detail-edit"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                title="Modifier"
              >
                <Edit2 size={18} />
              </button>
              <button
                id="btn-detail-delete"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="p-2 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
              <button
                id="btn-detail-close"
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer ml-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Title & Check status */}
            <div className="flex items-start gap-3">
              <button
                id="btn-detail-toggle-complete"
                onClick={() => onToggleComplete(task.id)}
                className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'border-neutral-300 hover:border-indigo-500 bg-white'
                }`}
              >
                {task.completed && <Check size={16} strokeWidth={3} />}
              </button>
              <div>
                <h2
                  className={`text-lg font-bold tracking-tight leading-snug ${
                    task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
                  }`}
                >
                  {task.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityLabels.color}`}>
                    Priorité {priorityLabels.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-sm text-neutral-700 leading-relaxed">
                {task.description}
              </div>
            )}

            {/* Timing / Due Date Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date d'échéance
                </div>
                <div className="text-xs font-semibold text-neutral-800">
                  {formatFrenchDate(task.dueDate)}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                  {dateBadge.text}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                  <Clock size={12} /> Heure prévue
                </div>
                <div className="text-xs font-semibold text-neutral-800 font-mono">
                  {task.dueTime || 'Toute la journée'}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {task.reminder ? 'Rappel activé' : 'Sans rappel'}
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Sous-tâches
                </h4>
                {task.subtasks.length > 0 && (
                  <span className="text-xs font-medium text-neutral-500">
                    {completedSubtasks} / {task.subtasks.length} complétée(s)
                  </span>
                )}
              </div>

              {task.subtasks.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  Aucune sous-tâche pour cette tâche.
                </p>
              ) : (
                <div className="space-y-2">
                  {task.subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onToggleSubtask(task.id, sub.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        sub.completed
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-400 line-through'
                          : 'bg-white border-neutral-200/80 text-neutral-800 hover:border-indigo-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                          sub.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {sub.completed && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="flex-1 font-medium">{sub.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            <button
              id="btn-complete-and-close"
              onClick={() => {
                onToggleComplete(task.id);
                onClose();
              }}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                task.completed
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
