import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'
import { getContainerStats, getContainerDiskUsage, getContainerState, isDockerAvailable } from '@/lib/docker'

/**
 * GET /api/workspaces/[id]/stats
 *
 * Returns real-time container resource usage (CPU, RAM, Disk, Network).
 * Disk usage is now measured via `df` inside the container (real filesystem usage).
 * Also checks OOM kill status and persists usage records.
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
        diskUsedMb: 0,
        diskTotalMb: parseFloat(workspace.disk) * 1024 || 10240,
        containerAvailable: !!workspace.containerId,
        oomKilled: false,
      })
    }

    const dockerAvailable = await isDockerAvailable()

    if (dockerAvailable && workspace.containerId) {
      try {
        const stats = await getContainerStats(workspace.containerId)

        // Check OOM status
        const containerState = await getContainerState(workspace.containerId)
        const oomKilled = containerState?.oomKilled || false

        // If container was OOM killed, mark workspace as error
        if (oomKilled) {
          await db.workspace.update({
            where: { id },
            data: { status: 'error' },
          })
          console.warn(`[Stats] Workspace ${id} was OOM killed`)
        }

        // Get real disk usage
        const diskUsage = await getContainerDiskUsage(workspace.containerId)

        if (stats) {
          const ramPercent = stats.memory_limit_mb > 0
            ? Math.round((stats.memory_usage_mb / stats.memory_limit_mb) * 100)
            : 0

          const diskPercent = diskUsage
            ? diskUsage.percent
            : 0

          const response = {
            cpu: stats.cpu_percent,
            ram: ramPercent,
            disk: diskPercent,
            network: {
              in: stats.network_rx_bytes,
              out: stats.network_tx_bytes,
            },
            memoryUsageMb: stats.memory_usage_mb,
            memoryLimitMb: stats.memory_limit_mb,
            diskUsedMb: diskUsage?.used_mb || 0,
            diskTotalMb: diskUsage?.total_mb || (parseFloat(workspace.disk) * 1024) || 10240,
            containerAvailable: true,
            oomKilled,
          }

          // Persist historical record
          try {
            await db.usageRecord.create({
              data: {
                workspaceId: workspace.id,
                cpu: stats.cpu_percent,
                ram: ramPercent,
                disk: diskPercent,
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

    // Fallback: Docker not available
    return successResponse({
      cpu: 0,
      ram: 0,
      disk: 0,
      network: { in: 0, out: 0 },
      memoryUsageMb: 0,
      memoryLimitMb: parseFloat(workspace.ram) || 1024,
      diskUsedMb: 0,
      diskTotalMb: parseFloat(workspace.disk) * 1024 || 10240,
      containerAvailable: !!workspace.containerId,
      oomKilled: false,
    })
  } catch (error) {
    console.error('Workspace stats error:', error)
    return errorResponse('Failed to fetch workspace stats', 500)
  }
}
