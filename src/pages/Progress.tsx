import { useEffect, useState } from 'react';
import { Home, BarChart3, Scan, User, TrendingUp, TrendingDown, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface DailyData {
  date: string;
  day: string;
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

const Progress = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('7');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [goals, setGoals] = useState<UserGoals>({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 60 });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: '7' as const, label: '7 Days' },
    { id: '30' as const, label: '30 Days' },
    { id: '90' as const, label: '90 Days' },
  ];

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, selectedPeriod]);

  const fetchProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const days = parseInt(selectedPeriod);
      const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      const { data: foods, error: foodsError } = await supabase
        .from('food_entries')
        .select('calories, protein, carbs, fats, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', startDate)
        .lte('logged_at', endDate)
        .order('logged_at', { ascending: true });

      if (foodsError) throw foodsError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setGoals({
          daily_calories: profile.daily_calories || 2000,
          daily_protein: profile.daily_protein || 150,
          daily_carbs: profile.daily_carbs || 200,
          daily_fats: profile.daily_fats || 60
        });
      }

      // Group by day
      const dailyMap: { [key: string]: DailyData } = {};
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i);
        const key = format(date, 'yyyy-MM-dd');
        dailyMap[key] = {
          date: key,
          day: format(date, days <= 7 ? 'EEE' : 'MMM d'),
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        };
      }

      // Fill in actual data
      foods?.forEach(food => {
        const key = format(new Date(food.logged_at), 'yyyy-MM-dd');
        if (dailyMap[key]) {
          dailyMap[key].calories += food.calories || 0;
          dailyMap[key].protein += food.protein || 0;
          dailyMap[key].carbs += food.carbs || 0;
          dailyMap[key].fats += food.fats || 0;
        }
      });

      setDailyData(Object.values(dailyMap));
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
    fats: acc.fats + d.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const averages = {
    calories: daysWithData > 0 ? Math.round(totals.calories / daysWithData) : 0,
    protein: daysWithData > 0 ? Math.round(totals.protein / daysWithData) : 0,
    carbs: daysWithData > 0 ? Math.round(totals.carbs / daysWithData) : 0,
    fats: daysWithData > 0 ? Math.round(totals.fats / daysWithData) : 0
  };

  const goalAchievement = goals.daily_calories > 0 
    ? Math.round((averages.calories / goals.daily_calories) * 100) 
    : 0;

  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#ef4444' },
    { name: 'Carbs', value: totals.carbs, color: '#f59e0b' },
    { name: 'Fats', value: totals.fats, color: '#3b82f6' },
  ];

  const caloriesTrend = averages.calories - goals.daily_calories;
  const isOverGoal = caloriesTrend > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            goalAchievement >= 80 && goalAchievement <= 120 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
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
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === tab.id 
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
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={selectedPeriod === '7' ? 0 : 'preserveStartEnd'}
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
            </div>

            {/* Macros Line Chart */}
            <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
              <h3 className="font-semibold mb-4">Macros Over Time</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={selectedPeriod === '7' ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis hide />
                    <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fats" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
                    <span className="font-semibold">{totals.protein}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Carbs</span>
                    </div>
                    <span className="font-semibold">{totals.carbs}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Fats</span>
                    </div>
                    <span className="font-semibold">{totals.fats}g</span>
                  </div>
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

export default Progress;