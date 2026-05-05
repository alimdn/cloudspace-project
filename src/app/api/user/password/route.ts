import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required')
    }

    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters')
    }

    if (
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return errorResponse(
        'Password must contain at least one uppercase letter, one number, and one special character'
      )
    }

    // Fetch user with password
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
    })

    if (!user) {
      return unauthorizedResponse('User not found')
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return errorResponse('Current password is incorrect', 401)
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: authUser.userId },
      data: { password: hashedPassword },
    })

    // Invalidate all sessions (force re-login)
    await db.session.deleteMany({
      where: { userId: authUser.userId },
    })

    return successResponse({ message: 'Password updated successfully. Please sign in again.' })
  } catch (error) {
    console.error('Update password error:', error)
    return errorResponse('Failed to update password', 500)
  }
}
