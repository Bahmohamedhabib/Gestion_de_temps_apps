import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Inbox,
  CheckCircle,
} from 'lucide-react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { getDaysOfWeek, formatFullFrenchDate } from '../utils/dateUtils';
import { getTodayDateString } from '../data/defaultTasks';

interface Props {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenCreateModalWithDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<Props> = ({
  tasks,
  onToggleComplete,
  onOpenTaskDetail,
  onEditTask,
  onDeleteTask,
  onOpenCreateModalWithDate,
}) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayDateString());

  // Calculate centered week date based on offset
  const centerDate = new Date();
  centerDate.setDate(centerDate.getDate() + currentWeekOffset * 7);
  const days = getDaysOfWeek(centerDate);

  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDateStr);
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Calendar Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Vue Calendrier
            </span>
            <h2 className="text-base font-bold text-neutral-900 capitalize">
              {centerDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-neutral-600 cursor-pointer"
              title="Semaine précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                setCurrentWeekOffset(0);
                setSelectedDateStr(getTodayDateString());
              }}
              className="px-2 py-1 text-[11px] font-bold hover:bg-white rounded-lg transition-colors text-neutral-700 cursor-pointer"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-neutral-600 cursor-pointer"
              title="Semaine suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7-Days Strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;
            const dayTaskCount = tasks.filter((t) => t.dueDate === day.dateStr).length;
            const hasPending = tasks.some((t) => t.dueDate === day.dateStr && !t.completed);

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600 ring-offset-2'
                    : day.isToday
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200/50'
                }`}
              >
                <span className="text-[10px] font-medium opacity-80 mb-0.5">
                  {day.dayName}
                </span>
                <span className="text-sm font-bold font-mono">
                  {day.dayNumber}
                </span>

                {/* Dot indicator if has tasks */}
                {dayTaskCount > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : hasPending
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 capitalize">
            {formatFullFrenchDate(selectedDateObj)}
          </h3>
          <p className="text-xs text-neutral-500">
            {dayTasks.length} tâche(s) • {completedDayTasks} terminée(s)
          </p>
        </div>

        <button
          onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Plus size={14} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Tasks for the selected day */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {dayTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 px-4 text-center rounded-3xl bg-white border border-neutral-200/80 my-2"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center mb-3">
                <CalendarIcon size={22} />
              </div>
              <h4 className="text-sm font-bold text-neutral-800">
                Aucune tâche prévue ce jour-là
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Profitez de votre temps libre ou planifiez une nouvelle tâche.
              </p>
              <button
                onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Programmer une tâche</span>
              </button>
            </motion.div>
          ) : (
            dayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onOpenTaskDetail}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
