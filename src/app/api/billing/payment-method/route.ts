import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

/**
 * GET /api/billing/payment-method
 * Fetches the user's default payment method from Stripe
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // Check if Stripe is configured
    if (!stripe) {
      return successResponse(null)
    }

    // Find the user's Stripe customer ID via subscription
    const subscription = await db.subscription.findFirst({
      where: { userId: authUser.userId },
      select: { stripeCustomerId: true },
    })

    if (!subscription?.stripeCustomerId) {
      return successResponse(null)
    }

    // Retrieve customer with payment methods from Stripe
    const customer = await stripe.customers.retrieve(subscription.stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (!customer || customer.deleted) {
      return successResponse(null)
    }

    // Get default payment method
    const customerData = customer as Stripe.Customer
    const defaultPaymentMethod = customerData.invoice_settings
      ?.default_payment_method as Stripe.PaymentMethod | null

    if (!defaultPaymentMethod) {
      return successResponse(null)
    }

    const card = defaultPaymentMethod.card

    // Also update or create in our DB for caching
    await db.paymentMethod.upsert({
      where: { stripePaymentMethodId: defaultPaymentMethod.id },
      create: {
        userId: authUser.userId,
        stripePaymentMethodId: defaultPaymentMethod.id,
        type: card?.brand || 'unknown',
        last4: card?.last4 || '0000',
        expMonth: card?.exp_month || 0,
        expYear: card?.exp_year || 0,
        isDefault: true,
      },
      update: {
        type: card?.brand || 'unknown',
        last4: card?.last4 || '0000',
        expMonth: card?.exp_month || 0,
        expYear: card?.exp_year || 0,
        isDefault: true,
      },
    })

    return successResponse({
      id: defaultPaymentMethod.id,
      type: card?.brand || 'unknown',
      last4: card?.last4 || '0000',
      expMonth: card?.exp_month || 0,
      expYear: card?.exp_year || 0,
      funding: card?.funding || 'unknown',
      isDefault: true,
    })
  } catch (error) {
    console.error('[Payment Method] Error:', error)
    return errorResponse('Failed to fetch payment method', 500)
  }
}
