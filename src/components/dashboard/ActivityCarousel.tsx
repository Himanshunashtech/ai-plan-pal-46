import { useState, useEffect, useRef } from 'react';
import { Footprints, Flame, Droplet, Plus, Minus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NutritionRing from '@/components/ui/NutritionRing';
import HealthConnectWidget from '@/components/dashboard/HealthConnectWidget';

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface UserGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
  daily_fiber: number;
  daily_sugar: number;
  daily_sodium: number;
}

interface NutritionData {
  caloriesLeft: number;
  proteinLeft: number;
  carbsLeft: number;
  fatsLeft: number;
  fiberLeft: number;
  sugarLeft: number;
  sodiumLeft: number;
  dailyTotals: DailyTotals;
  goals: UserGoals;
}

interface ActivityCarouselProps {
  selectedDate: Date;
  onDataChange?: () => void;
  nutritionData: NutritionData;
}

interface DailyLog {
  id?: string;
  steps: number;
  calories_burned: number;
  water_intake: number;
}

const ActivityCarousel = ({ selectedDate, onDataChange, nutritionData }: ActivityCarouselProps) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    steps: 0,
    calories_burned: 0,
    water_intake: 0
  });
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stepsGoal = 10000;
  const waterGoalCups = 8;
  const cupsInMl = 250;
  const minSwipeDistance = 50;


  useEffect(() => {
    if (user) {
      fetchDailyLog();
    }
  }, [user, selectedDate]);

  const fetchDailyLog = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDailyLog({
          id: data.id,
          steps: (data as any).steps || 0,
          calories_burned: (data as any).calories_burned || 0,
          water_intake: data.water_intake || 0
        });
      } else {
        setDailyLog({
          steps: 0,
          calories_burned: 0,
          water_intake: 0
        });
      }
    } catch (error) {
      console.error('Error fetching daily log:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyLog = async (updates: Partial<DailyLog>) => {
    if (!user) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const newLog = { ...dailyLog, ...updates };
    setDailyLog(newLog);

    try {
      const { data: existing, error: existingError } = await supabase
        .from('daily_nutrition_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = {
        water_intake: newLog.water_intake,
        steps: newLog.steps,
        calories_burned: newLog.calories_burned,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        const { error } = await supabase
          .from('daily_nutrition_logs')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_nutrition_logs')
          .insert({
            user_id: user.id,
            log_date: dateStr,
            ...payload
          });
        if (error) throw error;
      }

      onDataChange?.();
    } catch (error) {
      console.error('Error updating daily log:', error);
    }
  };

  const adjustWater = (change: number) => {
    const newIntake = Math.max(0, dailyLog.water_intake + change);
    updateDailyLog({ water_intake: newIntake });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const waterCups = Math.floor(dailyLog.water_intake / cupsInMl);
  const waterOz = Math.round(dailyLog.water_intake * 0.033814);

  const { caloriesLeft, proteinLeft, carbsLeft, fatsLeft, fiberLeft, sugarLeft, sodiumLeft, dailyTotals, goals } = nutritionData;

  // Calculate health score (0-10) based on how well macros are balanced
  const calculateOverallHealthScore = (): { score: number; message: string } => {
    const caloriePercent = Math.min((dailyTotals.calories / goals.daily_calories) * 100, 100);
    const proteinPercent = Math.min((dailyTotals.protein / goals.daily_protein) * 100, 100);
    const carbsPercent = Math.min((dailyTotals.carbs / goals.daily_carbs) * 100, 100);
    const fatsPercent = Math.min((dailyTotals.fats / goals.daily_fats) * 100, 100);
    const fiberPercent = Math.min((dailyTotals.fiber / goals.daily_fiber) * 100, 100);
    
    // Score based on how close to goals (ideal is ~80-100%)
    const getScore = (percent: number) => {
      if (percent >= 80 && percent <= 100) return 10;
      if (percent >= 60 && percent < 80) return 7;
      if (percent >= 40 && percent < 60) return 5;
      if (percent >= 20 && percent < 40) return 3;
      return 1;
    };
    
    const avgScore = Math.round(
      (getScore(caloriePercent) + getScore(proteinPercent) + getScore(carbsPercent) + 
       getScore(fatsPercent) + getScore(fiberPercent)) / 5
    );
    
    // Generate message
    let message = '';
    const lowNutrients: string[] = [];
    const goodNutrients: string[] = [];
    
    if (caloriePercent < 50) lowNutrients.push('calories');
    else if (caloriePercent >= 70) goodNutrients.push('calories');
    
    if (proteinPercent < 50) lowNutrients.push('protein');
    else if (proteinPercent >= 70) goodNutrients.push('protein');
    
    if (carbsPercent >= 70 && fatsPercent >= 70) {
      message = 'Carbs and fat are on track.';
    }
    
    if (lowNutrients.length > 0) {
      message += ` You're low in ${lowNutrients.join(' and ')}, which can slow weight loss and impact muscle retention.`;
    } else if (avgScore >= 8) {
      message = 'Great job! Your nutrition is well balanced today.';
    } else if (dailyTotals.calories === 0) {
      message = 'Start logging meals to see your health score.';
    }
    
    return { score: avgScore, message: message.trim() || 'Keep tracking to improve your score!' };
  };

  const healthScore = calculateOverallHealthScore();

  const slides = [
    // Slide 1: Calories and Macros
    {
      id: 'nutrition',
      render: (
        <div className="space-y-4">
          <div className="bg-card rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{Math.round(caloriesLeft)}</p>
                <p className="text-muted-foreground">Calories left</p>
              </div>
              <NutritionRing value={caloriesLeft} max={goals.daily_calories} color="calories" size={80} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={proteinLeft} max={goals.daily_protein} color="protein" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(proteinLeft)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={carbsLeft} max={goals.daily_carbs} color="carbs" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(carbsLeft)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={fatsLeft} max={goals.daily_fats} color="fats" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(fatsLeft)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </div>
      )
    },
    // Slide 2: Fiber, Sugar, Sodium + Health Score
    {
      id: 'micros',
      render: (
        <div className="space-y-3">
          {/* Fiber, Sugar, Sodium Cards with Rings - matching protein/carbs/fats design */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={fiberLeft} max={goals.daily_fiber} color="fiber" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(fiberLeft)}g</p>
              <p className="text-xs text-muted-foreground">Fiber</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={sugarLeft} max={goals.daily_sugar} color="sugar" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(sugarLeft)}g</p>
              <p className="text-xs text-muted-foreground">Sugar</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <NutritionRing value={sodiumLeft} max={goals.daily_sodium} color="sodium" size={44} />
              <p className="font-bold mt-2 text-sm">{Math.round(sodiumLeft)}mg</p>
              <p className="text-xs text-muted-foreground">Sodium</p>
            </div>
          </div>
          
          {/* Health Score Card */}
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-lg">Health score</p>
              <p className="text-lg font-bold">{healthScore.score}/10</p>
            </div>
            <div className="h-1.5 bg-secondary rounded-full mb-3">
              <div 
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${healthScore.score * 10}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {healthScore.message}
            </p>
          </div>
        </div>
      )
    },
    // Slide 3: Steps and Calories Burned
    {
      id: 'activity',
      render: (
        <div className="grid grid-cols-2 gap-3">
          {/* Steps Card */}
          <div className="bg-card rounded-2xl p-4 shadow-soft min-h-[180px] flex flex-col">
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{dailyLog.steps}</span>
                <span className="text-sm text-muted-foreground">/{stepsGoal}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Footprints className="w-4 h-4" />
                <span className="text-sm">Steps Today</span>
              </div>
            </div>
            
            {/* Progress arc */}
            <div className="flex-1 flex items-center justify-center my-2">
              <div 
                className="w-16 h-8 border-t-4 border-l-4 border-r-4 rounded-t-full transition-colors"
                style={{
                  borderColor: dailyLog.steps > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                }}
              />
            </div>

            <HealthConnectWidget
              onSynced={(steps, caloriesBurned) => {
                // keep local UI in sync; DB persistence happens in the hook
                setDailyLog(prev => ({
                  ...prev,
                  steps,
                  calories_burned: caloriesBurned
                }));
                // also persist into the daily log row for the selected date
                updateDailyLog({ steps, calories_burned: caloriesBurned });
              }}
            />
          </div>

          {/* Calories Burned Card */}
          <div className="bg-card rounded-2xl p-4 shadow-soft min-h-[180px] flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-foreground rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-background" />
              </div>
              <span className="text-3xl font-bold">{dailyLog.calories_burned}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Calories burned</p>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center">
                <Footprints className="w-5 h-5 text-background" />
              </div>
              <div>
                <p className="text-sm font-semibold">Steps</p>
                <p className="text-xs text-muted-foreground">+{dailyLog.steps}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 4: Water Intake
    {
      id: 'water',
      render: (
        <div className="bg-card rounded-2xl p-5 shadow-soft min-h-[180px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Droplet className="w-8 h-8 text-blue-500" fill="currentColor" />
              </div>
              <div>
                <p className="font-semibold text-lg">Water</p>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold">{waterOz} fl oz</span>
                  <span className="text-muted-foreground text-sm">({waterCups} cups)</span>
                  <button className="ml-1 p-1 rounded-full hover:bg-secondary">
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustWater(-cupsInMl)}
                className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => adjustWater(cupsInMl)}
                className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="mb-6">
      {/* Carousel content */}
      <div 
        ref={containerRef}
        className="overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="min-w-full">
              {slide.render}
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlide === index 
                ? 'bg-foreground w-4' 
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityCarousel;
