import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OnboardingSkeleton from '@/components/onboarding/OnboardingSkeleton';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  // Check if current route is an onboarding-related route
  const isOnboardingRoute = ['/onboarding', '/plan-ready', '/paywall'].includes(location.pathname);

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
    // Show onboarding skeleton for onboarding routes
    if (isOnboardingRoute) {
      return <OnboardingSkeleton />;
    }

    // Default loader for other public routes
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
