import { useEffect, useState } from 'react';
import { Home, BarChart3, Scan, User, ChevronLeft, ChevronRight, X, Flame, Beef, Wheat, Droplets, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NutritionRing from '@/components/ui/NutritionRing';
import ActivityCarousel from '@/components/dashboard/ActivityCarousel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, endOfDay, subDays, addDays, isSameDay } from 'date-fns';
import { useSwipe } from '@/hooks/useSwipe';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number | null;
  protein: number | null;
  fats: number | null;
  image_url: string | null;
  meal_type: string | null;
  logged_at: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface UserGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
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
  const { user } = useAuth();
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [goals, setGoals] = useState<UserGoals>({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60 });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedDate]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
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
        .select('daily_calories, daily_protein, daily_carbs, daily_fats')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (foods) {
        setRecentFoods(foods);
        const totals = foods.reduce((acc, food) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fats: acc.fats + (food.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
        setDailyTotals(totals);
      }

      if (profile) {
        setGoals({
          daily_calories: profile.daily_calories || 2000,
          daily_protein: profile.daily_protein || 150,
          daily_carbs: profile.daily_carbs || 200,
          daily_fats: profile.daily_fats || 60
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const caloriesLeft = Math.max(0, goals.daily_calories - dailyTotals.calories);
  const proteinLeft = Math.max(0, goals.daily_protein - dailyTotals.protein);
  const carbsLeft = Math.max(0, goals.daily_carbs - dailyTotals.carbs);
  const fatsLeft = Math.max(0, goals.daily_fats - dailyTotals.fats);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div 
        className="flex-1 px-6 py-6 pb-24 overflow-auto"
        {...swipeHandlers}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-lg">Cal AI</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1">
            <span className="text-accent">🔥</span>
            <span className="font-semibold">{recentFoods.length}</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isSelected 
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
            goals
          }}
        />

        <div>
          <h3 className="font-semibold mb-4">
            {isSameDay(selectedDate, today) ? 'Recently logged' : format(selectedDate, 'EEEE, MMM d')}
          </h3>
          {loading ? (
            <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : recentFoods.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
              <p className="text-muted-foreground">No food logged for this day</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking meals by taking a quick picture.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFoods.slice(0, 5).map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className="w-full bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4 text-left transition-transform active:scale-[0.98]"
                >
                  {food.image_url ? (
                    <img 
                      src={food.image_url} 
                      alt={food.name} 
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{food.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {food.calories} cal • {food.meal_type || 'Meal'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(food.logged_at), 'h:mm a')}
                    </p>
                  </div>
                </button>
              ))}
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
                  className={`h-full rounded-full transition-all ${
                    calculateHealthScore(selectedFood, goals) >= 70 ? 'bg-green-500' :
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

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, path: '/dashboard', label: 'Home' },
            { icon: BarChart3, path: '/progress', label: 'Analytics' },
            { icon: Scan, path: '/scanner', label: 'Scan' },
            { icon: User, path: '/profile', label: 'Settings' },
          ].map(({ icon: Icon, path, label }) => (
            <Link key={path} to={path} className={`flex flex-col items-center gap-1 px-4 ${
              location.pathname === path ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;