import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { updateWorkspaceSchema } from '@/lib/validators'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import {
  startContainer,
  stopContainer,
  restartContainer,
  updateContainerLimits,
  removeContainer,
  isDockerAvailable,
} from '@/lib/docker'

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

    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }

    // Ownership verification
    if (workspace.userId !== authUser.userId) {
      return forbiddenResponse('You do not have access to this workspace')
    }

    return successResponse(workspace)
  } catch (error) {
    console.error('Fetch workspace error:', error)
    return errorResponse('Failed to fetch workspace', 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    // Zod validation
    const parsed = updateWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    // Check ownership
    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }

    if (workspace.userId !== authUser.userId) {
      return forbiddenResponse('You do not have access to this workspace')
    }

    const { status, cpu, ram, disk } = parsed.data

    // ── Docker status operations ──
    if (status && workspace.containerId) {
      const dockerAvailable = await isDockerAvailable()
      if (dockerAvailable) {
        try {
          switch (status) {
            case 'running': {
              const started = await startContainer(workspace.containerId)
              if (!started) {
                console.warn(`[Workspace] Failed to start container ${workspace.containerId.slice(0, 12)}`)
              }
              break
            }
            case 'stopped': {
              const stopped = await stopContainer(workspace.containerId)
              if (!stopped) {
                console.warn(`[Workspace] Failed to stop container ${workspace.containerId.slice(0, 12)}`)
              }
              break
            }
            case 'creating': {
              // "creating" status means restart
              const restarted = await restartContainer(workspace.containerId, 5)
              if (restarted) {
                // After restart succeeds, update to running
                await db.workspace.update({
                  where: { id },
                  data: { status: 'running' },
                })
                const updated = await db.workspace.findUnique({ where: { id } })
                return successResponse(updated)
              } else {
                await db.workspace.update({
                  where: { id },
                  data: { status: 'error' },
                })
                const updated = await db.workspace.findUnique({ where: { id } })
                return successResponse(updated)
              }
            }
          }
        } catch (dockerError) {
          const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
          console.error(`[Workspace] Docker error during status change:`, msg)
        }
      } else {
        // Docker not available — simulate status changes for dev
        console.warn(`[Workspace] Docker not available, simulating status change to ${status}`)
      }
    }

    // ── Resource limit updates (item #82) ──
    const resourcesChanged =
      (cpu && cpu !== workspace.cpu) ||
      (ram && ram !== workspace.ram) ||
      (disk && disk !== workspace.disk)

    if (resourcesChanged && workspace.containerId) {
      const dockerAvailable = await isDockerAvailable()
      if (dockerAvailable && (cpu || ram)) {
        try {
          const updated = await updateContainerLimits(
            workspace.containerId,
            cpu || workspace.cpu,
            ram || workspace.ram
          )
          if (updated) {
            console.log(
              `[Workspace] Updated container limits: CPU=${cpu || workspace.cpu}, RAM=${ram || workspace.ram}MB`
            )
          } else {
            console.warn(`[Workspace] Failed to update container limits for ${workspace.containerId.slice(0, 12)}`)
          }
        } catch (dockerError) {
          const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
          console.error(`[Workspace] Docker error during resource update:`, msg)
        }
      }
    }

    // ── Persist DB update ──
    const updated = await db.workspace.update({
      where: { id },
      data: parsed.data,
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update workspace error:', error)
    return errorResponse('Failed to update workspace', 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Check ownership
    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return notFoundResponse('Workspace not found')
    }

    if (workspace.userId !== authUser.userId) {
      return forbiddenResponse('You do not have access to this workspace')
    }

    // ── Remove Docker container if it exists ──
    if (workspace.containerId) {
      const dockerAvailable = await isDockerAvailable()
      if (dockerAvailable) {
        try {
          const removed = await removeContainer(workspace.containerId)
          if (removed) {
            console.log(`[Workspace] Container ${workspace.containerId.slice(0, 12)} removed for workspace ${id}`)
          } else {
            console.warn(`[Workspace] Failed to remove container ${workspace.containerId.slice(0, 12)}`)
          }
        } catch (dockerError) {
          const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
          console.error(`[Workspace] Docker error during delete:`, msg)
          // Continue with DB deletion even if Docker removal fails
        }
      }
    }

    // Clean up usage records and delete workspace
    await db.usageRecord.deleteMany({ where: { workspaceId: id } })
    await db.workspace.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Delete workspace error:', error)
    return errorResponse('Failed to delete workspace', 500)
  }
}
