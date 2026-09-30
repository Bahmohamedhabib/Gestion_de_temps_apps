import React, { useRef, useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Smartphone,
  Info,
  ShieldCheck,
  Sparkles,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  Check,
  AlertCircle,
  LogOut,
  Vibrate,
  Clock,
  Radio,
  Cloud,
  Users,
  RefreshCw,
  AlertOctagon,
  Square,
} from 'lucide-react';
import { Task, User, UserSettings, AlarmSoundType, ActiveAlarm } from '../types';
import { soundManager } from '../utils/audio';
import {
  requestNotificationPermission,
  sendBrowserNotification,
  triggerTestAlarm,
  subscribeToWebPush,
  triggerServerTestPush,
} from '../utils/reminderEngine';

interface Props {
  tasks: Task[];
  currentUser: User;
  activeAlarm?: ActiveAlarm | null;
  onStopAlarm?: () => void;
  onResetTasks: () => void;
  onClearCompleted: () => void;
  onImportTasks: (tasks: Task[]) => void;
  onOpenInstallModal: () => void;
  onUpdateUserSettings: (settings: Partial<UserSettings>) => void;
  onLogout: () => void;
  onTriggerTestAlarm: (sound: AlarmSoundType) => void;
}

const ALARM_SOUND_OPTIONS: { id: AlarmSoundType; label: string; desc: string }[] = [
  { id: 'digital', label: '⏰ Alarme Digitale', desc: 'Bip-Bip classique et percutant' },
  { id: 'melodic', label: '🎵 Réveil Harmonique', desc: 'Mélodie ascendante tonique' },
  { id: 'siren', label: '🚨 Sirène d\'Urgence', desc: 'Alerte haute intensité' },
  { id: 'gentle', label: '🔔 Carillon Zen', desc: 'Cloches douces et résonnantes' },
];

const REMINDER_LEAD_OPTIONS = [
  { label: 'À l\'heure exacte (0 min)', value: 0 },
  { label: '5 minutes avant', value: 5 },
  { label: '10 minutes avant', value: 10 },
  { label: '15 minutes avant (Standard)', value: 15 },
  { label: '30 minutes avant', value: 30 },
  { label: '1 heure avant', value: 60 },
];

