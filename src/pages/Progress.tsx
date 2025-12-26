import { useEffect, useState, useMemo } from 'react';
import { Home, BarChart3, Scan, User, TrendingUp, TrendingDown, Flame, Beef, Wheat, Droplets, Leaf, Cookie, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCachedStats } from '@/hooks/useCachedStats';
import { fetchNutritionTrends, fetchWeeklyStats } from '@/store/slices/statsSlice';
import { useAppDispatch } from '@/store/hooks';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ProgressSkeleton } from '@/components/skeletons';
import SwipeableChart from '@/components/charts/SwipeableChart';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';


interface DailyData {
  date: string;
  day: string;
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

const Progress = () => {
  const location = useLocation();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('7');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [goals, setGoals] = useState<UserGoals>({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60, daily_fiber: 25, daily_sugar: 50, daily_sodium: 2300 });
  const [loading, setLoading] = useState(true); // Will be updated in effect

  // Use cached nutrition trends for 30-day period
  const { nutritionTrends, dailySummary } = useCachedStats();
  const cachedTrends = nutritionTrends.data;
  const isCached = !!cachedTrends;

  const [initialLoading, setInitialLoading] = useState(() => {
    // If we have cached trends and defaulting to 7 or 30 days, we might be able to show something
    // BUT calculate trends logic below relies on 'selectedPeriod'. 
    // If selectedPeriod is '30' (default is '7'), we can match. 
    // Let's rely on the effect to clear it fast, or check selectedPeriod default.
    return true;
  });
  const isNavHidden = useHideOnScroll();




  // Use cached goals from daily summary
  const goalsData = dailySummary.data?.goals;

  const tabs = [
    { id: '7' as const, label: '7 Days' },
    { id: '30' as const, label: '30 Days' },
    { id: '90' as const, label: '90 Days' },
  ];

  // Apply cached goals on load
  useEffect(() => {
    if (goalsData) {
      setGoals({
        daily_calories: goalsData.daily_calories || 2000,
        daily_protein: goalsData.daily_protein || 150,
        daily_carbs: goalsData.daily_carbs || 200,
        daily_fats: goalsData.daily_fats || 60,
        daily_fiber: goalsData.daily_fiber || 25,
        daily_sugar: goalsData.daily_sugar || 50,
        daily_sodium: goalsData.daily_sodium || 2300
      });
    }
  }, [goalsData]);

  // Use cached trends for 30-day view OR 7-day view if available
  useEffect(() => {
    if ((selectedPeriod === '30' || selectedPeriod === '7') && cachedTrends?.trends && isCached) {
      let formattedData = cachedTrends.trends.map(t => ({
        date: t.date,
        day: format(new Date(t.date), 'MMM d'),
        calories: t.calories,
        protein: t.protein,
        carbs: t.carbs,
        fats: t.fats,
        fiber: t.fiber,
        sugar: t.sugar,
        sodium: t.sodium
      }));

      if (selectedPeriod === '7') {
        formattedData = formattedData.slice(-7);
        formattedData = formattedData.map(d => ({
          ...d,
          day: format(new Date(d.date), 'EEE')
        }));
      }

      setDailyData(formattedData);
      setLoading(false);
      setInitialLoading(false);
    }
  }, [cachedTrends, isCached, selectedPeriod]);

  useEffect(() => {
    if (user) {
      // Skip fetch if we have cached data for 30/7 day period
      if ((selectedPeriod === '30' || selectedPeriod === '7') && cachedTrends?.trends && isCached) {
        return;
      }
      fetchProgressData().then(() => setInitialLoading(false));
    }
  }, [user, selectedPeriod, cachedTrends, isCached]);

  const fetchProgressData = async () => {
    if (!user) return;

    // Skip fetch if we have cached data for 30-day period and that's what we want
    if (selectedPeriod === '30' && cachedTrends?.trends && isCached) {
      // Logic handled in effect, but if we are here via pull-to-refresh or strict fetch:
      // We might want to force refresh.
    } else {
      setLoading(true);
    }

    try {
      // 30 Days: Use Cached Nutrition Trends
      if (selectedPeriod === '30') {
        const result = await dispatch(fetchNutritionTrends(true)).unwrap();
        if (result.data?.trends) {
          const formattedData = result.data.trends.map(t => ({
            date: t.date,
            day: format(new Date(t.date), 'MMM d'),
            calories: t.calories,
            protein: t.protein,
            carbs: t.carbs,
            fats: t.fats,
            fiber: t.fiber,
            sugar: t.sugar,
            sodium: t.sodium
          }));
          setDailyData(formattedData);
        }
      }
      // 7 Days: Use Cached Weekly Stats
      else if (selectedPeriod === '7') {
        const result = await dispatch(fetchWeeklyStats(true)).unwrap();
        if (result.data?.dailyData) {
          // Map object to array
          const dates = Object.keys(result.data.dailyData).sort();
          // We need last 7 days regardless of data presence to fill gaps
          const days = 7;
          const filledData: DailyData[] = [];

          for (let i = 0; i < days; i++) {
            const dateObj = subDays(new Date(), days - 1 - i);
            const dateKey = format(dateObj, 'yyyy-MM-dd');
            const dayData = result.data.dailyData[dateKey];

            filledData.push({
              date: dateKey,
              day: format(dateObj, 'EEE'),
              calories: dayData?.calories || 0,
              protein: dayData?.protein || 0,
              carbs: dayData?.carbs || 0,
              fats: dayData?.fats || 0,
              fiber: 0, // Weekly stats might not have fiber/sugar/sodium in cached-stats function? Checked: NO.
              sugar: 0,
              sodium: 0
            });
          }
          setDailyData(filledData);
        }
      }
      // 90 Days: Fallback to local fetch (Cached function doesn't support 90d yet)
      else {
        const days = parseInt(selectedPeriod);
        const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString();
        const endDate = endOfDay(new Date()).toISOString();

        const { data: foods, error: foodsError } = await supabase
          .from('food_entries')
          .select('calories, protein, carbs, fats, fiber, sugar, sodium, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', startDate)
          .lte('logged_at', endDate)
          .order('logged_at', { ascending: true });

        if (foodsError) throw foodsError;

        // ... (rest of local processing) ...
        const dailyMap: { [key: string]: DailyData } = {};
        for (let i = 0; i < days; i++) {
          const date = subDays(new Date(), days - 1 - i);
          const key = format(date, 'yyyy-MM-dd');
          dailyMap[key] = {
            date: key,
            day: format(date, days <= 7 ? 'EEE' : 'MMM d'),
            calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0
          };
        }
        foods?.forEach(food => {
          const key = format(new Date(food.logged_at), 'yyyy-MM-dd');
          if (dailyMap[key]) {
            dailyMap[key].calories += food.calories || 0;
            dailyMap[key].protein += Number(food.protein) || 0;
            dailyMap[key].carbs += Number(food.carbs) || 0;
            dailyMap[key].fats += Number(food.fats) || 0;
            dailyMap[key].fiber += Number(food.fiber) || 0;
            dailyMap[key].sugar += Number(food.sugar) || 0;
            dailyMap[key].sodium += Number(food.sodium) || 0;
          }
        });
        setDailyData(Object.values(dailyMap));
      }

      // Fetch Goals (always needed) - cached-stats has fetchUserGoals, could use that too but 
      // let's stick to what we have or allow one direct profile call if not in payload
      // valid optimization: fetchUserGoals is supported in cached-stats.
      // But fetchDailySummary also returns goals.
      // Let's just keep the direct profile fetch for 90d, or use valid cache data if available.

      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setGoals({
          daily_calories: profile.daily_calories || 2000,
          daily_protein: profile.daily_protein || 150,
          daily_carbs: profile.daily_carbs || 200,
          daily_fats: profile.daily_fats || 60,
          daily_fiber: profile.daily_fiber || 25,
          daily_sugar: profile.daily_sugar || 50,
          daily_sodium: profile.daily_sodium || 2300
        });
      }

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and averages
  const daysWithData = dailyData.filter(d => d.calories > 0).length;
  const totals = dailyData.reduce((acc, d) => ({
    calories: acc.calories + d.calories,
    protein: acc.protein + d.protein,
    carbs: acc.carbs + d.carbs,
    fats: acc.fats + d.fats,
    fiber: acc.fiber + d.fiber,
    sugar: acc.sugar + d.sugar,
    sodium: acc.sodium + d.sodium
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 });

  const averages = {
    calories: daysWithData > 0 ? Math.round(totals.calories / daysWithData) : 0,
    protein: daysWithData > 0 ? Math.round(totals.protein / daysWithData) : 0,
    carbs: daysWithData > 0 ? Math.round(totals.carbs / daysWithData) : 0,
    fats: daysWithData > 0 ? Math.round(totals.fats / daysWithData) : 0,
    fiber: daysWithData > 0 ? Math.round(totals.fiber / daysWithData) : 0,
    sugar: daysWithData > 0 ? Math.round(totals.sugar / daysWithData) : 0,
    sodium: daysWithData > 0 ? Math.round(totals.sodium / daysWithData) : 0
  };

  const goalAchievement = goals.daily_calories > 0
    ? Math.round((averages.calories / goals.daily_calories) * 100)
    : 0;

  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#ef4444' },
    { name: 'Carbs', value: totals.carbs, color: '#f59e0b' },
    { name: 'Fats', value: totals.fats, color: '#3b82f6' },
  ];

  const microData = [
    { name: 'Fiber', value: totals.fiber, color: 'hsl(142, 76%, 36%)' },
    { name: 'Sugar', value: totals.sugar, color: 'hsl(330, 81%, 60%)' },
    { name: 'Sodium', value: totals.sodium, color: 'hsl(271, 81%, 56%)' },
  ];

  const caloriesTrend = averages.calories - goals.daily_calories;
  const isOverGoal = caloriesTrend > 0;

  if (initialLoading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom ">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${goalAchievement >= 80 && goalAchievement <= 120 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
            <span className="text-sm font-medium">{goalAchievement}% of goal</span>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedPeriod === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Calories Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Calories Trend
                </h3>
                <div className={`flex items-center gap-1 text-sm ${isOverGoal ? 'text-orange-500' : 'text-green-500'}`}>
                  {isOverGoal ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(caloriesTrend)} avg/day</span>
                </div>
              </div>
              <SwipeableChart dataLength={dailyData.length} itemWidth={selectedPeriod === '7' ? 14 : selectedPeriod === '30' ? 5 : 2}>
                <div className="h-48" style={{ width: `${Math.max(dailyData.length * (selectedPeriod === '7' ? 50 : selectedPeriod === '30' ? 25 : 15), 100)}px`, minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={selectedPeriod === '7' ? 0 : 29}
                      />
                      <YAxis hide />
                      <Bar
                        dataKey="calories"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SwipeableChart>
            </div>

            {/* Macros Line Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4">Macros Over Time</h3>
              <SwipeableChart dataLength={dailyData.length} itemWidth={selectedPeriod === '7' ? 14 : selectedPeriod === '30' ? 5 : 2}>
                <div className="h-48" style={{ width: `${Math.max(dailyData.length * (selectedPeriod === '7' ? 50 : selectedPeriod === '30' ? 25 : 15), 100)}px`, minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={selectedPeriod === '7' ? 0 : 29}
                      />
                      <YAxis hide />
                      <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="fats" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SwipeableChart>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Protein</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Carbs</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Fats</span>
                </div>
              </div>
            </div>

            {/* Fiber, Sugar, Sodium Line Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4">Fiber, Sugar & Sodium Over Time</h3>
              <SwipeableChart dataLength={dailyData.length} itemWidth={selectedPeriod === '7' ? 14 : selectedPeriod === '30' ? 5 : 2}>
                <div className="h-48" style={{ width: `${Math.max(dailyData.length * (selectedPeriod === '7' ? 50 : selectedPeriod === '30' ? 25 : 15), 100)}px`, minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={selectedPeriod === '7' ? 0 : 29}
                      />
                      <YAxis hide />
                      <Line type="monotone" dataKey="fiber" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sugar" stroke="hsl(330, 81%, 60%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sodium" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} name="Sodium (÷100)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SwipeableChart>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-fiber" />
                  <span className="text-xs text-muted-foreground">Fiber</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-sugar" />
                  <span className="text-xs text-muted-foreground">Sugar</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-sodium" />
                  <span className="text-xs text-muted-foreground">Sodium</span>
                </div>
              </div>
            </div>

            {/* Macro Distribution Pie */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4">Macro Distribution</h3>
              <div className="flex items-center">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 ml-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Beef className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Protein</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.protein)}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Carbs</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.carbs)}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Fats</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.fats)}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Nutrients Summary */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4">Micronutrient Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-fiber" />
                    <span className="text-sm">Fiber</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{Math.round(totals.fiber)}g</span>
                    <span className="text-xs text-muted-foreground ml-2">avg {averages.fiber}g/day</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-sugar" />
                    <span className="text-sm">Sugar</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{Math.round(totals.sugar)}g</span>
                    <span className="text-xs text-muted-foreground ml-2">avg {averages.sugar}g/day</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sodium" />
                    <span className="text-sm">Sodium</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{Math.round(totals.sodium)}mg</span>
                    <span className="text-xs text-muted-foreground ml-2">avg {averages.sodium}mg/day</span>
                  </div>
                </div>
              </div>
            </div>

