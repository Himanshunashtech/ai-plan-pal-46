import { useState, useEffect, useRef } from 'react';
import { Footprints, Flame, Droplet, Plus, Minus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NutritionRing from '@/components/ui/NutritionRing';

interface NutritionData {
  caloriesLeft: number;
  proteinLeft: number;
  carbsLeft: number;
  fatsLeft: number;
  goals: {
    daily_calories: number;
    daily_protein: number;
    daily_carbs: number;
    daily_fats: number;
  };
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
      const { data: existing } = await supabase
        .from('daily_nutrition_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('daily_nutrition_logs')
          .update({
            water_intake: newLog.water_intake,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_nutrition_logs')
          .insert({
            user_id: user.id,
            log_date: dateStr,
            water_intake: newLog.water_intake
          });
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
    
    if (isLeftSwipe && currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const waterCups = Math.floor(dailyLog.water_intake / cupsInMl);
  const waterOz = Math.round(dailyLog.water_intake * 0.033814);

  const { caloriesLeft, proteinLeft, carbsLeft, fatsLeft, goals } = nutritionData;

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
    // Slide 2: Steps and Calories Burned
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
            
            {/* Progress arc placeholder */}
            <div className="flex-1 flex items-center justify-center my-2">
              <div className="w-16 h-8 border-t-4 border-l-4 border-r-4 border-muted rounded-t-full" />
            </div>

            <div className="bg-muted/50 rounded-xl p-3 mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 via-blue-400 to-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">❤</span>
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-medium">Connect Google Health</p>
                  <p className="text-muted-foreground">to track your steps</p>
                </div>
              </div>
            </div>
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
    // Slide 3: Water Intake
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
