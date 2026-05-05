import { NextResponse } from 'next/server'
import { getAuthUser, invalidateSession } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // Get token from header to invalidate specific session
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (token) {
      await invalidateSession(token)
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
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
    console.error('Logout error:', error)
    return errorResponse('Failed to logout', 500)
  }
}
