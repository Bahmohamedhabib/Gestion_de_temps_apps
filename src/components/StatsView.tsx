import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  TrendingUp,
  Target,
  Flame,
  Clock,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Task } from '../types';
import { CATEGORIES, getTodayDateString } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  tasks: Task[];
}

export const StatsView: React.FC<Props> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const overdueTasks = tasks.filter((t) => t.dueDate < todayStr && !t.completed).length;

  // Category breakdown
  const categoryStats = Object.values(CATEGORIES).map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat.id);
    const catCompleted = catTasks.filter((t) => t.completed).length;
    const rate = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0;
    return {
      category: cat,
      total: catTasks.length,
      completed: catCompleted,
      rate,
    };
  }).filter((c) => c.total > 0);

  // Priority breakdown
  const priorityStats = [
    { label: 'Haute', color: 'bg-rose-500', count: tasks.filter((t) => t.priority === 'high' && !t.completed).length },
    { label: 'Moyenne', color: 'bg-amber-500', count: tasks.filter((t) => t.priority === 'medium' && !t.completed).length },
    { label: 'Basse', color: 'bg-slate-400', count: tasks.filter((t) => t.priority === 'low' && !t.completed).length },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Tableau de bord
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Vos Statistiques
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award size={22} />
          </div>
        </div>

        {/* 2x2 Metric Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold mb-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Complétées</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {completedTasks} <span className="text-xs font-normal text-neutral-500">/ {totalTasks}</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {completionRate}% de réussite
            </div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold mb-1">
              <Flame size={14} className="text-amber-500" />
              <span>Aujourd'hui</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {todayCompleted} <span className="text-xs font-normal text-neutral-500">/ {todayTasks.length}</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
              Tâches du jour
            </div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold mb-1">
              <Clock size={14} className="text-indigo-500" />
              <span>En cours</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {pendingTasks}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              À finaliser
            </div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold mb-1">
              <AlertCircle size={14} className="text-rose-500" />
              <span>En retard</span>
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono">
              {overdueTasks}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              Action requise
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-3.5">
        <h3 className="text-sm font-bold text-neutral-900">
          Progression par catégorie
        </h3>

        {categoryStats.length === 0 ? (
          <p className="text-xs text-neutral-400 py-3 text-center">
            Aucune tâche enregistrée
          </p>
        ) : (
          <div className="space-y-3">
            {categoryStats.map(({ category, total, completed, rate }) => (
              <div key={category.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                    <CategoryIcon category={category.id} size={14} />
                    {category.label}
                  </span>
                  <span className="font-mono text-neutral-500 text-[11px]">
                    {completed}/{total} ({rate}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${rate}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Distribution */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">
          Tâches en attente par niveau d'urgence
        </h3>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {priorityStats.map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs font-semibold text-neutral-700">{item.label}</span>
              </div>
              <div className="text-lg font-bold font-mono text-neutral-900">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
