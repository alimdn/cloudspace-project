import { requireAdmin } from '@/lib/admin'
import { successResponse, errorResponse } from '@/lib/api-response'
import { db } from '@/lib/db'
import { Plan, WorkspaceStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const [
      totalUsers,
      usersByPlan,
      totalWorkspaces,
      workspacesByStatus,
      totalInvoices,
      revenueResult,
      totalTickets,
      ticketsByStatus,
      recentUsers,
      usageRecordsCount,
    ] = await Promise.all([
      // Total users (excluding soft-deleted)
      db.user.count({ where: { deletedAt: null } }),

      // Users by plan
      db.user.groupBy({
        by: ['plan'],
        where: { deletedAt: null },
        _count: { plan: true },
      }),

      // Total workspaces
      db.workspace.count(),

      // Workspaces by status
      db.workspace.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Total invoices
      db.invoice.count(),

      // Total revenue (sum of paid invoices)
      db.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),

      // Total support tickets
      db.supportTicket.count(),

      // Tickets by status
      db.supportTicket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent 5 users
      db.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
        },
      }),

      // Total usage records
      db.usageRecord.count(),
    ])

    // Build plan breakdown object
    const planBreakdown: Record<string, number> = {}
    for (const plan of Object.values(Plan)) {
      planBreakdown[plan] = 0
    }
    for (const item of usersByPlan) {
      planBreakdown[item.plan] = item._count.plan
    }

    // Build status breakdown object
    const statusBreakdown: Record<string, number> = {}
    for (const status of Object.values(WorkspaceStatus)) {
      statusBreakdown[status] = 0
    }
    for (const item of workspacesByStatus) {
      statusBreakdown[item.status] = item._count.status
    }

    // Build ticket status breakdown object
    const ticketStatusBreakdown: Record<string, number> = {
      open: 0,
      in_progress: 0,
      closed: 0,
    }
    for (const item of ticketsByStatus) {
      if (item.status in ticketStatusBreakdown) {
        ticketStatusBreakdown[item.status] = item._count.status
      }
    }

    return successResponse({
      users: {
        total: totalUsers,
        byPlan: planBreakdown,
        recent: recentUsers,
      },
      workspaces: {
        total: totalWorkspaces,
        byStatus: statusBreakdown,
      },
      invoices: {
        total: totalInvoices,
        totalRevenue: revenueResult._sum.amount ?? 0,
      },
      supportTickets: {
        total: totalTickets,
        byStatus: ticketStatusBreakdown,
      },
      usageRecords: {
        total: usageRecordsCount,
      },
    })
  } catch (error) {
    console.error('[Admin Stats] Error:', error)
    return errorResponse('Failed to fetch admin statistics')
  }
}
