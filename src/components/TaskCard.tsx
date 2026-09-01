import React from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Clock,
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  ListOrdered,
} from 'lucide-react';
import { Task } from '../types';
import { CATEGORIES } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';
import { getRelativeDateBadge, formatFrenchDate } from '../utils/dateUtils';

interface Props {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<Props> = ({
  task,
  onToggleComplete,
  onClick,
  onEdit,
  onDelete,
}) => {
  const category = CATEGORIES[task.category] || CATEGORIES.work;
  const dateBadge = getRelativeDateBadge(task.dueDate, task.completed);
  
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const priorityConfig = {
    high: {
      label: 'Priorité Haute',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50 border-rose-200',
      dotColor: 'bg-rose-500',
    },
    medium: {
      label: 'Moyenne',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      dotColor: 'bg-amber-500',
    },
    low: {
      label: 'Basse',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50 border-slate-200',
      dotColor: 'bg-slate-400',
    },
  }[task.priority];

  const dateBadgeStyles = {
    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    today: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    tomorrow: 'bg-sky-50 text-sky-700 border-sky-200',
    upcoming: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }[dateBadge.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border transition-all duration-200 bg-white ${
        task.completed
          ? 'border-neutral-200/70 bg-neutral-50/70 opacity-75 shadow-none'
          : 'border-neutral-200/90 shadow-sm hover:shadow-md hover:border-neutral-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Custom Animated Checkbox */}
          <button
            id={`btn-toggle-task-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 border ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : 'border-neutral-300 hover:border-indigo-500 hover:bg-indigo-50/50 bg-white'
            }`}
            aria-label={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
          >
            {task.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check size={14} strokeWidth={3} />
              </motion.div>
            )}
          </button>

          {/* Task Content */}
          <div
            onClick={() => onClick(task)}
            className="flex-1 min-w-0 cursor-pointer select-none"
          >
            <div className="flex items-center justify-between gap-2">
              <h4
                className={`text-[15px] font-semibold tracking-tight transition-all truncate ${
                  task.completed
                    ? 'line-through text-neutral-400 font-normal'
                    : 'text-neutral-900'
                }`}
              >
                {task.title}
              </h4>
            </div>

            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                  task.completed ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 max-w-[120px] bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.completed || completedSubtasks === totalSubtasks
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                  <ListOrdered size={12} className="text-neutral-400" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}

            {/* Meta Tags Row */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              {/* Category */}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  backgroundColor: category.bgLight,
                  color: category.color,
                  borderColor: `${category.color}30`,
                }}
              >
                <CategoryIcon category={task.category} size={11} />
                <span>{category.label}</span>
              </span>

              {/* Priority badge if medium or high */}
              {task.priority !== 'low' && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${priorityConfig.bgColor} ${priorityConfig.textColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotColor}`} />
                  {priorityConfig.label}
                </span>
              )}

              {/* Due Date & Time */}
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${dateBadgeStyles}`}
                >
                  <Calendar size={11} />
                  <span>{dateBadge.text}</span>
                  {task.dueTime && (
                    <span className="opacity-80 font-mono text-[10px]">
                      {task.dueTime}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              id={`btn-edit-task-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Modifier"
            >
              <Edit2 size={15} />
            </button>
            <button
              id={`btn-delete-task-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
