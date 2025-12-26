import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDailySummary, fetchWeeklyStats, fetchNutritionTrends } from '@/store/slices/statsSlice';
import { useAuth } from '@/contexts/AuthContext';

export function useCachedStats() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const dailySummary = useAppSelector(state => state.stats.dailySummary);
  const weeklyStats = useAppSelector(state => state.stats.weeklyStats);
  const nutritionTrends = useAppSelector(state => state.stats.nutritionTrends);

  useEffect(() => {
    if (user) {
      // Trigger fetches if needed (slice logic handles caching checks)
      dispatch(fetchDailySummary(false));
      dispatch(fetchWeeklyStats(false));
      dispatch(fetchNutritionTrends(false));
    }
  }, [user, dispatch]);

  return {
    dailySummary,
    weeklyStats,
    nutritionTrends,
    refetchDaily: () => dispatch(fetchDailySummary(true)),
    refetchWeekly: () => dispatch(fetchWeeklyStats(true)),
    refetchTrends: () => dispatch(fetchNutritionTrends(true)),
  };
}
