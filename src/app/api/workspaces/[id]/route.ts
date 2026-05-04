import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workspace = await db.workspace.findUnique({ where: { id } })
    if (!workspace) {
      return NextResponse.json({ error: 'مساحة العمل غير موجودة' }, { status: 404 })
    }

    await db.workspace.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workspace error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف المساحة' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const workspace = await db.workspace.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Update workspace error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث المساحة' }, { status: 500 })
  }
}
