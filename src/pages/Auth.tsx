import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { resetOnboarding } from '@/store/slices/onboardingSlice';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import alleAiLogo from '@/assets/alle-ai-logo.png';
import AccountRecoveryDialog from '@/components/auth/AccountRecoveryDialog';


type AuthMode = 'login' | 'signup';

const Auth = () => {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { data: onboardingData, generatedPlan } = useSelector((state: RootState) => state.onboarding);

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Account recovery state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string>('');
  const [pendingUserId, setPendingUserId] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const checkScheduledDeletion = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('scheduled_deletion_at')
      .eq('user_id', userId)
      .single();

    return data?.scheduled_deletion_at || null;
  };

  const handleKeepAccount = async () => {
    if (!pendingUserId) return;

    setIsRestoring(true);
    try {
      // Clear the scheduled deletion
      const { error } = await supabase
        .from('profiles')
        .update({ scheduled_deletion_at: null })
        .eq('user_id', pendingUserId);

      if (error) throw error;

      // Send restoration email
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'account_restored',
            userId: pendingUserId
          }
        });
      } catch (emailError) {
        console.log('Email notification not sent');
      }

      toast({
        title: "Account Restored!",
        description: "Your account has been restored successfully.",
      });

      setShowRecoveryDialog(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error restoring account:', error);
      toast({
        title: "Restoration Failed",
        description: error.message || "Failed to restore account",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleGoBack = async () => {
    await supabase.auth.signOut();
    setShowRecoveryDialog(false);
    setPendingUserId('');
    setDeletionDate('');
  };

  const saveOnboardingData = async (userId: string) => {
    // Only save if we have meaningful data
    if (!onboardingData.currentWeight && !onboardingData.height) return;

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: onboardingData.fullName,
          gender: onboardingData.gender,
          age: onboardingData.age,
          height: onboardingData.height,
          height_unit: onboardingData.heightUnit,
          current_weight: onboardingData.currentWeight,
          weight_unit: onboardingData.weightUnit,
          activity_level: onboardingData.activityLevel,
          // If generatedPlan exists, we could save target weight here if column exists, 
          // but mapped columns might differ. Keeping it safe.
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error syncing profile:', profileError);
      }

      // 2. Update Goals (if we had a table for it, currently stored in profiles?)
      // NutritionGoals.tsx reads from profiles: daily_calories, etc.
      if (generatedPlan) {
        const { error: goalsError } = await supabase
          .from('profiles')
          .update({
            daily_calories: generatedPlan.dailyCalories,
            daily_protein: generatedPlan.dailyProtein,
            daily_carbs: generatedPlan.dailyCarbs,
            daily_fats: generatedPlan.dailyFats,
            // We could also save target_weight if schema supports it
          })
          .eq('user_id', userId);

        if (goalsError) console.error('Error syncing goals:', goalsError);
      }

      // Clear redux state after successful sync
      dispatch(resetOnboarding());

    } catch (err) {
      console.error('Failed to save onboarding data', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Check for scheduled deletion
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const scheduledDeletion = await checkScheduledDeletion(user.id);
            if (scheduledDeletion) {
              // STRICT BLOCK: Sign out immediately if deleted
              await supabase.auth.signOut();
              toast({
                title: "Account Deleted",
                description: "This account has been deleted and cannot be accessed.",
                variant: "destructive",
              });
              return;
            }
            // Sync data if we have it
            await saveOnboardingData(user.id);
          }
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // Signup successful
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await saveOnboardingData(user.id);
          }

          toast({
            title: "Account Created!",
            description: "Let's complete your setup.",
          });
          navigate('/paywall');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Google Sign-in Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveOnboardingData(user.id);
    }
    setLoading(false);
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      toast({
        title: "Apple Sign-in Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveOnboardingData(user.id);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <AccountRecoveryDialog
        open={showRecoveryDialog}
        deletionDate={deletionDate}
        onKeepAccount={handleKeepAccount}
        onGoBack={handleGoBack}
        isLoading={isRestoring}
      />

      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mb-4">
            <img src={alleAiLogo} alt="Calo Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground mt-1 text-center">
            {mode === 'login'
              ? 'Sign in to continue tracking'
              : 'Start your health journey today'}
          </p>
        </div>

        {/* Social Auth Buttons */}
        {/* <div className="space-y-3 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

           <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleAppleAuth}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continue with Apple
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            <Phone className="w-5 h-5 mr-2" />
            Continue with Phone
          </Button>
        </div> */}

        {/* Divider */}
        <div className="relative my-6 animate-fade-in">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 rounded-2xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 rounded-2xl"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Fixed height container to prevent layout shift */}
          <div className="h-6">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-accent font-medium hover:underline block"
              >
                Forgot password?
              </button>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Action Toggle - simplified animation */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-muted-foreground">
            {mode === 'login' ? "New to Calo? " : "Already have an account? "}
            <button
              onClick={() => {
                if (mode === 'login') {
                  navigate('/welcome');
                } else {
                  setMode('login');
                }
              }}
              className="text-foreground font-semibold hover:underline"
            >
              {mode === 'login' ? 'Get Started' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
