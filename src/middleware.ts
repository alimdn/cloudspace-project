import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes that don't require JWT authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/webhooks/stripe',
]

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip public routes
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify JWT
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-plan', payload.plan)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/api/((?!auth/login|auth/register|auth/forgot-password|auth/reset-password|webhooks/stripe).*)',
  ],
}
