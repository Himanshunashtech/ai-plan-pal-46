import { supabase } from '@/integrations/supabase/client';

// Check and award meal-related badges
export async function checkMealBadges(userId: string): Promise<string | null> {
  try {
    // Get total meal count
    const { count, error: countError } = await supabase
      .from('food_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    const mealCount = count || 0;

    // Check for meal milestones
    if (mealCount >= 500) {
      return 'the_logfather';
    } else if (mealCount >= 50) {
      return 'mission_nutrition';
    } else if (mealCount >= 5) {
      return 'forking_around';
    }

    return null;
  } catch (error) {
    console.error('Error checking meal badges:', error);
    return null;
  }
}

// Check and award water-related badges
export async function checkWaterBadge(userId: string, isFirstWaterLog: boolean): Promise<string | null> {
  if (isFirstWaterLog) {
    return 'hydrated';
  }
  
  // Could add additional water streak checking here for 'sippin' and 'aquaholic'
  return null;
}

// Check if user has logged water before
export async function hasLoggedWaterBefore(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('daily_nutrition_logs')
      .select('water_intake')
      .eq('user_id', userId)
      .gt('water_intake', 0)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking water history:', error);
    return true; // Assume they have to avoid false positives
  }
}