            {/* vs Weekly Average Card */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today vs {selectedPeriod} Day Average</p>
                  <p className="text-lg font-semibold">
                    {dailyData[dailyData.length - 1]?.calories || 0} / {averages.calories} cal
                  </p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${(dailyData[dailyData.length - 1]?.calories || 0) > averages.calories
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-green-100 text-green-600'
                  }`}>
                  {(dailyData[dailyData.length - 1]?.calories || 0) > averages.calories ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs((dailyData[dailyData.length - 1]?.calories || 0) - averages.calories)} cal
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div>
              <h3 className="font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl p-4 shadow-soft">
                  <p className="text-sm text-muted-foreground">Total Calories</p>
                  <p className="text-2xl font-bold">{totals.calories.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-soft">
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold">{averages.calories.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-soft">
                  <p className="text-sm text-muted-foreground">Days Tracked</p>
                  <p className="text-2xl font-bold">{daysWithData}</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-soft">
                  <p className="text-sm text-muted-foreground">Goal Target</p>
                  <p className="text-2xl font-bold">{goals.daily_calories.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Motivation Message */}
            {daysWithData > 0 && (
              <p className="text-center text-sm mt-6 p-4 bg-secondary/50 rounded-2xl">
                {goalAchievement >= 80 && goalAchievement <= 120
                  ? "🎉 Great job! You're hitting your calorie goals consistently!"
                  : goalAchievement < 80
                    ? "💪 Keep going! Try to get closer to your daily calorie goal."
                    : "⚡ You're eating above your goal. Consider adjusting portions."}
              </p>
            )}
          </>
        )}
      </div>

      <nav
        className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom
  transition-transform duration-300 ease-out
  ${isNavHidden ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="relative grid grid-cols-3 items-center py-2">
          {/* Home */}
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-0.5 ${location.pathname === '/dashboard'
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
            className={`flex flex-col items-center gap-0.5 ${location.pathname === '/progress'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span className="text-[10px]">Analytics</span>
          </Link>

          {/* Settings */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-0.5 ${location.pathname === '/profile'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span className="text-[10px]">Settings</span>
          </Link>
        </div>
      </nav>

    </div>
  );
};

export default Progress;