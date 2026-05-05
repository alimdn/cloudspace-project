import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { isAdminEmail } from '@/lib/admin'

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    })

    if (!user) {
      return unauthorizedResponse('User not found')
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: isAdminEmail(user.email),
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return errorResponse('Failed to verify session', 500)
  }
}
