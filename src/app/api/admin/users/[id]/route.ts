import { requireAdmin } from '@/lib/admin'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-response'
import { db } from '@/lib/db'
import { Plan } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { id } = await params
    const body = await request.json()
    const { plan, deletedAt } = body

    // Validate user exists
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return notFoundResponse('User not found')
    }

    // Build update payload
    const updateData: Record<string, unknown> = {}

    if (plan !== undefined) {
      if (!Object.values(Plan).includes(plan)) {
        return errorResponse(
          `Invalid plan. Must be one of: ${Object.values(Plan).join(', ')}`
        )
      }
      updateData.plan = plan
    }

    if (deletedAt !== undefined) {
      if (deletedAt === null) {
        // Soft delete
        updateData.deletedAt = new Date()
      } else if (deletedAt === 'restore') {
        // Restore soft-deleted user
        updateData.deletedAt = null
      } else {
        return errorResponse("deletedAt must be null (to delete) or 'restore'")
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update')
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
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

    return successResponse(updatedUser)
  } catch (error) {
    console.error('[Admin User Update] Error:', error)
    return errorResponse('Failed to update user')
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { id } = await params

    // Validate user exists
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return notFoundResponse('User not found')
    }

    // Hard delete - cascades to workspaces, invoices, sessions,
    // subscriptions, support tickets, etc. due to onDelete: Cascade
    await db.user.delete({ where: { id } })

    return successResponse({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('[Admin User Delete] Error:', error)
    return errorResponse('Failed to delete user')
  }
}
