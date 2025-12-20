import { useEffect, useState } from 'react';
import { Home, BarChart3, Scan, User, TrendingUp, TrendingDown, Flame, Beef, Wheat, Droplets, Flag, Pencil } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay, startOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import WeightCard from '@/components/progress/WeightCard';
import DayStreakCard from '@/components/progress/DayStreakCard';
import BMICard from '@/components/progress/BMICard';

interface DailyData {
  date: string;
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface UserProfile {
  current_weight: number | null;
  target_weight: number | null;
  weight_unit: string | null;
  height: number | null;
  height_unit: string | null;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
}

const Progress = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'90' | '180' | '365' | 'all'>('all');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    current_weight: 0,
    target_weight: 0,
    weight_unit: 'lb',
    height: 0,
    height_unit: 'cm',
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 200,
    daily_fats: 60
  });
  const [trackedDays, setTrackedDays] = useState<Date[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: '90' as const, label: '90 Days' },
    { id: '180' as const, label: '6 Months' },
    { id: '365' as const, label: '1 Year' },
    { id: 'all' as const, label: 'All time' },
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
      const days = selectedPeriod === 'all' ? 365 : parseInt(selectedPeriod);
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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats, current_weight, target_weight, weight_unit, height, height_unit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          current_weight: profileData.current_weight || 0,
          target_weight: profileData.target_weight || 0,
          weight_unit: profileData.weight_unit || 'lb',
          height: profileData.height || 0,
          height_unit: profileData.height_unit || 'cm',
          daily_calories: profileData.daily_calories || 2000,
          daily_protein: profileData.daily_protein || 150,
          daily_carbs: profileData.daily_carbs || 200,
          daily_fats: profileData.daily_fats || 60
        });
      }

      // Group by day
      const dailyMap: { [key: string]: DailyData } = {};
      const trackedDates: Date[] = [];
      
      // Initialize days based on period
      const displayDays = Math.min(days, 7);
      for (let i = 0; i < displayDays; i++) {
        const date = subDays(new Date(), displayDays - 1 - i);
        const key = format(date, 'yyyy-MM-dd');
        dailyMap[key] = {
          date: key,
          day: format(date, 'EEE'),
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        };
      }

      // Fill in actual data
      foods?.forEach(food => {
        const foodDate = new Date(food.logged_at);
        const key = format(foodDate, 'yyyy-MM-dd');
        
        if (!trackedDates.some(d => format(d, 'yyyy-MM-dd') === key)) {
          trackedDates.push(foodDate);
        }
        
        if (dailyMap[key]) {
          dailyMap[key].calories += food.calories || 0;
          dailyMap[key].protein += food.protein || 0;
          dailyMap[key].carbs += food.carbs || 0;
          dailyMap[key].fats += food.fats || 0;
        }
      });

      setTrackedDays(trackedDates);
      setDailyData(Object.values(dailyMap));
      
      // Calculate streak
      calculateStreak(trackedDates);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: Date[]) => {
    if (dates.length === 0) {
      setStreakDays(0);
      return;
    }

    const sortedDates = [...dates]
      .map(d => format(new Date(d), 'yyyy-MM-dd'))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sortedDates.includes(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }
    
    setStreakDays(streak);
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (!profile.current_weight || !profile.height) return 0;
    
    let weightKg = profile.current_weight;
    let heightM = profile.height / 100;
    
    if (profile.weight_unit === 'lb') {
      weightKg = profile.current_weight * 0.453592;
    }
    
    if (profile.height_unit === 'ft') {
      heightM = profile.height * 0.3048;
    }
    
    return weightKg / (heightM * heightM);
  };

  const bmi = calculateBMI();
  
  // Calculate totals
  const totals = dailyData.reduce((acc, d) => ({
    calories: acc.calories + d.calories,
    protein: acc.protein + d.protein,
    carbs: acc.carbs + d.carbs,
    fats: acc.fats + d.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  // Goal progress
  const weightProgress = profile.target_weight && profile.current_weight
    ? Math.round(((profile.target_weight - profile.current_weight) / profile.target_weight) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-5 py-6 pb-24 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Progress</h1>

        {/* Weight & Streak Cards */}
        <div className="flex gap-3 mb-6">
          <WeightCard
            currentWeight={profile.current_weight || 0}
            targetWeight={profile.target_weight || 0}
            weightUnit={profile.weight_unit || 'lb'}
          />
          <DayStreakCard
            streakDays={streakDays}
            trackedDays={trackedDays}
          />
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setSelectedPeriod(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === tab.id 
                  ? 'bg-foreground text-background' 
                  : 'bg-transparent text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
            <p className="text-muted-foreground">Loading progress...</p>
          </div>
        ) : (
          <>
            {/* Goal Progress Card */}
            <div className="bg-card rounded-2xl p-5 shadow-soft mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Goal Progress</h3>
                <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-medium">{Math.abs(weightProgress)}% of goal</span>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>

              {/* Weight Progress Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `${val}`}
                      width={40}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="calories" 
                      stroke="hsl(var(--foreground))" 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Calories Card */}
            <div className="bg-card rounded-2xl p-5 shadow-soft mb-6">
              <h3 className="font-semibold text-lg mb-1">Total calories</h3>
              <p className="text-4xl font-bold mb-4">
                {totals.calories.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">cals</span>
              </p>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      width={30}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill="hsl(var(--foreground))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Macro Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍖</span>
                  <span className="text-sm text-muted-foreground">Protein</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌾</span>
                  <span className="text-sm text-muted-foreground">Carbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🫒</span>
                  <span className="text-sm text-muted-foreground">Fats</span>
                </div>
              </div>

              {/* Motivation Message */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mt-4">
                <p className="text-green-700 dark:text-green-400 text-sm text-center">
                  Starting is the hardest part. You're ready for this!
                </p>
              </div>
            </div>

            {/* BMI Card */}
            <BMICard bmi={bmi} />
          </>
        )}
      </div>

      {/* FAB Button */}
      <button className="fixed bottom-24 right-5 w-14 h-14 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center text-2xl">
        +
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, path: '/dashboard', label: 'Home' },
            { icon: BarChart3, path: '/progress', label: 'Progress' },
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
