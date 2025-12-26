import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEarnedBadges, earnBadge, clearNewlyUnlockedBadge } from '@/store/slices/gamificationSlice';
import { Badge, BADGES } from '@/lib/badges';
import { useAuth } from '@/contexts/AuthContext';

export interface EarnedBadge extends Badge {
  earnedAt: string;
}

export function useBadges() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { earnedBadges, loading, newlyUnlockedBadge } = useAppSelector(state => state.gamification);

  const userId = user?.id;
  const lastFetchedUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only fetch if we have a user and haven't loaded badges yet (or if explicitly refetched via other means)
    // We check earnedBadges.length to see if we already have data. 
    // This simple check prevents re-fetching on every mount if data persists in Redux.
    if (userId && userId !== lastFetchedUserId.current && earnedBadges.length === 0) {
      lastFetchedUserId.current = userId;
      dispatch(fetchEarnedBadges(userId));
    } else if (userId && earnedBadges.length > 0) {
      // If we already have badges, mark as fetched for this user so we don't fetch again if userId flickers
      lastFetchedUserId.current = userId;
    }
  }, [userId, dispatch, earnedBadges.length]);

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

  return {
    earnedBadges,
    loading,
    hasBadge,
    earnBadge: handleEarnBadge,
    newlyUnlockedBadge,
    clearNewlyUnlockedBadge: handleClearNewlyUnlocked,
    getAllBadgesWithStatus,
    refetch: () => user && dispatch(fetchEarnedBadges(user.id)),
    badgeCount: earnedBadges.length,
    totalBadges: BADGES.length,
  };
}
