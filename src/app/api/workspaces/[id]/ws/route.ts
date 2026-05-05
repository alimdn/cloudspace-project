import { getAuthUser } from '@/lib/auth'
import { notFoundResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/api-response'
import { db } from '@/lib/db'
import { getContainerStats, isDockerAvailable } from '@/lib/docker'

/**
 * SSE endpoint: GET /api/workspaces/[id]/ws
 *
 * Streams container stats every 3 seconds via Server-Sent Events.
 * Auto-disconnects after 5 minutes (100 * 3s).
 *
 * The client should connect with:
 *   const es = new EventSource('/api/workspaces/{id}/ws')
 *   es.onmessage = (e) => { const data = JSON.parse(e.data) }
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
            if (stats) {
              const ramPercent = stats.memory_limit_mb > 0
                ? Math.round((stats.memory_usage_mb / stats.memory_limit_mb) * 100)
                : 0
              const diskPercent = stats.block_write_mb > 0
                ? Math.min(Math.round(stats.block_read_mb + stats.block_write_mb), 100)
                : 0

              data = {
                type: 'stats',
                cpu: stats.cpu_percent,
                ram: ramPercent,
                disk: diskPercent,
                network: { in: stats.network_rx_bytes, out: stats.network_tx_bytes },
                memoryUsageMb: stats.memory_usage_mb,
                memoryLimitMb: stats.memory_limit_mb,
                containerAvailable: true,
                timestamp: Date.now(),
              }

              // Persist every 10th reading (~30s) to avoid DB bloat
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
                containerAvailable: false,
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
              containerAvailable: !!workspace.containerId,
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
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
