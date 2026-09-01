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
  Users,
  Play,
  Check,
  AlertCircle,
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
  onOpenAuthModal: () => void;
  onUpdateUserSettings: (settings: Partial<UserSettings>) => void;
}

export const SettingsView: React.FC<Props> = ({
  tasks,
  currentUser,
  onResetTasks,
  onClearCompleted,
  onImportTasks,
  onOpenInstallModal,
  onOpenAuthModal,
  onUpdateUserSettings,
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
    downloadAnchor.setAttribute('download', `taches_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Exportation réussie en JSON !');
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
            showFeedback('Tâches importées avec succès !');
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
      sendBrowserNotification('Notifications activées ! 🎉', {
        body: 'Vous recevrez désormais des rappels à l\'approche de vos tâches.',
      });
      soundManager.playReminderChime();
      showFeedback('Notifications système autorisées et testées !');
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
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
          Paramètres & Compte
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Gérez vos préférences de rappels, alertes et votre espace privé.
        </p>

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Current User Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-3">
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                  Connecté
                </span>
              </div>
              <p className="text-xs text-neutral-500">{currentUser.email}</p>
              {currentUser.role && (
                <p className="text-[10px] text-indigo-600 font-medium">{currentUser.role}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.99] text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-100"
        >
          <Users size={15} />
          <span>Changer d'utilisateur / Créer un nouveau compte</span>
        </button>
      </div>

      {/* Notifications & Reminders Preferences */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Bell size={16} className="text-amber-500" />
          <span>Rappels & Alertes Sonores</span>
        </h3>

        {/* Audio Alerts Toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Volume2 size={14} className="text-indigo-600" />
              <span>Sons & Carillons intégrés</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Joue un carillon lors de la création et des rappels
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentUser.settings?.enableAudioAlerts ?? true}
              onChange={(e) =>
                onUpdateUserSettings({ enableAudioAlerts: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>

        {/* Audio Test buttons */}
        <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 space-y-2">
          <span className="text-[11px] font-bold text-neutral-700 block">
            Tester les sons d'alerte :
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleTestSound('creation')}
              className="py-1.5 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play size={11} className="text-indigo-600" />
              <span>Création tâche</span>
            </button>
            <button
              onClick={() => handleTestSound('reminder')}
              className="py-1.5 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play size={11} className="text-amber-500" />
              <span>Rappel approche</span>
            </button>
            <button
              onClick={() => handleTestSound('due')}
              className="py-1.5 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play size={11} className="text-red-500" />
              <span>Échéance atteinte</span>
            </button>
            <button
              onClick={() => handleTestSound('complete')}
              className="py-1.5 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play size={11} className="text-emerald-500" />
              <span>Tâche finie</span>
            </button>
          </div>
        </div>

        {/* Default Reminder Lead time */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            Délai de rappel par défaut à l'approche
          </label>
          <select
            value={currentUser.settings?.defaultReminderMinutes ?? 15}
            onChange={(e) =>
              onUpdateUserSettings({ defaultReminderMinutes: Number(e.target.value) })
            }
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={0}>À l'heure exacte (0 min avant)</option>
            <option value={5}>5 minutes avant l'échéance</option>
            <option value={15}>15 minutes avant l'échéance</option>
            <option value={30}>30 minutes avant l'échéance</option>
            <option value={60}>1 heure avant l'échéance</option>
          </select>
        </div>

        {/* Browser Notifications Permission */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                Notifications système (Bureau & Mobile)
              </span>
              <span className="text-[11px] text-neutral-500">
                Statut actuel :{' '}
                <strong className={permissionStatus === 'granted' ? 'text-emerald-600' : 'text-amber-600'}>
                  {permissionStatus === 'granted' ? 'Autorisé' : 'Non activé'}
                </strong>
              </span>
            </div>
            <button
              onClick={handleRequestPermission}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              {permissionStatus === 'granted' ? 'Tester l\'alerte' : 'Autoriser'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile App Installation Banner */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-5 border border-indigo-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950">
                Installer sur votre téléphone
              </h3>
              <p className="text-[11px] text-indigo-700">
                PWA plein écran sans téléchargement sur Store
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenInstallModal}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone size={14} />
          <span>Voir le guide d'installation mobile</span>
        </button>
      </div>

      {/* Data Management Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" />
          <span>Données & Sauvegarde de l'espace</span>
        </h3>

        <p className="text-xs text-neutral-500">
          Vos données sont enregistrées en toute sécurité dans l'espace de votre compte.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 active:scale-[0.99] border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Exporter mes tâches</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 active:scale-[0.99] border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload size={14} />
            <span>Importer JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        <div className="pt-2 border-t border-neutral-100 space-y-2">
          {completedCount > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Supprimer les ${completedCount} tâche(s) terminée(s) de votre compte ?`)) {
                  onClearCompleted();
                  showFeedback('Tâches terminées supprimées.');
                }
              }}
              className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-amber-50 text-neutral-700 hover:text-amber-700 border border-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Nettoyer les tâches terminées ({completedCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser les tâches avec les données de démonstration de votre profil ?')) {
                onResetTasks();
                showFeedback('Tâches réinitialisées.');
              }
            }}
            className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 border border-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Réinitialiser les tâches démo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
