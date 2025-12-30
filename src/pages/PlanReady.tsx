import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateGeneratedPlan, setGeneratedPlan } from '@/store/slices/onboardingSlice';
import { calculatePlan } from '@/lib/nutrition-calculator';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pencil } from 'lucide-react';
import NutritionRing from '@/components/ui/NutritionRing';
import { useState, useEffect } from 'react';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import EditGoalSheet from '@/components/onboarding/EditGoalSheet';
import { Flame, Wheat, Beef, Droplet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


type GoalType = 'calories' | 'carbs' | 'protein' | 'fats';

const PlanReady = () => {

  const dispatch = useDispatch();
  const { generatedPlan, data } = useSelector((state: RootState) => state.onboarding);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);
  const [saving, setSaving] = useState(false);

  // Effect: Recalculate plan if missing (e.g. reload) but data exists
  useEffect(() => {
    if (!generatedPlan && Object.keys(data).length > 0) {
      console.log('Recalculating plan from onboarding data...');
      const newPlan = calculatePlan(data);
      dispatch(setGeneratedPlan(newPlan));
    }
  }, [generatedPlan, data, dispatch]);

  const plan = generatedPlan || (Object.keys(data).length > 0 ? calculatePlan(data) : {
    dailyCalories: 2000,
    dailyCarbs: 250,
    dailyProtein: 150,
    dailyFats: 60,
    targetWeight: data.targetWeight || 70,
    recommendation: 'Standard balanced plan'
  });

  const handleContinue = async () => {
    // If user is already logged in, save the plan immediately to the database
    if (user) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            daily_calories: plan.dailyCalories,
            daily_protein: plan.dailyProtein,
            daily_carbs: plan.dailyCarbs,
            daily_fats: plan.dailyFats,
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Plan Saved",
          description: "Your nutrition plan has been updated!",
        });

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error saving plan:', error);
        toast({
          title: "Error",
          description: "Failed to save your plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    } else {
      // If not logged in, show auth sheet
      setShowAuthSheet(true);
    }
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

    dispatch(updateGeneratedPlan({ [keyMap[editingGoal]]: value }));
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
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom px-6 py-8 ">
      <div className="flex-1 flex flex-col items-center animate-fade-in">
        {/* <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div> */}
        <h1 className="text-xl font-bold text-foreground text-center pt-2">Congratulations</h1>
        <p className="text-lg text-foreground text-center pt-2">your custom plan is ready!</p>
        {/* <p className="text-muted-foreground mt-4">You should {data.goal === 'lose' ? 'Lose' : data.goal === 'gain' ? 'Gain' : 'Maintain'}:</p>
        <p className="text-2xl font-bold text-foreground">{plan.targetWeight} {data.weightUnit || 'kg'}</p> */}

        <div className="mt-8 w-full">
          <p className="text-lg font-semibold mb-1">Daily Recommendation</p>
          <p className="text-sm text-muted-foreground mb-6">You can edit this any time</p>

          <div className="grid grid-cols-2 gap-4">

            {/* Calories */}
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('calories')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              <span className="text-sm text-muted-foreground mb-2">Calories</span>

              <div className="relative">
                <NutritionRing value={plan.dailyCalories} max={2500} color="calories" size={80} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
              </div>

              <span className="text-lg font-bold mt-2">{plan.dailyCalories}</span>
            </div>

            {/* Carbs */}
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('carbs')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              <span className="text-sm text-muted-foreground mb-2">Carbs</span>

              <div className="relative">
                <NutritionRing value={plan.dailyCarbs} max={300} color="carbs" size={80} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Wheat className="w-6 h-6 text-primary" />
                </div>
              </div>

              <span className="text-lg font-bold mt-2">{plan.dailyCarbs}g</span>
            </div>

            {/* Protein */}
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('protein')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              <span className="text-sm text-muted-foreground mb-2">Protein</span>

              <div className="relative">
                <NutritionRing value={plan.dailyProtein} max={200} color="protein" size={80} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Beef className="w-6 h-6 text-primary" />
                </div>
              </div>

              <span className="text-lg font-bold mt-2">{plan.dailyProtein}g</span>
            </div>

            {/* Fats */}
            <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-col items-center relative">
              <button
                onClick={() => handleEditGoal('fats')}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              <span className="text-sm text-muted-foreground mb-2">Fats</span>

              <div className="relative">
                <NutritionRing value={plan.dailyFats} max={100} color="fats" size={80} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Droplet className="w-6 h-6 text-primary" />
                </div>
              </div>

              <span className="text-lg font-bold mt-2">{plan.dailyFats}g</span>
            </div>

          </div>
        </div>
      </div>

      <Button size="lg" className="w-full mb-11 " onClick={handleContinue}>
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