import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getPasswordResetRateLimit } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/validators'
import { sendPasswordResetEmail } from '@/lib/email'
import { successResponse, errorResponse, rateLimitResponse } from '@/lib/api-response'

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email using the centralized email service
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const rateResult = getPasswordResetRateLimit(`forgot:${ip}`)

    if (!rateResult.success) {
      return rateLimitResponse()
    }

    const body = await request.json()

    // Validate with Zod
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    const { email } = parsed.data

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse({
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = bcrypt.hashSync(
      `${user.id}-${Date.now()}-${Math.random().toString(36)}`,
      10
    )

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    // Store reset token
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    // Send email via centralized email service (with professional HTML template)
    await sendPasswordResetEmail(user.email, resetToken)

    return successResponse({
      message: 'If an account with this email exists, a reset link has been sent.',
    })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return errorResponse('Internal server error', 500)
  }
}
