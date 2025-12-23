import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type CacheType = 'daily_summary' | 'weekly_stats' | 'user_goals' | 'nutrition_trends';

interface UseCachedStatsOptions {
  type: CacheType;
  enabled?: boolean;
  forceRefresh?: boolean;
}

interface CachedStatsResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

export function useCachedStats<T>({ type, enabled = true, forceRefresh = false }: UseCachedStatsOptions): CachedStatsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchStats = useCallback(async (refresh = false) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cached-stats`);
      url.searchParams.set('type', type);
      if (refresh) {
        url.searchParams.set('refresh', 'true');
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      setData(result.data);
      setIsCached(result.cached || false);
    } catch (err) {
      console.error('Error fetching cached stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [type, enabled]);

  useEffect(() => {
    fetchStats(forceRefresh);
  }, [fetchStats, forceRefresh]);

  const refetch = useCallback(async (refresh = true) => {
    await fetchStats(refresh);
  }, [fetchStats]);

  return { data, isLoading, error, isCached, refetch };
}

// Specific typed hooks for common use cases
export interface DailySummary {
  date: string;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  goals: {
    daily_calories?: number;
    daily_protein?: number;
    daily_carbs?: number;
    daily_fats?: number;
    daily_fiber?: number;
    daily_sugar?: number;
    daily_sodium?: number;
  };
  entryCount: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  dailyData: Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    entries: number;
  }>;
  daysLogged: number;
  avgCalories: number;
  totalEntries: number;
}

export interface NutritionTrends {
  period: string;
  trends: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  }>;
}

export function useDailySummary(enabled = true) {
  return useCachedStats<DailySummary>({ type: 'daily_summary', enabled });
}

export function useWeeklyStats(enabled = true) {
  return useCachedStats<WeeklyStats>({ type: 'weekly_stats', enabled });
}

export function useNutritionTrends(enabled = true) {
  return useCachedStats<NutritionTrends>({ type: 'nutrition_trends', enabled });
}
