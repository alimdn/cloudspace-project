import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

/**
 * POST /api/admin/cleanup
 *
 * Deletes old UsageRecord entries to prevent unbounded table growth.
 * By default, keeps records from the last 7 days and deletes older ones.
 *
 * Can be called via cron job or admin action.
 * Query params:
 *   - retentionDays: number of days to keep (default: 7)
 */
export async function POST(request: Request) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const retentionDays = parseInt(searchParams.get('retentionDays') || '7', 10)

    if (retentionDays < 1 || retentionDays > 90) {
      return errorResponse('retentionDays must be between 1 and 90')
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await db.usageRecord.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`[Cleanup] Deleted ${result.count} usage records older than ${retentionDays} days`)

    return successResponse({
      deleted: result.count,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return errorResponse('Failed to cleanup usage records', 500)
  }
}

/**
 * GET /api/admin/cleanup/stats
 *
 * Returns statistics about UsageRecord table size for monitoring.
 */
export async function GET(request: Request) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const totalRecords = await db.usageRecord.count()
    const oldestRecord = await db.usageRecord.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    })
    const newestRecord = await db.usageRecord.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [last7Days, last30Days, olderThan30] = await Promise.all([
      db.usageRecord.count({ where: { timestamp: { gte: sevenDaysAgo } } }),
      db.usageRecord.count({ where: { timestamp: { gte: thirtyDaysAgo, lt: sevenDaysAgo } } }),
      db.usageRecord.count({ where: { timestamp: { lt: thirtyDaysAgo } } }),
    ])

    return successResponse({
      totalRecords,
      last7Days,
      last30Days,
      olderThan30,
      oldest: oldestRecord?.timestamp || null,
      newest: newestRecord?.timestamp || null,
    })
  } catch (error) {
    console.error('Cleanup stats error:', error)
    return errorResponse('Failed to fetch cleanup stats', 500)
  }
}
