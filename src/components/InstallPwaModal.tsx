import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Installer sur votre téléphone
                </h3>
                <p className="text-xs text-neutral-500">
                  Utilisez l'application en plein écran comme une app native
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

          {/* Guide content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-neutral-700">
            {/* iOS Guide */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xs">
                  🍎
                </span>
                <span>Sur iPhone / iPad (Safari)</span>
              </div>
              <ol className="space-y-2 list-decimal list-inside pl-1 text-neutral-600 leading-relaxed">
                <li>Ouvrez le lien de l'application dans <strong>Safari</strong>.</li>
                <li>
                  Appuyez sur le bouton de partage{' '}
                  <span className="inline-flex items-center p-1 bg-white rounded border border-neutral-300 align-middle">
                    <Share size={12} className="text-indigo-600" />
                  </span>{' '}
                  en bas de l'écran.
                </li>
                <li>
                  Faites défiler et sélectionnez{' '}
                  <span className="font-semibold text-neutral-900">« Sur l'écran d'accueil »</span>{' '}
                  <span className="inline-flex items-center p-1 bg-white rounded border border-neutral-300 align-middle">
                    <PlusSquare size={12} className="text-indigo-600" />
                  </span>.
                </li>
                <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
              </ol>
            </div>

            {/* Android Guide */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                  🤖
                </span>
                <span>Sur Android (Chrome)</span>
              </div>
              <ol className="space-y-2 list-decimal list-inside pl-1 text-neutral-600 leading-relaxed">
                <li>Ouvrez l'application dans <strong>Google Chrome</strong>.</li>
                <li>
                  Appuyez sur le menu{' '}
                  <span className="inline-flex items-center p-1 bg-white rounded border border-neutral-300 align-middle">
                    <MoreVertical size={12} className="text-indigo-600" />
                  </span>{' '}
                  en haut à droite.
                </li>
                <li>
                  Sélectionnez{' '}
                  <span className="font-semibold text-neutral-900">« Ajouter à l'écran d'accueil »</span> ou{' '}
                  <span className="font-semibold text-neutral-900">« Installer l'application »</span>.
                </li>
              </ol>
            </div>

            {/* Benefits */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 space-y-2">
              <div className="font-bold text-xs flex items-center gap-1.5 text-indigo-900">
                <CheckCircle2 size={15} className="text-indigo-600" />
                Avantages de l'application installée :
              </div>
              <ul className="space-y-1 pl-5 list-disc text-[11px] text-indigo-800/90">
                <li>Fonctionne en plein écran sans la barre d'adresse du navigateur.</li>
                <li>Icône dédiée sur votre écran d'accueil avec démarrage ultra rapide.</li>
                <li>Vos tâches sont conservées et accessibles hors-ligne grâce au stockage local.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              J'ai compris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
