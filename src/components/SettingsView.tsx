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
} from 'lucide-react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onResetTasks: () => void;
  onClearCompleted: () => void;
  onImportTasks: (tasks: Task[]) => void;
  onOpenInstallModal: () => void;
}

export const SettingsView: React.FC<Props> = ({
  tasks,
  onResetTasks,
  onClearCompleted,
  onImportTasks,
  onOpenInstallModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mes_taches_${new Date().toISOString().split('T')[0]}.json`);
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

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
          Paramètres de l'application
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Gérez vos données, la sauvegarde locale et les préférences.
        </p>

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
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
          Sauvegarde & Données
        </h3>
        <p className="text-xs text-neutral-500">
          Toutes vos tâches sont sauvegardées automatiquement dans la mémoire locale de votre appareil.
        </p>

        <div className="pt-2 space-y-2">
          <button
            onClick={handleExport}
            className="w-full p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-800 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Download size={16} />
              </div>
              <div className="text-left">
                <div>Exporter mes tâches</div>
                <div className="text-[10px] text-neutral-400 font-normal">Télécharger une sauvegarde JSON</div>
              </div>
            </div>
            <span className="text-[11px] text-indigo-600 font-bold">Exporter</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-800 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Upload size={16} />
              </div>
              <div className="text-left">
                <div>Importer des tâches</div>
                <div className="text-[10px] text-neutral-400 font-normal">Restaurer depuis un fichier JSON</div>
              </div>
            </div>
            <span className="text-[11px] text-violet-600 font-bold">Importer</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Cleaning Actions */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">
          Actions rapides
        </h3>

        <div className="space-y-2 pt-1">
          <button
            disabled={completedCount === 0}
            onClick={onClearCompleted}
            className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-colors ${
              completedCount === 0
                ? 'bg-neutral-50 border-neutral-200/60 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-50 hover:bg-rose-50 border-neutral-200/80 text-rose-700 hover:border-rose-200 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Trash2 size={16} />
              </div>
              <div className="text-left">
                <div>Nettoyer les tâches terminées</div>
                <div className="text-[10px] text-neutral-400 font-normal">{completedCount} tâche(s) terminée(s)</div>
              </div>
            </div>
            <span className="text-[11px] font-bold">Supprimer</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser les tâches avec les exemples initiaux ?')) {
                onResetTasks();
                showFeedback('Données réinitialisées avec succès.');
              }
            }}
            className="w-full p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-700 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <RotateCcw size={16} />
              </div>
              <div className="text-left">
                <div>Réinitialiser les données de démo</div>
                <div className="text-[10px] text-neutral-400 font-normal">Recharger les tâches d'exemple</div>
              </div>
            </div>
            <span className="text-[11px] text-neutral-500 font-bold">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-neutral-100/80 rounded-3xl p-4 text-center text-xs text-neutral-500 space-y-1">
        <div className="font-semibold text-neutral-700">Gestionnaire de Tâches Mobile</div>
        <div className="text-[11px] text-neutral-400">Version 1.0.0 • Mobile First Experience</div>
      </div>
    </div>
  );
};
