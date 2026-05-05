import { getAuthUser } from '@/lib/auth'
import { unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * Check if the current user is an admin.
 * Admin is determined by matching email against ADMIN_EMAIL env var.
 */
export async function requireAdmin(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return { admin: null, response: unauthorizedResponse() }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || authUser.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { admin: null, response: forbiddenResponse('Admin access required') }
  }

  return { admin: authUser, response: null }
}

/**
 * Check if an email belongs to the admin.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return false
  return email.toLowerCase() === adminEmail.toLowerCase()
}
