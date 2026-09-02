import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Mail,
  Briefcase,
  Calendar,
  LogOut,
  Shield,
  Bell,
  CheckCircle2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { User, Task } from '../types';
import { authStorage } from '../utils/authStorage';
import { soundManager } from '../utils/audio';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/reminderEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  tasks: Task[];
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

const AVATAR_COLORS = [
  '#4F46E5', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#3B82F6', // Blue
];

export const UserMenuModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  tasks,
  onUserUpdated,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role || '');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || AVATAR_COLORS[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = authStorage.updateUserProfile(currentUser.id, {
      name: name.trim(),
      role: role.trim() || undefined,
      avatarColor,
    });
    if (updated) {
      soundManager.playCreationChime();
      onUserUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsEditing(false);
      }, 700);
    }
  };

  const handleTestNotification = async () => {
    await requestNotificationPermission();
    soundManager.playReminderChime();
    sendBrowserNotification('🔔 Test de notification sonore réussi !', {
      body: 'Vos alertes sonores et de tâches fonctionneront parfaitement même en arrière-plan.',
      tag: 'test-notification',
    });
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 3000);
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
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              <h3 className="text-base font-bold text-neutral-900">
                Mon Espace Personnel
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-3xl p-5 text-white shadow-md flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-inner border-2 border-white/30"
                style={{ backgroundColor: currentUser.avatarColor || '#4F46E5' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                  Compte Privé
                </span>
                <h3 className="text-lg font-bold truncate mt-0.5">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-indigo-100/90 truncate">{currentUser.email}</p>
                {currentUser.role && (
                  <p className="text-[11px] text-indigo-200 mt-0.5 font-medium">
                    {currentUser.role}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center">
                <div className="text-[11px] font-bold text-neutral-400 uppercase">Tâches</div>
                <div className="text-lg font-bold text-neutral-900 mt-0.5">{totalTasks}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <div className="text-[11px] font-bold text-emerald-600 uppercase">Faites</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{completedTasks}</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                <div className="text-[11px] font-bold text-indigo-600 uppercase">Succès</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">{completionRate}%</div>
              </div>
            </div>

            {/* Profile Edition Section */}
            {isEditing ? (
              <form
                onSubmit={handleSaveProfile}
                className="bg-neutral-50 rounded-3xl p-4.5 border border-neutral-200/90 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Modifier mon profil
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-800"
                  >
                    Annuler
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Rôle / Activité
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Couleur d'avatar
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                          avatarColor === color ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Enregistré !</span>
                    </>
                  ) : (
                    <span>Sauvegarder les modifications</span>
                  )}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Modifier mes informations</span>
              </button>
            )}

            {/* Test Background Notifications & Audio */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Volume2 size={15} className="text-indigo-600" />
                  Test de notification & son
                </h4>
                <p className="text-[11px] text-indigo-700/80 mt-0.5">
                  Vérifier que les alertes sonores et push fonctionnent sur cet appareil.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
              >
                {testAlertSent ? 'Envoyé !' : 'Tester'}
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200/70"
            >
              <LogOut size={16} />
              <span>Se déconnecter de ce compte</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
