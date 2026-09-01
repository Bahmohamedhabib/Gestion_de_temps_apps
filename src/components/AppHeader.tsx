import React from 'react';
import { Bell, Users, Shield, Sparkles } from 'lucide-react';
import { User, AppNotification } from '../types';

interface Props {
  currentUser: User;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenUserMenu: () => void;
  onOpenAuthModal: () => void;
}

export const AppHeader: React.FC<Props> = ({
  currentUser,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenUserMenu,
  onOpenAuthModal,
}) => {
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="px-4 py-2 flex items-center justify-between z-20">
      {/* User profile capsule */}
      <button
        onClick={onOpenUserMenu}
        className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-white/90 hover:bg-white border border-neutral-200/90 shadow-2xs transition-all cursor-pointer group"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-2xs transition-transform group-hover:scale-105"
          style={{ backgroundColor: currentUser.avatarColor || '#4F46E5' }}
        >
          {initials}
        </div>
        <div className="text-left">
          <span className="block text-[11px] font-bold text-neutral-800 leading-tight truncate max-w-[120px]">
            {currentUser.name}
          </span>
        </div>
      </button>

      {/* Right actions: Switch account & Notification Bell */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenAuthModal}
          className="p-2 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-indigo-600 border border-neutral-200/90 shadow-2xs transition-colors cursor-pointer"
          title="Changer d'utilisateur / Créer un compte"
        >
          <Users size={16} />
        </button>

        <button
          id="btn-open-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-indigo-600 border border-neutral-200/90 shadow-2xs transition-colors cursor-pointer"
          title="Notifications et rappels"
        >
          <Bell size={16} />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
