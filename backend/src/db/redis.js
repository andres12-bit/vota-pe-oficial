/**
 * Redis Client for VOTA.PE
 * 
 * Provides Redis connection with automatic fallback to in-memory cache
 * when Redis is not available (development/single-instance mode).
 */
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '300'); // 300 seconds = 5 minutes

let redis = null;
let useMemoryFallback = false;

// In-memory fallback cache
const memoryCache = new Map();
const memoryCacheTTL = new Map();

try {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                console.warn('[REDIS] Max retries reached. Falling back to in-memory cache.');
                useMemoryFallback = true;
                return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });

    redis.on('connect', () => {
        console.log('[REDIS] Connected to Redis server');
        useMemoryFallback = false;
    });

    redis.on('error', (err) => {
        if (!useMemoryFallback) {
            console.warn('[REDIS] Connection error, using in-memory fallback:', err.message);
            useMemoryFallback = true;
        }
    });

    // Attempt connection (non-blocking)
    redis.connect().catch(() => {
        useMemoryFallback = true;
        console.warn('[REDIS] Could not connect. Using in-memory fallback cache.');
    });
} catch (err) {
    useMemoryFallback = true;
    console.warn('[REDIS] Initialization failed. Using in-memory fallback cache.');
}

// Clean expired memory cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, expiry] of memoryCacheTTL.entries()) {
        if (expiry < now) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
        }
    }
}, 60000);

/**
 * Cache interface — works with Redis or in-memory fallback
 */
const cache = {
    /**
     * Get a cached value
     * @param {string} key 
     * @returns {Promise<string|null>}
     */
    async get(key) {
        if (!useMemoryFallback && redis) {
            try {
                return await redis.get(key);
            } catch {
                useMemoryFallback = true;
            }
        }
        // Memory fallback
        const expiry = memoryCacheTTL.get(key);
        if (expiry && expiry < Date.now()) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
            return null;
        }
        return memoryCache.get(key) || null;
    },

    /**
     * Get and parse JSON value
     * @param {string} key 
     * @returns {Promise<object|null>}
     */
    async getJSON(key) {
        const val = await this.get(key);
        if (!val) return null;
        try { return JSON.parse(val); } catch { return null; }
    },

    /**
     * Set a value with TTL
     * @param {string} key
     * @param {string} value
     * @param {number} ttl — seconds (default 300)
     */
    async set(key, value, ttl = DEFAULT_TTL) {
        if (!useMemoryFallback && redis) {
            try {
                await redis.setex(key, ttl, value);
                return;
            } catch {
                useMemoryFallback = true;
            }
        }
        // Memory fallback
        memoryCache.set(key, value);
        memoryCacheTTL.set(key, Date.now() + (ttl * 1000));
    },

    /**
     * Set JSON value with TTL
     */
    async setJSON(key, obj, ttl = DEFAULT_TTL) {
        await this.set(key, JSON.stringify(obj), ttl);
    },

    /**
     * Delete a cache key (invalidation)
     * @param {string} key
     */
    async del(key) {
        if (!useMemoryFallback && redis) {
            try {
                await redis.del(key);
                return;
            } catch {
                useMemoryFallback = true;
            }
        }
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
    },

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern — e.g. 'candidate_score:*'
     */
    async delPattern(pattern) {
        if (!useMemoryFallback && redis) {
            try {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) await redis.del(...keys);
                return;
            } catch {
                useMemoryFallback = true;
            }
        }
        // Memory fallback
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of memoryCache.keys()) {
            if (regex.test(key)) {
                memoryCache.delete(key);
                memoryCacheTTL.delete(key);
            }
        }
    },

    /**
     * Check if using Redis or memory fallback
     */
    isRedisConnected() {
        return !useMemoryFallback && redis && redis.status === 'ready';
    },

    /**
     * Get cache stats
     */
    getStats() {
        return {
            backend: this.isRedisConnected() ? 'redis' : 'memory',
            memory_keys: memoryCache.size,
        };
    }
};

module.exports = cache;
