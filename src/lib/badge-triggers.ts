import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

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

// Check goal achievement badges
export async function checkGoalBadges(userId: string): Promise<string[]> {
  const earnedBadges: string[] = [];
  
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get user's goals
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_calories, daily_protein, daily_carbs, daily_fats')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileError || !profile) return earnedBadges;
    
    // Get today's nutrition totals from food entries
    const { data: todayEntries, error: entriesError } = await supabase
      .from('food_entries')
      .select('calories, protein, carbs, fats')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);
    
    if (entriesError) return earnedBadges;
    
    const totals = (todayEntries || []).reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    
    const calorieGoal = profile.daily_calories || 2000;
    const proteinGoal = profile.daily_protein || 150;
    const carbsGoal = profile.daily_carbs || 200;
    const fatsGoal = profile.daily_fats || 60;
    
    // Check if hit calorie goal (within 10% tolerance)
    const calorieHit = totals.calories >= calorieGoal * 0.9 && totals.calories <= calorieGoal * 1.1;
    const proteinHit = totals.protein >= proteinGoal * 0.9;
    const carbsHit = totals.carbs >= carbsGoal * 0.9 && totals.carbs <= carbsGoal * 1.1;
    const fatsHit = totals.fats >= fatsGoal * 0.9 && totals.fats <= fatsGoal * 1.1;
    
    // Check for "macro_master" - all macros hit today
    if (calorieHit && proteinHit && carbsHit && fatsHit) {
      earnedBadges.push('macro_master');
    }
    
    // Check historical goal achievements for other badges
    const { data: goalProgress, error: progressError } = await supabase
      .from('goal_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', 'daily')
      .order('period_start', { ascending: false })
      .limit(30);
    
    if (!progressError && goalProgress) {
      // Count days where calorie goal was hit
      const calorieDaysHit = goalProgress.filter(gp => {
        const target = gp.calories_target || calorieGoal;
        const actual = gp.calories_actual || 0;
        return actual >= target * 0.9 && actual <= target * 1.1;
      }).length;
      
      // Count days where protein goal was hit
      const proteinDaysHit = goalProgress.filter(gp => {
        const target = gp.protein_target || proteinGoal;
        const actual = gp.protein_actual || 0;
        return actual >= target * 0.9;
      }).length;
      
      // Count days where all goals were hit
      const allGoalsDaysHit = goalProgress.filter(gp => {
        const calTarget = gp.calories_target || calorieGoal;
        const calActual = gp.calories_actual || 0;
        const protTarget = gp.protein_target || proteinGoal;
        const protActual = gp.protein_actual || 0;
        return calActual >= calTarget * 0.9 && calActual <= calTarget * 1.1 &&
               protActual >= protTarget * 0.9;
      }).length;
      
      // Award calorie goal badges
      if (calorieDaysHit >= 30) {
        earnedBadges.push('bullseye');
      } else if (calorieDaysHit >= 7) {
        earnedBadges.push('loyalty_iii');
      } else if (calorieDaysHit >= 1 || calorieHit) {
        earnedBadges.push('one_hit_wonder');
      }
      
      // Award protein pro badge
      if (proteinDaysHit >= 7) {
        earnedBadges.push('protein_pro');
      }
      
      // Award balanced diet badge
      if (allGoalsDaysHit >= 7) {
        earnedBadges.push('balanced_diet');
      }
    } else if (calorieHit) {
      // If no goal_progress data but hit today's calorie goal
      earnedBadges.push('one_hit_wonder');
    }
    
    return earnedBadges;
  } catch (error) {
    console.error('Error checking goal badges:', error);
    return earnedBadges;
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

// Send push notification for badge unlock
export async function sendBadgeNotification(
  userId: string, 
  badgeName: string, 
  badgeIcon: string
): Promise<void> {
  try {
    await supabase.functions.invoke('push-notifications/send', {
      body: {
        userId,
        title: '🏆 New Badge Unlocked!',
        message: `${badgeIcon} You earned the "${badgeName}" badge! Keep up the great work!`,
        data: { type: 'badge_unlock', badge: badgeName }
      }
    });
  } catch (error) {
    // Silently fail - push notifications are optional
    console.log('Push notification not sent (may not be configured):', error);
  }
}
