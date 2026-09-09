import React, { useState, useEffect } from 'react';
import { BellRing, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { requestNotificationPermission, sendBrowserNotification } from '../utils/reminderEngine';

interface Props {
  onPermissionChanged?: (permission: NotificationPermission) => void;
}

export const PhoneNotificationBanner: React.FC<Props> = ({ onPermissionChanged }) => {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsActivating(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (onPermissionChanged) onPermissionChanged(result);

      if (result === 'granted') {
        setShowSuccess(true);
        // Dispatch test confirmation notification to show up in phone notification drawer
        sendBrowserNotification('✅ Notifications du téléphone activées !', {
          body: 'Vos rappels de tâches sonneront et vibreront à l\'heure exacte, même en veille !',
          tag: 'welcome-notification',
        });
        setTimeout(() => setShowSuccess(false), 6000);
      }
    } catch (e) {
      console.warn('Error activating notifications', e);
    } finally {
      setIsActivating(false);
    }
  };

  // If already granted and not showing temporary success message, we can hide or show a mini confirmation
  if (permission === 'granted' && !showSuccess) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm mb-3">
      {showSuccess ? (
        <div className="bg-emerald-50 border-emerald-200/80 p-4 text-emerald-950 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
              <span>Notifications activées avec succès !</span>
              <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px] font-extrabold uppercase">
                Actif
              </span>
            </h4>
            <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
              Une notification test a été envoyée dans la barre de votre téléphone. Vos alarmes sonneront à l'heure et minute exacte de vos tâches !
            </p>
          </div>
        </div>
      ) : permission === 'denied' ? (
        <div className="bg-amber-50 border-amber-200 p-4 text-amber-950 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-amber-950">
              Notifications bloquées sur ce téléphone
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Pour que le téléphone sonne en veille, autorisez les notifications : appuyez sur l'icône de cadenas ou paramètres 🔒 à gauche de l'adresse web dans votre navigateur, puis réglez <strong>Notifications sur « Autoriser »</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-indigo-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <BellRing size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider">
                  Important
                </span>
                <span className="text-[10px] font-semibold text-indigo-700">
                  Comme Facebook, Instagram ou Snap
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-neutral-900 mt-1">
                Accéder aux notifications du téléphone
              </h4>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                Activez les notifications pour que vos tâches sonnent et vibrent à l'heure et minute exacte, même si l'application est fermée ou votre téléphone en veille.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={isActivating}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BellRing size={13} />
                  <span>{isActivating ? 'Activation...' : 'Activer les notifications'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
