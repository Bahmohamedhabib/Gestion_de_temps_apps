import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { AppNotification, Task } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectTask: (taskId: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'À l\'instant';
    if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'created':
        return <Sparkles size={16} className="text-indigo-600" />;
      case 'reminder':
        return <Clock size={16} className="text-amber-500" />;
      case 'due':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      default:
        return <Bell size={16} className="text-indigo-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
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
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Centre de Notifications
                </h3>
                <p className="text-xs text-neutral-500">
                  Rappels d'échéances et alertes de vos tâches
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className="px-6 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-600">
                {notifications.length} alerte{notifications.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    <span>Tout marquer lu</span>
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-neutral-400 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Effacer</span>
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <Bell size={24} />
                </div>
                <h4 className="text-sm font-bold text-neutral-800">
                  Aucune notification pour le moment
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Vos rappels d'échéances et confirmations de création de tâches apparaîtront ici.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.taskId) {
                      onSelectTask(notif.taskId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    notif.taskId ? 'cursor-pointer hover:shadow-xs' : ''
                  } ${
                    !notif.read
                      ? 'bg-indigo-50/40 border-indigo-200'
                      : 'bg-white border-neutral-200/80 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-neutral-100 shrink-0 mt-0.5">
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.taskId && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                          <span>Voir la tâche</span>
                          <ExternalLink size={11} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
