import { useEffect, useState } from 'react';
import { ArrowLeft, Flame, Droplet, Heart, Beef, Wheat, Droplets, Leaf, Candy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';

interface DailyLog {
    water_intake: number;
}

interface NutritionGoals {
    daily_calories: number;
    daily_protein: number;
    daily_carbs: number;
    daily_fats: number;
    daily_fiber: number;
    daily_sugar: number;
    daily_sodium: number;
    water_intake: number;
}

const DailyBreakdown = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [waterIntake, setWaterIntake] = useState(0);

    // Get data from Redux if available (populated by Dashboard)
    const dailySummary = useAppSelector(state => state.stats.dailySummary.data);
    const totals = dailySummary?.totals || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
    };

    const [goals, setGoals] = useState<NutritionGoals>({
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 200,
        daily_fats: 60,
        daily_fiber: 25,
        daily_sugar: 50,
        daily_sodium: 2300,
        water_intake: 2000,
    });

    useEffect(() => {
        if (user?.id) {
            Promise.all([fetchGoals(), fetchWaterLog()]).then(() => setLoading(false));
        }
    }, [user?.id]);

    const fetchGoals = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium, water_intake')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setGoals({
                    daily_calories: data.daily_calories || 2000,
                    daily_protein: data.daily_protein || 150,
                    daily_carbs: data.daily_carbs || 200,
                    daily_fats: data.daily_fats || 60,
                    daily_fiber: data.daily_fiber || 25,
                    daily_sugar: data.daily_sugar || 50,
                    daily_sodium: data.daily_sodium || 2300,
                    water_intake: (data as any).water_intake || 2000,
                });
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const fetchWaterLog = async () => {
        if (!user) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('daily_nutrition_logs')
                .select('water_intake')
                .eq('user_id', user.id)
                .eq('log_date', today)
                .maybeSingle();

            if (data) {
                setWaterIntake(data.water_intake || 0);
            }
        } catch (error) {
            console.error('Error fetching water log:', error);
        }
    };

    const waterOz = Math.round(waterIntake * 0.033814);
    const netCarbs = Math.max(0, totals.carbs - totals.fiber);
    const netCarbsGoal = Math.max(0, goals.daily_carbs - goals.daily_fiber);

    // Simple Health Score Calculation (reuse logic if possible, otherwise simple approx)
    // For now, mirroring the logic in ActivityCarousel loosely or just calculating based on goal adherence
    const calculateScore = () => {
        let points = 0;
        if (totals.calories > 0 && totals.calories <= goals.daily_calories + 200) points += 2;
        if (totals.protein >= goals.daily_protein * 0.8) points += 2;
        if (totals.fiber >= goals.daily_fiber * 0.8) points += 2;
        if (totals.sugar <= goals.daily_sugar) points += 2;
        if (waterIntake >= goals.water_intake) points += 2;
        return points;
    };
    const healthScore = calculateScore();

    return (
        <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom ">
            <div className="px-6 py-6 pb-24 overflow-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-secondary/50">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <h1 className="text-2xl font-bold mb-6 px-1">{t('daily_breakdown')}</h1>

                <div className="space-y-6">
                    {/* Calories Card */}
                    <div className="bg-card rounded-3xl p-6 shadow-soft">
                        <h3 className="font-semibold flex items-center gap-2 mb-6">
                            <Flame className="w-5 h-5 text-orange-500" />
                            {t('calories')}
                        </h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{Math.round(totals.calories)}</span>
                            <span className="text-muted-foreground text-lg">/{goals.daily_calories} cal</span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Beef className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-muted-foreground">Protein</span>
                                </div>
                                <span className="font-medium">{Math.round(totals.protein)}/{goals.daily_protein} grams</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wheat className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-muted-foreground">Carbs</span>
                                </div>
                                <span className="font-medium">{Math.round(totals.carbs)}/{goals.daily_carbs} grams</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Droplets className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium text-muted-foreground">Fat</span>
                                </div>
                                <span className="font-medium">{Math.round(totals.fats)}/{goals.daily_fats} grams</span>
                            </div>
                        </div>


                    </div>

                    {/* Water Card */}
                    <div className="bg-card rounded-3xl p-6 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Water</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">{waterOz}</span>
                                <span className="text-muted-foreground">/{Math.round(goals.water_intake * 0.033814)} fl oz</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                            <Droplet className="w-6 h-6 text-blue-500" fill="currentColor" />
                        </div>
                    </div>

                    {/* Health Score Card */}
                    <div className="bg-card rounded-3xl p-6 shadow-soft">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">{t('health_score')}</p>
                                <p className="text-2xl font-bold">
                                    {healthScore >= 1 ? t('evaluated') : t('not_evaluated')}
                                </p>
                            </div>
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                {/* Circle border simulation */}
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                                <div className={`absolute inset-0 rounded-full border-4 border-emerald-500 border-l-transparent border-b-transparent -rotate-45 ${healthScore === 0 ? 'hidden' : ''}`}></div>
                                <span className="text-sm font-bold">{healthScore}/10</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Leaf className="w-5 h-5 text-purple-500" />
                                    <span className="font-medium text-muted-foreground">Fiber</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{Math.round(totals.fiber)}</span>
                                    <div className={`w-2 h-2 rounded-full ${totals.fiber >= goals.daily_fiber ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wheat className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-muted-foreground">Net Carbs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{Math.round(netCarbs)}</span>
                                    <div className={`w-2 h-2 rounded-full ${netCarbs <= netCarbsGoal ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Beef className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-muted-foreground">Protein</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{Math.round(totals.protein)}</span>
                                    <div className={`w-2 h-2 rounded-full ${totals.protein >= goals.daily_protein ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className=" bottom-22 left-0 right-0 p-5 bg-gradient-to-t from-background via-background/80 to-transparent">
                <Button
                    className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-accent/20"
                    onClick={() => navigate('/nutrition-goals')}
                >
                    {t('edit_goals')}
                </Button>
            </div>
        </div>
    );
};

export default DailyBreakdown;
