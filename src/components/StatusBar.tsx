import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-2 text-xs font-semibold text-neutral-800 select-none z-30">
      <span className="font-mono tracking-tight text-[13px]">{time || '09:41'}</span>
      
      {/* Dynamic island / Notch mimic */}
      <div className="w-24 h-4 bg-neutral-900 rounded-full mx-auto hidden sm:flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-neutral-800 mr-2" />
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/60" />
      </div>

      <div className="flex items-center space-x-1.5 text-neutral-800">
        <Signal size={13} strokeWidth={2.5} />
        <Wifi size={13} strokeWidth={2.5} />
        <div className="flex items-center pl-0.5">
          <Battery size={16} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};
