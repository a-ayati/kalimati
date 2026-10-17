import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-80 z-50 flex items-center gap-2.5 rounded-xl bg-amber-950/90 border border-amber-600/40 px-3.5 py-2.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <div>
        <p className="font-semibold text-white">أنت تعمل بدون اتصال بالإنترنت</p>
        <p className="text-[11px] text-amber-300/80">المكتبة ومحفوظاتك و«لحظة سكون» متاحة بالكامل محليًا.</p>
      </div>
    </div>
  );
};
