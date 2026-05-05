import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured. Please set it in your .env file.')
  }
  return new TextEncoder().encode(secret)
}

export interface JWTPayload {
  userId: string
  email: string
  plan: string
  isAdmin?: boolean
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = getSecret()
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Check token blacklist (logout invalidation)
    try {
      const { isBlacklisted } = await import('@/lib/redis')
      const blacklisted = await isBlacklisted(token)
      if (blacklisted) {
        console.log('[Auth] Token is blacklisted')
        return null
      }
    } catch {
      // Redis not available — skip blacklist check
    }

    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(request?: Request): Promise<JWTPayload | null> {
  try {
    let token: string | undefined

    if (request) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('token')?.value
    }

    if (!token) return null

    return await verifyToken(token)
  } catch {
    return null
  }
}

// DB-dependent functions - dynamically imported to avoid Edge Runtime issues
export async function createSession(userId: string, token: string): Promise<void> {
  const { db } = await import('@/lib/db')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

export async function invalidateSession(token: string): Promise<void> {
  try {
    const { db } = await import('@/lib/db')
    await db.session.deleteMany({
      where: { token },
    })
  } catch {
    // Session may not exist, ignore
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    const { db } = await import('@/lib/db')
    await db.session.deleteMany({
      where: { userId },
    })
  } catch {
    // Ignore errors
  }
}
