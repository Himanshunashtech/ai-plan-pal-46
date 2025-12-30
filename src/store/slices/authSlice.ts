import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { RootState } from '../index';
import { fetchDailySummary, fetchWeeklyStats } from './statsSlice';
import { fetchEarnedBadges, fetchUserStreak } from './gamificationSlice';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null,
};

export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { dispatch }) => {
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Set up listener
        supabase.auth.onAuthStateChange((_event, session) => {
            dispatch(authSlice.actions.setSession(session));
        });

        return session;
    }
);

export const preloadUserData = createAsyncThunk(
    'auth/preloadData',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const userId = state.auth.user?.id;
        if (!userId) return;

        // Preload core data
        await Promise.allSettled([
            dispatch(fetchDailySummary(true)),
            dispatch(fetchWeeklyStats(true)),
            dispatch(fetchEarnedBadges({ userId, forceRefresh: true })),
            dispatch(fetchUserStreak(userId)),
        ]);
    }
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { getState }) => {
    await supabase.auth.signOut();
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<Session | null>) => {
            state.session = action.payload;
            state.user = action.payload?.user ?? null;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeAuth.pending, (state) => {
                state.loading = true;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.session = action.payload;
                state.user = action.payload?.user ?? null;
                state.loading = false;
            })
            .addCase(initializeAuth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to initialize auth';
            })
            .addCase(signOut.fulfilled, (state) => {
                state.user = null;
                state.session = null;
            });
    },
});

export const { setSession, setLoading } = authSlice.actions;
export default authSlice.reducer;
