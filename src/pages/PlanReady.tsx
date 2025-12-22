import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pencil } from 'lucide-react';
import NutritionRing from '@/components/ui/NutritionRing';
import { useState } from 'react';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import EditGoalSheet from '@/components/onboarding/EditGoalSheet';

type GoalType = 'calories' | 'carbs' | 'protein' | 'fats';

const PlanReady = () => {
  const { generatedPlan, data, updateGeneratedPlan } = useOnboarding();
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);

  const plan = generatedPlan || {
    dailyCalories: 1828,
    dailyCarbs: 208,
    dailyProtein: 134,
    dailyFats: 50,
    targetWeight: data.targetWeight || 62,
  };

  const handleContinue = () => {
    setShowAuthSheet(true);
  };

  const handleEditGoal = (type: GoalType) => {
    setEditingGoal(type);
  };

  const handleSaveGoal = (value: number) => {
    if (!editingGoal) return;
    
    const keyMap: Record<GoalType, keyof typeof plan> = {
      calories: 'dailyCalories',
      carbs: 'dailyCarbs',
      protein: 'dailyProtein',
      fats: 'dailyFats',
    };
    
    updateGeneratedPlan({ [keyMap[editingGoal]]: value });
  };

  const getGoalValue = (type: GoalType): number => {
    const valueMap: Record<GoalType, number> = {
      calories: plan.dailyCalories,
      carbs: plan.dailyCarbs,
      protein: plan.dailyProtein,
      fats: plan.dailyFats,
    };
    return valueMap[type];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom px-6 py-8">
      <div className="flex-1 flex flex-col items-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">Congratulations</h1>
        <p className="text-xl text-foreground text-center">your custom plan is ready!</p>
        <p className="text-muted-foreground mt-4">You should {data.goal === 'lose' ? 'Lose' : data.goal === 'gain' ? 'Gain' : 'Maintain'}:</p>
        <p className="text-2xl font-bold text-foreground">{plan.targetWeight} {data.weightUnit || 'kg'}</p>

        <div className="mt-8 w-full">
          <p className="text-lg font-semibold mb-1">Daily Recommendation</p>
          <p className="text-sm text-muted-foreground mb-6">You can edit this any time</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('calories')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground mb-2">Calories</span>
              <NutritionRing value={plan.dailyCalories} max={2500} color="calories" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyCalories}</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('carbs')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground mb-2">Carbs</span>
              <NutritionRing value={plan.dailyCarbs} max={300} color="carbs" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyCarbs}g</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('protein')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground mb-2">Protein</span>
              <NutritionRing value={plan.dailyProtein} max={200} color="protein" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyProtein}g</span>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('fats')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground mb-2">Fats</span>
              <NutritionRing value={plan.dailyFats} max={100} color="fats" size={80} />
              <span className="text-lg font-bold mt-2">{plan.dailyFats}g</span>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full mt-8" onClick={handleContinue}>
        Let's get started!
      </Button>

      <AuthBottomSheet open={showAuthSheet} onOpenChange={setShowAuthSheet} />
      
      {editingGoal && (
        <EditGoalSheet
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
          type={editingGoal}
          value={getGoalValue(editingGoal)}
          onSave={handleSaveGoal}
        />
      )}
    </div>
  );
};

export default PlanReady;