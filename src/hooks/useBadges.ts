import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, BADGES, getBadgeById } from '@/lib/badges';

export interface EarnedBadge extends Badge {
  earnedAt: string;
}

export function useBadges() {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

  const fetchEarnedBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      const badges: EarnedBadge[] = (data || []).map(ub => {
        const badge = getBadgeById(ub.badge_id);
        if (!badge) return null;
        return {
          ...badge,
          earnedAt: ub.earned_at,
        };
      }).filter(Boolean) as EarnedBadge[];

      setEarnedBadges(badges);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const hasBadge = useCallback((badgeId: string): boolean => {
    return earnedBadges.some(b => b.id === badgeId);
  }, [earnedBadges]);

  const earnBadge = useCallback(async (badgeId: string): Promise<boolean> => {
    if (!user) return false;
    if (hasBadge(badgeId)) return false;

    const badge = getBadgeById(badgeId);
    if (!badge) return false;

    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badgeId,
        });

      if (error) {
        // Unique constraint violation means already earned
        if (error.code === '23505') return false;
        throw error;
      }

      const earnedBadge: EarnedBadge = {
        ...badge,
        earnedAt: new Date().toISOString(),
      };

      setEarnedBadges(prev => [earnedBadge, ...prev]);
      setNewlyUnlockedBadge(badge);

      return true;
    } catch (error) {
      console.error('Error earning badge:', error);
      return false;
    }
  }, [user, hasBadge]);

  const clearNewlyUnlockedBadge = useCallback(() => {
    setNewlyUnlockedBadge(null);
  }, []);

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

  useEffect(() => {
    if (user) {
      fetchEarnedBadges();
    }
  }, [user, fetchEarnedBadges]);

  return {
    earnedBadges,
    loading,
    hasBadge,
    earnBadge,
    newlyUnlockedBadge,
    clearNewlyUnlockedBadge,
    getAllBadgesWithStatus,
    refetch: fetchEarnedBadges,
    badgeCount: earnedBadges.length,
    totalBadges: BADGES.length,
  };
}
