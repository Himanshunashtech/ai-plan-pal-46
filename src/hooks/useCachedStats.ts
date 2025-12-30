import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDailySummary, fetchWeeklyStats, fetchNutritionTrends } from '@/store/slices/statsSlice';
import { useAuth } from '@/contexts/AuthContext';

export function useCachedStats() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const dailySummary = useAppSelector(state => state.stats?.dailySummary) || { data: null, loading: false, error: null, lastUpdated: 0 };
  const weeklyStats = useAppSelector(state => state.stats?.weeklyStats) || { data: null, loading: false, error: null, lastUpdated: 0 };
  const nutritionTrends = useAppSelector(state => state.stats?.nutritionTrends) || { data: null, loading: false, error: null, lastUpdated: 0 };

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
