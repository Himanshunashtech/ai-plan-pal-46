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
import { useHideOnScroll } from '@/hooks/useHideOnScroll';



import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDailyLog, FoodEntry, fetchDailySummary } from '@/store/slices/statsSlice';

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

const getHealthScoreLabel = (score: number): string => {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Good';
  return 'Fair';
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { newlyUnlockedBadge, clearNewlyUnlockedBadge } = useBadges();
  const isNavHidden = useHideOnScroll();


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
    daily_fiber: 25, daily_sugar: 50, daily_sodium: 2300
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
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
        daily_sodium: cachedSummary.goals.daily_sodium || 2300
      });
    }
  }, [cachedSummary, isCached]);

  useEffect(() => {
    if (user) {
      fetchDashboardData().then(() => {
        if (initialLoading) setInitialLoading(false);
      });
    }
  }, [user, selectedDate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Only show loading indicator if we don't have cached data and it's the first load
    // OR if explicitly refreshing.
    if (!isCached && recentFoods.length === 0) setLoading(true);

    try {
      // Use the Redux thunk which calls the cached-stats Supabase function
      const result = await dispatch(fetchDailySummary(true)).unwrap(); // Force refresh to get latest, but use cache logic in thunk if needed

      // The thunk already updates Redux state.
      // We also update local state to keep the component working as is 
      // (though ideally we should rely solely on Redux selectors).

      if (result.data) {
        if (result.data.entries) {
          setRecentFoods(result.data.entries);
        }
        if (result.data.totals) {
          setDailyTotals(result.data.totals);
        }
        if (result.data.goals) {
          setGoals({
            daily_calories: result.data.goals.daily_calories || 2000,
            daily_protein: result.data.goals.daily_protein || 150,
            daily_carbs: result.data.goals.daily_carbs || 200,
            daily_fats: result.data.goals.daily_fats || 60,
            daily_fiber: result.data.goals.daily_fiber || 25,
            daily_sugar: result.data.goals.daily_sugar || 50,
            daily_sodium: result.data.goals.daily_sodium || 2300
          });
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  };

  const reduxDailySummary = useAppSelector(state => state.stats.dailySummary);
  const isToday = isSameDay(selectedDate, new Date());

  // Prefer Redux state for "Today" to show optimistic updates
  const displayFoods = isToday ? (reduxDailySummary.data?.entries || recentFoods) : recentFoods;
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
            {isSameDay(selectedDate, today) ? 'Recently logged' : format(selectedDate, 'EEEE, MMM d')}
          </h3>
          {loading && !displayFoods.length ? (
            <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : displayFoods.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
              <div className="flex flex-row items-center justify-center text-center gap-2">
                <div className="text-4xl mb-2" aria-hidden>
                  🍛
                </div>
                <div className="flex flex-col items-center justify-center text-center">

                  <p className="font-semibold">
                    No food logged
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Snap a pic to track.
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
                          {food.calories} calories
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
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-card rounded-t-3xl w-full max-w-lg p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Meal Details</h3>
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
                  <span className="font-medium">Health Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getHealthScoreColor(calculateHealthScore(selectedFood, goals))}`}>
                    {calculateHealthScore(selectedFood, goals)}
                  </span>
                  <span className={`text-sm ${getHealthScoreColor(calculateHealthScore(selectedFood, goals))}`}>
                    {getHealthScoreLabel(calculateHealthScore(selectedFood, goals))}
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
                  <span className="font-medium">Calories</span>
                </div>
                <span className="text-xl font-bold">{selectedFood.calories}</span>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.protein || 0}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.carbs || 0}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{selectedFood.fats || 0}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
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

      <nav className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom
  transition-transform duration-300 ease-out
  ${isNavHidden ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="relative flex items-center justify-around py-2 ">
          {/* Home */}
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-4 ${location.pathname === '/dashboard'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            <span className="text-[10px]">Home</span>
          </Link>

          {/* Analytics */}
          <Link
            to="/progress"
            className={`flex flex-col items-center gap-0.5 px-4 ${location.pathname === '/progress'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span className="text-[10px]">Analytics</span>
          </Link>

          {/* Settings (extra right spacing so it doesn't go under +) */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-0.5 px-4 pr-16 ${location.pathname === '/profile'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span className="text-[10px]">Settings</span>
          </Link>

          {/* FLOATING + BUTTON */}
          <Link
            to="/scanner"
            className="absolute -top-6 right-4"
          >
            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-xl active:scale-95 transition-transform">
              <Plus className="w-7 h-7 text-white" />
            </div>
          </Link>
        </div>
      </nav>



    </div>
  );
};

export default Dashboard;