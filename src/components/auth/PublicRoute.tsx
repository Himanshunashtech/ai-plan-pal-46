import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        setOnboardingCompleted(profile?.onboarding_completed ?? false);
      } catch (error) {
        setOnboardingCompleted(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkOnboarding();
    }
  }, [user, loading]);

  // Still loading auth state or checking onboarding
  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // User is logged in and has completed onboarding - redirect to dashboard
  if (user && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is logged in but hasn't completed onboarding - let them continue onboarding
  // But block auth/welcome/splash pages
  if (user && !onboardingCompleted) {
    // Allow onboarding-related pages, redirect others to onboarding
    return <>{children}</>;
  }

  // Not logged in - show the public page
  return <>{children}</>;
};

export default PublicRoute;
