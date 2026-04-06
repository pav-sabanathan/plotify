import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-600/20 border-b border-amber-600/30 px-4 py-2 text-sm text-amber-400">
      <WifiOff className="h-4 w-4" />
      <span>You're offline — changes will sync when you reconnect</span>
    </div>
  );
};

export default OfflineBanner;
