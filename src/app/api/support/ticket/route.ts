import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { subject, message, category } = body

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return errorResponse('Subject must be at least 3 characters')
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return errorResponse('Message must be at least 10 characters')
    }

    // Create ticket in database
    const { db } = await import('@/lib/db')
    const ticket = await db.supportTicket.create({
      data: {
        userId: authUser.userId,
        subject: subject.trim(),
        message: message.trim(),
        category: typeof category === 'string' ? category : 'general',
      },
    })

    return successResponse({
      ticketId: ticket.id,
      message: 'Your support ticket has been submitted. We will respond within 24 business hours.',
    })
  } catch (error) {
    console.error('Submit ticket error:', error)
    return errorResponse('Failed to submit support ticket', 500)
  }
}
