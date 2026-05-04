import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      orderBy: { date: 'desc' },
      take: 20,
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Fetch invoices error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, amount, plan } = await request.json()

    // Use demo user if no userId
    let targetUserId = userId
    if (!targetUserId) {
      const demoUser = await db.user.findFirst()
      targetUserId = demoUser?.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 400 })
    }

    const invoice = await db.invoice.create({
      data: {
        userId: targetUserId,
        amount: amount || 0,
        plan: plan || 'free',
        status: 'paid',
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
