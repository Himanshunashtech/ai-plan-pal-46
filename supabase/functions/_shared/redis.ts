import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";

/**
 * Shared Upstash Redis client for Edge Functions.
 * Environment variables must be set in Supabase dashboard.
 */
const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

export const redis = new Redis({
    url: redisUrl || "",
    token: redisToken || "",
});

export const isRedisConfigured = !!(redisUrl && redisToken);

/**
 * Cache helper for edge functions
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    if (!isRedisConfigured) return null;
    try {
        return await redis.get<T>(key);
    } catch (err) {
        console.error("Redis Get Error:", err);
        return null;
    }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    if (!isRedisConfigured) return;
    try {
        await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
    } catch (err) {
        console.error("Redis Set Error:", err);
    }
}
