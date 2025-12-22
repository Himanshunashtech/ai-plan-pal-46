import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Bell, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { subscriptionApi } from '@/lib/api/subscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Paywall = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generatedPlan, data } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const plan = generatedPlan || {
    dailyCalories: 1828,
    dailyCarbs: 208,
    dailyProtein: 134,
    dailyFats: 50,
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in to subscribe', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Save onboarding data to profile
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: data.fullName,
          gender: data.gender,
          age: data.age,
          height: data.height,
          height_unit: data.heightUnit || 'cm',
          current_weight: data.currentWeight,
          target_weight: data.targetWeight,
          weight_unit: data.weightUnit || 'kg',
          activity_level: data.activityLevel,
          goal: data.goal,
          weekly_goal: data.weeklyGoal,
          diet_type: data.dietType,
          allergies: data.allergies,
          meals_per_day: data.mealsPerDay,
          water_intake: data.waterIntake,
          sleep_hours: data.sleepHours,
          stress_level: data.stressLevel,
          motivation: data.motivation,
          previous_diets: data.previousDiets,
          cooking_time: data.cookingTime,
          snacking: data.snacking,
          exercise_frequency: data.exerciseFrequency,
          exercise_type: data.exerciseType,
          health_conditions: data.healthConditions,
          medications: data.medications,
          target_date: data.targetDate,
          daily_calories: plan.dailyCalories,
          daily_carbs: plan.dailyCarbs,
          daily_protein: plan.dailyProtein,
          daily_fats: plan.dailyFats,
          onboarding_completed: true
        }, { onConflict: 'user_id' });

      // Start free trial via RevenueCat
      const result = await subscriptionApi.startFreeTrial(user.id);
      
      if (result.success) {
        toast({ 
          title: '🎉 Trial Started!', 
          description: 'Your 3-day free trial has begun. Enjoy full access!' 
        });
      } else {
        toast({ 
          title: 'Welcome!', 
          description: 'Enjoy your trial access to all features.' 
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({ 
        title: 'Welcome!', 
        description: 'Enjoy your trial access to all features.' 
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom px-6 py-8">
      <div className="flex-1 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground text-center">
          Start your 3-day FREE<br />trial to continue.
        </h1>

        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Today</p>
              <p className="text-sm text-muted-foreground">Unlock all the app's features like AI calorie scanning and more.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">In 2 Days - Reminder</p>
              <p className="text-sm text-muted-foreground">We'll send you a reminder that your trial is ending soon.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">In 3 Days - Billing Starts</p>
              <p className="text-sm text-muted-foreground">You'll be charged $20/month unless you cancel anytime before.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-2xl border-2 transition-all relative ${
              selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            {selectedPlan === 'monthly' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                3 DAYS FREE
              </div>
            )}
            <p className="font-semibold text-foreground">Monthly</p>
            <p className="text-lg font-bold text-foreground">$20/mo</p>
            {selectedPlan === 'monthly' && (
              <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
            )}
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-2xl border-2 transition-all relative ${
              selectedPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              SAVE 50%
            </div>
            <p className="font-semibold text-foreground">Yearly</p>
            <p className="text-lg font-bold text-foreground">$10/mo</p>
            <p className="text-xs text-muted-foreground">Billed $120/year</p>
            {selectedPlan === 'yearly' && (
              <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-success">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">No Payment Due Now</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleSubscribe} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Starting Trial...
            </>
          ) : (
            'Start My 3-Day Free Trial'
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {selectedPlan === 'monthly' 
            ? '3 days free, then $20 per month' 
            : '3 days free, then $120 per year ($10/mo)'}
        </p>
      </div>
    </div>
  );
};

export default Paywall;
