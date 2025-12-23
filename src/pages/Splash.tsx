import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import alleAiLogo from '@/assets/alle-ai-logo.png';

type SplashState = 'loading' | 'checking' | 'offline' | 'redirecting';

const Splash = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<SplashState>('loading');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAuthAndRedirect = async () => {
    if (!navigator.onLine) {
      setState('offline');
      return;
    }

    setState('checking');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setState('redirecting');
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile?.onboarding_completed) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        setState('redirecting');
        setTimeout(() => {
          navigate('/welcome', { replace: true });
        }, 800);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (!navigator.onLine) {
        setState('offline');
      } else {
        setState('redirecting');
        setTimeout(() => {
          navigate('/welcome', { replace: true });
        }, 800);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkAuthAndRedirect, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      checkAuthAndRedirect();
    }
  };

  const renderLoadingState = () => {
    switch (state) {
      case 'offline':
        return (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No internet connection</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please check your connection and try again
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2 gap-2"
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        );

      case 'checking':
        return (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              Checking your session...
            </p>
          </div>
        );

      case 'redirecting':
        return (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              Getting things ready...
            </p>
          </div>
        );

      default:
        return (
          <div className="flex gap-1 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-top safe-area-bottom">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-3xl bg-background flex items-center justify-center transition-transform duration-300 ${state === 'redirecting' ? 'scale-110' : ''}`}>
            <img src={alleAiLogo} alt="Calo Logo" className="w-16 h-16 object-contain" />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Calo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Smart Calorie Tracking
          </p>
        </div>

        {/* Loading state indicator */}
        <div className="mt-8 min-h-[80px] flex items-center justify-center">
          {renderLoadingState()}
        </div>
      </div>
    </div>
  );
};

export default Splash;
