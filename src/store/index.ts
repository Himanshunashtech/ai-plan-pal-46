import { configureStore, Middleware, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import onboardingReducer from './slices/onboardingSlice';
import gamificationReducer from './slices/gamificationSlice';
import statsReducer from './slices/statsSlice';

// Persistence Middleware for instant load
const persistenceMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
    const result = next(action);
    const state = store.getState();

    // Persist daily summary implementation (debounced in real app, simplified here)
    if (action.type?.startsWith('stats/') || action.type?.startsWith('gamification/')) {
        try {
            localStorage.setItem('redux_stats_dailySummary', JSON.stringify(state.stats.dailySummary));
            localStorage.setItem('redux_gamification_earnedBadges', JSON.stringify(state.gamification.earnedBadges));
        } catch (e) { console.error('Persistence failed', e); }
    }
    return result;
};

// Rehydrate state
const rehydrateState = () => {
    try {
        const cachedDaily = localStorage.getItem('redux_stats_dailySummary');
        const cachedBadges = localStorage.getItem('redux_gamification_earnedBadges');
        return {
            stats: cachedDaily ? { dailySummary: JSON.parse(cachedDaily) } : undefined,
            gamification: cachedBadges ? { earnedBadges: JSON.parse(cachedBadges) } : undefined
        };
    } catch { return undefined; }
};

const preloadedState = rehydrateState();

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    onboarding: onboardingReducer,
    gamification: gamificationReducer,
    stats: statsReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    // Merge preloaded state somewhat carefully (Redux Toolkit handles shallow merge at root)
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state for serialization checks
                // (Supabase objects might be non-serializable)
                ignoredActions: ['auth/setSession', 'auth/initialize/fulfilled'],
                ignoredPaths: ['auth.session', 'auth.user'],
            },
        }).concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
