import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Filter,
  Layers,
  Sparkles,
  Inbox,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Task, CategoryId } from '../types';
import { TaskCard } from './TaskCard';
import {
  getDaysOfWeek,
  getMonthMatrix,
  formatFrenchDate,
  formatFullFrenchDate,
  formatMonthYear,
} from '../utils/dateUtils';
import { CATEGORIES, getTodayDateString } from '../data/defaultTasks';

type CalendarMode = 'day' | 'week' | 'month';

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
  const [mode, setMode] = useState<CalendarMode>('week');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  
  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateString());

  // Filter tasks by selected category
  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  // Week View Calculations
  const weekDays = getDaysOfWeek(currentDate);

  // Month View Calculations
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const monthMatrix = getMonthMatrix(currentYear, currentMonthIndex);

  // Month Tasks
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const monthTasks = filteredTasks.filter((t) => t.dueDate.startsWith(currentMonthPrefix));
  const completedMonthTasks = monthTasks.filter((t) => t.completed).length;

  // Selected Day Tasks
  const dayTasks = filteredTasks.filter((t) => t.dueDate === selectedDateStr);
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (mode === 'day') {
      d.setDate(d.getDate() - 1);
      const newStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newStr);
    } else if (mode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (mode === 'month') {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (mode === 'day') {
      d.setDate(d.getDate() + 1);
      const newStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newStr);
    } else if (mode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (mode === 'month') {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayDateString());
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & View Modes Switcher */}
      <div className="bg-white rounded-3xl p-4.5 border border-neutral-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <CalendarIcon size={12} />
              Calendrier Interactif
            </span>
            <h2 className="text-lg font-bold text-neutral-900 capitalize">
              {mode === 'month'
                ? formatMonthYear(currentDate)
                : mode === 'week'
                ? `Semaine du ${weekDays[0].dayNumber} au ${weekDays[6].dayNumber} ${formatMonthYear(currentDate)}`
                : formatFrenchDate(selectedDateStr)}
            </h2>
          </div>

          {/* Navigation Prev / Today / Next */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-xl transition-all text-neutral-600 cursor-pointer"
              title="Précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white rounded-xl transition-all text-neutral-800 cursor-pointer"
            >
              Aujourd'hui
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-xl transition-all text-neutral-600 cursor-pointer"
              title="Suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs: Jour | Semaine | Mois */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-100/90 p-1 rounded-2xl">
          <button
            onClick={() => setMode('day')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'day'
                ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Jour</span>
          </button>
          <button
            onClick={() => setMode('week')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'week'
                ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Semaine</span>
          </button>
          <button
            onClick={() => setMode('month')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'month'
                ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Mois</span>
          </button>
        </div>

        {/* Category Filter Pills (Scrollable) */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              <Layers size={13} />
              <span>Toutes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategory === 'all' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {tasks.length}
              </span>
            </button>

            {Object.values(CATEGORIES).map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = tasks.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
                  }`}
                  style={isSelected ? { backgroundColor: cat.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }}
                  />
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-black/20 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================= MODE JOUR ======================= */}
      {mode === 'day' && (
        <div className="space-y-4">
          {/* 7-Days Quick Strip */}
          <div className="bg-white rounded-3xl p-3 border border-neutral-200/90 shadow-xs">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isSelected = day.dateStr === selectedDateStr;
                const count = filteredTasks.filter((t) => t.dueDate === day.dateStr).length;
                const hasPending = filteredTasks.some((t) => t.dueDate === day.dateStr && !t.completed);

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDateStr(day.dateStr);
                      setCurrentDate(day.date);
                    }}
                    className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : day.isToday
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-80">{day.dayName}</span>
                    <span className="text-sm font-bold font-mono">{day.dayNumber}</span>
                    {count > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSelected ? 'bg-white' : hasPending ? 'bg-indigo-600' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Info & Add Button */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-neutral-800 capitalize">
                {formatFullFrenchDate(new Date(selectedDateStr + 'T00:00:00'))}
              </h3>
              <p className="text-xs text-neutral-500">
                {dayTasks.length} tâche(s) {selectedCategory !== 'all' ? `(${CATEGORIES[selectedCategory].label})` : ''} • {completedDayTasks} terminée(s)
              </p>
            </div>

            <button
              onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {dayTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 px-4 text-center rounded-3xl bg-white border border-neutral-200/80 my-2"
                >
                  <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Inbox size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">Aucune tâche ce jour-là</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                    Profitez de cette journée libre ou planifiez une nouvelle tâche avec rappels.
                  </p>
                  <button
                    onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Créer une tâche</span>
                  </button>
                </motion.div>
              ) : (
                dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onOpenDetail={onOpenTaskDetail}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ======================= MODE SEMAINE ======================= */}
      {mode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Vue complète de la semaine
              </h3>
              <p className="text-xs text-neutral-500">
                Visualisez et gérez toutes les tâches du lundi au dimanche
              </p>
            </div>
            <button
              onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Nouvelle tâche</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {weekDays.map((day) => {
              const tasksForDay = filteredTasks.filter((t) => t.dueDate === day.dateStr);
              const isToday = day.isToday;

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-3xl p-4 border transition-all ${
                    isToday
                      ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs'
                      : 'bg-white border-neutral-200/90 shadow-2xs'
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <span className="text-[9px] uppercase leading-none opacity-80">
                          {day.dayName}
                        </span>
                        <span className="text-xs font-bold leading-tight">
                          {day.dayNumber}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 capitalize flex items-center gap-1.5">
                          {formatFrenchDate(day.dateStr)}
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[9px] font-bold">
                              Aujourd'hui
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-neutral-500">
                          {tasksForDay.length === 0
                            ? 'Aucune tâche programmée'
                            : `${tasksForDay.length} tâche(s) • ${tasksForDay.filter((t) => t.completed).length} terminée(s)`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenCreateModalWithDate(day.dateStr)}
                      className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                      title="Ajouter une tâche à ce jour"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Tasks List for that day */}
                  {tasksForDay.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-1 pl-1">
                      Rien de prévu pour cette journée.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasksForDay.map((task) => {
                        const cat = CATEGORIES[task.category];
                        return (
                          <div
                            key={task.id}
                            onClick={() => onOpenTaskDetail(task)}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                              task.completed
                                ? 'bg-neutral-50/70 border-neutral-200/60 opacity-60'
                                : 'bg-neutral-50/50 hover:bg-neutral-100/80 border-neutral-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(task.id);
                                }}
                                className={`shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                  task.completed ? 'text-emerald-600' : 'text-neutral-400 hover:text-indigo-600'
                                }`}
                              >
                                {task.completed ? (
                                  <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-100" />
                                ) : (
                                  <Circle size={18} />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-semibold truncate ${
                                    task.completed ? 'line-through text-neutral-500' : 'text-neutral-800'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                                  {task.dueTime && (
                                    <span className="flex items-center gap-0.5 font-mono font-medium text-neutral-600">
                                      <Clock size={10} />
                                      {task.dueTime}
                                    </span>
                                  )}
                                  <span
                                    className="px-1.5 py-0.2 rounded-md font-medium"
                                    style={{
                                      backgroundColor: cat.bgLight,
                                      color: cat.color,
                                    }}
                                  >
                                    {cat.label}
                                  </span>
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <span className="text-neutral-400">
                                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} sous-tâches
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Priority chip */}
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                task.priority === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Moyen' : 'Normal'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= MODE MOIS ======================= */}
      {mode === 'month' && (
        <div className="space-y-4">
          {/* Monthly Stats Summary */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 text-white rounded-3xl p-4.5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Vue Mensuelle Globale
                </span>
                <h3 className="text-base font-bold capitalize">
                  {formatMonthYear(currentDate)}
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-xl text-xs font-mono font-bold text-indigo-200">
                {monthTasks.length} tâches au total
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
              <div className="bg-white/5 rounded-xl py-2">
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {completedMonthTasks}
                </span>
                <p className="text-[10px] text-neutral-300">Terminées</p>
              </div>
              <div className="bg-white/5 rounded-xl py-2">
                <span className="text-xs font-bold font-mono text-amber-400">
                  {monthTasks.length - completedMonthTasks}
                </span>
                <p className="text-[10px] text-neutral-300">En cours</p>
              </div>
              <div className="bg-white/5 rounded-xl py-2">
                <span className="text-xs font-bold font-mono text-indigo-300">
                  {monthTasks.length > 0
                    ? Math.round((completedMonthTasks / monthTasks.length) * 100)
                    : 0}
                  %
                </span>
                <p className="text-[10px] text-neutral-300">Progression</p>
              </div>
            </div>
          </div>

          {/* Month Matrix Grid */}
          <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-xs space-y-2.5">
            {/* Days of week header (Lun, Mar, Mer...) */}
            <div className="grid grid-cols-7 text-center font-bold text-[11px] text-neutral-500 pb-1">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span>Ven</span>
              <span>Sam</span>
              <span>Dim</span>
            </div>

            {/* 42 Cells Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthMatrix.map((cell) => {
                const cellTasks = filteredTasks.filter((t) => t.dueDate === cell.dateStr);
                const isSelected = cell.dateStr === selectedDateStr;
                const hasPending = cellTasks.some((t) => !t.completed);

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[58px] p-1 rounded-2xl flex flex-col items-center justify-start transition-all cursor-pointer relative border ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/30'
                        : cell.isToday
                        ? 'bg-indigo-50/40 border-indigo-300'
                        : cell.isCurrentMonth
                        ? 'bg-neutral-50/50 hover:bg-neutral-100/70 border-neutral-200/60'
                        : 'bg-neutral-100/40 border-transparent opacity-35'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold font-mono w-5 h-5 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'bg-indigo-200 text-indigo-900'
                          : 'text-neutral-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Task dots / pills inside calendar cell */}
                    {cellTasks.length > 0 && (
                      <div className="w-full mt-1 space-y-0.5">
                        {cellTasks.slice(0, 2).map((t) => {
                          const cat = CATEGORIES[t.category];
                          return (
                            <div
                              key={t.id}
                              className="w-full text-[8px] font-medium px-1 py-0.2 rounded truncate text-left"
                              style={{
                                backgroundColor: cat.bgLight,
                                color: cat.color,
                              }}
                            >
                              {t.dueTime ? `${t.dueTime} ` : ''}{t.title}
                            </div>
                          );
                        })}
                        {cellTasks.length > 2 && (
                          <span className="text-[8px] font-bold text-neutral-500 block leading-tight">
                            +{cellTasks.length - 2} autre(s)
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details in Month View */}
          <div className="bg-white rounded-3xl p-4.5 border border-neutral-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Détail du jour sélectionné
                </span>
                <h4 className="text-sm font-bold text-neutral-900 capitalize">
                  {formatFullFrenchDate(new Date(selectedDateStr + 'T00:00:00'))}
                </h4>
              </div>

              <button
                onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Ajouter à ce jour</span>
              </button>
            </div>

            {/* List of tasks for this selected day in month view */}
            {dayTasks.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-3 text-center bg-neutral-50 rounded-2xl">
                Aucune tâche pour cette date. Cliquez sur "Ajouter à ce jour" pour en créer une.
              </p>
            ) : (
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onOpenDetail={onOpenTaskDetail}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
