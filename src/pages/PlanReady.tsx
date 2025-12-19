import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import NutritionRing from '@/components/ui/NutritionRing';

const PlanReady = () => {
  const navigate = useNavigate();
  const { generatedPlan, data } = useOnboarding();

  const plan = generatedPlan || {
    dailyCalories: 1828,
    dailyCarbs: 208,
    dailyProtein: 134,
    dailyFats: 50,
    targetWeight: data.targetWeight || 62,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom px-6 py-8">
      <div className="flex-1 flex flex-col items-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">Congratulations</h1>
        <p className="text-xl text-foreground text-center">your custom plan is ready!</p>
        <p className="text-muted-foreground mt-4">You should Maintain:</p>
        <p className="text-2xl font-bold text-foreground">{plan.targetWeight} kg</p>

        <div className="mt-8 w-full">
          <p className="text-lg font-semibold mb-1">Daily Recommendation</p>
          <p className="text-sm text-muted-foreground mb-6">You can edit this any time</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-2">Calories</span>
              <NutritionRing value={plan.dailyCalories} max={2500} color="calories" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyCalories}</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-2">Carbs</span>
              <NutritionRing value={plan.dailyCarbs} max={300} color="carbs" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyCarbs}g</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-2">Protein</span>
              <NutritionRing value={plan.dailyProtein} max={200} color="protein" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyProtein}g</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-2">Fats</span>
              <NutritionRing value={plan.dailyFats} max={100} color="fats" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyFats}g</span>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full mt-8" onClick={() => navigate('/paywall')}>
        Let's get started!
      </Button>
    </div>
  );
};

export default PlanReady;
