import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Bell, Crown } from 'lucide-react';

const Paywall = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = () => {
    // RevenueCat integration would go here
    navigate('/dashboard');
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
              <p className="text-sm text-muted-foreground">You'll be charged unless you cancel anytime before.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <p className="font-semibold">Monthly</p>
            <p className="text-lg font-bold">$20/mo</p>
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-2xl border-2 transition-all relative ${
              selectedPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              3 DAYS FREE
            </div>
            <p className="font-semibold">Yearly</p>
            <p className="text-lg font-bold">$10/mo</p>
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
        <Button size="lg" className="w-full" onClick={handleSubscribe}>
          Start My 3-Day Free Trial
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          3 days free, then $120 per year ($10/mo)
        </p>
      </div>
    </div>
  );
};

export default Paywall;
