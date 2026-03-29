import { redis } from './redis'

/**
 * Generic caching wrapper for highly accessed, slow database queries. 
 * First checks Upstash Redis for the existing stringified data.
 * If there's a Cache Miss, executes the backend fetcher block, caches the result for [ttl] seconds, and returns it.
 * 
 * @param key Unique key for the cache bucket
 * @param fetcher Database or Heavy query function returning the data
 * @param ttl Time to live in seconds (default is 60)
 */
export async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl: number = 60): Promise<T> {
    // If the user hasn't configured UPSTASH_REDIS_REST_TOKEN yet in their .env, perfectly fallback to hitting Neon directly without crashing.
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn(`[Upstash Bypass] Missing credentials. Directly executing fetch for: ${key}`)
        return fetcher()
    }

    try {
        const cachedStart = Date.now()
        const cachedData = await redis.get<T>(key)

        if (cachedData) {
            console.log(`[Upstash ✅ HIT] ${key} - ${Date.now() - cachedStart}ms`)
            return cachedData
        }

        // Cache Miss: Execute the actual query
        const fetchStart = Date.now()
        const data = await fetcher()
        console.log(`[Upstash ❌ MISS] ${key} executing via Neon - ${Date.now() - fetchStart}ms`)

        // Save to cache asynchronously so we don't stall the request blocking to save
        redis.set(key, data, { ex: ttl }).catch((err) => {
            console.error(`[Upstash Error] Failed to write cache for ${key}:`, err)
        })

        return data
    } catch (error) {
        console.error(`[Upstash Error] Exception reading ${key}:`, error)
        // Safely fallback to the database if Redis temporarily drops connection
        return fetcher()
    }
}

/**
 * Force deletes one or more keys from the cache.
 */
export async function invalidateCache(keys: string[]) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return
    try {
        if (keys.length > 0) {
            await redis.del(...keys)
            console.log(`[Upstash 🗑️ INVALIDATED] ${keys.join(', ')}`)
        }
    } catch (error) {
        console.error(`[Upstash Error] Failed to invalidate cache keys ${keys.join(', ')}:`, error)
    }
}
