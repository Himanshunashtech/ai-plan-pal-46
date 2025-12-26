import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';

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
    entries: FoodEntry[];
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

interface StatsState {
    dailySummary: {
        data: DailySummary | null;
        loading: boolean;
        error: string | null;
        lastUpdated: number;
    };
    weeklyStats: {
        data: WeeklyStats | null;
        loading: boolean;
        error: string | null;
        lastUpdated: number;
    };
    nutritionTrends: {
        data: NutritionTrends | null;
        loading: boolean;
        error: string | null;
        lastUpdated: number;
    };
}

const initialState: StatsState = {
    dailySummary: { data: null, loading: false, error: null, lastUpdated: 0 },
    weeklyStats: { data: null, loading: false, error: null, lastUpdated: 0 },
    nutritionTrends: { data: null, loading: false, error: null, lastUpdated: 0 },
};

/* ================= THUNKS ================= */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchDailySummary = createAsyncThunk(
    'stats/fetchDailySummary',
    async (forceRefresh: boolean = false, { getState }) => {
        const state = getState() as any;
        const { data, lastUpdated } = state.stats.dailySummary;
        const now = Date.now();

        if (!forceRefresh && data && (now - lastUpdated < CACHE_DURATION)) {
            return { data, cached: true };
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

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
        return { data: result.data, cached: false };
    }
);

export const fetchWeeklyStats = createAsyncThunk(
    'stats/fetchWeeklyStats',
    async (forceRefresh: boolean = false, { getState }) => {
        const state = getState() as any;
        const { data, lastUpdated } = state.stats.weeklyStats;
        const now = Date.now();

        if (!forceRefresh && data && (now - lastUpdated < CACHE_DURATION)) {
            return { data, cached: true };
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

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
        return { data: result.data, cached: false };
    }
);

export const fetchNutritionTrends = createAsyncThunk(
    'stats/fetchNutritionTrends',
    async (forceRefresh: boolean = false, { getState }) => {
        const state = getState() as any;
        const { data, lastUpdated } = state.stats.nutritionTrends;
        const now = Date.now();

        if (!forceRefresh && data && (now - lastUpdated < CACHE_DURATION)) {
            return { data, cached: true };
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

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
        return { data: result.data, cached: false };
    }
);

/* ================= SLICE ================= */

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        setDailyLog: (state, action: PayloadAction<{ foods: FoodEntry[], totals?: DailySummary['totals'] }>) => {
            if (!state.dailySummary.data) {
                // Initialize if null
                state.dailySummary.data = {
                    date: new Date().toISOString(),
                    totals: action.payload.totals || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 },
                    goals: {},
                    entries: action.payload.foods,
                    entryCount: action.payload.foods.length
                };
            } else {
                // Ensure entries exists (safety check)
                if (!state.dailySummary.data.entries) {
                    state.dailySummary.data.entries = [];
                }

                // 1. Identify existing optimistic entries
                const currentTemps = state.dailySummary.data.entries.filter(e => e.id.startsWith('temp-'));

                // 2. Filter out temps that have now been confirmed (present in the new server payload)
                // Matching criteria: Same Name + Calories + Created within last 10 mins
                const now = Date.now();
                const survivingTemps = currentTemps.filter(temp => {
                    const tempTime = new Date(temp.logged_at).getTime();

                    // Cleanup: If temp is older than 5 seconds and hasn't matched yet, it might be a ghost/error or already synced
                    if (now - tempTime > 5 * 1000) return false;

                    const isConfirmed = action.payload.foods.some(real => {
                        const realTime = new Date(real.logged_at).getTime();
                        const timeDiff = Math.abs(realTime - tempTime);
                        return (
                            real.name.toLowerCase().trim() === temp.name.toLowerCase().trim() &&
                            Math.round(real.calories) === Math.round(temp.calories) &&
                            timeDiff < 10 * 60 * 1000 // 10 minutes tolerance
                        );
                    });
                    return !isConfirmed;
                });

                // 3. Merge surviving temps with new server data
                // Dashboard expects newest first. Temps are usually newest.
                state.dailySummary.data.entries = [...survivingTemps, ...action.payload.foods];

                // Recalculate entry count based on merged list
                state.dailySummary.data.entryCount = state.dailySummary.data.entries.length;

                if (action.payload.totals) {
                    state.dailySummary.data.totals = action.payload.totals;

                    // Add temp stats to the server totals, because server totals won't include temps yet
                    survivingTemps.forEach(temp => {
                        state.dailySummary.data!.totals.calories += temp.calories;
                        state.dailySummary.data!.totals.protein += temp.protein || 0;
                        state.dailySummary.data!.totals.carbs += temp.carbs || 0;
                        state.dailySummary.data!.totals.fats += temp.fats || 0;
                    });
                }
            }
            state.dailySummary.lastUpdated = Date.now();
        },
        addFoodEntryOptimistic: (state, action: PayloadAction<{ food: any, calories: number, protein: number, carbs: number, fats: number, imageUrl?: string }>) => {
            if (state.dailySummary.data) {
                // Update totals instantly
                state.dailySummary.data.totals.calories += action.payload.calories;
                state.dailySummary.data.totals.protein += action.payload.protein;
                state.dailySummary.data.totals.carbs += action.payload.carbs;
                state.dailySummary.data.totals.fats += action.payload.fats;
                state.dailySummary.data.entryCount += 1;

                // Create a temporary entry
                const newEntry: FoodEntry = {
                    id: `temp-${Date.now()}`,
                    name: action.payload.food.name,
                    calories: action.payload.calories,
                    carbs: action.payload.carbs,
                    protein: action.payload.protein,
                    fats: action.payload.fats,
                    image_url: action.payload.imageUrl || null, // Use provided image or null
                    meal_type: action.payload.food.mealType || 'Snack',
                    logged_at: new Date().toISOString()
                };

                // Add to entries list (prepend or append? Dashboard sorts descending, so usually new items are at top if desc, but logic might vary)
                // Let's prepend
                if (state.dailySummary.data.entries) {
                    state.dailySummary.data.entries = [newEntry, ...state.dailySummary.data.entries];
                } else {
                    state.dailySummary.data.entries = [newEntry];
                }
            }
        },
        rollbackFoodEntry: (state, action: PayloadAction<{ calories: number, protein: number, carbs: number, fats: number }>) => {
            if (state.dailySummary.data) {
                // Revert changes if API fails
                state.dailySummary.data.totals.calories -= action.payload.calories;
                state.dailySummary.data.totals.protein -= action.payload.protein;
                state.dailySummary.data.totals.carbs -= action.payload.carbs;
                state.dailySummary.data.totals.fats -= action.payload.fats;
                state.dailySummary.data.entryCount -= 1;

                // Remove the temp entry (simplistic removal of latest temp)
                // In a robust app we'd use a transaction ID. Here we just pop the first temp entry we find?
                // Or just remove the first entry if it looks like a temp one.
                const index = state.dailySummary.data.entries.findIndex(e => e.id.startsWith('temp-'));
                if (index !== -1) {
                    state.dailySummary.data.entries.splice(index, 1);
                }
            }
        }
    },
    extraReducers: (builder) => {
        // Daily Summary
        builder.addCase(fetchDailySummary.pending, (state) => {
            if (!state.dailySummary) state.dailySummary = { ...initialState.dailySummary };
            state.dailySummary.loading = true;
            state.dailySummary.error = null;
        });
        builder.addCase(fetchDailySummary.fulfilled, (state, action) => {
            if (!state.dailySummary) state.dailySummary = { ...initialState.dailySummary };
            state.dailySummary.loading = false;
            // Normalize data to ensure entries is always an array
            const data = action.payload.data;
            if (data && !data.entries) {
                data.entries = [];
            }
            state.dailySummary.data = data;
            if (!action.payload.cached) state.dailySummary.lastUpdated = Date.now();
        });
        builder.addCase(fetchDailySummary.rejected, (state, action) => {
            if (!state.dailySummary) state.dailySummary = { ...initialState.dailySummary };
            state.dailySummary.loading = false;
            state.dailySummary.error = action.error.message || 'Error fetching daily summary';
        });

        // Weekly Stats
        builder.addCase(fetchWeeklyStats.pending, (state) => {
            if (!state.weeklyStats) state.weeklyStats = { ...initialState.weeklyStats };
            state.weeklyStats.loading = true;
            state.weeklyStats.error = null;
        });
        builder.addCase(fetchWeeklyStats.fulfilled, (state, action) => {
            if (!state.weeklyStats) state.weeklyStats = { ...initialState.weeklyStats };
            state.weeklyStats.loading = false;
            state.weeklyStats.data = action.payload.data;
            if (!action.payload.cached) state.weeklyStats.lastUpdated = Date.now();
        });
        builder.addCase(fetchWeeklyStats.rejected, (state, action) => {
            if (!state.weeklyStats) state.weeklyStats = { ...initialState.weeklyStats };
            state.weeklyStats.loading = false;
            state.weeklyStats.error = action.error.message || 'Error fetching weekly stats';
        });

        // Nutrition Trends
        builder.addCase(fetchNutritionTrends.pending, (state) => {
            if (!state.nutritionTrends) state.nutritionTrends = { ...initialState.nutritionTrends };
            state.nutritionTrends.loading = true;
            state.nutritionTrends.error = null;
        });
        builder.addCase(fetchNutritionTrends.fulfilled, (state, action) => {
            if (!state.nutritionTrends) state.nutritionTrends = { ...initialState.nutritionTrends };
            state.nutritionTrends.loading = false;
            state.nutritionTrends.data = action.payload.data;
            if (!action.payload.cached) state.nutritionTrends.lastUpdated = Date.now();
        });
        builder.addCase(fetchNutritionTrends.rejected, (state, action) => {
            if (!state.nutritionTrends) state.nutritionTrends = { ...initialState.nutritionTrends };
            state.nutritionTrends.loading = false;
            state.nutritionTrends.error = action.error.message || 'Error fetching trends';
        });
    },
});

export const { addFoodEntryOptimistic, rollbackFoodEntry, setDailyLog } = statsSlice.actions;
export default statsSlice.reducer;
