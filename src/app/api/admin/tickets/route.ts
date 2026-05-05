import { requireAdmin } from '@/lib/admin'
import { errorResponse, paginatedResponse } from '@/lib/api-response'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    const validStatuses = ['open', 'in_progress', 'closed']
    const where: Prisma.SupportTicketWhereInput = {}

    if (status && validStatuses.includes(status)) {
      where.status = status
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.supportTicket.count({ where }),
    ])

    const data = tickets.map((ticket) => ({
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      status: ticket.status,
      createdAt: ticket.createdAt,
      user: ticket.user,
    }))

    return paginatedResponse(data, total, limit, offset)
  } catch (error) {
    console.error('[Admin Tickets] Error:', error)
    return errorResponse('Failed to fetch support tickets')
  }
}
