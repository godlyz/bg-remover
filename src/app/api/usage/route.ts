import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { DB } = (globalThis as any).cloudflare?.env || {}

    let plan = 'free'
    let used = 0
    let total = 3
    let credits = 0

    if (DB && DB.prepare) {
      const user = await DB.prepare(
        "SELECT plan, cloud_used_lifetime, credits FROM users WHERE id = ?"
      ).bind(userId).first()

      if (user) {
        plan = user.plan as string
        credits = user.credits as number || 0

        // 检查积分过期
        const expiry = user.credits_expiry as string | null
        if (credits > 0 && expiry && new Date(expiry) < new Date()) {
          credits = 0
        }

        // 先到期先用
        if (credits > 0) {
          used = 0
          total = credits
        } else if (plan !== 'free') {
          const month = new Date().toISOString().slice(0, 7)
          const row = await DB.prepare(
            "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
          ).bind(userId, month).first()
          used = row ? (row.cloud_used as number) : 0
          total = plan === 'pro' ? 60 : plan === 'starter' ? 25 : 0
        } else {
          used = user.cloud_used_lifetime as number
          total = 3
        }
      }
    }

    return NextResponse.json({ used, total, plan, credits })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
