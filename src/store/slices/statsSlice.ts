import { createSlice, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { RootState } from '../index';
import { pushError } from './errorsSlice';
import { safeRedis } from '@/lib/redis';

/* ================= TYPES ================= */

export interface FoodEntry {
    id: string;
    name: string;
    calories: number;
    carbs: number | null;
    protein: number | null;
    fats: number | null;
    image_url: string | null;
    meal_type: string | null;
    logged_at: string;
}

export interface CacheMeta {
    lastUpdated: number;
    ttl: number;
    trustStatus: 'trusted' | 'stale' | 'empty';
}

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
        water_intake?: number;
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

const foodAdapter = createEntityAdapter<FoodEntry>({
    sortComparer: (a, b) => b.logged_at.localeCompare(a.logged_at),
});

const DEFAULT_CACHE_META: CacheMeta = {
    lastUpdated: 0,
    ttl: 5 * 60 * 1000, // 5 minutes default
    trustStatus: 'empty'
};

interface StatsSegment<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    meta: CacheMeta;
}

interface StatsState {
    dailySummary: StatsSegment<DailySummary>;
    weeklyStats: StatsSegment<WeeklyStats>;
    nutritionTrends: StatsSegment<NutritionTrends>;
    foods: ReturnType<typeof foodAdapter.getInitialState>;
    inFlight: Record<string, boolean>;
    rollbacks: string[]; // Track IDs of entries that failed sync
}

const initialState: StatsState = {
    dailySummary: { data: null, loading: false, error: null, meta: DEFAULT_CACHE_META },
    weeklyStats: { data: null, loading: false, error: null, meta: { ...DEFAULT_CACHE_META, ttl: 15 * 60 * 1000 } }, // 15 min for weekly
    nutritionTrends: { data: null, loading: false, error: null, meta: { ...DEFAULT_CACHE_META, ttl: 30 * 60 * 1000 } }, // 30 min for trends
    foods: foodAdapter.getInitialState(),
    inFlight: {},
    rollbacks: [],
};

/* ================= THUNKS ================= */

const shouldFetch = (type: keyof Omit<StatsState, 'foods' | 'inFlight' | 'rollbacks'>, state: RootState, force: boolean) => {
    const segment = state.stats[type];
    if (state.stats.inFlight[type]) return false;
    if (force) return true;

    // Defensive meta check
    const meta = segment.meta || DEFAULT_CACHE_META;
    const now = Date.now();
    const isExpired = now - meta.lastUpdated > meta.ttl;
    return isExpired || meta.trustStatus === 'empty';
};

