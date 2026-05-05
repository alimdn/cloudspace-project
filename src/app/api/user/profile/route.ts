import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return errorResponse('Name must be at least 2 characters')
    }

    const updated = await db.user.update({
      where: { id: authUser.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    })

    return successResponse({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      plan: updated.plan,
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return errorResponse('Failed to update profile', 500)
  }
}
