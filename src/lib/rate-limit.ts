interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Maximum number of requests in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
  /** Custom identifier (defaults to IP) */
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 10, windowSeconds: 60 }
): RateLimitResult {
  const { maxRequests, windowSeconds } = options
  const now = Date.now()
  const resetAt = now + windowSeconds * 1000

  const existing = store.get(identifier)

  if (!existing || existing.resetAt <= now) {
    // Create new window
    store.set(identifier, { count: 1, resetAt })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt,
      limit: maxRequests,
    }
  }

  if (existing.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      limit: maxRequests,
    }
  }

  existing.count++
  return {
    success: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
    limit: maxRequests,
  }
}

export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, { maxRequests: 5, windowSeconds: 60 })
}

export function apiRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, { maxRequests: 100, windowSeconds: 60 })
}

export function getPasswordResetRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, { maxRequests: 3, windowSeconds: 15 * 60 })
}
