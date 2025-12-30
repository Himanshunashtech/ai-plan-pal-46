import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NutritionRing from '@/components/ui/NutritionRing';
import { useTranslation } from 'react-i18next';

const WaterGoal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();

    const [goal, setGoal] = useState<number>(2000); // Default to 2000ml recommendation
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalGoal, setOriginalGoal] = useState<number | null>(null);

    useEffect(() => {
        const fetchWaterGoal = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('water_intake')
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    // Only set if value exists (including 0), otherwise keep default 2000
                    if (data.water_intake !== null) {
                        setGoal(data.water_intake);
                        setOriginalGoal(data.water_intake);
                    } else {
                        // If null in DB, UI shows 2000 (recommendation), original is null
                        setOriginalGoal(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching water goal:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWaterGoal();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ water_intake: goal })
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success(t('water_goal_success'));
            navigate('/dashboard');
        } catch (error) {
            console.error('Error updating water goal:', error);
            toast.error(t('failed_to_update_goal'));
        } finally {
            setSaving(false);
        }
    };

    const handleRevert = () => {
        setGoal(originalGoal ?? 2000);
    };

    return (
        <div className="min-h-screen bg-background safe-area-top safe-area-bottom flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold">{t('edit_water_goal')}</h1>
            </div>

            <div className="flex-1 px-6 pt-4 flex flex-col items-center">
                {/* Circular Progress Card */}
                <div className="bg-card w-full rounded-3xl p-8 shadow-soft mb-8 flex items-center justify-between">
                    <div className="relative flex items-center justify-center">
                        <NutritionRing
                            value={goal} // Showing goal as full circle logic essentially
                            max={goal}
                            color="water"
                            size={80}
                            className="text-blue-500"
                        />
                        <Droplet className="absolute w-8 h-8 text-blue-500" fill="currentColor" />
                    </div>

                    <div className="flex-1 ml-6">
                        <p className="text-3xl font-bold">{goal}</p>
                        <p className="text-muted-foreground text-sm">
                            {originalGoal !== null ? `${t('previous_goal')} ${originalGoal} ml` : 'No goal set'}
                        </p>
                    </div>
                </div>

                {/* Input Section */}
                <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">
                        {t('water_goal_label')} (ml)
                    </label>
                    <div className="bg-card rounded-2xl p-1 border border-border shadow-sm">
                        <Input
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(Number(e.target.value))}
                            className="border-0 bg-transparent text-lg h-14 font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">
                        Recommended: 2000-3000ml per day
                    </p>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 pb-8 grid grid-cols-2 gap-4 mt-auto">
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 text-base"
                    onClick={handleRevert}
                >
                    {t('revert')}
                </Button>
                <Button
                    size="lg"
                    className="rounded-full h-14 text-base"
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    {saving ? t('saving') : t('done')}
                </Button>
            </div>
        </div>
    );
};

export default WaterGoal;
