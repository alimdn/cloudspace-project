import { getAuthUser, type JWTPayload } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Shared helper that extracts and verifies JWT from request,
 * returns the full database user record or null.
 *
 * Use this in ALL API routes instead of duplicating JWT logic.
 *
 * @example
 * ```ts
 * const user = await getDbAuthUser(request)
 * if (!user) return unauthorizedResponse()
 * ```
 */
export async function getDbAuthUser(request: Request): Promise<{
  jwt: JWTPayload
  dbUser: {
    id: string
    name: string
    email: string
    plan: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }
} | null> {
  try {
    const jwtPayload = await getAuthUser(request)
    if (!jwtPayload) return null

    const dbUser = await db.user.findUnique({
      where: { id: jwtPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    if (!dbUser || dbUser.deletedAt) return null

    return { jwt: jwtPayload, dbUser }
  } catch (error) {
    console.error('[getAuthUser] Error:', error)
    return null
  }
}
