import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

  const goalFields = [
    { key: 'daily_calories' as const, label: 'Daily Calories', unit: 'cal', color: 'text-orange-500' },
    { key: 'daily_protein' as const, label: 'Daily Protein', unit: 'g', color: 'text-red-500' },
    { key: 'daily_carbs' as const, label: 'Daily Carbs', unit: 'g', color: 'text-amber-500' },
    { key: 'daily_fats' as const, label: 'Daily Fats', unit: 'g', color: 'text-blue-500' },
    { key: 'daily_fiber' as const, label: 'Daily Fiber', unit: 'g', color: 'text-fiber' },
    { key: 'daily_sugar' as const, label: 'Daily Sugar', unit: 'g', color: 'text-sugar' },
    { key: 'daily_sodium' as const, label: 'Daily Sodium', unit: 'mg', color: 'text-sodium' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-6 py-6 overflow-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Nutrition Goals</h1>
        </div>

        {loading ? (
          <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goalFields.map(({ key, label, unit, color }) => (
              <div key={key} className="bg-card rounded-2xl p-4 shadow-soft">
                <Label htmlFor={key} className={`text-sm font-medium ${color}`}>
                  {label}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id={key}
                    type="number"
                    value={goals[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <span className="text-muted-foreground font-medium">{unit}</span>
                </div>
              </div>
            ))}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Goals'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionGoalsPage;
