import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const OnboardingSteps = () => {
  const navigate = useNavigate();
  const { step, data, updateData, nextStep, setGeneratedPlan } = useOnboarding();

  const handleNext = () => {
    if (step === 25) {
      setGeneratedPlan({
        dailyCalories: 1828,
        dailyCarbs: 208,
        dailyProtein: 134,
        dailyFats: 50,
        targetWeight: data.targetWeight || 62,
        recommendation: 'Maintain your current weight with balanced nutrition.',
      });
      navigate('/plan-ready');
    } else {
      nextStep();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Choose your Gender</h2>
            <p className="text-muted-foreground mb-8">This will be used to calibrate your custom plan.</p>
            <div className="space-y-3">
              {['male', 'female', 'other'].map((g) => (
                <Button
                  key={g}
                  variant={data.gender === g ? 'option-selected' : 'option'}
                  size="lg"
                  className="w-full"
                  onClick={() => updateData({ gender: g as 'male' | 'female' | 'other' })}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">How old are you?</h2>
            <p className="text-muted-foreground mb-8">Your age helps us calculate your metabolism.</p>
            <Input
              type="number"
              placeholder="Enter your age"
              value={data.age || ''}
              onChange={(e) => updateData({ age: parseInt(e.target.value) })}
              className="h-14 text-center text-2xl font-bold rounded-2xl"
            />
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">What's your height?</h2>
            <p className="text-muted-foreground mb-8">Enter your height in centimeters.</p>
            <Input
              type="number"
              placeholder="Height in cm"
              value={data.height || ''}
              onChange={(e) => updateData({ height: parseInt(e.target.value) })}
              className="h-14 text-center text-2xl font-bold rounded-2xl"
            />
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Current weight?</h2>
            <p className="text-muted-foreground mb-8">Enter your current weight in kg.</p>
            <Input
              type="number"
              placeholder="Weight in kg"
              value={data.currentWeight || ''}
              onChange={(e) => updateData({ currentWeight: parseFloat(e.target.value) })}
              className="h-14 text-center text-2xl font-bold rounded-2xl"
            />
          </div>
        );
      case 5:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">What is your goal?</h2>
            <p className="text-muted-foreground mb-8">Select your primary fitness goal.</p>
            <div className="space-y-3">
              {[
                { value: 'lose', label: 'Lose weight' },
                { value: 'maintain', label: 'Maintain weight' },
                { value: 'gain', label: 'Gain muscle' },
              ].map((g) => (
                <Button
                  key={g.value}
                  variant={data.goal === g.value ? 'option-selected' : 'option'}
                  size="lg"
                  className="w-full"
                  onClick={() => updateData({ goal: g.value as 'lose' | 'maintain' | 'gain' })}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">What is your desired weight?</h2>
            <p className="text-muted-foreground mb-8">Set your target weight goal.</p>
            <Input
              type="number"
              placeholder="Target weight in kg"
              value={data.targetWeight || ''}
              onChange={(e) => updateData({ targetWeight: parseFloat(e.target.value) })}
              className="h-14 text-center text-2xl font-bold rounded-2xl"
            />
          </div>
        );
      default:
        const questions = [
          'How active are you?',
          'What diet do you follow?',
          'Any food allergies?',
          'How many meals per day?',
          'Water intake goal?',
          'Hours of sleep?',
          'Stress level?',
          'What motivates you?',
          'Previous diet attempts?',
          'Cooking time available?',
          'Snacking habits?',
          'Exercise frequency?',
          'Exercise types?',
          'Health conditions?',
          'Taking medications?',
          'Target date?',
          'Preferred meal times?',
          'Weekend habits?',
          'Cal AI creates long-term results',
        ];
        const qIndex = step - 7;
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">{questions[qIndex] || `Step ${step}`}</h2>
            <p className="text-muted-foreground mb-8">This helps personalize your plan.</p>
            <div className="space-y-3">
              <Button variant="option" size="lg" className="w-full" onClick={handleNext}>Option 1</Button>
              <Button variant="option" size="lg" className="w-full" onClick={handleNext}>Option 2</Button>
              <Button variant="option" size="lg" className="w-full" onClick={handleNext}>Option 3</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">{renderStep()}</div>
      <Button size="lg" className="w-full mt-8" onClick={handleNext}>
        {step === 25 ? 'Generate My Plan' : 'Next'}
      </Button>
    </div>
  );
};

export default OnboardingSteps;
