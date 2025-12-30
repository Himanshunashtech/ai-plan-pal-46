import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchEarnedBadges,
  earnBadge,
  clearNewlyUnlockedBadge,
  selectAllEarnedBadges,
  selectEarnedBadgeCount,
  selectGamificationLoading,
  selectNewlyUnlockedBadge
} from '@/store/slices/gamificationSlice';
import { Badge, BADGES } from '@/lib/badges';
import { useAuth } from '@/contexts/AuthContext';

export interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export function useBadges() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const earnedBadges = useAppSelector(selectAllEarnedBadges);
  const loading = useAppSelector(selectGamificationLoading);
  const newlyUnlockedBadge = useAppSelector(selectNewlyUnlockedBadge);
  const badgeCount = useAppSelector(selectEarnedBadgeCount);

  const userId = user?.id;
  const lastFetchedUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Fetch badges when userId changes
    if (userId && userId !== lastFetchedUserId.current) {
      lastFetchedUserId.current = userId;
      dispatch(fetchEarnedBadges({ userId }));
    }
  }, [userId, dispatch]);

  const hasBadge = useCallback((badgeId: string): boolean => {
    return earnedBadges.some(b => b.id === badgeId);
  }, [earnedBadges]);

  const handleEarnBadge = useCallback(async (badgeId: string): Promise<boolean> => {
    if (!user) return false;
    const resultAction = await dispatch(earnBadge({ userId: user.id, badgeId }));
    return earnBadge.fulfilled.match(resultAction) && !!resultAction.payload;
  }, [user, dispatch]);

  const handleClearNewlyUnlocked = useCallback(() => {
    dispatch(clearNewlyUnlockedBadge());
  }, [dispatch]);

  const getBadgesByCategory = useCallback((category: Badge['category']) => {
    return BADGES.filter(b => b.category === category).map(badge => {
      const earned = earnedBadges.find(eb => eb.id === badge.id);
      return {
        ...badge,
        unlocked: !!earned,
        earnedAt: earned?.earnedAt,
      };
    });
  }, [earnedBadges]);

  const getAllBadgesWithStatus = useCallback((): (Badge & { unlocked: boolean; earnedAt?: string })[] => {
    return BADGES.map(badge => {
      const earned = earnedBadges.find(eb => eb.id === badge.id);
      return {
        ...badge,
        unlocked: !!earned,
        earnedAt: earned?.earnedAt,
      };
    });
  }, [earnedBadges]);

  const error = useAppSelector(state => state.gamification.error);

  const refetch = useCallback(() => {
    if (userId) {
      dispatch(fetchEarnedBadges({ userId, forceRefresh: true }));
    }
  }, [userId, dispatch]);

  return {
    earnedBadges,
    hasBadge,
    earnBadge: handleEarnBadge,
    newlyUnlockedBadge,
    clearNewlyUnlockedBadge: handleClearNewlyUnlocked,
    badgeCount,
    totalBadges: BADGES.length,
    loading,
    error,
    getAllBadgesWithStatus,
    getBadgesByCategory,
    refetch,
  };
}
