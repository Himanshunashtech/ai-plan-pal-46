import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import onboardingReducer from './slices/onboardingSlice';
import gamificationReducer from './slices/gamificationSlice';
import statsReducer from './slices/statsSlice';
import errorsReducer from './slices/errorsSlice';
import { toast } from 'sonner';

const REDUX_PERSIST_VERSION = 1;

// Telemetry Middleware: Logs core actions for debugging/auditing
const telemetryMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
    if (action.type?.startsWith('auth/') || action.type?.includes('fulfilled')) {
        console.debug(`[Telemetry] Action: ${action.type}`, { timestamp: Date.now() });
    }
    return next(action);
};

// Size Guard Middleware: Prevents LocalStorage overflow (approx 5MB limit)
const MAX_STATE_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB threshold
const sizeGuardMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
    const result = next(action);
    // Periodically check size on persistence-heavy actions
    if (action.type === REHYDRATE || action.type?.startsWith('stats/') || action.type?.startsWith('gamification/')) {
        try {
            const stateStr = JSON.stringify(store.getState());
            const size = stateStr.length * 2; // Rough UTF-16 estimate

            if (size > MAX_STATE_SIZE_BYTES) {
                console.warn(`[Size Guard] Redux state size (~${(size / 1024 / 1024).toFixed(2)}MB) exceeds safety threshold!`);
            }
        } catch (e) {
            // Ignore JSON stringify errors for size check
        }
    }
    return result;
};

// Rollback Middleware: Notifies user when optimistic updates fail
const rollbackMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
    if (action.type?.toLowerCase().includes('rollback')) {
        toast.error('Sync failed. Reverting local changes.', {
            description: 'We couldn\'t save your last update.',
        });
    }
    return next(action);
};

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    onboarding: onboardingReducer,
    gamification: gamificationReducer,
    stats: statsReducer,
    errors: errorsReducer,
});

const persistConfig = {
    key: 'calo-app-v1',
    version: REDUX_PERSIST_VERSION,
    storage,
    whitelist: ['ui', 'onboarding', 'stats', 'gamification'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                    'auth/setSession',
                    'auth/initialize/fulfilled'
                ],
                ignoredPaths: ['auth.session', 'auth.user'],
            },
        }).concat(telemetryMiddleware, sizeGuardMiddleware, rollbackMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof persistedReducer>;
export type AppDispatch = typeof store.dispatch;
