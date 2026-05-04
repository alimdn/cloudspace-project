// @vitest-environment node
import { describe, it, expect } from 'vitest'

// Set the JWT secret before any module imports
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-min-32-chars'

// Dynamic import cache
let authModule: typeof import('@/lib/auth') | null = null

async function getAuth() {
  if (!authModule) {
    authModule = await import('@/lib/auth')
  }
  return authModule
}

describe('JWT Auth', () => {
  it('should import auth module and export expected functions', async () => {
    const { signToken, verifyToken, getAuthUser } = await getAuth()
    expect(typeof signToken).toBe('function')
    expect(typeof verifyToken).toBe('function')
    expect(typeof getAuthUser).toBe('function')
  })

  it('should sign a token and return a non-empty string', async () => {
    const { signToken } = await getAuth()
    const token = await signToken({
      userId: 'user-123',
      email: 'test@example.com',
      plan: 'pro',
    })
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
    // JWT has 3 parts separated by dots
    expect(token.split('.')).toHaveLength(3)
  })

  it('should sign and verify a token roundtrip', async () => {
    const { signToken, verifyToken } = await getAuth()
    const payload = {
      userId: 'user-456',
      email: 'roundtrip@example.com',
      plan: 'enterprise',
    }
    const token = await signToken(payload)
    const verified = await verifyToken(token)
    expect(verified).not.toBeNull()
    expect(verified!.userId).toBe('user-456')
    expect(verified!.email).toBe('roundtrip@example.com')
    expect(verified!.plan).toBe('enterprise')
  })

  it('should return null for an invalid token', async () => {
    const { verifyToken } = await getAuth()
    const payload = await verifyToken('not-a-valid-jwt-token')
    expect(payload).toBeNull()
  })

  it('should return null for empty token', async () => {
    const { verifyToken } = await getAuth()
    const payload = await verifyToken('')
    expect(payload).toBeNull()
  })

  it('should return null when no token is provided to getAuthUser', async () => {
    const { getAuthUser } = await getAuth()
    const req = new Request('http://localhost:3000/api/test')
    const user = await getAuthUser(req)
    expect(user).toBeNull()
  })

  it('should produce different tokens for different payloads', async () => {
    const { signToken } = await getAuth()
    const token1 = await signToken({ userId: '1', email: 'a@b.com', plan: 'free' })
    const token2 = await signToken({ userId: '2', email: 'c@d.com', plan: 'pro' })
    expect(token1).not.toBe(token2)
  })
})
