import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { Button } from './button';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
      <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm font-medium">
          You're offline. Some features may not work.
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-destructive-foreground/10 flex-shrink-0"
          onClick={() => setIsDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default OfflineBanner;
