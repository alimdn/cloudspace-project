import { requireAdmin } from '@/lib/admin'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/workspaces/[id]
 * Admin can stop/start workspaces
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { id } = await params
    const body = await request.json()
    const { action } = body

    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }

    if (action === 'stop') {
      if (workspace.containerId) {
        try {
          const Docker = (await import('dockerode')).default
          const docker = new Docker()
          const container = docker.getContainer(workspace.containerId)
          await container.stop()
        } catch {
          console.warn(`[Admin] Could not stop container ${workspace.containerId}`)
        }
      }
      const updated = await db.workspace.update({
        where: { id },
        data: { status: 'stopped' },
      })
      return successResponse(updated)
    }

    if (action === 'start') {
      if (workspace.containerId) {
        try {
          const Docker = (await import('dockerode')).default
          const docker = new Docker()
          const container = docker.getContainer(workspace.containerId)
          await container.start()
        } catch {
          console.warn(`[Admin] Could not start container ${workspace.containerId}`)
        }
      }
      const updated = await db.workspace.update({
        where: { id },
        data: { status: 'running' },
      })
      return successResponse(updated)
    }

    return errorResponse('Invalid action. Use "stop" or "start"')
  } catch (error) {
    console.error('[Admin Workspace Update] Error:', error)
    return errorResponse('Failed to update workspace')
  }
}

/**
 * DELETE /api/admin/workspaces/[id]
 * Admin can force-delete a workspace
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { response } = await requireAdmin(request)
    if (response) return response

    const { id } = await params

    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }

    if (workspace.containerId) {
      try {
        const Docker = (await import('dockerode')).default
        const docker = new Docker()
        const container = docker.getContainer(workspace.containerId)
        await container.remove({ force: true })
      } catch {
        console.warn(`[Admin] Could not remove container ${workspace.containerId}`)
      }
    }

    await db.workspace.delete({ where: { id } })
    return successResponse({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('[Admin Workspace Delete] Error:', error)
    return errorResponse('Failed to delete workspace')
  }
}
