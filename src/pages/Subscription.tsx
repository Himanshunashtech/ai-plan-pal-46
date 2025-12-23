import { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, AlertCircle, CreditCard, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { subscriptionApi } from '@/lib/api/subscription';
import { toast } from '@/hooks/use-toast';
import { SettingsPageSkeleton } from '@/components/skeletons';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubscriptionInfo {
  status: string;
  expiresAt: string | null;
  plan: string;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'free',
    expiresAt: null,
    plan: 'Free'
  });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'trial';
        setSubscription({
          status: profile.subscription_status || 'free',
          expiresAt: profile.subscription_expires_at,
          plan: profile.subscription_status === 'active' ? 'Premium' : 
                profile.subscription_status === 'trial' ? 'Trial' : 'Free'
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    setIsUpgrading(true);
    try {
      // Start subscription via API
      const result = await subscriptionApi.startFreeTrial(user.id);
      
      if (result.success) {
        toast({ 
          title: '🎉 Subscription Started!', 
          description: 'Welcome to Premium! Enjoy all features.' 
        });
        await fetchSubscription();
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to start subscription. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({ 
        title: 'Error', 
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    setIsCancelling(true);
    try {
      // Update subscription status to cancelled
      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('user_id', user.id);

      toast({ 
        title: 'Subscription Cancelled', 
        description: 'Your subscription has been cancelled. You can still use premium features until the end of your billing period.' 
      });
      await fetchSubscription();
    } catch (error) {
      console.error('Cancel error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) return;

    setIsRestoring(true);
    try {
      // Check subscription status via API
      const result = await subscriptionApi.getSubscriptionStatus(user.id);
      
      if (result.isPremium) {
        await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            subscription_expires_at: result.expiresAt 
          })
          .eq('user_id', user.id);

        toast({ 
          title: 'Purchases Restored!', 
          description: 'Your subscription has been restored successfully.' 
        });
        await fetchSubscription();
      } else {
        toast({ 
          title: 'No Active Subscription', 
          description: 'No active subscription found to restore.' 
        });
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({ 
        title: 'Restore Complete', 
        description: 'Checked for purchases. No active subscription found.' 
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const isActive = subscription.status === 'active' || subscription.status === 'trial';
  const isCancelled = subscription.status === 'cancelled';

  const plans = [
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: '$20',
      period: '/month',
      description: 'Billed monthly',
      badge: null
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: '$10',
      period: '/month',
      description: 'Billed $120/year',
      badge: 'SAVE 50%'
    }
  ];

  const features = [
    'Unlimited AI food scanning',
    'Advanced nutrition analytics',
    'Personalized meal suggestions',
    'Detailed macro tracking',
    'Priority customer support',
    'Ad-free experience',
    'Export data to CSV',
    'Sync across all devices'
  ];

  if (loading) {
    return <SettingsPageSkeleton itemCount={5} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Subscription</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-auto pb-24">
        {/* Current Plan Status */}
        <div className={`rounded-2xl p-6 mb-6 ${
          isActive ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30' :
          isCancelled ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' :
          'bg-card border border-border'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive ? 'bg-amber-500/20' : 'bg-muted'
            }`}>
              <Crown className={`w-6 h-6 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{subscription.plan} Plan</h2>
              <p className={`text-sm ${
                isActive ? 'text-amber-600' : 
                isCancelled ? 'text-red-500' : 
                'text-muted-foreground'
              }`}>
                {isActive ? 'Active' : isCancelled ? 'Cancelled' : 'Free Tier'}
              </p>
            </div>
          </div>

          {subscription.expiresAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {isCancelled ? 'Access until: ' : 'Renews: '}
                {format(new Date(subscription.expiresAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">
                Your subscription has been cancelled. You'll lose access to premium features after your current billing period ends.
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Section (shown for free/cancelled users) */}
        {!isActive && (
          <>
            <h3 className="font-semibold mb-4">Choose a Plan</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-2xl border-2 transition-all relative ${
                    selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {plan.badge}
                    </div>
                  )}
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-lg font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  {selectedPlan === plan.id && (
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Features List */}
            <h3 className="font-semibold mb-4">Premium Features</h3>
            <div className="bg-card rounded-2xl p-4 mb-6 border border-border">
              <div className="space-y-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full mb-4"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </>
              )}
            </Button>
          </>
        )}

        {/* Active Subscription Management */}
        {isActive && (
          <div className="space-y-4">
            <h3 className="font-semibold">Manage Subscription</h3>
            
            <div className="bg-card rounded-2xl overflow-hidden border border-border">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                onClick={() => navigate('/paywall')}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span>Change Plan</span>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
              </button>

              <div className="border-t border-border" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-red-500"
                    disabled={isCancelling}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5" />
                      <span>Cancel Subscription</span>
                    </div>
                    {isCancelling && <Loader2 className="w-5 h-5 animate-spin" />}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelSubscription}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Features included */}
            <h3 className="font-semibold mt-6">Your Premium Features</h3>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Restore Purchases */}
        <Button 
          variant="outline" 
          className="w-full mt-6"
          onClick={handleRestorePurchases}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Restoring...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Restore Purchases
            </>
          )}
        </Button>

        {/* Legal Links */}
        <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
          <button className="hover:text-foreground transition-colors">Terms of Service</button>
          <span>•</span>
          <button className="hover:text-foreground transition-colors">Privacy Policy</button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
