import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDailySummary, fetchWeeklyStats } from '@/store/slices/statsSlice';
import { fetchEarnedBadges, fetchUserStreak } from '@/store/slices/gamificationSlice';

/**
 * Subscribes to Supabase Realtime changes on key tables
 * and triggers Redux store refreshes automatically.
 */
export const useRealtimeSync = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('db-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_entries', filter: `user_id=eq.${user.id}` },
        () => {
          console.debug('[Realtime] food_entries changed, refreshing stats...');
          dispatch(fetchDailySummary(true));
          dispatch(fetchWeeklyStats(true));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_nutrition_logs', filter: `user_id=eq.${user.id}` },
        () => {
          console.debug('[Realtime] daily_nutrition_logs changed, refreshing stats...');
          dispatch(fetchDailySummary(true));
          dispatch(fetchWeeklyStats(true));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_streaks', filter: `user_id=eq.${user.id}` },
        () => {
          console.debug('[Realtime] user_streaks changed, refreshing...');
          dispatch(fetchUserStreak(user.id));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_badges', filter: `user_id=eq.${user.id}` },
        () => {
          console.debug('[Realtime] user_badges changed, refreshing...');
          dispatch(fetchEarnedBadges({ userId: user.id, forceRefresh: true }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        () => {
          console.debug('[Realtime] profile updated, refreshing stats...');
          dispatch(fetchDailySummary(true));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dispatch]);
};
