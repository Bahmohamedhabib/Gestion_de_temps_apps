import React, { useState, useEffect } from 'react';
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
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  BellRing,
  Volume2,
  WifiOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'android' | 'ios' | 'qrcode'>('install');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  // App direct URL
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-dev-x42n5fv6o4hxjrzifad23g-2977624234.europe-west2.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch(console.error);
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDirect = () => {
    window.open(appUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/70 backdrop-blur-sm">
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
          className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 border border-neutral-200 dark:border-neutral-800"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <Smartphone size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Application Mobile Réelle
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full">
                    Installable
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Android APK • iOS iPhone • Notifications & Alarmes système
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Warning inside iframe preview */}
          {isInIframe && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
              <span className="text-base mt-0.5">⚠️</span>
              <div className="text-xs text-amber-900 dark:text-amber-200 flex-1 leading-relaxed">
                <p className="font-semibold">Vous êtes actuellement dans l'aperçu web d'AI Studio :</p>
                <p className="mt-0.5 opacity-90">
                  Les navigateurs bloquent la sonnerie d'alarme et les notifications en arrière-plan à l'intérieur d'un aperçu intégré (iframe). Pour que votre téléphone sonne écran éteint, ouvrez le lien directement sur votre smartphone !
                </p>
                <button
                  onClick={handleOpenDirect}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  <ExternalLink size={13} />
                  Ouvrir l'application dans un nouvel onglet
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 flex gap-1 border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('install')}
              className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'install'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              🚀 Installer sur le téléphone
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'android'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              🤖 Guide Android (WebAPK)
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ios'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              🍎 Guide iPhone (iOS)
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'qrcode'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              📱 Scanner QR Code
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-neutral-700 dark:text-neutral-300">
            {/* TAB: INSTALL */}
            {activeTab === 'install' && (
              <div className="space-y-4">
                {/* 1-Click Install Button if supported */}
                {isInstallable && (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-sm">
                      <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Installation Directe Détectée
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                      Votre appareil prend en charge l'installation directe en 1 clic. L'application apparaîtra comme une vraie application sur votre écran d'accueil.
                    </p>
                    <button
                      onClick={handleInstallClick}
                      disabled={installing}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <Download size={16} />
                      {installing ? 'Installation en cours...' : 'Installer l\'application maintenant'}
                    </button>
                  </div>
                )}

                {/* Direct Link Box */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white text-xs">
                      Lien direct vers l'application mobile :
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copied ? 'Copié !' : 'Copier le lien'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-600 dark:text-neutral-300 break-all select-all">
                    {appUrl}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenDirect}
                      className="flex-1 py-2 px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ExternalLink size={14} />
                      Ouvrir dans Chrome / Safari
                    </button>
                  </div>
                </div>

                {/* Why Mobile App is the Solution */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-neutral-800/70 dark:to-neutral-800/40 border border-indigo-100 dark:border-neutral-700 space-y-3">
                  <div className="font-bold text-xs flex items-center gap-2 text-indigo-950 dark:text-indigo-300">
                    <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Pourquoi passer en vraie application mobile ?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-indigo-100/50 dark:border-neutral-700/50">
                      <Volume2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">Alarme téléphone éteint</span>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mt-0.5">
                          Sonne même en veille ou application fermée
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-indigo-100/50 dark:border-neutral-700/50">
                      <BellRing size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">Push Natif Prioritaire</span>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mt-0.5">
                          Plein écran sur le lockscreen avec actions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-indigo-100/50 dark:border-neutral-700/50">
                      <WifiOff size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">Mode 100% Hors-ligne</span>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mt-0.5">
                          Vos tâches et alarmes restent actives sans Internet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-indigo-100/50 dark:border-neutral-700/50">
                      <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">Sans navigateur</span>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mt-0.5">
                          Expérience plein écran native comme sur le Play Store
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANDROID */}
            {activeTab === 'android' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                      🤖
                    </span>
                    <span>Installation Android (Génération automatique WebAPK)</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    Sur Android, Google Chrome transforme cette application en une <strong>véritable application native (WebAPK)</strong> enregistrée dans les paramètres Android, avec canal de notification prioritaire, sonnerie et vibration système.
                  </p>
                  <ol className="space-y-3 list-decimal list-inside pl-1 text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-100 dark:border-neutral-700">
                      <strong>Étape 1 :</strong> Ouvrez l'application dans <strong>Google Chrome</strong> sur votre téléphone (pas dans l'aperçu AI Studio).
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-100 dark:border-neutral-700">
                      <strong>Étape 2 :</strong> Appuyez sur le menu <MoreVertical size={13} className="inline text-emerald-600" /> en haut à droite de Chrome.
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-100 dark:border-neutral-700">
                      <strong>Étape 3 :</strong> Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-100 dark:border-neutral-700">
                      <strong>Étape 4 :</strong> Lancez l'application depuis votre écran d'accueil et touchez <strong>« Activer les notifications »</strong> pour autoriser le canal d'alarme système.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB: IOS */}
            {activeTab === 'ios' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white text-sm">
                    <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs shadow-xs">
                      🍎
                    </span>
                    <span>Installation iPhone & iPad (Safari iOS)</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Sur iOS (Apple), les notifications Push Web sont actives dès que l'application est ajoutée à l'écran d'accueil (nécessite iOS 16.4+).
                  </p>
                  <ol className="space-y-3 list-decimal list-inside pl-1 text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <strong>Étape 1 :</strong> Ouvrez le lien direct de l'application dans <strong>Safari</strong>.
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <strong>Étape 2 :</strong> Appuyez sur le bouton de Partage <Share size={13} className="inline text-indigo-600" /> en bas de l'écran de Safari.
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <strong>Étape 3 :</strong> Faites défiler vers le bas et appuyez sur <PlusSquare size={13} className="inline text-indigo-600" /> <strong>« Sur l'écran d'accueil »</strong>.
                    </li>
                    <li className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <strong>Étape 4 :</strong> Appuyez sur <strong>Ajouter</strong> en haut à droite.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB: QR CODE */}
            {activeTab === 'qrcode' && (
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center space-y-3">
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                  Scannez avec l'appareil photo de votre téléphone
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                  Pointez l'appareil photo de votre smartphone Android ou iPhone pour ouvrir directement l'application et l'installer :
                </p>

                {qrCodeUrl ? (
                  <div className="p-4 bg-white rounded-2xl shadow-md border border-neutral-200 inline-block">
                    <img src={qrCodeUrl} alt="QR Code d'installation mobile" className="w-52 h-52 block" />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-neutral-200 animate-pulse rounded-2xl flex items-center justify-center">
                    <QrCode size={40} className="text-neutral-400" />
                  </div>
                )}

                <div className="pt-2 flex flex-col items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Lien copié dans le presse-papier !' : 'Copier l\'adresse URL'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-3">
            <button
              onClick={handleOpenDirect}
              className="py-2.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ExternalLink size={14} />
              Ouvrir en plein écran
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
