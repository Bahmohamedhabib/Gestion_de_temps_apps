import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  Users,
} from 'lucide-react';
import { User } from '../types';
import { authStorage } from '../utils/authStorage';
import { soundManager } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
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

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [tab, setTab] = useState<'switch' | 'register' | 'login'>('switch');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regColor, setRegColor] = useState(AVATAR_COLORS[0]);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const allUsers = authStorage.getUsers();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const res = authStorage.registerUser(
      regName,
      regEmail,
      regPassword,
      regColor,
      regRole
    );

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.user) {
      soundManager.playCreationChime();
      setSuccess(`Compte créé avec succès pour ${res.user.name} !`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 600);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const res = authStorage.loginUser(loginEmail, loginPassword);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.user) {
      soundManager.playCreationChime();
      setSuccess(`Bon retour, ${res.user.name} !`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 500);
    }
  };

  const handleQuickSwitch = (user: User) => {
    authStorage.setCurrentUser(user.id);
    soundManager.playCreationChime();
    onUserChanged(user);
    onClose();
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
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor || '#4F46E5' }}
              >
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Comptes & Utilisateurs
                </h3>
                <p className="text-xs text-neutral-500">
                  Chaque personne a ses tâches et rappels privés
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

          {/* Tab Navigation */}
          <div className="px-6 pt-3 pb-2 bg-neutral-50 border-b border-neutral-100 flex gap-2">
            <button
              onClick={() => {
                setTab('switch');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'switch'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users size={14} />
              <span>Changer ({allUsers.length})</span>
            </button>

            <button
              onClick={() => {
                setTab('register');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <UserPlus size={14} />
              <span>Créer un compte</span>
            </button>

            <button
              onClick={() => {
                setTab('login');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LogIn size={14} />
              <span>Connexion</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* TAB 1: SWITCH USER */}
            {tab === 'switch' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Sélectionnez un profil pour charger son espace de travail et ses tâches privées :
                </p>

                <div className="space-y-2">
                  {allUsers.map((u) => {
                    const isActive = u.id === currentUser.id;
                    const initials = u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleQuickSwitch(u)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isActive
                            ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                            : 'bg-white border-neutral-200 hover:border-indigo-200 hover:bg-neutral-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                            style={{ backgroundColor: u.avatarColor || '#4F46E5' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900">
                                {u.name}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                                  Actif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500">{u.email}</p>
                            {u.role && (
                              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                                {u.role}
                              </p>
                            )}
                          </div>
                        </div>

                        {!isActive && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-indigo-600">
                            <span>Ouvrir</span>
                            <ArrowRight size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setTab('register');
                      setError('');
                    }}
                    className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus size={15} />
                    <span>Créer un nouvel utilisateur</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTER */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sophie Martin"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="sophie.martin@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Rôle / Profession (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Responsable Marketing, Développeur..."
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Couleur de profil
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRegColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          regColor === c ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus size={16} />
                  <span>Créer mon compte et ouvrir l'espace</span>
                </button>
              </form>
            )}

            {/* TAB 3: LOGIN */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="votre.email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn size={16} />
                  <span>Se connecter à mon compte</span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
