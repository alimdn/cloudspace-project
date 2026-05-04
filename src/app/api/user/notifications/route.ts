import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

// Notification settings are stored in-memory for now
// In production, these would be stored in a database table
const userNotifications = new Map<string, {
  email: boolean
  workspace: boolean
  billing: boolean
  marketing: boolean
}>()

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const settings = userNotifications.get(authUser.userId) || {
      email: true,
      workspace: true,
      billing: true,
      marketing: false,
    }

    return successResponse(settings)
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

    const settings = {
      email: typeof email === 'boolean' ? email : true,
      workspace: typeof workspace === 'boolean' ? workspace : true,
      billing: typeof billing === 'boolean' ? billing : true,
      marketing: typeof marketing === 'boolean' ? marketing : false,
    }

    userNotifications.set(authUser.userId, settings)

    return successResponse(settings)
  } catch (error) {
    console.error('Save notifications error:', error)
    return errorResponse('Failed to save notification settings', 500)
  }
}
