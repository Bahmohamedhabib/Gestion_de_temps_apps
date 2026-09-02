import React, { useRef, useState } from 'react';
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
  Volume2,
  VolumeX,
  Play,
  Check,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { Task, User, UserSettings } from '../types';
import { soundManager } from '../utils/audio';
import { requestNotificationPermission, sendBrowserNotification } from '../utils/reminderEngine';

interface Props {
  tasks: Task[];
  currentUser: User;
  onResetTasks: () => void;
  onClearCompleted: () => void;
  onImportTasks: (tasks: Task[]) => void;
  onOpenInstallModal: () => void;
  onUpdateUserSettings: (settings: Partial<UserSettings>) => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<Props> = ({
  tasks,
  currentUser,
  onResetTasks,
  onClearCompleted,
  onImportTasks,
  onOpenInstallModal,
  onUpdateUserSettings,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const completedCount = tasks.filter((t) => t.completed).length;

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
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
      sendBrowserNotification('Notifications activées ! 🔔', {
        body: 'Vous recevrez des rappels sonores à l\'approche de vos échéances.',
      });
      soundManager.playReminderChime();
      showFeedback('Notifications système et sonores autorisées !');
    } else {
      showFeedback('Autorisation de notification refusée dans le navigateur.');
    }
  };

  const handleTestSound = (type: 'creation' | 'reminder' | 'due' | 'complete') => {
    if (type === 'creation') soundManager.playCreationChime();
    if (type === 'reminder') soundManager.playReminderChime();
    if (type === 'due') soundManager.playDueChime();
    if (type === 'complete') soundManager.playCompletionChime();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
          Paramètres & Compte
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Gérez vos préférences de rappels, notifications d'arrière-plan et votre espace privé.
        </p>

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
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
                  Privé
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

      {/* Notifications and Audio Settings Section */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-neutral-900">
            Alertes & Notifications d'arrière-plan
          </h3>
        </div>

        {/* Browser Permission Prompt */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              Autorisation des alertes du système
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {permissionStatus === 'granted' ? 'Autorisé' : 'Non activé'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Permet de faire sonner et d'afficher les alertes même quand l'application est réduite ou fermée.
          </p>
          <button
            onClick={handleRequestPermission}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Bell size={14} />
            <span>
              {permissionStatus === 'granted' ? 'Tester la notification et le son' : 'Activer les notifications'}
            </span>
          </button>
        </div>

        {/* Toggle Controls */}
        <div className="space-y-3 pt-1">
          {/* Audio Chimes Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Volume2 size={16} className="text-neutral-500" />
              <div>
                <span className="text-xs font-bold text-neutral-800 block">
                  Sons et carillons d'alerte
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Jouer un son à la création, au rappel et à l'échéance
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

          {/* Sound Testing Suite */}
          <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 block">
              Tester les mélodies sonores :
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleTestSound('creation')}
                className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play size={11} />
                <span>Création</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestSound('reminder')}
                className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play size={11} />
                <span>Rappel</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestSound('due')}
                className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play size={11} />
                <span>Alarme</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestSound('complete')}
                className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play size={11} />
                <span>Succès</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile PWA Installation */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone size={18} className="text-indigo-400" />
          <h3 className="text-sm font-bold">Installer comme Application Mobile</h3>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Ajoutez cette application à l'écran d'accueil de votre téléphone (iOS ou Android) pour un accès instantané et des alertes hors-ligne.
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
