import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints, Flame, Plus, Minus, Settings, Beef, Wheat, Droplet, Leaf, Candy, HeartPulse } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { hasLoggedWaterBefore } from '@/lib/badge-triggers';
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
  const { earnBadge, hasBadge } = useBadges();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    steps: 0,
    calories_burned: 0,
    water_intake: 0
  });
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [hasLoggedWater, setHasLoggedWater] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const stepsGoal = 10000;
  const waterGoalCups = 8;
  const cupsInMl = 250;
  const minSwipeDistance = 50;


  useEffect(() => {
    if (user) {
      fetchDailyLog();
      // Check if user has logged water before for badge
      hasLoggedWaterBefore(user.id).then(setHasLoggedWater);
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

  const adjustWater = async (change: number) => {
    const wasZero = dailyLog.water_intake === 0;
    const newIntake = Math.max(0, dailyLog.water_intake + change);
    updateDailyLog({ water_intake: newIntake });

    // Award hydrated badge on first water log ever
    if (change > 0 && wasZero && !hasLoggedWater && !hasBadge('hydrated')) {
      await earnBadge('hydrated');
      setHasLoggedWater(true);
    }
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
          {/* Calories Card */}
          <div className="bg-card rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{Math.round(caloriesLeft)}</p>
                <p className="text-muted-foreground">Calories left</p>
              </div>

              {/* Ring + Icon */}
              <div className="relative flex items-center justify-center">
                <NutritionRing
                  value={caloriesLeft}
                  max={goals.daily_calories}
                  color="calories"
                  size={80}
                />
                <Flame className="absolute w-7 h-7 text-foreground" />
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            {/* Protein */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={proteinLeft}
                  max={goals.daily_protein}
                  color="protein"
                  size={44}
                />
                <Beef className="absolute w-4 h-4 text-protein" />
              </div>
              <p className="font-bold mt-2 text-sm">{Math.round(proteinLeft)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>

            {/* Carbs */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={carbsLeft}
                  max={goals.daily_carbs}
                  color="carbs"
                  size={44}
                />
                <Wheat className="absolute w-4 h-4 text-carbs" />
              </div>
              <p className="font-bold mt-2 text-sm">{Math.round(carbsLeft)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>

            {/* Fats */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={fatsLeft}
                  max={goals.daily_fats}
                  color="fats"
                  size={44}
                />
                <Droplet className="absolute w-4 h-4 text-fats" />
              </div>
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
          {/* Fiber, Sugar, Sodium */}
          <div className="grid grid-cols-3 gap-3">
            {/* Fiber */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={fiberLeft}
                  max={goals.daily_fiber}
                  color="fiber"
                  size={44}
                />
                <Leaf className="absolute w-4 h-4 text-fiber" />
              </div>
              <p className="font-bold mt-2 text-sm">{Math.round(fiberLeft)}g</p>
              <p className="text-xs text-muted-foreground">Fiber</p>
            </div>

            {/* Sugar */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={sugarLeft}
                  max={goals.daily_sugar}
                  color="sugar"
                  size={44}
                />
                <Candy className="absolute w-4 h-4 text-sugar" />
              </div>
              <p className="font-bold mt-2 text-sm">{Math.round(sugarLeft)}g</p>
              <p className="text-xs text-muted-foreground">Sugar</p>
            </div>

            {/* Sodium */}
            <div className="bg-card rounded-2xl p-3 shadow-soft text-center">
              <div className="relative flex items-center justify-center mx-auto">
                <NutritionRing
                  value={sodiumLeft}
                  max={goals.daily_sodium}
                  color="sodium"
                  size={44}
                />
                <Droplet className="absolute w-4 h-4 text-sodium" />
              </div>
              <p className="font-bold mt-2 text-sm">{Math.round(sodiumLeft)}mg</p>
              <p className="text-xs text-muted-foreground">Sodium</p>
            </div>
          </div>

          {/* Health Score */}
          <div
            className="bg-card rounded-2xl p-4 shadow-soft cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/daily-breakdown')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-primary" />
                <p className="font-semibold text-base">Health score</p>
              </div>
              <p className="text-lg font-bold">{healthScore.score}/10</p>
            </div>

            <div className="h-1.5 bg-secondary rounded-full mb-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${healthScore.score * 10}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
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
        <div className="space-y-3">
          {/* Top Row: Steps + Calories */}
          <div className="grid grid-cols-2 gap-3">
            {/* Steps */}
            <div className="bg-card rounded-xl p-3 shadow-soft flex flex-col h-40">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{dailyLog.steps}</span>
                  <span className="text-xs text-muted-foreground">/{stepsGoal}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Steps</span>
                </div>
              </div>

              {/* Progress arc (compact) */}
              <div className="flex justify-center my-2">
                <div
                  className="w-12 h-6 border-t-2 border-l-2 border-r-2 rounded-t-full"
                  style={{
                    borderColor:
                      dailyLog.steps > 0
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--muted))'
                  }}
                />
              </div>

              <HealthConnectWidget
                onSynced={(steps, caloriesBurned) => {
                  setDailyLog(prev => ({
                    ...prev,
                    steps,
                    calories_burned: caloriesBurned
                  }));
                  updateDailyLog({ steps, calories_burned: caloriesBurned });
                }}
              />
            </div>

            {/* Calories Burned */}
            <div className="bg-card rounded-xl p-3 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 text-background" />
                  </div>
                  <span className="text-2xl font-bold">
                    {dailyLog.calories_burned}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calories burned
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Footprints className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  +{dailyLog.steps} steps
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Water (Compact Full Width) */}
          <div className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-3 h-16">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-blue-500" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Water</p>
                  <p className="text-sm font-bold">
                    {waterOz} fl oz
                    <span className="text-xs text-muted-foreground ml-1">
                      ({waterCups} cups)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustWater(-cupsInMl)}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => adjustWater(cupsInMl)}
                  className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
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
            className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
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
