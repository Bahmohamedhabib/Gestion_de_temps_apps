import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  AlertOctagon,
  Moon,
} from 'lucide-react';
import { ActiveAlarm, Task } from '../types';
import { CATEGORIES } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  alarm: ActiveAlarm | null;
  onStopAlarm: () => void;
  onSnooze: (task: Task, minutes: number) => void;
  onCompleteTask: (taskId: string) => void;
}

export const AlarmRingingModal: React.FC<Props> = ({
  alarm,
  onStopAlarm,
  onSnooze,
  onCompleteTask,
}) => {
  const [secondsRinging, setSecondsRinging] = useState(0);

  useEffect(() => {
    if (!alarm) {
      setSecondsRinging(0);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRinging((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [alarm]);

  if (!alarm) return null;

  const category = CATEGORIES[alarm.task.category] || CATEGORIES.work;
  const isDueNow = alarm.type === 'due';
  const isSnooze = alarm.type === 'snooze';
  const isReminder = alarm.type === 'reminder';

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-neutral-900 text-white rounded-3xl p-6 shadow-2xl border border-white/15 overflow-hidden flex flex-col items-center text-center"
        >
          {/* Animated Background Pulse Waves */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 2.2, 3],
                opacity: [0.35, 0.15, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className={`w-36 h-36 rounded-full ${
                isDueNow ? 'bg-rose-600' : 'bg-indigo-600'
              } blur-xl`}
            />
            <motion.div
              animate={{
                scale: [0.8, 1.8, 2.6],
                opacity: [0.4, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5,
                ease: 'easeOut',
              }}
              className={`w-44 h-44 rounded-full ${
                isDueNow ? 'bg-red-500' : 'bg-amber-500'
              } blur-2xl`}
            />
          </div>

          {/* Alarm Ringing Icon Badge */}
          <div className="relative mt-2 mb-4">
            <motion.div
              animate={{
                rotate: [-12, 12, -12, 12, 0],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 ${
                isDueNow
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500'
                  : 'bg-gradient-to-tr from-indigo-600 to-amber-500'
              }`}
            >
              <BellRing size={38} className="text-white drop-shadow-md animate-pulse" />
            </motion.div>

            {/* Sounding live tag */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white text-neutral-900 text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
              Alarme active • {formatTimer(secondsRinging)}
            </span>
          </div>

          {/* Type Header Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isDueNow
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isReminder
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              {isDueNow && <AlertOctagon size={13} />}
              {isReminder && <Clock size={13} />}
              {isSnooze && <Moon size={13} />}
              <span>{alarm.title}</span>
            </span>
          </div>

          {/* Task Main Title */}
          <h2 className="text-xl font-extrabold text-white mt-3 mb-1 line-clamp-2 leading-tight">
            {alarm.task.title}
          </h2>

          {/* Category & Time Information */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `${category.color}25`,
                color: '#fff',
                borderColor: `${category.color}60`,
                borderWidth: '1px',
              }}
            >
              <CategoryIcon name={category.iconName} color="#fff" size={13} />
              <span>{category.label}</span>
            </span>

            {alarm.task.dueTime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-neutral-200 border border-white/10">
                <Clock size={13} className="text-indigo-300" />
                <span>Prévue à {alarm.task.dueTime}</span>
              </span>
            )}
          </div>

          {alarm.task.description && (
            <p className="text-xs text-neutral-300 mb-4 line-clamp-2 bg-white/5 p-2.5 rounded-xl border border-white/10 w-full text-left">
              {alarm.task.description}
            </p>
          )}

          {/* Main Action Buttons */}
          <div className="w-full space-y-2 mt-2 z-10">
            {/* STOP ALARM BUTTON */}
            <button
              id="btn-stop-ringing-alarm"
              onClick={onStopAlarm}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] text-white font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-red-400/40 animate-bounce-subtle"
            >
              <VolumeX size={18} />
              <span>ARRÊTER L'ALARME</span>
            </button>

            {/* SNOOZE 5 MIN BUTTON */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-snooze-alarm-5min"
                onClick={() => onSnooze(alarm.task, 5)}
                className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/15"
              >
                <Moon size={14} className="text-amber-300" />
                <span>Répéter (5 min)</span>
              </button>

              {/* COMPLETE TASK BUTTON */}
              <button
                id="btn-complete-alarm-task"
                onClick={() => {
                  onCompleteTask(alarm.task.id);
                  onStopAlarm();
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-emerald-400/30"
              >
                <CheckCircle2 size={14} />
                <span>Terminée !</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
