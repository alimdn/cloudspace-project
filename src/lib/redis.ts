import Redis from 'ioredis'

/**
 * Redis client with graceful in-memory fallback.
 * If REDIS_URL is not configured, falls back to an in-memory Map
 * and logs a warning.
 */

interface BlacklistEntry {
  expiresAt: number
}

// In-memory fallback for token blacklist
const memoryBlacklist = new Map<string, BlacklistEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryBlacklist) {
    if (entry.expiresAt <= now) {
      memoryBlacklist.delete(key)
    }
  }
}, 5 * 60 * 1000)

let redisInstance: Redis | null = null

function initRedis(): Redis | null {
  if (redisInstance) return redisInstance

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not configured. Using in-memory fallback for token blacklist.')
    return null
  }

  try {
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000)
        return delay
      },
      lazyConnect: true,
    })

    redisInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })

    redisInstance.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })

    return redisInstance
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error)
    return null
  }
}

export const redis = initRedis()

/**
 * Add a token to the blacklist (e.g., on logout)
 * @param token - The JWT token to blacklist
 * @param ttlSeconds - Time-to-live in seconds (default: 7 days = JWT expiry)
 */
export async function addToBlacklist(token: string, ttlSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
  if (redis) {
    try {
      await redis.set(`bl:${token}`, '1', 'EX', ttlSeconds)
    } catch (error) {
      console.error('[Redis] addToBlacklist error:', error)
    }
  }

  // Always add to memory fallback as well
  memoryBlacklist.set(token, { expiresAt: Date.now() + ttlSeconds * 1000 })
}

/**
 * Check if a token is blacklisted
 * @param token - The JWT token to check
 */
export async function isBlacklisted(token: string): Promise<boolean> {
  // Check memory fallback first (fast)
  const memEntry = memoryBlacklist.get(token)
  if (memEntry) {
    if (memEntry.expiresAt > Date.now()) {
      return true
    }
    memoryBlacklist.delete(token)
  }

  // Check Redis
  if (redis) {
    try {
      const result = await redis.get(`bl:${token}`)
      return result === '1'
    } catch (error) {
      console.error('[Redis] isBlacklisted error:', error)
      return false
    }
  }

  return false
}

/**
 * Generic Redis cache get
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (!redis) return null

  try {
    return await redis.get(key)
  } catch (error) {
    console.error('[Redis] cacheGet error:', error)
    return null
  }
}

/**
 * Generic Redis cache set
 */
export async function cacheSet(key: string, value: string, ttlSeconds: number = 60): Promise<void> {
  if (!redis) return

  try {
    await redis.set(key, value, 'EX', ttlSeconds)
  } catch (error) {
    console.error('[Redis] cacheSet error:', error)
  }
}

/**
 * Generic Redis cache delete
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    console.error('[Redis] cacheDel error:', error)
  }
}
