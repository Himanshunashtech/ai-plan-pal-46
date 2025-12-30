import { useEffect, useState, useCallback } from 'react';
import { Home, BarChart3, Scan, User, ChevronLeft, ChevronRight, X, Flame, Beef, Wheat, Droplets, Heart, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { StreakIcon } from '@/components/dashboard/StreakIcon';
import { StreakShareSheet } from '@/components/badges/StreakShareSheet';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import NutritionRing from '@/components/ui/NutritionRing';
import ActivityCarousel from '@/components/dashboard/ActivityCarousel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { useCachedStats } from '@/hooks/useCachedStats';
import { format, startOfDay, endOfDay, subDays, addDays, isSameDay } from 'date-fns';
import { useSwipe } from '@/hooks/useSwipe';
import { DashboardSkeleton } from '@/components/skeletons';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';
import WaterIntakeSheet from '@/components/dashboard/WaterIntakeSheet';
import { toast as sonnerToast } from 'sonner';
import { useTranslation } from 'react-i18next';




import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDailyLog, FoodEntry, fetchDailySummary, selectAllFoods } from '@/store/slices/statsSlice';

// interface FoodEntry removed (imported from statsSlice)

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
  water_intake: number;
}

const calculateHealthScore = (food: FoodEntry, goals: UserGoals): number => {
  // Calculate health score based on macro balance and calorie density
  const protein = food.protein || 0;
  const carbs = food.carbs || 0;
  const fats = food.fats || 0;
  const calories = food.calories || 1;

  // Protein ratio score (higher protein = better)
  const proteinCalories = protein * 4;
  const proteinRatio = proteinCalories / calories;
  const proteinScore = Math.min(proteinRatio * 100, 40);

  // Balanced macro score
  const totalMacros = protein + carbs + fats;
  if (totalMacros === 0) return 50;

  const proteinPercent = (protein / totalMacros) * 100;
  const carbPercent = (carbs / totalMacros) * 100;
  const fatPercent = (fats / totalMacros) * 100;

  // Ideal: 30% protein, 40% carbs, 30% fat
  const proteinDiff = Math.abs(proteinPercent - 30);
  const carbDiff = Math.abs(carbPercent - 40);
  const fatDiff = Math.abs(fatPercent - 30);

  const balanceScore = Math.max(0, 60 - (proteinDiff + carbDiff + fatDiff) / 3);

  return Math.round(proteinScore + balanceScore);
};

