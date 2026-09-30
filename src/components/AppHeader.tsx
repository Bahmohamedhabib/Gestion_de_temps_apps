import React from 'react';
import { Bell, Smartphone } from 'lucide-react';
import { User } from '../types';

interface Props {
  currentUser: User;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenUserMenu: () => void;
  onOpenInstallModal: () => void;
}

export const AppHeader: React.FC<Props> = ({
  currentUser,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenUserMenu,
  onOpenInstallModal,
}) => {
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="px-4 py-2.5 flex items-center justify-between z-20">
      {/* User profile capsule */}
      <button
        onClick={onOpenUserMenu}
        className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-white/95 hover:bg-white border border-neutral-200/90 shadow-2xs transition-all cursor-pointer group"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-2xs transition-transform group-hover:scale-105"
          style={{ backgroundColor: currentUser.avatarColor || '#4F46E5' }}
        >
          {initials}
        </div>
        <div className="text-left flex items-center gap-1.5">
          <span className="block text-[11px] font-bold text-neutral-800 leading-tight truncate max-w-[130px]">
            {currentUser.name}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connecté" />
        </div>
      </button>

      {/* Right actions: Mobile App button + Notification Bell */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-2xs text-[11px] font-bold transition-all cursor-pointer"
          title="Installer l'application sur votre téléphone Android ou iPhone"
        >
          <Smartphone size={13} />
          <span>App Mobile</span>
        </button>

        <button
          id="btn-open-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-indigo-600 border border-neutral-200/90 shadow-2xs transition-colors cursor-pointer"
          title="Notifications et alertes de tâches"
        >
          <Bell size={16} />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

