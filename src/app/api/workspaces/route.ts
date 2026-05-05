import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createWorkspaceSchema } from '@/lib/validators'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'
import { createContainer, OS_IMAGE_MAP, isDockerAvailable } from '@/lib/docker'
import { getPlanLimits, validateSingleWorkspaceResources, validateAggregateResources } from '@/lib/plan-limits'

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
    const plan = authUser.plan || 'free'
    const limits = getPlanLimits(plan)

    // ── Check 1: Workspace count limit ──
    const currentCount = await db.workspace.count({
      where: { userId: authUser.userId },
    })

    if (currentCount >= limits.maxWorkspaces) {
      return errorResponse(
        `Workspace limit reached for your plan (${limits.maxWorkspaces}). Please upgrade to create more.`,
        403
      )
    }

    // ── Check 2: Per-workspace resource size limits ──
    const cpuNum = parseFloat(cpu || '1')
    const ramNum = parseInt(ram || '1024', 10)
    const diskNum = parseInt(disk || '10', 10)

    const singleValidation = validateSingleWorkspaceResources(plan, cpuNum, ramNum, diskNum)
    if (singleValidation) {
      return errorResponse(singleValidation, 403)
    }

    // ── Check 3: Aggregate total resource limits ──
    const existingWorkspaces = await db.workspace.findMany({
      where: { userId: authUser.userId },
      select: { cpu: true, ram: true, disk: true },
    })

    const existingTotalCpu = existingWorkspaces.reduce((sum, ws) => sum + parseFloat(ws.cpu || '0'), 0)
    const existingTotalRam = existingWorkspaces.reduce((sum, ws) => sum + parseInt(ws.ram || '0', 10), 0)
    const existingTotalDisk = existingWorkspaces.reduce((sum, ws) => sum + parseInt(ws.disk || '0', 10), 0)

    const aggregateValidation = validateAggregateResources(
      plan, existingTotalCpu, existingTotalRam, existingTotalDisk, cpuNum, ramNum, diskNum
    )
    if (aggregateValidation) {
      return errorResponse(aggregateValidation, 403)
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
          workspace.disk,
          limits.maxPids
        )

        if (container) {
          // Store containerId in DB
          await db.workspace.update({
            where: { id: workspace.id },
            data: {
              containerId: container.id,
              status: 'stopped',
            },
          })

          console.log(`[Workspace] Container ${container.id.slice(0, 12)} created for workspace ${workspace.id}`)
        } else {
          await db.workspace.update({
            where: { id: workspace.id },
            data: { status: 'error' },
          })
          console.warn(`[Workspace] Docker container creation failed for workspace ${workspace.id}`)
        }
      } catch (dockerError) {
        const msg = dockerError instanceof Error ? dockerError.message : String(dockerError)
        console.error(`[Workspace] Docker error during workspace creation:`, msg)

        await db.workspace.update({
          where: { id: workspace.id },
          data: { status: 'error' },
        })
      }
    } else {
      console.warn(`[Workspace] Docker not available, workspace created in simulation mode`)
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
