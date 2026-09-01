import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Inbox,
} from 'lucide-react';
import { Task, CategoryId, FilterStatus, SortOption } from '../types';
import { CATEGORIES, getTodayDateString } from '../data/defaultTasks';
import { TaskCard } from './TaskCard';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const TasksView: React.FC<Props> = ({
  tasks,
  onToggleComplete,
  onOpenTaskDetail,
  onEditTask,
  onDeleteTask,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('today');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const todayStr = getTodayDateString();

  // Compute daily stats for progress widget
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (filterStatus === 'today') {
        return task.dueDate === todayStr;
      } else if (filterStatus === 'upcoming') {
        return task.dueDate > todayStr && !task.completed;
      } else if (filterStatus === 'completed') {
        return task.completed;
      } else if (filterStatus === 'overdue') {
        return task.dueDate < todayStr && !task.completed;
      }

      return true;
    }).sort((a, b) => {
      // Always put completed tasks at the bottom if viewing mixed status
      if (filterStatus !== 'completed' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortBy === 'dueDate') {
        return (a.dueDate + (a.dueTime || '')) > (b.dueDate + (b.dueTime || '')) ? 1 : -1;
      }
      if (sortBy === 'priority') {
        const pOrder = { high: 3, medium: 2, low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [tasks, searchQuery, filterStatus, selectedCategory, sortBy, todayStr]);

  const overdueCount = tasks.filter((t) => t.dueDate < todayStr && !t.completed).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner / Progress card */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-5 text-white shadow-lg shadow-indigo-600/20">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Aujourd'hui
            </span>
            <h2 className="text-xl font-bold tracking-tight mt-0.5">
              Bonjour ! 👋
            </h2>
            <p className="text-xs text-indigo-100/90 mt-1 max-w-[200px]">
              {todayTotal === 0
                ? 'Aucune tâche prévue pour aujourd\'hui.'
                : todayCompleted === todayTotal
                ? 'Bravo ! Toutes vos tâches du jour sont terminées 🎉'
                : `${todayCompleted} sur ${todayTotal} tâche(s) réalisée(s). Continuez !`}
            </p>
          </div>

          {/* Progress Circular Meter */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-indigo-400/30"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-white transition-all duration-700 ease-out"
                strokeDasharray={`${todayPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xs font-bold font-mono">{todayPercent}%</span>
            </div>
          </div>
        </div>

        {/* Quick Add shortcut banner button */}
        <button
          onClick={onOpenCreateModal}
          className="mt-4 w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 active:scale-[0.99] backdrop-blur-sm rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
        >
          <Plus size={15} />
          <span>Ajouter une tâche rapidement</span>
        </button>
      </div>

      {/* Search & Sort Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            id="input-search-tasks"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-2xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-neutral-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
            >
              Effacer
            </button>
          )}
        </div>

        <div className="relative">
          <button
            id="btn-toggle-sort-menu"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              showSortMenu
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-neutral-200/90 text-neutral-600 hover:bg-neutral-50 shadow-2xs'
            }`}
            title="Trier"
          >
            <ArrowUpDown size={15} />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Trier par
              </div>
              <button
                onClick={() => { setSortBy('dueDate'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${sortBy === 'dueDate' ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-neutral-700 hover:bg-neutral-50'}`}
              >
                Date d'échéance
              </button>
              <button
                onClick={() => { setSortBy('priority'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${sortBy === 'priority' ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-neutral-700 hover:bg-neutral-50'}`}
              >
                Priorité (Haute à Basse)
              </button>
              <button
                onClick={() => { setSortBy('title'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${sortBy === 'title' ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-neutral-700 hover:bg-neutral-50'}`}
              >
                Titre alphabétique
              </button>
              <button
                onClick={() => { setSortBy('createdAt'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${sortBy === 'createdAt' ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-neutral-700 hover:bg-neutral-50'}`}
              >
                Date de création
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'today', label: "Aujourd'hui", count: todayTasks.length },
          { id: 'upcoming', label: 'À venir', count: tasks.filter((t) => t.dueDate > todayStr && !t.completed).length },
          { id: 'all', label: 'Toutes', count: tasks.length },
          { id: 'completed', label: 'Terminées', count: tasks.filter((t) => t.completed).length },
          ...(overdueCount > 0
            ? [{ id: 'overdue', label: 'En retard', count: overdueCount, isOverdue: true }]
            : []),
        ].map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id}`}
              onClick={() => setFilterStatus(tab.id as FilterStatus)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? (tab as any).isOverdue
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-neutral-900 text-white shadow-xs'
                  : (tab as any).isOverdue
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-200/70 text-neutral-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
            selectedCategory === 'all'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Toutes catégories
        </button>

        {Object.values(CATEGORIES).map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50/80 text-indigo-900 font-semibold ring-1 ring-indigo-400'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <CategoryIcon category={cat.id} size={12} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2.5 pt-1">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 px-4 text-center rounded-3xl bg-white border border-neutral-200/80 my-2"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center mb-3">
                <Inbox size={24} />
              </div>
              <h4 className="text-sm font-bold text-neutral-800">
                Aucune tâche trouvée
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Aucun résultat pour cette recherche. Essayez un autre mot-clé.'
                  : 'Vous n\'avez aucune tâche dans cette vue pour le moment.'}
              </p>
              <button
                onClick={onOpenCreateModal}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Créer une tâche</span>
              </button>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
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
