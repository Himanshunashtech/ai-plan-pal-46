import { Redis, type SetCommandOptions } from '@upstash/redis';

/**
 * Upstash Redis client for the frontend.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export const redis = new Redis({
    url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://composed-ferret-13911.upstash.io',
    token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || 'AjZXAAIgcDHAXKju9qEbaHr8i0RSw01d_n6YJ_d4ydMjLq1ysyQEfA',
});

/**
 * Safe wrapper for Redis operations to prevent app crashes if credentials are missing.
 * Provides typed caching with TTL and automatic fallback logic.
 */
export const safeRedis = {
    get: async <T>(key: string): Promise<T | null> => {
        // Check if we have credentials (either from env or hardcoded fallback)
        const hasUrl = !!(import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://composed-ferret-13911.upstash.io');
        if (!hasUrl) return null;
        try {
            return await redis.get<T>(key);
        } catch (e) {
            console.error('[Redis] Get error:', e);
            return null;
        }
    },

    set: async (key: string, value: any, options?: SetCommandOptions): Promise<void> => {
        const hasUrl = !!(import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://composed-ferret-13911.upstash.io');
        if (!hasUrl) return;
        try {
            await redis.set(key, value, options);
        } catch (e: any) {
            // Ignore permission errors for read-only tokens
            if (e?.message?.includes('NOPERM')) {
                console.warn('[Redis] Read-only token detected. Cache write skipped.');
                return;
            }
            console.error('[Redis] Set error:', e);
        }
    },

    /**
     * Attempts to fetch data from cache. If not found or error, runs fallback and updates cache.
     * @param key Redis key
     * @param fallback Async function to fetch data if cache miss
     * @param ttlSeconds TTL in seconds (default 3600 / 1 hour)
     */
    fetchWithCache: async <T>(
        key: string,
        fallback: () => Promise<T>,
        ttlSeconds: number = 3600
    ): Promise<T> => {
        const cached = await safeRedis.get<T>(key);
        if (cached !== null && cached !== undefined) {
            console.debug(`[Redis] Cache HIT for key: ${key}`);
            return cached;
        }

        console.debug(`[Redis] Cache MISS for key: ${key}`);
        const freshData = await fallback();

        if (freshData !== null && freshData !== undefined) {
            // Background set to not block the main flow
            safeRedis.set(key, freshData, { ex: ttlSeconds }).catch(e =>
                console.error(`[Redis] Background set failed for ${key}`, e)
            );
        }

        return freshData;
    },

    /**
     * Invalidate a specific key or pattern
     */
    invalidate: async (key: string): Promise<void> => {
        const hasUrl = !!(import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://composed-ferret-13911.upstash.io');
        if (!hasUrl) return;
        try {
            await redis.del(key);
            console.debug(`[Redis] Invalidated key: ${key}`);
        } catch (e) {
            console.error(`[Redis] Invalidation error for ${key}:`, e);
        }
    }
};
