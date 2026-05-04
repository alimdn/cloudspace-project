import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, invalidateAllUserSessions } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // Soft delete (set deletedAt)
    await db.user.update({
      where: { id: authUser.userId },
      data: { deletedAt: new Date() },
    })

    // Invalidate all sessions
    await invalidateAllUserSessions(authUser.userId)

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      data: { message: 'Account deleted successfully' },
    })

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Delete account error:', error)
    return errorResponse('Failed to delete account', 500)
  }
}
