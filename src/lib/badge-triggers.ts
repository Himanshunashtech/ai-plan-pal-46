import { supabase } from '@/integrations/supabase/client';
import { format, subDays, isEqual, parseISO } from 'date-fns';

// Check and award streak-related badges
export function checkStreakBadges(currentStreak: number): string | null {
  // Check for streak milestones (highest first)
  if (currentStreak >= 50) {
    return 'locked_in';
  } else if (currentStreak >= 10) {
    return 'getting_serious';
  } else if (currentStreak >= 3) {
    return 'rookie';
  }
  return null;
}

// Update user streak and return new streak value + any earned badge
export async function updateUserStreak(userId: string): Promise<{ 
  newStreak: number; 
  earnedBadgeId: string | null;
}> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Get current streak data
    const { data: streakData, error: fetchError } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_log_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let currentStreak = streakData?.current_streak || 0;
    let longestStreak = streakData?.longest_streak || 0;
    const lastLogDate = streakData?.last_log_date;

    // If already logged today, return current streak
    if (lastLogDate === today) {
      return { newStreak: currentStreak, earnedBadgeId: null };
    }

    // Calculate new streak
    if (lastLogDate === yesterday) {
      // Continue streak
      currentStreak += 1;
    } else {
      // Start new streak
      currentStreak = 1;
    }

    // Update longest streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Update or insert streak record
    if (streakData) {
      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_log_date: today,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_log_date: today,
        });

      if (insertError) throw insertError;
    }

    // Check for streak badges
    const earnedBadgeId = checkStreakBadges(currentStreak);

    return { newStreak: currentStreak, earnedBadgeId };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { newStreak: 0, earnedBadgeId: null };
  }
}

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
