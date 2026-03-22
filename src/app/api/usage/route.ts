import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

/**
 * 已登录用户用量查询
 * GET /api/usage
 * 返回: { used, total, plan, lifetimeUsed }
 */
export async function GET(request: NextRequest) {
  const { DB } = (globalThis as any).cloudflare?.env || {}

  const authSession = request.headers.get('x-auth-session')
  if (!authSession) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const session = JSON.parse(authSession)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    if (!DB || !DB.prepare) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 })
    }

    const user = await DB.prepare(
      "SELECT plan, cloud_used_lifetime FROM users WHERE id = ?"
    ).bind(userId).first()

    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }

    const plan = user.plan as string
    const lifetimeUsed = user.cloud_used_lifetime as number

    const month = new Date().toISOString().slice(0, 7)
    const usageRow = await DB.prepare(
      "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
    ).bind(userId, month).first()

    const monthlyUsed = usageRow ? (usageRow.cloud_used as number) : 0
    const total = getMaxUsage(plan)

    return NextResponse.json({
      used: plan === 'free' ? lifetimeUsed : monthlyUsed,
      total,
      plan,
      lifetimeUsed,
      month,
    })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

function getMaxUsage(plan: string): number {
  switch (plan) {
    case 'free': return 3
    case 'starter': return 30
    case 'pro': return 100
    case 'business': return 300
    default: return 0
  }
}
