import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'
import { getContainerStats, isDockerAvailable } from '@/lib/docker'

/**
 * GET /api/workspaces/[id]/stats
 *
 * Returns real-time container resource usage (CPU, RAM, Disk, Network).
 * Also persists each reading as a UsageRecord for historical charts.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Fetch workspace + verify ownership
    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }
    if (workspace.userId !== authUser.userId) {
      return forbiddenResponse('You do not have access to this workspace')
    }

    // Only running workspaces have meaningful stats
    if (workspace.status !== 'running') {
      return successResponse({
        cpu: 0,
        ram: 0,
        disk: 0,
        network: { in: 0, out: 0 },
        memoryUsageMb: 0,
        memoryLimitMb: parseFloat(workspace.ram) || 1024,
        containerAvailable: !!workspace.containerId,
      })
    }

    const dockerAvailable = await isDockerAvailable()

    if (dockerAvailable && workspace.containerId) {
      try {
        const stats = await getContainerStats(workspace.containerId)

        if (stats) {
          const ramPercent = stats.memory_limit_mb > 0
            ? Math.round((stats.memory_usage_mb / stats.memory_limit_mb) * 100)
            : 0

          const response = {
            cpu: stats.cpu_percent,
            ram: ramPercent,
            disk: stats.block_write_mb > 0 ? Math.min(Math.round(stats.block_read_mb + stats.block_write_mb), 100) : 0,
            network: {
              in: stats.network_rx_bytes,
              out: stats.network_tx_bytes,
            },
            memoryUsageMb: stats.memory_usage_mb,
            memoryLimitMb: stats.memory_limit_mb,
            containerAvailable: true,
          }

          // Persist historical record
          try {
            await db.usageRecord.create({
              data: {
                workspaceId: workspace.id,
                cpu: stats.cpu_percent,
                ram: ramPercent,
                disk: response.disk,
                networkIn: stats.network_rx_bytes,
                networkOut: stats.network_tx_bytes,
                memoryUsageMb: stats.memory_usage_mb,
                memoryLimitMb: stats.memory_limit_mb,
              },
            })
          } catch (dbError) {
            console.error('[Stats] Failed to persist usage record:', dbError)
          }

          return successResponse(response)
        }
      } catch (dockerError) {
        const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
        console.error(`[Stats] Docker stats error for workspace ${id}:`, msg)
      }
    }

    // Fallback: Docker not available — return zeroed stats
    return successResponse({
      cpu: 0,
      ram: 0,
      disk: 0,
      network: { in: 0, out: 0 },
      memoryUsageMb: 0,
      memoryLimitMb: parseFloat(workspace.ram) || 1024,
      containerAvailable: !!workspace.containerId,
    })
  } catch (error) {
    console.error('Workspace stats error:', error)
    return errorResponse('Failed to fetch workspace stats', 500)
  }
}
