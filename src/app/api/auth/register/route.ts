import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signToken, createSession } from '@/lib/auth'
import { authRateLimit } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/validators'
import { successResponse, errorResponse, conflictResponse, rateLimitResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const rateResult = authRateLimit(`register:${ip}`)

    if (!rateResult.success) {
      return rateLimitResponse()
    }

    const body = await request.json()

    // Validate with Zod (includes password strength)
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    const { name, email, password } = parsed.data

    // Email validation (additional layer)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format')
    }

    // Password strength validation (enforced by Zod, this is extra safety)
    if (
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password) ||
      password.length < 8
    ) {
      return errorResponse(
        'Password must be at least 8 characters with uppercase, number, and special character'
      )
    }

    // Check existing user
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existing) {
      return conflictResponse('This email is already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        plan: 'free',
      },
    })

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
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}