const getHealthScoreColor = (score: number): string => {
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const getHealthScoreLabel = (score: number, t: any): string => {
  if (score >= 70) return t('excellent');
  if (score >= 50) return t('good');
  return t('fair');
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { newlyUnlockedBadge, clearNewlyUnlockedBadge } = useBadges();
  const { t } = useTranslation();



  // Use cached stats for goals (fast initial load)
  const { dailySummary } = useCachedStats();
  const cachedSummary = dailySummary.data;
  const isCached = !!cachedSummary;

  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0
  });
  const [goals, setGoals] = useState<UserGoals>({
    daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60,
    daily_fiber: 25, daily_sugar: 50, daily_sodium: 2300, water_intake: 2000
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [showWaterSheet, setShowWaterSheet] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStreakSheet, setShowStreakSheet] = useState(false);
  const today = new Date();
  const weekStart = subDays(today, 6 + weekOffset * 7);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = weekDates.map(d => format(d, 'EEEEE'));

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setWeekOffset(prev => prev + 1);
    } else if (direction === 'next' && weekOffset > 0) {
      setWeekOffset(prev => prev - 1);
    }
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => navigateWeek('prev'),
    onSwipeRight: () => navigateWeek('next'),
  });

  const [initialLoading, setInitialLoading] = useState(!isCached);

  // Use cached goals on initial load for faster display
  useEffect(() => {
    if (cachedSummary?.goals && isCached) {
      setGoals({
        daily_calories: cachedSummary.goals.daily_calories || 2000,
        daily_protein: cachedSummary.goals.daily_protein || 150,
        daily_carbs: cachedSummary.goals.daily_carbs || 200,
        daily_fats: cachedSummary.goals.daily_fats || 60,
        daily_fiber: cachedSummary.goals.daily_fiber || 25,
        daily_sugar: cachedSummary.goals.daily_sugar || 50,
        daily_sodium: cachedSummary.goals.daily_sodium || 2300,
        water_intake: (cachedSummary.goals as any).water_intake || 2000
      });
    }
  }, [cachedSummary, isCached]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData().then(() => {
        if (initialLoading) setInitialLoading(false);
      });
    }
  }, [user?.id, selectedDate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Only show loading indicator if we don't have cached data and it's the first load
    // OR if we are switching days and don't have data for that day (though we rely on recentFoods currently)
    // To match previous optimized behavior:
    if (recentFoods.length === 0 && !isCached) setLoading(true);

    try {
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data: foods, error: foodsError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dayStart)
        .lte('logged_at', dayEnd)
        .order('logged_at', { ascending: false });

      if (foodsError) throw foodsError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium, water_intake')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: waterData } = await supabase
        .from('daily_nutrition_logs')
        .select('water_intake')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (waterData) {
        setWaterIntake(waterData.water_intake || 0);
      } else {
        setWaterIntake(0);
      }

      let totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 };

      if (foods) {
        setRecentFoods(foods);
        totals = foods.reduce((acc, food) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fats: acc.fats + (food.fats || 0),
          fiber: acc.fiber + ((food as any).fiber || 0),
          sugar: acc.sugar + ((food as any).sugar || 0),
          sodium: acc.sodium + ((food as any).sodium || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 });
        setDailyTotals(totals);
      }

      if (profile) {
        setGoals({
          daily_calories: profile.daily_calories || 2000,
          daily_protein: profile.daily_protein || 150,
          daily_carbs: profile.daily_carbs || 200,
          daily_fats: profile.daily_fats || 60,
          daily_fiber: (profile as any).daily_fiber || 25,
          daily_sugar: (profile as any).daily_sugar || 50,
          daily_sodium: (profile as any).daily_sodium || 2300,
          water_intake: (profile as any).water_intake || 2000
        });
      }

      // Sync with Redux if it's today (for optimistic updates)
      if (isSameDay(selectedDate, new Date())) {
        dispatch(setDailyLog({
          foods: foods || [],
          totals,
          goals: profile ? {
            daily_calories: profile.daily_calories,
            daily_protein: profile.daily_protein,
            daily_carbs: profile.daily_carbs,
            daily_fats: profile.daily_fats,
            daily_fiber: (profile as any).daily_fiber,
            daily_sugar: (profile as any).daily_sugar,
            daily_sodium: (profile as any).daily_sodium,
            water_intake: (profile as any).water_intake
          } : undefined
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  };

  const handleUpdateWater = async (amount: number) => {
    if (!user) return;

    try {
      // User Request: Update raw profile water_intake (Goal/Target) instead of daily log
      const { error } = await supabase
        .from('profiles')
        .update({
          water_intake: amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setWaterIntake(amount);
      sonnerToast.success(t('water_update_success', { amount }));
      fetchDashboardData(); // Refresh to sync everything
    } catch (err) {
      console.error('Error updating water:', err);
      sonnerToast.error(t('water_update_failed'));
    }
  };

  const reduxDailySummary = useAppSelector(state => state.stats.dailySummary);
  const reduxFoods = useAppSelector(selectAllFoods);
  const isToday = isSameDay(selectedDate, new Date());

  // Prefer Redux state for "Today" to show optimistic updates
  const displayFoods = isToday ? (reduxFoods.length > 0 ? reduxFoods : recentFoods) : recentFoods;
  const displayTotals = isToday ? (reduxDailySummary.data?.totals || dailyTotals) : dailyTotals;

  const caloriesLeft = Math.max(0, goals.daily_calories - displayTotals.calories);
  const proteinLeft = Math.max(0, goals.daily_protein - displayTotals.protein);
  const carbsLeft = Math.max(0, goals.daily_carbs - displayTotals.carbs);
  const fatsLeft = Math.max(0, goals.daily_fats - displayTotals.fats);
  const fiberLeft = Math.max(0, goals.daily_fiber - displayTotals.fiber);
  const sugarLeft = Math.max(0, goals.daily_sugar - displayTotals.sugar);
  const sodiumLeft = Math.max(0, goals.daily_sodium - displayTotals.sodium);

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="bg-background min-h-screen safe-area-top safe-area-bottom ">
      <div
        className="flex-1 px-6 py-6 pb-24 overflow-auto"

      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <StreakIcon onClick={() => setShowStreakSheet(true)} />
            <span className="font-bold text-lg">Calo</span>
            <SubscriptionBadge compact />
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell onClick={() => setShowNotifications(true)} />
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4"
          {...swipeHandlers}>
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-full bg-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className={`p-2 rounded-full bg-secondary ${weekOffset === 0 ? 'opacity-50' : ''}`}
            disabled={weekOffset === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between mb-8">
          {weekDates.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const isFuture = date > today;
            return (
              <button
                key={i}
                onClick={() => !isFuture && setSelectedDate(date)}
                className={`flex flex-col items-center ${isFuture ? 'opacity-40' : ''}`}
                disabled={isFuture}
              >
                <span className="text-xs text-muted-foreground mb-1">{dayNames[i]}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                    ? 'ring-2 ring-primary/50 text-foreground'
                    : 'text-foreground'
                  }`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>



        {/* Unified Swipeable Cards Carousel */}
        <ActivityCarousel
          selectedDate={selectedDate}
          onDataChange={fetchDashboardData}
          onWaterClick={() => setShowWaterSheet(true)}
          nutritionData={{
            caloriesLeft,
            proteinLeft,
            carbsLeft,
            fatsLeft,
            fiberLeft,
            sugarLeft,
            sodiumLeft,
            dailyTotals: displayTotals,
            goals
          }}
        />

        <div>
          <h3 className="font-semibold mb-4">
            {isSameDay(selectedDate, today) ? t('recently_logged') : format(selectedDate, 'EEEE, MMM d')}
          </h3>
          {loading && !displayFoods.length ? (
            <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
              <p className="text-muted-foreground">{t('loading')}</p>
            </div>
          ) : displayFoods.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
              <div className="flex flex-row items-center justify-center text-center gap-2">
                <div className="text-4xl mb-2" aria-hidden>
                  🍛
                </div>
                <div className="flex flex-col items-center justify-center text-center">

                  <p className="font-semibold">
                    {t('no_food')}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {t('snap_pic')}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              {displayFoods.slice(0, 10).map((food) => {
                const isTemp = food.id.startsWith('temp-');
                return (
                  <button
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className="w-full bg-card rounded-2xl p-3 shadow-soft flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
                  >
                    {/* Image Container with soft background */}
                    <div className="relative w-16 h-16 rounded-2xl bg-[#f0f7f0] flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: '#f0f7f0' }}>
                      {food.image_url ? (
                        <>
                          <img
                            src={food.image_url}
                            alt={food.name}
                            className={`w-full h-full object-cover rounded-xl ${isTemp ? 'blur-[2px] opacity-80' : ''}`}
                          />
                          {isTemp && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white animate-spin" />
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-2xl">🍽️</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      {/* Row 1: Name and Time */}
                      <div className="flex justify-between items-baseline">
                        <p className="font-bold text-[15px] truncate text-foreground">{food.name}</p>
                        <p className="text-[11px] text-muted-foreground shrink-0 ml-2">
                          {format(new Date(food.logged_at), 'h:mm a')}
                        </p>
                      </div>

                      {/* Row 2: Calories */}
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#22c55e] fill-[#22c55e]/10" />
                        <p className="text-[13px] font-medium text-muted-foreground">
                          {food.calories} {t('calories').toLowerCase()}
                        </p>
                      </div>

                      {/* Row 3: Macros */}
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Beef className="w-3 h-3 text-red-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">{food.protein || 0}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wheat className="w-3 h-3 text-amber-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">{food.carbs || 0}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">{food.fats || 0}g</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Meal Detail Modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-card rounded-t-3xl w-full max-w-lg p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('meal_details')}</h3>
              <button
                onClick={() => setSelectedFood(null)}
                className="p-2 rounded-full bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {selectedFood.image_url ? (
                <img
                  src={selectedFood.image_url}
                  alt={selectedFood.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
                  <span className="text-3xl">🍽️</span>
                </div>
              )}
              <div>
                <h4 className="font-bold text-lg">{selectedFood.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedFood.meal_type || 'Meal'} • {format(new Date(selectedFood.logged_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>

            {/* Health Score */}
            <div className="bg-secondary/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-medium">{t('health_score')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getHealthScoreColor(calculateHealthScore(selectedFood, goals))}`}>
                    {calculateHealthScore(selectedFood, goals)}
                  </span>
                  <span className={`text-sm ${getHealthScoreColor(calculateHealthScore(selectedFood, goals))}`}>
                    {getHealthScoreLabel(calculateHealthScore(selectedFood, goals), t)}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${calculateHealthScore(selectedFood, goals) >= 70 ? 'bg-green-500' :
                    calculateHealthScore(selectedFood, goals) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${calculateHealthScore(selectedFood, goals)}%` }}
                />
              </div>
            </div>

            {/* Calories */}
            <div className="bg-secondary/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">{t('calories')}</span>
                </div>
                <span className="text-xl font-bold">{selectedFood.calories}</span>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.protein || 0}g</p>
                <p className="text-xs text-muted-foreground">{t('protein')}</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.carbs || 0}g</p>
                <p className="text-xs text-muted-foreground">{t('carbs')}</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.fats || 0}g</p>
                <p className="text-xs text-muted-foreground">{t('fats')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Streak Share Sheet */}
      <StreakShareSheet
        isOpen={showStreakSheet}
        onClose={() => setShowStreakSheet(false)}
      />

      {/* Badge Celebration */}
      {newlyUnlockedBadge && (
        <BadgeCelebration
          badge={newlyUnlockedBadge}
          onClose={clearNewlyUnlockedBadge}
          onViewAll={() => {
            clearNewlyUnlockedBadge();
            navigate('/milestones');
          }}
        />
      )}





      {/* Water Intake Sheet */}
      <WaterIntakeSheet
        isOpen={showWaterSheet}
        onClose={() => setShowWaterSheet(false)}
        currentIntake={waterIntake}
        onSave={handleUpdateWater}
        goal={goals.water_intake || 2000}
      />

    </div>
  );
};

export default Dashboard;