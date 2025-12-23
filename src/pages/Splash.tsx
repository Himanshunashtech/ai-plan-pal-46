import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import alleAiLogo from '@/assets/alle-ai-logo.png';

const Splash = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      setIsCheckingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if user has completed onboarding
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
          // No session, go to welcome after delay
          setTimeout(() => {
            navigate('/welcome', { replace: true });
          }, 1500);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setTimeout(() => {
          navigate('/welcome', { replace: true });
        }, 1500);
      }
    };

    // Small delay to show splash, then check auth
    const timer = setTimeout(checkAuthAndRedirect, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-top safe-area-bottom">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center">
            <img src={alleAiLogo} alt="Alle AI Logo" className="w-16 h-16 object-contain" />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Alle AI
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Smart Calorie Tracking
          </p>
        </div>

        {/* Loading indicator with skeleton */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {isCheckingAuth ? (
            <>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <p className="text-xs text-muted-foreground animate-pulse">
                Checking your session...
              </p>
            </>
          ) : (
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Splash;
