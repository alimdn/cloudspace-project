import { NextResponse } from 'next/server'
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

    // In production, this would:
    // 1. Create a ticket in the database
    // 2. Send email notification to support team
    // 3. Send confirmation email to user

    return successResponse({
      ticketId: `TK-${Date.now()}`,
      message: 'Your support ticket has been submitted. We will respond within 24 business hours.',
    })
  } catch (error) {
    console.error('Submit ticket error:', error)
    return errorResponse('Failed to submit support ticket', 500)
  }
}
