import { useEffect, useState, useMemo } from 'react';
import { Home, BarChart3, Scan, User, TrendingUp, TrendingDown, Flame, Beef, Wheat, Droplets, Leaf, Cookie, Zap, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ProgressSkeleton } from '@/components/skeletons';
import SwipeableChart from '@/components/charts/SwipeableChart';



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

const CACHE: Record<string, { data: DailyData[], goals: UserGoals, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const Progress = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('7');

  // Cache key helper
  const getCacheKey = () => `${user?.id || 'anon'}-${selectedPeriod}`;
  const cached = CACHE[getCacheKey()];
  const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_TTL);

  const [dailyData, setDailyData] = useState<DailyData[]>(isCacheValid ? cached.data : []);
  const [goals, setGoals] = useState<UserGoals>(isCacheValid ? cached.goals : { daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60, daily_fiber: 25, daily_sugar: 50, daily_sodium: 2300 });

  const [loading, setLoading] = useState(!isCacheValid);
  const [initialLoading, setInitialLoading] = useState(!isCacheValid);

  // We can remove goalsData derived from useCachedStats as we fetch goals in fetchProgressData now.

  const tabs = [
    { id: '7' as const, label: t('days_7') },
    { id: '30' as const, label: t('days_30') },
    { id: '90' as const, label: t('days_90') },
  ];

  // Goals are now fetched in fetchProgressData


  // Effect for Fetching Data (Unified for all periods)
  useEffect(() => {
    if (user?.id) {
      fetchProgressData();
    }
  }, [user?.id, selectedPeriod]);

  const fetchProgressData = async () => {
    if (!user) return;

    // If we have valid cache, don't set loading to true
    if (!isCacheValid) {
      setLoading(true);
    }

    try {
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

      const dailyMap: { [key: string]: DailyData } = {};

      // Initialize all days with 0
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i);
        const key = format(date, 'yyyy-MM-dd');
        dailyMap[key] = {
          date: key,
          day: format(date, days <= 7 ? 'EEE' : 'MMM d'),
          calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0
        };
      }

      // Aggregate data
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

      // Fetch Goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const newGoals = {
          daily_calories: profile.daily_calories || 2000,
          daily_protein: profile.daily_protein || 150,
          daily_carbs: profile.daily_carbs || 200,
          daily_fats: profile.daily_fats || 60,
          daily_fiber: profile.daily_fiber || 25,
          daily_sugar: profile.daily_sugar || 50,
          daily_sodium: profile.daily_sodium || 2300
        };
        setGoals(newGoals);

        // Update Cache
        if (user?.id) {
          CACHE[getCacheKey()] = {
            data: Object.values(dailyMap),
            goals: newGoals,
            timestamp: Date.now()
          };
        }
      }

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
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

  const stats = {
    totalCalories: totals.calories,
    avgCalories: averages.calories,
    daysTracked: daysWithData,
    goalTarget: goals.daily_calories,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-5 py-6 pb-24 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold px-1">{t('analytics')}</h1>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${goalAchievement >= 80 && goalAchievement <= 120 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
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

        {loading && initialLoading ? (
          <ProgressSkeleton />
        ) : (
          <>
            {/* Calories Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {t('calories_trend')}
                </h3>
                <div className={`flex items-center gap-1 text-sm ${isOverGoal ? 'text-orange-500' : 'text-green-500'}`}>
                  {isOverGoal ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(caloriesTrend)} {t('avg_day')}</span>
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
                        interval={selectedPeriod === '7' ? 0 : 2}
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
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t('macros_over_time')}
              </h3>
              <SwipeableChart dataLength={dailyData.length} itemWidth={selectedPeriod === '7' ? 14 : selectedPeriod === '30' ? 5 : 2}>
                <div className="h-48" style={{ width: `${Math.max(dailyData.length * (selectedPeriod === '7' ? 50 : selectedPeriod === '30' ? 25 : 15), 100)}px`, minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={selectedPeriod === '7' ? 0 : 2}
                      />
                      <YAxis hide />
                      <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="fats" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SwipeableChart>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">{t('protein')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">{t('carbs')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">{t('fats')}</span>
                </div>
              </div>
            </div>

            {/* Fiber, Sugar, Sodium Line Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                {t('micro_over_time')}
              </h3>
              <SwipeableChart dataLength={dailyData.length} itemWidth={selectedPeriod === '7' ? 14 : selectedPeriod === '30' ? 5 : 2}>
                <div className="h-48" style={{ width: `${Math.max(dailyData.length * (selectedPeriod === '7' ? 50 : selectedPeriod === '30' ? 25 : 15), 100)}px`, minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={selectedPeriod === '7' ? 0 : 2}
                      />
                      <YAxis hide />
                      <Line type="monotone" dataKey="fiber" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sugar" stroke="hsl(330, 81%, 60%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sodium" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SwipeableChart>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">{t('fiber')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-xs text-muted-foreground">{t('sugar')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs text-muted-foreground">{t('sodium')}</span>
                </div>
              </div>
            </div>

            {/* Macro Distribution Pie */}
            <div className="bg-card rounded-2xl p-6 shadow-soft mb-6">
              <h3 className="font-semibold mb-6">{t('macro_dist')}</h3>
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
                <div className="flex-1 space-y-3 ml-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Beef className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{t('protein')}</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.protein)}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">{t('carbs')}</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.carbs)}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{t('fats')}</span>
                    </div>
                    <span className="font-semibold">{Math.round(totals.fats)}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Nutrients Summary */}
            <div className="bg-card rounded-2xl p-6 shadow-soft mb-6">
              <h3 className="font-semibold mb-6">{t('micro_summary')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t('fiber')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Math.round(totals.fiber)}g</p>
                    <p className="text-[10px] text-muted-foreground">{t('daily_avg')}: {averages.fiber}g</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-pink-500" />
                    <span className="text-sm">{t('sugar')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Math.round(totals.sugar)}g</p>
                    <p className="text-[10px] text-muted-foreground">{t('daily_avg')}: {averages.sugar}g</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">{t('sodium')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Math.round(totals.sodium)}mg</p>
                    <p className="text-[10px] text-muted-foreground">{t('daily_avg')}: {averages.sodium}mg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <p className="text-xs text-muted-foreground mb-1">{t('days_tracked')}</p>
                <p className="text-xl font-bold">{daysWithData}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <p className="text-xs text-muted-foreground mb-1">{t('goal_target')}</p>
                <p className="text-xl font-bold">{goals.daily_calories} cal</p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <p className="text-xs text-muted-foreground mb-1">{t('daily_avg')}</p>
                <p className="text-xl font-bold">{averages.calories} cal</p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <p className="text-xs text-muted-foreground mb-1">{t('total_calories')}</p>
                <p className="text-xl font-bold">{totals.calories.toLocaleString()}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;