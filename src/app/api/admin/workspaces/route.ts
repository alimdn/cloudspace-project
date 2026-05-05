import { requireAdmin } from '@/lib/admin'
import { errorResponse, paginatedResponse } from '@/lib/api-response'
import { db } from '@/lib/db'
import { Prisma, WorkspaceStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    const where: Prisma.WorkspaceWhereInput = {}

    if (status && Object.values(WorkspaceStatus).includes(status as WorkspaceStatus)) {
      where.status = status as WorkspaceStatus
    }

    const [workspaces, total] = await Promise.all([
      db.workspace.findMany({
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
      db.workspace.count({ where }),
    ])

    const data = workspaces.map((workspace) => ({
      id: workspace.id,
      userId: workspace.userId,
      name: workspace.name,
      status: workspace.status,
      cpu: workspace.cpu,
      ram: workspace.ram,
      disk: workspace.disk,
      platform: workspace.platform,
      url: workspace.url,
      containerId: workspace.containerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      user: workspace.user,
    }))

    return paginatedResponse(data, total, limit, offset)
  } catch (error) {
    console.error('[Admin Workspaces] Error:', error)
    return errorResponse('Failed to fetch workspaces')
  }
}
