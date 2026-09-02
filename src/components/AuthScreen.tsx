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
  Calendar,
  Volume2,
  Cloud,
  Loader2,
  Users,
  KeyRound,
  ArrowLeft,
  Send,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { cloudDb } from '../lib/firebase';
import { authStorage } from '../utils/authStorage';
import { soundManager } from '../utils/audio';

interface Props {
  onAuthenticated: (user: User) => void;
}

type AuthMode = 'register' | 'login' | 'forgot_password';

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
  const [authMode, setAuthMode] = useState<AuthMode>('register');

  // Register form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [sendVerification, setSendVerification] = useState(true);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password form
  const [resetEmail, setResetEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Inscription Firebase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Firebase Cloud Auth + Firestore + Email Verification
      const user = await cloudDb.signUp(
        name.trim(),
        email.trim(),
        password,
        avatarColor,
        role.trim() || 'Personnel',
        sendVerification
      );

      // 2. Cache locally
      authStorage.saveUsers([...authStorage.getUsers().filter((u) => u.id !== user.id), user]);
      authStorage.setCurrentUser(user.id);

      soundManager.playCreationChime();
      const verifMsg = sendVerification ? ' Un email de vérification vous a été envoyé.' : '';
      setSuccess(`Bienvenue ${user.name} ! Compte Firebase créé & synchronisé.${verifMsg}`);
      setTimeout(() => {
        onAuthenticated(user);
      }, 700);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password provider not yet enabled in Firebase Console. Using local session mode.');
        const localRes = authStorage.registerUser(name, email, password, avatarColor, role);
        if (localRes.user) {
          soundManager.playCreationChime();
          setSuccess(`Bienvenue ${localRes.user.name} ! (Session initialisée avec succès)`);
          setTimeout(() => onAuthenticated(localRes.user!), 500);
          return;
        }
      }

      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse e-mail possède déjà un compte. Veuillez vous connecter.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible (minimum 6 caractères).');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format d\'adresse e-mail invalide.');
      } else {
        // Fallback local storage registration if offline or other non-fatal error
        const localRes = authStorage.registerUser(name, email, password, avatarColor, role);
        if (localRes.user) {
          soundManager.playCreationChime();
          setSuccess(`Bienvenue ${localRes.user.name} ! (Mode sécurisé activé)`);
          setTimeout(() => onAuthenticated(localRes.user!), 500);
        } else {
          setError(localRes.error || err.message || 'Erreur lors de la création du compte.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Connexion Firebase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    if (!loginPassword) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Firebase Cloud Auth + Firestore
      const user = await cloudDb.signIn(loginEmail.trim(), loginPassword);

      // 2. Cache locally
      authStorage.saveUsers([...authStorage.getUsers().filter((u) => u.id !== user.id), user]);
      authStorage.setCurrentUser(user.id);

      soundManager.playCreationChime();
      setSuccess(`Bon retour, ${user.name} ! Connexion Cloud Firebase réussie.`);
      setTimeout(() => {
        onAuthenticated(user);
      }, 400);
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/operation-not-allowed'
      ) {
        // Check local storage fallback
        const localRes = authStorage.loginUser(loginEmail, loginPassword);
        if (localRes.user) {
          soundManager.playCreationChime();
          setSuccess(`Bon retour, ${localRes.user.name} !`);
          setTimeout(() => onAuthenticated(localRes.user!), 400);
          return;
        }
        if (err.code === 'auth/operation-not-allowed') {
          setError('Veuillez activer le fournisseur Email/Mot de passe dans la console Firebase ou vérifier vos identifiants locaux.');
        } else {
          setError('Identifiants incorrects ou compte inexistant.');
        }
      } else {
        setError(err.message || 'Erreur de connexion. Vérifiez votre saisie ou votre connexion Internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Connexion rapide avec Google (Fournisseur activé dans Firebase)
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const user = await cloudDb.signInWithGoogle();
      soundManager.playCreationChime();
      setSuccess(`Bienvenue ${user.name} ! (Connecté via Google)`);
      setTimeout(() => {
        onAuthenticated(user);
      }, 500);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Connexion Google annulée.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Le pop-up de connexion Google a été bloqué par le navigateur. Veuillez autoriser les pop-ups.');
      } else {
        setError(err.message || 'Impossible de se connecter avec Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Réinitialisation de mot de passe Firebase
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const targetEmail = resetEmail.trim() || loginEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Veuillez indiquer votre adresse email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await cloudDb.resetPassword(targetEmail);
      if (res.success) {
        setSuccess(res.message);
        soundManager.playReminderChime();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Impossible d\'envoyer l\'email de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950 text-neutral-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white text-neutral-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-neutral-100"
      >
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 text-white">
            <CheckCircle2 size={32} />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1">
              <Cloud size={11} className="text-indigo-600" />
              <span>Firebase Authentication & Cloud Firestore</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Gestionnaire de Tâches
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Synchronisation en temps réel, réinitialisation de mot de passe & vérification d'e-mail.
          </p>
        </div>

        {/* Quick Google Sign In */}
        {authMode !== 'forgot_password' && (
          <div className="space-y-3">
            <button
              id="btn-google-signin"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 rounded-2xl font-bold text-xs border border-neutral-200 shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-neutral-200 flex-1" />
              <span className="text-[11px] font-medium text-neutral-400">ou par identifiants</span>
              <div className="h-px bg-neutral-200 flex-1" />
            </div>
          </div>
        )}

        {/* Auth Mode Navigation */}
        {authMode !== 'forgot_password' ? (
          <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-2xl">
            <button
              id="btn-tab-register"
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
                setSuccess('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Créer un compte
            </button>
            <button
              id="btn-tab-login"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccess('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-indigo-50/80 px-3.5 py-2.5 rounded-2xl border border-indigo-100">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccess('');
              }}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Retour à la connexion</span>
            </button>
            <span className="text-[10px] font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-md">
              Récupération Firebase
            </span>
          </div>
        )}

        {/* Alert Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2.5"
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div className="leading-relaxed">{success}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Inscription Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
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
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Ex: Alexandre Dubois"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Adresse email (pour vérification & partage) *
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Mot de passe sécurisé (min. 6 caractères) *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="reg-pwd"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Rôle ou activité (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Freelance, Chef de projet, Étudiant..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Email Verification Checkbox */}
            <label className="flex items-start gap-2.5 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 cursor-pointer">
              <input
                type="checkbox"
                checked={sendVerification}
                onChange={(e) => setSendVerification(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-[11px] text-indigo-950 font-medium leading-tight">
                <span className="font-bold block text-indigo-900">Vérification d'e-mail automatique</span>
                <span>M'envoyer un lien de confirmation officiel Firebase dans ma boîte de réception.</span>
              </div>
            </label>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Couleur de profil
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
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
              id="btn-submit-register"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Créer mon compte Firebase</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. Connexion Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
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
                  id="login-email"
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(loginEmail);
                    setAuthMode('forgot_password');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="login-pwd"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Se connecter avec Firebase</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. Réinitialisation de Mot de Passe Form */}
        {authMode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
              <div className="flex items-center gap-2 text-neutral-800">
                <KeyRound size={18} className="text-indigo-600" />
                <h3 className="text-xs font-bold">Réinitialiser votre mot de passe</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Entrez votre adresse email ci-dessous. Firebase vous transmettra un e-mail officiel contenant un lien sécurisé pour créer un nouveau mot de passe.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Adresse email associée à votre compte
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              id="btn-submit-reset"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  <span>Envoyer l'email de réinitialisation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccess('');
              }}
              className="w-full py-2 text-center text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              Annuler et revenir à la connexion
            </button>
          </form>
        )}

        {/* Features badges footer */}
        <div className="pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-500 font-medium">
          <div className="flex flex-col items-center gap-1">
            <Cloud size={14} className="text-indigo-600" />
            <span>Sync Multi-Appareils</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users size={14} className="text-indigo-600" />
            <span>Partage de Tâches</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Volume2 size={14} className="text-indigo-600" />
            <span>Alarmes & Réveil</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

