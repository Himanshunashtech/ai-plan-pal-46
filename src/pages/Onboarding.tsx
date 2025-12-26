import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { prevStep, clearStepData, resetOnboarding } from '@/store/slices/onboardingSlice';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OnboardingSteps from '@/components/onboarding/OnboardingSteps';


const Onboarding = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { step, totalSteps } = useSelector((state: RootState) => state.onboarding);

  const handleBack = () => {
    if (step === 1) {
      // Leaving onboarding completely → go to Welcome
      dispatch(resetOnboarding());
      navigate('/welcome');
    } else {
      // Going back within onboarding
      dispatch(clearStepData(step));
      dispatch(prevStep());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with safe area padding */}
      <div className="pt-safe flex items-center justify-between px-4 py-4 flex-shrink-0 bg-background border-b border-border/50">
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

      {/* Main content area */}
      <div className="flex-1 px-6 flex flex-col min-h-0">
        <OnboardingSteps />
      </div>
    </div>
  );
};

export default Onboarding;
