import React, { useEffect, useState, useRef } from 'react';
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
  Smartphone,
  X,
} from 'lucide-react';
import { ActiveAlarm, Task } from '../types';
import { CATEGORIES } from '../data/defaultTasks';
import { CategoryIcon } from './CategoryIcon';
import { soundManager } from '../utils/audio';

interface Props {
  alarm?: ActiveAlarm | null;
  activeAlarm?: ActiveAlarm | null;
  onStopAlarm: () => void;
  onSnooze: (task: Task, minutes: number) => void;
  onCompleteTask?: (taskId: string) => void;
}

export const AlarmRingingModal: React.FC<Props> = ({
  alarm,
  activeAlarm,
  onStopAlarm,
  onSnooze,
  onCompleteTask,
}) => {
  const currentAlarm = alarm || activeAlarm;
  const [secondsRinging, setSecondsRinging] = useState(0);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!currentAlarm) {
      setSecondsRinging(0);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
      }
      return;
    }

    // Attempt to acquire screen wake lock so phone display stays lit
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen')
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    }

    const interval = setInterval(() => {
      setSecondsRinging((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
      }
    };
  }, [currentAlarm]);

  if (!currentAlarm) return null;

  const category = CATEGORIES[currentAlarm.task.category] || CATEGORIES.work;
  const isDueNow = currentAlarm.type === 'due_now';
  const isSnooze = currentAlarm.type === 'snooze';
  const isReminder = currentAlarm.type === 'reminder';
  const isTest = currentAlarm.task.id === 'test-alarm' || currentAlarm.title.toLowerCase().includes('test');

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div 
        onClick={() => soundManager.unlockAudioNow()}
        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-colors"
      >
        {/* Pulsing Visual Flasher for Silent Phones */}
        <motion.div
          animate={{
            opacity: [0.15, 0.45, 0.15],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 pointer-events-none ${
            isDueNow || isTest ? 'bg-red-600/30' : 'bg-indigo-600/30'
          }`}
        />

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-neutral-900 text-white rounded-3xl p-6 shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center text-center z-10"
        >
          {/* Close X Button to Stop Alarm Immediately */}
          <button
            type="button"
            id="btn-close-ringing-modal-x"
            onClick={onStopAlarm}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-neutral-300 hover:text-white transition-all cursor-pointer z-30"
            title="Arrêter l'alarme"
          >
            <X size={18} />
          </button>

          {/* Animated Background Pulse Waves */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 2.2, 3],
                opacity: [0.4, 0.2, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className={`w-36 h-36 rounded-full ${
                isDueNow || isTest ? 'bg-rose-600' : 'bg-indigo-600'
              } blur-xl`}
            />
            <motion.div
              animate={{
                scale: [0.8, 1.8, 2.6],
                opacity: [0.5, 0.25, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: 0.4,
                ease: 'easeOut',
              }}
              className={`w-44 h-44 rounded-full ${
                isDueNow || isTest ? 'bg-red-500' : 'bg-amber-500'
              } blur-2xl`}
            />
          </div>

          {/* Alarm Ringing Icon Badge */}
          <div className="relative mt-2 mb-4">
            <motion.div
              animate={{
                rotate: [-14, 14, -14, 14, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/40 ${
                isDueNow || isTest
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500'
                  : 'bg-gradient-to-tr from-indigo-600 to-amber-500'
              }`}
            >
              <BellRing size={38} className="text-white drop-shadow-md animate-pulse" />
            </motion.div>

            {/* Sounding live tag */}
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-xl whitespace-nowrap">
              {isTest ? 'Test en cours' : 'Alarme active'} • {formatTimer(secondsRinging)}
            </span>
          </div>

          {/* Type Header Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black tracking-wide ${
                isTest
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400'
                  : isDueNow
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                  : isReminder
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50'
              }`}
            >
              {isTest && <Sparkles size={13} />}
              {!isTest && isDueNow && <AlertOctagon size={13} />}
              {!isTest && isReminder && <Clock size={13} />}
              {!isTest && isSnooze && <Moon size={13} />}
              <span>{isTest ? 'TEST D\'ALARME EN DIRECT' : currentAlarm.title}</span>
            </span>
          </div>

          {/* Task Main Title */}
          <h2 className="text-xl font-extrabold text-white mt-3 mb-1 line-clamp-2 leading-tight">
            {currentAlarm.task.title}
          </h2>

          {/* Category & Time Information */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: `${category.color}35`,
                color: '#fff',
                borderColor: `${category.color}70`,
                borderWidth: '1px',
              }}
            >
              <CategoryIcon name={category.iconName} color="#fff" size={13} />
              <span>{category.label}</span>
            </span>

            {currentAlarm.task.dueTime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-neutral-200 border border-white/15">
                <Clock size={13} className="text-indigo-300" />
                <span>Prévue à {currentAlarm.task.dueTime}</span>
              </span>
            )}
          </div>

          {currentAlarm.task.description && (
            <p className="text-xs text-neutral-300 mb-3 line-clamp-2 bg-white/5 p-2.5 rounded-xl border border-white/10 w-full text-left">
              {currentAlarm.task.description}
            </p>
          )}

          {/* Fallback Unmute button in case smartphone browser required interaction */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.unlockAudioNow();
              soundManager.startAlarm(currentAlarm.sound || 'digital', true);
            }}
            className="mb-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer w-full"
          >
            <Volume2 size={13} className="text-amber-400" />
            <span>Vous n'entendez rien ? Touchez ici pour réactiver le son</span>
          </button>

          {/* Main Action Buttons */}
          <div className="w-full space-y-2.5 z-10">
            {/* STOP ALARM BUTTON */}
            <button
              id="btn-stop-ringing-alarm"
              type="button"
              onClick={onStopAlarm}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.97] text-white font-black text-sm tracking-wider shadow-2xl flex items-center justify-center gap-2.5 cursor-pointer transition-all border-2 border-red-400/50"
            >
              <VolumeX size={20} />
              <span>{isTest ? 'ARRÊTER LE TEST D\'ALARME (STOP)' : 'ARRÊTER L\'ALARME (STOP)'}</span>
            </button>

            {/* SNOOZE 5 MIN BUTTON & COMPLETE */}
            {!isTest && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-snooze-alarm-5min"
                  type="button"
                  onClick={() => onSnooze(currentAlarm.task, 5)}
                  className="py-3 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/15 shadow-sm"
                >
                  <Moon size={14} className="text-amber-300" />
                  <span>Répéter (5 min)</span>
                </button>

                {/* COMPLETE TASK BUTTON */}
                <button
                  id="btn-complete-alarm-task"
                  type="button"
                  onClick={() => {
                    if (onCompleteTask) onCompleteTask(currentAlarm.task.id);
                    onStopAlarm();
                  }}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-emerald-400/40 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Terminée !</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

