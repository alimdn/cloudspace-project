import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { Plan } from '@prisma/client'

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events:
 * - checkout.session.completed → update user plan, create invoice
 * - customer.subscription.updated → sync plan
 * - customer.subscription.deleted → downgrade to free
 * - invoice.payment_failed → mark invoice as failed
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripe || !webhookSecret) {
      console.error('[Stripe Webhook] Stripe or webhook secret not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        request.headers.get('stripe-signature') || '',
        webhookSecret
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature'
      console.error(`[Stripe Webhook] Signature verification failed: ${message}`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed
 * Creates/updates subscription, updates user plan, creates invoice
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string
    const planId = session.metadata?.planId || 'basic'
    const userId = session.metadata?.userId
    const customerEmail = session.customer_email || session.customer_details?.email

    if (!subscriptionId) {
      console.error('[Stripe Webhook] No subscription ID in checkout session')
      return
    }

    // Retrieve the subscription to get period dates
    let periodStart = new Date()
    let periodEnd = new Date()
    try {
      if (stripe) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const subData = subscription as unknown as { current_period_start?: number; current_period_end?: number }
        periodStart = subData.current_period_start
          ? new Date(subData.current_period_start * 1000)
          : new Date(Number(subscription.billing_cycle_anchor) * 1000)
        periodEnd = subData.current_period_end
          ? new Date(subData.current_period_end * 1000)
          : (() => { const d = new Date(periodStart); d.setMonth(d.getMonth() + 1); return d })()
      }
    } catch {
      // Use defaults
      periodStart = new Date()
      periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Find user by Stripe customer ID or email
    const whereClauses: Array<{ id?: string; email?: string }> = []
    if (userId) whereClauses.push({ id: userId })
    if (customerEmail) whereClauses.push({ email: customerEmail })

    let user = whereClauses.length > 0
      ? await db.user.findFirst({ where: { OR: whereClauses } })
      : null

    // Also try finding via existing subscription
    if (!user) {
      const existingSub = await db.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      })
      if (existingSub) {
        user = await db.user.findUnique({ where: { id: existingSub.userId } })
      }
    }

    if (!user) {
      console.error(
        `[Stripe Webhook] No user found for checkout session. Customer: ${customerId}, Email: ${customerEmail}`
      )
      return
    }

    // Upsert subscription
    await db.subscription.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        plan: planId as Plan,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: planId as Plan,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })

    // Update user plan
    await db.user.update({
      where: { id: user.id },
      data: { plan: planId as Plan },
    })

    // Auto-create Invoice record in DB
    const amount = session.amount_total ? session.amount_total / 100 : 0
    await db.invoice.create({
      data: {
        userId: user.id,
        amount,
        plan: planId,
        status: 'paid',
        stripeInvoiceId: session.id,
      },
    })

    console.log(
      `[Stripe Webhook] Checkout complete for user ${user.id}, plan: ${planId}`
    )
  } catch (error) {
    console.error('[Stripe Webhook] handleCheckoutComplete error:', error)
  }
}

/**
 * Handle customer.subscription.updated
 * Syncs plan and subscription status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const stripeSubscriptionId = subscription.id
    const status = subscription.status
    const planId = subscription.metadata?.planId || 'free'

    // Find subscription in DB
    const existing = await db.subscription.findUnique({
      where: { stripeSubscriptionId },
    })

    if (!existing) {
      console.warn(
        `[Stripe Webhook] Subscription ${stripeSubscriptionId} not found in DB`
      )
      return
    }

    const subData = subscription as unknown as { current_period_start?: number; current_period_end?: number }
    const periodStart = subData.current_period_start
      ? new Date(subData.current_period_start * 1000)
      : new Date(Number(subscription.billing_cycle_anchor) * 1000)
    const periodEnd = subData.current_period_end
      ? new Date(subData.current_period_end * 1000)
      : (() => { const d = new Date(periodStart); d.setMonth(d.getMonth() + 1); return d })()

    // Update subscription
    await db.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status,
        plan: planId as Plan,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })

    // Update user plan if active
    if (status === 'active' || status === 'trialing') {
      await db.user.update({
        where: { id: existing.userId },
        data: { plan: planId as Plan },
      })
    }

    console.log(
      `[Stripe Webhook] Subscription ${stripeSubscriptionId} updated: status=${status}, plan=${planId}`
    )
  } catch (error) {
    console.error('[Stripe Webhook] handleSubscriptionUpdated error:', error)
  }
}

/**
 * Handle customer.subscription.deleted
 * Downgrades user to free plan
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const stripeSubscriptionId = subscription.id

    const existing = await db.subscription.findUnique({
      where: { stripeSubscriptionId },
    })

    if (!existing) {
      console.warn(
        `[Stripe Webhook] Deleted subscription ${stripeSubscriptionId} not found in DB`
      )
      return
    }

    // Update subscription status
    await db.subscription.update({
      where: { stripeSubscriptionId },
      data: { status: 'canceled' },
    })

    // Downgrade user to free plan
    await db.user.update({
      where: { id: existing.userId },
      data: { plan: 'free' },
    })

    console.log(
      `[Stripe Webhook] Subscription ${stripeSubscriptionId} canceled. User ${existing.userId} downgraded to free.`
    )
  } catch (error) {
    console.error('[Stripe Webhook] handleSubscriptionDeleted error:', error)
  }
}

/**
 * Handle invoice.payment_failed
 * Marks the invoice as failed in our DB
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const stripeInvoiceId = invoice.id
    const customerId = invoice.customer as string
    // Use type assertion for Stripe Invoice subscription field
    const invoiceData = invoice as unknown as { subscription?: string | { id?: string } }
    const subscriptionId = (typeof invoiceData.subscription === 'string')
      ? invoiceData.subscription
      : invoiceData.subscription?.id || null

    // Find subscription to get userId
    let userId: string | null = null

    if (subscriptionId) {
      const sub = await db.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      })
      userId = sub?.userId || null
    }

    if (!userId) {
      const sub = await db.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      })
      userId = sub?.userId || null
    }

    if (!userId) {
      console.warn(
        `[Stripe Webhook] No user found for failed invoice ${stripeInvoiceId}`
      )
      return
    }

    // Update existing invoice or create a new failed record
    const existingInvoice = await db.invoice.findFirst({
      where: { stripeInvoiceId },
    })

    const amount = invoice.amount_due ? invoice.amount_due / 100 : 0
    const planFromSub = subscriptionId
      ? (
          await db.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
            select: { plan: true },
          })
        )?.plan || 'unknown'
      : 'unknown'

    if (existingInvoice) {
      await db.invoice.update({
        where: { id: existingInvoice.id },
        data: { status: 'failed' },
      })
    } else {
      await db.invoice.create({
        data: {
          userId,
          amount,
          plan: planFromSub,
          status: 'failed',
          stripeInvoiceId,
        },
      })
    }

    console.log(
      `[Stripe Webhook] Invoice payment failed: ${stripeInvoiceId}, amount: $${amount}`
    )
  } catch (error) {
    console.error('[Stripe Webhook] handleInvoicePaymentFailed error:', error)
  }
}
