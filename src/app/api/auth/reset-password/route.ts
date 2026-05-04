import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { invalidateAllUserSessions } from '@/lib/auth'
import { getPasswordResetRateLimit } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/validators'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const rateResult = getPasswordResetRateLimit(`reset:${ip}`)

    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate with Zod
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    const { token, password } = parsed.data

    // Find valid reset token
    const resetEntry = await db.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!resetEntry) {
      return errorResponse('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await db.user.update({
      where: { id: resetEntry.userId },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetEntry.id },
      data: { used: true },
    })

    // Invalidate all existing sessions
    await invalidateAllUserSessions(resetEntry.userId)

    return successResponse({
      message: 'Password has been reset successfully. Please sign in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return errorResponse('Internal server error', 500)
  }
}
