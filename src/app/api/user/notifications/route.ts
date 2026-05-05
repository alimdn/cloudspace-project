import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { db } = await import('@/lib/db')
    let settings = await db.userNotification.findUnique({
      where: { userId: authUser.userId },
    })

    if (!settings) {
      // Create default settings for new user
      settings = await db.userNotification.create({
        data: { userId: authUser.userId },
      })
    }

    return successResponse({
      email: settings.email,
      workspace: settings.workspace,
      billing: settings.billing,
      marketing: settings.marketing,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return errorResponse('Failed to fetch notification settings', 500)
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { email, workspace, billing, marketing } = body

    const { db } = await import('@/lib/db')
    const settings = await db.userNotification.upsert({
      where: { userId: authUser.userId },
      create: {
        userId: authUser.userId,
        email: typeof email === 'boolean' ? email : true,
        workspace: typeof workspace === 'boolean' ? workspace : true,
        billing: typeof billing === 'boolean' ? billing : true,
        marketing: typeof marketing === 'boolean' ? marketing : false,
      },
      update: {
        ...(typeof email === 'boolean' ? { email } : {}),
        ...(typeof workspace === 'boolean' ? { workspace } : {}),
        ...(typeof billing === 'boolean' ? { billing } : {}),
        ...(typeof marketing === 'boolean' ? { marketing } : {}),
      },
    })

    return successResponse({
      email: settings.email,
      workspace: settings.workspace,
      billing: settings.billing,
      marketing: settings.marketing,
    })
  } catch (error) {
    console.error('Save notifications error:', error)
    return errorResponse('Failed to save notification settings', 500)
  }
}