export const fetchDailySummary = createAsyncThunk(
    'stats/fetchDailySummary',
    async (forceRefresh: boolean = false, { getState, dispatch, rejectWithValue }) => {
        const state = getState() as RootState;
        if (!shouldFetch('dailySummary', state, forceRefresh)) {
            return rejectWithValue('Deduplicated');
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');
        const userId = session.data.session.user.id;

        const cacheKey = `stats:daily:${userId}`;

        if (forceRefresh) {
            await safeRedis.invalidate(cacheKey);
        }

        return await safeRedis.fetchWithCache(
            cacheKey,
            async () => {
                const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cached-stats`);
                url.searchParams.set('type', 'daily_summary');
                if (forceRefresh) url.searchParams.set('refresh', 'true');

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${session.data.session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch daily summary');
                const result = await response.json();
                return result.data;
            },
            300 // 5 minutes TTL
        );
    }
);

export const fetchWeeklyStats = createAsyncThunk(
    'stats/fetchWeeklyStats',
    async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        if (!shouldFetch('weeklyStats', state, forceRefresh)) {
            return rejectWithValue('Deduplicated');
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');
        const userId = session.data.session.user.id;

        const cacheKey = `stats:weekly:${userId}`;

        if (forceRefresh) {
            await safeRedis.invalidate(cacheKey);
        }

        return await safeRedis.fetchWithCache(
            cacheKey,
            async () => {
                const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cached-stats`);
                url.searchParams.set('type', 'weekly_stats');
                if (forceRefresh) url.searchParams.set('refresh', 'true');

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${session.data.session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch weekly stats');
                const result = await response.json();
                return result.data;
            },
            900 // 15 minutes TTL
        );
    }
);

export const fetchNutritionTrends = createAsyncThunk(
    'stats/fetchNutritionTrends',
    async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        if (!shouldFetch('nutritionTrends', state, forceRefresh)) {
            return rejectWithValue('Deduplicated');
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');
        const userId = session.data.session.user.id;

        const cacheKey = `stats:trends:${userId}`;

        if (forceRefresh) {
            await safeRedis.invalidate(cacheKey);
        }

        return await safeRedis.fetchWithCache(
            cacheKey,
            async () => {
                const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cached-stats`);
                url.searchParams.set('type', 'nutrition_trends');
                if (forceRefresh) url.searchParams.set('refresh', 'true');

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${session.data.session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch trends');
                const result = await response.json();
                return result.data;
            },
            1800 // 30 minutes TTL
        );
    }
);

/* ================= SLICE ================= */

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        setDailyLog: (state, action: PayloadAction<{ foods: FoodEntry[], totals?: DailySummary['totals'], goals?: DailySummary['goals'] }>) => {
            if (!state.dailySummary.data) {
                state.dailySummary.data = {
                    date: new Date().toISOString(),
                    totals: action.payload.totals || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 },
                    goals: action.payload.goals || {},
                    entryCount: action.payload.foods.length
                };
            } else {
                if (action.payload.goals) state.dailySummary.data.goals = action.payload.goals;
                if (action.payload.totals) state.dailySummary.data.totals = action.payload.totals;
            }

            foodAdapter.setAll(state.foods, action.payload.foods);
            state.dailySummary.data.entryCount = action.payload.foods.length;

            // Defensive meta check
            if (!state.dailySummary.meta) state.dailySummary.meta = { ...DEFAULT_CACHE_META };
            state.dailySummary.meta.lastUpdated = Date.now();
            state.dailySummary.meta.trustStatus = 'trusted';
        },
        addFoodEntryOptimistic: (state, action: PayloadAction<{ food: any, calories: number, protein: number, carbs: number, fats: number, imageUrl?: string }>) => {
            if (state.dailySummary.data) {
                state.dailySummary.data.totals.calories += action.payload.calories;
                state.dailySummary.data.totals.protein += action.payload.protein;
                state.dailySummary.data.totals.carbs += action.payload.carbs;
                state.dailySummary.data.totals.fats += action.payload.fats;
                state.dailySummary.data.entryCount += 1;

                const newEntry: FoodEntry = {
                    id: `temp-${Date.now()}`,
                    name: action.payload.food.name,
                    calories: action.payload.calories,
                    carbs: action.payload.carbs,
                    protein: action.payload.protein,
                    fats: action.payload.fats,
                    image_url: action.payload.imageUrl || null,
                    meal_type: action.payload.food.mealType || 'Snack',
                    logged_at: new Date().toISOString()
                };

                foodAdapter.addOne(state.foods, newEntry);
                if (!state.dailySummary.meta) state.dailySummary.meta = { ...DEFAULT_CACHE_META };
                state.dailySummary.meta.trustStatus = 'stale'; // Mark as stale until server syncs
            }
        },
        rollbackFoodEntry: (state, action: PayloadAction<{ id: string, calories: number, protein: number, carbs: number, fats: number }>) => {
            if (state.dailySummary.data) {
                state.dailySummary.data.totals.calories -= action.payload.calories;
                state.dailySummary.data.totals.protein -= action.payload.protein;
                state.dailySummary.data.totals.carbs -= action.payload.carbs;
                state.dailySummary.data.totals.fats -= action.payload.fats;
                state.dailySummary.data.entryCount -= 1;
                foodAdapter.removeOne(state.foods, action.payload.id);
                state.rollbacks.push(action.payload.id);
            }
        },
        resetStats: (state) => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        // Daily Summary
        builder.addCase(fetchDailySummary.pending, (state) => {
            state.dailySummary.loading = true;
            state.inFlight['dailySummary'] = true;
        });
        builder.addCase(fetchDailySummary.fulfilled, (state, action) => {
            state.dailySummary.loading = false;
            state.inFlight['dailySummary'] = false;

            const { entries, ...summaryData } = action.payload;
            state.dailySummary.data = summaryData;

            if (!state.dailySummary.meta) state.dailySummary.meta = { ...DEFAULT_CACHE_META };
            state.dailySummary.meta.lastUpdated = Date.now();
            state.dailySummary.meta.trustStatus = 'trusted';

            if (entries) {
                foodAdapter.setAll(state.foods, entries);
            }
        });
        builder.addCase(fetchDailySummary.rejected, (state, action) => {
            state.dailySummary.loading = false;
            state.inFlight['dailySummary'] = false;
            if (action.payload !== 'Deduplicated') {
                state.dailySummary.error = action.error.message || 'Error fetching';
                if (!state.dailySummary.meta) state.dailySummary.meta = { ...DEFAULT_CACHE_META };
                state.dailySummary.meta.trustStatus = state.dailySummary.data ? 'stale' : 'empty';
            }
        });

        // Weekly Stats
        builder.addCase(fetchWeeklyStats.pending, (state) => {
            state.weeklyStats.loading = true;
            state.inFlight['weeklyStats'] = true;
        });
        builder.addCase(fetchWeeklyStats.fulfilled, (state, action) => {
            state.weeklyStats.loading = false;
            state.inFlight['weeklyStats'] = false;
            state.weeklyStats.data = action.payload;
            if (!state.weeklyStats.meta) state.weeklyStats.meta = { ...DEFAULT_CACHE_META, ttl: 15 * 60 * 1000 };
            state.weeklyStats.meta.lastUpdated = Date.now();
            state.weeklyStats.meta.trustStatus = 'trusted';
        });
        builder.addCase(fetchWeeklyStats.rejected, (state, action) => {
            state.weeklyStats.loading = false;
            state.inFlight['weeklyStats'] = false;
            if (action.payload !== 'Deduplicated') {
                state.weeklyStats.error = action.error.message || 'Error fetching';
            }
        });

        // Nutrition Trends
        builder.addCase(fetchNutritionTrends.pending, (state) => {
            state.nutritionTrends.loading = true;
            state.inFlight['nutritionTrends'] = true;
        });
        builder.addCase(fetchNutritionTrends.fulfilled, (state, action) => {
            state.nutritionTrends.loading = false;
            state.inFlight['nutritionTrends'] = false;
            state.nutritionTrends.data = action.payload;
            if (!state.nutritionTrends.meta) state.nutritionTrends.meta = { ...DEFAULT_CACHE_META, ttl: 30 * 60 * 1000 };
            state.nutritionTrends.meta.lastUpdated = Date.now();
            state.nutritionTrends.meta.trustStatus = 'trusted';
        });
        builder.addCase(fetchNutritionTrends.rejected, (state, action) => {
            state.nutritionTrends.loading = false;
            state.inFlight['nutritionTrends'] = false;
            if (action.payload !== 'Deduplicated') {
                state.nutritionTrends.error = action.error.message || 'Error fetching';
            }
        });

        builder.addMatcher(
            (action) => action.type === 'auth/signOut/fulfilled',
            () => initialState
        );
    },
});

/* ================= SELECTORS (Stability Contract) ================= */

const selectStatsState = (state: RootState) => state.stats;

export const {
    selectAll: selectAllFoods,
    selectById: selectFoodById,
    selectIds: selectFoodIds,
} = foodAdapter.getSelectors((state: RootState) => state.stats.foods);

export const selectDailySummary = createSelector(
    [selectStatsState],
    (stats) => stats.dailySummary
);

export const selectDailySummaryTrust = createSelector(
    [selectDailySummary],
    (ds) => ds.meta.trustStatus
);

export const selectWeeklyStats = createSelector(
    [selectStatsState],
    (stats) => stats.weeklyStats
);

export const selectNutritionTrends = createSelector(
    [selectStatsState],
    (stats) => stats.nutritionTrends
);

export const { addFoodEntryOptimistic, rollbackFoodEntry, setDailyLog, resetStats } = statsSlice.actions;
export default statsSlice.reducer;
