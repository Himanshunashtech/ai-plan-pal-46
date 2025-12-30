import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { preloadUserData } from '@/store/slices/authSlice';


const INITIAL_BACKOFF = 30 * 1000; // 30 seconds
const MAX_BACKOFF = 15 * 60 * 1000; // 15 minutes
const REFRESH_BUDGET_MS = 30 * 1000; // 30s minimum between foreground refreshes

export const useBackgroundRefresh = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    const backoffRef = useRef(INITIAL_BACKOFF);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTriggerRef = useRef(0);

    const refresh = useCallback(async (force = false) => {
        if (!user) return;

        const now = Date.now();
        if (!force && now - lastTriggerRef.current < REFRESH_BUDGET_MS) {
            console.debug('[Refresh Budget] Skipping refresh, too frequent.');
            return;
        }

        try {
            lastTriggerRef.current = now;
            await dispatch(preloadUserData()).unwrap();
            backoffRef.current = INITIAL_BACKOFF;
        } catch (error) {
            backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        }

        // Schedule next periodic refresh
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => refresh(true), backoffRef.current);
    }, [dispatch, user]);

    useEffect(() => {
        if (user) {
            refresh();
        }

        // 1. Web Visibility
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                refresh();
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [user, refresh]);
};
