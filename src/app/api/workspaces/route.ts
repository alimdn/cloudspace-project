import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createWorkspaceSchema } from '@/lib/validators'
import { successResponse, errorResponse, unauthorizedResponse, rateLimitResponse } from '@/lib/api-response'
import { createContainer, OS_IMAGE_MAP, isDockerAvailable, startContainer } from '@/lib/docker'

// Plan-based workspace limits
const WORKSPACE_LIMITS: Record<string, number> = {
  free: 2,
  basic: 5,
  pro: 15,
  business: 50,
  enterprise: 200,
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const workspaces = await db.workspace.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(workspaces)
  } catch (error) {
    console.error('Fetch workspaces error:', error)
    return errorResponse('Failed to fetch workspaces', 500)
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    // Zod validation
    const parsed = createWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
      return errorResponse(firstError)
    }

    const { name, platform, cpu, ram, disk } = parsed.data

    // Check workspace limit based on plan
    const currentCount = await db.workspace.count({
      where: { userId: authUser.userId },
    })

    const limit = WORKSPACE_LIMITS[authUser.plan] || WORKSPACE_LIMITS.free

    if (currentCount >= limit) {
      return errorResponse(
        `You have reached the workspace limit for your plan (${limit}). Please upgrade to create more.`,
        403
      )
    }

    // ── Create DB record first ──
    const workspace = await db.workspace.create({
      data: {
        userId: authUser.userId,
        name,
        platform: platform || 'general',
        cpu: cpu || '1',
        ram: ram || '1024',
        disk: disk || '10',
        status: 'creating',
        url: null,
      },
    })

    // ── Attempt Docker container creation ──
    const dockerAvailable = await isDockerAvailable()
    if (dockerAvailable) {
      try {
        const imageName = OS_IMAGE_MAP[platform || 'general'] || OS_IMAGE_MAP.general
        const containerName = `cloudspace-${workspace.id}`

        const container = await createContainer(
          containerName,
          imageName,
          workspace.cpu,
          workspace.ram,
          workspace.disk
        )

        if (container) {
          // Store containerId in DB
          await db.workspace.update({
            where: { id: workspace.id },
            data: {
              containerId: container.id,
              status: 'stopped', // Created but not yet started
            },
          })

          console.log(`[Workspace] Container ${container.id.slice(0, 12)} created for workspace ${workspace.id}`)
        } else {
          // Docker create failed — mark error but keep DB record
          await db.workspace.update({
            where: { id: workspace.id },
            data: { status: 'error' },
          })
          console.warn(`[Workspace] Docker container creation failed for workspace ${workspace.id}`)
        }
      } catch (dockerError) {
        const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
        console.error(`[Workspace] Docker error during workspace creation:`, msg)

        // Update status to error but keep the record
        await db.workspace.update({
          where: { id: workspace.id },
          data: { status: 'error' },
        })
      }
    } else {
      // Docker not available — simulate success for dev environment
      console.warn(`[Workspace] Docker not available, creating workspace in simulation mode`)
      // Simulate container ready after a brief delay conceptually
      await db.workspace.update({
        where: { id: workspace.id },
        data: { status: 'stopped' },
      })
    }

    // Return the updated workspace
    const updatedWorkspace = await db.workspace.findUnique({ where: { id: workspace.id } })
    return successResponse(updatedWorkspace, 201)
  } catch (error) {
    console.error('Create workspace error:', error)
    return errorResponse('Failed to create workspace', 500)
  }
}