export const SettingsView: React.FC<Props> = ({
  tasks,
  currentUser,
  activeAlarm,
  onStopAlarm,
  onResetTasks,
  onClearCompleted,
  onImportTasks,
  onOpenInstallModal,
  onUpdateUserSettings,
  onLogout,
  onTriggerTestAlarm,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Live subscription to SoundManager state
  const [isAudioRinging, setIsAudioRinging] = useState<boolean>(() => soundManager.isRinging);
  const [previewSound, setPreviewSound] = useState<AlarmSoundType | null>(() => soundManager.previewingSound);

  useEffect(() => {
    return soundManager.subscribe(() => {
      setIsAudioRinging(soundManager.isRinging);
      setPreviewSound(soundManager.previewingSound);
    });
  }, []);

  const isAlarmActive = Boolean(activeAlarm || isAudioRinging);

  const completedCount = tasks.filter((t) => t.completed).length;

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleStopAnyAlarm = () => {
    soundManager.stopAlarm();
    if (onStopAlarm) {
      onStopAlarm();
    }
    showFeedback("L'alarme a été arrêtée avec succès !");
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mes_taches_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Exportation réussie de vos données en JSON !');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportTasks(parsed);
            showFeedback('Vos tâches ont été importées avec succès !');
          } else {
            alert('Format de fichier invalide (doit être un tableau de tâches).');
          }
        } catch (err) {
          alert('Erreur lors de la lecture du fichier JSON.');
        }
      };
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      onUpdateUserSettings({ enableBrowserNotifications: true });
      await subscribeToWebPush(currentUser.id);
      await triggerServerTestPush(currentUser.id, currentUser.settings?.defaultAlarmSound || 'digital');
      soundManager.playReminderChime();
      showFeedback('Notifications Web Push activées ! Test envoyé sur votre téléphone.');
    } else {
      showFeedback('Autorisation de notification refusée dans le navigateur.');
    }
  };

  const currentSound = currentUser.settings?.defaultAlarmSound || 'digital';

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
          Paramètres & Système d'Alarme
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Gérez vos sonneries de réveil, les alertes d'approche (15 min avant) et la persistance sur votre téléphone.
        </p>

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Mobile Smartphone Diagnostic & Readiness Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-xs">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">
                Diagnostic Spécial Téléphones Portables
              </h3>
              <p className="text-xs text-neutral-500">
                Optimisations spécifiques Android & iPhone / Safari
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Moteur Audio Mobile
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Double Flux WAV + Synth</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Prêt pour haut-parleurs smartphone
            </p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Maintien Écran Allumé
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-800">
              <span className={`w-2 h-2 rounded-full ${soundManager.isWakeLockSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{soundManager.isWakeLockSupported ? 'Wake Lock Actif' : 'Non supporté'}</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Garde l'écran allumé pendant l'alarme
            </p>
          </div>
        </div>

        {/* 4 Essential Mobile Rules for Alarms */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-amber-950">
          <h4 className="text-xs font-black flex items-center gap-1.5 text-amber-900">
            <AlertOctagon size={14} className="text-amber-600" />
            <span>4 conseils essentiels pour que l'alarme sonne fort sur votre téléphone :</span>
          </h4>
          <ul className="text-[11px] space-y-1.5 list-disc pl-4 text-amber-900/90 leading-relaxed font-medium">
            <li>
              <strong>Bouton silencieux physique :</strong> Sur iPhone ou Android, vérifiez que le commutateur latéral de sonnerie n'est pas sur Silencieux / Vibreur seul.
            </li>
            <li>
              <strong>Volume multimédia :</strong> Augmentez le volume des médias / haut-parleur dans les paramètres audio de votre téléphone.
            </li>
            <li>
              <strong>Écran de veille & réveil :</strong> L'application dispose désormais d'une tolérance de rattrapage de 2 heures : dès que vous touchez votre téléphone, toute alarme due sonne instantanément.
            </li>
            <li>
              <strong>Ajouter à l'écran d'accueil :</strong> Installez l'application en PWA via le menu Partager (iOS) ou Installer (Android) pour garantir la persistance des notifications d'arrière-plan.
            </li>
          </ul>

          {isAlarmActive ? (
            <button
              type="button"
              id="btn-mobile-stop-alarm-settings"
              onClick={handleStopAnyAlarm}
              className="mt-2 w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border-2 border-red-300 animate-pulse"
            >
              <VolumeX size={16} />
              <span>ARRÊTER L'ALARME SUR CE TÉLÉPHONE (STOP)</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-mobile-test-alarm-settings"
              onClick={() => {
                soundManager.unlockAudioNow();
                onTriggerTestAlarm(currentSound);
              }}
              className="mt-2 w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Volume2 size={14} />
              <span>Débloquer l'audio & Tester l'alarme sur ce téléphone</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Database & Sync Status Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm space-y-4 border border-indigo-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/50 rounded-xl text-indigo-200 border border-indigo-400/30">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black">Base Cloud Firestore (Temps Réel)</h3>
              <p className="text-[11px] text-indigo-200">Synchronisation active multi-appareils</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connecté</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Smartphone size={12} /> PC & Smartphone
            </div>
            <p className="text-[11px] text-neutral-200 font-medium">
              Vos modifications sur PC apparaissent instantanément sur mobile.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Users size={12} /> Partage d'équipe
            </div>
            <p className="text-[11px] text-neutral-200 font-medium">
              Partagez n'importe quelle tâche via l'email de vos collègues/proches.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> Sécurisé & Gratuit
            </div>
            <p className="text-[11px] text-neutral-200 font-medium">
              Règles de sécurité Firestore garantissant la confidentialité des données.
            </p>
          </div>
        </div>
      </div>

      {/* Current User Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
              style={{ backgroundColor: currentUser.avatarColor || '#4F46E5' }}
            >
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">
                  {currentUser.name}
                </h3>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Compte Cloud
                </span>
              </div>
              <p className="text-xs text-neutral-500">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Alarm Engine & Ringtone Configuration */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-rose-600 to-red-500 text-white rounded-xl shadow-xs">
              <BellRing size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">
                Système de Sonnerie Réveil & Alarme
              </h3>
              <p className="text-xs text-neutral-500">
                Sonne en continu comme une véritable alarme de téléphone
              </p>
            </div>
          </div>
        </div>

        {/* Live Test Alarm Trigger Button & Instant Stop Controls */}
        {isAlarmActive ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white border-2 border-red-400 shadow-xl space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <BellRing size={16} className="animate-spin" />
                <span>Alarme de test active en cours de sonnerie !</span>
              </span>
              <span className="text-[10px] font-black bg-white text-rose-700 px-2 py-0.5 rounded-full">
                Son & Vibreur
              </span>
            </div>
            <p className="text-[11px] text-rose-100 leading-relaxed font-medium">
              La sonnerie retentit en continu comme lors d'une vraie échéance.
            </p>
            <button
              id="btn-stop-test-alarm"
              type="button"
              onClick={handleStopAnyAlarm}
              className="w-full py-4 bg-white hover:bg-neutral-100 active:scale-95 text-rose-700 rounded-2xl text-xs font-black tracking-wider shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-white/80"
            >
              <VolumeX size={18} />
              <span>ARRÊTER L'ALARME DE TEST (STOP)</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <Sparkles size={14} className="text-rose-600" />
                <span>Tester le système d'alarme maintenant</span>
              </span>
              <span className="text-[10px] font-bold bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded-full">
                Temps réel
              </span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Déclenche la sonnerie continue et le panneau d'alarme plein écran avec boutons d'arrêt immédiat et de répétition.
            </p>
            <div className="flex gap-2">
              <button
                id="btn-test-full-alarm"
                type="button"
                onClick={() => onTriggerTestAlarm(currentSound)}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] text-white rounded-xl text-xs font-black tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-400/40"
              >
                <BellRing size={16} className="animate-bounce" />
                <span>DÉCLENCHER L'ALARME EN DIRECT (TEST)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.stopAllSounds();
                  if (onStopAlarm) onStopAlarm();
                  showFeedback("Tous les sons ont été coupés.");
                }}
                title="Couper tout son"
                className="px-3 py-3 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border border-neutral-200 shadow-xs"
              >
                <VolumeX size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Default Sound Ringtone Selection */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Volume2 size={14} className="text-indigo-600" />
              <span>Sonnerie d'alarme par défaut</span>
            </label>
            {previewSound ? (
              <button
                type="button"
                onClick={() => soundManager.stopPreview()}
                className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-xs animate-pulse"
              >
                <VolumeX size={12} />
                <span>Arrêter l'écoute</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => soundManager.testAlarmSound(currentSound)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md cursor-pointer"
              >
                <Volume2 size={11} />
                <span>Écouter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ALARM_SOUND_OPTIONS.map((snd) => {
              const isSelected = currentSound === snd.id;
              const isCurrentlyPreviewing = previewSound === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => {
                    onUpdateUserSettings({ defaultAlarmSound: snd.id });
                    soundManager.testAlarmSound(snd.id);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative ${
                    isCurrentlyPreviewing
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400'
                      : isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold truncate">{snd.label}</div>
                    {isCurrentlyPreviewing && (
                      <span className="p-0.5 bg-white text-rose-700 rounded-full">
                        <VolumeX size={10} />
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isCurrentlyPreviewing
                        ? 'text-rose-100 font-bold'
                        : isSelected
                        ? 'text-indigo-100'
                        : 'text-neutral-500'
                    }`}
                  >
                    {isCurrentlyPreviewing ? 'En lecture (cliquez pour arrêter)' : snd.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Reminder Lead Time */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-600" />
            <span>Délai de rappel par défaut pour les nouvelles tâches</span>
          </label>
          <select
            value={currentUser.settings?.defaultReminderMinutes ?? 15}
            onChange={(e) =>
              onUpdateUserSettings({ defaultReminderMinutes: Number(e.target.value) })
            }
            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {REMINDER_LEAD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-neutral-100">
          {/* Audio toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Volume2 size={16} className="text-neutral-500" />
              <div>
                <span className="text-xs font-bold text-neutral-800 block">
                  Alertes sonores & Carillons
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Faire retentir la sonnerie lors des alarmes et créations
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentUser.settings?.enableAudioAlerts ?? true}
              onChange={(e) =>
                onUpdateUserSettings({ enableAudioAlerts: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          {/* Vibration toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Smartphone size={16} className="text-neutral-500" />
              <div>
                <span className="text-xs font-bold text-neutral-800 block">
                  Vibrations du téléphone
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Vibrer vigoureusement pendant la sonnerie d'alarme
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentUser.settings?.enableVibration ?? true}
              onChange={(e) =>
                onUpdateUserSettings({ enableVibration: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* System Notifications Authorization Section */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-neutral-900">
            Autorisation Système (Écran verrouillé & Arrière-plan)
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              État de la permission du navigateur
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {permissionStatus === 'granted' ? '✓ Autorisé' : 'Non activé'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Permet au téléphone de réveiller l'application et d'afficher les alertes d'alarmes même lorsque l'application est en arrière-plan.
          </p>
          <button
            onClick={handleRequestPermission}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Bell size={14} />
            <span>
              {permissionStatus === 'granted' ? 'Tester la notification système' : 'Activer les notifications système'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile PWA Installation */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone size={18} className="text-indigo-400" />
          <h3 className="text-sm font-bold">Installer comme Application Mobile</h3>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Ajoutez cette application à l'écran d'accueil de votre téléphone (iOS ou Android) pour un accès plein écran sans barre d'adresse et une gestion optimale des réveils.
        </p>
        <button
          onClick={onOpenInstallModal}
          className="w-full py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Smartphone size={14} className="text-indigo-600" />
          <span>Voir les instructions d'installation mobile</span>
        </button>
      </div>

      {/* Data Management Section */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">
          Gestion des données & Sauvegardes
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-between border border-neutral-200/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} className="text-neutral-500" />
              <span>Exporter mes tâches (JSON)</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {tasks.length} tâches
            </span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-between border border-neutral-200/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Upload size={16} className="text-neutral-500" />
              <span>Importer des tâches (JSON)</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="w-full py-2.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-between border border-neutral-200/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={16} className="text-rose-500" />
                <span>Supprimer les tâches terminées</span>
              </div>
              <span className="text-[10px] text-rose-500 font-mono font-bold">
                {completedCount} terminées
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

