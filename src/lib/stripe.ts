import Stripe from 'stripe'
import { logger } from '@/lib/logger'

/**
 * Stripe instance initialization
 *
 * Uses STRIPE_SECRET_KEY from environment variables.
 * Falls back to a test-mode key warning if not configured.
 */

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  logger.warn('[Stripe] STRIPE_SECRET_KEY is not configured. Stripe features will be unavailable.')
}

export const stripe = secretKey
  ? new Stripe(secretKey, {
      typescript: true,
    })
  : null

/** Plan-to-Stripe-Price-ID mapping (set via env or hardcoded for dev) */
export const PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
  business: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
}

/** Plan display names */
export const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
}

/**
 * Creates a Stripe Checkout Session for subscription purchase
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  planId: string,
  userEmail: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null

  const successUrl =
    process.env.STRIPE_SUCCESS_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`
  const cancelUrl =
    process.env.STRIPE_CANCEL_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { planId },
    subscription_data: {
      metadata: { planId },
    },
    customer_email: customerId ? undefined : userEmail,
  })
}

/**
 * Creates a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session | null> {
  if (!stripe) return null

  const returnUrl =
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Creates or retrieves a Stripe Customer for a given user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string | null> {
  if (!stripe) return null

  try {
    // Check for existing customer in our DB
    const { db: prisma } = await import('@/lib/db')
    const subscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: '' } },
    })

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    })

    // Save stripeCustomerId to database for future lookups
    const existing = await prisma.subscription.findFirst({
      where: { userId },
    })

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { stripeCustomerId: customer.id },
      })
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          plan: 'free',
          status: 'inactive',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    }

    return customer.id
  } catch (error) {
    logger.error('[Stripe] Failed to create/retrieve customer', error)
    return null
  }
}
