import { useEffect, useState } from 'react';
import { Home, BarChart3, Scan, User, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NutritionRing from '@/components/ui/NutritionRing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, endOfDay, subDays, addDays, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
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

interface WeeklyAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [weeklyAverage, setWeeklyAverage] = useState<WeeklyAverage>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [goals, setGoals] = useState<UserGoals>({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60 });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

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

  useEffect(() => {
    if (user) {
      fetchWeeklyAverage();
    }
  }, [user, weekOffset]);

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

  const fetchWeeklyAverage = async () => {
    if (!user) return;
    
    try {
      const weekStartDate = startOfDay(weekDates[0]).toISOString();
      const weekEndDate = endOfDay(weekDates[6]).toISOString();

      const { data: foods, error } = await supabase
        .from('food_entries')
        .select('calories, protein, carbs, fats, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', weekStartDate)
        .lte('logged_at', weekEndDate);

      if (error) throw error;

      if (foods && foods.length > 0) {
        const dailyData: { [key: string]: DailyTotals } = {};
        
        foods.forEach(food => {
          const day = format(new Date(food.logged_at), 'yyyy-MM-dd');
          if (!dailyData[day]) {
            dailyData[day] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
          }
          dailyData[day].calories += food.calories || 0;
          dailyData[day].protein += food.protein || 0;
          dailyData[day].carbs += food.carbs || 0;
          dailyData[day].fats += food.fats || 0;
        });

        const daysWithData = Object.keys(dailyData).length;
        const totals = Object.values(dailyData).reduce((acc, day) => ({
          calories: acc.calories + day.calories,
          protein: acc.protein + day.protein,
          carbs: acc.carbs + day.carbs,
          fats: acc.fats + day.fats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        setWeeklyAverage({
          calories: Math.round(totals.calories / daysWithData),
          protein: Math.round(totals.protein / daysWithData),
          carbs: Math.round(totals.carbs / daysWithData),
          fats: Math.round(totals.fats / daysWithData)
        });
      } else {
        setWeeklyAverage({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      }
    } catch (error) {
      console.error('Error fetching weekly average:', error);
    }
  };

  const caloriesLeft = Math.max(0, goals.daily_calories - dailyTotals.calories);
  const proteinLeft = Math.max(0, goals.daily_protein - dailyTotals.protein);
  const carbsLeft = Math.max(0, goals.daily_carbs - dailyTotals.carbs);
  const fatsLeft = Math.max(0, goals.daily_fats - dailyTotals.fats);

  const caloriesDiff = dailyTotals.calories - weeklyAverage.calories;
  const isAboveAverage = caloriesDiff > 0;

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

        <div className="bg-card rounded-3xl p-6 shadow-soft mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{caloriesLeft}</p>
              <p className="text-muted-foreground">Calories left</p>
            </div>
            <NutritionRing value={caloriesLeft} max={goals.daily_calories} color="calories" size={80} />
          </div>
        </div>

        {/* Weekly Comparison */}
        {weeklyAverage.calories > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">vs Weekly Average</p>
                <p className="text-lg font-semibold">
                  {dailyTotals.calories} / {weeklyAverage.calories} cal
                </p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                isAboveAverage ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
              }`}>
                {isAboveAverage ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(caloriesDiff)} cal
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={proteinLeft} max={goals.daily_protein} color="protein" size={50} />
            <p className="font-bold mt-2">{Math.round(proteinLeft)}g</p>
            <p className="text-xs text-muted-foreground">Protein left</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={carbsLeft} max={goals.daily_carbs} color="carbs" size={50} />
            <p className="font-bold mt-2">{Math.round(carbsLeft)}g</p>
            <p className="text-xs text-muted-foreground">Carbs left</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={fatsLeft} max={goals.daily_fats} color="fats" size={50} />
            <p className="font-bold mt-2">{Math.round(fatsLeft)}g</p>
            <p className="text-xs text-muted-foreground">Fat left</p>
          </div>
        </div>

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
                <div key={food.id} className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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