import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { paginatedResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where: { userId: authUser.userId },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({
        where: { userId: authUser.userId },
      }),
    ])

    return paginatedResponse(invoices, total, limit, offset)
  } catch (error) {
    console.error('Fetch invoices error:', error)
    return errorResponse('Failed to fetch invoices', 500)
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { amount, plan } = await request.json()

    if (!amount || amount < 0) {
      return errorResponse('Invalid invoice amount')
    }

    const invoice = await db.invoice.create({
      data: {
        userId: authUser.userId,
        amount: parseFloat(amount),
        plan: plan || 'free',
        status: 'paid',
      },
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    console.error('Create invoice error:', error)
    return errorResponse('Failed to create invoice', 500)
  }
}
