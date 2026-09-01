import React from 'react';
import { CheckSquare, Calendar, BarChart3, Settings, Plus } from 'lucide-react';
import { TabType } from '../types';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenCreateModal: () => void;
  todayPendingCount: number;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenCreateModal,
  todayPendingCount,
}) => {
  return (
    <div className="relative z-30">
      {/* Floating Action Button */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40">
        <button
          id="btn-quick-add-task"
          onClick={onOpenCreateModal}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 cursor-pointer"
          aria-label="Ajouter une nouvelle tâche"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-2 flex items-center justify-around shadow-sm">
        <button
          id="nav-tab-tasks"
          onClick={() => onTabChange('tasks')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-indigo-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 font-medium'
          }`}
        >
          <div className="relative">
            <CheckSquare size={20} strokeWidth={activeTab === 'tasks' ? 2.5 : 2} />
            {todayPendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {todayPendingCount > 9 ? '9+' : todayPendingCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">Tâches</span>
        </button>

        <button
          id="nav-tab-calendar"
          onClick={() => onTabChange('calendar')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-indigo-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 font-medium'
          }`}
        >
          <Calendar size={20} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">Calendrier</span>
        </button>

        {/* Space for the middle FAB */}
        <div className="w-10" />

        <button
          id="nav-tab-stats"
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'text-indigo-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 font-medium'
          }`}
        >
          <BarChart3 size={20} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">Statistiques</span>
        </button>

        <button
          id="nav-tab-settings"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-indigo-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 font-medium'
          }`}
        >
          <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">Réglages</span>
        </button>
      </nav>
    </div>
  );
};
