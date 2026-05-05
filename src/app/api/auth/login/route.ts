import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signToken, createSession } from '@/lib/auth'
import { authRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validators'
import { successResponse, errorResponse, unauthorizedResponse, rateLimitResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const rateResult = authRateLimit(`login:${ip}`)

    if (!rateResult.success) {
      return rateLimitResponse()
    }

    const body = await request.json()

    // Validate with Zod
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    const { email, password } = parsed.data

    // Email validation (additional layer)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format')
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return unauthorizedResponse('Invalid email or password')
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return unauthorizedResponse('Invalid email or password')
    }

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    })

    // Store session
    await createSession(user.id, token)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt.toISOString(),
        },
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
