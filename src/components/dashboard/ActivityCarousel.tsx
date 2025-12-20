import { useState, useEffect } from 'react';
import { Footprints, Flame, Droplet, Plus, Minus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay } from 'date-fns';

interface ActivityCarouselProps {
  selectedDate: Date;
  onDataChange?: () => void;
}

interface DailyLog {
  id?: string;
  steps: number;
  calories_burned: number;
  water_intake: number;
}

const ActivityCarousel = ({ selectedDate, onDataChange }: ActivityCarouselProps) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    steps: 0,
    calories_burned: 0,
    water_intake: 0
  });
  const [loading, setLoading] = useState(false);

  const stepsGoal = 10000;
  const waterGoalCups = 8;
  const cupsInMl = 250;

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

  const waterCups = Math.floor(dailyLog.water_intake / cupsInMl);
  const waterOz = Math.round(dailyLog.water_intake * 0.033814);

  const slides = [
    // Slide 1: Calories left (main)
    {
      id: 'nutrition',
      render: null // Placeholder, this slide is already in the parent
    },
    // Slide 2: Steps and Calories Burned
    {
      id: 'activity',
      render: (
        <div className="grid grid-cols-2 gap-4">
          {/* Steps Card */}
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-2xl font-bold">{dailyLog.steps}</span>
                <span className="text-sm text-muted-foreground">/{stepsGoal}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Footprints className="w-4 h-4" />
              <span className="text-sm">Steps Today</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">♥</span>
                </div>
                <div className="text-xs">
                  <p className="font-medium">Connect Google Health</p>
                  <p className="text-muted-foreground">to track your steps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calories Burned Card */}
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-background" />
              </div>
              <span className="text-2xl font-bold">{dailyLog.calories_burned}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Calories burned</p>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <Footprints className="w-4 h-4 text-background" />
              </div>
              <div>
                <p className="text-sm font-medium">Steps</p>
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
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Droplet className="w-8 h-8 text-blue-500" fill="currentColor" />
              </div>
              <div>
                <p className="font-semibold text-lg">Water</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{waterOz} fl oz</span>
                  <span className="text-muted-foreground">({waterCups} cups)</span>
                  <button className="ml-1 p-1 rounded-full hover:bg-secondary">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustWater(-cupsInMl)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => adjustWater(cupsInMl)}
                className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Filter out the placeholder slide
  const activeSlides = slides.filter(s => s.render !== null);

  return (
    <div className="mb-6">
      {/* Carousel content */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {activeSlides.map((slide, index) => (
            <div key={slide.id} className="min-w-full px-1">
              {slide.render}
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {activeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentSlide === index 
                ? 'bg-foreground' 
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityCarousel;
