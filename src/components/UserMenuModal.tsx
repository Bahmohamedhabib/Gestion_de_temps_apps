import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Mail,
  Briefcase,
  Calendar,
  LogOut,
  Users,
  Shield,
  Bell,
  CheckCircle2,
  ListTodo,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { User, Task } from '../types';
import { authStorage } from '../utils/authStorage';
import { soundManager } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  tasks: Task[];
  onOpenSwitchAccount: () => void;
  onUserUpdated: (user: User) => void;
}

export const UserMenuModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  tasks,
  onOpenSwitchAccount,
  onUserUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
                  Compte Connecté
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

            {/* Edit Profile Form or Details */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800">
                  Modifier les informations de profil
                </h4>

                <div>
                  <label className="block text-xs text-neutral-600 mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-600 mb-1">Rôle / Métier</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {savedSuccess && (
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Modifications enregistrées !</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] text-neutral-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserIcon size={14} />
                <span>Modifier mon profil</span>
              </button>
            )}

            {/* Switch user / Logout */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenSwitchAccount();
                }}
                className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-100"
              >
                <Users size={16} />
                <span>Changer d'utilisateur ou créer un compte</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
