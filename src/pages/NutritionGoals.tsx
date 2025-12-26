import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Flame, Wheat, Beef, Droplets, Salad, Candy, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FormPageSkeleton } from '@/components/skeletons';

interface NutritionGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
  daily_fiber: number;
  daily_sugar: number;
  daily_sodium: number;
}

const NutritionGoalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [goals, setGoals] = useState<NutritionGoals>({
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 200,
    daily_fats: 60,
    daily_fiber: 25,
    daily_sugar: 50,
    daily_sodium: 2300,
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGoals({
          daily_calories: data.daily_calories || 2000,
          daily_protein: data.daily_protein || 150,
          daily_carbs: data.daily_carbs || 200,
          daily_fats: data.daily_fats || 60,
          daily_fiber: data.daily_fiber || 25,
          daily_sugar: data.daily_sugar || 50,
          daily_sodium: data.daily_sodium || 2300,
        });
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_calories: goals.daily_calories,
          daily_protein: goals.daily_protein,
          daily_carbs: goals.daily_carbs,
          daily_fats: goals.daily_fats,
          daily_fiber: goals.daily_fiber,
          daily_sugar: goals.daily_sugar,
          daily_sodium: goals.daily_sodium,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Nutrition goals saved!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals');
    } finally {
      setSaving(false);
    }
  };


  const handleChange = (field: keyof NutritionGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    setGoals(prev => ({ ...prev, [field]: numValue }));
  };

  if (loading) {
    return <FormPageSkeleton fieldCount={7} />;
  }

  const MacroCard = ({
    icon: Icon,
    color,
    bgColor,
    ringColor,
    label,
    field
  }: {
    icon: any,
    color: string,
    bgColor: string,
    ringColor: string,
    label: string,
    field: keyof NutritionGoals
  }) => (
    <div className="flex items-center gap-4 mb-4">
      <div className={`relative w-14 h-14 rounded-full border-[3px] ${ringColor} flex items-center justify-center bg-card shadow-sm shrink-0`}>
        {/* Inner circle background could go here if needed, keeping it white/card for now */}
        <Icon className={`w-6 h-6 ${color}`} />
        {/* Decorative segment - simulating the 'progress' look from the image using a pseudo-element logic or simpler border trick if needed. 
            For now, a solid colored border matches the ring aesthetic cleanly. */}
      </div>
      <div className="flex-1 bg-card rounded-2xl p-4 shadow-soft flex items-center justify-between">
        <div>
          <p className="text-[15px] font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1">
            <Input
              type="number"
              value={goals[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="h-7 w-20 p-0 text-xl font-bold bg-transparent border-0 focus-visible:ring-0 px-0 shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom page-gradient">
      <div className="px-6 py-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-secondary/50">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Edit nutrition goals</h1>

        <div className="space-y-2">
          <MacroCard
            icon={Flame}
            field="daily_calories"
            label="Calorie goal"
            color="text-foreground"
            bgColor="bg-secondary"
            ringColor="border-foreground/80"
          />
          <MacroCard
            icon={Beef}
            field="daily_protein"
            label="Protein goal"
            color="text-red-500"
            bgColor="bg-red-50"
            ringColor="border-red-500/30 border-t-red-500 border-r-red-500" // Simulating partial ring
          />
          <MacroCard
            icon={Wheat}
            field="daily_carbs"
            label="Carb goal"
            color="text-amber-500"
            bgColor="bg-amber-50"
            ringColor="border-amber-500/30 border-t-amber-500 border-l-amber-500"
          />
          <MacroCard
            icon={Droplets}
            field="daily_fats"
            label="Fat goal"
            color="text-blue-500"
            bgColor="bg-blue-50"
            ringColor="border-blue-500/30 border-b-blue-500 border-r-blue-500"
          />
        </div>

        <div className="mt-8 mb-8">
          <button
            onClick={() => setShowMicronutrients(!showMicronutrients)}
            className="flex items-center gap-2 text-muted-foreground font-medium mx-auto hover:text-foreground transition-colors"
          >
            <span>View micronutrients</span>
            {showMicronutrients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMicronutrients && (
            <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2">
              <MacroCard
                icon={Salad}
                field="daily_sodium"
                label="Sodium (mg)"
                color="text-emerald-500"
                bgColor="bg-emerald-50"
                ringColor="border-emerald-500/30 border-l-emerald-500"
              />
              <MacroCard
                icon={Candy}
                field="daily_sugar"
                label="Sugar (g)"
                color="text-pink-500"
                bgColor="bg-pink-50"
                ringColor="border-pink-500/30 border-r-pink-500"
              />
              <MacroCard
                icon={Apple}
                field="daily_fiber"
                label="Fiber (g)"
                color="text-purple-500"
                bgColor="bg-purple-50"
                ringColor="border-purple-500/30 border-t-purple-500"
              />
            </div>
          )}
        </div>

        <div className="mt-auto pb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-full text-lg font-semibold"
          >
            {saving ? 'Saving...' : 'Save Goals'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NutritionGoalsPage;
