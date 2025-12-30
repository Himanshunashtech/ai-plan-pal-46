import { createSlice, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { Badge, BADGES, getBadgeById } from '@/lib/badges';
import { sendBadgeNotification } from '@/lib/badge-triggers';
import { RootState } from '../index';
import { CacheMeta } from './statsSlice';
import { safeRedis } from '@/lib/redis';

export interface EarnedBadge extends Badge {
    earnedAt: string;
}

const badgeAdapter = createEntityAdapter<EarnedBadge>({
    sortComparer: (a, b) => b.earnedAt.localeCompare(a.earnedAt),
});

export interface UserStreak {
    current_streak: number;
    longest_streak: number;
    last_log_date: string | null;
}

interface GamificationState {
    entities: ReturnType<typeof badgeAdapter.getInitialState>;
    streak: UserStreak;
    loading: boolean;
    error: string | null;
    newlyUnlockedBadge: Badge | null;
    meta: CacheMeta;
}

const DEFAULT_CACHE_META: CacheMeta = {
    lastUpdated: 0,
    ttl: 10 * 60 * 1000, // 10 minutes for badges
    trustStatus: 'empty'
};

const DEFAULT_STREAK: UserStreak = {
    current_streak: 0,
    longest_streak: 0,
    last_log_date: null,
};

const initialState: GamificationState = {
    entities: badgeAdapter.getInitialState(),
    streak: DEFAULT_STREAK,
    loading: false,
    error: null,
    newlyUnlockedBadge: null,
    meta: DEFAULT_CACHE_META,
};

export const fetchEarnedBadges = createAsyncThunk(
    'gamification/fetchEarnedBadges',
    async ({ userId, forceRefresh = false }: { userId: string; forceRefresh?: boolean }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;

        // SWR Check
        const now = Date.now();
        const meta = state.gamification.meta || DEFAULT_CACHE_META;
        const isExpired = now - meta.lastUpdated > meta.ttl;
        if (!isExpired && meta.trustStatus !== 'empty' && !forceRefresh) {
            return rejectWithValue('Cached');
        }

        // Ensure session is ready
        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

        const cacheKey = `badges:${userId}`;

        return await safeRedis.fetchWithCache(
            cacheKey,
            async () => {
                const { data, error } = await supabase
                    .from('user_badges')
                    .select('*')
                    .eq('user_id', userId)
                    .order('earned_at', { ascending: false });

                if (error) throw error;

                const transformedBadges = (data || []).map(ub => {
                    const trimmedId = ub.badge_id.trim();
                    const badge = getBadgeById(trimmedId);
                    if (!badge) {
                        console.warn(`[Gamification] Unknown badge ID in DB: "${trimmedId}"`);
                        return null;
                    }
                    return {
                        ...badge,
                        earnedAt: ub.earned_at,
                    };
                }).filter(Boolean) as EarnedBadge[];

                console.debug(`[Gamification] Fetched ${transformedBadges.length} badges from Supabase for user ${userId}`);
                return transformedBadges;
            },
            600 // 10 minutes TTL matching Redux meta
        );
    }
);

export const fetchUserStreak = createAsyncThunk(
    'gamification/fetchUserStreak',
    async (userId: string, { rejectWithValue }) => {
        try {
            // Ensure session is ready
            const session = await supabase.auth.getSession();
            if (!session.data.session) throw new Error('Not authenticated');

            const cacheKey = `streak:${userId}`;

            return await safeRedis.fetchWithCache(
                cacheKey,
                async () => {
                    const { data, error } = await supabase
                        .from('user_streaks')
                        .select('current_streak, longest_streak, last_log_date')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (error) throw error;

                    if (data) {
                        return {
                            current_streak: data.current_streak,
                            longest_streak: data.longest_streak,
                            last_log_date: data.last_log_date,
                        } as UserStreak;
                    } else {
                        // Create DB row in background if it doesn't exist
                        const defaultStreak = { user_id: userId, current_streak: 0, longest_streak: 0 };
                        await supabase
                            .from('user_streaks')
                            .upsert(defaultStreak, { onConflict: 'user_id' });

                        return DEFAULT_STREAK;
                    }
                },
                3600 // 1 hour TTL for streak
            );
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch streak');
        }
    }
);

export const earnBadge = createAsyncThunk(
    'gamification/earnBadge',
    async ({ userId, badgeId }: { userId: string; badgeId: string }, { getState }) => {
        const state = getState() as RootState;
        const alreadyEarned = !!state.gamification.entities.entities[badgeId];
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

        // Invalidate Redis cache
        await safeRedis.invalidate(`badges:${userId}`);

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
        resetGamification: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEarnedBadges.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEarnedBadges.fulfilled, (state, action) => {
                state.loading = false;

                if (!state.meta) state.meta = { ...DEFAULT_CACHE_META };
                state.meta.lastUpdated = Date.now();
                state.meta.trustStatus = 'trusted';
                badgeAdapter.setAll(state.entities, action.payload);
                console.debug('[Gamification] setAll called with', action.payload.length, 'badges');
            })
            .addCase(fetchEarnedBadges.rejected, (state, action) => {
                state.loading = false;
                if (action.payload === 'Cached') {
                    return;
                }
                state.error = (action.payload as string) || action.error.message || 'Failed to fetch badges';
                console.error('[Gamification] fetchEarnedBadges failed:', state.error);
            })
            .addCase(fetchUserStreak.fulfilled, (state, action) => {
                state.streak = action.payload;
            })
            .addCase(earnBadge.fulfilled, (state, action) => {
                if (action.payload) {
                    badgeAdapter.addOne(state.entities, action.payload.badge);
                    state.newlyUnlockedBadge = action.payload.originalBadge;

                    if (!state.meta) state.meta = { ...DEFAULT_CACHE_META };
                    state.meta.trustStatus = 'stale'; // Mark as stale until full refresh
                }
            })
            .addMatcher(
                (action) => action.type === 'auth/signOut/fulfilled',
                () => initialState
            );
    },
});

/* ================= SELECTORS ================= */

const selectGamificationState = (state: RootState) => state.gamification;

export const {
    selectAll: selectAllEarnedBadges,
    selectById: selectEarnedBadgeById,
    selectTotal: selectEarnedBadgeCount,
} = badgeAdapter.getSelectors((state: RootState) => state.gamification.entities);

export const selectNewlyUnlockedBadge = createSelector(
    [selectGamificationState],
    (gamification) => gamification.newlyUnlockedBadge
);

export const selectGamificationLoading = createSelector(
    [selectGamificationState],
    (gamification) => gamification.loading
);

export const selectGamificationTrust = createSelector(
    [selectGamificationState],
    (g) => g.meta.trustStatus
);

export const selectUserStreak = createSelector(
    [selectGamificationState],
    (g) => g.streak
);

export const { clearNewlyUnlockedBadge, resetGamification } = gamificationSlice.actions;
export default gamificationSlice.reducer;
