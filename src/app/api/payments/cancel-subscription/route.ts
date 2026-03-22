import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', message: '请先登录' }, { status: 401 })
    }

    const db = getDB()
    await db.run(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
      [userId]
    )
    await db.run(
      "UPDATE users SET plan = 'free', updated_at = datetime('now') WHERE id = ?",
      [userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'internal_error', message: '服务异常' }, { status: 500 })
  }
}
