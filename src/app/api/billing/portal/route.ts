import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { stripe, createPortalSession, getOrCreateCustomer } from '@/lib/stripe'
import { db } from '@/lib/db'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing payment methods and subscriptions
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    if (!stripe) {
      return errorResponse('Stripe is not configured. Please set STRIPE_SECRET_KEY.')
    }

    // Find or create Stripe customer
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return unauthorizedResponse('User not found')
    }

    const customerId = await getOrCreateCustomer(user.id, user.email, user.name)
    if (!customerId) {
      return errorResponse('Failed to create or retrieve Stripe customer', 500)
    }

    // Create portal session
    const session = await createPortalSession(customerId)
    if (!session) {
      return errorResponse('Failed to create portal session', 500)
    }

    return successResponse({ url: session.url })
  } catch (error) {
    console.error('[Billing Portal] Error:', error)
    return errorResponse('Failed to create portal session', 500)
  }
}
