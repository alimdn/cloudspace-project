import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { stripe, PLAN_PRICES, createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe'
import { db } from '@/lib/db'
import { errorResponse, unauthorizedResponse, successResponse } from '@/lib/api-response'

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session for plan subscription
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return errorResponse('Plan ID is required')
    }

    const validPlans = ['basic', 'pro', 'business', 'enterprise']
    if (!validPlans.includes(planId)) {
      return errorResponse('Invalid plan ID')
    }

    if (planId === 'free') {
      return errorResponse('Free plan does not require checkout')
    }

    if (!stripe) {
      return errorResponse('Stripe is not configured. Please set STRIPE_SECRET_KEY.')
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return unauthorizedResponse('User not found')
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user.id, user.email, user.name)
    if (!customerId) {
      return errorResponse('Failed to create Stripe customer', 500)
    }

    // Get price ID for plan
    const priceId = PLAN_PRICES[planId]
    if (!priceId) {
      return errorResponse(`No pricing configured for ${planId} plan`, 500)
    }

    // Create checkout session
    const session = await createCheckoutSession(customerId, priceId, planId, user.email)
    if (!session) {
      return errorResponse('Failed to create checkout session', 500)
    }

    return successResponse({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('[Checkout] Error:', error)
    return errorResponse('Failed to initiate checkout', 500)
  }
}
