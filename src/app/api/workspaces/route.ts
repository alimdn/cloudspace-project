import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

// Simple auth helper - in production use proper session/JWT
function getUserId(headersList: Headers): string | null {
  // For demo, accept userId from custom header
  return headersList.get('x-user-id')
}

export async function GET(request: Request) {
  try {
    // Return all workspaces for demo (filter by user in production)
    const workspaces = await db.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Fetch workspaces error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, platform, cpu, ram, disk } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المساحة' }, { status: 400 })
    }

    // Use a demo user ID (first user or create one)
    let demoUser = await db.user.findFirst()
    if (!demoUser) {
      demoUser = await db.user.create({
        data: {
          name: 'مستخدم تجريبي',
          email: `demo-${Date.now()}@example.com`,
          password: await import('bcryptjs').then(b => b.default.hash('demo123', 10)),
          plan: 'free',
        },
      })
    }

    const workspace = await db.workspace.create({
      data: {
        userId: demoUser.id,
        name,
        platform: platform || 'general',
        cpu: cpu || '1',
        ram: ram || '1024',
        disk: disk || '10',
        status: 'creating',
        url: null,
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Create workspace error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المساحة' }, { status: 500 })
  }
}
