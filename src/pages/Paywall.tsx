import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Bell, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { subscriptionApi } from '@/lib/api/subscription';
import { paymentService } from '@/lib/services/paymentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';


const Paywall = () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  // ... inside component
  const { user } = useAuth();
  const { generatedPlan, data } = useSelector((state: RootState) => state.onboarding);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null); // RC Offerings

  // Initialize Web Billing
  useEffect(() => {
    if (user) {
      const init = async () => {
        await paymentService.initialize(user.id);
        try {
          const offers = await paymentService.getOfferings();
          if (offers && offers.current) {
            setOfferings(offers.current);
          }
        } catch (e) {
          console.error('Failed to load offerings', e);
        }
      };
      init();
    }
  }, [user]);

  const plan = generatedPlan || {
    dailyCalories: 1828,
    dailyCarbs: 208,
    dailyProtein: 134,
    dailyFats: 50,
    dailyWater: 2000,
    targetWeight: data.targetWeight || 70,
    recommendation: 'Standard balanced plan'
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in to subscribe', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save onboarding data first (Redundant backup to Auth.tsx, but kept for safety)
      // Ensure we don't overwrite with nulls if data is missing
      if (data && Object.keys(data).length > 0) {
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
            target_weight: plan.targetWeight, // Use plan's target weight
            weight_unit: data.weightUnit || 'kg',
            activity_level: data.activityLevel,
            goal: data.goal,
            weekly_goal: data.weeklyGoal,
            diet_type: data.dietType,
            allergies: data.allergies,
            meals_per_day: data.mealsPerDay,
            water_intake: plan.dailyWater, // Use calculated water intake
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
      }

      // 2. Attempt Purchase via Native IAP
      let purchaseSuccess = false;

      // Hardcoded product IDs assumption for Native
      const productIds = {
        monthly: 'pro_monthly',
        yearly: 'pro_yearly'
      };

      const productId = productIds[selectedPlan];

      if (productId) {
        console.log('Starting native purchase for:', productId);
        const result = await paymentService.startPurchase(user.id, productId);
        if (result.success) {
          purchaseSuccess = true;
          toast({ title: 'Success!', description: 'Purchase initiated. Unlocking...' });
          // Note: actual unlock depends on server/iapSuccess event
        } else {
          console.error('Purchase failed', result.error);
          toast({ title: 'Payment Failed', description: 'Could not complete purchase.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
      }

      // If Native failed (e.g. cancelled) or we want to force trial logic as backup:
      if (!purchaseSuccess) {
        // Fallback or just return
        console.log('Purchase flow incomplete.');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.'
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom px-6 ">
      <div className="flex-1 animate-fade-in py-6">
        <h1 className="text-2xl font-bold text-foreground text-center whitespace-pre-line">
          {t('paywall_title')}
        </h1>

        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('trial_today_title')}</p>
              <p className="text-sm text-muted-foreground">{t('trial_today_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('trial_reminder_title')}</p>
              <p className="text-sm text-muted-foreground">{t('trial_reminder_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('trial_billing_title')}</p>
              <p className="text-sm text-muted-foreground">{t('trial_billing_desc')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-2xl border-2 transition-all relative ${selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
          >
            {selectedPlan === 'monthly' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                {t('3_days_free')}
              </div>
            )}
            <p className="font-semibold text-foreground">{t('monthly')}</p>
            <p className="text-lg font-bold text-foreground">$20/mo</p>
            {selectedPlan === 'monthly' && (
              <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
            )}
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-2xl border-2 transition-all relative ${selectedPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {t('save_50')}
            </div>
            <p className="font-semibold text-foreground">{t('yearly')}</p>
            <p className="text-lg font-bold text-foreground">$10/mo</p>
            <p className="text-xs text-muted-foreground">{t('billed_yearly')}</p>
            {selectedPlan === 'yearly' && (
              <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-success">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{t('no_payment_due')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleSubscribe} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('starting_trial')}
            </>
          ) : (
            t('start_trial')
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
