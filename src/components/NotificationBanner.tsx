import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { AppNotification } from '../types';

interface Props {
  alert: AppNotification | null;
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
}

export const NotificationBanner: React.FC<Props> = ({
  alert,
  onClose,
  onOpenTask,
}) => {
  // Auto-dismiss banner after 6 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  if (!alert) return null;

  const getTheme = () => {
    switch (alert.type) {
      case 'created':
        return {
          bg: 'bg-indigo-900/95',
          border: 'border-indigo-700',
          icon: <Sparkles size={16} className="text-indigo-300" />,
        };
      case 'reminder':
        return {
          bg: 'bg-amber-900/95',
          border: 'border-amber-700',
          icon: <Clock size={16} className="text-amber-300" />,
        };
      case 'due':
        return {
          bg: 'bg-red-900/95',
          border: 'border-red-700',
          icon: <AlertTriangle size={16} className="text-red-300" />,
        };
      case 'completed':
        return {
          bg: 'bg-emerald-900/95',
          border: 'border-emerald-700',
          icon: <CheckCircle2 size={16} className="text-emerald-300" />,
        };
      default:
        return {
          bg: 'bg-neutral-900/95',
          border: 'border-neutral-700',
          icon: <Bell size={16} className="text-neutral-300" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <AnimatePresence>
      <div className="absolute top-12 left-3 right-3 z-40">
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`${theme.bg} ${theme.border} text-white p-3.5 rounded-2xl shadow-xl backdrop-blur-md border flex items-start justify-between gap-3`}
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 rounded-xl bg-white/10 shrink-0 mt-0.5">
              {theme.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-tight">
                  {alert.title}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-white/80 mt-0.5 line-clamp-2 leading-tight">
                {alert.message}
              </p>

              {alert.taskId && (
                <button
                  onClick={() => {
                    onOpenTask(alert.taskId!);
                    onClose();
                  }}
                  className="mt-2 text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Consulter la tâche</span>
                  <ArrowRight size={10} />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
