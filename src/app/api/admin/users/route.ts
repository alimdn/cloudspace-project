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
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    const where: Prisma.UserWhereInput = { deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
          _count: {
            select: { workspaces: true },
          },
        },
      }),
      db.user.count({ where }),
    ])

    const data = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
      workspaceCount: user._count.workspaces,
    }))

    return paginatedResponse(data, total, limit, offset)
  } catch (error) {
    console.error('[Admin Users] Error:', error)
    return errorResponse('Failed to fetch users')
  }
}
