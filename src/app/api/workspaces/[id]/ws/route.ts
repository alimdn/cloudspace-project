import { getAuthUser } from '@/lib/auth'
import { notFoundResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/api-response'
import { db } from '@/lib/db'
import { getContainerStats, getContainerDiskUsage, getContainerState, isDockerAvailable } from '@/lib/docker'

/**
 * SSE endpoint: GET /api/workspaces/[id]/ws
 *
 * Streams container stats every 3 seconds via Server-Sent Events.
 * Auto-disconnects after 5 minutes (100 * 3s).
 * Disk usage now measured via real filesystem (`df`) inside the container.
 * Checks OOM kill status each cycle.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth check ──
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const workspace = await db.workspace.findUnique({ where: { id } })
  if (!workspace) {
    return notFoundResponse('Workspace not found')
  }
  if (workspace.userId !== authUser.userId) {
    return forbiddenResponse('You do not have access to this workspace')
  }

  const MAX_EVENTS = 100 // 5 minutes at 3s intervals

  // ── Build SSE stream ──
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let count = 0

      // Send initial "connected" event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ type: 'connected', workspaceId: id })}\n\n`)
      )

      const dockerAvailable = await isDockerAvailable()

      const interval = setInterval(async () => {
        count++
        if (count >= MAX_EVENTS) {
          controller.enqueue(
            encoder.encode(`event: close\ndata: ${JSON.stringify({ type: 'close', reason: 'timeout' })}\n\n`)
          )
          clearInterval(interval)
          controller.close()
          return
        }

        try {
          let data: Record<string, unknown>

          if (dockerAvailable && workspace.containerId && workspace.status === 'running') {
            const stats = await getContainerStats(workspace.containerId)

            // Check OOM status every cycle
            const containerState = await getContainerState(workspace.containerId)
            const oomKilled = containerState?.oomKilled || false

            if (oomKilled) {
              await db.workspace.update({
                where: { id },
                data: { status: 'error' },
              })
              controller.enqueue(
                encoder.encode(`event: oom\ndata: ${JSON.stringify({ type: 'oom', message: 'Container was killed due to out of memory' })}\n\n`)
              )
            }

            // Get real disk usage every 5th cycle (~15s) to avoid overhead
            const diskUsage = count % 5 === 0
              ? await getContainerDiskUsage(workspace.containerId)
              : null

            if (stats) {
              const ramPercent = stats.memory_limit_mb > 0
                ? Math.round((stats.memory_usage_mb / stats.memory_limit_mb) * 100)
                : 0
              const diskPercent = diskUsage
                ? diskUsage.percent
                : 0

              data = {
                type: 'stats',
                cpu: stats.cpu_percent,
                ram: ramPercent,
                disk: diskPercent,
                network: { in: stats.network_rx_bytes, out: stats.network_tx_bytes },
                memoryUsageMb: stats.memory_usage_mb,
                memoryLimitMb: stats.memory_limit_mb,
                diskUsedMb: diskUsage?.used_mb || 0,
                diskTotalMb: diskUsage?.total_mb || (parseFloat(workspace.disk) * 1024) || 10240,
                containerAvailable: true,
                oomKilled,
                timestamp: Date.now(),
              }

              // Persist every 10th reading (~30s)
              if (count % 10 === 0) {
                try {
                  await db.usageRecord.create({
                    data: {
                      workspaceId: id,
                      cpu: stats.cpu_percent,
                      ram: ramPercent,
                      disk: diskPercent,
                      networkIn: stats.network_rx_bytes,
                      networkOut: stats.network_tx_bytes,
                      memoryUsageMb: stats.memory_usage_mb,
                      memoryLimitMb: stats.memory_limit_mb,
                    },
                  })
                } catch {
                  // Ignore persistence errors in SSE stream
                }
              }
            } else {
              data = {
                type: 'stats',
                cpu: 0,
                ram: 0,
                disk: 0,
                network: { in: 0, out: 0 },
                memoryUsageMb: 0,
                memoryLimitMb: parseFloat(workspace.ram) || 1024,
                diskUsedMb: 0,
                diskTotalMb: (parseFloat(workspace.disk) * 1024) || 10240,
                containerAvailable: false,
                oomKilled,
                timestamp: Date.now(),
              }
            }
          } else {
            data = {
              type: 'stats',
              cpu: 0,
              ram: 0,
              disk: 0,
              network: { in: 0, out: 0 },
              memoryUsageMb: 0,
              memoryLimitMb: parseFloat(workspace.ram) || 1024,
              diskUsedMb: 0,
              diskTotalMb: (parseFloat(workspace.disk) * 1024) || 10240,
              containerAvailable: !!workspace.containerId,
              oomKilled: false,
              timestamp: Date.now(),
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ type: 'error', message: msg })}\n\n`)
          )
        }
      }, 3000)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
