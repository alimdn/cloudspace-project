import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, authRateLimit, apiRateLimit, getPasswordResetRateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('should allow requests within limit', () => {
    const result = rateLimit('user1', { maxRequests: 5, windowSeconds: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.limit).toBe(5)
  })

  it('should track remaining requests', () => {
    rateLimit('user-tracking', { maxRequests: 3, windowSeconds: 60 })
    rateLimit('user-tracking', { maxRequests: 3, windowSeconds: 60 })
    const result = rateLimit('user-tracking', { maxRequests: 3, windowSeconds: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('should reject requests over limit', () => {
    rateLimit('user-over', { maxRequests: 2, windowSeconds: 60 })
    rateLimit('user-over', { maxRequests: 2, windowSeconds: 60 })
    const result = rateLimit('user-over', { maxRequests: 2, windowSeconds: 60 })
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should use default options', () => {
    const result = rateLimit('user-defaults')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(10)
    expect(result.remaining).toBe(9)
  })

  it('should handle different identifiers independently', () => {
    const result1 = rateLimit('user-a', { maxRequests: 1, windowSeconds: 60 })
    const result2 = rateLimit('user-b', { maxRequests: 1, windowSeconds: 60 })
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })

  it('should return resetAt as a future timestamp', () => {
    const before = Date.now()
    const result = rateLimit('user-reset', { maxRequests: 5, windowSeconds: 60 })
    expect(result.resetAt).toBeGreaterThan(before)
  })
})

describe('authRateLimit', () => {
  it('should use stricter limits (5 req/min)', () => {
    const result = authRateLimit('auth-user')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(4)
  })
})

describe('apiRateLimit', () => {
  it('should use relaxed limits (100 req/min)', () => {
    const result = apiRateLimit('api-user')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(100)
    expect(result.remaining).toBe(99)
  })
})

describe('getPasswordResetRateLimit', () => {
  it('should use strict limits (3 req/15min)', () => {
    const result = getPasswordResetRateLimit('reset-user')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(3)
    expect(result.remaining).toBe(2)
  })
})
