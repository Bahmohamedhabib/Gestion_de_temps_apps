import React, { useState, useEffect } from 'react';
import { BellRing, CheckCircle2, AlertTriangle, Send, Sparkles } from 'lucide-react';
import { requestNotificationPermission, sendBrowserNotification, subscribeToWebPush, triggerServerTestPush } from '../utils/reminderEngine';

interface Props {
  onPermissionChanged?: (permission: NotificationPermission) => void;
  userId?: string;
}

export const PhoneNotificationBanner: React.FC<Props> = ({ onPermissionChanged, userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsActivating(true);
    setTestResult(null);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (onPermissionChanged) onPermissionChanged(result);

      if (result === 'granted') {
        // Register Web Push subscription with server
        await subscribeToWebPush(userId);

        setShowSuccess(true);
        // Dispatch test confirmation notification from server
        await triggerServerTestPush(userId);

        setTimeout(() => setShowSuccess(false), 8000);
      }
    } catch (e) {
      console.warn('Error activating notifications', e);
    } finally {
      setIsActivating(false);
    }
  };

  const handleTestLockscreenPush = async () => {
    setIsTestingPush(true);
    setTestResult(null);
    try {
      // Ensure subscribed
      await subscribeToWebPush(userId);
      const res = await triggerServerTestPush(userId);
      setTestResult(res.message);
      setTimeout(() => setTestResult(null), 6000);
    } catch (err: any) {
      setTestResult('Erreur de test');
    } finally {
      setIsTestingPush(false);
    }
  };

  // If already granted and not testing, show a compact reassurance badge with test button
  if (permission === 'granted' && !showSuccess) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} />
          </div>
          <span className="font-semibold text-[11px] text-emerald-900">
            Notifications en veille actives (Web Push)
          </span>
        </div>
        <button
          type="button"
          onClick={handleTestLockscreenPush}
          disabled={isTestingPush}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Send size={10} />
          <span>{isTestingPush ? 'Envoi...' : testResult || 'Tester sur mon tél'}</span>
        </button>
      </div>
    );
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
              <span>Notifications du téléphone activées !</span>
              <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px] font-extrabold uppercase">
                Actif
              </span>
            </h4>
            <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
              Une notification test a été envoyée par le serveur. Vos alarmes sonneront et vibreront à l'heure exacte de vos tâches, même application fermée !
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
                  Essentiel
                </span>
                <span className="text-[10px] font-semibold text-indigo-700">
                  Comme Facebook, Instagram ou Snap
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-neutral-900 mt-1">
                Activer les notifications et alarmes en veille
              </h4>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                Autorisez les notifications pour recevoir les alertes sur l'écran verrouillé et faire sonner votre téléphone à l'heure exacte de chaque tâche, même application fermée.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={isActivating}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BellRing size={13} />
                  <span>{isActivating ? 'Activation...' : 'Activer les notifications du téléphone'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
