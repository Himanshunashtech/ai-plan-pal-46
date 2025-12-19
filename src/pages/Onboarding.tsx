import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OnboardingSteps from '@/components/onboarding/OnboardingSteps';

const Onboarding = () => {
  const navigate = useNavigate();
  const { step, totalSteps, prevStep } = useOnboarding();

  const handleBack = () => {
    if (step === 1) {
      navigate('/auth');
    } else {
      prevStep();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex items-center justify-between px-4 py-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 mx-4">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{step}/{totalSteps}</span>
      </div>
      <div className="flex-1 px-6 py-4">
        <OnboardingSteps />
      </div>
    </div>
  );
};

export default Onboarding;
