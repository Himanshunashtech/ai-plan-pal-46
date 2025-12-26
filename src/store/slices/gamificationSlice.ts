import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { Badge, BADGES, getBadgeById } from '@/lib/badges';
import { sendBadgeNotification } from '@/lib/badge-triggers';

export interface EarnedBadge extends Badge {
    earnedAt: string;
}

interface GamificationState {
    earnedBadges: EarnedBadge[];
    loading: boolean;
    newlyUnlockedBadge: Badge | null;
}

const initialState: GamificationState = {
    earnedBadges: [],
    loading: true,
    newlyUnlockedBadge: null,
};

export const fetchEarnedBadges = createAsyncThunk(
    'gamification/fetchEarnedBadges',
    async (userId: string) => {
        const { data, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(ub => {
            const badge = getBadgeById(ub.badge_id);
            if (!badge) return null;
            return {
                ...badge,
                earnedAt: ub.earned_at,
            };
        }).filter(Boolean) as EarnedBadge[];
    }
);

export const earnBadge = createAsyncThunk(
    'gamification/earnBadge',
    async ({ userId, badgeId }: { userId: string; badgeId: string }, { getState, dispatch }) => {
        // Check if already earned is handled by reducer logic or DB constraint.
        // Optimistic check:
        const state = getState() as any;
        const alreadyEarned = state.gamification.earnedBadges.some((b: EarnedBadge) => b.id === badgeId);
        if (alreadyEarned) return null;

        const badge = getBadgeById(badgeId);
        if (!badge) throw new Error('Badge not found');

        const { error } = await supabase
            .from('user_badges')
            .insert({
                user_id: userId,
                badge_id: badgeId,
            });

        if (error) {
            if (error.code === '23505') return null; // Already earned
            throw error;
        }

        // Trigger notification side effect
        sendBadgeNotification(userId, badge.name, badge.icon);

        return {
            badge: { ...badge, earnedAt: new Date().toISOString() } as EarnedBadge,
            originalBadge: badge
        };
    }
);

const gamificationSlice = createSlice({
    name: 'gamification',
    initialState,
    reducers: {
        clearNewlyUnlockedBadge: (state) => {
            state.newlyUnlockedBadge = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEarnedBadges.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchEarnedBadges.fulfilled, (state, action) => {
                state.earnedBadges = action.payload;
                state.loading = false;
            })
            .addCase(fetchEarnedBadges.rejected, (state) => {
                state.loading = false;
            })
            .addCase(earnBadge.fulfilled, (state, action) => {
                if (action.payload) {
                    state.earnedBadges.unshift(action.payload.badge);
                    state.newlyUnlockedBadge = action.payload.originalBadge;
                }
            });
    },
});

export const { clearNewlyUnlockedBadge } = gamificationSlice.actions;
export default gamificationSlice.reducer;
