import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Bell,
  Calendar,
  Layers,
  Volume2,
} from 'lucide-react';
import { User } from '../types';
import { authStorage } from '../utils/authStorage';
import { soundManager } from '../utils/audio';

interface Props {
  onAuthenticated: (user: User) => void;
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

export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [isRegister, setIsRegister] = useState(true);

  // Register form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!email.trim()) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    const res = authStorage.registerUser(
      name,
      email,
      password,
      avatarColor,
      role
    );

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.user) {
      soundManager.playCreationChime();
      setSuccess(`Bienvenue ${res.user.name} ! Votre espace est prêt.`);
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 500);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }

    const res = authStorage.loginUser(loginEmail, loginPassword);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.user) {
      soundManager.playCreationChime();
      setSuccess(`Bon retour, ${res.user.name} !`);
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950 text-neutral-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white text-neutral-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-neutral-100"
      >
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 text-white">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Gestionnaire de Tâches
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Organisez vos journées, suivez votre calendrier par semaine et mois, et recevez des alertes sonores fiables.
          </p>
        </div>

        {/* Tab Switcher (Créer un compte / Se connecter) */}
        <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
              setSuccess('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegister
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Créer mon compte
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
              setSuccess('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegister
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Se connecter
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Forms */}
        {isRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nom complet *
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  required
                  placeholder="Ex: Alexandre Dubois"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Adresse email *
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Mot de passe (optionnel pour ce terminal)
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Rôle ou activité (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Étudiant, Manager, Freelance, Particulier..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Couleur de profil
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      avatarColor === color
                        ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                        : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer mt-2"
            >
              <span>Accéder à mon espace privé</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer mt-2"
            >
              <span>Se connecter</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Features badges footer */}
        <div className="pt-4 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-500">
          <div className="flex flex-col items-center gap-1">
            <Calendar size={14} className="text-indigo-600" />
            <span>Vue Jour, Semaine & Mois</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Volume2 size={14} className="text-indigo-600" />
            <span>Alertes sonores & PWA</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={14} className="text-indigo-600" />
            <span>Compte 100% privé</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
